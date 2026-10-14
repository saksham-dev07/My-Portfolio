import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { vehiclePose } from './VehiclePose.js'
import { duskUniforms, updateHeadlightUniforms } from './DuskLighting.js'
import { updateMeadowCarInteraction } from './MeadowEnvironment.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

export default class Car
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.physics = _options.physics
        this.shadows = _options.shadows
        this.materials = _options.materials
        this.controls = _options.controls
        this.sounds = _options.sounds
        this.renderer = _options.renderer
        this.camera = _options.camera
        this.debug = _options.debug
        this.config = _options.config

        // Set up
        this.container = new THREE.Object3D()
        this.position = new THREE.Vector3()
        this.vehicleId = this.config?.cyberTruck ? 'cybertruck' : 'default'

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('car')
            // this.debugFolder.open()
        }

        this.setModels()
        this.setMovement()
        this.setChassis()
        this.setAntena()
        this.setBackLights()
        this.setHeadLights()
        this.setBoostFlames()
        this.setWheels()
        this.setTransformControls()
        this.setShootingBall()
        this.setKlaxon()
    }

    getVehicleInfo()
    {
        const isCyber = Boolean(this.config?.cyberTruck)
        return {
            id: isCyber ? 'cybertruck' : 'default',
            label: isCyber ? 'CyberTruck' : 'Trail Jeep',
            shortLabel: isCyber ? 'Cyber' : 'Jeep',
            cyberTruck: isCyber,
        }
    }

    setModels()
    {
        this.models = {}

        // Cyber truck
        if(this.config.cyberTruck)
        {
            this.models.chassis = this.resources.items.carCyberTruckChassis
            this.models.antena = this.resources.items.carCyberTruckAntena
            this.models.backLightsBrake = this.resources.items.carCyberTruckBackLightsBrake
            this.models.backLightsReverse = this.resources.items.carCyberTruckBackLightsReverse
            this.models.wheel = this.resources.items.carCyberTruckWheel
        }

        // Default
        else
        {
            this.models.chassis = this.resources.items.carDefaultChassis
            this.models.antena = this.resources.items.carDefaultAntena
            this.models.backLightsBrake = this.resources.items.carDefaultBackLightsBrake
            this.models.backLightsReverse = this.resources.items.carDefaultBackLightsReverse
            this.models.wheel = this.resources.items.carDefaultWheel
        }
    }

    setVehicle(kind)
    {
        const nextCyber = kind === 'cybertruck' || kind === true
        this.config.cyberTruck = nextCyber
        this.vehicleId = nextCyber ? 'cybertruck' : 'default'
        this.setModels()

        // Always pass { duplicated: true } so Objects.getConvertedMesh clones
        // source GLTF meshes instead of reparenting/emptying the resource scene!
        if(this.chassis?.object && this.models.chassis?.scene)
        {
            if(this.chassis.bodyChildren)
            {
                for(const child of this.chassis.bodyChildren)
                {
                    this.chassis.object.remove(child)
                }
            }
            const nextChassis = this.objects.getConvertedMesh(this.models.chassis.scene.children, { duplicated: true })
            this.chassis.bodyChildren = [...nextChassis.children]
            for(const child of this.chassis.bodyChildren)
            {
                this.chassis.object.add(child)
            }
        }

        // 2. Swap antenna mesh
        if(this.antena?.object && this.models.antena?.scene)
        {
            this.chassis.object.remove(this.antena.object)
            this.antena.object = this.objects.getConvertedMesh(this.models.antena.scene.children, { duplicated: true })
            this.chassis.object.add(this.antena.object)
        }

        // 3. Swap brake and reverse backLights meshes
        if(this.backLightsBrake?.object && this.models.backLightsBrake?.scene)
        {
            this.chassis.object.remove(this.backLightsBrake.object)
            this.backLightsBrake.object = this.objects.getConvertedMesh(this.models.backLightsBrake.scene.children, { duplicated: true })
            for(const _child of this.backLightsBrake.object.children)
            {
                _child.material = this.backLightsBrake.material
            }
            this.chassis.object.add(this.backLightsBrake.object)
        }
        if(this.backLightsReverse?.object && this.models.backLightsReverse?.scene)
        {
            this.chassis.object.remove(this.backLightsReverse.object)
            this.backLightsReverse.object = this.objects.getConvertedMesh(this.models.backLightsReverse.scene.children, { duplicated: true })
            for(const _child of this.backLightsReverse.object.children)
            {
                _child.material = this.backLightsReverse.material
            }
            this.chassis.object.add(this.backLightsReverse.object)
        }

        // 4. Swap wheel meshes inside the 4 persistent wheel Object3Ds
        if(this.wheels?.items && this.models.wheel?.scene)
        {
            this.wheels.object = this.objects.getConvertedMesh(this.models.wheel.scene.children, { duplicated: true })
            for(let i = 0; i < this.wheels.items.length; i++)
            {
                const wheelHolder = this.wheels.items[i]
                for(const oldChild of [...wheelHolder.children])
                {
                    wheelHolder.remove(oldChild)
                }
                const clonedWheel = this.wheels.object.clone()
                for(const child of [...clonedWheel.children])
                {
                    wheelHolder.add(child)
                }
            }
        }

        // Subtle suspension hop & sound feedback on swap
        this.physics?.car?.jump?.(false, 60)
        this.sounds?.play?.('carHorn1')

        const info = this.getVehicleInfo()
        if(typeof window !== 'undefined')
        {
            const evt = typeof CustomEvent === 'function'
                ? new CustomEvent('drive-vehicle-change', { detail: info })
                : { type: 'drive-vehicle-change', detail: info }
            window.dispatchEvent?.(evt)
        }
        return info
    }

    toggleVehicle()
    {
        return this.setVehicle(this.config.cyberTruck ? 'default' : 'cybertruck')
    }

    setMovement()
    {
        this.movement = {}
        this.movement.speed = new THREE.Vector3()
        this.movement.localSpeed = new THREE.Vector3()
        this.movement.acceleration = new THREE.Vector3()
        this.movement.localAcceleration = new THREE.Vector3()
        this.movement.lastScreech = 0

        // Time tick
        this.time.on('tick', () =>
        {
            // Movement
            const movementSpeed = new THREE.Vector3()
            movementSpeed.copy(this.chassis.object.position).sub(this.chassis.oldPosition)
            movementSpeed.multiplyScalar(1 / this.time.delta * 17)
            this.movement.acceleration = movementSpeed.clone().sub(this.movement.speed)
            this.movement.speed.copy(movementSpeed)

            this.movement.localSpeed = this.movement.speed.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), - this.chassis.object.rotation.z)
            this.movement.localAcceleration = this.movement.acceleration.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), - this.chassis.object.rotation.z)

            // Sound
            this.sounds.engine.speed = this.movement.localSpeed.x
            this.sounds.engine.acceleration = this.controls.actions.up ? (this.controls.actions.boost ? 1 : 0.5) : 0

            if(this.movement.localAcceleration.x > 0.03 && this.time.elapsed - this.movement.lastScreech > 5000)
            {
                this.movement.lastScreech = this.time.elapsed
                this.sounds.play('screech')
            }
        })
    }

    setChassis()
    {
        this.chassis = {}
        this.chassis.offset = new THREE.Vector3(0, 0, - 0.28)
        this.chassis.object = this.objects.getConvertedMesh(this.models.chassis.scene.children, { duplicated: true })
        this.chassis.bodyChildren = [...(this.chassis.object.children || [])]
        this.chassis.object.position.copy(this.physics.car.chassis.body.position)
        this.chassis.oldPosition = this.chassis.object.position.clone()
        this.container.add(this.chassis.object)

        this.shadows.add(this.chassis.object, { sizeX: 3, sizeY: 2, offsetZ: 0.2 })

        // Time tick
        this.time.on('tick', () =>
        {
            // Save old position for movement calculation
            this.chassis.oldPosition = this.chassis.object.position.clone()

            // Update if mode physics
            if(!this.transformControls.enabled)
            {
                vehiclePose(this.chassis.object, this.physics.car.chassis.body, this.physics.world)
                this.chassis.object.position.add(this.chassis.offset)
            }

            // Update position
            this.position.copy(this.chassis.object.position)
            updateHeadlightUniforms(this.chassis.object.position, this.chassis.object.rotation.z)
            updateMeadowCarInteraction(
                this.chassis.object.position,
                this.physics.car?.chassis?.body?.velocity || this.movement?.speed,
                this.chassis.object.rotation.z,
                Math.min(this.time.delta || 16.667, 100) / 1000
            )
        })
    }

    setAntena()
    {
        this.antena = {}

        this.antena.speedStrength = 10
        this.antena.damping = 0.035
        this.antena.pullBackStrength = 0.02

        this.antena.object = this.objects.getConvertedMesh(this.models.antena.scene.children, { duplicated: true })
        this.chassis.object.add(this.antena.object)

        this.antena.speed = new THREE.Vector2()
        this.antena.absolutePosition = new THREE.Vector2()
        this.antena.localPosition = new THREE.Vector2()

        // Time tick
        this.time.on('tick', () =>
        {
            const max = 1
            const accelerationX = Math.min(Math.max(this.movement.acceleration.x, - max), max)
            const accelerationY = Math.min(Math.max(this.movement.acceleration.y, - max), max)

            this.antena.speed.x -= accelerationX * this.antena.speedStrength
            this.antena.speed.y -= accelerationY * this.antena.speedStrength

            const position = this.antena.absolutePosition.clone()
            const pullBack = position.negate().multiplyScalar(position.length() * this.antena.pullBackStrength)
            this.antena.speed.add(pullBack)

            this.antena.speed.x *= 1 - this.antena.damping
            this.antena.speed.y *= 1 - this.antena.damping

            this.antena.absolutePosition.add(this.antena.speed)

            this.antena.localPosition.copy(this.antena.absolutePosition)
            this.antena.localPosition.rotateAround(new THREE.Vector2(), - this.chassis.object.rotation.z)

            this.antena.object.rotation.y = this.antena.localPosition.x * 0.1
            this.antena.object.rotation.x = this.antena.localPosition.y * 0.1
        })

        // Debug
        if(this.debug)
        {
            const folder = this.debugFolder.addFolder('antena')
            folder.open()

            folder.add(this.antena, 'speedStrength').step(0.001).min(0).max(50)
            folder.add(this.antena, 'damping').step(0.0001).min(0).max(0.1)
            folder.add(this.antena, 'pullBackStrength').step(0.0001).min(0).max(0.1)
        }
    }

    setBackLights()
    {
        this.backLightsBrake = {}

        this.backLightsBrake.material = this.materials.pures.items.red.clone()
        this.backLightsBrake.material.transparent = true
        this.backLightsBrake.material.opacity = 0.5

        this.backLightsBrake.object = this.objects.getConvertedMesh(this.models.backLightsBrake.scene.children, { duplicated: true })
        for(const _child of this.backLightsBrake.object.children)
        {
            _child.material = this.backLightsBrake.material
        }

        this.chassis.object.add(this.backLightsBrake.object)

        // Back lights brake
        this.backLightsReverse = {}

        this.backLightsReverse.material = this.materials.pures.items.yellow.clone()
        this.backLightsReverse.material.transparent = true
        this.backLightsReverse.material.opacity = 0.5

        this.backLightsReverse.object = this.objects.getConvertedMesh(this.models.backLightsReverse.scene.children, { duplicated: true })
        for(const _child of this.backLightsReverse.object.children)
        {
            _child.material = this.backLightsReverse.material
        }

        this.chassis.object.add(this.backLightsReverse.object)

        // Time tick
        this.time.on('tick', () =>
        {
            this.backLightsBrake.material.opacity = (this.physics.controls.actions.brake || this.physics.controls.actions.boost) ? 1 : 0.5
            this.backLightsReverse.material.opacity = this.physics.controls.actions.down ? 1 : 0.5
        })
    }

    setHeadLights()
    {
        this.headLights = {}
        this.headLights.group = new THREE.Group()
        this.headLights.group.name = 'Car headlights and volumetric cones'
        this.headLights.group.userData.cameraCollision = false

        this.headLights.lensMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color('#fff5d6').convertLinearToSRGB(),
            transparent: true,
            opacity: 0.92,
        })
        this.headLights.lensMaterial.userData.duskEmission = true

        this.headLights.coneMaterial = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            uniforms: {
                uStrength: { value: duskUniforms.duskHeadlightStrength.value },
            },
            vertexShader: `
                varying vec2 vConeUv;
                void main() {
                    vConeUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vConeUv;
                uniform float uStrength;
                void main() {
                    float along = 1.0 - vConeUv.x;
                    float across = abs(vConeUv.y - 0.5) * 2.0;
                    float edge = smoothstep(1.0, 0.15, across);
                    float fade = pow(max(0.0, along), 1.8) * smoothstep(0.0, 0.12, 1.0 - along);
                    float alpha = edge * fade * 0.22 * uStrength;
                    gl_FragColor = vec4(vec3(1.0, 0.92, 0.72), alpha);
                }
            `,
        })
        this.headLights.coneMaterial.userData.duskEmission = true

        const lensGeometry = new THREE.BoxGeometry(0.08, 0.22, 0.12)
        const coneGeometry = new THREE.PlaneGeometry(4.6, 1.65)
        coneGeometry.translate(2.3, 0, 0)

        for(const side of [-1, 1])
        {
            const yOffset = side * 0.44
            const lens = new THREE.Mesh(lensGeometry, this.headLights.lensMaterial)
            lens.position.set(1.08, yOffset, 0.44)
            lens.userData.cameraCollision = false
            this.headLights.group.add(lens)

            const beam = new THREE.Mesh(coneGeometry, this.headLights.coneMaterial)
            beam.position.set(1.1, yOffset, 0.36)
            beam.rotation.y = 0.08
            beam.rotation.z = side * 0.04
            beam.userData.cameraCollision = false
            this.headLights.group.add(beam)
        }

        this.chassis.object.add(this.headLights.group)
        this.setHeadlightMode({ headlightStrength: duskUniforms.duskHeadlightStrength.value })
    }

    setHeadlightMode(preset = {})
    {
        if(!this.headLights) return
        const strength = preset.headlightStrength ?? duskUniforms.duskHeadlightStrength.value ?? 0
        this.headLights.group.visible = strength > 0.01
        this.headLights.coneMaterial.uniforms.uStrength.value = strength
        this.headLights.lensMaterial.opacity = Math.min(1, 0.55 + strength * 0.4)
    }

    setBoostFlames()
    {
        this.boostFlames = {}
        this.boostFlames.group = new THREE.Group()
        this.boostFlames.group.name = 'Car boost afterburners'
        this.boostFlames.group.visible = false
        this.boostFlames.group.userData.cameraCollision = false
        this.boostFlames.outerMaterial = new THREE.MeshBasicMaterial({
            color: 0xff7b29,
            transparent: true,
            opacity: 0.78,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })
        this.boostFlames.outerMaterial.userData.duskEmission = true
        this.boostFlames.coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xfff2a6,
            transparent: true,
            opacity: 0.92,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })
        this.boostFlames.coreMaterial.userData.duskEmission = true

        const outerGeo = new THREE.ConeGeometry(0.11, 0.58, 8)
        outerGeo.rotateZ(Math.PI * 0.5)
        outerGeo.translate(-0.29, 0, 0)
        const coreGeo = new THREE.ConeGeometry(0.06, 0.34, 8)
        coreGeo.rotateZ(Math.PI * 0.5)
        coreGeo.translate(-0.17, 0, 0)

        this.boostFlames.nozzles = []
        for(const side of [-1, 1])
        {
            const nozzle = new THREE.Group()
            nozzle.position.set(-1.14, side * 0.28, 0.24)
            const outer = new THREE.Mesh(outerGeo, this.boostFlames.outerMaterial)
            const core = new THREE.Mesh(coreGeo, this.boostFlames.coreMaterial)
            outer.userData.cameraCollision = false
            core.userData.cameraCollision = false
            nozzle.add(outer, core)
            this.boostFlames.group.add(nozzle)
            this.boostFlames.nozzles.push(nozzle)
        }

        this.chassis.object.add(this.boostFlames.group)

        this.time.on('tick', () =>
        {
            const boosting = Boolean(
                this.controls?.actions?.boost &&
                (this.controls?.actions?.up || this.controls?.actions?.down || Math.abs(this.movement?.localSpeed?.x || 0) > 0.08)
            )
            this.boostFlames.group.visible = boosting
            if(boosting)
            {
                const t = (this.time.elapsed || 0) * 0.028
                for(let i = 0; i < this.boostFlames.nozzles.length; i++)
                {
                    const pulse = 0.85 + Math.sin(t + i * 2.1) * 0.28
                    this.boostFlames.nozzles[i].scale.set(pulse, 0.9 + Math.cos(t * 1.3 + i) * 0.14, 0.9 + Math.sin(t * 1.7) * 0.14)
                }
            }
        })
    }

    setWheels()
    {
        this.wheels = {}
        this.wheels.object = this.objects.getConvertedMesh(this.models.wheel.scene.children, { duplicated: true })
        this.wheels.items = []

        for(let i = 0; i < 4; i++)
        {
            const object = this.wheels.object.clone()

            this.wheels.items.push(object)
            this.container.add(object)
        }

        // Time tick
        this.time.on('tick', () =>
        {
            if(!this.transformControls.enabled)
            {
                for(const _wheelKey in this.physics.car.wheels.bodies)
                {
                    const wheelBody = this.physics.car.wheels.bodies[_wheelKey]
                    const wheelObject = this.wheels.items[_wheelKey]

                    vehiclePose(wheelObject, wheelBody, this.physics.world)
                }
            }
        })
    }

    setTransformControls()
    {
        this.transformControls = new TransformControls(this.camera.instance, this.renderer.domElement)
        this.transformControls.size = 0.5
        this.transformControls.attach(this.chassis.object)
        this.transformControls.enabled = false
        this.transformControlsHelper = this.transformControls.getHelper()
        this.transformControlsHelper.visible = this.transformControls.enabled

        document.addEventListener('keydown', (_event) =>
        {
            if(this.mode === 'transformControls')
            {
                if(_event.key === 'r')
                {
                    this.transformControls.setMode('rotate')
                }
                else if(_event.key === 'g')
                {
                    this.transformControls.setMode('translate')
                }
            }
        })

        this.transformControls.addEventListener('dragging-changed', (_event) =>
        {
            this.camera.orbitControls.enabled = !_event.value
        })

        this.container.add(this.transformControlsHelper)

        if(this.debug)
        {
            const folder = this.debugFolder.addFolder('controls')
            folder.open()

            folder.add(this.transformControls, 'enabled').onChange(() =>
            {
                this.transformControlsHelper.visible = this.transformControls.enabled
            })
        }
    }

    setShootingBall()
    {
        window.addEventListener('keydown', (_event) =>
        {
            if(_event.key === 'b' && this.config?.cyberTruck)
            {
                const angle = Math.random() * Math.PI * 2
                const distance = 10
                const x = this.position.x + Math.cos(angle) * distance
                const y = this.position.y + Math.sin(angle) * distance
                const z = 2 + 2 * Math.random()
                const bowlingBall = this.objects.add({
                    base: this.resources.items.bowlingBallBase.scene,
                    collision: this.resources.items.bowlingBallCollision.scene,
                    offset: new THREE.Vector3(x, y, z),
                    rotation: new THREE.Euler(Math.PI * 0.5, 0, 0),
                    duplicated: true,
                    shadow: { sizeX: 1.5, sizeY: 1.5, offsetZ: - 0.15, alpha: 0.35 },
                    mass: 5,
                    soundName: 'bowlingBall',
                    sleep: false
                })

                const carPosition = new CANNON.Vec3(this.position.x, this.position.y, this.position.z + 1)
                let direction = carPosition.vsub(bowlingBall.collision.body.position)
                direction.normalize()
                direction = direction.scale(100)
                bowlingBall.collision.body.applyImpulse(direction, new CANNON.Vec3(0, 0, 0))
            }
        })
    }

    setKlaxon()
    {
        this.klaxon = {}
        this.klaxon.lastTime = this.time.elapsed

        window.addEventListener('keydown', (_event) =>
        {
            // Play horn sound
            if(_event.code === 'KeyH')
            {
                if(this.time.elapsed - this.klaxon.lastTime > 400)
                {
                    this.physics.car.jump(false, 150)
                    this.klaxon.lastTime = this.time.elapsed
                }

                this.sounds.play(Math.random() < 0.002 ? 'carHorn2' : 'carHorn1')
            }

            // Rain horns
            if(_event.key === 'k')
            {
                const x = this.position.x + (Math.random() - 0.5) * 3
                const y = this.position.y + (Math.random() - 0.5) * 3
                const z = 6 + 2 * Math.random()

                this.objects.add({
                    base: this.resources.items.hornBase.scene,
                    collision: this.resources.items.hornCollision.scene,
                    offset: new THREE.Vector3(x, y, z),
                    rotation: new THREE.Euler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2),
                    duplicated: true,
                    shadow: { sizeX: 1.5, sizeY: 1.5, offsetZ: - 0.15, alpha: 0.35 },
                    mass: 5,
                    soundName: 'horn',
                    sleep: false
                })
            }
        })
    }
}
