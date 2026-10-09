import { expect, test } from 'bun:test'
import CANNON from 'cannon'
import CampusRally, { RallyProgress, rallyRoute, rallyGates, gateCrossing, formatRallyTime, resetRallyVehicle, rallyBestKey } from '../src/javascript/World/Activities/CampusRally.js'
import ProfileCircuit from '../src/javascript/World/Sections/ProfileCircuit.js'
import * as THREE from 'three'
import { roads, distanceToRoad } from '../src/javascript/World/LandscapeLayout.js'

const headingBetween = (a, b) => {
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    return { x: (b.x - a.x) / length, y: (b.y - a.y) / length }
}
const startRunning = state => {
    state.start()
    for (let i = 0; i < 180; i++) state.sample({ ...rallyGates[0], z: .35 }, { x: 1, y: 0 }, 1000 / 60)
    // Floating-point subtraction may leave a fraction of a millisecond.
    if (state.phase === 'countdown') state.sample(rallyGates[0], { x: 1, y: 0 }, 1)
}

function finishLap(state, visit = () => {}) {
    let previous = rallyRoute[0]
    for (const point of rallyRoute.slice(1)) {
        state.sample({ ...point, z: .35 }, headingBetween(previous, point), 1000 / 60)
        visit(state, point)
        previous = point
    }
}

test('the validation corridor follows the actual painted courtyard road and all four gates', () => {
    const road = roads.find(road => road.name === 'Courtyard 4')
    expect(road).toBeDefined()
    for (const point of rallyRoute) expect(distanceToRoad(road, point.x, point.y)).toBeLessThan(.05)
    for (const gate of rallyGates) expect(distanceToRoad(road, gate.x, gate.y)).toBeLessThan(.01)
})

test('countdown begins already inside START and the existing clockwise road finishes all gates', () => {
    const state = new RallyProgress()
    state.start()
    expect(state.phase).toBe('countdown')
    expect(state.elapsedMs).toBe(0)
    state.sample(rallyGates[0], { x: 1, y: 0 }, 1000, true)
    expect(state.countdownMs).toBe(3000)
    startRunning(state)
    expect(state.phase).toBe('running')
    expect(state.next).toBe(1)
    const accepted = []
    let next = state.next
    finishLap(state, state => { if (state.next !== next) { accepted.push(state.next); next = state.next } })
    expect(accepted).toEqual([2, 3, 4, 5])
    expect(state.completed).toBe(true)
    expect(state.phase).toBe('result')
    expect(state.elapsedMs).toBeGreaterThan(5000)
})

test('swept gate checks direction, lateral bounds and car heading', () => {
    const gate = rallyGates[1]
    const before = { x: 40, y: -111.6 }, after = { x: 40, y: -112.7 }
    expect(gateCrossing(before, after, { x: 0, y: -1 }, gate)).toBeCloseTo(.4 / 1.1)
    expect(gateCrossing(after, before, { x: 0, y: 1 }, gate)).toBeNull()
    expect(gateCrossing(before, after, { x: 0, y: 1 }, gate)).toBeNull()
    expect(gateCrossing({ ...before, x: 44 }, { ...after, x: 44 }, { x: 0, y: -1 }, gate)).toBeNull()
})

test('teleports, off-road shortcuts and missing route legs cannot record a lap', () => {
    const teleport = new RallyProgress(); startRunning(teleport)
    teleport.sample({ x: 40, y: -112.5 }, { x: 0, y: -1 }, 1000 / 60)
    expect(teleport.phase).toBe('result'); expect(teleport.completed).toBe(false)

    const shortcut = new RallyProgress(); startRunning(shortcut)
    for (let i = 1; i <= 15; i++) shortcut.sample({ x: 2, y: -98.5 - i * .5 }, { x: 0, y: -1 }, 1000 / 60)
    for (let i = 0; i < 50; i++) shortcut.sample({ x: 2, y: -106 }, { x: 0, y: -1 }, 1000 / 60)
    expect(shortcut.phase).toBe('result'); expect(shortcut.completed).toBe(false)

    const reverse = new RallyProgress(); startRunning(reverse)
    let previous = rallyRoute[0]
    // Going backwards stays on the road but cannot progress gate 01.
    for (const point of rallyRoute.slice(0, -1).reverse()) {
        if (Math.hypot(point.x - previous.x, point.y - previous.y) < .0001) continue
        reverse.sample(point, headingBetween(previous, point), 1000 / 60); previous = point
    }
    expect(reverse.next).toBe(1); expect(reverse.completed).toBe(false)
})

