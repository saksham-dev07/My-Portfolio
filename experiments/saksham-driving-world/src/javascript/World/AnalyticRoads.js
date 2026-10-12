import * as THREE from 'three'
import { landscapeBounds, roads, roadShoulder } from './LandscapeLayout.js'

// Road and paint distances are evaluated in metres, not atlas pixels. A small
// spatial index limits each terrain fragment to nearby segments; grass doesn't
// scan the whole road network. No extra surfaces, physics or frame-time uploads.
export const analyticRoadSettings = Object.freeze({ cellSize: 2, tolerance: .012, padding: 1, maxSegments: 64 })

function pointDistance(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)))
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}

export function simplifyRoadPoints(points, tolerance = analyticRoadSettings.tolerance) {
    if (points.length < 3) return points
    let furthest = -1, distance = tolerance
    for (let i = 1; i < points.length - 1; i++) {
        const error = pointDistance(points[i], points[0], points.at(-1))
        if (error > distance) { distance = error; furthest = i }
    }
    if (furthest < 0) return [points[0], points.at(-1)]
    return [...simplifyRoadPoints(points.slice(0, furthest + 1), tolerance).slice(0, -1), ...simplifyRoadPoints(points.slice(furthest), tolerance)]
}

export function buildAnalyticRoads(plan, network = roads) {
    const segments = []
    const add = (points, width, type, road) => {
        const simplified = simplifyRoadPoints(points)
        for (let i = 1; i < simplified.length; i++) {
            const a = simplified[i - 1], b = simplified[i]
            if (Math.hypot(b.x - a.x, b.y - a.y) < .00001) continue
            segments.push({ a, b, halfWidth: width / 2, type, road,
                startButt: type !== 0 && i === 1, endButt: type !== 0 && i === simplified.length - 1 })
        }
    }
    for (const road of network) if (!road.center) add(road.samples, road.width, 0, road.name)
    for (const stroke of plan.white) if (stroke.road !== 'Hub roundabout') add(stroke.points, stroke.width, 1, stroke.road)
    for (const stroke of plan.terracotta) add(stroke.points, stroke.width, 2, stroke.road)
    const { minX, maxX, minY, maxY } = landscapeBounds
    const { cellSize, padding, maxSegments } = analyticRoadSettings
    const columns = Math.ceil((maxX - minX) / cellSize), rows = Math.ceil((maxY - minY) / cellSize)
    const cells = Array.from({ length: columns * rows }, () => [])
    const clampX = x => Math.max(0, Math.min(columns - 1, Math.floor((x - minX) / cellSize)))
    const clampY = y => Math.max(0, Math.min(rows - 1, Math.floor((y - minY) / cellSize)))
    segments.forEach((segment, index) => {
        const { a, b, halfWidth, type } = segment
        const radius = halfWidth + padding + (type === 0 ? roadShoulder : 0)
        for (let y = clampY(Math.min(a.y, b.y) - radius); y <= clampY(Math.max(a.y, b.y) + radius); y++) {
            for (let x = clampX(Math.min(a.x, b.x) - radius); x <= clampX(Math.max(a.x, b.x) + radius); x++) {
                // Reject distant cells along diagonal bounding boxes.
                const center = { x: minX + (x + .5) * cellSize, y: minY + (y + .5) * cellSize }
                if (pointDistance(center, a, b) <= radius + cellSize * Math.SQRT1_2) cells[y * columns + x].push(index)
            }
        }
    })
    const peak = Math.max(...cells.map(cell => cell.length))
    if (peak > maxSegments) throw new Error(`Analytic road index needs ${peak} segments per cell (budget ${maxSegments})`)
    const headers = new Float32Array(cells.length * 4), references = []
    cells.forEach((cell, i) => { headers[i * 4] = references.length; headers[i * 4 + 1] = cell.length; references.push(...cell) })
    const data = new Float32Array(segments.length * 8)
    segments.forEach((s, i) => data.set([s.a.x, s.a.y, s.b.x, s.b.y, s.halfWidth, s.type, Number(s.startButt), Number(s.endButt)], i * 8))
    return { segments, cells, columns, rows, headers, references, data, peak }
}

