import * as THREE from 'three'
import { surfaceHeight } from '../LandscapeLayout.js'
import { groundLayer } from '../GroundLayers.js'
import { resetBowlingBody } from './BowlingGame.js'

export const stuntArenaRules = Object.freeze({
    goalCenter: Object.freeze({ x: -38.17, y: -43.66, z: 2.35 }),
    goalHalfWidth: 2.85,
    goalHeight: 3.9,
    ballTee: Object.freeze({ x: -33.95, y: -43.75, zOffset: 1.66 }),
    rings: Object.freeze([
        { id: 'goal-ring', label: 'GOAL RING', x: -38.17, y: -43.66, z: 2.42, radius: 1.08, points: 100, stanchions: false },
        { id: 'west-ring', label: 'BIG AIR RING', x: -49.0, y: -43.88, z: 2.05, radius: 1.25, points: 125, stanchions: true },
        { id: 'north-ring', label: 'PRACTICE RING', x: -39.5, y: -39.0, z: 1.48, radius: 0.96, points: 75, stanchions: true },
    ]),
    minAirTime: 0.26,
    minJumpDistance: 2.6,
    goalPoints: 100,
    airJumpPoints: 50,
    aerialGoalBonus: 150,
})

const zero = vector => vector?.set(0, 0, 0)
const copy = (target, source) => { if (target && source) target.copy(source) }
const makeEvent = (type, detail) => typeof CustomEvent === 'function' ? new CustomEvent(type, { detail }) : { type, detail }

export function crossedGoalGate(previous, current, goal = stuntArenaRules.goalCenter) {
    if (!previous || !current) return false
    const prevDx = previous.x - goal.x
    const currDx = current.x - goal.x
    const prevDy = previous.y - goal.y
    const currDy = current.y - goal.y
    const withinHeight = Math.max(previous.z || 0, current.z || 0) <= stuntArenaRules.goalHeight && Math.min(previous.z || 0, current.z || 0) >= -0.4
    if (!withinHeight) return false

    const crossedYPlane = (prevDy * currDy <= 0) && Math.abs(prevDy - currDy) > 0.04 && Math.abs((previous.x + current.x) * 0.5 - goal.x) <= stuntArenaRules.goalHalfWidth
    const crossedXPlane = (prevDx * currDx <= 0) && Math.abs(prevDx - currDx) > 0.04 && Math.abs((previous.y + current.y) * 0.5 - goal.y) <= stuntArenaRules.goalHalfWidth
    return crossedYPlane || crossedXPlane
}

export function crossedStuntRing(previous, current, ring) {
    if (!previous || !current || !ring) return false
    const prevDx = previous.x - ring.x
    const currDx = current.x - ring.x
    if (prevDx * currDx > 0 || Math.abs(prevDx - currDx) < 0.03) return false
    const t = Math.abs(prevDx) / (Math.abs(prevDx) + Math.abs(currDx))
    const crossY = previous.y + (current.y - previous.y) * t
    const crossZ = (previous.z || 0) + ((current.z || 0) - (previous.z || 0)) * t
    return Math.hypot(crossY - ring.y, crossZ - ring.z) <= ring.radius + 0.55
}

export default class StuntArenaGame {
    constructor({
        time,
        physics,
        ball,
        container,
        materials,
        sounds,
        eventTarget = typeof window !== 'undefined' ? window : null,
        document: documentRef = typeof document !== 'undefined' ? document : null,
    }) {
        this.id = 'stunt'
        this.time = time
        this.physics = physics
        this.ball = ball
        this.container = container
        this.materials = materials
        this.sounds = sounds
        this.events = eventTarget
        this.document = documentRef

        this.active = false
        this.paused = false
        this.goals = 0
        this.jumps = 0
        this.bestAir = 0
        this.bestDistance = 0
        this.score = 0
        this.lastCallout = 'Hit the East Ramp to smash the Gold Stunt Ball through the Goal Ring, or press Kick Ball!'

        this.airState = {
            airborne: false,
            duration: 0,
            startPos: new THREE.Vector3(),
            peakHeight: 0,
            crossedGoalInAir: false,
        }
        this.lastCarPos = new THREE.Vector3()
        this.lastBallPos = new THREE.Vector3()
        this.hasSampledPositions = false
        this.goalCooldown = 0
        this.ringCooldowns = new Map()
        this.ballResetTimer = 0

        // Lined up straight on the East Ramp approach, clear of the PLAY STUNTS pad
        this.spawn = {
            x: -27.2,
            y: -43.75,
            z: surfaceHeight(-27.2, -43.75) + 0.65,
            angle: Math.PI,
        }
        this.focus = { x: -38.17, y: -43.66, z: 1.1 }

        this.setArenaStaging()
        this.setCelebrationBurst()
        this.resetBall(true)

        this.onVisibility = () => { this.paused = this.isPaused() }
        this.document?.addEventListener?.('visibilitychange', this.onVisibility)
        time.on('tick.stuntArenaGame', () => this.tick())
    }

