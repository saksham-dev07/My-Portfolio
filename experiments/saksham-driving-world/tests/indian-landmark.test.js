import { expect, test } from 'bun:test'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import InformationSection from '../src/javascript/World/Sections/InformationSection.js'
import { vignetteGeometry } from '../src/javascript/World/PersonalVignettes.js'
import { roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'

const asset = new URL('../static/saksham/models/indian-landmark.glb', import.meta.url)

test('the Indian landmark is a small texture-free Blender asset with structural collisions', async () => {
    const bytes = await Bun.file(asset).arrayBuffer()
    expect(bytes.byteLength).toBeLessThan(200_000)
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, new DataView(bytes).getUint32(12, true))))
    expect(json.images?.length || 0).toBe(0)
    expect(json.materials).toHaveLength(1)
    expect(json.extensionsRequired?.length || 0).toBe(0)
    const gltf = await new GLTFLoader().parseAsync(bytes, '')
    gltf.scene.updateMatrixWorld(true)
    let triangles = 0, solids = 0
    gltf.scene.traverse(node => {
        if (!node.isMesh) return
        const geometry = vignetteGeometry(node), bounds = geometry.boundingBox
        triangles += (geometry.index?.count || geometry.attributes.position.count) / 3
        expect(bounds.min.z).toBeCloseTo(0, 4)
        expect(bounds.max.z).toBeGreaterThan(3)
        expect(bounds.max.x - bounds.min.x).toBeLessThanOrEqual(3.51)
        expect(bounds.max.y - bounds.min.y).toBeLessThanOrEqual(2.51)
        expect(geometry.getAttribute('color')).toBeDefined()
        solids += node.userData.collisionBoxes?.length || 0
        geometry.dispose()
    })
    expect(triangles).toBeLessThan(2000)
    expect(solids).toBeGreaterThanOrEqual(3)
})

test('the landmark and structural proxies clear the road and retain source geometry ownership', async () => {
    const gltf = await new GLTFLoader().parseAsync(await Bun.file(asset).arrayBuffer(), '')
    const source = [], container = new THREE.Group()
    gltf.scene.traverse(node => { if (node.isMesh) source.push({ node, positions: node.geometry.attributes.position.array.slice() }) })
    let solids = []
    const subject = {
        x: 1.2, y: -55, container, resources: { items: { informationLandmarkIndia: gltf } },
        objects: {
            materials: { shades: { items: { white: { uniforms: { matcap: { value: new THREE.Texture() } } } } } },
            physics: { addObjectFromThree: options => { solids = options.meshes; return options } },
        },
    }
    InformationSection.prototype.setLandmark.call(subject)
    container.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(subject.landmark)
    expect(bounds.min.z).toBeGreaterThan(0)
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) expect(roadEdgeDistance(x, y)).toBeGreaterThan(.5)
    // Keep the existing flag's circular stand separate from the new plinth.
    expect(bounds.max.x).toBeLessThan(1.2 - 4.23059 - .75)
    for (const solid of solids) {
        solid.updateMatrix()
        expect(solid.scale.toArray().every(size => size > 0)).toBe(true)
        for (const x of [-.5, .5]) for (const y of [-.5, .5]) {
            const corner = new THREE.Vector3(x, y, 0).applyMatrix4(solid.matrix)
            expect(roadEdgeDistance(corner.x, corner.y)).toBeGreaterThan(.5)
        }
    }
    for (const { node, positions } of source) expect(node.geometry.attributes.position.array).toEqual(positions)
})
