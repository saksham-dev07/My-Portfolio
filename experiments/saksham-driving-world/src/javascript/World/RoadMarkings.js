import { roads, distanceToRoad, landscapeBounds } from './LandscapeLayout.js'

// Paint is data in the terrain's existing mask. It never adds a road mesh,
// raised marker, physics body, or a competing coplanar decal.
export const roadPaintStyle = Object.freeze({
    edgeWidth: .12, centreWidth: .15, dashLength: 1.65, dashGap: 2.15,
    edgeInset: .18, kerbWidth: .28, kerbInset: .24, kerbLength: 1.15,
    white: '#efe8d4', kerb: '#b8593f',
})

function sampler(road) {
    const points = road.samples, distances = [0]
    for (let i = 1; i < points.length; i++) distances.push(distances.at(-1) + points[i].distanceTo(points[i - 1]))
    const length = distances.at(-1)
    const at = (distance, offset = 0) => {
        const s = Math.max(0, Math.min(length, distance))
        let index = 1
        while (index < distances.length - 1 && distances[index] < s) index++
        const a = points[index - 1], b = points[index], span = distances[index] - distances[index - 1]
        const t = span > 0 ? (s - distances[index - 1]) / span : 0
        // Average the neighbouring directions for a continuous offset through
        // a rounded bend; clamped end tangents stay aligned with the avenue.
        const tangentAt = i => {
            const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)]
            const dx = after.x - before.x, dy = after.y - before.y, scale = Math.hypot(dx, dy) || 1
            return { x: dx / scale, y: dy / scale }
        }
        const u = tangentAt(index - 1), v = tangentAt(index)
        const dx = u.x + (v.x - u.x) * t, dy = u.y + (v.y - u.y) * t, scale = Math.hypot(dx, dy) || 1
        return { x: a.x + (b.x - a.x) * t - dy / scale * offset, y: a.y + (b.y - a.y) * t + dx / scale * offset }
    }
    return { at, length }
}

