import { expect, test } from 'bun:test'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { buildInformationStatic, informationNodeName, retiredInformationMeshes, retiredInformationCollisions } from '../src/javascript/World/InformationLayout.js'
import { roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'
import { pruneStaticGlb } from '../../../scripts/assets/prune-crossroads.mjs'

const readJson = bytes => JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, new DataView(bytes).getUint32(12, true))))

test('information exports contain no retired French landmark geometry or proxies', async() => {
    for(const [file, retired, limit] of [['base', retiredInformationMeshes, 45_000], ['collision', retiredInformationCollisions, 6_000]]) {
        const bytes = await Bun.file(new URL(`../static/models/information/static/${file}.glb`, import.meta.url)).arrayBuffer()
        const json = readJson(bytes), names = json.nodes.map(node => informationNodeName(node.name))
        expect(bytes.byteLength).toBeLessThan(limit)
        expect(names.every(name => !retired.has(name))).toBe(true)
        expect(json.scenes[0].nodes).toHaveLength(json.nodes.length)
        expect(json.nodes.every(node => !node.children?.length)).toBe(true)
        expect(pruneStaticGlb(bytes, names)).toEqual(Buffer.from(bytes))
        for(const primitive of json.meshes.flatMap(mesh => mesh.primitives)) {
            expect(json.accessors[primitive.indices]).toBeDefined()
            for(const index of Object.values(primitive.attributes)) expect(json.accessors[index]).toBeDefined()
            const draco = primitive.extensions?.KHR_draco_mesh_compression
            if(draco) expect(json.bufferViews[draco.bufferView]).toBeDefined()
        }
    }
})

test('retained flag pole and social proxies keep their authoring position and clear the road', async() => {
    const bytes = await Bun.file(new URL('../static/models/information/static/collision.glb', import.meta.url)).arrayBuffer()
    const gltf = await new GLTFLoader().parseAsync(bytes, '')
    const expected = ['Cube057', 'Cube063', 'Cube064', 'Cube065', 'Cube066', 'Cube067', 'Cube068', 'Cube094', 'Cube095', 'Cube096', 'Cube098', 'Cube099']
    expect(gltf.scene.children.map(node => node.name).sort()).toEqual(expected.sort())
    gltf.scene.position.set(1.2, -55, 0)
    gltf.scene.updateMatrixWorld(true)
    const pole = new THREE.Box3().setFromObject(gltf.scene.getObjectByName('Cube057')), center = pole.getCenter(new THREE.Vector3())
    expect(center.x).toBeCloseTo(1.2 - 4.23398, 4)
    expect(center.y).toBeCloseTo(-55 + 5.06281, 4)
    // The three old tree boxes remain here until Landscape retires their trees.
    // Only the retained pole and social icons are permanent static proxies.
    for(const name of expected.filter(name => /Cube0(57|6[3-8])/.test(name))) {
        const bounds = new THREE.Box3().setFromObject(gltf.scene.getObjectByName(name))
        let clearance = Infinity
        for(let ix = 0; ix <= 4; ix++) for(let iy = 0; iy <= 4; iy++)
            clearance = Math.min(clearance, roadEdgeDistance(
                bounds.min.x + (bounds.max.x-bounds.min.x)*ix/4,
                bounds.min.y + (bounds.max.y-bounds.min.y)*iy/4
            ))
        expect(clearance).toBeGreaterThan(.5)
    }
    gltf.scene.traverse(node => { if(node.isMesh) { node.geometry.dispose(); node.material.dispose() } })
})

test('runtime landmark retirement isolates resource roots and preserves the Indian pole', () => {
    const base = new THREE.Group(), collision = new THREE.Group()
    for(const name of [...retiredInformationMeshes, 'shadeGreen002', 'shadeOrange005', 'floor008']) {
        const node = new THREE.Object3D(); node.name = name
        node.position.set(-6.17, 6.37, 1); node.rotation.z = .3; node.scale.set(1, 2, 3)
        base.add(node)
    }
    for(const name of [...retiredInformationCollisions, 'Cube057', 'Cube063', 'Cube094']) {
        const node = new THREE.Object3D(); node.name = name
        node.position.set(-4.234, 5.063, 1.8); node.scale.set(.117, .117, 3.595)
        collision.add(node)
    }
    const subject = buildInformationStatic(base, collision)
    expect(subject.base.children.map(node => node.name)).toEqual(['shadeGreen002', 'shadeOrange005', 'floor008'])
    expect(subject.collision.children.map(node => node.name)).toEqual(['Cube057', 'Cube063', 'Cube094'])
    for(const [original, clone] of [[base, subject.base], [collision, subject.collision]]) {
        for(const node of original.children) expect(node.parent).toBe(original)
        for(const node of clone.children) {
            const source = original.getObjectByName(node.name)
            expect(node).not.toBe(source)
            expect(node.position.toArray()).toEqual(source.position.toArray())
            expect(node.quaternion.toArray()).toEqual(source.quaternion.toArray())
            expect(node.scale.toArray()).toEqual(source.scale.toArray())
        }
    }
    expect(base.children).toHaveLength(retiredInformationMeshes.size + 3)
    expect(collision.children).toHaveLength(retiredInformationCollisions.size + 3)
})
