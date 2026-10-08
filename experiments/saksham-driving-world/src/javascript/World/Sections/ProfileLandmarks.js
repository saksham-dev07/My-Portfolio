import * as THREE from 'three'
import { groundLayer } from '../GroundLayers.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Keep original materials/textures. Adapt glTF's Y-up into the world's Z-up,
// normalize its real bounds, then derive coarse solid physics from the geometry.
export default class ProfileLandmarks {
    constructor({ objects, time, camera }, container, collisions) {
        this.container = container
        this.physics = objects.physics
        this.collisions = collisions
        this.models = []
        this.campusState = 'idle'
        this.avatarState = 'idle'
        this.pending = new Map()
        const frustum = new THREE.Frustum()
        const viewProjection = new THREE.Matrix4()
        const campusBounds = new THREE.Sphere(new THREE.Vector3(2, -105, 2), 8)
        const avatarBounds = new THREE.Sphere(new THREE.Vector3(2, -73, 2.5), 4)
        let nextCheck = 0
        container.add(new THREE.HemisphereLight('#dae7ff', '#756154', 2.1))
        const sun = new THREE.DirectionalLight('#ffe6c5', 2.8)
        sun.position.set(-30, -60, 70)
        container.add(sun)
        const portraitLight = new THREE.DirectionalLight('#fff4ea', 2.0)
        portraitLight.position.set(0, -90, 25)
        portraitLight.target.position.set(2, -73, 2.5)
        container.add(portraitLight)
        container.add(portraitLight.target)
        // Camera panning is independent of the car: visible landmarks must load
        // even when the visitor explores from the starting line. Check at 4 Hz.
        time.on('tick', () => {
            if (performance.now() < nextCheck) return
            nextCheck = performance.now() + 250
            if (this.campusState !== 'idle' && this.avatarState !== 'idle') return
            const car = this.physics.car.chassis.body.position
            camera.instance.updateMatrixWorld()
            viewProjection.multiplyMatrices(camera.instance.projectionMatrix, camera.instance.matrixWorldInverse)
            frustum.setFromProjectionMatrix(viewProjection)
            if (this.campusState === 'idle' && (Math.hypot(car.x - 2, car.y + 112) < 22 || frustum.intersectsSphere(campusBounds))) this.loadCampus()
            if (this.avatarState === 'idle' && (Math.hypot(car.x - 2, car.y + 80) < 20 || frustum.intersectsSphere(avatarBounds))) this.loadAvatar()
        })
    }

