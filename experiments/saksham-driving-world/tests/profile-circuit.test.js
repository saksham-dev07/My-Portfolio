import { test, expect } from 'bun:test'
import { CircuitProgress } from '../src/javascript/World/Sections/ProfileCircuit.js'

test('circuit requires start, all checkpoints in order, and finish; restart clears it', () => {
    const lap = new CircuitProgress()
    expect(lap.enter(0)).toBe(false)
    lap.active = true
    expect(lap.enter(2)).toBe(false)
    expect(lap.enter(0)).toBe(true)
    expect(lap.enter(0)).toBe(false)
    expect(lap.enter(1)).toBe(true)
    expect(lap.enter(3)).toBe(false)
    expect(lap.enter(2)).toBe(true)
    expect(lap.enter(3)).toBe(true)
    expect(lap.complete).toBe(false)
    expect(lap.enter(0)).toBe(true)
    expect(lap.complete).toBe(true)
    expect(lap.enter(1)).toBe(false)
    lap.restart()
    expect(lap.active).toBe(false)
    expect(lap.next).toBe(0)
    expect(lap.complete).toBe(false)
})
