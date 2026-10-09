// Game rules are independent of Three's scene graph and Cannon's bodies.
export const rallyGates = [
    { x: 2, y: -98.5, angle: 0, label: 'START / FINISH' },
    { x: 40, y: -112, angle: -Math.PI / 2, label: '01' },
    { x: 2, y: -124, angle: Math.PI, label: '02' },
    { x: -26.5, y: -112, angle: Math.PI / 2, label: '03' },
]
export const rallyBestKey = 'saksham-campus-rally-best-v1'
const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y)
const routeVertices = [[2, -98.5], [40, -98.5], [40, -124], [-26.5, -124], [-26.5, -98.5], [2, -98.5]]

// Match the existing courtyard's 3.5 m quadratic corners. A small immutable
// polyline is sufficient for corridor and continuous route-progress checks.
export const rallyRoute = (() => {
    const points = [{ x: 2, y: -98.5, s: 0 }]
    const add = point => {
        const previous = points.at(-1)
        const length = distance(previous, point)
        if (length > .00001) points.push({ ...point, s: previous.s + length })
    }
    const line = target => {
        const from = points.at(-1), count = Math.ceil(distance(from, target) / .6)
        for (let i = 1; i <= count; i++) add({ x: from.x + (target.x - from.x) * i / count, y: from.y + (target.y - from.y) * i / count })
    }
    for (let i = 1; i < routeVertices.length - 1; i++) {
        const [x, y] = routeVertices[i], [ax, ay] = routeVertices[i - 1], [bx, by] = routeVertices[i + 1]
        const beforeLength = Math.hypot(ax - x, ay - y), afterLength = Math.hypot(bx - x, by - y)
        const before = { x: x + (ax - x) / beforeLength * 3.5, y: y + (ay - y) / beforeLength * 3.5 }
        const after = { x: x + (bx - x) / afterLength * 3.5, y: y + (by - y) / afterLength * 3.5 }
        line(before)
        for (let j = 1; j <= 12; j++) {
            const t = j / 12, u = 1 - t
            add({ x: u * u * before.x + 2 * u * t * x + t * t * after.x, y: u * u * before.y + 2 * u * t * y + t * t * after.y })
        }
    }
    line({ x: 2, y: -98.5 })
    return points
})()

export function projectRallyRoute(position) {
    let closest = { distance: Infinity, s: 0 }
    for (let i = 1; i < rallyRoute.length; i++) {
        const a = rallyRoute[i - 1], b = rallyRoute[i], dx = b.x - a.x, dy = b.y - a.y
        const t = Math.max(0, Math.min(1, ((position.x - a.x) * dx + (position.y - a.y) * dy) / (dx * dx + dy * dy)))
        const d = Math.hypot(position.x - a.x - dx * t, position.y - a.y - dy * t)
        if (d < closest.distance) closest = { distance: d, s: a.s + (b.s - a.s) * t }
    }
    return closest
}

export function gateCrossing(from, to, heading, gate) {
    const fx = Math.cos(gate.angle), fy = Math.sin(gate.angle)
    const before = (from.x - gate.x) * fx + (from.y - gate.y) * fy
    const after = (to.x - gate.x) * fx + (to.y - gate.y) * fy
    if (before > .02 || after < 0 || after - before < .001 || heading.x * fx + heading.y * fy < .45) return null
    const t = Math.max(0, Math.min(1, -before / (after - before)))
    const x = from.x + (to.x - from.x) * t, y = from.y + (to.y - from.y) * t
    return Math.abs(-(x - gate.x) * fy + (y - gate.y) * fx) <= 2.6 ? t : null
}

export function formatRallyTime(milliseconds) {
    const hundredths = Math.max(0, Math.floor(milliseconds / 10))
    return `${Math.floor(hundredths / 6000)}:${String(Math.floor(hundredths / 100) % 60).padStart(2, '0')}.${String(hundredths % 100).padStart(2, '0')}`
}

