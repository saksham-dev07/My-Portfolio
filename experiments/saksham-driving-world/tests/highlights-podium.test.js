import { expect, test } from 'bun:test'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import ProfileLandmarks, { authoredLandmarkSolids } from '../src/javascript/World/Sections/ProfileLandmarks.js'
import { profileSections } from '../src/javascript/sakshamProfile.js'
import { roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'

const asset = new URL('../static/saksham/models/highlights-podium.glb', import.meta.url)

test('Blender highlights podium ships one lightweight palette and a genuinely open cup', async () => {
    const bytes = await Bun.file(asset).arrayBuffer()
    expect(bytes.byteLength).toBeLessThan(250_000)
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, new DataView(bytes).getUint32(12, true))))
    expect(json.images?.length || 0).toBe(0)
    expect(json.materials).toHaveLength(1)
    expect(json.extensionsRequired?.length || 0).toBe(0)
    const gltf = await new GLTFLoader().parseAsync(bytes, '')
    const source = gltf.scene.getObjectByName('highlights-podium')
    expect(source.userData.assetVersion).toBe(2)
    expect(source.userData.design.handleCount).toBe(2)
    expect(source.userData.design.plaques).toEqual(['front', 'back'])
    expect(source.userData.collisionBoxes).toHaveLength(4)
    const triangles = (source.geometry.index?.count || source.geometry.attributes.position.count) / 3
    expect(triangles).toBeGreaterThan(2000)
    expect(triangles).toBeLessThan(4000)
    const conversion = new THREE.Group()
    conversion.rotation.x = Math.PI / 2
    conversion.add(gltf.scene)
    conversion.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(conversion)
    expect(bounds.min.z).toBeCloseTo(0, 4)
    expect(bounds.max.z).toBeCloseTo(4.85, 4)
    expect(bounds.max.x - bounds.min.x).toBeCloseTo(5.2, 4)
    expect(bounds.max.y - bounds.min.y).toBeCloseTo(3.8, 4)
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 6), new THREE.Vector3(0, 0, -1))
    const hit = ray.intersectObject(conversion, true)[0]
    expect(hit.point.z).toBeCloseTo(source.userData.design.innerFloorHeight, 4)
    expect(hit.point.z).toBeLessThan(source.userData.design.cupRimHeight - 1)
})

test('authored podium normalization preserves the Highlights location and entry clearance', async () => {
    const gltf = await new GLTFLoader().parseAsync(await Bun.file(asset).arrayBuffer(), '')
    let collisionOptions
    const subject = {
        container: new THREE.Group(), collisions: [], models: [], matcap: new THREE.Texture(),
        physics: { addObjectFromThree: options => { collisionOptions = options; return { body: {} } } },
    }
    const section = profileSections.find(section => section.id === 'highlights')
    const model = ProfileLandmarks.prototype.add.call(subject, gltf, {
        name: section.name, x: section.x, y: section.y + 7, width: 10, depth: 7, height: 5, authored: true,
    })
    expect(model.position.toArray()).toEqual([30, -83, 0])
    expect(subject.models[0].solids).toBe(4)
    expect(collisionOptions.meshes).toHaveLength(4)
    expect(collisionOptions.mass).toBe(0)
    model.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(model)
    expect(bounds.min.z).toBeCloseTo(.08, 4)
    expect(bounds.max.z).toBeCloseTo(5.08, 4)
    model.traverse(node => {
        if (!node.isMesh) return
        expect(node.material.isMeshMatcapMaterial).toBe(true)
        expect(node.material.vertexColors).toBe(true)
        expect(node.geometry.getAttribute('color')).toBeDefined()
    })
    for (const solid of collisionOptions.meshes) {
        const worldX = solid.position.x + section.x
        const worldY = solid.position.y + section.y + 7
        expect(Math.abs(worldY - (section.y - 4))).toBeGreaterThan(solid.scale.y / 2 + 2)
        expect(solid.position.z - solid.scale.z / 2).toBeGreaterThanOrEqual(.079)
        for (const dx of [-.5, .5]) for (const dy of [-.5, .5]) {
            expect(roadEdgeDistance(worldX + dx * solid.scale.x, worldY + dy * solid.scale.y)).toBeGreaterThan(.1)
        }
    }
    // Proxy authoring uses local Z-up coordinates, including any future rotation.
    const rotated = authoredLandmarkSolids([{ center: [1, 2, 3], size: [2, 4, 6] }], 2, new THREE.Vector3(4, 5, 6), Math.PI / 2)[0]
    expect(rotated.position.x).toBeCloseTo(0, 5)
    expect(rotated.position.y).toBeCloseTo(7, 5)
    expect(rotated.position.z).toBeCloseTo(12, 5)
    expect(rotated.scale.toArray()).toEqual([4, 8, 12])
})
