import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import { terrainHeight } from './World/LandscapeLayout.js'
import { worldAtmosphere } from './World/WorldBackdrop.js'

// Z-up world; distances in world units, speed in units/second.
export const CAMERA_DISTANCE = 12
export const CAMERA_HEIGHT = 5.5
export const CAMERA_LOOK_AHEAD = 3
export const CAMERA_SMOOTHING = .16
export const STOP_SPEED_THRESHOLD = .5
export const CAMERA_RETURN_SECONDS = .8
export const CAMERA_MIN_PITCH = 0
export const CAMERA_MAX_PITCH = 70
export const CAMERA_MIN_DISTANCE = 4
export const CAMERA_MAX_DISTANCE = 80
// Parked map exploration may zoom out farther; automatic car follow stays
// within a comfortable envelope, even beside very tall collision geometry.
export const CAMERA_MAX_DRIVING_DISTANCE = 24
export const CAMERA_MAX_AUTOMATIC_DISTANCE = 28
export const CAMERA_MAX_AUTOMATIC_HEIGHT = 12
export const CAMERA_COLLISION_SPEED = 6
export const CAMERA_COLLISION_SMOOTHING = .12
const CAMERA_CAR_CLEARANCE = 3.5
const CAMERA_COLLISION_MARGIN = .45

