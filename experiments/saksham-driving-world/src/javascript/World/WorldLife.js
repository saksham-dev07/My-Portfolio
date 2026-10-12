import * as THREE from 'three'
import { roadEdgeDistance, surfaceHeight } from './LandscapeLayout.js'
import { isDistrictPaving } from './Sections/DistrictIdentityLayout.js'

export const lifeLimits = Object.freeze({ skidSegments: 160, dustParticles: 48, skidSeconds: 18, dustSeconds: 1.25 })

export function vehicleEffectState(body, actions, grounded, onRoad) {
    const speed = Math.hypot(body.velocity.x, body.velocity.y)
    const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(body.quaternion)
    const slip = Math.abs(-forward.y * body.velocity.x + forward.x * body.velocity.y)
    return {
        skid: grounded && onRoad && speed > 3 && (Boolean(actions.brake) || slip > 2.5),
        dust: grounded && !onRoad && speed > 2,
    }
}

function fadingMaterial(color, clock, seconds) {
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .28, depthWrite: false })
    material.onBeforeCompile = shader => {
        shader.uniforms.lifeClock = clock
        shader.vertexShader = 'attribute float instanceBirth; varying float vLifeAge; uniform float lifeClock;\n' + shader.vertexShader
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLifeAge=lifeClock-instanceBirth;')
        shader.fragmentShader = 'varying float vLifeAge;\n' + shader.fragmentShader
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>\ndiffuseColor.a*=clamp(1.0-vLifeAge/${seconds.toFixed(2)},0.0,1.0);`)
    }
    material.customProgramCacheKey = () => `world-life-fade-${seconds}`
    return material
}

export default class WorldLife {
    constructor({ container, time, camera, physics, controls, screens = [], window: host = window, document: page = document }) {
        Object.assign(this, { time, camera, physics, controls, screens, page })
        this.container = new THREE.Group()
        this.container.name = 'World life / bounded ambient and driving effects'
        container.add(this.container)
        this.clock = { value: 0 }
        this.preference = host.matchMedia('(prefers-reduced-motion: reduce)')
        this.syncPreference = () => {
            this.reducedMotion = this.preference.matches
            this.lastContacts = [null, null]
            if(this.reducedMotion && this.dust) {
                this.dust.visible = false
                this.dustState.forEach(particle => { particle.age = 100 })
            }
            for(const material of screens) if(material.uniforms?.uScreenMotion) material.uniforms.uScreenMotion.value = this.reducedMotion ? 0 : 1
        }
        this.preference.addEventListener('change', this.syncPreference)
        this.syncPreference()
        this.dummy = new THREE.Object3D()
        this.previousBodyPosition = null
        this.emissionTime = 0
        this.skidIndex = 0
        this.skidCount = 0
        this.lastSkidTime = -100
        this.dustIndex = 0
        this.dustState = Array.from({ length: lifeLimits.dustParticles }, () => ({ age: 100, position: new THREE.Vector3(), velocity: new THREE.Vector3() }))
        this.clouds = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 5), new THREE.MeshBasicMaterial({
            color: '#f2f0dc', transparent: true, opacity: .48, depthWrite: false,
        }), 20)
        this.clouds.name = 'Slow drifting clouds / twenty shared puffs'
        this.birdPositions = new THREE.Float32BufferAttribute(new Float32Array(9 * 4 * 3), 3)
        const birdGeometry = new THREE.BufferGeometry()
        birdGeometry.setAttribute('position', this.birdPositions)
        this.birds = new THREE.LineSegments(birdGeometry, new THREE.LineBasicMaterial({ color: '#3e514e', transparent: true, opacity: .8 }))
        this.birds.name = 'Birds / three small gliding flocks'
        this.skids = this.makePool(new THREE.PlaneGeometry(1, 1), fadingMaterial('#292d29', this.clock, lifeLimits.skidSeconds), lifeLimits.skidSegments)
        this.skids.name = 'Tire skid marks / finite fading pool'
        this.skids.material.polygonOffset = true
        this.skids.material.polygonOffsetFactor = -1
        this.skids.material.polygonOffsetUnits = -2
        this.skids.userData.groundLayer = 'skid'
        this.dust = this.makePool(new THREE.IcosahedronGeometry(1, 0), fadingMaterial('#c4b292', this.clock, lifeLimits.dustSeconds), lifeLimits.dustParticles)
        this.dust.name = 'Grass dust / finite particle pool'
        for(const mesh of [this.clouds, this.birds, this.skids, this.dust]) {
            mesh.userData.cameraCollision = false
            mesh.frustumCulled = false
            if(mesh.isInstancedMesh) mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
            this.container.add(mesh)
        }
        this.updateAtmosphere()
        time.on('tick.worldLife', () => this.update(Math.min(time.delta || 16.667, 100) / 1000))
    }

    makePool(geometry, material, count) {
        geometry.setAttribute('instanceBirth', new THREE.InstancedBufferAttribute(new Float32Array(count).fill(-1000), 1))
        const mesh = new THREE.InstancedMesh(geometry, material, count)
        const empty = new THREE.Matrix4().makeScale(0, 0, 0)
        for(let i = 0; i < count; i++) mesh.setMatrixAt(i, empty)
        mesh.visible = false
        return mesh
    }

    updateAtmosphere() {
        const seconds = this.clock.value
        const bases = [[-30, -8, 37], [24, -60, 43], [100, -24, 39], [143, -108, 45], [-29, -105, 40]]
        for(let i = 0; i < this.clouds.count; i++) {
            const group = Math.floor(i / 4), puff = i % 4, [x, y, z] = bases[group]
            this.dummy.position.set(x + Math.sin(seconds * .009 + group) * 12 + (puff - 1.5) * 3.4, y + Math.cos(seconds * .006 + group) * 6, z + Math.sin(puff * 2) * .5)
            this.dummy.rotation.set(0, 0, group * .8)
            this.dummy.scale.set(4.1 + puff * .45, 2.6, 1.25)
            this.dummy.updateMatrix(); this.clouds.setMatrixAt(i, this.dummy.matrix)
        }
        this.clouds.instanceMatrix.needsUpdate = true
        const flocks = [[-15, -10], [5, -90], [112, -24]]
        for(let bird = 0; bird < 9; bird++) {
            const flock = Math.floor(bird / 3), member = bird % 3, [cx, cy] = flocks[flock]
            const phase = seconds * .1 + flock * 2.1, heading = phase + Math.PI / 2
            const x = cx + Math.cos(phase) * 18 - member * 1.1 * Math.cos(heading)
            const y = cy + Math.sin(phase) * 12 - member * 1.1 * Math.sin(heading)
            const z = 20 + flock * 2 + Math.sin(phase) * 1.4
            const flap = Math.sin(seconds * 4 + bird) * .2
            const rightX = -Math.sin(heading) * .55, rightY = Math.cos(heading) * .55
            const offset = bird * 4
            this.birdPositions.setXYZ(offset, x - rightX, y - rightY, z + flap)
            this.birdPositions.setXYZ(offset + 1, x, y, z)
            this.birdPositions.setXYZ(offset + 2, x, y, z)
            this.birdPositions.setXYZ(offset + 3, x + rightX, y + rightY, z + flap)
        }
        this.birdPositions.needsUpdate = true
    }

    emitSkid(from, to) {
        const length = from.distanceTo(to)
        if(length < .06 || length > 2) return
        this.dummy.position.copy(from).add(to).multiplyScalar(.5)
        this.dummy.position.z = surfaceHeight(this.dummy.position.x, this.dummy.position.y) + .045
        this.dummy.rotation.set(0, 0, Math.atan2(to.y - from.y, to.x - from.x))
        this.dummy.scale.set(length + .025, .18, 1)
        this.dummy.updateMatrix()
        this.skids.setMatrixAt(this.skidIndex, this.dummy.matrix)
        const births = this.skids.geometry.attributes.instanceBirth
        births.setX(this.skidIndex, this.clock.value); births.needsUpdate = true
        this.skids.instanceMatrix.needsUpdate = true
        this.skidIndex = (this.skidIndex + 1) % lifeLimits.skidSegments
        this.skidCount = Math.min(lifeLimits.skidSegments, this.skidCount + 1)
        this.lastSkidTime = this.clock.value
    }

    emitDust(point) {
        const i = this.dustIndex, particle = this.dustState[i]
        particle.age = 0
        particle.position.copy(point)
        particle.position.z = surfaceHeight(point.x, point.y) + .16
        particle.velocity.set(Math.sin(i * 2.4) * .25, Math.cos(i * 1.7) * .25, .35)
        const births = this.dust.geometry.attributes.instanceBirth
        births.setX(i, this.clock.value); births.needsUpdate = true
        this.dustIndex = (i + 1) % lifeLimits.dustParticles
    }

    update(dt) {
        if(this.disposed || this.page.hidden) return
        const overview = this.camera.view === 'top'
        this.clouds.visible = this.birds.visible = !overview
        if(this.reducedMotion) return
        this.clock.value += dt
        this.updateAtmosphere()
        for(const material of this.screens) if(material.uniforms?.uScreenTime) material.uniforms.uScreenTime.value = this.clock.value
        let dustAlive = false
        for(let i = 0; i < this.dustState.length; i++) {
            const particle = this.dustState[i]
            particle.age += dt
            if(particle.age >= lifeLimits.dustSeconds) continue
            dustAlive = true
            particle.position.addScaledVector(particle.velocity, dt)
            const scale = .11 + particle.age * .16
            this.dummy.position.copy(particle.position); this.dummy.rotation.set(0, 0, i); this.dummy.scale.setScalar(scale)
            this.dummy.updateMatrix(); this.dust.setMatrixAt(i, this.dummy.matrix)
        }
        this.dust.visible = dustAlive && !overview
        if(dustAlive) this.dust.instanceMatrix.needsUpdate = true
        this.skids.visible = this.clock.value - this.lastSkidTime < lifeLimits.skidSeconds
        this.emissionTime += dt
        if(this.emissionTime < .06) return
        this.emissionTime = 0
        const body = this.physics.car?.chassis?.body
        if(!body) return
        const position = new THREE.Vector3(body.position.x, body.position.y, body.position.z)
        const teleported = this.previousBodyPosition && position.distanceTo(this.previousBodyPosition) > 5
        this.previousBodyPosition = position
        if(teleported) { this.lastContacts = [null, null]; return }
        if(Math.hypot(body.velocity.x, body.velocity.y) < 2) { this.lastContacts = [null, null]; return }
        const wheels = this.physics.car.vehicle?.wheelInfos || []
        for(let rear = 0; rear < 2; rear++) {
            const wheel = wheels[rear + 2], hit = wheel?.raycastResult?.hitPointWorld
            const grounded = Boolean(wheel?.isInContact || wheel?.raycastResult?.hasHit)
            if(!grounded || !hit) { this.lastContacts[rear] = null; continue }
            const point = new THREE.Vector3(hit.x, hit.y, hit.z)
            const onRoad = roadEdgeDistance(point.x, point.y) < -.12 || isDistrictPaving(point.x, point.y)
            const effects = vehicleEffectState(body, this.controls.actions, grounded, onRoad)
            if(effects.skid && this.lastContacts[rear]) this.emitSkid(this.lastContacts[rear], point)
            if(effects.dust) this.emitDust(point)
            this.lastContacts[rear] = effects.skid ? point : null
        }
    }

    dispose() {
        this.disposed = true
        this.time.off('tick.worldLife')
        this.preference.removeEventListener('change', this.syncPreference)
        for(const material of this.screens) if(material.uniforms?.uScreenMotion) material.uniforms.uScreenMotion.value = 0
        this.container.traverse(mesh => {
            if(!mesh.geometry) return
            mesh.geometry.dispose(); mesh.material.dispose()
            if(mesh.isInstancedMesh) mesh.dispose()
        })
        this.container.removeFromParent()
    }
}