function floatTexture(data, width, height) {
    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType)
    texture.minFilter = texture.magFilter = THREE.NearestFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
    return texture
}

export function analyticRoadTextures(index) {
    const width = 256
    const referenceHeight = Math.max(1, Math.ceil(index.references.length / (width * 4)))
    const references = new Float32Array(width * referenceHeight * 4)
    references.set(index.references)
    const segmentHeight = Math.max(1, Math.ceil(index.data.length / (width * 4)))
    const segments = new Float32Array(width * segmentHeight * 4)
    segments.set(index.data)
    return {
        roadCells: { value: floatTexture(index.headers, index.columns, index.rows) },
        roadReferences: { value: floatTexture(references, width, referenceHeight) },
        roadSegments: { value: floatTexture(segments, width, segmentHeight) },
        roadReferenceSize: { value: new THREE.Vector2(width, referenceHeight) },
        roadSegmentSize: { value: new THREE.Vector2(width, segmentHeight) },
    }
}

export const analyticRoadShader = `
uniform sampler2D roadCells;
uniform sampler2D roadReferences;
uniform sampler2D roadSegments;
uniform vec2 roadReferenceSize;
uniform vec2 roadSegmentSize;
vec4 roadTexel(sampler2D source, vec2 size, float index) {
    return texture2D(source, (vec2(mod(index, size.x), floor(index / size.x)) + .5) / size);
}
vec4 analyticRoadCoverage(vec2 point, float aa) {
    vec2 cell = floor((point - vec2(${landscapeBounds.minX}.0, ${landscapeBounds.minY}.0)) / ${analyticRoadSettings.cellSize}.0);
    vec4 header = texture2D(roadCells, (cell + .5) / vec2(${(landscapeBounds.maxX - landscapeBounds.minX) / analyticRoadSettings.cellSize}.0, ${(landscapeBounds.maxY - landscapeBounds.minY) / analyticRoadSettings.cellSize}.0));
    vec3 distanceToSurface = vec3(10000.0);
    for (int i = 0; i < ${analyticRoadSettings.maxSegments}; i++) {
        if (float(i) >= header.y) break;
        float address = header.x + float(i);
        vec4 packed = roadTexel(roadReferences, roadReferenceSize, floor(address / 4.0));
        float channel = mod(address, 4.0);
        float index = channel < .5 ? packed.x : (channel < 1.5 ? packed.y : (channel < 2.5 ? packed.z : packed.w));
        vec4 endpoints = roadTexel(roadSegments, roadSegmentSize, index * 2.0);
        vec4 style = roadTexel(roadSegments, roadSegmentSize, index * 2.0 + 1.0);
        vec2 direction = endpoints.zw - endpoints.xy;
        float segmentLength = length(direction);
        vec2 relative = point - endpoints.xy;
        float along = dot(relative, direction / segmentLength);
        float distance = length(relative - direction * clamp(along / segmentLength, 0.0, 1.0)) - style.x;
        // Round internal joins, square ends on lane dashes, grid and kerbs.
        if (style.z > .5) distance = max(distance, -along);
        if (style.w > .5) distance = max(distance, along - segmentLength);
        if (style.y < .5) distanceToSurface.x = min(distanceToSurface.x, distance);
        else if (style.y < 1.5) distanceToSurface.y = min(distanceToSurface.y, distance);
        else distanceToSurface.z = min(distanceToSurface.z, distance);
    }
    float asphalt = 1.0 - smoothstep(-aa, aa, distanceToSurface.x);
    float shoulder = 1.0 - smoothstep(-aa, aa, distanceToSurface.x - ${roadShoulder});
    vec2 paint = (1.0 - smoothstep(vec2(-aa), vec2(aa), distanceToSurface.yz)) * asphalt;
    return vec4(shoulder, asphalt, paint);
}
`
