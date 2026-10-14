import { expect, test } from 'bun:test'
import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import Camera, { CAMERA_DISTANCE, CAMERA_HEIGHT, CAMERA_MAX_DRIVING_DISTANCE, CAMERA_MAX_AUTOMATIC_DISTANCE, CAMERA_MAX_AUTOMATIC_HEIGHT } from '../src/javascript/Camera.js'
import EventEmitter from '../src/javascript/Utils/EventEmitter.js'

class Surface extends EventTarget {
    style = {}
    clientWidth = 1280
    clientHeight = 720
    ownerDocument = new EventTarget()
    classList = { add() {}, remove() {}, toggle() {} }
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
        canvas.ownerDocument.dispatchEvent(e)
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

test('left-drag pans the parked map without rotating, holds on release and can recenter explicitly', () => {
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

test('a click preserves follow while repeated drags explore farther across the map', () => {
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

test('near-car scenery cannot collapse the chase camera into the vehicle', () => {
    const h = harness()
    try {
        const scene = new THREE.Scene()
        scene.add(h.camera.container)
        const post = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 5), new THREE.MeshBasicMaterial())
        post.position.set(-1, 0, 2)
        scene.add(post)
        h.camera.updateChaseCamera()
        const p = h.camera.instance.position
        expect(Math.hypot(p.x - h.body.position.x, p.y - h.body.position.y)).toBeGreaterThanOrEqual(3.5)
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
        expect(h.camera.orbitControls.target.x - h.camera.target.x).toBeGreaterThan(1)
        // Coasting still counts as driving after the accelerator is released.
        h.body.velocity.set(.7, 0, 0)
        h.settle()
        expect(h.camera.driving).toBe(true)
        expect(h.camera.orbitControls.enabled).toBe(false)
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
        expect(h.camera.orbitControls.target.x - h.camera.target.x).toBeGreaterThan(3)
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

test('a drag begun while moving is ignored even if the car stops before release', () => {
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
        expect(h.camera.following).toBe(true)
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

test('mouse exploration is ignored while moving', () => {
    const h = harness()
    try {
        h.body.velocity.set(6, 0, 0)
        h.settle()
        const angle = h.camera.instance.quaternion.clone()
        h.event('pointerdown', 800, 350)
        h.event('pointermove', 950, 350)
        h.frame()
        expect(h.camera.following).toBe(true)
        expect(h.camera.orbitControls.enabled).toBe(false)
        expect(h.camera.instance.quaternion.angleTo(angle)).toBeLessThan(.01)
        h.event('pointerup', 950, 350)
        h.settle()
        expect(h.camera.following).toBe(true)
        expect(h.camera.orbitControls.target.x - h.camera.target.x).toBeGreaterThan(1)
    } finally { h.cleanup() }
})

test('chase remains behind the body through turns and reversing', () => {
    const h = harness()
    try {
        h.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 2)
        h.body.velocity.set(0, -3, 0)
        h.settle()
        expect(h.camera.instance.position.y).toBeLessThan(h.body.position.y - CAMERA_DISTANCE + 1)
        expect(h.camera.instance.position.z - h.body.position.z).toBeCloseTo(CAMERA_HEIGHT, 2)
        expect(h.camera.orbitControls.target.y).toBeGreaterThan(h.body.position.y + 3)
    } finally { h.cleanup() }
})

test('position damping gives the same result at 30, 60 and 120 FPS', () => {
    const results = []
    for(const fps of [30, 60, 120]) {
        const h = harness()
        try {
            h.camera.instance.position.set(20, 20, 20)
            for(let n = 0; n < fps; n++) {
                h.camera.time.delta = 1000 / fps
                h.camera.updateChaseCamera()
            }
            results.push(h.camera.instance.position.clone())
        } finally { h.cleanup() }
    }
    expect(results[0].distanceTo(results[1])).toBeLessThan(.00001)
    expect(results[1].distanceTo(results[2])).toBeLessThan(.00001)
})

test('near obstruction eases chase above it without pulling a panned map toward the car', () => {
    const h = harness()
    try {
        const scene = new THREE.Scene()
        scene.add(h.camera.container)
        const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 10), new THREE.MeshBasicMaterial())
        wall.position.set(-4, 0, 3)
        scene.add(wall)
        h.settle()
        expect(h.camera.instance.position.z).toBeGreaterThan(8)
        expect(h.camera.instance.position.x).toBeLessThan(-3.5)
        h.camera.following = false
        h.camera.instance.position.set(-8, 0, 4)
        h.camera.orbitControls.target.copy(h.body.position)
        h.camera.updateChaseCamera()
        expect(h.camera.instance.position.x).toBeCloseTo(-8, 2)
    } finally { h.cleanup() }
})

test('touch map pan preserves angle and pinch zoom remains available', () => {
    const h = harness()
    const pointer = (type, id, x, y) => {
        const event = new Event(type, { cancelable: true })
        Object.assign(event, { pointerId: id, pointerType: 'touch', isPrimary: id === 1,
            clientX: x, clientY: y, pageX: x, pageY: y, button: 0 })
        h.camera.renderer.domElement.dispatchEvent(event)
        h.camera.renderer.domElement.ownerDocument.dispatchEvent(event)
    }
    try {
        const rotation = h.camera.instance.quaternion.clone()
        pointer('pointerdown', 1, 500, 350)
        pointer('pointermove', 1, 700, -400)
        h.frame()
        expect(h.camera.instance.quaternion.angleTo(rotation)).toBeLessThan(.001)
        expect(h.camera.orbitControls.getPolarAngle()).toBeGreaterThanOrEqual(THREE.MathUtils.degToRad(20) - .0001)
        const distance = h.camera.orbitControls.getDistance()
        pointer('pointerdown', 2, 800, 350)
        pointer('pointermove', 2, 1000, 350)
        h.frame()
        expect(h.camera.orbitControls.getDistance()).not.toBeCloseTo(distance, 3)
        expect(h.camera.orbitControls.getDistance()).toBeGreaterThanOrEqual(4)
        pointer('pointerup', 1, 700, -400)
        pointer('pointerup', 2, 1000, 350)
    } finally { h.cleanup() }
})

test('steering intent returns from stopped free-look over .8 seconds and C toggles overview', () => {
    const h = harness()
    try {
        h.drag()
        const held = h.camera.instance.position.clone()
        h.controls.actions.left = true
        h.frame()
        expect(h.camera.following).toBe(true)
        expect(h.camera.instance.position.distanceTo(held)).toBeLessThan(.1)
        h.settle()
        expect(h.camera.instance.position.x).toBeCloseTo(-CAMERA_DISTANCE, 2)
        const event = new Event('keydown')
        Object.assign(event, { code: 'KeyC' })
        window.dispatchEvent(event)
        expect(h.camera.view).toBe('top')
        window.dispatchEvent(event)
        expect(h.camera.view).toBe('orbit')
    } finally { h.cleanup() }
})

test('dense artwork uses cached collision proxies instead of triangle raycasts each frame', () => {
    const h = harness()
    try {
        const scene = new THREE.Scene()
        scene.add(h.camera.container)
        const sculpture = new THREE.Mesh(new THREE.SphereGeometry(2, 160, 80), new THREE.MeshBasicMaterial())
        sculpture.position.set(-5, 0, 3)
        scene.add(sculpture)
        let detailedRaycasts = 0
        const original = sculpture.raycast
        sculpture.raycast = function(...args) { detailedRaycasts++; return original.apply(this, args) }
        for(let frame = 0; frame < 30; frame++) {
            h.camera.instance.position.set(-12, 0, 6)
            h.camera.resolveCameraCollision(h.body.position)
        }
        expect(detailedRaycasts).toBe(0)
        expect(h.camera.instance.position.z).toBeGreaterThan(5)
    } finally { h.cleanup() }
})

test('return from a map view in front of the car travels around its cabin', () => {
    const h = harness()
    try {
        h.camera.following = false
        h.camera.instance.position.set(12, 0, 5)
        h.camera.focusCar()
        h.controls.actions.up = true
        for(let frame = 0; frame < 60; frame++) {
            h.frame()
            const position = h.camera.instance.position
            expect(Math.hypot(position.x - h.body.position.x, position.y - h.body.position.y)).toBeLessThanOrEqual(CAMERA_MAX_AUTOMATIC_DISTANCE + .001)
            expect(Math.hypot(position.x - h.body.position.x, position.y - h.body.position.y)).toBeGreaterThanOrEqual(3.5)
        }
    } finally { h.cleanup() }
})

test('scroll over world HUD still controls camera distance', () => {
    const h = harness()
    try {
        const event = new Event('wheel', { cancelable: true })
        Object.assign(event, { deltaY: 160, deltaMode: 0 })
        h.camera.renderer.domElement.ownerDocument.dispatchEvent(event)
        h.settle()
        expect(h.camera.chaseDistance).toBeGreaterThan(CAMERA_DISTANCE + 1)
        expect(event.defaultPrevented).toBe(true)
    } finally { h.cleanup() }
})

test('nearly stopped drag claims the map and suspension creep does not recapture it', () => {
    const h = harness()
    try {
        h.body.velocity.set(3, 0, 0)
        h.settle()
        h.body.velocity.set(.6, 0, .4)
        h.drag()
        expect(h.camera.following).toBe(false)
        h.body.velocity.set(.7, 0, .3)
        h.settle()
        expect(h.camera.following).toBe(false)
        h.controls.actions.up = true
        h.frame()
        expect(h.camera.following).toBe(true)
    } finally { h.cleanup() }
})

test('wheel zoom persists during chase and across stopped orbit without duplicate OrbitControls zoom', () => {
    const h = harness()
    const wheel = deltaY => {
        const event = new Event('wheel', { cancelable: true })
        Object.assign(event, { deltaY, deltaMode: 0, clientX: 500, clientY: 350 })
        h.camera.renderer.domElement.dispatchEvent(event)
    }
    try {
        h.controls.actions.up = true
        h.frame()
        wheel(200)
        h.settle()
        expect(h.camera.chaseDistance).toBeGreaterThan(CAMERA_DISTANCE)
        const chosen = h.camera.chaseDistance
        h.controls.actions.up = false
        h.drag()
        const before = h.camera.orbitControls.getDistance()
        wheel(-100)
        h.settle()
        expect(h.camera.orbitControls.getDistance()).toBeLessThan(before)
        h.controls.actions.up = true
        h.settle()
        expect(h.camera.chaseDistance).toBeLessThan(chosen)
        expect(h.camera.chaseDistance).toBeCloseTo(h.camera.chaseZoomTarget, 3)
    } finally { h.cleanup() }
})

test('clicking or dragging in first-person view keeps the car-mounted view active', () => {
    const h = harness()
    try {
        h.camera.setView('first')
        h.settle()
        h.body.velocity.set(.6, 0, 0)
        h.click()
        expect(h.camera.view).toBe('first')
        h.drag()
        expect(h.camera.view).toBe('first')
        expect(h.camera.orbitControls.enabled).toBe(false)
    } finally { h.cleanup() }
})

test('wheel in first-person view stays in the car-mounted view without changing chase distance', () => {
    const h = harness()
    try {
        h.camera.setView('first')
        h.settle()
        const event = new Event('wheel', { cancelable: true })
        Object.assign(event, { deltaY: 200, deltaMode: 0 })
        h.camera.renderer.domElement.ownerDocument.dispatchEvent(event)
        h.settle()
        expect(h.camera.view).toBe('first')
        expect(h.camera.chaseDistance).toBeCloseTo(CAMERA_DISTANCE, 3)
        expect(event.defaultPrevented).toBe(true)
    } finally { h.cleanup() }
})

test('scenery corrections are bounded and clear without feeding back into chase damping', () => {
    const h = harness()
    try {
        const scene = new THREE.Scene()
        scene.add(h.camera.container)
        const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 10), new THREE.MeshBasicMaterial())
        wall.position.set(-4, 0, 3)
        scene.add(wall)
        let before = h.camera.instance.position.clone()
        for(let frame = 0; frame < 90; frame++) {
            h.frame()
            expect(h.camera.instance.position.distanceTo(before)).toBeLessThan(.18)
            before.copy(h.camera.instance.position)
        }
        scene.remove(wall)
        for(let frame = 0; frame < 180; frame++) {
            h.frame()
            expect(h.camera.instance.position.distanceTo(before)).toBeLessThan(.18)
            before.copy(h.camera.instance.position)
        }
        expect(h.camera.instance.position.x).toBeCloseTo(-CAMERA_DISTANCE, 2)
        expect(h.camera.instance.position.z).toBeCloseTo(CAMERA_HEIGHT, 2)
    } finally { h.cleanup() }
})

test('parked wheel zoom eases instead of jumping on the wheel event', () => {
    const h = harness()
    try {
        h.drag()
        const before = h.camera.instance.position.clone()
        const event = new Event('wheel', { cancelable: true })
        Object.assign(event, { deltaY: 200, deltaMode: 0 })
        h.camera.renderer.domElement.dispatchEvent(event)
        expect(h.camera.instance.position.distanceTo(before)).toBeLessThan(.001)
        h.settle()
        expect(h.camera.instance.position.distanceTo(before)).toBeGreaterThan(1)
    } finally { h.cleanup() }
})

test('driving zoom and tall scenery stay bounded without restricting parked map zoom', () => {
    const h = harness()
    const wheel = () => {
        const event = new Event('wheel', { cancelable: true })
        Object.assign(event, { deltaY: 200, deltaMode: 0 })
        h.camera.renderer.domElement.dispatchEvent(event)
    }
    try {
        h.controls.actions.up = true
        for(let n = 0; n < 15; n++) wheel()
        h.settle()
        expect(h.camera.chaseDistance).toBeCloseTo(CAMERA_MAX_DRIVING_DISTANCE, 3)
        const scene = new THREE.Scene(), tower = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 80), new THREE.MeshBasicMaterial())
        scene.add(h.camera.container)
        tower.position.set(-3, 0, 39)
        scene.add(tower)
        let previous = h.camera.instance.position.clone()
        for(let frame = 0; frame < 240; frame++) {
            h.frame()
            expect(h.camera.instance.position.distanceTo(h.body.position)).toBeLessThanOrEqual(CAMERA_MAX_AUTOMATIC_DISTANCE + .001)
            expect(h.camera.instance.position.z - h.body.position.z).toBeLessThanOrEqual(CAMERA_MAX_AUTOMATIC_HEIGHT + .001)
            expect(h.camera.instance.position.distanceTo(previous)).toBeLessThan(.18)
            previous.copy(h.camera.instance.position)
        }
        scene.remove(tower)
        h.settle()
        expect(h.camera.chaseZoomTarget).toBe(CAMERA_MAX_DRIVING_DISTANCE)
        h.controls.actions.up = false
        h.drag()
        for(let n = 0; n < 8; n++) wheel()
        h.settle()
        expect(h.camera.orbitControls.getDistance()).toBeGreaterThan(CAMERA_MAX_AUTOMATIC_DISTANCE)
        h.controls.actions.up = true
        h.settle()
        expect(h.camera.following).toBe(true)
        expect(h.camera.instance.position.distanceTo(h.body.position)).toBeLessThanOrEqual(CAMERA_MAX_AUTOMATIC_DISTANCE + .001)
        tower.geometry.dispose(); tower.material.dispose()
    } finally { h.cleanup() }
})