export class RallyProgress {
    constructor() { this.stop() }
    stop() {
        this.phase = 'idle'; this.next = 0; this.elapsedMs = 0; this.countdownMs = 0
        this.previous = null; this.reason = ''; this.paused = false; this.completed = false; this.offCourseMs = 0
    }
    start(position = rallyGates[0]) {
        this.stop()
        this.phase = 'countdown'; this.countdownMs = 3000; this.next = 1
        this.previous = { ...position }; this.routeS = projectRallyRoute(position).s
        this.routeProgress = 0; this.offCourseMs = 0; this.completed = false
    }
    fail(message) { this.phase = 'result'; this.completed = false; this.reason = message }
    sample(position, heading, deltaMs, paused = false) {
        if (this.phase !== 'countdown' && this.phase !== 'running') return
        this.paused = paused
        if (paused) { this.previous = { ...position }; this.routeS = projectRallyRoute(position).s; return }
        if (!Number.isFinite(deltaMs) || deltaMs <= 0) return
        if (this.phase === 'countdown') {
            this.countdownMs = Math.max(0, this.countdownMs - deltaMs)
            this.previous = { ...position }; this.routeS = projectRallyRoute(position).s
            if (this.countdownMs === 0) this.phase = 'running'
            return
        }
        const from = this.previous, moved = distance(from, position)
        this.previous = { ...position }
        // Faster than the car's maximum boost speed, but too short to accept a
        // map teleport, body reset, or an entire gate skipped between samples.
        if (moved > 150 * deltaMs / 1000 + .3) { this.fail('The car moved off the course. Retry from the start line.'); return }
        this.elapsedMs += deltaMs
        const projection = projectRallyRoute(position), length = rallyRoute.at(-1).s
        let advance = projection.s - this.routeS
        if (advance > length / 2) advance -= length
        if (advance < -length / 2) advance += length
        this.routeS = projection.s
        const grounded = position.z == null || (position.z >= -.5 && position.z <= 2.8)
        const onCourse = projection.distance <= 3.6 && grounded
        this.offCourseMs = onCourse ? 0 : this.offCourseMs + deltaMs
        if (this.offCourseMs > 750) { this.fail('Keep the lap on the courtyard road. Retry and follow the arrows.'); return }
        if (!onCourse || Math.abs(advance) > moved * 1.8 + .5) return
        this.routeProgress += advance
        const index = this.next % 4, crossing = gateCrossing(from, position, heading, rallyGates[index])
        const required = this.next === 4 ? length : projectRallyRoute(rallyGates[index]).s
        if (crossing == null || this.routeProgress < required - 3) return
        this.next++
        if (this.next === 5) {
            this.elapsedMs -= deltaMs * (1 - crossing)
            this.phase = 'result'; this.completed = true
        }
    }
}

function readBest(storage) {
    try {
        const value = Number(storage?.getItem(rallyBestKey))
        return Number.isFinite(value) && value >= 1000 && value < 3600000 ? value : null
    } catch { return null }
}

