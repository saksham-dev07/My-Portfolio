import { test, expect } from 'bun:test'
import { readFileSync, existsSync } from 'node:fs'
import { roadPaintPlan, packRoadMask } from '../src/javascript/World/RoadMarkings.js'
import { roads, distanceToRoad, landscapeBounds } from '../src/javascript/World/LandscapeLayout.js'
import { educationStops } from '../src/javascript/World/Sections/ProfilePaths.js'
import { profileSections } from '../src/javascript/sakshamProfile.js'
import { profileForecourts } from '../src/javascript/World/Sections/ProfileForecourts.js'
import { introLayout } from '../src/javascript/World/Sections/IntroLayout.js'
import { rallyStart, rallyGates } from '../src/javascript/World/Activities/CampusRally.js'
import { activityPropPlacements } from '../src/javascript/World/ActivityProps.js'

const plan = roadPaintPlan()
const strokes = [...plan.white, ...plan.terracotta]
const interactionPads = [
    ...profileSections.map(section => profileForecourts[section.id].entry),
    ...educationStops.map(stop => ({ x: stop.x + stop.padOffsetX, y: stop.y, w: 3, h: 3 })),
    { x: 30, y: -115, w: 6, h: 3 }, { x: -58, y: -60, w: 4, h: 4 },
    { x: -24.5, y: -30, w: 4.4, h: 4.4 },
]

test('all authored roads receive bounded paint that follows their actual paved centreline', () => {
    expect(new Set(strokes.map(stroke => stroke.road)).size).toBe(roads.length)
    for (const road of roads) {
        expect(strokes.some(stroke => stroke.road === road.name && stroke.kind === 'edge')).toBe(true)
        if (road.name !== 'Courtyard 4') expect(strokes.some(stroke => stroke.road === road.name && stroke.kind === 'centre')).toBe(true)
        const overflow = []
        for (const stroke of strokes.filter(stroke => stroke.road === road.name)) for (const point of stroke.points) {
            if (distanceToRoad(road, point.x, point.y) + stroke.width / 2 >= road.width / 2 + .04
                || point.x <= landscapeBounds.minX || point.x >= landscapeBounds.maxX
                || point.y <= landscapeBounds.minY || point.y >= landscapeBounds.maxY) overflow.push(point)
        }
        expect(overflow).toEqual([])
    }
    const arrival = roads.find(road => road.name === 'Arrival')
    expect(arrival.samples[0].y).toBe(introLayout.departure.fromY)
})

test('street dashes and edges leave junction mouths open and all interaction pads legible', () => {
    const blocked = []
    for (const stroke of strokes) {
        const owner = roads.find(road => road.name === stroke.road)
        for (const point of stroke.points) {
            if (stroke.kind === 'centre' || stroke.kind === 'edge') for (const other of roads) {
                if (other === owner) continue
                if (distanceToRoad(other, point.x, point.y) < other.width / 2 + (stroke.kind === 'centre' ? .65 : .1) - .001) blocked.push({ road: owner.name, junction: other.name, point })
            }
            for (const rect of interactionPads) {
                if (Math.abs(point.x - rect.x) < rect.w / 2 && Math.abs(point.y - rect.y) < rect.h / 2) blocked.push({ road: owner.name, pad: rect, point })
            }
        }
    }
    expect(blocked).toEqual([])
})

test('the Campus Rally has four corner kerb sequences, a checker and staggered starting grid', () => {
    const rally = roads.find(road => road.name === 'Courtyard 4')
    expect(plan.terracotta.length).toBeGreaterThan(20)
    expect(plan.terracotta.every(stroke => stroke.road === rally.name && stroke.kind === 'kerb')).toBe(true)
    for (const [x, y] of rally.points.slice(1, -1)) {
        expect(plan.terracotta.some(stroke => stroke.points.some(point => Math.hypot(point.x - x, point.y - y) < 5))).toBe(true)
    }
    expect(plan.white.filter(stroke => stroke.kind === 'checker')).toHaveLength(8)
    expect(plan.white.filter(stroke => stroke.kind === 'grid')).toHaveLength(2)
    expect(plan.labels.map(label => label.text)).toEqual(['01', '02'])
    expect(plan.white.some(stroke => stroke.road === rally.name && stroke.kind === 'centre')).toBe(false)
})

test('the shifted rally arch, game gate, checker and starting grid share one start location', () => {
    const arch = activityPropPlacements.find(prop => prop.id === 'campus-checkpoint')
    expect({ x: arch.x, y: arch.y }).toEqual(rallyStart)
    expect({ x: rallyGates[0].x, y: rallyGates[0].y }).toEqual(rallyStart)
    const checker = plan.white.filter(stroke => stroke.kind === 'checker').flatMap(stroke => stroke.points)
    expect(Math.min(...checker.map(point => point.x))).toBeCloseTo(rallyStart.x - .35)
    expect(Math.max(...checker.map(point => point.x))).toBeCloseTo(rallyStart.x + .35)
    for (const label of plan.labels) {
        expect(label.x).toBeLessThan(rallyStart.x)
        expect(rallyStart.x - label.x).toBeLessThan(7)
        expect(Math.abs(label.y - rallyStart.y)).toBeLessThan(1)
    }
})

test('mask packing clips both paint colours and flips rows without alpha premultiplication', () => {
    const surface = new Uint8Array([255, 255, 200, 255, 60, 0, 255, 255, 170, 100, 180, 255, 0, 0, 0, 255])
    const kerbs = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 190, 0, 0, 0, 255])
    expect([...packRoadMask(surface, kerbs, 2, 2)]).toEqual([170, 100, 100, 100, 0, 0, 0, 0, 255, 255, 200, 0, 60, 0, 0, 0])
})

test('the shipping runtime has no raised road tile factory, tile GLB loads or new paint colliders', () => {
    const source = path => readFileSync(new URL(`../src/javascript/${path}`, import.meta.url), 'utf8')
    expect(source('Resources.js')).not.toMatch(/models\/tiles|tiles[A-E](Base|Collision)/)
    expect(source('World/index.js')).not.toMatch(/setTiles|new Tiles|this\.tiles/)
    expect(source('World/Sections/ProfileDistrict.js')).not.toMatch(/tileSource|profilePathMarkers/)
    expect(source('World/RoadMarkings.js')).not.toMatch(/addObjectFromThree|new THREE\.Mesh|addBody/)
    expect(existsSync(new URL('../static/models/tiles', import.meta.url))).toBe(false)
})
