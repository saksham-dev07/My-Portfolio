import { expect, test } from 'bun:test'
import draco3d from 'draco3d'
import * as THREE from 'three'
import * as CANNON from 'cannon'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { retainedHubNodes, hubActivities, hubPadTop, hubSignRelocations } from '../src/javascript/World/HubLayout.js'
import { buildHubStatic } from '../src/javascript/World/HubWayfinding.js'
import { roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'
import Physics from '../src/javascript/World/Physics.js'
import CrossroadsSection from '../src/javascript/World/Sections/CrossroadsSection.js'
import { pruneCrossroads } from '../../../scripts/assets/prune-crossroads.mjs'

const asset = new URL('../static/models/crossroads/static/base.glb', import.meta.url)
const collisionAsset = new URL('../static/models/crossroads/static/collision.glb', import.meta.url)
const readJson = bytes => JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, new DataView(bytes).getUint32(12, true))))

// Exercise GLTFLoader with a synchronous Draco adapter outside browser workers.
async function loadHub() {
    const draco = await draco3d.createDecoderModule()
    const adapter = {
        preload() {},
        decodeDracoFile(bytes, onLoad, attributeIds, attributeTypes, _colorSpace, onError) {
            const decoder = new draco.Decoder(), buffer = new draco.DecoderBuffer(), mesh = new draco.Mesh()
            try {
                buffer.Init(new Int8Array(bytes), bytes.byteLength)
                const status = decoder.DecodeBufferToMesh(buffer, mesh)
                if(!status.ok()) throw new Error(status.error_msg())
                const geometry = new THREE.BufferGeometry()
                for(const [name, id] of Object.entries(attributeIds)) {
                    expect(attributeTypes[name]).toBe('Float32Array')
                    const attribute = decoder.GetAttributeByUniqueId(mesh, id), values = new draco.DracoFloat32Array()
                    decoder.GetAttributeFloatForAllPoints(mesh, attribute, values)
                    const array = new Float32Array(values.size())
                    for(let i = 0; i < array.length; i++) array[i] = values.GetValue(i)
                    geometry.setAttribute(name, new THREE.BufferAttribute(array, attribute.num_components()))
                    draco.destroy(values)
                }
                const indices = new Uint32Array(mesh.num_faces() * 3), face = new draco.DracoInt32Array()
                for(let i = 0; i < mesh.num_faces(); i++) {
                    decoder.GetFaceFromMesh(mesh, i, face)
                    for(let axis = 0; axis < 3; axis++) indices[i * 3 + axis] = face.GetValue(axis)
                }
                draco.destroy(face)
                geometry.setIndex(new THREE.BufferAttribute(indices, 1))
                onLoad(geometry)
            } catch(error) { onError(error) }
            finally { draco.destroy(mesh); draco.destroy(buffer); draco.destroy(decoder) }
        }
    }
    return new GLTFLoader().setDRACOLoader(adapter).parseAsync(await Bun.file(asset).arrayBuffer(), '')
}

