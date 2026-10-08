import { expect, test } from 'bun:test'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { grovePlacements, dressingPlacements } from '../src/javascript/World/EnvironmentLayout.js'
import { foundationDistance, roadEdgeDistance, surfaceHeight } from '../src/javascript/World/LandscapeLayout.js'

test('planting respects scaled footprints, roads and destinations at different canopy sizes',()=>{
    for(const radius of [.9,1.4,2]) {
        const trees=grovePlacements(radius)
        expect(trees.length).toBeGreaterThan(20)
        expect(trees).toEqual(grovePlacements(radius))
        const dressing=dressingPlacements(trees)
        expect(dressing.length).toBeGreaterThan(50)
        for(const p of [...trees,...dressing]) {
            expect(roadEdgeDistance(p.x,p.y)-p.radius).toBeGreaterThanOrEqual(.8)
            expect(foundationDistance(p.x,p.y)-p.radius).toBeGreaterThanOrEqual(.65)
            expect(p.z).toBe(surfaceHeight(p.x,p.y))
        }
        for(let i=0;i<trees.length;i++) for(let j=i+1;j<trees.length;j++) {
            expect(Math.hypot(trees[i].x-trees[j].x,trees[i].y-trees[j].y)).toBeGreaterThanOrEqual((trees[i].radius+trees[j].radius)*.85+.5)
        }
    }
})

test('exported Blender kit stays inside runtime clearance envelopes and asset budget',async()=>{
    const bytes=await Bun.file(new URL('../static/saksham/models/environment-kit.glb',import.meta.url)).arrayBuffer()
    expect(bytes.byteLength).toBeLessThan(500_000)
    const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,new DataView(bytes).getUint32(12,true))))
    expect(json.images?.length || 0).toBe(0)
    expect(json.materials).toHaveLength(1)
    const gltf=await new GLTFLoader().parseAsync(bytes,'')
    gltf.scene.updateMatrixWorld(true)
    const kinds=[]
    gltf.scene.traverse(node=>{
        if(!node.isMesh) return
        kinds.push(node.name)
        const g=node.geometry.clone().applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI/2).multiply(node.matrixWorld))
        const positions=g.getAttribute('position')
        const radius=node.name.startsWith('rock') ? 1.55 : node.name==='grass' ? .55 : .9
        for(let i=0;i<positions.count;i++) expect(Math.hypot(positions.getX(i),positions.getY(i))).toBeLessThanOrEqual(radius)
        expect((g.index?.count || positions.count)/3).toBeLessThan(700)
        expect(g.getAttribute('color')).toBeDefined()
        g.dispose()
    })
    expect(kinds.sort()).toEqual(['grass','rock-0','rock-1','rock-2','shrub-0','shrub-1'])
})