function runtimeFixture(storage) {
    const world = new CANNON.World(), body = new CANNON.Body({ mass: 40 })
    world.gravity.set(0, 0, 0); world.addBody(body)
    const car = {
        chassis: { body }, oldPosition: new CANNON.Vec3(), worldForward: new CANNON.Vec3(), brakeLocked: false,
        vehicle: { wheelInfos: [], applyEngineForce() {}, setSteeringValue() {}, setBrake() {}, updateWheelTransform() {} },
        upsideDown: { state: 'watching' },
    }
    const page = { hidden: false, dialog: false, querySelector: () => page.dialog ? {} : null }
    const host = new EventTarget(); host.clearTimeout = () => {}; host.localStorage = storage
    const controls = { releaseCount: 0, releaseActions() { this.releaseCount++ } }
    const physics = { car, world, controls }, events = []
    host.addEventListener('drive-activity-update', event => events.push(event.detail))
    const game = new CampusRally({ physics, window: host, document: page })
    const countdown = () => { for (let i = 0; i < 181; i++) world.step(1 / 60) }
    const driveRoute = () => {
        let previous = rallyRoute[0]
        for (const point of rallyRoute.slice(1)) {
            const heading = headingBetween(previous, point)
            body.position.set(point.x, point.y, .35)
            body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.atan2(heading.y, heading.x))
            world.step(1 / 60); previous = point
        }
    }
    return { game, physics, car, world, body, page, host, events, countdown, driveRoute }
}

test('Cannon-backed runtime pauses on hidden/dialog/map braking, saves best and bounds retries/listeners', () => {
    const saved = new Map(), storage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) }
    const f = runtimeFixture(storage), { game, page, world, car, body } = f
    try {
        game.start()
        for (const mode of ['hidden', 'dialog', 'brake']) {
            page.hidden = mode === 'hidden'; page.dialog = mode === 'dialog'; car.brakeLocked = mode === 'brake'
            for (let i = 0; i < 30; i++) world.step(1 / 60)
            expect(game.state.countdownMs).toBe(3000)
        }
        page.hidden = false; page.dialog = false; car.brakeLocked = false
        f.countdown(); expect(game.snapshot().phase).toBe('running')
        const elapsed = game.snapshot().timerMs
        page.dialog = true
        body.velocity.set(10, 0, 0)
        for (let i = 0; i < 60; i++) world.step(1 / 60)
        expect(game.snapshot().timerMs).toBe(elapsed); expect(body.position.x).toBeCloseTo(2)
        page.dialog = false
        f.driveRoute()
        expect(game.snapshot().phase).toBe('result'); expect(game.snapshot().completed).toBe(true)
        expect(saved.get(rallyBestKey)).toBe(String(game.bestMs))
        expect(game.snapshot().message).toContain('personal best')
        const eventCount = f.events.length
        for (let i = 0; i < 120; i++) world.step(1 / 60)
        expect(f.events.length).toBe(eventCount)
        const listenerCount = world._listeners.postStep.length
        for (let i = 0; i < 10; i++) { game.handleAction('retry'); game.stop() }
        expect(world.bodies).toHaveLength(1); expect(world._listeners.postStep.length).toBe(listenerCount)
        game.start(); f.countdown()
        car.chassis.body = new CANNON.Body({ mass: 40 })
        world.step(1 / 60)
        expect(game.snapshot().phase).toBe('result'); expect(game.snapshot().message).toContain('reset')
    } finally { game.destroy() }
    expect(world._listeners.postStep).toHaveLength(0); expect(world._listeners.preStep).toHaveLength(0)
})