test('pruned crossroads downloads only plinths, wayfinding and corresponding rocks', async() => {
    const bytes = await Bun.file(asset).arrayBuffer(), json = readJson(bytes)
    expect(bytes.byteLength).toBeLessThan(60_000)
    expect(json.nodes).toHaveLength(retainedHubNodes.length)
    expect(json.scenes[0].nodes).toHaveLength(retainedHubNodes.length)
    expect(json.nodes.every(node => !node.children?.length)).toBe(true)
    expect(json.nodes.some(node => /floor|orange|easterEgg/i.test(node.name))).toBe(false)
    expect(json.images?.length || 0).toBe(0)
    const triangles = json.nodes.reduce((total, node) => total + json.meshes[node.mesh].primitives.reduce((count, primitive) => count + json.accessors[primitive.indices].count / 3, 0), 0)
    expect(triangles).toBeLessThan(6_000)
    expect(pruneCrossroads(bytes)).toEqual(Buffer.from(bytes))

    let occupied = 0, previousEnd = 0
    const binaryOffset = 28 + new DataView(bytes).getUint32(12, true)
    for(const view of [...json.bufferViews].sort((a, b) => a.byteOffset - b.byteOffset)) {
        expect(view.buffer).toBe(0)
        expect(view.byteOffset % 4).toBe(0)
        expect(binaryOffset + view.byteOffset + view.byteLength).toBeLessThanOrEqual(bytes.byteLength)
        expect(view.byteOffset).toBeGreaterThanOrEqual(previousEnd)
        previousEnd = view.byteOffset + view.byteLength
        occupied += view.byteLength
    }
    expect(json.buffers[0].byteLength - occupied).toBeLessThan(json.bufferViews.length * 4)
    for(const mesh of json.meshes) for(const primitive of mesh.primitives) {
        expect(json.accessors[primitive.indices]).toBeDefined()
        for(const accessor of Object.values(primitive.attributes)) expect(json.accessors[accessor]).toBeDefined()
        expect(json.bufferViews[primitive.extensions.KHR_draco_mesh_compression.bufferView]).toBeDefined()
    }
})

test('decoded retained plinths preserve world anchors, tops and collision footprints', async() => {
    const hub = await loadHub()
    expect(hub.scene.children.map(node => node.name).sort()).toEqual([...retainedHubNodes].sort())
    hub.scene.position.y = -30
    hub.scene.updateMatrixWorld(true)
    const collisions = await new GLTFLoader().parseAsync(await Bun.file(collisionAsset).arrayBuffer(), '')
    collisions.scene.position.y = -30
    collisions.scene.updateMatrixWorld(true)
    expect(collisions.scene.children).toHaveLength(12)
    const colliderNames = ['Cube', 'Cube016', 'Cube017', 'Cube018', 'Cube019']
    for(const [index, activity] of hubActivities.entries()) {
        const pad = new THREE.Box3().setFromObject(hub.scene.getObjectByName(activity.pad)), center = pad.getCenter(new THREE.Vector3())
        expect(center.x).toBeCloseTo(activity.x, 4)
        expect(center.y).toBeCloseTo(activity.y, 4)
        expect(pad.max.z).toBeCloseTo(hubPadTop, 3)
        expect(pad.min.z).toBeCloseTo(0, 3)
        expect(pad.getSize(new THREE.Vector3()).x).toBeCloseTo(5.36972, 3)
        const collider = new THREE.Box3().setFromObject(collisions.scene.getObjectByName(colliderNames[index]))
        expect(collider.containsBox(pad)).toBe(true)
        expect(collider.max.z).toBeCloseTo(.957855, 5)
    }
    for(const scene of [hub.scene, collisions.scene]) scene.traverse(node => {
        if(node.isMesh) { node.geometry.dispose(); node.material.dispose() }
    })
})

test('crossroads runtime filtering keeps resource ownership and removes obsolete art', () => {
    const source = new THREE.Group(), mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
    mesh.name = 'shadeWhite078'; source.add(mesh)
    const obsolete = mesh.clone(); obsolete.name = 'shadeOrange007'; source.add(obsolete)
    const floor = mesh.clone(); floor.name = 'floor007'; source.add(floor)
    const collision = new THREE.Group()
    let added
    CrossroadsSection.prototype.setStatic.call({
        x: 0, y: -30,
        resources: { items: { crossroadsStaticBase: { scene: source }, crossroadsStaticCollision: { scene: collision } } },
        objects: { add: options => { added = options } }
    })
    expect(source.children).toHaveLength(3)
    expect(mesh.parent).toBe(source)
    expect(added.base.children).toHaveLength(1)
    expect(added.base.children[0]).not.toBe(mesh)
    expect(added.base.children[0].name).toBe(mesh.name)
    expect(added.collision).not.toBe(collision)
    expect(added.collision.children).toHaveLength(0)
    expect(added.floorShadowTexture).toBeUndefined()
    expect(added.offset.toArray()).toEqual([0, -30, 0])
    mesh.geometry.dispose(); mesh.material.dispose()
})

