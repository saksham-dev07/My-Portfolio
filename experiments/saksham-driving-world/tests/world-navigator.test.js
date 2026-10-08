import { describe, expect, test } from 'bun:test'
import { locationAt, mapHeading, mapPoint } from '../src/javascript/WorldNavigator.js'

describe('world navigation coordinates', () => {
    test('maps the world without flipping east and west, with north at the top', () => {
        expect(mapPoint({ x: -76, y: 32 })).toEqual({ x: 0, y: 0 })
        expect(mapPoint({ x: 180, y: -148 })).toEqual({ x: 256, y: 180 })
    })

    test('car heading agrees with the map after clockwise and anticlockwise turns', () => {
        const half = Math.sqrt(.5)
        expect(mapHeading({ x: 0, y: 0, z: 0, w: 1 })).toBeCloseTo(0)
        expect(mapHeading({ x: 0, y: 0, z: -half, w: half })).toBeCloseTo(90)
        expect(mapHeading({ x: 0, y: 0, z: half, w: half })).toBeCloseTo(-90)
    })
})

describe('location guidance', () => {
    const stops = [
        { name: 'Skills Garage', x: -24, y: -94 },
        { name: 'About Saksham', x: 2, y: -84 },
        { name: 'Project One', x: 60, y: -32.5 },
    ]

    test('identifies the nearest stop only in its arrival area', () => {
        expect(locationAt({ x: -24, y: -94 }, stops)).toBe('Skills Garage')
        expect(locationAt({ x: 60, y: -38 }, stops)).toBe('Project One')
        expect(locationAt({ x: 90, y: -38 }, stops)).toBe('Research promenade')
    })

    test('keeps free driving grounded in named roads and districts', () => {
        expect(locationAt({ x: 0, y: 0 }, stops)).toBe('The starting line')
        expect(locationAt({ x: -38, y: -34 }, stops)).toBe('The playground')
        expect(locationAt({ x: -66, y: -100 }, stops)).toBe('Ridge road')
        expect(locationAt({ x: 30, y: -124 }, stops)).toBe('Campus circuit')
        expect(locationAt({ x: 0, y: -55 }, stops)).toBe('Information garden')
    })
})
