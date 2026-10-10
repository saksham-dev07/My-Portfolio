import { test, expect } from 'bun:test'
import * as THREE from 'three'
import CANNON from 'cannon'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import EventEmitter from '../src/javascript/Utils/EventEmitter.js'
import CourtyardProps, { courtyardAssets, courtyardBody, courtyardPlacements } from '../src/javascript/World/CourtyardProps.js'
import { roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'
import { grovePlacements, landmarkTreePlacements } from '../src/javascript/World/EnvironmentLayout.js'

function source() {
    const scene = new THREE.Group()
    scene.rotation.x = -Math.PI / 2
    for (const p of courtyardPlacements) {
        const geometry = new THREE.BoxGeometry(p.width, p.depth, 2)
        geometry.translate(0, 0, 1)
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial())
        mesh.name = p.id
        mesh.userData = { design: { kind: p.id }, collisionBoxes: [{ center: [0, 0, 1], size: [p.width, p.depth, 2] }] }
        scene.add(mesh)
    }
    return scene
}

function fixture() {
    const time = new EventEmitter(); time.elapsed = 0
    const requests = [], loader = { load: (url, ready, progress, error) => requests.push({ url, ready, error }) }
    const camera = { instance: new THREE.PerspectiveCamera(50, 1, .1, 300) }
    camera.instance.up.set(0, 0, 1)
    camera.instance.position.set(12, -12, 15); camera.instance.lookAt(0, 7, 0)
    const physics = { world: new CANNON.World() }
    const objects = { physics, materials: { shades: { items: { white: { uniforms: { matcap: { value: new THREE.Texture() } } } } } } }
    const context = { createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }
    const document = { createElement: () => ({ getContext: () => context }) }
    const container = new THREE.Group(), props = new CourtyardProps({ container, objects, camera, time, loader, document })
    return { props, time, camera, requests, container, physics }
}

test('the optional courtyard kit waits for entry and camera visibility and never retries indefinitely', () => {
    const f = fixture()
    f.time.trigger('tick'); expect(f.requests).toHaveLength(0)
    f.camera.instance.position.set(120, -60, 14); f.camera.instance.lookAt(120, -70, 0)
    f.time.elapsed = 900; f.time.trigger('tick'); expect(f.requests).toHaveLength(0)
    f.camera.instance.position.set(34.5, -120, 12); f.camera.instance.lookAt(34.5, -110, 1)
    f.time.elapsed = 2000; f.time.trigger('tick'); expect(f.requests).toHaveLength(1)
    expect(f.requests[0].url).toBe('./saksham/models/courtyard-kit.glb')
    f.requests[0].error(); f.time.elapsed = 5000; f.time.trigger('tick')
    expect(f.props.state).toBe('error'); expect(f.requests).toHaveLength(1)
    expect(f.container.children).toHaveLength(0); expect(f.physics.world.bodies).toHaveLength(0)
    f.props.dispose()
})

test('invalid art and late callbacks leave no invisible walls or floating shadows', () => {
    for (const corrupt of [scene => scene.remove(scene.getObjectByName('maker')), scene => { scene.getObjectByName('maker').userData.collisionBoxes[0].center[0] = 30 }]) {
        const f = fixture(), scene = source(); corrupt(scene)
        f.time.elapsed = 800; f.time.trigger('tick'); f.requests[0].ready({ scene })
        expect(f.props.state).toBe('error'); expect(f.container.children).toHaveLength(0)
        expect(f.physics.world.bodies).toHaveLength(0); expect(f.props.shadowTexture).toBeFalsy()
        f.props.dispose()
    }
    const f = fixture(), scene = source(); let disposed = 0
    scene.children.forEach(mesh => mesh.geometry.addEventListener('dispose', () => disposed++))
    f.time.elapsed = 800; f.time.trigger('tick'); f.props.dispose(); f.requests[0].ready({ scene })
    expect(disposed).toBe(2); expect(f.container.children).toHaveLength(0); expect(f.physics.world.bodies).toHaveLength(0)
})

test('courtyard scenery owns and disposes its shared matcap, contacts and compound bodies once', () => {
    const f = fixture()
    f.time.elapsed = 800; f.time.trigger('tick'); f.requests[0].ready({ scene: source() })
    expect(f.props.state).toBe('ready'); expect(f.physics.world.bodies).toHaveLength(2)
    expect(new Set(f.props.items.map(item => item.mesh.material)).size).toBe(1)
    const resources = [...f.props.items.map(item => item.geometry), f.props.material, f.props.shadowTexture, f.props.shadowGeometry, f.props.shadowMaterial]
    const counts = resources.map(() => 0)
    resources.forEach((resource, i) => resource.addEventListener('dispose', () => counts[i]++))
    expect(f.props.items.every(item => item.group.children[1].userData.groundLayer === 'shadow')).toBe(true)
    f.props.dispose(); f.props.dispose()
    expect(counts).toEqual(resources.map(() => 1)); expect(f.container.children).toHaveLength(0)
    expect(f.physics.world.bodies).toHaveLength(0)
})