// Reposition the existing vehicle instead of recreating it. Camera and physics
// users keep their stable car owner; all presentation poses are synchronized.
export function resetRallyVehicle(car, x = 2, y = -98.5, z = .85) {
    const body = car.chassis.body
    body.position.set(x, y, z); body.quaternion.set(0, 0, 0, 1)
    for (const field of ['previousPosition', 'interpolatedPosition', 'initPosition']) body[field]?.copy(body.position)
    for (const field of ['previousQuaternion', 'interpolatedQuaternion', 'initQuaternion']) {
        if (body[field]) body[field].copy(body.quaternion)
        else body[field] = body.quaternion.clone()
    }
    for (const field of ['velocity', 'angularVelocity', 'force', 'torque']) body[field]?.set(0, 0, 0)
    car.oldPosition?.copy(body.position)
    car.steering = 0; car.accelerating = 0; car.speed = 0; car.forwardSpeed = 0; car.angle = 0
    car.worldForward?.set(1, 0, 0)
    if (car.upsideDown) car.upsideDown.state = 'watching'
    for (let i = 0; i < (car.vehicle?.wheelInfos.length ?? 0); i++) {
        car.vehicle.wheelInfos[i].rotation = 0; car.vehicle.wheelInfos[i].deltaRotation = 0
        car.vehicle.setSteeringValue(0, i); car.vehicle.applyEngineForce(0, i)
        if (!car.brakeLocked) car.vehicle.setBrake(0, i)
        car.vehicle.updateWheelTransform(i)
        const wheel = car.wheels?.bodies[i], transform = car.vehicle.wheelInfos[i].worldTransform
        if (wheel && transform) {
            wheel.position.copy(transform.position); wheel.quaternion.copy(transform.quaternion)
            if (i === 1 || i === 3) {
                // The existing wheel renderer reverses the right-wheel axle.
                const halfTurn = body.quaternion.clone(); halfTurn.set(0, 0, 1, 0)
                wheel.quaternion = wheel.quaternion.mult(halfTurn)
            }
            for (const field of ['previousPosition', 'interpolatedPosition']) wheel[field]?.copy(wheel.position)
            for (const field of ['previousQuaternion', 'interpolatedQuaternion']) {
                if (wheel[field]) wheel[field].copy(wheel.quaternion)
                else wheel[field] = wheel.quaternion.clone()
            }
        }
    }
    body.aabbNeedsUpdate = true; body.wakeUp?.()
}

