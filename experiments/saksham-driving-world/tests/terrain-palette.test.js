import { expect, test } from 'bun:test'
import { terrainBlendWeights, terrainPalette } from '../src/javascript/World/TerrainPalette.js'

test('level destinations remain green and high or exposed slopes become brown', () => {
    expect(terrainBlendWeights(0, 1)).toEqual({foothill:0, rock:0, crest:0, meadow:1})
    expect(terrainBlendWeights(12, 1).rock).toBe(1)
    expect(terrainBlendWeights(12, 1).meadow).toBe(0)
    expect(terrainBlendWeights(0, .5).rock).toBeGreaterThan(.8)
    const channels = hex => hex.match(/[a-f\d]{2}/gi).map(value => Number.parseInt(value, 16))
    for(const hex of [terrainPalette.valley, terrainPalette.foothill, ...terrainPalette.terraces]) {
        const [red, green, blue] = channels(hex)
        expect(green).toBeGreaterThan(red)
        expect(green).toBeGreaterThan(blue)
    }
    for(const hex of [terrainPalette.stone, terrainPalette.crest]) {
        const [red, green, blue] = channels(hex)
        expect(red).toBeGreaterThan(green)
        expect(green).toBeGreaterThan(blue)
    }
})

test('rock exposure increases smoothly with elevation and steepness, limiting meadow paint', () => {
    for(const normalZ of [1, .95, .8, .5]) {
        let previous = -1
        for(let height = -2; height <= 20; height += .1) {
            const weights = terrainBlendWeights(height, normalZ)
            expect(weights.rock).toBeGreaterThanOrEqual(previous-1e-10)
            expect(weights.rock-previous).toBeLessThan(previous < 0 ? 2 : .021)
            expect(weights.meadow+weights.rock).toBeCloseTo(1, 10)
            for(const value of Object.values(weights)) {
                expect(value).toBeGreaterThanOrEqual(0)
                expect(value).toBeLessThanOrEqual(1)
            }
            previous = weights.rock
        }
    }
    for(const height of [0, 4, 7, 11]) {
        let previous = -1
        for(let normalZ = 1; normalZ >= 0; normalZ -= .01) {
            const weights = terrainBlendWeights(height, normalZ)
            expect(weights.rock).toBeGreaterThanOrEqual(previous-1e-10)
            previous = weights.rock
        }
    }
})
