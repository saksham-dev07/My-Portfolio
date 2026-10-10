import { expect, test } from 'bun:test'
import CANNON from 'cannon'
import Camera from '../src/javascript/Camera.js'
import EventEmitter from '../src/javascript/Utils/EventEmitter.js'

class Surface extends EventTarget {
    style = {}
    clientWidth = 1280
    clientHeight = 720
    ownerDocument = new EventTarget()
    classList = { add() {}, remove() {} }
    captures = new Set()
    getRootNode() { return this.ownerDocument }
    setPointerCapture(id) { this.captures.add(id) }
    hasPointerCapture(id) { return this.captures.has(id) }
    releasePointerCapture(id) { this.captures.delete(id) }
}

function harness() {
    const oldWindow = globalThis.window, oldDocument = globalThis.document
    globalThis.window = new EventTarget()
    globalThis.window.matchMedia = () => ({ matches: false })
    globalThis.document = new EventTarget()
    const canvas = new Surface()
    const time = new EventEmitter()
    time.delta = 1000 / 60
    const controls = { actions: { up: false, down: false, brake: false } }
    const sizes = new EventEmitter()
    sizes.viewport = { width: 1280, height: 720 }
    const camera = new Camera({ time, sizes, renderer: { domElement: canvas }, config: {}, controls })
    const body = new CANNON.Body({ mass: 40, linearDamping: 0 })
    const simulation = new CANNON.World()
    simulation.addBody(body)
    camera.carBody = body
    camera.pan.enable()
    const frame = () => {
        simulation.step(1 / 60)
        camera.target.copy(body.position)
        time.trigger('tick')
        time.trigger('render')
        camera.instance.updateMatrixWorld(true)
    }
    const settle = () => { for (let n = 0; n < 120; n++) frame() }
    const event = (type, x, y, button = 0) => {
        const e = new Event(type, { cancelable: true })
        Object.assign(e, { clientX: x, clientY: y, pageX: x, pageY: y, button, pointerId: 1, pointerType: 'mouse', isPrimary: true })
        canvas.dispatchEvent(e)
        globalThis.window.dispatchEvent(e)
    }
    const drag = (button = 0) => {
        event('pointerdown', 800, 350, button)
        event('mousedown', 800, 350, button)
        for (let x = 820; x <= 1000; x += 20) {
            event('pointermove', x, 350, button)
            event('mousemove', x, 350, button)
            frame()
        }
        event('pointerup', 1000, 350, button)
        event('mouseup', 1000, 350, button)
        settle()
    }
    frame()
    return { camera, body, controls, drag, settle, event, frame, click() {
        event('pointerdown', 800, 350)
        event('pointerup', 800, 350)
        settle()
    }, cleanup() {
        camera.orbitControls.dispose()
        globalThis.window = oldWindow
        globalThis.document = oldDocument
    } }
}

test('left-drag pans the parked map without rotating and can recenter explicitly', () => {
    const h = harness()
    try {
        const before = h.camera.instance.quaternion.clone()
        h.drag()
        expect(h.camera.instance.quaternion.angleTo(before)).toBeLessThan(.001)
        const heldPosition = h.camera.instance.position.clone()
        const heldRotation = h.camera.instance.quaternion.clone()
        h.settle()
        expect(h.camera.instance.position.distanceTo(heldPosition)).toBeLessThan(.001)
        expect(h.camera.instance.quaternion.angleTo(heldRotation)).toBeLessThan(.001)
        h.camera.focusCar()
        h.settle()
        expect(h.camera.instance.position.distanceTo(heldPosition)).toBeGreaterThan(2)
    } finally { h.cleanup() }
})

test('top-view drags accumulate and hold without recentering on the car', () => {
    const h = harness()
    try {
        h.camera.setView('top')
        h.settle()
        const initial = h.camera.instance.position.clone()
        h.drag()
        const first = h.camera.instance.position.distanceTo(initial)
        h.drag()
        expect(h.camera.instance.position.distanceTo(initial)).toBeGreaterThan(first * 1.8)
        const held = h.camera.instance.position.clone()
        h.body.velocity.set(4, 0, 0)
        h.settle()
        expect(h.camera.instance.position.distanceTo(held)).toBeLessThan(.001)
    } finally { h.cleanup() }
})

test('a click preserves follow while repeated left drags pan freely', () => {
    const h = harness()
    try {
        h.click()
        expect(h.camera.following).toBe(true)
        const initial = h.camera.orbitControls.target.clone()
        h.drag()
        const first = h.camera.orbitControls.target.distanceTo(initial)
        expect(first).toBeGreaterThan(2)
        h.drag()
        expect(h.camera.orbitControls.target.distanceTo(initial)).toBeGreaterThan(first * 1.8)
        expect(h.camera.following).toBe(false)
    } finally { h.cleanup() }
})