export default class CampusRally {
    constructor({ physics, onUpdate = () => {}, window: host = globalThis.window, document: page = globalThis.document, storage }) {
        this.id = 'rally'; this.physics = physics; this.window = host; this.document = page; this.onUpdate = onUpdate
        try { this.storage = storage === undefined ? host?.localStorage : storage } catch { this.storage = null }
        this.bestMs = readBest(this.storage); this.state = new RallyProgress(); this.emitMs = 0; this.lastSignature = ''
        this.heldPose = { x: 0, y: 0, z: 0, quaternion: physics.car.chassis.body.quaternion.clone() }
        this.heading = { x: 1, y: 0 }
        this.beforeStep = () => this.holdVehicle()
        this.afterStep = () => this.step()
        physics.world.addEventListener('preStep', this.beforeStep)
        physics.world.addEventListener('postStep', this.afterStep)
    }
    isPaused() { return Boolean(this.document?.hidden || this.document?.querySelector('dialog[open]') || this.physics.car.brakeLocked) }
    start() {
        this.physics.controls?.releaseActions()
        const car = this.physics.car
        if (car.upsideDown) {
            this.window?.clearTimeout(car.upsideDown.pendingTimeout); this.window?.clearTimeout(car.upsideDown.turningTimeout)
        }
        resetRallyVehicle(car)
        this.body = car.chassis.body
        this.heldPose.x = 2; this.heldPose.y = -98.5; this.heldPose.z = this.body.position.z
        this.heldPose.quaternion.copy(this.body.quaternion)
        this.state.start(this.body.position); this.emitMs = 0; this.newBest = false
        this.publish(true)
        this.window?.dispatchEvent(new CustomEvent('drive-activity-focus', { detail: { id: this.id, x: 2, y: -98.5 } }))
        return true
    }
    stop() { this.state.stop(); this.onUpdate(this.snapshot()) }
    handleAction(action) {
        if (action === 'retry') return this.start()
        if (action === 'stop' || action === 'exit') { this.stop(); return true }
        return false
    }
    holdVehicle() {
        if (this.state.phase !== 'running' && this.state.phase !== 'countdown') return
        const body = this.physics.car.chassis.body
        if (body !== this.body) return
        const hold = this.state.phase === 'countdown' || this.isPaused()
        if (!hold) {
            this.heldPose.x = body.position.x; this.heldPose.y = body.position.y; this.heldPose.z = body.position.z
            this.heldPose.quaternion.copy(body.quaternion)
            return
        }
        this.physics.controls?.releaseActions()
        body.position.x = this.heldPose.x; body.position.y = this.heldPose.y
        body.quaternion.copy(this.heldPose.quaternion)
        body.velocity.x = 0; body.velocity.y = 0; body.angularVelocity.set(0, 0, 0)
        body.force.x = 0; body.force.y = 0; body.torque.set(0, 0, 0)
        for (let i = 0; i < (this.physics.car.vehicle?.wheelInfos.length ?? 0); i++) this.physics.car.vehicle.applyEngineForce(0, i)
    }
    step() {
        if (this.state.phase !== 'running' && this.state.phase !== 'countdown') return
        const body = this.physics.car.chassis.body, previousPhase = this.state.phase
        const deltaMs = Math.min(.05, this.physics.world.dt > 0 ? this.physics.world.dt : 1 / 60) * 1000
        if (body !== this.body) this.state.fail('The car was reset. Retry to start a fresh lap.')
        else {
            const q = body.quaternion
            this.heading.x = 1 - 2 * (q.y * q.y + q.z * q.z)
            this.heading.y = 2 * (q.x * q.y + q.w * q.z)
            this.state.sample(body.position, this.heading, deltaMs, this.isPaused())
        }
        if (previousPhase !== 'result' && this.state.phase === 'result' && this.state.completed) {
            this.newBest = this.bestMs == null || this.state.elapsedMs < this.bestMs
            if (this.newBest) {
                this.bestMs = Math.round(this.state.elapsedMs)
                try { this.storage?.setItem(rallyBestKey, String(this.bestMs)) } catch { /* A blocked store never prevents a completed lap. */ }
            }
        }
        this.emitMs += deltaMs; this.publish()
    }
    snapshot() {
        const state = this.state, next = state.next % 4
        let message = 'A clockwise lap around the campus courtyard.'
        if (state.phase === 'countdown') message = `Ready? ${Math.ceil(state.countdownMs / 1000)}. Follow the highlighted gates clockwise.`
        if (state.phase === 'running') message = state.offCourseMs > 0 ? 'Return to the courtyard road.' : next === 0 ? '3 / 3 gates. Cross START to finish.' : `${state.next - 1} / 3 gates. Next: ${String(next).padStart(2, '0')}.`
        if (state.phase === 'result') message = state.completed ? this.newBest ? 'New personal best. Nice lap!' : 'Lap complete. Find a cleaner racing line on your next run.' : state.reason
        if (state.paused && (state.phase === 'countdown' || state.phase === 'running')) message = 'Rally paused. Return to the world to continue.'
        return {
            id: this.id, title: 'Campus Rally', phase: state.phase, message,
            timerMs: Math.round(state.elapsedMs), countdownMs: state.countdownMs, nextGate: next,
            completed: state.completed, bestMs: this.bestMs,
            scoreText: state.phase === 'result' && !state.completed ? 'Lap not recorded' : this.bestMs == null ? 'First lap sets your best time' : `Best ${formatRallyTime(this.bestMs)}`,
            actions: state.phase === 'result' ? [{ id: 'retry', label: 'Retry rally' }, { id: 'exit', label: 'Explore world' }] : [{ id: 'exit', label: 'Leave rally' }],
        }
    }
    publish(force = false) {
        const detail = this.snapshot()
        const signature = `${detail.phase}/${detail.message}/${detail.nextGate}/${detail.scoreText}`
        if (!force && this.emitMs < 100 && signature === this.lastSignature) return
        this.emitMs = 0; this.lastSignature = signature; this.onUpdate(detail)
        this.window?.dispatchEvent(new CustomEvent('drive-activity-update', { detail }))
    }
    destroy() {
        this.stop()
        this.physics.world.removeEventListener('preStep', this.beforeStep)
        this.physics.world.removeEventListener('postStep', this.afterStep)
    }
}