test('retry synchronizes chassis and wheels, clears force/velocity and uses correct +X heading', () => {
    const f = runtimeFixture(null), { car, body, game } = f
    try {
        body.position.set(20, -110, 7); body.velocity.set(9, 2, 3); body.angularVelocity.set(1, 2, 3)
        body.force.set(2, 3, 4); body.torque.set(3, 2, 1); body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), 2)
        car.steering = .7; car.accelerating = 100; car.speed = 3
        const wheel = new CANNON.Body({ mass: 1 })
        car.wheels = { bodies: [wheel] }
        car.vehicle.wheelInfos = [{ worldTransform: { position: new CANNON.Vec3(2.6, -98.1, .6), quaternion: new CANNON.Quaternion() } }]
        resetRallyVehicle(car)
        expect(body.position.x).toBe(2); expect(body.position.y).toBe(-98.5)
        for (const field of ['previousPosition', 'interpolatedPosition', 'initPosition']) expect(body[field].almostEquals(body.position)).toBe(true)
        for (const field of ['previousQuaternion', 'interpolatedQuaternion', 'initQuaternion']) expect(body[field].w).toBe(1)
        for (const field of ['velocity', 'angularVelocity', 'force', 'torque']) expect(body[field].length()).toBe(0)
        expect(wheel.previousPosition.almostEquals(wheel.position)).toBe(true)
        expect(car.vehicle.wheelInfos[0].rotation).toBe(0)
        expect(car.oldPosition.almostEquals(body.position)).toBe(true)
        expect(car.steering).toBe(0); expect(car.speed).toBe(0)
    } finally { game.destroy() }
})

test('blocked or malformed storage never prevents play and updates are limited to 10 Hz between changes', () => {
    const f = runtimeFixture({ getItem() { throw Error('blocked') }, setItem() { throw Error('blocked') } })
    try {
        f.game.start(); f.countdown()
        const before = f.events.length
        for (let i = 0; i < 60; i++) f.world.step(1 / 60)
        expect(f.events.length - before).toBeLessThanOrEqual(10)
        f.driveRoute()
        expect(f.game.snapshot().completed).toBe(true)
        expect(f.game.bestMs).toBeGreaterThan(1000)
        expect(formatRallyTime(65432)).toBe('1:05.43')
    } finally { f.game.destroy() }
    for (const stored of ['NaN', '-10', '0', '999999999']) {
        const malformed = runtimeFixture({ getItem: () => stored })
        expect(malformed.game.bestMs).toBeNull(); malformed.game.destroy()
    }
})

test('the existing circuit button requests the activity manager instead of starting a second race', () => {
    const previous = { document: globalThis.document, window: globalThis.window }
    class Element extends EventTarget {
        getContext() { return { fillRect() {}, fillText() {}, measureText: text => ({ width: text.length * 30 }) } }
    }
    const button = new Element(), status = new Element(), host = new EventTarget()
    globalThis.document = { getElementById: id => id === 'circuit-start' ? button : status, createElement: () => new Element() }
    globalThis.window = host
    let circuit
    try {
        const requested = []
        host.addEventListener('drive-activity-start', event => requested.push(event.detail.id))
        circuit = new ProfileCircuit({ zones: {}, container: new THREE.Group() })
        button.dispatchEvent(new Event('click'))
        expect(requested).toEqual(['rally'])
        expect(circuit.progress.active).toBe(false)
        expect(circuit.id).toBe('rally')
        circuit.destroy()
        button.dispatchEvent(new Event('click')); expect(requested).toHaveLength(1)
    } finally {
        circuit?.destroy(); globalThis.document = previous.document; globalThis.window = previous.window
    }
})
