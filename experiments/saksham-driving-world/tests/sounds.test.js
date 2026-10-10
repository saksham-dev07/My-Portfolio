import { expect, test } from 'bun:test'
import Sounds from '../src/javascript/World/Sounds.js'

function deferredSound() {
    const calls = []
    let state = 'unloaded', playing = false
    return { calls, state: () => state, playing: () => playing,
        load: () => { calls.push('load'); state = 'loading' },
        play: () => calls.push('play'),
        volume: () => calls.push('volume'), rate: () => calls.push('rate'),
        finish: () => { state = 'loaded'; playing = true },
    }
}

test('unmute loads and queues one engine, including while toggled during transfer', () => {
    const sound = deferredSound()
    const audio = { enabled: true, muted: true, engine: { sound } }
    Sounds.prototype.setMuted.call(audio, false)
    expect(audio.muted).toBe(false)
    expect(sound.calls).toEqual(['load', 'play'])
    Sounds.prototype.setMuted.call(audio, true)
    Sounds.prototype.setMuted.call(audio, false)
    expect(sound.calls).toEqual(['load', 'play'])
    sound.finish()
    Sounds.prototype.setMuted.call(audio, false)
    expect(sound.calls).toEqual(['load', 'play'])
})

test('first horn loads before playback and muted or loading effects add no requests', () => {
    const sound = deferredSound()
    const audio = { enabled: true, muted: true, items: [{ name: 'horn', sounds: [sound], minDelta: 0,
        velocityMin: 0, velocityMultiplier: 1, volumeMin: .9, volumeMax: 1,
        rateMin: 1, rateMax: 1, lastTime: 0 }] }
    Sounds.prototype.play.call(audio, 'horn')
    expect(sound.calls).toEqual([])
    audio.muted = false
    Sounds.prototype.play.call(audio, 'horn')
    expect(sound.calls).toEqual(['load', 'volume', 'rate', 'play'])
    Sounds.prototype.play.call(audio, 'horn')
    expect(sound.calls).toEqual(['load', 'volume', 'rate', 'play'])
})

test('default-on audio waits for world entry and respects a prior mute choice', () => {
    const sound = deferredSound()
    const audio = { enabled: false, muted: false, engine: { sound }, setMuted: Sounds.prototype.setMuted }
    audio.setMuted(false)
    expect(sound.calls).toEqual([])
    Sounds.prototype.enable.call(audio)
    expect(sound.calls).toEqual(['load', 'play'])
    const quiet = deferredSound()
    const muted = { enabled: false, muted: true, engine: { sound: quiet }, setMuted: Sounds.prototype.setMuted }
    Sounds.prototype.enable.call(muted)
    expect(quiet.calls).toEqual([])
    expect(muted.muted).toBe(true)
})
