import { expect, test } from 'bun:test'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import RefinedPropBatch, { refinedKinds, refinedGeometry, refinedPlacement } from '../src/javascript/World/RefinedProps.js'
import { roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'

const bytes = await Bun.file(new URL('../static/saksham/models/refined-props.glb', import.meta.url)).arrayBuffer()
const scene = (await new GLTFLoader().parseAsync(bytes, '')).scene

test('Blender replacement kit has bounded transfer, all eleven designs and no textures', () => {
    expect(bytes.byteLength).toBeLessThan(512_000)
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, new DataView(bytes).getUint32(12, true))))
    expect(json.images?.length || 0).toBe(0); expect(json.materials).toHaveLength(1)
    let triangles = 0
    for (const kind of refinedKinds) {
        const { geometry, boxes, design } = refinedGeometry(scene, kind), bounds = geometry.boundingBox
        triangles += geometry.attributes.position.count / 3
        expect(bounds.min.z).toBeGreaterThan(-.001)
        expect(design.version).toBe(2)
        expect(boxes.length).toBeGreaterThan(0)
        for (const box of boxes) for (let axis = 0; axis < 3; axis++) {
            const key = ['x', 'y', 'z'][axis]
            expect(box.size[axis]).toBeGreaterThan(0)
            expect(box.center[axis] - box.size[axis] / 2).toBeGreaterThanOrEqual(bounds.min[key] - .035)
            expect(box.center[axis] + box.size[axis] / 2).toBeLessThanOrEqual(bounds.max[key] + .035)
        }
        geometry.dispose()
    }
    expect(triangles).toBeLessThan(18_000)
})

test('quantized positions bake in metres and keep Blender smooth normals without changing the cached source', () => {
    const original = scene.getObjectByName('lamp').geometry.attributes.position.array.slice()
    const { geometry } = refinedGeometry(scene, 'lamp')
    expect(geometry.boundingBox.max.z).toBeCloseTo(2.5, 3)
    expect(geometry.attributes.position.array).toBeInstanceOf(Float32Array)
    const normal = new THREE.Vector3(), attribute = geometry.attributes.normal
    for (let i = 0; i < attribute.count; i += 19) expect(normal.fromBufferAttribute(attribute, i).length()).toBeCloseTo(1, 3)
    const faceted = geometry.clone(); faceted.computeVertexNormals()
    let different = 0
    for (let i = 0; i < attribute.count; i++) if (Math.abs(attribute.getX(i) - faceted.attributes.normal.getX(i)) > .03) different++
    expect(different).toBeGreaterThan(50)
    expect(scene.getObjectByName('lamp').geometry.attributes.position.array).toEqual(original)
    geometry.dispose(); faceted.dispose()
})

test('mirrored banner supports retain outward winding and information sculptures clear their road and entry pads', () => {
    const mirrored = refinedPlacement(scene, [{ kind: 'banner-stand', x: 0, y: 0, mirrorX: -1 }]).geometry
    const p = mirrored.attributes.position, n = mirrored.attributes.normal
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), face = new THREE.Vector3(), average = new THREE.Vector3()
    for (let i = 0; i < p.count; i += 3) {
        a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2)
        face.crossVectors(b.sub(a), c.sub(a)).normalize(); average.fromBufferAttribute(n, i)
        if (face.lengthSq() > .5) expect(face.dot(average)).toBeGreaterThan(0)
    }
    mirrored.dispose()
    const placements = ['portfolio', 'github', 'linkedin', 'mail'].map((id, i) => ({ kind: `link-${id}`, x: 3.15 + i * 2.4, y: -54.333, z: .01 }))
    const item = refinedPlacement(scene, placements)
    for (const proxy of item.solids) {
        for (const dx of [-.5, .5]) for (const dy of [-.5, .5]) expect(roadEdgeDistance(proxy.position.x + dx * proxy.scale.x, proxy.position.y + dy * proxy.scale.y)).toBeGreaterThan(.5)
        expect(proxy.position.y - proxy.scale.y / 2).toBeGreaterThan(-55.5)
    }
    item.geometry.dispose()
})

test('optional kit loads once and a late response cannot recreate disposed props or collisions', () => {
    let requests = 0, callback, bodies = 0
    const container = new THREE.Group(), ticks = new Map()
    const batch = new RefinedPropBatch({ name: 'testRefined', placements: [{ kind: 'chest', x: 0, y: 0 }], container,
        time: { on: (name, cb) => ticks.set(name, cb), off: name => ticks.delete(name) },
        objects: { physics: { addObjectFromThree: () => { bodies++ } } },
        loader: { load: (url, onLoad) => { requests++; callback = onLoad } },
    })
    batch.load(); batch.load(); expect(requests).toBe(1)
    batch.dispose(); callback({ scene })
    expect(container.children).toHaveLength(0); expect(bodies).toBe(0); expect(ticks.size).toBe(0)
})
