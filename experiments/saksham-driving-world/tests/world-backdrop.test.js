import { expect, test } from 'bun:test'
import * as THREE from 'three'
import WorldBackdrop, { shorelineGeometry, coastalTreePlacements, worldAtmosphere } from '../src/javascript/World/WorldBackdrop.js'
import BotanicalDressing from '../src/javascript/World/BotanicalDressing.js'
import { landscapeBounds, surfaceHeight } from '../src/javascript/World/LandscapeLayout.js'
import EventEmitter from '../src/javascript/Utils/EventEmitter.js'

test('shoreline joins every heightfield edge vertex and descends below the water', () => {
    const geometry = shorelineGeometry(), positions = geometry.attributes.position
    const b = landscapeBounds, count = 2 * ((b.maxX - b.minX) + (b.maxY - b.minY)) / b.step
    for(let i = 0; i < count; i++) {
        const x = positions.getX(i), y = positions.getY(i)
        expect(x === b.minX || x === b.maxX || y === b.minY || y === b.maxY).toBe(true)
        expect(positions.getZ(i)).toBeCloseTo(surfaceHeight(x, y), 4)
        const last = positions.count - count + i
        expect(positions.getZ(last)).toBeLessThan(worldAtmosphere.waterLevel)
    }
    // New land belongs entirely outside the existing road/physics rectangle.
    for(let i = count; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i)
        expect(x < b.minX || x > b.maxX || y < b.minY || y > b.maxY).toBe(true)
    }
    geometry.dispose()
})

test('boundary uses a small texture-free backdrop and top view keeps the entire map clear', () => {
    const scene = new THREE.Scene(), container = new THREE.Group(), time = new EventEmitter()
    const camera = { instance: new THREE.PerspectiveCamera(), view: 'orbit' }
    const backdrop = new WorldBackdrop({ container, scene, camera, time })
    let triangles = 0
    backdrop.container.traverse(mesh => {
        if(!mesh.isMesh) return
        triangles += (mesh.geometry.index?.count || mesh.geometry.attributes.position.count) / 3 * (mesh.isInstancedMesh ? mesh.count : 1)
        expect(mesh.material.map).toBeFalsy()
        expect(mesh.userData.cameraCollision).toBe(false)
    })
    expect(triangles).toBeLessThan(12000)
    expect(backdrop.container.children).toHaveLength(6)
    expect(backdrop.sky.material.depthWrite).toBe(false)
    expect(backdrop.water.position.z).toBe(worldAtmosphere.waterLevel)
    const b = landscapeBounds
    const rockMatrix = new THREE.Matrix4(), rockPosition = new THREE.Vector3()
    for(let i = 0; i < backdrop.rocks.count; i++) {
        backdrop.rocks.getMatrixAt(i, rockMatrix)
        rockPosition.setFromMatrixPosition(rockMatrix)
        expect(rockPosition.x < b.minX || rockPosition.x > b.maxX || rockPosition.y < b.minY || rockPosition.y > b.maxY).toBe(true)
    }
    for(const hill of backdrop.hills) {
        const positions = hill.geometry.attributes.position
        for(let i = 0; i < positions.count; i++) {
            const x = positions.getX(i), y = positions.getY(i)
            expect(x < b.minX || x > b.maxX || y < b.minY || y > b.maxY).toBe(true)
        }
    }
    const trees = coastalTreePlacements()
    expect(trees).toHaveLength(48)
    for(const p of trees) {
        expect(p.x < b.minX || p.x > b.maxX || p.y < b.minY || p.y > b.maxY).toBe(true)
        expect(p.kind).toBe('tree-broadleaf')
    }
    const subject = { trees: [...trees, { x: 0, y: 0, z: 0, angle: 0, scale: 1 }] }
    let solids
    BotanicalDressing.prototype.setTreeCollisions.call(subject, { addObjectFromThree: options => { solids = options.meshes } })
    expect(solids).toHaveLength(1)
    expect(camera.instance.far).toBe(worldAtmosphere.viewDistance)
    camera.view = 'top'; time.trigger('tick')
    expect(scene.fog.density).toBe(0)
    camera.view = 'orbit'; time.elapsed = 2500; time.trigger('tick')
    expect(scene.fog.density).toBe(worldAtmosphere.fogDensity)
    expect(backdrop.waterTime.value).toBe(2.5)
    backdrop.setAtmosphere('night')
    expect(backdrop.sky.material.uniforms.starStrength.value).toBe(1)
    expect(backdrop.waterDusk.value).toBeCloseTo(.92, 4)
    backdrop.setAtmosphere('day')
    expect(backdrop.sky.material.uniforms.starStrength.value).toBe(0)
    backdrop.setAtmosphere('dusk')
    backdrop.dispose()
    expect(container.children).toHaveLength(0)
    camera.view = 'top'; time.trigger('tick')
    expect(scene.fog.density).toBe(worldAtmosphere.fogDensity)
})
