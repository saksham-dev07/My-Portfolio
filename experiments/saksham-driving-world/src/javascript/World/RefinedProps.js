import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { modelLoader } from '../Utils/ModelLoader.js'

export const refinedPropsUrl = './saksham/models/refined-props.glb'
export const refinedKinds = ['bed', 'chest', 'rack', 'bench', 'lamp', 'workshop-lamp', 'banner-stand', 'link-portfolio', 'link-github', 'link-linkedin', 'link-mail']

// Promote quantized attributes to float BEFORE baking transforms. Applying a
// metre-scale matrix directly to a normalized integer buffer can wrap vertices.
// Keep Blender's weighted/split normals instead of recomputing faceted normals.
export function refinedGeometry(scene, kind) {
    scene.updateMatrixWorld(true)
    const node = scene.getObjectByName(kind)
    if (!node?.isMesh || node.userData.assetVersion !== 2 || node.userData.design?.kind !== kind) throw new Error(`Missing refined prop: ${kind}`)
    const source = node.geometry, index = source.index, count = index?.count ?? source.attributes.position.count
    const attributes = {}, color = new THREE.Color()
    for (const name of ['position', 'normal', 'color']) {
        const attribute = source.getAttribute(name)
        if (!attribute) throw new Error(`Missing ${name} on ${kind}`)
        const values = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            const j = index ? index.getX(i) : i
            const x = attribute.getX(j), y = attribute.getY(j), z = attribute.getZ(j)
            if (name === 'color') {
                color.setRGB(x, y, z).convertLinearToSRGB(); values.set([color.r, color.g, color.b], i * 3)
            } else values.set([x, y, z], i * 3)
        }
        attributes[name] = new THREE.BufferAttribute(values, 3)
    }
    const geometry = new THREE.BufferGeometry()
    for (const [name, attribute] of Object.entries(attributes)) geometry.setAttribute(name, attribute)
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2).multiply(node.matrixWorld))
    geometry.computeBoundingBox(); geometry.computeBoundingSphere()
    if (geometry.boundingBox.min.z < -.005 || count / 3 > 3500 || !attributes.position.array.every(Number.isFinite)) {
        geometry.dispose(); throw new Error(`Invalid refined prop bounds: ${kind}`)
    }
    return { geometry, boxes: node.userData.collisionBoxes, design: node.userData.design }
}

export function refinedPlacement(scene, placements) {
    const prototypes = new Map(), parts = [], solids = []
    try {
        for (const p of placements) {
            if (!prototypes.has(p.kind)) prototypes.set(p.kind, refinedGeometry(scene, p.kind))
            const source = prototypes.get(p.kind), transform = new THREE.Matrix4().compose(
                new THREE.Vector3(p.x, p.y, p.z || 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), p.angle || 0), new THREE.Vector3(p.mirrorX || 1, 1, 1))
            const geometry = source.geometry.clone().applyMatrix4(transform)
            if (transform.determinant() < 0) for (const attribute of Object.values(geometry.attributes)) {
                for (let i = 0; i < attribute.count; i += 3) for (let channel = 0; channel < 3; channel++) {
                    const a = (i + 1) * 3 + channel, b = (i + 2) * 3 + channel, value = attribute.array[a]
                    attribute.array[a] = attribute.array[b]; attribute.array[b] = value
                }
            }
            parts.push(geometry)
            for (const box of source.boxes || []) {
                const proxy = new THREE.Object3D(); proxy.name = 'box'; proxy.userData.feature = p.id || p.kind
                proxy.position.fromArray(box.center).applyMatrix4(transform); proxy.rotation.z = p.angle || 0
                proxy.scale.fromArray(box.size); solids.push(proxy)
            }
        }
        const geometry = mergeGeometries(parts)
        if (!geometry) throw new Error('Could not merge refined props')
        geometry.computeBoundingBox(); geometry.computeBoundingSphere()
        return { geometry, solids }
    } finally {
        parts.forEach(part => part.dispose()); prototypes.forEach(source => source.geometry.dispose())
    }
}

// Both districts and link sculptures share one cached transfer. The core world
// starts first; optional artwork loads when its reserved region enters view.
export default class RefinedPropBatch {
    constructor({ name, placements, objects, camera, time, container, collisions, loader = modelLoader, url = refinedPropsUrl, onReady = () => {} }) {
        Object.assign(this, { name, placements, objects, camera, time, container, collisions, loader, url, onReady })
        this.state = 'idle'; this.nextCheck = 0; this.solids = []; this.disposed = false
        this.frustum = new THREE.Frustum(); this.matrix = new THREE.Matrix4()
        this.regions = placements.map(p => new THREE.Sphere(new THREE.Vector3(p.x, p.y, (p.z || 0) + 1.6), p.radius || 3))
        time?.on(`tick.${name}`, () => {
            if (this.disposed || this.state !== 'idle' || time.elapsed < this.nextCheck || !camera?.instance) return
            this.nextCheck = time.elapsed + 300
            camera.instance.updateMatrixWorld()
            this.matrix.multiplyMatrices(camera.instance.projectionMatrix, camera.instance.matrixWorldInverse)
            this.frustum.setFromProjectionMatrix(this.matrix)
            if (this.regions.some(region => this.frustum.intersectsSphere(region))) this.load()
        })
    }

    load() {
        if (this.disposed || this.state !== 'idle') return
        this.state = 'loading'
        this.loader.load(this.url, gltf => {
            if (this.disposed) return
            try {
                const item = refinedPlacement(gltf.scene, this.placements)
                const matcap = this.objects.materials?.shades?.items?.white?.uniforms?.matcap?.value
                this.material = matcap ? new THREE.MeshMatcapMaterial({ matcap, vertexColors: true }) : new THREE.MeshBasicMaterial({ vertexColors: true })
                this.mesh = new THREE.Mesh(item.geometry, this.material); this.mesh.name = `${this.name} / Blender artwork`
                this.container.add(this.mesh); this.solids = item.solids
                if(this.solids.length) this.collision = this.objects.physics.addObjectFromThree({ meshes: this.solids, offset: new THREE.Vector3(), rotation: new THREE.Euler(), mass: 0, sleep: true })
                if(this.collision) this.collisions?.push(this.collision)
                this.state = 'ready'; this.time?.off(`tick.${this.name}`); this.onReady(this, gltf.scene)
            } catch (error) { this.state = 'error'; this.error = error.message }
        }, undefined, error => { if (!this.disposed) { this.state = 'error'; this.error = error?.message || 'Model unavailable' } })
    }

    dispose() {
        if (this.disposed) return
        this.disposed = true; this.time?.off(`tick.${this.name}`)
        this.mesh?.removeFromParent(); this.mesh?.geometry.dispose(); this.material?.dispose()
        this.collision?.body?.world?.removeBody?.(this.collision.body)
    }
}
