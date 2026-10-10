import * as THREE from 'three'
import CANNON from 'cannon'
import { modelLoader } from '../Utils/ModelLoader.js'
import { activityPropGeometry } from './ActivityProps.js'
import { surfaceHeight } from './LandscapeLayout.js'
import { groundLayer } from './GroundLayers.js'

export const courtyardPlacements = Object.freeze([
    { id: 'arrival', x: 0, y: 7, width: 10, depth: 4, height: 4.2 },
    { id: 'maker', x: 34.5, y: -110, width: 2.8, depth: 2.6, height: 2.5 },
])

export function courtyardAssets(scene) {
    scene.updateMatrixWorld(true)
    const items = []
    try {
        let triangles = 0
        for (const placement of courtyardPlacements) {
            const source = scene.getObjectByName(placement.id)
            if (!source?.isMesh || source.userData.design?.kind !== placement.id) throw new Error('Missing courtyard design')
            const boxes = source.userData.collisionBoxes
            if (!Array.isArray(boxes) || !boxes.length || boxes.length > 16) throw new Error('Invalid courtyard proxies')
            for (const box of boxes) {
                if (![box.center, box.size].every(v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite)) || box.size.some(v => v <= 0)) throw new Error('Invalid courtyard proxy dimensions')
            }
            const geometry = activityPropGeometry(source)
            items.push({ placement, geometry, boxes, design: source.userData.design })
            const bounds = geometry.boundingBox, size = bounds.getSize(new THREE.Vector3())
            triangles += geometry.attributes.position.count / 3
            if (bounds.min.z < -.005 || size.x > placement.width + .01 || size.y > placement.depth + .01 || bounds.max.z > placement.height || size.z < .5 || triangles > 5000) throw new Error('Courtyard artwork exceeds its reserved footprint')
            for (const box of boxes) for (let axis = 0; axis < 3; axis++) {
                const key = ['x', 'y', 'z'][axis]
                if (box.center[axis] - box.size[axis] / 2 < bounds.min[key] - .03 || box.center[axis] + box.size[axis] / 2 > bounds.max[key] + .03) throw new Error('Courtyard proxy extends outside the artwork')
            }
        }
        return items
    } catch (error) {
        items.forEach(item => item.geometry.dispose())
        throw error
    }
}

export function courtyardBody(item, material) {
    const p = item.placement
    const body = new CANNON.Body({ mass: 0, material, position: new CANNON.Vec3(p.x, p.y, surfaceHeight(p.x, p.y)) })
    for (const box of item.boxes) body.addShape(new CANNON.Box(new CANNON.Vec3(...box.size.map(v => v / 2))), new CANNON.Vec3(...box.center))
    return body
}

function disposeSource(scene) {
    const geometry = new Set(), material = new Set(), texture = new Set()
    scene.traverse(node => {
        if (!node.isMesh) return
        geometry.add(node.geometry)
        for (const mat of Array.isArray(node.material) ? node.material : [node.material]) {
            material.add(mat)
            for (const value of Object.values(mat)) if (value?.isTexture) texture.add(value)
        }
    })
    texture.forEach(value => value.dispose())
    geometry.forEach(value => value.dispose())
    material.forEach(value => value.dispose())
}

// Small optional scenery, never part of the core loading barrier. The arrival
// view normally requests the single texture-free kit after entering the world.
export default class CourtyardProps {
    constructor({ container, objects, camera, time, loader = modelLoader, document: page = globalThis.document }) {
        Object.assign(this, { container, objects, camera, time, loader, document: page })
        this.state = 'idle'
        this.disposed = false
        this.items = []
        this.nextCheck = time.elapsed + 750
        this.frustum = new THREE.Frustum()
        this.matrix = new THREE.Matrix4()
        this.regions = courtyardPlacements.map(p => new THREE.Sphere(new THREE.Vector3(p.x, p.y, p.height / 2), Math.hypot(p.width, p.depth) / 2))
        time.on('tick.courtyardProps', () => this.checkLoad())
    }

    checkLoad() {
        if (this.disposed || this.state !== 'idle' || this.time.elapsed < this.nextCheck) return
        this.nextCheck = this.time.elapsed + 500
        this.camera.instance.updateMatrixWorld()
        this.matrix.multiplyMatrices(this.camera.instance.projectionMatrix, this.camera.instance.matrixWorldInverse)
        this.frustum.setFromProjectionMatrix(this.matrix)
        if (!this.regions.some(region => this.frustum.intersectsSphere(region))) return
        this.state = 'loading'
        this.loader.load('./saksham/models/courtyard-kit.glb', gltf => {
            if (this.disposed) { disposeSource(gltf.scene); return }
            try { this.addAsset(gltf.scene); this.state = 'ready' }
            catch { this.clearArtwork(); this.state = 'error' }
            finally { disposeSource(gltf.scene) }
        }, undefined, () => { if (!this.disposed) this.state = 'error' })
    }

    addAsset(scene) {
        this.items = courtyardAssets(scene)
        this.material = new THREE.MeshMatcapMaterial({ matcap: this.objects.materials.shades.items.white.uniforms.matcap.value, vertexColors: true })
        this.makeShadow()
        for (const item of this.items) {
            const p = item.placement, group = new THREE.Group()
            group.name = `Courtyard / ${p.id}`
            group.position.set(p.x, p.y, surfaceHeight(p.x, p.y))
            const mesh = new THREE.Mesh(item.geometry, this.material)
            mesh.name = `Courtyard / ${p.id} Blender artwork`
            group.add(mesh)
            item.mesh = mesh; item.group = group
            this.container.add(group)
            if (this.shadowMaterial) {
                const shadow = new THREE.Mesh(this.shadowGeometry, this.shadowMaterial)
                shadow.name = `Courtyard / ${p.id} contact shadow`
                shadow.scale.set(p.width + .45, p.depth + .4, 1)
                group.add(shadow)
                groundLayer(shadow, 'shadow')
                shadow.renderOrder = 26
            }
            group.updateMatrix(); group.matrixAutoUpdate = false
            item.body = courtyardBody(item, this.objects.physics.materials?.items?.dummy)
            this.objects.physics.world.addBody(item.body)
        }
    }

    makeShadow() {
        const canvas = this.document?.createElement('canvas'), ctx = canvas?.getContext('2d')
        if (!ctx) return
        canvas.width = canvas.height = 64
        const gradient = ctx.createRadialGradient(32, 32, 4, 32, 32, 31)
        gradient.addColorStop(0, 'rgba(20,35,26,.5)'); gradient.addColorStop(1, 'rgba(20,35,26,0)')
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64)
        this.shadowTexture = new THREE.CanvasTexture(canvas)
        this.shadowGeometry = new THREE.PlaneGeometry(1, 1)
        this.shadowMaterial = new THREE.MeshBasicMaterial({ map: this.shadowTexture, transparent: true, opacity: .2, depthWrite: false })
    }

    clearArtwork() {
        for (const item of this.items) {
            if (item.group) this.container.remove(item.group)
            if (item.body) this.objects.physics.world.removeBody(item.body)
            item.geometry.dispose()
        }
        this.items = []
        this.material?.dispose(); this.shadowTexture?.dispose(); this.shadowGeometry?.dispose(); this.shadowMaterial?.dispose()
        this.material = this.shadowTexture = this.shadowGeometry = this.shadowMaterial = null
    }

    dispose() {
        if (this.disposed) return
        this.disposed = true
        this.time.off('tick.courtyardProps')
        this.clearArtwork()
    }
}
