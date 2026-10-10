import { expect, test } from 'bun:test'
import * as THREE from 'three'
import CANNON from 'cannon'
import EventEmitter from '../src/javascript/Utils/EventEmitter.js'
import BrickWorkshop, { brickHasMoved, rebuildBrick, workshopLayout } from '../src/javascript/World/Sections/BrickWorkshop.js'
import { roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'

function collision(x = 30, y = -105, z = .3, sleep = false) {
    const body = new CANNON.Body({ mass: .5, position: new CANNON.Vec3(x, y, z) })
    // Cannon 0.6 omits this field; the rendering interpolation helper can add it.
    body.previousQuaternion = body.quaternion.clone()
    const origin = { position: body.position.clone(), quaternion: body.quaternion.clone(), sleep }
    let resets = 0
    return { body, origin, get resets() { return resets }, reset() { resets++; body.position.copy(origin.position); body.quaternion.copy(origin.quaternion) } }
}

function fixture() {
    const time = new EventEmitter()
    time.delta = 50
    const writes = []
    const context = { fillRect() {}, fillText: text => writes.push(text) }
    const document = { createElement: () => ({ getContext: () => context }) }
    const items = Array.from({ length: 10 }, (_, index) => ({ collision: collision(30, -106.5 + index % 4, .3 + Math.floor(index / 4) * .45) }))
    const container = new THREE.Group(), solids = []
    const workshop = new BrickWorkshop({ items, container, solids, time, document })
    return { workshop, container, solids, items, time, writes }
}

test('the workshop counts actual displaced bodies, ignoring normal settling and render-only movement', () => {
    const brick = collision()
    brick.body.position.x += .54
    brick.body.position.z -= .05
    expect(brickHasMoved(brick)).toBe(false)
    brick.body.position.y += .2
    expect(brickHasMoved(brick)).toBe(true)
    brick.body.position.copy(brick.origin.position)
    brick.body.position.z -= .36
    expect(brickHasMoved(brick)).toBe(true)
    expect(brickHasMoved({})).toBe(false)
    const f = fixture()
    try {
        expect(f.workshop.snapshot()).toEqual({ moved: 0, total: 10 })
        f.items[0].container = { position: new THREE.Vector3(500, 500, 0) }
        f.workshop.refresh()
        expect(f.workshop.snapshot().moved).toBe(0)
        f.items[1].collision.body.position.x += 2
        f.items[2].collision.body.position.z -= 1
        f.workshop.refresh()
        expect(f.workshop.snapshot()).toEqual({ moved: 2, total: 10 })
        expect(f.writes).toContain('2 / 10 MOVED')
        f.items[1].collision.body.position.copy(f.items[1].collision.origin.position)
        f.workshop.refresh()
        expect(f.workshop.snapshot().moved).toBe(1)
        expect(f.items.every(item => item.collision.body.mass === .5)).toBe(true)
    } finally { f.workshop.dispose() }
})

test('stack feedback samples at ten hertz and only redraws when the count changes', () => {
    const f = fixture()
    try {
        expect(f.workshop.draws).toBe(1)
        f.items[0].collision.body.position.x += 1
        f.time.trigger('afterTick')
        expect(f.workshop.snapshot().moved).toBe(0)
        expect(f.workshop.draws).toBe(1)
        f.time.trigger('afterTick')
        expect(f.workshop.snapshot().moved).toBe(1)
        expect(f.workshop.draws).toBe(2)
        for (let frame = 0; frame < 40; frame++) f.time.trigger('afterTick')
        expect(f.workshop.draws).toBe(2)
        expect(f.workshop.texture.generateMipmaps).toBe(true)
        expect(f.workshop.texture.minFilter).toBe(THREE.LinearMipmapLinearFilter)
    } finally { f.workshop.dispose() }
})

test('rebuild resets all ten existing bricks and removes residual force and interpolation ghosts immediately', () => {
    const f = fixture()
    try {
        const bodies = f.items.map(item => item.collision.body)
        for (const { collision: brick } of f.items) {
            brick.body.position.set(70, -80, 0)
            brick.body.quaternion.setFromEuler(1, 2, 3)
            for (const key of ['velocity', 'angularVelocity', 'force', 'torque']) brick.body[key].set(10, -3, 8)
            brick.body.previousPosition.copy(brick.body.position)
            brick.body.interpolatedPosition.copy(brick.body.position)
            brick.body.previousQuaternion.copy(brick.body.quaternion)
            brick.body.interpolatedQuaternion.copy(brick.body.quaternion)
        }
        f.workshop.refresh()
        expect(f.workshop.snapshot().moved).toBe(10)
        expect(f.workshop.rebuild()).toBe(true)
        expect(f.workshop.snapshot()).toEqual({ moved: 0, total: 10 })
        expect(f.workshop.draws).toBe(3)
        expect(f.items.map(item => item.collision.body)).toEqual(bodies)
        for (const { collision: brick } of f.items) {
            expect(brick.resets).toBe(1)
            for (const key of ['position', 'previousPosition', 'interpolatedPosition']) expect(brick.body[key].almostEquals(brick.origin.position)).toBe(true)
            for (const key of ['quaternion', 'previousQuaternion', 'interpolatedQuaternion']) expect(brick.body[key].toArray()).toEqual(brick.origin.quaternion.toArray())
            for (const key of ['velocity', 'angularVelocity', 'force', 'torque']) expect(brick.body[key].length()).toBe(0)
            expect(brick.body.aabbNeedsUpdate).toBe(true)
            expect(brick.body.sleepState).toBe(CANNON.Body.AWAKE)
        }
        const sleepingBrick = collision(0, 0, .3, true)
        rebuildBrick(sleepingBrick)
        expect(sleepingBrick.body.sleepState).toBe(CANNON.Body.SLEEPING)
    } finally { f.workshop.dispose() }
})

test('the readable two-sided counter leaves roads, rebuild pad and push approach clear', () => {
    const f = fixture()
    try {
        const up = new THREE.Vector3(0, 1, 0), normal = new THREE.Vector3(0, 0, 1)
        for (const [face, direction] of [['front', -1], ['back', 1]]) {
            const mesh = f.container.getObjectByName(`Maker yard / counter ${face}`)
            expect(up.clone().applyQuaternion(mesh.quaternion).z).toBeCloseTo(1, 6)
            expect(normal.clone().applyQuaternion(mesh.quaternion).y).toBeCloseTo(direction, 6)
            expect(mesh.position.y).toBeCloseTo(-102.5 + direction * .17, 6)
        }
        const reset = workshopLayout.rebuild
        for (const solid of f.solids) {
            expect(Math.abs(solid.position.x - reset.x) < solid.scale.x / 2 + reset.halfWidth && Math.abs(solid.position.y - reset.y) < solid.scale.y / 2 + reset.halfDepth).toBe(false)
            for (const x of [-.5, .5]) for (const y of [-.5, .5]) expect(roadEdgeDistance(solid.position.x + solid.scale.x * x, solid.position.y + solid.scale.y * y)).toBeGreaterThan(.45)
            if (solid.position.z - solid.scale.z / 2 > 1.6) continue
            expect(Math.abs(solid.position.x - 30) < solid.scale.x / 2 + .9 && Math.abs(solid.position.y + 110) < solid.scale.y / 2 + 3).toBe(false)
        }
    } finally { f.workshop.dispose() }
})

test('the scoreboard has no overlapping exposed coplanar box faces at its side, top or frame corners', () => {
    const f = fixture()
    try {
        f.container.updateMatrixWorld(true)
        const boxes = f.workshop.container.children.filter(mesh => mesh.geometry?.type === 'BoxGeometry')
            .map(mesh => ({ name: mesh.name, bounds: new THREE.Box3().setFromObject(mesh) }))
        const axisNames = ['x', 'y', 'z']
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i], b = boxes[j]
            for (const axis of axisNames) for (const face of ['min', 'max']) {
                if (Math.abs(a.bounds[face][axis] - b.bounds[face][axis]) > 1e-6) continue
                const area = axisNames.filter(value => value !== axis).reduce((value, other) => value * Math.max(0,
                    Math.min(a.bounds.max[other], b.bounds.max[other]) - Math.max(a.bounds.min[other], b.bounds.min[other])), 1)
                expect({ faces: `${a.name} / ${b.name} / ${axis} ${face}`, overlaps: area > 1e-6 }).toEqual({
                    faces: `${a.name} / ${b.name} / ${axis} ${face}`, overlaps: false,
                })
            }
        }
        const board = f.container.getObjectByName('Maker yard / counter board')
        for (const face of ['front', 'back']) {
            const mesh = f.container.getObjectByName(`Maker yard / counter ${face}`)
            expect(Math.abs(mesh.position.y - board.position.y) - board.geometry.parameters.height / 2).toBeCloseTo(.02, 6)
            expect(mesh.material.depthTest).toBe(true)
        }
        expect(boxes.every(({ name }) => f.container.getObjectByName(name).material.depthWrite)).toBe(true)
    } finally { f.workshop.dispose() }
})

test('workshop teardown removes its listener and releases every owned drawing resource once', () => {
    const f = fixture()
    const resources = [...f.workshop.geometries, ...f.workshop.materials, f.workshop.texture]
    const disposed = resources.map(() => 0)
    resources.forEach((value, index) => value.addEventListener('dispose', () => disposed[index]++))
    f.workshop.dispose()
    f.workshop.dispose()
    expect(disposed.every(count => count === 1)).toBe(true)
    expect(f.container.children).toHaveLength(0)
    f.items[0].collision.body.position.x += 2
    f.time.trigger('afterTick')
    expect(f.workshop.snapshot().moved).toBe(0)
    expect(f.workshop.rebuild()).toBe(false)
    expect(f.items[0].collision.resets).toBe(0)
})
