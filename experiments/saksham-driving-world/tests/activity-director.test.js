import { expect, test } from 'bun:test'
import ActivityDirector from '../src/javascript/World/Activities/ActivityDirector.js'

test('activity switching stops the old simulation before starting the next, including retries', () => {
    const calls = []
    const games = Object.fromEntries(['bowling', 'rally'].map(id => [id, { id, start: () => calls.push(`${id}:start`), stop: () => calls.push(`${id}:stop`), handleAction: action => calls.push(`${id}:${action}`) }]))
    const director = new ActivityDirector({ resolve: id => games[id] })
    expect(director.action('roll')).toBe(false)
    expect(director.start('bowling')).toBe(true)
    director.action('roll')
    expect(director.start('unknown')).toBe(false)
    expect(director.current).toBe(games.bowling)
    director.start('rally'); director.start('rally'); director.action('quit'); director.stop()
    expect(calls).toEqual(['bowling:start', 'bowling:roll', 'bowling:stop', 'rally:start', 'rally:stop', 'rally:start', 'rally:stop'])
    expect(director.current).toBeNull()
})

test('a failed start releases its partial session and leaves the director usable', () => {
    let stopped = 0
    const game = { id: 'rally', start: () => { throw new Error('unavailable') }, stop: () => stopped++ }
    const director = new ActivityDirector({ resolve: () => game })
    expect(() => director.start('rally')).toThrow('unavailable')
    expect(director.current).toBeNull(); expect(stopped).toBe(1)
})

test('a not-ready game cannot claim the current session', () => {
    let stopped = 0
    const director = new ActivityDirector({ resolve: () => ({ id: 'rally', start: () => false, stop: () => stopped++ }) })
    expect(director.start('rally')).toBe(false)
    expect(director.current).toBeNull(); expect(stopped).toBe(1)
})
