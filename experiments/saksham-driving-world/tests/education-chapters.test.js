import { expect, test } from 'bun:test'
import * as THREE from 'three'
import CANNON from 'cannon'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import EducationChapters, { educationChapterAssets, educationChapterBody, educationChapterPlacements } from '../src/javascript/World/Sections/EducationChapters.js'
import EventEmitter from '../src/javascript/Utils/EventEmitter.js'
import { roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'
import { grovePlacements, landmarkTreePlacements } from '../src/javascript/World/EnvironmentLayout.js'

function artwork() {
    const scene = new THREE.Group()
    scene.rotation.x = -Math.PI / 2
    for (const p of educationChapterPlacements) {
        const geometry = new THREE.BoxGeometry(2.2, 2.8, 2)
        geometry.translate(0, 0, 1)
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: '#205442' }))
        mesh.name = p.id
        mesh.userData = { design: { chapter: p.id }, collisionBoxes: [{ center: [0, 0, 1], size: [2.2, 2.8, 2] }] }
        scene.add(mesh)
    }
    return scene
}

function fixture() {
    const time = new EventEmitter(); time.elapsed = 0
    const requests = [], loader = { load: (url, ready, progress, error) => requests.push({ url, ready, error }) }
    const camera = { instance: new THREE.PerspectiveCamera(50, 1, .1, 300) }
    camera.instance.up.set(0, 0, 1)
    camera.instance.position.set(-15, -118, 14)
    camera.instance.lookAt(-15, -109, 0)
    const physics = { world: new CANNON.World() }
    const objects = { physics, materials: { shades: { items: { white: { uniforms: { matcap: { value: new THREE.Texture() } } } } } } }
    const context = { createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }
    const document = { createElement: () => ({ getContext: () => context }) }
    const container = new THREE.Group(), chapters = new EducationChapters({ container, objects, camera, time, loader, document })
    return { chapters, container, time, camera, requests, physics }
}

test('education art waits for a nearby visible camera and sends exactly one optional request', () => {
    const f = fixture()
    try {
        f.time.trigger('tick'); expect(f.requests).toHaveLength(0)
        f.camera.instance.position.set(0, 0, 12); f.camera.instance.lookAt(0, 0, 0)
        f.time.elapsed = 1000; f.time.trigger('tick'); expect(f.requests).toHaveLength(0)
        f.camera.instance.position.set(-15, -118, 14); f.camera.instance.lookAt(-15, -109, 0)
        f.time.elapsed = 2000; f.time.trigger('tick'); expect(f.requests).toHaveLength(1)
        expect(f.requests[0].url).toBe('./saksham/models/education-chapters.glb')
        f.time.elapsed = 4000; f.time.trigger('tick'); expect(f.requests).toHaveLength(1)
        f.requests[0].error(new Error('offline'))
        expect(f.chapters.state).toBe('error')
        expect(f.container.children).toHaveLength(0); expect(f.physics.world.bodies).toHaveLength(0)
        f.time.elapsed = 6000; f.time.trigger('tick'); expect(f.requests).toHaveLength(1)
    } finally { f.chapters.dispose() }
})

test('incomplete or invalid artwork installs no invisible physical walls or stray shadows', () => {
    for (const corrupt of [scene => scene.remove(scene.getObjectByName('campus')), scene => { scene.getObjectByName('science').userData.collisionBoxes[0].size[0] = -1 }]) {
        const f = fixture(), scene = artwork()
        corrupt(scene)
        f.time.elapsed = 800; f.time.trigger('tick'); f.requests[0].ready({ scene })
        expect(f.chapters.state).toBe('error')
        expect(f.container.children).toHaveLength(0); expect(f.physics.world.bodies).toHaveLength(0)
        expect(f.chapters.contactTexture).toBeFalsy()
        f.chapters.dispose()
    }
})

test('all chapters share one world material and shadow texture and fully release their ownership', () => {
    const f = fixture()
    f.time.elapsed = 800; f.time.trigger('tick'); f.requests[0].ready({ scene: artwork() })
    expect(f.chapters.state).toBe('ready')
    expect(f.container.children).toHaveLength(3); expect(f.physics.world.bodies).toHaveLength(3)
    expect(new Set(f.chapters.items.map(item => item.mesh.material)).size).toBe(1)
    const geometries = f.chapters.items.map(item => item.geometry)
    const resources = [...geometries, f.chapters.material, f.chapters.contactGeometry, f.chapters.contactMaterial, f.chapters.contactTexture]
    const counts = resources.map(() => 0)
    resources.forEach((resource, index) => resource.addEventListener('dispose', () => counts[index]++))
    for (const item of f.chapters.items) {
        expect(item.group.children).toHaveLength(2)
        expect(item.group.children[1].userData.groundLayer).toBe('shadow')
        expect(item.body.position.toArray()).toEqual([item.placement.x, item.placement.y, 0])
    }
    f.chapters.dispose(); f.chapters.dispose()
    expect(counts.every(count => count === 1)).toBe(true)
    expect(f.container.children).toHaveLength(0); expect(f.physics.world.bodies).toHaveLength(0)
    f.time.elapsed = 2000; f.time.trigger('tick'); expect(f.requests).toHaveLength(1)
})