test('Original view follows a moving car and allows exploration again after stopping', () => {
    const h = harness()
    try {
        h.drag()
        expect(h.camera.following).toBe(false)
        h.body.velocity.set(6, 0, 0)
        h.settle()
        expect(h.camera.following).toBe(true)
        expect(h.camera.orbitControls.target.distanceTo(h.camera.target)).toBeLessThan(1)
        // Coasting still counts as driving after the accelerator is released.
        h.body.velocity.set(.7, 0, 0)
        h.settle()
        expect(h.camera.driving).toBe(true)
        expect(h.camera.orbitControls.enabled).toBe(true)
        h.body.velocity.set(0, 0, 0)
        h.settle()
        h.drag()
        expect(h.camera.following).toBe(false)
        const held = h.camera.instance.position.clone()
        // Suspension/solver drift should not pull a parked camera back.
        h.body.velocity.set(.02, 0, .2)
        h.settle()
        expect(h.camera.instance.position.distanceTo(held)).toBeLessThan(.001)
        h.body.velocity.set(-3, 0, 0)
        h.settle()
        expect(h.camera.following).toBe(true)
        expect(h.camera.orbitControls.target.distanceTo(h.camera.target)).toBeLessThan(1)
    } finally { h.cleanup() }
})

test('a creeping car releases follow and solver jitter cannot recapture a panned map', () => {
    const h = harness()
    try {
        h.body.velocity.set(4, 0, 0)
        h.settle()
        expect(h.camera.driving).toBe(true)
        // The car never reaches exact zero: its suspension and planar creep
        // continue while the visitor explores the map.
        h.body.velocity.set(.24, .08, .6)
        h.settle()
        expect(h.camera.driving).toBe(false)
        h.drag()
        expect(h.camera.following).toBe(false)
        const held = h.camera.instance.position.clone()
        for(let frame = 0; frame < 180; frame++) {
            h.body.velocity.set([.28, .36, .29, .41, .27, .38][frame % 6], 0, frame % 2 ? .5 : -.5)
            h.frame()
            expect(h.camera.driving).toBe(false)
        }
        expect(h.camera.instance.position.distanceTo(held)).toBeLessThan(.001)
        // Deliberate motion without input still includes downhill/coasting.
        h.body.velocity.set(.8, 0, 0)
        h.settle()
        expect(h.camera.driving).toBe(true)
        expect(h.camera.following).toBe(true)
    } finally { h.cleanup() }
})

test('a drag claims a newly parked camera without waiting for the stop timer', () => {
    const h = harness()
    try {
        h.body.velocity.set(5, 0, 0)
        h.settle()
        // Pointer down occurs before another render can classify the stop.
        h.body.velocity.set(.21, .05, .8)
        h.event('pointerdown', 800, 350)
        expect(h.camera.driving).toBe(false)
        h.event('pointermove', 950, 350)
        h.frame()
        h.event('pointerup', 950, 350)
        h.settle()
        expect(h.camera.following).toBe(false)
        const held = h.camera.instance.position.clone()
        h.settle()
        expect(h.camera.instance.position.distanceTo(held)).toBeLessThan(.001)
    } finally { h.cleanup() }
})

test('stopping during a drag keeps exploration on release instead of returning to the car', () => {
    const h = harness()
    try {
        h.body.velocity.set(5, 0, 0)
        h.settle()
        h.event('pointerdown', 800, 350)
        h.event('pointermove', 950, 350)
        h.frame()
        // No render between the velocity change and pointer up.
        h.body.velocity.set(.22, .08, .7)
        h.event('pointerup', 950, 350)
        h.settle()
        expect(h.camera.driving).toBe(false)
        expect(h.camera.following).toBe(false)
    } finally { h.cleanup() }
})

test('forward and reverse intent resume follow immediately while brakes preserve parked exploration', () => {
    const h = harness()
    try {
        h.drag()
        h.controls.actions.up = true
        h.frame()
        expect(h.camera.driving).toBe(true)
        expect(h.camera.following).toBe(true)
        // Brake plus accelerator must not classify a parked car as driving.
        h.controls.actions.brake = true
        h.settle()
        h.drag()
        expect(h.camera.driving).toBe(false)
        expect(h.camera.following).toBe(false)
        h.controls.actions.brake = false
        h.controls.actions.up = false
        h.controls.actions.down = true
        h.frame()
        expect(h.camera.driving).toBe(true)
        expect(h.camera.following).toBe(true)
        h.camera.car = { chassis: { body: h.body }, brakeLocked: true }
        h.settle()
        h.drag()
        expect(h.camera.driving).toBe(false)
        expect(h.camera.following).toBe(false)
        h.camera.car.brakeLocked = false
        h.frame()
        expect(h.camera.driving).toBe(true)
        expect(h.camera.following).toBe(true)
    } finally { h.cleanup() }
})

test('mouse exploration remains available while moving and follows again on release', () => {
    const h = harness()
    try {
        h.body.velocity.set(6, 0, 0)
        h.settle()
        const angle = h.camera.instance.quaternion.clone()
        h.event('pointerdown', 800, 350)
        h.event('pointermove', 950, 350)
        h.frame()
        expect(h.camera.following).toBe(false)
        expect(h.camera.instance.quaternion.angleTo(angle)).toBeLessThan(.001)
        h.event('pointerup', 950, 350)
        h.settle()
        expect(h.camera.following).toBe(true)
        expect(h.camera.orbitControls.target.distanceTo(h.camera.target)).toBeLessThan(1)
    } finally { h.cleanup() }
})
