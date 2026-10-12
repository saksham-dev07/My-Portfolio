import { expect, test } from 'bun:test'
import * as THREE from 'three'
import WorldLife, { vehicleEffectState, lifeLimits } from '../src/javascript/World/WorldLife.js'
import EventEmitter from '../src/javascript/Utils/EventEmitter.js'

function harness() {
    const preference = new EventTarget(); preference.matches = false
    const container = new THREE.Group(), time = new EventEmitter(), page = { hidden: false }
    const body = { position: new THREE.Vector3(0, -15, 1), velocity: new THREE.Vector3(0, -5, 0), quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2) }
    const wheelInfos = Array.from({ length: 4 }, (_, i) => ({ isInContact: true, raycastResult: { hitPointWorld: new THREE.Vector3(i % 2 ? .65 : -.65, -15, 0) } }))
    const physics = { car: { chassis: { body }, vehicle: { wheelInfos } } }, controls = { actions: { brake: true } }
    const screens = [{ uniforms: { uScreenTime: { value: 0 }, uScreenMotion: { value: 0 } } }]
    const camera = { view: 'orbit' }
    const life = new WorldLife({ container, time, camera, physics, controls, screens, window: { matchMedia: () => preference }, document: page })
    return { life, body, physics, controls, wheelInfos, preference, page, screens, container, time, camera }
}

test('driving effects distinguish asphalt braking, grassy motion, parked cars and airborne wheels', () => {
    const body = { velocity: new THREE.Vector3(5, 0, 0), quaternion: new THREE.Quaternion() }
    expect(vehicleEffectState(body, { brake: true }, true, true)).toEqual({ skid: true, dust: false })
    expect(vehicleEffectState(body, { brake: false }, true, true)).toEqual({ skid: false, dust: false })
    expect(vehicleEffectState(body, { brake: true }, true, false)).toEqual({ skid: false, dust: true })
    expect(vehicleEffectState(body, { brake: true }, false, false)).toEqual({ skid: false, dust: false })
    body.velocity.set(0, 0, 0)
    expect(vehicleEffectState(body, { brake: true }, true, true)).toEqual({ skid: false, dust: false })
    body.velocity.set(2, 4, 0)
    expect(vehicleEffectState(body, {}, true, true).skid).toBe(true)
})

test('skid marks use real contact points, never bridge teleports, and stay in a fixed pool', () => {
    const h = harness()
    try {
        for(let i = 0; i < 200; i++) {
            const y = -15 - i % 9 * .15
            h.body.position.y = y
            h.wheelInfos.forEach(wheel => { wheel.raycastResult.hitPointWorld.y = y })
            h.life.update(.1)
        }
        expect(h.life.skidCount).toBe(lifeLimits.skidSegments)
        expect(h.life.skids.count).toBe(lifeLimits.skidSegments)
        const count = h.life.skidCount, index = h.life.skidIndex
        h.body.position.set(80, -15, 1)
        h.wheelInfos.forEach(wheel => { wheel.raycastResult.hitPointWorld.x += 80 })
        h.life.update(.1)
        expect(h.life.skidCount).toBe(count)
        expect(h.life.skidIndex).toBe(index)
        expect(h.life.lastContacts).toEqual([null, null])
        h.body.velocity.set(0, 0, 0)
        h.life.update(lifeLimits.skidSeconds + 1)
        expect(h.life.skids.visible).toBe(false)
    } finally { h.life.dispose() }
})

test('dust expires, atmospheric motion respects reduced motion/hidden tabs, and cleanup stops updates', () => {
    const h = harness()
    try {
        h.body.position.set(24, -55, 1)
        h.wheelInfos.forEach(wheel => { wheel.raycastResult.hitPointWorld.set(24, -55, 0) })
        for(let i = 0; i < 80; i++) h.life.update(.1)
        expect(h.life.dust.visible).toBe(true)
        expect(h.life.dustState).toHaveLength(lifeLimits.dustParticles)
        expect(h.life.skidCount).toBe(0)
        h.body.velocity.set(0, 0, 0)
        h.life.update(lifeLimits.dustSeconds + .1)
        expect(h.life.dust.visible).toBe(false)
        const before = h.life.clock.value
        h.page.hidden = true; h.life.update(1)
        expect(h.life.clock.value).toBe(before)
        h.page.hidden = false
        h.preference.matches = true; h.preference.dispatchEvent(new Event('change'))
        h.life.update(1)
        expect(h.life.clock.value).toBe(before)
        expect(h.screens[0].uniforms.uScreenMotion.value).toBe(0)
        h.camera.view = 'top'; h.life.update(1)
        expect(h.life.clouds.visible).toBe(false)
        expect(h.life.birds.visible).toBe(false)
        h.life.dispose()
        expect(h.container.children).toHaveLength(0)
        h.time.delta = 1000; h.time.trigger('tick')
        expect(h.life.clock.value).toBe(before)
    } finally { if(!h.life.disposed) h.life.dispose() }
})

test('ambient phase and screen refresh match across frame rates without new textures', () => {
    const snapshots = []
    for(const rate of [30, 60, 120]) {
        const h = harness()
        try {
            h.body.velocity.set(0, 0, 0)
            for(let i = 0; i < rate; i++) h.life.update(1 / rate)
            snapshots.push(Array.from(h.life.clouds.instanceMatrix.array))
            expect(h.screens[0].uniforms.uScreenTime.value).toBeCloseTo(1, 6)
            expect(h.life.container.children).toHaveLength(4)
            h.life.container.traverse(mesh => { if(mesh.material) expect(mesh.material.map).toBeFalsy() })
        } finally { h.life.dispose() }
    }
    for(let i = 0; i < snapshots[0].length; i++) expect(snapshots[0][i]).toBeCloseTo(snapshots[2][i], 5)
})
