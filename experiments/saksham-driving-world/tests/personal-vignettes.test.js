import { expect, test } from 'bun:test'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import PersonalVignettes, { vignetteGeometry, vignetteScale } from '../src/javascript/World/PersonalVignettes.js'
import { hubActivities, hubPadTop } from '../src/javascript/World/HubLayout.js'
import { roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'

const asset = new URL('../static/saksham/models/personal-vignettes.glb', import.meta.url)

test('five personal full-body scenes stay low-poly and contain no portrait texture', async () => {
    const bytes = await Bun.file(asset).arrayBuffer()
    expect(bytes.byteLength).toBeLessThan(400_000)
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, new DataView(bytes).getUint32(12, true))))
    expect(json.images?.length || 0).toBe(0)
    expect(json.materials).toHaveLength(1)
    expect(json.extensionsRequired?.length || 0).toBe(0)
    const gltf = await new GLTFLoader().parseAsync(bytes, '')
    gltf.scene.updateMatrixWorld(true)
    const names = [], geometries = []
    let triangles = 0
    gltf.scene.traverse(node => {
        if (!node.isMesh) return
        names.push(node.name)
        const geometry = vignetteGeometry(node), bounds = geometry.boundingBox
        geometries.push(geometry)
        const count = (geometry.index?.count || geometry.attributes.position.count) / 3
        expect(count).toBeLessThan(1400)
        triangles += count
        expect(bounds.min.z).toBeCloseTo(0, 4)
        expect(bounds.max.z).toBeGreaterThan(1.4)
        for (const edge of [bounds.min.x, bounds.max.x, bounds.min.y, bounds.max.y]) expect(Math.abs(edge) * vignetteScale).toBeLessThan(2.5)
        expect(geometry.getAttribute('color')).toBeDefined()
        expect(node.userData.collisionBoxes.length).toBeGreaterThan(2)
    })
    expect(names.sort()).toEqual(hubActivities.map(p => `activity-${p.id}`).sort())
    expect(triangles).toBeLessThan(5000)
    geometries.forEach(geometry => geometry.dispose())
})

test('personal models and their collision proxies stay above the retained pads and off roads', async () => {
    const gltf = await new GLTFLoader().parseAsync(await Bun.file(asset).arrayBuffer(), '')
    const subject = {}, container = new THREE.Group()
    let solids = []
    const objects = {
        materials: { shades: { items: { white: { uniforms: { matcap: { value: new THREE.Texture() } } } } } },
        physics: { addObjectFromThree: options => { solids = options.meshes; return { body: {} } } },
    }
    PersonalVignettes.prototype.addAsset.call(subject, gltf, { container, objects })
    expect(subject.items).toHaveLength(5)
    expect(solids.length).toBeGreaterThan(20)
    container.updateMatrixWorld(true)
    for (const { group, mesh } of subject.items) {
        const bounds = new THREE.Box3().setFromObject(mesh)
        expect(bounds.min.z).toBeCloseTo(hubPadTop + .005, 4)
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) expect(roadEdgeDistance(x, y)).toBeGreaterThan(.1)
        expect(mesh.material.vertexColors).toBe(true)
        expect(Math.abs(bounds.min.x - group.position.x)).toBeLessThan(2.5)
        expect(Math.abs(bounds.max.x - group.position.x)).toBeLessThan(2.5)
    }
    for (const solid of solids) {
        solid.updateMatrix()
        expect(solid.scale.x).toBeGreaterThan(0)
        expect(solid.scale.y).toBeGreaterThan(0)
        expect(solid.scale.z).toBeGreaterThan(0)
        expect(solid.position.z - solid.scale.z / 2).toBeGreaterThanOrEqual(hubPadTop - .025)
        for (const x of [-.5, .5]) for (const y of [-.5, .5]) {
            const point = new THREE.Vector3(x, y, 0).applyMatrix4(solid.matrix)
            expect(roadEdgeDistance(point.x, point.y)).toBeGreaterThan(.1)
        }
    }
})

test('activity poses read as a dunk, front-facing arcade play and a stocked workout station', async () => {
    const gltf = await new GLTFLoader().parseAsync(await Bun.file(asset).arrayBuffer(), '')
    const dunk = gltf.scene.getObjectByName('activity-basketball').userData.poseLandmarks
    const ball = new THREE.Vector3().fromArray(dunk.ballCenter), hand = new THREE.Vector3().fromArray(dunk.rightHand)
    expect(hand.distanceTo(ball)).toBeLessThan(dunk.ballRadius + .025)
    expect(Math.hypot(ball.x - dunk.rimCenter[0], ball.y - dunk.rimCenter[1])).toBeLessThan(dunk.rimRadius)
    expect(ball.z - dunk.ballRadius).toBeGreaterThanOrEqual(dunk.rimCenter[2])
    expect(dunk.ankles.every(point => point[2] > .6)).toBe(true)
    const arcade = gltf.scene.getObjectByName('activity-gaming').userData.poseLandmarks
    expect(arcade.playerCenter[0]).toBeCloseTo(arcade.cabinetCenter[0], 5)
    expect(arcade.playerCenter[1]).toBeLessThan(arcade.cabinetCenter[1] - .5)
    expect(arcade.bodyHeading).toBeCloseTo(Math.PI, 5)
    expect(new THREE.Vector3().fromArray(arcade.rightHand).distanceTo(new THREE.Vector3().fromArray(arcade.joystickKnob))).toBeLessThan(.04)
    expect(new THREE.Vector3().fromArray(arcade.leftHand).distanceTo(new THREE.Vector3().fromArray(arcade.actionButton))).toBeLessThan(.04)
    const gym = gltf.scene.getObjectByName('activity-gym').userData.poseLandmarks
    expect(gym.floorDumbbells).toHaveLength(3)
    expect(gym.floorDumbbells.every(point => point[2] < .15)).toBe(true)
    expect(gym.benchCenter[1]).toBeGreaterThan(.8)
})
