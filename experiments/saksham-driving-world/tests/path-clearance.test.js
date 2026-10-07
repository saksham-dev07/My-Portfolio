import { test, expect } from 'bun:test'
import { tileIsClear, routeClearances } from '../src/javascript/World/Tiles.js'

test('route markers protect reset pads, Information copy and project titles', () => {
    for (const rect of routeClearances) {
        expect(tileIsClear({ x: rect.x, y: rect.y }, routeClearances)).toBe(false)
        expect(tileIsClear({ x: rect.x + rect.w / 2 + .9, y: rect.y }, routeClearances)).toBe(false)
    }
    expect(tileIsClear({ x: -8, y: -65 }, routeClearances)).toBe(true)
    expect(tileIsClear({ x: 10, y: -65 }, routeClearances)).toBe(true)
    expect(tileIsClear({ x: 30, y: -41 }, routeClearances)).toBe(true)
})