test('a late successful request releases its source without installing art after destruction', () => {
    const f = fixture(), scene = artwork()
    let sourceDisposals = 0
    scene.children.forEach(mesh => mesh.geometry.addEventListener('dispose', () => sourceDisposals++))
    f.time.elapsed = 800; f.time.trigger('tick'); f.chapters.dispose()
    f.requests[0].ready({ scene })
    expect(sourceDisposals).toBe(3)
    expect(f.container.children).toHaveLength(0); expect(f.physics.world.bodies).toHaveLength(0)
})

test('shipping Blender chapters retain their measured bounds, palette, design and physical footprints', async () => {
    const file = Bun.file(new URL('../static/saksham/models/education-chapters.glb', import.meta.url))
    const bytes = await file.arrayBuffer(), view = new DataView(bytes)
    const document = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, view.getUint32(12, true))))
    expect(bytes.byteLength).toBeLessThan(400 * 1024)
    expect(document.images || []).toHaveLength(0); expect(document.textures || []).toHaveLength(0)
    expect(document.materials).toHaveLength(1)
    const colorAccessors = document.meshes.flatMap(mesh => mesh.primitives.map(primitive => document.accessors[primitive.attributes.COLOR_0]))
    expect(colorAccessors.every(accessor => accessor.componentType === 5121 && accessor.normalized)).toBe(true)
    const gltf = await new GLTFLoader().parseAsync(bytes, ''), items = educationChapterAssets(gltf.scene)
    try {
        expect(items).toHaveLength(3)
        expect(items.reduce((count, item) => count + item.geometry.attributes.position.count / 3, 0)).toBeLessThan(6000)
        expect(items[0].design.openBook).toBe(true)
        expect(items[1].design.orbitCount).toBe(3)
        expect(items[2].design.laptop).toBe(true); expect(items[2].design.graduation).toBe(false)
        const grove = grovePlacements(2), trees = [...grove, ...landmarkTreePlacements(2, grove)]
        for (const item of items) {
            const { placement: p, geometry } = item, bounds = geometry.boundingBox
            expect(bounds.min.z).toBeCloseTo(0, 4)
            expect(bounds.max.z).toBeGreaterThan(2); expect(bounds.max.z).toBeLessThan(2.5)
            expect(bounds.getSize(new THREE.Vector3()).x).toBeCloseTo(2.2, 4)
            expect(bounds.getSize(new THREE.Vector3()).y).toBeCloseTo(2.8, 4)
            expect(geometry.attributes.color.count).toBe(geometry.attributes.position.count)
            for (let x = bounds.min.x; x <= bounds.max.x + .001; x += .22) for (let y = bounds.min.y; y <= bounds.max.y + .001; y += .28) expect(roadEdgeDistance(p.x + x, p.y + y)).toBeGreaterThan(1)
            // Ground activation pads sit to the west, not underneath the model.
            expect(p.x + bounds.min.x - (-20 + 1.5)).toBeGreaterThan(2)
            for (const tree of trees) {
                const dx = Math.max(p.x + bounds.min.x - tree.x, 0, tree.x - (p.x + bounds.max.x))
                const dy = Math.max(p.y + bounds.min.y - tree.y, 0, tree.y - (p.y + bounds.max.y))
                expect(Math.hypot(dx, dy) - tree.radius).toBeGreaterThan(.5)
            }
            // The two campus wing walls, including their staggered courses.
            for (const wall of [{ x: -9, y: -105, w: 1.11, h: 6.46 }, { x: -12, y: -112, w: 4.1, h: .55 }]) {
                const separationX = Math.max(p.x + bounds.min.x - (wall.x + wall.w / 2), wall.x - wall.w / 2 - (p.x + bounds.max.x))
                const separationY = Math.max(p.y + bounds.min.y - (wall.y + wall.h / 2), wall.y - wall.h / 2 - (p.y + bounds.max.y))
                expect(Math.max(separationX, separationY)).toBeGreaterThan(.4)
            }
            const body = educationChapterBody(item), physics = new CANNON.World()
            physics.addBody(body)
            const hit = new CANNON.RaycastResult()
            expect(physics.raycastClosest(new CANNON.Vec3(p.x, p.y, 3), new CANNON.Vec3(p.x, p.y, -1), { skipBackfaces: true }, hit)).toBe(true)
            expect(hit.hitPointWorld.z).toBeLessThanOrEqual(bounds.max.z + .08)
            expect(body.shapes).toHaveLength(item.boxes.length)
        }
    } finally { items.forEach(item => item.geometry.dispose()) }
})