    setArenaStaging() {
        this.stagingGroup = new THREE.Group()
        this.stagingGroup.name = 'Playground Stunt Arena Staging'
        this.ringMeshes = []

        const yellowMat = this.materials?.shades?.items?.yellow || new THREE.MeshBasicMaterial({ color: 0xf7d16a })
        const orangeMat = this.materials?.shades?.items?.orange || new THREE.MeshBasicMaterial({ color: 0xff8952 })
        const blackMat = this.materials?.shades?.items?.black || new THREE.MeshBasicMaterial({ color: 0x1c2826 })
        const emeraldMat = this.materials?.shades?.items?.emeraldGreen || new THREE.MeshBasicMaterial({ color: 0x5fe2a8 })

        // 1. Build 3D Aerial Stunt Rings
        if (typeof THREE.TorusGeometry === 'function' && typeof THREE.CylinderGeometry === 'function') {
            for (const ringDef of stuntArenaRules.rings) {
                const holder = new THREE.Group()
                const groundZ = surfaceHeight(ringDef.x, ringDef.y)
                holder.position.set(ringDef.x, ringDef.y, groundZ)

                const ringGroup = new THREE.Group()
                ringGroup.position.set(0, 0, ringDef.z)
                // Orient hoop so its opening faces East-West (along X driving axis)
                ringGroup.rotation.y = Math.PI * 0.5

                const outerTorus = new THREE.Mesh(
                    new THREE.TorusGeometry(ringDef.radius, 0.09, 10, 28),
                    yellowMat
                )
                const innerGlowMat = new THREE.MeshBasicMaterial({
                    color: 0xffdf7a,
                    transparent: true,
                    opacity: 0.65,
                })
                const innerTorus = new THREE.Mesh(
                    new THREE.TorusGeometry(ringDef.radius - 0.09, 0.04, 8, 28),
                    innerGlowMat
                )
                ringGroup.add(outerTorus, innerTorus)

                // Cardinal chevron tabs around the ring
                for (let c = 0; c < 4; c++) {
                    const angle = (c * Math.PI) / 2
                    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.14), orangeMat)
                    tab.position.set(Math.cos(angle) * (ringDef.radius + 0.06), Math.sin(angle) * (ringDef.radius + 0.06), 0)
                    tab.rotation.z = angle
                    ringGroup.add(tab)
                }

                holder.add(ringGroup)

                if (ringDef.stanchions) {
                    const legHeight = Math.max(0.5, ringDef.z - 0.1)
                    for (const side of [-1, 1]) {
                        const leg = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.055, 0.075, legHeight, 8),
                            blackMat
                        )
                        leg.rotation.x = Math.PI * 0.5
                        leg.position.set(0, side * (ringDef.radius + 0.02), legHeight * 0.5)
                        holder.add(leg)

                        const footing = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.18, 0.22, 0.12, 8),
                            orangeMat
                        )
                        footing.rotation.x = Math.PI * 0.5
                        footing.position.set(0, side * (ringDef.radius + 0.02), 0.06)
                        holder.add(footing)
                    }
                }

                this.stagingGroup.add(holder)
                this.ringMeshes.push({
                    def: ringDef,
                    ringGroup,
                    outerTorus,
                    innerGlowMat,
                    yellowMat,
                    emeraldMat,
                    flashTimer: 0,
                })
            }

            // Gold tee ring on top of East Jump launch lip
            const tee = new THREE.Mesh(
                new THREE.CylinderGeometry(0.28, 0.34, 0.08, 16),
                orangeMat
            )
            tee.rotation.x = Math.PI * 0.5
            tee.position.set(
                stuntArenaRules.ballTee.x,
                stuntArenaRules.ballTee.y,
                surfaceHeight(stuntArenaRules.ballTee.x, stuntArenaRules.ballTee.y) + 1.26
            )
            this.stagingGroup.add(tee)
        }

        // 2. Painted Turf Stunt Runway & Bullseye Target Court
        if (this.document?.createElement && typeof THREE.PlaneGeometry === 'function') {
            this.setArenaCourt()
            this.setScoreboardTotem(blackMat, yellowMat)
        }

        this.container?.add(this.stagingGroup)
    }

    setArenaCourt() {
        const canvas = this.document.createElement('canvas')
        canvas.width = 1024
        canvas.height = 512
        const ctx = canvas.getContext?.('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, 1024, 512)

        // Outer dashed arena boundary
        ctx.strokeStyle = 'rgba(244, 236, 217, 0.42)'
        ctx.lineWidth = 6
        ctx.setLineDash([22, 16])
        ctx.strokeRect(18, 28, 988, 456)
        ctx.setLineDash([])

        // Central landing bullseye under the Goal Post
        const cx = 512, cy = 256
        for (const [r, color, width] of [
            [140, 'rgba(247, 209, 106, 0.55)', 8],
            [92, 'rgba(255, 137, 82, 0.65)', 6],
            [42, 'rgba(244, 236, 217, 0.75)', 5],
        ]) {
            ctx.beginPath()
            ctx.arc(cx, cy, r, 0, Math.PI * 2)
            ctx.strokeStyle = color
            ctx.lineWidth = width
            ctx.stroke()
        }

        // East & West launch chevrons pointing toward the center goal
        ctx.fillStyle = 'rgba(247, 209, 106, 0.65)'
        for (let i = 0; i < 4; i++) {
            const ex = 870 - i * 58
            ctx.beginPath()
            ctx.moveTo(ex - 26, cy)
            ctx.lineTo(ex + 10, cy - 38)
            ctx.lineTo(ex + 24, cy - 38)
            ctx.lineTo(ex - 8, cy)
            ctx.lineTo(ex + 24, cy + 38)
            ctx.lineTo(ex + 10, cy + 38)
            ctx.closePath()
            ctx.fill()

            const wx = 154 + i * 58
            ctx.beginPath()
            ctx.moveTo(wx + 26, cy)
            ctx.lineTo(wx - 10, cy - 38)
            ctx.lineTo(wx - 24, cy - 38)
            ctx.lineTo(wx + 8, cy)
            ctx.lineTo(wx - 24, cy + 38)
            ctx.lineTo(wx - 10, cy + 38)
            ctx.closePath()
            ctx.fill()
        }

        ctx.fillStyle = 'rgba(244, 236, 217, 0.78)'
        ctx.font = '700 28px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('STUNT & GOAL ARENA', cx, 64)
        ctx.fillText('HIT RAMPS · SMASH GOLD BALL THROUGH RINGS', cx, 448)

        const texture = new THREE.CanvasTexture(canvas)
        texture.minFilter = THREE.LinearFilter
        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
        })
        const geo = new THREE.PlaneGeometry(15.5, 7.2)
        const court = new THREE.Mesh(geo, mat)
        court.position.set(-38.17, -43.75, surfaceHeight(-38.17, -43.75) + 0.035)
        court.userData.groundLayer = true
        this.stagingGroup.add(court)
    }

    setScoreboardTotem(blackMat, yellowMat) {
        const canvas = this.document.createElement('canvas')
        canvas.width = 768
        canvas.height = 384
        const ctx = canvas.getContext?.('2d')
        if (!ctx) return
        const texture = new THREE.CanvasTexture(canvas)
        texture.minFilter = THREE.LinearFilter
        this.scoreboard = { canvas, ctx, texture }

        const group = new THREE.Group()
        const sx = -33.5, sy = -35.8
        group.position.set(sx, sy, surfaceHeight(sx, sy))

        if (typeof THREE.CylinderGeometry === 'function') {
            for (const xOff of [-1.2, 1.2]) {
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.2, 8), blackMat)
                post.rotation.x = Math.PI * 0.5
                post.position.set(xOff, 0, 1.1)
                group.add(post)
            }
        }
        const frame = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.16, 1.35), yellowMat)
        frame.position.set(0, 0, 1.65)
        group.add(frame)

        const faceGeo = new THREE.PlaneGeometry(2.48, 1.16)
        const faceMat = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
        const front = new THREE.Mesh(faceGeo, faceMat)
        front.position.set(0, -0.09, 1.65)
        front.rotation.x = Math.PI * 0.5
        const back = new THREE.Mesh(faceGeo, faceMat)
        back.position.set(0, 0.09, 1.65)
        back.rotation.set(Math.PI * 0.5, 0, Math.PI, 'ZYX')
        group.add(front, back)

        this.stagingGroup.add(group)
        this.drawScoreboard()
    }

    drawScoreboard() {
        if (!this.scoreboard?.ctx) return
        const { ctx, canvas, texture } = this.scoreboard
        ctx.fillStyle = '#143c30'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = '#f7d16a'
        ctx.lineWidth = 8
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#f7d16a'
        ctx.font = '700 44px system-ui, sans-serif'
        ctx.fillText('PLAYGROUND STUNT ARENA', 384, 62)

        ctx.fillStyle = '#f4ead4'
        ctx.font = '800 118px system-ui, sans-serif'
        ctx.fillText(`${this.score} PTS`, 384, 186)

        ctx.fillStyle = '#98d8aa'
        ctx.font = '600 36px system-ui, sans-serif'
        const bestAir = this.bestAir > 0 ? `${this.bestAir.toFixed(2)}s` : '0.00s'
        ctx.fillText(`GOALS: ${this.goals}  ·  JUMPS: ${this.jumps}  ·  AIR: ${bestAir}`, 384, 314)
        texture.needsUpdate = true
    }

    setCelebrationBurst() {
        this.burst = {}
        this.burst.count = 24
        this.burst.active = false
        this.burst.elapsed = 0
        this.burst.group = new THREE.Group()
        this.burst.group.visible = false
        this.burst.items = []

        const palette = [0xf7d16a, 0xff785a, 0x6ae2b8, 0x7cb8ff, 0xfff3d1]
        const geo = new THREE.BoxGeometry(0.22, 0.14, 0.06)

        for (let i = 0; i < this.burst.count; i++) {
            const mat = new THREE.MeshBasicMaterial({ color: palette[i % palette.length] })
            const mesh = new THREE.Mesh(geo, mat)
            mesh.userData.velocity = new THREE.Vector3()
            mesh.userData.spin = new THREE.Vector3()
            this.burst.group.add(mesh)
            this.burst.items.push(mesh)
        }

        this.container?.add(this.burst.group)
    }

    triggerBurst(x, y, z = 1.8) {
        if (!this.burst) return
        this.burst.active = true
        this.burst.elapsed = 0
        this.burst.group.visible = true
        this.burst.group.position.set(x, y, z)

        for (let i = 0; i < this.burst.items.length; i++) {
            const mesh = this.burst.items[i]
            const angle = (i / this.burst.items.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.35
            const speed = 2.6 + Math.random() * 3.4
            mesh.position.set(0, 0, 0)
            mesh.scale.setScalar(1)
            mesh.userData.velocity.set(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                3.4 + Math.random() * 3.2
            )
            mesh.userData.spin.set(
                (Math.random() - 0.5) * 9,
                (Math.random() - 0.5) * 9,
                (Math.random() - 0.5) * 9
            )
        }
    }

    updateBurst(dt) {
        if (this.ringMeshes?.length) {
            const pulse = 0.55 + 0.25 * Math.sin((this.time.elapsed || 0) * 0.006)
            for (const item of this.ringMeshes) {
                if (item.flashTimer > 0) {
                    item.flashTimer = Math.max(0, item.flashTimer - dt)
                    item.outerTorus.material = item.flashTimer > 0 ? item.emeraldMat : item.yellowMat
                    item.innerGlowMat.color.setHex(item.flashTimer > 0 ? 0x6ae2b8 : 0xffdf7a)
                    item.innerGlowMat.opacity = item.flashTimer > 0 ? 0.95 : pulse
                } else {
                    item.innerGlowMat.opacity = pulse
                }
            }
        }

        if (!this.burst?.active) return
        this.burst.elapsed += dt
        if (this.burst.elapsed > 1.65) {
            this.burst.active = false
            this.burst.group.visible = false
            return
        }
        const fade = Math.max(0.01, 1 - this.burst.elapsed / 1.65)
        for (const mesh of this.burst.items) {
            mesh.position.addScaledVector(mesh.userData.velocity, dt)
            mesh.userData.velocity.z -= 9.2 * dt
            mesh.rotation.x += mesh.userData.spin.x * dt
            mesh.rotation.y += mesh.userData.spin.y * dt
            mesh.rotation.z += mesh.userData.spin.z * dt
            mesh.scale.setScalar(fade)
        }
    }

    resetBall(spotOnRampTee = true) {
        if (!this.ball?.collision?.body) return
        resetBowlingBody(this.ball.collision)
        const body = this.ball.collision.body
        if (spotOnRampTee) {
            const { x: bx, y: by, zOffset } = stuntArenaRules.ballTee
            const bz = surfaceHeight(bx, by) + zOffset
            body.position.set(bx, by, bz)
            copy(body.previousPosition, body.position)
            copy(body.interpolatedPosition, body.position)
        }
        body.linearDamping = 0.04
        body.angularDamping = 0.04
        zero(body.velocity); zero(body.angularVelocity); zero(body.force); zero(body.torque)
        body.sleep()
        this.lastBallPos.copy(body.position)
    }

    kickBall() {
        const body = this.ball?.collision?.body
        if (!body) return false
        this.resetBall(true)
        body.wakeUp()
        // Launch Gold Stunt Ball off the East Ramp lip through the Goal Ring
        body.velocity.set(-8.8, (Math.random() - 0.5) * 0.6, 3.2)
        body.angularVelocity.set(0, -14, 4)
        this.sounds?.play?.('bowlingBall')
        this.lastCallout = 'Gold Stunt Ball launched toward the Goal Ring!'
        this.emit()
        return true
    }

    placeCar(pose = this.spawn) {
        const car = this.physics.car
        const body = car?.chassis?.body
        if (!body) return
        const { x, y, z, angle } = pose
        body.position.set(x, y, z)
        body.quaternion.setFromEuler(0, 0, angle)
        zero(body.velocity); zero(body.angularVelocity); zero(body.force); zero(body.torque)
        copy(body.previousPosition, body.position); copy(body.interpolatedPosition, body.position)
        copy(body.previousQuaternion, body.quaternion); copy(body.interpolatedQuaternion, body.position)
        copy(car.oldPosition, body.position); copy(this.physics.lastSafePosition, body.position)
        car.speed = 0; car.forwardSpeed = 0; car.steering = 0; body.aabbNeedsUpdate = true; body.wakeUp()
        const vehicle = car.vehicle
        if (vehicle) {
            for (let i = 0; i < vehicle.wheelInfos.length; i++) {
                vehicle.applyEngineForce(0, i)
                vehicle.setSteeringValue(0, i)
                vehicle.updateWheelTransform(i)
                const wheel = car.wheels?.bodies?.[i]
                const wheelPose = vehicle.wheelInfos[i].worldTransform
                if (wheel && wheelPose) {
                    wheel.position.copy(wheelPose.position)
                    wheel.quaternion.copy(wheelPose.quaternion)
                    copy(wheel.previousPosition, wheel.position)
                    copy(wheel.interpolatedPosition, wheel.position)
                    copy(wheel.previousQuaternion, wheel.quaternion)
                    copy(wheel.interpolatedQuaternion, wheel.quaternion)
                    zero(wheel.velocity); zero(wheel.angularVelocity); zero(wheel.force); zero(wheel.torque)
                }
            }
        }
        this.lastCarPos.copy(body.position)
    }

    start() {
        if (this.active) {
            this.emit()
            return false
        }
        this.active = true
        this.paused = false
        this.goals = 0
        this.jumps = 0
        this.bestAir = 0
        this.bestDistance = 0
        this.score = 0
        this.lastCallout = 'Hold Shift and drive straight up the East Ramp to smash the Gold Ball through the Goal Ring!'
        this.resetBall(true)
        this.placeCar(this.spawn)
        this.drawScoreboard()
        this.emit()
        return true
    }

    stop() {
        if (!this.active) return false
        this.active = false
        this.paused = false
        this.resetBall(true)
        return true
    }

    isPaused() {
        return Boolean(this.document?.hidden || this.document?.querySelector?.('dialog[open]') || this.physics.car?.brakeLocked)
    }

    handleAction(action) {
        if (!this.active) return false
        if (action === 'kick-ball') {
            return this.kickBall()
        }
        if (action === 'spot-ball') {
            this.resetBall(true)
            this.lastCallout = 'Gold Stunt Ball teed up on the East Ramp lip.'
            this.emit()
            return true
        }
        if (action === 'line-up') {
            this.placeCar(this.spawn)
            this.resetBall(true)
            this.lastCallout = 'Lined up on the East Stunt Ramp approach. Hold Shift for boost!'
            this.emit()
            return true
        }
        if (action === 'reset-arena') {
            this.goals = 0
            this.jumps = 0
            this.bestAir = 0
            this.bestDistance = 0
            this.score = 0
            this.resetBall(true)
            this.placeCar(this.spawn)
            this.drawScoreboard()
            this.lastCallout = 'Arena scores and Gold Stunt Ball reset.'
            this.emit()
            return true
        }
        return false
    }

    flashRing(ringId) {
        const found = this.ringMeshes?.find(r => r.def.id === ringId)
        if (found) found.flashTimer = 1.6
    }

    emitCallout(badge, detailText) {
        this.drawScoreboard()
        this.events?.dispatchEvent?.(makeEvent('drive-stunt-callout', {
            badge,
            text: detailText,
            score: this.score,
            goals: this.goals,
            jumps: this.jumps,
            bestAir: this.bestAir,
        }))
    }

    tick() {
        const dt = Math.min(0.06, Math.max(0, (this.time.delta || 16.67) * 0.001))
        this.updateBurst(dt)

        if (this.isPaused()) return
        const car = this.physics.car
        const carBody = car?.chassis?.body
        if (!carBody) return

        if (this.goalCooldown > 0) this.goalCooldown = Math.max(0, this.goalCooldown - dt)
        for (const [id, cd] of this.ringCooldowns) {
            if (cd > 0) this.ringCooldowns.set(id, Math.max(0, cd - dt))
        }
        if (this.ballResetTimer > 0) {
            this.ballResetTimer = Math.max(0, this.ballResetTimer - dt)
            if (this.ballResetTimer === 0) {
                this.resetBall(true)
            }
        }

        if (!this.hasSampledPositions) {
            this.lastCarPos.copy(carBody.position)
            if (this.ball?.collision?.body) this.lastBallPos.copy(this.ball.collision.body.position)
            this.hasSampledPositions = true
            return
        }

        // 1. Track Gold Stunt Ball crossing the Goal Posts or Goal Ring
        const ballBody = this.ball?.collision?.body
        if (ballBody && this.goalCooldown === 0) {
            const scoredGoal = crossedGoalGate(this.lastBallPos, ballBody.position) ||
                crossedStuntRing(this.lastBallPos, ballBody.position, stuntArenaRules.rings[0])
            if (scoredGoal) {
                this.goalCooldown = 1.8
                this.ballResetTimer = 1.8
                this.goals += 1
                this.score += stuntArenaRules.goalPoints
                this.flashRing('goal-ring')
                this.lastCallout = `FIELD GOAL! +${stuntArenaRules.goalPoints} pts (${this.goals} total)`
                this.triggerBurst(stuntArenaRules.goalCenter.x, stuntArenaRules.goalCenter.y, 2.2)
                this.sounds?.play?.('carHorn2')
                this.emitCallout('FIELD GOAL!', `+${stuntArenaRules.goalPoints} PTS · ${this.goals} GOAL${this.goals === 1 ? '' : 'S'}`)
                if (this.active) this.emit()
            }
            this.lastBallPos.copy(ballBody.position)
        }

        // 2. Track Car flying through any of the 3 Aerial Stunt Rings
        for (const ring of stuntArenaRules.rings) {
            const cd = this.ringCooldowns.get(ring.id) || 0
            if (cd === 0 && crossedStuntRing(this.lastCarPos, carBody.position, ring)) {
                this.ringCooldowns.set(ring.id, 2.0)
                this.score += ring.points
                this.flashRing(ring.id)
                this.triggerBurst(ring.x, ring.y, ring.z)
                this.sounds?.play?.('carHorn1')
                this.lastCallout = `${ring.label}! +${ring.points} pts`
                this.emitCallout(ring.label, `+${ring.points} RING BONUS`)
                if (this.active) this.emit()
            }
        }

        // 3. Track Car Ramp Air-Time & Aerial Goal Jumps
        const groundZ = surfaceHeight(carBody.position.x, carBody.position.y)
        const clearance = carBody.position.z - groundZ
        const isAirborne = Boolean(car.inAir && clearance > 0.38) || clearance > 0.88

        if (isAirborne) {
            if (!this.airState.airborne) {
                this.airState.airborne = true
                this.airState.duration = 0
                this.airState.startPos.copy(carBody.position)
                this.airState.peakHeight = clearance
                this.airState.crossedGoalInAir = false
            }
            this.airState.duration += dt
            if (clearance > this.airState.peakHeight) this.airState.peakHeight = clearance
            if (crossedGoalGate(this.lastCarPos, carBody.position)) {
                this.airState.crossedGoalInAir = true
            }
        } else if (this.airState.airborne) {
            const airTime = this.airState.duration
            const jumpDistance = Math.hypot(
                carBody.position.x - this.airState.startPos.x,
                carBody.position.y - this.airState.startPos.y
            )
            const aerialGoal = this.airState.crossedGoalInAir
            this.airState.airborne = false
            this.airState.duration = 0

            if (airTime >= stuntArenaRules.minAirTime && jumpDistance >= stuntArenaRules.minJumpDistance) {
                this.jumps += 1
                if (airTime > this.bestAir) this.bestAir = airTime
                if (jumpDistance > this.bestDistance) this.bestDistance = jumpDistance

                const basePts = Math.round(stuntArenaRules.airJumpPoints + airTime * 45 + jumpDistance * 3)
                const bonusPts = aerialGoal ? stuntArenaRules.aerialGoalBonus : 0
                const totalEarned = basePts + bonusPts
                this.score += totalEarned

                const label = aerialGoal
                    ? 'AERIAL GOAL STUNT!'
                    : airTime >= 0.85
                        ? 'MEGA AIR JUMP!'
                        : 'STUNT JUMP!'
                const summary = `${airTime.toFixed(2)}s AIR · ${jumpDistance.toFixed(1)}m · +${totalEarned} PTS`
                this.lastCallout = `${label} ${summary}`
                this.triggerBurst(carBody.position.x, carBody.position.y, carBody.position.z + 0.8)
                this.emitCallout(label, summary)
                if (this.active) this.emit()
            }
        }

        this.lastCarPos.copy(carBody.position)
    }

    snapshot() {
        const bestAirText = this.bestAir > 0 ? `${this.bestAir.toFixed(2)}s` : '0.00s'
        return {
            id: this.id,
            title: 'Playground Stunt Arena',
            active: this.active,
            phase: 'playing',
            message: this.lastCallout,
            scoreText: `${this.score} pts | Goals: ${this.goals} | Jumps: ${this.jumps} | Best Air: ${bestAirText}`,
            actions: [
                { id: 'kick-ball', label: 'Kick ball' },
                { id: 'spot-ball', label: 'Tee ball' },
                { id: 'line-up', label: 'Line up jump' },
                { id: 'reset-arena', label: 'Reset score' },
            ],
            score: this.score,
            goals: this.goals,
            jumps: this.jumps,
            bestAir: this.bestAir,
            bestDistance: this.bestDistance,
            focus: this.focus,
            spawn: this.spawn,
        }
    }

    emit() {
        this.events?.dispatchEvent?.(makeEvent('drive-activity-update', this.snapshot()))
    }

    dispose() {
        this.stop()
        this.time.off('tick.stuntArenaGame')
        this.document?.removeEventListener?.('visibilitychange', this.onVisibility)
        this.stagingGroup?.removeFromParent()
        this.burst?.group?.removeFromParent()
    }
}