test('hub wayfinding footprints and actual Cannon proxies clear every paved shoulder', async() => {
    const hub = await loadHub(), collisions = await new GLTFLoader().parseAsync(await Bun.file(collisionAsset).arrayBuffer(), '')
    const originalPositions = new Map([...hub.scene.children, ...collisions.scene.children].map(node => [node.name, node.position.clone()]))
    const relocated = buildHubStatic(hub.scene, collisions.scene)
    const second = buildHubStatic(hub.scene, collisions.scene)
    for(const scene of [relocated.base, relocated.collision]) {
        scene.position.y = -30
        scene.updateMatrixWorld(true)
    }
    const footprintClearance = node => {
        const bounds = new THREE.Box3().setFromObject(node)
        let minimum = Infinity
        for(let ix = 0; ix <= 8; ix++) for(let iy = 0; iy <= 8; iy++) {
            const x = bounds.min.x + (bounds.max.x - bounds.min.x) * ix / 8
            const y = bounds.min.y + (bounds.max.y - bounds.min.y) * iy / 8
            minimum = Math.min(minimum, roadEdgeDistance(x, y))
        }
        return minimum
    }
    for(const group of hubSignRelocations) {
        for(const name of group.nodes) {
            const node = relocated.base.getObjectByName(name)
            expect(node).toBeDefined()
            expect(footprintClearance(node)).toBeGreaterThan(.5)
            expect(node.position.clone().sub(originalPositions.get(name)).toArray()).toEqual([...group.delta, 0])
            expect(second.base.getObjectByName(name).position.toArray()).toEqual(node.position.toArray())
        }
        for(const name of group.colliders) {
            const node = relocated.collision.getObjectByName(name)
            expect(footprintClearance(node)).toBeGreaterThan(.5)
            expect(node.position.clone().sub(originalPositions.get(name)).toArray()).toEqual([...group.delta, 0])
            expect(second.collision.getObjectByName(name).position.toArray()).toEqual(node.position.toArray())
        }
    }
    for(const source of [hub.scene, collisions.scene]) for(const node of source.children) {
        expect(node.position.toArray()).toEqual(originalPositions.get(node.name).toArray())
        expect(node.parent).toBe(source)
    }
    for(const activity of hubActivities) {
        expect(relocated.base.getObjectByName(activity.pad).position.toArray()).toEqual(originalPositions.get(activity.pad).toArray())
    }
    const debugMaterial = new THREE.MeshBasicMaterial(), physics = {
        materials: { items: { dummy: new CANNON.Material() } },
        models: { container: new THREE.Group(), materials: { static: debugMaterial } },
        world: { addBody() {} }, time: { on() {} }
    }
    const body = Physics.prototype.addObjectFromThree.call(physics, {
        meshes: relocated.collision.children, offset: new THREE.Vector3(0, -30, 0), rotation: new THREE.Euler(), mass: 0, sleep: true
    }).body
    expect(body.shapes).toHaveLength(12)
    for(const name of hubSignRelocations.flatMap(group => group.colliders)) {
        const index = relocated.collision.children.findIndex(node => node.name === name)
        const shape = body.shapes[index], center = body.shapeOffsets[index].vadd(body.position)
        let clearance = Infinity
        for(const x of [-1, 1]) for(const y of [-1, 1])
            clearance = Math.min(clearance, roadEdgeDistance(center.x + shape.halfExtents.x * x, center.y + shape.halfExtents.y * y))
        expect(clearance).toBeGreaterThan(.5)
    }
    for(const name of ['Cube', 'Cube016', 'Cube017', 'Cube018', 'Cube019']) {
        const node = relocated.collision.getObjectByName(name)
        expect(node.position.toArray()).toEqual(originalPositions.get(name).toArray())
    }
    for(const scene of [hub.scene, collisions.scene]) scene.traverse(node => {
        if(node.isMesh) { node.geometry.dispose(); node.material.dispose() }
    })
    debugMaterial.dispose()
})