    add(gltf, { name, x, y, width, depth, height, rotation = 0, cells = 5 }) {
        const model = new THREE.Group()
        model.name = name
        const oriented = new THREE.Group()
        oriented.rotation.set(Math.PI / 2, 0, rotation)
        const source = gltf.scene.clone(true)
        source.traverse(node => {
            if (!node.isMesh) return
            const prepare = material => {
                const copy = material.clone()
                // No costly environment capture is needed for these stylized props.
                if ('metalness' in copy) copy.metalness = Math.min(copy.metalness, .25)
                if ('roughness' in copy) copy.roughness = Math.max(copy.roughness, .5)
                return copy
            }
            node.material = Array.isArray(node.material) ? node.material.map(prepare) : prepare(node.material)
        })
        oriented.add(source)
        model.add(oriented)
        let bounds = new THREE.Box3().setFromObject(model)
        const size = bounds.getSize(new THREE.Vector3())
        const factor = Math.min(width / size.x, depth / size.y, height / size.z)
        oriented.scale.setScalar(factor)
        bounds = new THREE.Box3().setFromObject(model)
        const center = bounds.getCenter(new THREE.Vector3())
        oriented.position.set(-center.x, -center.y, -bounds.min.z + .08)
        model.position.set(x, y, 0)
        this.container.add(model)
        model.updateMatrixWorld(true)
        bounds = new THREE.Box3().setFromObject(model)
        const footprint = bounds.getSize(new THREE.Vector3())
        const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: '#343052', transparent: true, opacity: .16, depthWrite: false }))
        shadow.scale.set(footprint.x * .6, footprint.y * .6, 1)
        shadow.position.set(x, y, .025)
        groundLayer(shadow, 'shadow')
        this.container.add(shadow)
        // Sample the mesh's occupied footprint. Empty cells remain drivable;
        // low ground surfaces in the campus are not turned into invisible walls.
        const heights = new Float32Array(cells * cells)
        const stepX = footprint.x / cells, stepY = footprint.y / cells
        const point = new THREE.Vector3()
        model.traverse(node => {
            if (!node.isMesh) return
            const positions = node.geometry.attributes.position
            for (let i = 0; i < positions.count; i++) {
                point.fromBufferAttribute(positions, i).applyMatrix4(node.matrixWorld)
                const ix = THREE.MathUtils.clamp(Math.floor((point.x - bounds.min.x) / stepX), 0, cells - 1)
                const iy = THREE.MathUtils.clamp(Math.floor((point.y - bounds.min.y) / stepY), 0, cells - 1)
                const index = iy * cells + ix
                heights[index] = Math.max(heights[index], point.z)
            }
        })
        const solids = []
        for (let iy = 0; iy < cells; iy++) for (let ix = 0; ix < cells; ix++) {
            const h = heights[iy * cells + ix]
            if (h < .55) continue
            const box = new THREE.Object3D()
            box.name = 'box'
            box.scale.set(stepX, stepY, h)
            box.position.set(bounds.min.x - x + (ix + .5) * stepX, bounds.min.y - y + (iy + .5) * stepY, h / 2)
            solids.push(box)
        }
        if (solids.length) this.collisions.push(this.physics.addObjectFromThree({ meshes: solids, offset: new THREE.Vector3(x, y, 0), rotation: new THREE.Euler(), mass: 0, sleep: true }))
        this.models.push({ name, model, bounds, solids: solids.length })
        return model
    }

    loadCampus() {
        if (this.campusState === 'loading' || this.campusState === 'ready') return
        this.campusState = 'loading'
        this.report('campus', 'Loading VIT Bhopal…')
        new GLTFLoader().load('./saksham/models/vit-bhopal.glb', gltf => {
            this.add(gltf, { name: 'VIT Bhopal · supplied campus model', x: 2, y: -105, width: 13, depth: 8, height: 6, cells: 8 })
            this.campusState = 'ready'
            this.report('campus', '')
        }, event => this.progress('campus', 'VIT Bhopal', event), () => {
            this.campusState = 'error'
            this.report('campus', 'Campus artwork unavailable. Select Education in World Map to retry.')
        })
    }

    loadAvatar() {
        if (this.avatarState === 'loading' || this.avatarState === 'ready') return
        this.avatarState = 'loading'
        this.report('avatar', 'Loading Saksham’s portrait…')
        new GLTFLoader().load('./saksham/models/saksham-face.glb', gltf => {
            this.add(gltf, { name: 'Saksham · original portrait', x: 2, y: -73, width: 4.5, depth: 4.5, height: 5, cells: 5 })
            this.avatarState = 'ready'
            this.report('avatar', '')
        }, event => this.progress('avatar', 'Saksham’s portrait', event), () => {
            this.avatarState = 'error'
            this.report('avatar', 'Portrait unavailable. Select About in World Map to retry.')
        })
    }

    progress(id, name, event) {
        if (!event.total) return
        const percent = Math.round(event.loaded / event.total * 100)
        this.report(id, percent === 100 ? `Preparing ${name}…` : `Loading ${name}… ${percent}%`)
    }

    report(id, message) {
        if (message) this.pending.set(id, message)
        else this.pending.delete(id)
        window.dispatchEvent(new CustomEvent('drive-model', { detail: [...this.pending.values()].join(' · ') }))
    }
}