test('shipping Blender pergola and workbench fit their reserved roads, planting and car passage', async () => {
    const bytes = await Bun.file(new URL('../static/saksham/models/courtyard-kit.glb', import.meta.url)).arrayBuffer()
    const document = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, new DataView(bytes).getUint32(12, true))))
    expect(bytes.byteLength).toBeLessThan(350 * 1024)
    expect(document.materials).toHaveLength(1); expect(document.images || []).toHaveLength(0)
    expect(document.textures || []).toHaveLength(0)
    expect(document.meshes.flatMap(mesh => mesh.primitives).every(p => {
        const color = document.accessors[p.attributes.COLOR_0]
        return color.componentType === 5121 && color.normalized
    })).toBe(true)
    const gltf = await new GLTFLoader().parseAsync(bytes, ''), items = courtyardAssets(gltf.scene)
    const grove = grovePlacements(2), trees = [...grove, ...landmarkTreePlacements(2, grove)]
    try {
        expect(items.reduce((sum, item) => sum + item.geometry.attributes.position.count / 3, 0)).toBeLessThan(5000)
        const arrival = items.find(item => item.placement.id === 'arrival')
        expect(arrival.design.openFront).toBe(true)
        expect(items.every(item => item.design.floorSlab === false)).toBe(true)
        const maker = items.find(item => item.placement.id === 'maker')
        expect(maker.design.spareBricks).toBe(3)
        // The two posts used to end at the header's exposed top, adding a
        // second coplanar cap underneath its brass faces. Only the rail now
        // contributes horizontal triangles at the shipped 2.40 m height.
        const positions = maker.geometry.attributes.position
        let topArea = 0
        const vertices = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
        const ab = new THREE.Vector3(), ac = new THREE.Vector3()
        for (let i = 0; i < positions.count; i += 3) {
            vertices.forEach((vertex, index) => vertex.fromBufferAttribute(positions, i + index))
            if (!vertices.every(vertex => Math.abs(vertex.z - 2.40) < 1e-5)) continue
            ab.subVectors(vertices[1], vertices[0]); ac.subVectors(vertices[2], vertices[0])
            topArea += Math.abs(ab.cross(ac).z) / 2
        }
        expect(topArea).toBeCloseTo(2.64 * .14, 5)
        const header = maker.boxes[4]
        for (const post of maker.boxes.slice(1, 3)) {
            expect(post.center[2] + post.size[2] / 2).toBeCloseTo(header.center[2] - header.size[2] / 2, 6)
        }
        for (const box of arrival.boxes) {
            if (box.center[2] - box.size[2] / 2 > 1.4) continue
            const x = arrival.placement.x + box.center[0], y = arrival.placement.y + box.center[1]
            expect(Math.abs(x) < box.size[0] / 2 + 2.4 && y - box.size[1] / 2 < 4.6 && y + box.size[1] / 2 > -9).toBe(false)
        }
        for (const item of items) {
            const p = item.placement, b = item.geometry.boundingBox
            for (let x = b.min.x; x <= b.max.x; x += .35) for (let y = b.min.y; y <= b.max.y; y += .35) expect(roadEdgeDistance(p.x + x, p.y + y)).toBeGreaterThan(.25)
            for (const tree of trees) {
                const x = Math.max(b.min.x + p.x, Math.min(tree.x, b.max.x + p.x))
                const y = Math.max(b.min.y + p.y, Math.min(tree.y, b.max.y + p.y))
                expect(Math.hypot(tree.x - x, tree.y - y)).toBeGreaterThan(tree.radius + .1)
            }
            for (const box of item.boxes) {
                const x = p.x + box.center[0], y = p.y + box.center[1]
                if (box.center[2] - box.size[2] / 2 > 1.4) continue
                // The rebuild pad and the first push lane remain driveable.
                expect(Math.abs(x - 30) < box.size[0] / 2 + 3 && Math.abs(y + 115) < box.size[1] / 2 + 1.5).toBe(false)
                expect(Math.abs(x - 30) < box.size[0] / 2 + 1.3 && Math.abs(y + 109) < box.size[1] / 2 + 2).toBe(false)
            }
            const body = courtyardBody(item)
            expect(body.shapes).toHaveLength(item.boxes.length)
            expect(body.position.toArray().slice(0, 2)).toEqual([p.x, p.y])
        }
    } finally { items.forEach(item => item.geometry.dispose()) }
})
