import * as THREE from 'three'
import { groundLayer } from '../GroundLayers.js'
import { modelLoader } from '../../Utils/ModelLoader.js'
import assets from './landmark-assets.json'

export function prepareLandmarkMaterial(material, kind) {
    const copy = material.clone()
    if ('metalness' in copy) { copy.metalness = 0; copy.metalnessMap = null }
    if ('roughness' in copy) copy.roughness = kind === 'avatar' ? .86 : .94
    if ('specularIntensity' in copy) copy.specularIntensity = kind === 'avatar' ? .22 : .3
    if (copy.specularColor) copy.specularColor.set('#ffffff')
    if (copy.normalScale) copy.normalScale.setScalar(kind === 'avatar' ? .55 : .75)
    // A tiny texture-coloured fill preserves dark, baked details without an
    // environment capture or additional shadow map. Keep the original pixels.
    if (kind === 'avatar' || kind === 'campus') {
        copy.emissive.set('#ffffff')
        copy.emissiveMap = copy.map
        copy.emissiveIntensity = kind === 'avatar' ? .035 : .08
    }
    for (const texture of [copy.map, copy.normalMap, copy.roughnessMap]) if (texture) texture.anisotropy = 4
    return copy
}

// Blender-authored proxies are in the same Z-up metres as the source script.
// Their simple compound shapes follow the visible podium's normalization,
// rather than filling the decorative cup and handle silhouette with a grid.
export function authoredLandmarkSolids(boxes, factor, translation, rotation = 0) {
    const transform = new THREE.Matrix4().makeRotationZ(rotation)
    return boxes.map(({ center, size }) => {
        const box = new THREE.Object3D()
        box.name = 'box'
        box.position.fromArray(center).applyMatrix4(transform).multiplyScalar(factor).add(translation)
        box.scale.fromArray(size).multiplyScalar(factor)
        box.rotation.z = rotation
        return box
    })
}

// Keep original materials/textures. Adapt glTF's Y-up into the world's Z-up,
// normalize its real bounds, then derive coarse solid physics from the geometry.
export default class ProfileLandmarks {
    constructor({ objects, time, camera, loader = modelLoader }, container, collisions) {
        this.container = container
        this.physics = objects.physics
        this.matcap = objects.materials?.shades?.items?.white?.uniforms?.matcap?.value
        this.collisions = collisions
        this.models = []
        this.loader = loader
        this.campusState = 'idle'
        this.avatarState = 'idle'
        this.skillsState = 'idle'
        this.highlightsState = 'idle'
        this.pending = new Map()
        const frustum = new THREE.Frustum()
        const viewProjection = new THREE.Matrix4()
        const campusBounds = new THREE.Sphere(new THREE.Vector3(2, -105, 2), 8)
        const avatarBounds = new THREE.Sphere(new THREE.Vector3(2, -73, 2.5), 4)
        const skillsBounds = new THREE.Sphere(new THREE.Vector3(-24, -81, 2), 6)
        const highlightsBounds = new THREE.Sphere(new THREE.Vector3(30, -83, 2), 6)
        let nextCheck = 0
        container.add(new THREE.HemisphereLight('#edf3ff', '#a5b5a0', 2.3))
        const sun = new THREE.DirectionalLight('#fff7ee', 1.65)
        sun.position.set(-30, -60, 70)
        container.add(sun)
        const portraitLight = new THREE.DirectionalLight('#e8f1ff', 1.6)
        portraitLight.position.set(0, -90, 25)
        portraitLight.target.position.set(2, -73, 2.5)
        container.add(portraitLight)
        container.add(portraitLight.target)
        // Camera panning is independent of the car: visible landmarks must load
        // even when the visitor explores from the starting line. Check at 4 Hz.
        time.on('tick', () => {
            if (performance.now() < nextCheck) return
            nextCheck = performance.now() + 250
            if (['campus', 'avatar', 'skills', 'highlights'].every(id => this[`${id}State`] !== 'idle')) return
            const car = this.physics.car.chassis.body.position
            camera.instance.updateMatrixWorld()
            viewProjection.multiplyMatrices(camera.instance.projectionMatrix, camera.instance.matrixWorldInverse)
            frustum.setFromProjectionMatrix(viewProjection)
            if (this.campusState === 'idle' && (Math.hypot(car.x - 2, car.y + 112) < 28 || frustum.intersectsSphere(campusBounds))) this.loadCampus(10)
            if (this.avatarState === 'idle' && (Math.hypot(car.x - 2, car.y + 80) < 26 || frustum.intersectsSphere(avatarBounds))) this.loadAvatar(10)
            if (this.skillsState === 'idle' && (Math.hypot(car.x + 24, car.y + 88) < 24 || frustum.intersectsSphere(skillsBounds))) this.loadSkills(10)
            if (this.highlightsState === 'idle' && (Math.hypot(car.x - 30, car.y + 90) < 24 || frustum.intersectsSphere(highlightsBounds))) this.loadHighlights(10)
        })
    }

