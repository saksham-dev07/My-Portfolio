import { expect, test } from 'bun:test'
import * as THREE from 'three'
import DistrictScenery from '../src/javascript/World/Sections/DistrictScenery.js'
import { districtCourts, districtFurniture, isDistrictPaving } from '../src/javascript/World/Sections/DistrictIdentityLayout.js'
import { vehicleEffectState } from '../src/javascript/World/WorldLife.js'
import { profileForecourts, profileArtworkPositions } from '../src/javascript/World/Sections/ProfileForecourts.js'
import { roadEdgeDistance, surfaceHeight } from '../src/javascript/World/LandscapeLayout.js'
import { clearLandmarkPlanting } from '../src/javascript/World/EnvironmentLayout.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

async function createScenery() {
    const gltf = await new GLTFLoader().parseAsync(await Bun.file(new URL('../static/saksham/models/refined-props.glb', import.meta.url)).arrayBuffer(), '')
    const removed = [], callbacks = new Map(), collisions = []
    const world = { removeBody: body => removed.push(body) }
    const scenery = new DistrictScenery({
        objects: { physics: { addObjectFromThree: options => ({ options, body: { world } }) } },
        time: { elapsed: 1000, on: (name, callback) => callbacks.set(name, callback), off: name => callbacks.delete(name) },
        camera: { view: 'orbit' },
        loader: { load: (url, onLoad) => onLoad(gltf) },
    }, new THREE.Group(), collisions)
    scenery.props.load()
    return { scenery, callbacks, removed, collisions }
}

test('district paving stays on flat ground and clear of the full road shoulders', () => {
    for (const court of districtCourts) {
        for (let ix = 0; ix <= 16; ix++) for (let iy = 0; iy <= 16; iy++) {
            const x = court.x - court.w / 2 + ix * court.w / 16, y = court.y - court.h / 2 + iy * court.h / 16
            expect(roadEdgeDistance(x, y)).toBeGreaterThan(.3)
            expect(surfaceHeight(x, y)).toBeCloseTo(0, 5)
        }
        expect(clearLandmarkPlanting(court.x, court.y, .1)).toBe(false)
    }
})

test('new furniture leaves all four labels and interaction pads clear in the chase view', async () => {
    const { scenery } = await createScenery()
    for (const prop of scenery.props.placements.filter(p => ['rack', 'chest'].includes(p.kind))) {
        const front = new THREE.Vector3(0, -1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), prop.angle)
        expect(front.y).toBeGreaterThan(.99)
    }
    for (const proxy of scenery.solids) {
        const box = new THREE.Box3(new THREE.Vector3(-.5, -.5, -.5), new THREE.Vector3(.5, .5, .5))
        proxy.updateMatrixWorld(true); box.applyMatrix4(proxy.matrixWorld)
        expect(roadEdgeDistance(proxy.position.x, proxy.position.y)).toBeGreaterThan(1)
        for (const { title, entry } of Object.values(profileForecourts)) {
            expect(Math.abs(proxy.position.x - entry.x) < proxy.scale.x / 2 + entry.w / 2 && Math.abs(proxy.position.y - entry.y) < proxy.scale.y / 2 + entry.h / 2).toBe(false)
            for (const offset of [-8, 0, 8]) {
                const camera = new THREE.Vector3(entry.x + offset, entry.y + 18, 8)
                for (const rect of [title, entry]) for (const dx of [-.5, 0, .5]) for (const dy of [-.5, 0, .5]) {
                    const target = new THREE.Vector3(rect.x + dx * rect.w, rect.y + dy * rect.h, .10)
                    const ray = new THREE.Ray(camera, target.clone().sub(camera).normalize()), hit = ray.intersectBox(box, new THREE.Vector3())
                    expect(hit === null || hit.distanceTo(camera) > target.distanceTo(camera)).toBe(true)
                }
            }
        }
    }
    expect(districtFurniture.filter(item => item.kind === 'banner').every(item => item.y < profileArtworkPositions.highlights.y - 4)).toBe(true)
    scenery.dispose()
})

test('scenery fits a small rendering budget and frees its geometry, material and tick listener', async () => {
    const { scenery, callbacks, removed, collisions } = await createScenery()
    expect(scenery.container.children).toHaveLength(7)
    const triangles = scenery.container.children.reduce((sum, mesh) => sum + (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3, 0)
    expect(triangles).toBeLessThan(30_000)
    expect(collisions).toHaveLength(1)
    expect(collisions[0].options.mass).toBe(0)
    expect(scenery.surfaces.every(mesh => mesh.position.z < .04 && !mesh.material.depthWrite)).toBe(true)
    expect(scenery.surfaces.every(mesh => mesh.renderOrder < 0 && mesh.material.transparent)).toBe(true)
    expect(scenery.materials.size).toBe(5)
    let disposed = 0
    for (const resource of [...scenery.geometries, ...scenery.materials]) resource.addEventListener('dispose', () => disposed++)
    const count = scenery.geometries.size + scenery.materials.size
    expect(callbacks.size).toBe(1)
    scenery.dispose()
    expect(disposed).toBe(count); expect(callbacks.size).toBe(0); expect(removed).toHaveLength(1)
})

test('wheel effects keep dust on lawn/gravel and tyre marks on the new paved courts', () => {
    const body = { velocity: { x: 5, y: 0 }, quaternion: { x: 0, y: 0, z: 0, w: 1 } }
    for (const court of districtCourts) {
        const paved = isDistrictPaving(court.x, court.y)
        const effects = vehicleEffectState(body, { brake: true }, true, paved)
        expect(effects.dust).toBe(court.id === 'about')
        expect(effects.skid).toBe(court.id !== 'about')
        expect(isDistrictPaving(court.x + court.w / 2, court.y + court.h / 2)).toBe(false)
    }
    expect(isDistrictPaving(0, -30)).toBe(false)
})