export default class Camera
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.sizes = _options.sizes
        this.renderer = _options.renderer
        this.debug = _options.debug
        this.config = _options.config
        this.controls = _options.controls

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        this.target = new THREE.Vector3(0, 0, 0)
        this.targetEased = new THREE.Vector3(0, 0, 0)
        this.easing = 0.15
        this.view = 'orbit'
        this.following = true
        this.driving = false
        this.stationaryTime = 0
        this.returnProgress = 1
        this.returnPosition = new THREE.Vector3()
        this.returnLook = new THREE.Vector3()
        this.carBody = null
        this.car = null
        this.topCenter = new THREE.Vector3(52, -58, 0)
        this.viewOffset = new THREE.Vector3()
        this.viewLook = new THREE.Vector3()
        this.forward = new THREE.Vector3()
        this.collisionRay = new THREE.Raycaster()
        this.collisionOrigin = new THREE.Vector3()
        this.collisionDirection = new THREE.Vector3()
        this.collisionHit = new THREE.Vector3()
        this.collisionSize = new THREE.Vector3()
        this.collisionOffset = new THREE.Vector3()
        this.collisionDesired = new THREE.Vector3()
        this.collisionMeshes = []
        this.collisionRefresh = 0
        this.cameraReady = false
        this.chaseDistance = CAMERA_DISTANCE
        this.chaseZoomTarget = CAMERA_DISTANCE
        this.exploreZoomTarget = null
        this.wheelEvents = new WeakSet()

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('camera')
            // this.debugFolder.open()
        }

        this.setAngle()
        this.setInstance()
        this.setZoom()
        this.setPan()
        this.setOrbitControls()
    }

    setAngle()
    {
        // Set up
        this.angle = {}

        // Items
        this.angle.items = {
            default: new THREE.Vector3(1.135, - 1.45, 1.15),
            projects: new THREE.Vector3(0.38, - 1.4, 1.63)
        }

        // Value
        this.angle.value = new THREE.Vector3()
        this.angle.value.copy(this.angle.items.default)

        // Set method
        this.angle.set = (_name) =>
        {
            const angle = this.angle.items[_name]
            if(typeof angle !== 'undefined')
            {
                gsap.to(this.angle.value, { ...angle, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.2, ease: 'power1.inOut' })
            }
        }

        // Debug
        if(this.debug)
        {
            this.debugFolder.add(this, 'easing').step(0.0001).min(0).max(1).name('easing')
            this.debugFolder.add(this.angle.value, 'x').step(0.001).min(- 2).max(2).name('invertDirectionX').listen()
            this.debugFolder.add(this.angle.value, 'y').step(0.001).min(- 2).max(2).name('invertDirectionY').listen()
            this.debugFolder.add(this.angle.value, 'z').step(0.001).min(- 2).max(2).name('invertDirectionZ').listen()
        }
    }

    setInstance()
    {
        // Set up
        this.instance = new THREE.PerspectiveCamera(40, this.sizes.viewport.width / this.sizes.viewport.height, .1, 300)
        this.instance.up.set(0, 0, 1)
        this.instance.position.copy(this.angle.value)
        this.instance.lookAt(new THREE.Vector3())
        this.container.add(this.instance)

        // Resize event
        this.sizes.on('resize', () =>
        {
            this.instance.aspect = this.sizes.viewport.width / this.sizes.viewport.height
            this.instance.updateProjectionMatrix()
        })

        // Time tick
        this.time.on('render', () =>
        {
            if(this.view === 'top')
            {
                const aspect = this.instance.aspect
                const fitDistance = Math.max(205, 285 / aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(20)))
                const distance = 24 + (fitDistance - 24) * this.zoom.value
                this.viewLook.copy(this.topCenter)
                this.viewLook.x += this.pan.value.x
                this.viewLook.y += this.pan.value.y
                this.instance.position.copy(this.viewLook)
                this.instance.position.z = distance
                this.instance.lookAt(this.viewLook)
                return
            }
            const carBody = this.getCarBody()
            if(this.view === 'first' && carBody)
            {
                const carPose = this.carVisual || carBody
                this.forward.set(1, 0, 0).applyQuaternion(carPose.quaternion)
                this.forward.z = 0
                this.forward.normalize()
                // A forward-mounted eye stays outside the solid car model; no roll or shake.
                this.instance.position.copy(carPose.position).addScaledVector(this.forward, 1.6)
                this.instance.position.z = carPose.position.z + (this.carVisual ? 1.33 : 1.05)
                this.viewLook.copy(this.instance.position).addScaledVector(this.forward, 12)
                this.viewLook.z -= 0.45
                this.instance.lookAt(this.viewLook)
                return
            }
            this.updateDriving()
            this.updateChaseCamera()
        })
    }

    getCarBody()
    {
        // Reset recreates the chassis; resolve its current body every frame.
        return this.car?.chassis?.body || this.carBody
    }

    updateChaseCamera()
    {
        const body = this.getCarBody()
        if(!body) return
        const pose = this.carVisual || body
        const dt = Math.min(this.time.delta ?? 16.667, 100) / 1000
        const damping = 1 - Math.pow(1 - CAMERA_SMOOTHING, dt * 60)
        this.chaseZoomTarget = THREE.MathUtils.clamp(this.chaseZoomTarget, CAMERA_MIN_DISTANCE, CAMERA_MAX_DRIVING_DISTANCE)
        this.chaseDistance += (this.chaseZoomTarget - this.chaseDistance) * damping
        // Local +X is the vehicle's nose; reversing never flips the camera.
        this.forward.set(1, 0, 0).applyQuaternion(pose.quaternion)
        this.forward.z = 0
        if(this.forward.lengthSq() < .0001) this.forward.set(1, 0, 0)
        this.forward.normalize()
        if(this.following)
        {
            // Collision correction must never become the next frame's chase baseline.
            this.instance.position.sub(this.collisionOffset)
            this.viewOffset.copy(pose.position).addScaledVector(this.forward, -this.chaseDistance)
            this.viewOffset.z += CAMERA_HEIGHT * this.chaseDistance / CAMERA_DISTANCE
            this.viewLook.copy(pose.position).addScaledVector(this.forward, CAMERA_LOOK_AHEAD)
            if(!this.cameraReady)
            {
                this.instance.position.copy(this.viewOffset)
                this.orbitControls.target.copy(this.viewLook)
                this.cameraReady = true
            }
            else if(this.returnProgress < 1)
            {
                this.returnProgress = Math.min(1, this.returnProgress + dt / CAMERA_RETURN_SECONDS)
                const t = this.returnProgress
                const blend = t * t * (3 - 2 * t)
                // Return around the car, never along a chord through its cabin.
                const fromX = this.returnPosition.x - pose.position.x
                const fromY = this.returnPosition.y - pose.position.y
                const fromYaw = Math.atan2(fromY, fromX)
                const toYaw = Math.atan2(-this.forward.y, -this.forward.x)
                const turn = Math.atan2(Math.sin(toYaw - fromYaw), Math.cos(toYaw - fromYaw))
                const radius = THREE.MathUtils.lerp(Math.max(CAMERA_CAR_CLEARANCE, Math.hypot(fromX, fromY)), this.chaseDistance, blend)
                this.instance.position.set(pose.position.x + Math.cos(fromYaw + turn * blend) * radius,
                    pose.position.y + Math.sin(fromYaw + turn * blend) * radius,
                    THREE.MathUtils.lerp(this.returnPosition.z, this.viewOffset.z, blend))
                this.orbitControls.target.lerpVectors(this.returnLook, this.viewLook, blend)
            }
            else
            {
                this.instance.position.lerp(this.viewOffset, damping)
                this.orbitControls.target.lerp(this.viewLook, damping)
            }
        }
        if(!this.following)
        {
            if(this.exploreZoomTarget !== null)
            {
                this.viewOffset.copy(this.instance.position).sub(this.orbitControls.target)
                const radius = THREE.MathUtils.lerp(this.viewOffset.length(), this.exploreZoomTarget, damping)
                this.instance.position.copy(this.orbitControls.target).add(this.viewOffset.setLength(radius))
                if(Math.abs(radius - this.exploreZoomTarget) < .001) this.exploreZoomTarget = null
            }
            this.orbitControls.update(dt)
        }
        // Exploration belongs to its own map target, not to a ray back to the car.
        this.resolveCameraCollision(this.following ? pose.position : this.orbitControls.target)
        if(this.following)
        {
            const separation = Math.hypot(this.instance.position.x - pose.position.x, this.instance.position.y - pose.position.y)
            if(separation < CAMERA_CAR_CLEARANCE)
            {
                this.instance.position.x = pose.position.x - this.forward.x * CAMERA_CAR_CLEARANCE
                this.instance.position.y = pose.position.y - this.forward.y * CAMERA_CAR_CLEARANCE
            }
            this.instance.position.z = Math.max(this.instance.position.z, pose.position.z + 1.5)
            // Preserve the smooth return from a distant parked map view. Once
            // attached, neither follow lag nor scenery may expand the radius.
            if(this.returnProgress >= 1) {
                this.collisionDirection.copy(this.instance.position).sub(pose.position)
                if(this.collisionDirection.length() > CAMERA_MAX_AUTOMATIC_DISTANCE) {
                    this.collisionDesired.copy(pose.position).add(this.collisionDirection.setLength(CAMERA_MAX_AUTOMATIC_DISTANCE)).sub(this.instance.position)
                    this.instance.position.add(this.collisionDesired)
                    this.collisionOffset.add(this.collisionDesired)
                }
            }
        }
        this.instance.lookAt(this.orbitControls.target)
    }

    resolveCameraCollision(position)
    {
        // Map exploration is relative to a freely panned target. Never pull that
        // view back toward scenery along a ray from the parked vehicle.
        if(!this.following)
        {
            this.collisionOffset.set(0, 0, 0)
            this.instance.position.z = Math.max(terrainHeight(this.instance.position.x, this.instance.position.y) + .4, this.instance.position.z)
            return
        }
        const scene = this.container.parent
        if(!scene) { this.collisionOffset.set(0, 0, 0); return }
        this.collisionRefresh -= (this.time.delta ?? 16.667) / 1000
        if(this.collisionRefresh <= 0)
        {
            this.collisionMeshes.length = 0
            // Refresh only periodically; the renderer already updates world matrices each frame.
            scene.updateMatrixWorld(false)
            scene.traverseVisible(object => {
                if(!object.isMesh || object.userData.cameraCollision === false) return
                for(let parent = object; parent; parent = parent.parent)
                    if(parent === this.carVisual?.parent || parent === this.container) return
                const materials = Array.isArray(object.material) ? object.material : [object.material]
                if(materials.every(material => !material || !material.visible || !material.depthWrite || material.transparent)) return
                if(!object.geometry.boundingBox) object.geometry.computeBoundingBox()
                const local = object.geometry.boundingBox
                if(!local) return
                const addProxy = matrix => {
                    const bounds = local.clone().applyMatrix4(matrix)
                    bounds.getSize(this.collisionSize)
                    // The landscape has an analytic height sampler; never scan its triangles.
                    if(this.collisionSize.x > 100 && this.collisionSize.y > 100) return
                    bounds.expandByScalar(CAMERA_COLLISION_MARGIN)
                    this.collisionMeshes.push({ mesh: object, bounds, matrix: matrix.clone(),
                        precise: !object.isInstancedMesh && (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3 < 2000 })
                }
                if(object.isInstancedMesh)
                {
                    const matrix = new THREE.Matrix4()
                    for(let index = 0; index < object.count; index++)
                    {
                        object.getMatrixAt(index, matrix)
                        matrix.premultiply(object.matrixWorld)
                        addProxy(matrix)
                    }
                }
                else addProxy(object.matrixWorld)
            })
            this.collisionRefresh = .5
        }
        this.collisionOrigin.copy(position)
        this.collisionOrigin.z += .6
        this.collisionDesired.copy(this.instance.position)
        this.collisionDesired.z = Math.max(terrainHeight(this.instance.position.x, this.instance.position.y) + .4, this.collisionDesired.z)
        this.collisionDirection.copy(this.instance.position).sub(this.collisionOrigin)
        const distance = this.collisionDirection.length()
        this.collisionRay.set(this.collisionOrigin, this.collisionDirection.normalize())
        this.collisionRay.far = distance + CAMERA_COLLISION_MARGIN
        let allowed = Infinity
        let obstructionTop = -Infinity
        // Sample the landscape along the sightline as well as beneath the camera.
        // Ridge widths exceed the bounded camera segment's sample spacing.
        for(let step = 1; step <= 6; step++)
        {
            const sampleDistance = distance * step / 6
            this.collisionHit.copy(this.collisionOrigin).addScaledVector(this.collisionDirection, sampleDistance)
            if(this.collisionHit.z < terrainHeight(this.collisionHit.x, this.collisionHit.y) + .25)
            {
                allowed = Math.max(.2, distance * (step - 1) / 6)
                break
            }
        }
        for(const proxy of this.collisionMeshes)
        {
            const mesh = proxy.mesh
            if(!mesh.visible || !mesh.parent) continue
            if(!mesh.isInstancedMesh && !proxy.matrix.equals(mesh.matrixWorld))
            {
                proxy.matrix.copy(mesh.matrixWorld)
                proxy.bounds.copy(mesh.geometry.boundingBox).applyMatrix4(proxy.matrix).expandByScalar(CAMERA_COLLISION_MARGIN)
            }
            const hit = this.collisionRay.ray.intersectBox(proxy.bounds, this.collisionHit)
            if(!hit) continue
            const hitDistance = this.collisionOrigin.distanceTo(hit)
            if(hitDistance > distance) continue
            if(proxy.precise)
            {
                const intersections = this.collisionRay.intersectObject(mesh, false)
                if(!intersections.length) continue
                obstructionTop = Math.max(obstructionTop, proxy.bounds.max.z)
                allowed = Math.min(allowed, Math.max(.2, intersections[0].distance - CAMERA_COLLISION_MARGIN))
            }
            else
            {
                obstructionTop = Math.max(obstructionTop, proxy.bounds.max.z)
                allowed = Math.min(allowed, Math.max(.2, hitDistance))
            }
        }
        this.collisionDirection.copy(this.instance.position).sub(this.collisionOrigin)
        const planarFraction = Math.hypot(this.collisionDirection.x, this.collisionDirection.y) / Math.max(.001, distance)
        if(this.following && allowed * planarFraction < CAMERA_CAR_CLEARANCE)
        {
            // Keep the requested distance around nearby scenery, clearing it above.
            this.collisionDesired.z = Math.max(this.collisionDesired.z, obstructionTop + .6, position.z + CAMERA_HEIGHT)
        }
        else if(allowed < this.collisionDirection.length())
            this.collisionDesired.copy(this.collisionOrigin).addScaledVector(this.collisionDirection.normalize(), allowed)
        // Collision avoidance can raise/pull in the view, but never crane it
        // to the top of a tall building or multiply the player's chosen zoom.
        this.collisionDesired.z = Math.min(this.collisionDesired.z, position.z + CAMERA_MAX_AUTOMATIC_HEIGHT)
        this.collisionDesired.sub(position).clampLength(0, CAMERA_MAX_AUTOMATIC_DISTANCE).add(position)
        this.collisionDesired.sub(this.instance.position)
        const dt = Math.min(this.time.delta ?? 16.667, 100) / 1000
        const damping = 1 - Math.pow(1 - CAMERA_COLLISION_SMOOTHING, dt * 60)
        this.collisionDesired.sub(this.collisionOffset).multiplyScalar(damping)
        this.collisionDesired.clampLength(0, CAMERA_COLLISION_SPEED * dt)
        this.collisionOffset.add(this.collisionDesired)
        this.instance.position.add(this.collisionOffset)
    }

    updateDriving({ manualExploration = false } = {})
    {
        // Ignore vertical suspension motion; driving intent wins over planar creep.
        const body = this.getCarBody()
        const speed = Math.hypot(body?.velocity?.x || 0, body?.velocity?.y || 0)
        const actions = this.controls?.actions
        const intentionalDrive = Boolean(body && (actions?.up || actions?.down || actions?.left || actions?.right) && !actions?.brake && !this.car?.brakeLocked)
        // A deliberate drag can claim a nearly stopped car; small solver creep
        // cannot recapture it. Driving input still resumes follow immediately.
        const speedThreshold = manualExploration || !this.driving ? .8 : STOP_SPEED_THRESHOLD
        const driving = intentionalDrive || speed >= speedThreshold
        if(!driving) this.stationaryTime = 0
        const changed = driving !== this.driving
        this.driving = driving
        if(driving && !this.following) { this.exploring = false; this.focusCar() }
        this.orbitControls.enabled = this.view === 'orbit' && !driving
        this.renderer?.domElement?.classList.toggle?.('has-cursor-grab', this.view === 'top' || !driving)
        if(driving) this.renderer?.domElement?.classList.remove('has-cursor-grabbing')
        if(changed)
        {
            this.time.trigger('cameraControl')
        }
    }

    setView(view)
    {
        if(!['orbit', 'top', 'first'].includes(view) || view === this.view) return
        if(this.view === 'top')
        {
            this.zoom.targetValue = this.savedZoom
            this.zoom.value = this.savedZoom
        }
        this.view = view
        this.collisionOffset.set(0, 0, 0)
        this.exploreZoomTarget = null
        if(view === 'orbit') this.cameraReady = false
        this.pan.up()
        this.pan.reset()
        this.pan.value.x = 0
        this.pan.value.y = 0
        this.orbitControls.enabled = view === 'orbit'
        this.following = true
        this.returnProgress = 1
        this.instance.up.set(0, view === 'top' ? 1 : 0, view === 'top' ? 0 : 1)
        this.instance.fov = view === 'first' ? 72 : 40
        this.instance.near = view === 'first' ? 0.05 : .1
        this.instance.far = view === 'top' ? 3000 : worldAtmosphere.viewDistance
        this.instance.updateProjectionMatrix()
        if(view === 'first') this.pan.disable()
        else this.pan.enable()
        if(view === 'top')
        {
            this.savedZoom = this.zoom.targetValue
            this.fitMap()
        }
        else this.targetEased.copy(this.target)
        this.time.trigger('cameraControl')
    }

    fitMap()
    {
        this.topCenter.set(52, -58, 0)
        this.pan.reset()
        this.zoom.targetValue = 1
        this.zoom.value = 1
    }

    focusCar()
    {
        if(this.view === 'top')
        {
            this.topCenter.copy(this.target)
            this.topCenter.z = 0
            this.pan.reset()
            this.zoom.targetValue = 0.12
        }
        else if(this.view === 'orbit')
        {
            // Drain remaining manual damping before returning to the authored view.
            this.orbitControls.enableDamping = false
            this.orbitControls.update()
            this.orbitControls.enableDamping = false
            if(!this.following)
            {
                this.returnPosition.copy(this.instance.position)
                this.returnLook.copy(this.orbitControls.target)
                this.returnProgress = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0
            }
            this.following = true
        }
        this.time.trigger('cameraControl')
    }

    frameActivity(point, distance = 40)
    {
        this.setView('orbit')
        this.following = false
        this.exploring = false
        this.driving = false
        this.stationaryTime = 0
        this.pan.reset()
        this.orbitControls.enableDamping = false
        this.orbitControls.update()
        this.orbitControls.target.set(point.x, point.y, point.z || 0)
        this.instance.position.copy(this.angle.items.default).normalize().multiplyScalar(distance).add(this.orbitControls.target)
        this.instance.lookAt(this.orbitControls.target)
        this.orbitControls.update()
        this.orbitControls.enableDamping = false
        // Driving resumes the usual car follow; a stationary assisted roll
        // keeps the entire bowling lane visible and mouse exploration usable.
        this.time.trigger('cameraControl')
    }

    setZoom()
    {
        // Set up
        this.zoom = {}
        this.zoom.easing = 0.1
        this.zoom.minDistance = 14
        this.zoom.amplitude = 24
        // Preserve the familiar starting framing, allow wider landmark views.
        this.zoom.value = this.config.cyberTruck ? 0.1875 : 0.3125
        this.zoom.targetValue = this.zoom.value
        this.zoom.distance = this.zoom.minDistance + this.zoom.amplitude * this.zoom.value

        // One wheel owner for the whole world, including its small HUD overlays.
        this.onCameraWheel = (_event) =>
        {
            if(this.wheelEvents.has(_event)) return
            if(globalThis.document?.querySelector?.('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(_event.target?.tagName || '')) return
            this.wheelEvents.add(_event)
            if(this.view === 'first')
            {
                this.setView('orbit')
                this.updateChaseCamera()
            }
            // Capture before OrbitControls so exactly one owner applies wheel zoom.
            _event.stopImmediatePropagation()
            if(this.view === 'orbit')
            {
                _event.preventDefault()
                const delta = _event.deltaY * (_event.deltaMode === 1 ? 16 : _event.deltaMode === 2 ? this.sizes.viewport.height : 1)
                this.chaseZoomTarget = THREE.MathUtils.clamp(this.chaseZoomTarget * Math.exp(THREE.MathUtils.clamp(delta * .0015, -.3, .3)), CAMERA_MIN_DISTANCE, CAMERA_MAX_DRIVING_DISTANCE)
                // Stopped free-look retains its yaw/pitch; only the orbital radius changes.
                if(!this.following)
                {
                    this.viewOffset.copy(this.instance.position).sub(this.orbitControls.target)
                    this.exploreZoomTarget = THREE.MathUtils.clamp((this.exploreZoomTarget ?? this.viewOffset.length()) * Math.exp(THREE.MathUtils.clamp(delta * .0015, -.3, .3)), CAMERA_MIN_DISTANCE, CAMERA_MAX_DISTANCE)
                }
                return
            }
            if(this.view !== 'top') return
            _event.preventDefault()
            this.zoom.targetValue += _event.deltaY * 0.001
            this.zoom.targetValue = Math.min(Math.max(this.zoom.targetValue, 0), 1)
        }
        this.renderer.domElement.addEventListener('wheel', this.onCameraWheel, { passive: false, capture: true })
        this.renderer.domElement.ownerDocument?.addEventListener('wheel', this.onCameraWheel, { passive: false, capture: true })

        // Touch
        this.zoom.touch = {}
        this.zoom.touch.startDistance = 0
        this.zoom.touch.startValue = 0

        this.renderer.domElement.addEventListener('touchstart', (_event) =>
        {
            if(this.view === 'top' && _event.touches.length === 2)
            {
                this.zoom.touch.startDistance = Math.hypot(_event.touches[0].clientX - _event.touches[1].clientX, _event.touches[0].clientY - _event.touches[1].clientY)
                this.zoom.touch.startValue = this.zoom.targetValue
            }
        })

        this.renderer.domElement.addEventListener('touchmove', (_event) =>
        {
            if(this.view === 'top' && _event.touches.length === 2)
            {
                _event.preventDefault()

                const distance = Math.hypot(_event.touches[0].clientX - _event.touches[1].clientX, _event.touches[0].clientY - _event.touches[1].clientY)
                const ratio = distance / this.zoom.touch.startDistance

                this.zoom.targetValue = this.zoom.touch.startValue - (ratio - 1)
                this.zoom.targetValue = Math.min(Math.max(this.zoom.targetValue, 0), 1)
            }
        })

        // Time tick event
        this.time.on('tick', () =>
        {
            this.zoom.value += (this.zoom.targetValue - this.zoom.value) * this.zoom.easing
            this.zoom.distance = this.zoom.minDistance + this.zoom.amplitude * this.zoom.value
        })
    }

    setPan()
    {
        // Set up
        this.pan = {}
        this.pan.enabled = false
        this.pan.active = false
        this.pan.easing = 0.1
        this.pan.start = {}
        this.pan.start.x = 0
        this.pan.start.y = 0
        this.pan.value = {}
        this.pan.value.x = 0
        this.pan.value.y = 0
        this.pan.targetValue = {}
        this.pan.targetValue.x = this.pan.value.x
        this.pan.targetValue.y = this.pan.value.y
        this.pan.raycaster = new THREE.Raycaster()
        this.pan.mouse = new THREE.Vector2()
        this.pan.needsUpdate = false
        this.pan.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
        this.pan.hit = new THREE.Vector3()

        this.pan.reset = () =>
        {
            this.pan.targetValue.x = 0
            this.pan.targetValue.y = 0
        }

        this.pan.enable = () =>
        {
            this.pan.enabled = this.view === 'top'

            // Update cursor
            this.renderer.domElement.classList.add('has-cursor-grab')
        }

        this.pan.disable = () =>
        {
            this.pan.enabled = false

            // Update cursor
            this.renderer.domElement.classList.remove('has-cursor-grab')
        }

        this.pan.down = (_x, _y) =>
        {
            if(!this.pan.enabled)
            {
                return
            }

            // Update cursor
            this.renderer.domElement.classList.add('has-cursor-grabbing')

            // Activate
            this.pan.active = true

            // Update mouse position
            this.pan.mouse.x = (_x / this.sizes.viewport.width) * 2 - 1
            this.pan.mouse.y = - (_y / this.sizes.viewport.height) * 2 + 1

            // Get start position
            this.pan.raycaster.setFromCamera(this.pan.mouse, this.instance)

            if(this.pan.raycaster.ray.intersectPlane(this.pan.plane, this.pan.hit))
            {
                this.pan.start.x = this.pan.hit.x
                this.pan.start.y = this.pan.hit.y
            }
            else this.pan.up()
        }

        this.pan.move = (_x, _y) =>
        {
            if(!this.pan.enabled)
            {
                return
            }

            if(!this.pan.active)
            {
                return
            }

            this.pan.mouse.x = (_x / this.sizes.viewport.width) * 2 - 1
            this.pan.mouse.y = - (_y / this.sizes.viewport.height) * 2 + 1

            this.pan.needsUpdate = true
        }

        this.pan.up = () =>
        {
            this.pan.update()
            // Deactivate
            this.pan.active = false

            // Update cursor
            this.renderer.domElement.classList.remove('has-cursor-grabbing')
        }

        this.pan.update = () =>
        {
            if(!this.pan.active || !this.pan.needsUpdate) return
            this.pan.raycaster.setFromCamera(this.pan.mouse, this.instance)
            if(this.pan.raycaster.ray.intersectPlane(this.pan.plane, this.pan.hit))
            {
                // The ray includes the current pan. Retain that offset so
                // subsequent gestures accumulate instead of resetting it.
                this.pan.targetValue.x = this.pan.value.x + this.pan.start.x - this.pan.hit.x
                this.pan.targetValue.y = this.pan.value.y + this.pan.start.y - this.pan.hit.y
            }
            this.pan.needsUpdate = false
        }

        // Mouse
        this.renderer.domElement.addEventListener('pointerdown', (_event) =>
        {
            if(!_event.isPrimary) { this.pan.up(); return }
            if(_event.button !== 0 || !this.pan.enabled) return
            this.pan.down(_event.clientX, _event.clientY)
            this.renderer.domElement.setPointerCapture(_event.pointerId)
        })

        this.renderer.domElement.addEventListener('pointermove', (_event) =>
        {
            if(!_event.isPrimary) return
            this.pan.move(_event.clientX, _event.clientY)
        })

        this.renderer.domElement.addEventListener('pointerup', (_event) =>
        {
            if(this.view !== 'top') return
            this.pan.up()
            if(this.renderer.domElement.hasPointerCapture(_event.pointerId)) this.renderer.domElement.releasePointerCapture(_event.pointerId)
        })
        this.renderer.domElement.addEventListener('pointercancel', this.pan.up)
        this.renderer.domElement.addEventListener('lostpointercapture', this.pan.up)
        window.addEventListener('blur', this.pan.up)

        // Time tick event
        this.time.on('tick', () =>
        {
            this.pan.update()

            // Update value and apply easing
            this.pan.value.x += (this.pan.targetValue.x - this.pan.value.x) * this.pan.easing
            this.pan.value.y += (this.pan.targetValue.y - this.pan.value.y) * this.pan.easing
        })
    }

    setOrbitControls()
    {
        // Set up
        this.orbitControls = new OrbitControls(this.instance, this.renderer.domElement)
        this.orbitControls.enabled = this.view === 'orbit'
        this.orbitControls.enableDamping = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        this.orbitControls.enableDamping = false
        this.orbitControls.dampingFactor = .08
        this.orbitControls.screenSpacePanning = false
        this.orbitControls.minDistance = CAMERA_MIN_DISTANCE
        this.orbitControls.maxDistance = CAMERA_MAX_DISTANCE
        this.orbitControls.minPolarAngle = THREE.MathUtils.degToRad(90 - CAMERA_MAX_PITCH)
        this.orbitControls.maxPolarAngle = THREE.MathUtils.degToRad(90 - CAMERA_MIN_PITCH)
        this.orbitControls.enablePan = true
        this.orbitControls.rotateSpeed = .65
        this.orbitControls.zoomSpeed = 0.5
        this.orbitControls.mouseButtons.LEFT = THREE.MOUSE.PAN
        this.orbitControls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
        this.orbitControls.touches.ONE = THREE.TOUCH.PAN
        this.orbitControls.touches.TWO = THREE.TOUCH.DOLLY_PAN
        // Permit pinch via OrbitControls; stop its wheel handler to avoid competing zooms.
        this.orbitControls.enableZoom = true
        this.renderer.domElement.addEventListener('pointerdown', event => {
            this.updateDriving({ manualExploration: true })
            if(this.view === 'first' && !this.driving && event.button === 0)
            {
                this.setView('orbit')
                this.updateChaseCamera()
            }
        }, { capture: true })
        window.addEventListener('keydown', event => {
            if(event.repeat || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || '') || event.target?.isContentEditable) return
            if(event.code === 'KeyC') this.setView(this.view === 'top' ? 'orbit' : 'top')
        })
        this.exploring = false
        let changed = false, wasFollowing = true
        this.orbitControls.addEventListener('start', () =>
        {
            this.updateDriving({ manualExploration: true })
            if(this.driving) return
            this.exploring = true
            changed = false
            wasFollowing = this.following
            this.following = false
            this.collisionOffset.set(0, 0, 0)
            this.exploreZoomTarget = null
            this.renderer.domElement.classList.add('has-cursor-grabbing')
        })
        this.orbitControls.addEventListener('change', () =>
        {
            if(!this.exploring || changed) return
            changed = true
            gsap.killTweensOf(this.angle.value)
            this.time.trigger('cameraControl')
        })
        this.orbitControls.addEventListener('end', () =>
        {
            // Read the current body again if the car stopped during this drag.
            this.updateDriving({ manualExploration: true })
            this.exploring = false
            if(this.driving) this.focusCar()
            else if(!changed) this.following = wasFollowing
            this.renderer.domElement.classList.remove('has-cursor-grabbing')
            this.time.trigger('cameraControl')
        })

        // Debug
        if(this.debug)
        {
            this.debugFolder.add(this.orbitControls, 'enabled').name('orbitControlsEnabled')
        }
    }
}
