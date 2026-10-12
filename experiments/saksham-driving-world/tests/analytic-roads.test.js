import { describe, expect, test } from 'bun:test'
import { analyticRoadSettings, analyticRoadTextures, buildAnalyticRoads, simplifyRoadPoints } from '../src/javascript/World/AnalyticRoads.js'
import { roads, landscapeBounds } from '../src/javascript/World/LandscapeLayout.js'
import { roadPaintPlan } from '../src/javascript/World/RoadMarkings.js'

const plan = roadPaintPlan(), index = buildAnalyticRoads(plan)
function distance(point, segment) {
    const { a, b } = segment, dx = b.x - a.x, dy = b.y - a.y
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)))
    return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy)
}
function cellAt(point) {
    const x = Math.floor((point.x - landscapeBounds.minX) / analyticRoadSettings.cellSize)
    const y = Math.floor((point.y - landscapeBounds.minY) / analyticRoadSettings.cellSize)
    return index.cells[y * index.columns + x]
}

describe('resolution independent road rendering', () => {
    test('straight stretches reduce to endpoints while bends retain their authored shape', () => {
        expect(simplifyRoadPoints([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 20 }])).toHaveLength(2)
        for (const road of roads.filter(road => !road.center)) {
            const segments = index.segments.filter(s => s.road === road.name && s.type === 0)
            expect(segments.length).toBeGreaterThan(0)
            for (const point of road.samples) {
                expect(Math.min(...segments.map(s => distance(point, s)))).toBeLessThanOrEqual(analyticRoadSettings.tolerance + .000001)
            }
            expect(segments.every(s => s.halfWidth === road.width / 2)).toBe(true)
        }
        // Keep the already approved mathematically circular hub shader.
        expect(index.segments.some(s => s.road === 'Hub roundabout')).toBe(false)
    })

    test('local cell lookup contains every road and paint segment across cell boundaries', () => {
        const offsets = [-.65, -.001, 0, .001, .65]
        for (const segment of index.segments) for (const t of [0, .5, 1]) {
            const point = { x: segment.a.x + t * (segment.b.x - segment.a.x), y: segment.a.y + t * (segment.b.y - segment.a.y) }
            for (const offset of offsets) {
                const nearby = { x: point.x + offset, y: point.y - offset }
                const candidates = cellAt(nearby).map(i => index.segments[i])
                expect(candidates.includes(segment)).toBe(true)
            }
        }
    })

    test('normal streets, racing kerbs and checker squares all use analytic paint', () => {
        expect(index.segments.some(s => s.type === 2 && s.road === 'Courtyard 4')).toBe(true)
        for (const stroke of [...plan.white, ...plan.terracotta].filter(s => s.road !== 'Hub roundabout')) {
            const type = plan.terracotta.includes(stroke) ? 2 : 1
            const candidates = index.segments.filter(s => s.type === type && s.road === stroke.road && s.halfWidth === stroke.width / 2)
            for (const point of stroke.points) {
                expect(Math.min(...candidates.map(s => distance(point, s)))).toBeLessThanOrEqual(analyticRoadSettings.tolerance + .000001)
            }
        }
        const arrivalDash = index.segments.find(s => s.road === 'Arrival' && s.type === 1 && s.halfWidth === .075)
        expect(arrivalDash.startButt).toBe(true)
        expect(arrivalDash.endButt).toBe(true)
    })

    test('index has a fixed fragment budget, exact packed references and a small upload', () => {
        expect(index.peak).toBeLessThanOrEqual(analyticRoadSettings.maxSegments)
        for (let i = 0; i < index.cells.length; i++) {
            const offset = index.headers[i * 4], count = index.headers[i * 4 + 1]
            expect(index.references.slice(offset, offset + count)).toEqual(index.cells[i])
        }
        const textures = Object.values(analyticRoadTextures(index)).map(u => u.value).filter(v => v.isTexture)
        expect(textures.reduce((sum, texture) => sum + texture.image.data.byteLength, 0)).toBeLessThan(400_000)
        expect(textures.every(texture => !texture.generateMipmaps)).toBe(true)
        textures.forEach(texture => texture.dispose())
    })
})
