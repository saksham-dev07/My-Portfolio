import * as THREE from 'three'
import CANNON from 'cannon'
import { modelLoader } from '../../Utils/ModelLoader.js'
import { activityPropGeometry } from '../ActivityProps.js'
import { surfaceHeight } from '../LandscapeLayout.js'
import { groundLayer } from '../GroundLayers.js'

export const educationChapterPlacements = Object.freeze([
    { id: 'school', x: -15, y: -103 },
    { id: 'science', x: -15, y: -109 },
    { id: 'campus', x: -15, y: -115 },
])

// Extras are authored in Blender's Z-up metres. Only the GLB geometry changes
// axes during export; its collision metadata retains these authored coordinates.
export function educationChapterAssets(scene) {
    scene.updateMatrixWorld(true)
    const items = []
    try {
        let triangles = 0
        for (const placement of educationChapterPlacements) {
            const source = scene.getObjectByName(placement.id)
            if (!source?.isMesh) throw new Error('The education artwork is missing a named chapter')
            const boxes = source.userData.collisionBoxes
            const design = source.userData.design
            if (design?.chapter !== placement.id || !Array.isArray(boxes) || !boxes.length || boxes.length > 8) throw new Error('The education artwork has invalid design metadata')
            for (const box of boxes) {
                if (![box.center, box.size].every(values => Array.isArray(values) && values.length === 3 && values.every(Number.isFinite)) || box.size.some(value => value <= 0)) throw new Error('The education artwork has invalid collision metadata')
            }
            const geometry = activityPropGeometry(source)
            items.push({ placement, geometry, boxes, design })
            const bounds = geometry.boundingBox, size = bounds.getSize(new THREE.Vector3())
            triangles += geometry.attributes.position.count / 3
            if (bounds.min.z < -.005 || bounds.max.z > 2.5 || size.x > 2.25 || size.y > 2.85 || size.x < 1 || size.y < 1 || size.z < .5 || triangles > 6000) throw new Error('The education artwork exceeds its footprint or geometry budget')
            for (const box of boxes) for (let axis = 0; axis < 3; axis++) {
                const key = ['x', 'y', 'z'][axis]
                if (box.center[axis] - box.size[axis] / 2 < bounds.min[key] - .08 || box.center[axis] + box.size[axis] / 2 > bounds.max[key] + .08) throw new Error('An education collider extends outside its visible artwork')
            }
        }
        return items
    } catch (error) {
        items.forEach(item => item.geometry.dispose())
        throw error
    }
}

export function educationChapterBody(item, material) {
    const p = item.placement
    const body = new CANNON.Body({ mass: 0, material, position: new CANNON.Vec3(p.x, p.y, surfaceHeight(p.x, p.y)) })
    for (const box of item.boxes) body.addShape(new CANNON.Box(new CANNON.Vec3(...box.size.map(value => value / 2))), new CANNON.Vec3(...box.center))
    return body
}

function disposeSource(scene) {
    const geometries = new Set(), materials = new Set(), textures = new Set()
    scene.traverse(node => {
        if (!node.isMesh) return
        geometries.add(node.geometry)
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
            materials.add(material)
            for (const value of Object.values(material)) if (value?.isTexture) textures.add(value)
        }
    })
    textures.forEach(texture => texture.dispose())
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(material => material.dispose())
}

export default class EducationChapters {
    constructor({ container, objects, camera, time, loader = modelLoader, document: page = globalThis.document }) {
        this.container = container
        this.objects = objects
        this.camera = camera
        this.time = time
        this.loader = loader
        this.document = page
        this.state = 'idle'
        this.disposed = false
        this.items = []
        this.nextCheck = time.elapsed + 750
        this.frustum = new THREE.Frustum()
        this.matrix = new THREE.Matrix4()
        this.bounds = new THREE.Sphere(new THREE.Vector3(-15, -109, 1.3), 8)
        time.on('tick.educationChapters', () => this.checkLoad())
    }

    checkLoad() {
        if (this.disposed || this.state !== 'idle' || this.time.elapsed < this.nextCheck) return
        this.nextCheck = this.time.elapsed + 500
        this.camera.instance.updateMatrixWorld()
        this.matrix.multiplyMatrices(this.camera.instance.projectionMatrix, this.camera.instance.matrixWorldInverse)
        this.frustum.setFromProjectionMatrix(this.matrix)
        if (!this.frustum.intersectsSphere(this.bounds)) return
        this.state = 'loading'
        this.loader.load('./saksham/models/education-chapters.glb', gltf => {
            if (this.disposed) { disposeSource(gltf.scene); return }
            try {
                this.addAsset(gltf.scene)
                this.state = 'ready'
            } catch {
                this.clearArtwork()
                this.state = 'error'
            } finally { disposeSource(gltf.scene) }
        }, undefined, () => { if (!this.disposed) this.state = 'error' })
    }

    addAsset(scene) {
        // Validate every chapter before installing any mesh or physical proxy.
        this.items = educationChapterAssets(scene)
        this.material = new THREE.MeshMatcapMaterial({ matcap: this.objects.materials.shades.items.white.uniforms.matcap.value, vertexColors: true })
        this.material.name = 'Education chapters / shared world matcap'
        this.makeContactShadow()
        for (const item of this.items) {
            const p = item.placement, group = new THREE.Group()
            group.name = `Education chapter / ${p.id}`
            group.position.set(p.x, p.y, surfaceHeight(p.x, p.y))
            const mesh = new THREE.Mesh(item.geometry, this.material)
            mesh.name = `Education chapter / ${p.id} authored artwork`
            group.add(mesh)
            item.group = group
            item.mesh = mesh
            this.container.add(group)
            if (this.contactMaterial) {
                const shadow = new THREE.Mesh(this.contactGeometry, this.contactMaterial)
                shadow.name = `Education chapter / ${p.id} contact shadow`
                shadow.scale.set(2.65, 3.2, 1)
                group.add(shadow)
                groundLayer(shadow, 'shadow')
            }
            group.updateMatrix()
            group.matrixAutoUpdate = false
            item.body = educationChapterBody(item, this.objects.physics.materials?.items?.dummy)
            this.objects.physics.world.addBody(item.body)
        }
    }

    makeContactShadow() {
        // Missing 2D canvas support may omit this cosmetic shadow, never artwork.
        const canvas = this.document?.createElement('canvas')
        if (!canvas) return
        canvas.width = canvas.height = 64
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const gradient = ctx.createRadialGradient(32, 32, 7, 32, 32, 31)
        gradient.addColorStop(0, 'rgba(21,42,29,.5)')
        gradient.addColorStop(1, 'rgba(21,42,29,0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 64, 64)
        this.contactTexture = new THREE.CanvasTexture(canvas)
        this.contactGeometry = new THREE.PlaneGeometry(1, 1)
        this.contactMaterial = new THREE.MeshBasicMaterial({ map: this.contactTexture, transparent: true, opacity: .2, depthWrite: false })
    }

    clearArtwork() {
        for (const item of this.items) {
            if (item.group) this.container.remove(item.group)
            if (item.body) this.objects.physics.world.removeBody(item.body)
            item.geometry.dispose()
        }
        this.items = []
        this.material?.dispose()
        this.contactTexture?.dispose()
        this.contactGeometry?.dispose()
        this.contactMaterial?.dispose()
        this.material = this.contactTexture = this.contactGeometry = this.contactMaterial = null
    }

    dispose() {
        if (this.disposed) return
        this.disposed = true
        this.time.off('tick.educationChapters')
        this.clearArtwork()
    }
}