    add(gltf, { name, x, y, width, depth, height, rotation = 0, cells = 5, authored = false, groundZ = .08, kind = 'campus' }) {
        const model = new THREE.Group()
        model.name = name
        const oriented = new THREE.Group()
        oriented.rotation.set(Math.PI / 2, 0, rotation, 'ZXY')
        const source = gltf.scene.clone(true)
        let authoredBoxes
        const paletteMaterial = authored ? new THREE.MeshMatcapMaterial({ matcap: this.matcap, vertexColors: true }) : null
        if (paletteMaterial) paletteMaterial.name = 'Highlights podium / shared palette matcap'
        source.traverse(node => {
            if (!node.isMesh) return
            if (authored && node.userData.assetVersion >= 2) authoredBoxes = node.userData.collisionBoxes
            if (authored) {
                // GLTF palette attributes are linear; the original world matcap
                // expects display-space colours, just like its botanical kit.
                node.geometry = node.geometry.clone()
                const colors = node.geometry.getAttribute('color')
                if (colors) {
                    const values = new Float32Array(colors.count * 3)
                    const color = new THREE.Color()
                    for (let i = 0; i < colors.count; i++) {
                        color.setRGB(colors.getX(i), colors.getY(i), colors.getZ(i)).convertLinearToSRGB()
                        values[i * 3] = color.r
                        values[i * 3 + 1] = color.g
                        values[i * 3 + 2] = color.b
                    }
                    node.geometry.setAttribute('color', new THREE.BufferAttribute(values, 3))
                }
                node.material = paletteMaterial
                return
            }
            const prepare = material => prepareLandmarkMaterial(material, kind)
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
        oriented.position.set(-center.x, -center.y, -bounds.min.z + groundZ)
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
        const solids = authoredBoxes?.length ? authoredLandmarkSolids(authoredBoxes, factor, oriented.position, rotation) : []
        if (!authoredBoxes?.length) for (let iy = 0; iy < cells; iy++) for (let ix = 0; ix < cells; ix++) {
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

    loadCampus(priority = 0) {
        this.load('campus', 'VIT Bhopal', assets.campus.url,
            { name: 'VIT Bhopal · supplied campus model', x: 2, y: -105, width: 13, depth: 8, height: 6, cells: 8, kind: 'campus' }, priority)
    }

    loadAvatar(priority = 0) {
        this.load('avatar', 'Saksham’s portrait', assets.avatar.url,
            { name: 'Saksham · original portrait', x: 2, y: -73, width: 4.5, depth: 4.5, height: 5, groundZ: .35, cells: 5, kind: 'avatar' }, priority)
    }

    loadSkills(priority = 0) {
        this.load('skills', 'Skills Garage', assets.skills.url,
            { name: 'Skills Garage', x: -24, y: -81, width: 7, depth: 5, height: 4.8, kind: 'skills' }, priority)
    }

    loadHighlights(priority = 0) {
        this.load('highlights', 'Highlights podium', './saksham/models/highlights-podium.glb',
            { name: 'Highlights', x: 30, y: -83, width: 10, depth: 7, height: 5, authored: true }, priority)
    }

    load(id, title, url, placement, priority) {
        if (this[`${id}State`] === 'ready') return
        if (this[`${id}State`] === 'loading') {
            // A map selection can promote a background request still queued.
            this.loader.load(url, () => {}, undefined, () => {}, priority)
            return
        }
        this[`${id}State`] = 'loading'
        this.report(id, `Loading ${title}…`)
        this.loader.load(url, gltf => {
            this.add(gltf, placement)
            this[`${id}State`] = 'ready'
            this.report(id, '')
        }, event => this.progress(id, title, event), () => {
            this[`${id}State`] = 'error'
            this.report(id, `${title} unavailable. Select its World Map stop to retry.`)
        }, priority)
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
