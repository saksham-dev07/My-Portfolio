import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { hubActivities, hubPadTop } from './HubLayout.js'
import { groundLayer } from './GroundLayers.js'

export const vignetteScale = 1.6

// Blender's editable figures use Z-up local coordinates. Bake the glTF scene
// transform once; the five runtime meshes then share the world's Z-up system.
export function vignetteGeometry(node) {
    const conversion = new THREE.Matrix4().makeRotationX(Math.PI / 2)
    const geometry = node.geometry.clone().applyMatrix4(conversion.multiply(node.matrixWorld))
    const source = geometry.getAttribute('color')
    if (source) {
        const colors = [], color = new THREE.Color()
        for (let i = 0; i < source.count; i++) {
            color.fromBufferAttribute(source, i).convertLinearToSRGB()
            colors.push(color.r, color.g, color.b)
        }
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    }
    geometry.computeBoundingBox()
    return geometry
}

export function vignetteSolids(placements) {
    const solids = []
    for (const { group, boxes } of placements) {
        group.updateMatrix()
        for (const box of boxes) {
            const solid = new THREE.Object3D()
            solid.name = 'box'
            solid.position.fromArray(box.center).applyMatrix4(group.matrix)
            solid.scale.fromArray(box.size).multiplyScalar(vignetteScale)
            solid.rotation.z = group.rotation.z + (box.angle || 0)
            solids.push(solid)
        }
    }
    return solids
}

export default class PersonalVignettes {
    constructor({ container, objects, camera, time }) {
        this.state = 'idle'
        this.items = []
        const region = new THREE.Sphere(new THREE.Vector3(0, -30, 2), 18)
        const frustum = new THREE.Frustum(), matrix = new THREE.Matrix4()
        let nextCheck = 0
        time.on('tick.personalVignettes', () => {
            if (this.state !== 'idle' || time.elapsed < nextCheck) return
            nextCheck = time.elapsed + 300
            camera.instance.updateMatrixWorld()
            matrix.multiplyMatrices(camera.instance.projectionMatrix, camera.instance.matrixWorldInverse)
            frustum.setFromProjectionMatrix(matrix)
            if (camera.view !== 'top' && !frustum.intersectsSphere(region)) return
            this.state = 'loading'
            new GLTFLoader().load('./saksham/models/personal-vignettes.glb', gltf => {
                this.addAsset(gltf, { container, objects })
                this.setContactShadows(container)
                this.state = 'ready'
                time.off('tick.personalVignettes')
            }, undefined, () => {
                this.state = 'error'
                time.off('tick.personalVignettes')
            })
        })
    }

    addAsset(gltf, { container, objects }) {
        const material = new THREE.MeshMatcapMaterial({
            matcap: objects.materials.shades.items.white.uniforms.matcap.value,
            vertexColors: true,
        })
        material.name = 'Saksham / five faceted everyday scenes'
        gltf.scene.updateMatrixWorld(true)
        this.items = hubActivities.map(activity => {
            const node = gltf.scene.getObjectByName(`activity-${activity.id}`)
            const mesh = new THREE.Mesh(vignetteGeometry(node), material)
            mesh.name = activity.id
            const group = new THREE.Group()
            group.name = `Personal scene / ${activity.id}`
            group.position.set(activity.x, activity.y, hubPadTop + .005)
            group.scale.setScalar(vignetteScale)
            group.add(mesh)
            group.updateMatrix()
            group.matrixAutoUpdate = false
            container.add(group)
            return { group, mesh, boxes: node.userData.collisionBoxes || [] }
        })
        const solids = vignetteSolids(this.items)
        if (solids.length) this.collision = objects.physics.addObjectFromThree({
            meshes: solids, offset: new THREE.Vector3(), rotation: new THREE.Euler(), mass: 0, sleep: true,
        })
        gltf.scene.traverse(node => {
            if (!node.isMesh) return
            node.geometry.dispose()
            node.material.dispose()
        })
    }

    setContactShadows(container) {
        // The removed original shadow atlas included the old figures. These
        // neutral contact shadows have no obsolete silhouettes or extra files.
        const canvas = document.createElement('canvas')
        canvas.width = 64; canvas.height = 64
        const context = canvas.getContext('2d')
        const gradient = context.createRadialGradient(32, 32, 13, 32, 32, 32)
        gradient.addColorStop(0, 'rgba(0,0,0,.8)')
        gradient.addColorStop(1, 'rgba(0,0,0,0)')
        context.fillStyle = gradient; context.fillRect(0, 0, 64, 64)
        const texture = new THREE.CanvasTexture(canvas)
        const material = new THREE.MeshBasicMaterial({
            map: texture, color: '#243325', transparent: true, opacity: .26, depthWrite: false,
        })
        const geometry = new THREE.PlaneGeometry(1, 1)
        this.shadows = []
        for (const { group, mesh } of this.items) {
            const padShadow = new THREE.Mesh(geometry, material)
            padShadow.position.set(group.position.x, group.position.y, 0)
            padShadow.scale.set(6.2, 6.2, 1)
            groundLayer(padShadow, 'shadow')
            container.add(padShadow)
            const bounds = mesh.geometry.boundingBox
            const center = bounds.getCenter(new THREE.Vector3()).applyMatrix4(group.matrix)
            const contact = new THREE.Mesh(geometry, material)
            // This decal sits on the pad, with just 1 cm separation after the
            // ground-layer bias rather than a full ground-height offset.
            contact.position.set(center.x, center.y, hubPadTop - .03)
            contact.scale.set((bounds.max.x - bounds.min.x) * vignetteScale + .4, (bounds.max.y - bounds.min.y) * vignetteScale + .4, 1)
            groundLayer(contact, 'shadow')
            container.add(contact)
            this.shadows.push(padShadow, contact)
        }
    }
}
