import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'

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
        this.instance = new THREE.PerspectiveCamera(40, this.sizes.viewport.width / this.sizes.viewport.height, 1, 300)
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
            if(this.following)
            {
                this.targetEased.x += (this.target.x - this.targetEased.x) * this.easing
                this.targetEased.y += (this.target.y - this.targetEased.y) * this.easing
                this.targetEased.z += (this.target.z - this.targetEased.z) * this.easing

                // Apply zoom
                this.viewOffset.copy(this.angle.value).normalize().multiplyScalar(this.zoom.distance).add(this.targetEased)
                this.returnProgress = Math.min(1, this.returnProgress + Math.min(this.time.delta || 16, 60) / 650)
                const blend = 1 - (1 - this.returnProgress) ** 3
                this.instance.position.lerpVectors(this.returnPosition, this.viewOffset, blend)
                this.orbitControls.target.lerpVectors(this.returnLook, this.targetEased, blend)
                this.instance.lookAt(this.orbitControls.target)
            }
            this.orbitControls.update()
        })
    }

    getCarBody()
    {
        // Reset recreates the chassis; resolve its current body every frame.
        return this.car?.chassis?.body || this.carBody
    }

    updateDriving()
    {
        // Horizontal speed includes coasting, while ignoring suspension motion.
        // Separate thresholds and a short stop delay avoid camera-mode chatter.
        const body = this.getCarBody()
        const speed = Math.hypot(body?.velocity?.x || 0, body?.velocity?.y || 0)
        let driving = this.driving || speed > .18
        if(driving)
        {
            this.stationaryTime = speed < .05 ? this.stationaryTime + Math.min(this.time.delta || 16, 60) / 1000 : 0
            if(this.stationaryTime >= .3) driving = false
        }
        const changed = driving !== this.driving
        this.driving = driving
        if(driving && !this.following && !this.exploring) this.focusCar()
        this.orbitControls.enabled = true
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
        this.pan.up()
        this.pan.reset()
        this.pan.value.x = 0
        this.pan.value.y = 0
        this.orbitControls.enabled = view === 'orbit'
        this.following = true
        this.returnProgress = 1
        this.instance.up.set(0, view === 'top' ? 1 : 0, view === 'top' ? 0 : 1)
        this.instance.fov = view === 'first' ? 72 : 40
        this.instance.near = view === 'first' ? 0.05 : 1
        this.instance.far = view === 'top' ? 3000 : 300
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
            this.orbitControls.enableDamping = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
        this.orbitControls.enableDamping = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

        // Top-view zoom; OrbitControls owns zoom in the perspective view.
        this.renderer.domElement.addEventListener('wheel', (_event) =>
        {
            if(this.view !== 'top') return
            _event.preventDefault()
            this.zoom.targetValue += _event.deltaY * 0.001
            this.zoom.targetValue = Math.min(Math.max(this.zoom.targetValue, 0), 1)
        }, { passive: false })

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
        this.orbitControls.dampingFactor = .08
        this.orbitControls.screenSpacePanning = false
        this.orbitControls.minDistance = 8
        this.orbitControls.maxDistance = 160
        this.orbitControls.maxPolarAngle = Math.PI / 2 - .08
        this.orbitControls.rotateSpeed = .65
        this.orbitControls.zoomSpeed = 0.5
        this.orbitControls.mouseButtons.LEFT = THREE.MOUSE.PAN
        this.orbitControls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
        this.orbitControls.touches.ONE = THREE.TOUCH.PAN
        this.exploring = false
        let changed = false, wasFollowing = true
        this.orbitControls.addEventListener('start', () =>
        {
            this.exploring = true
            changed = false
            wasFollowing = this.following
            this.following = false
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