export function roadPaintPlan(network = roads) {
    const white = [], terracotta = [], labels = []
    const bounds = new Map(network.map(road => [road, {
        minX: Math.min(...road.samples.map(p => p.x)) - road.width / 2 - 1,
        maxX: Math.max(...road.samples.map(p => p.x)) + road.width / 2 + 1,
        minY: Math.min(...road.samples.map(p => p.y)) - road.width / 2 - 1,
        maxY: Math.max(...road.samples.map(p => p.y)) + road.width / 2 + 1,
    }]))
    const junction = (road, point, margin) => network.some(other => {
        if (other === road) return false
        const box = bounds.get(other)
        if (point.x < box.minX || point.x > box.maxX || point.y < box.minY || point.y > box.maxY) return false
        return distanceToRoad(other, point.x, point.y) < other.width / 2 + margin
    })
    const add = (target, road, kind, from, to, offset, width, sample, margin = .1) => {
        let points = []
        const flush = () => {
            if (points.length > 1) target.push({ road: road.name, kind, width, points })
            points = []
        }
        const count = Math.ceil((to - from) / .25)
        for (let i = 0; i <= count; i++) {
            const point = sample.at(from + (to - from) * i / Math.max(1, count), offset)
            if (junction(road, point, margin)) flush()
            else points.push(point)
        }
        flush()
    }
    for (const road of network) {
        const sample = sampler(road), rally = road.name === 'Courtyard 4'
        const offset = road.width / 2 - roadPaintStyle.edgeInset
        for (const side of [-1, 1]) add(white, road, 'edge', 0, sample.length, side * offset, roadPaintStyle.edgeWidth, sample)
        // Rally's centre remains a clear racing line. Arrows and numbered gates
        // supply direction; normal streets receive consistent lane dashes.
        if (!rally) for (let s = .8; s < sample.length - .5; s += roadPaintStyle.dashLength + roadPaintStyle.dashGap) {
            add(white, road, 'centre', s, Math.min(s + roadPaintStyle.dashLength, sample.length - .35), 0, roadPaintStyle.centreWidth, sample, .65)
        }
        if (!rally) continue
        // Four deliberately bounded kerb sequences identify the rally corners.
        // Project each authored corner onto the same sampled centreline used
        // by the asphalt, then alternate cream and terracotta along the bend.
        for (const corner of road.points.slice(1, -1)) {
            let closest = { distance: Infinity, s: 0 }
            for (let s = 0; s <= sample.length; s += .2) {
                const p = sample.at(s), distance = Math.hypot(p.x - corner[0], p.y - corner[1])
                if (distance < closest.distance) closest = { distance, s }
            }
            for (const side of [-1, 1]) for (let i = 0; i < 10; i++) {
                const from = Math.max(0, closest.s - 5.75 + i * roadPaintStyle.kerbLength)
                const to = Math.min(sample.length, from + roadPaintStyle.kerbLength - .03)
                add(i % 2 ? terracotta : white, road, 'kerb', from, to, side * (road.width / 2 - roadPaintStyle.kerbInset), roadPaintStyle.kerbWidth, sample)
            }
        }
        // Compact painted starting boxes sit inside the lane behind the line.
        for (const [x, y, number] of [[-1.3, -99.1, '01'], [-4.2, -97.9, '02']]) {
            white.push({ road: road.name, kind: 'grid', width: .12, points: [{ x: x + .75, y: y - .45 }, { x: x - .75, y: y - .45 }, { x: x - .75, y: y + .45 }, { x: x + .75, y: y + .45 }] })
            labels.push({ road: road.name, kind: 'grid-number', x, y, angle: 0, text: number, size: .52 })
        }
        // Two rows of small checker squares, perpendicular to clockwise travel.
        for (let row = 0; row < 2; row++) for (let column = 0; column < 8; column++) {
            if ((row + column) % 2) continue
            const x = 1.65 + row * .35, y = -99.9 + column * .35
            white.push({ road: road.name, kind: 'checker', width: .35, points: [{ x, y: y + .175 }, { x: x + .35, y: y + .175 }] })
        }
    }
    return { white, terracotta, labels }
}

// Two mask channels reuse the already allocated RGBA terrain texture. All
// strokes are clipped against the final asphalt union when channels are packed.
export function paintRoadMarkings(context, width, height, plan = roadPaintPlan()) {
    const { minX, maxX, maxY } = landscapeBounds
    const scale = width / (maxX - minX), px = x => (x - minX) * scale, py = y => (maxY - y) * scale
    const draw = (strokes, includeNumbers) => {
        context.clearRect(0, 0, width, height)
        context.lineCap = 'butt'; context.lineJoin = 'round'
        context.strokeStyle = '#fff'; context.fillStyle = '#fff'; context.setLineDash([])
        for (const stroke of strokes) {
            context.beginPath()
            stroke.points.forEach((p, index) => context[index ? 'lineTo' : 'moveTo'](px(p.x), py(p.y)))
            context.lineWidth = stroke.width * scale; context.stroke()
        }
        if (includeNumbers) for (const label of plan.labels) {
            context.save(); context.translate(px(label.x), py(label.y)); context.rotate(-label.angle)
            context.font = `700 ${label.size * scale}px system-ui, sans-serif`
            context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(label.text, 0, 0); context.restore()
        }
        return context.getImageData(0, 0, width, height).data
    }
    return { white: draw(plan.white, true), terracotta: draw(plan.terracotta, false) }
}

export function packRoadMask(surface, kerbs, width, height) {
    const pixels = new Uint8Array(width * height * 4)
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const from = (y * width + x) * 4, to = ((height - y - 1) * width + x) * 4
        pixels[to] = surface[from]
        pixels[to + 1] = surface[from + 1]
        pixels[to + 2] = Math.min(surface[from + 2], surface[from + 1])
        pixels[to + 3] = Math.min(kerbs[from + 3], surface[from + 1])
    }
    return pixels
}
