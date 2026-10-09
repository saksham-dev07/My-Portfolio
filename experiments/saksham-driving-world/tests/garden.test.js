import { expect, test } from 'bun:test'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { garden, gardenPaths, gardenPathDistance, gardenReserved } from '../src/javascript/World/GardenLayout.js'
import { grovePlacements, dressingPlacements } from '../src/javascript/World/EnvironmentLayout.js'
import { roadEdgeDistance, surfaceHeight } from '../src/javascript/World/LandscapeLayout.js'

test('garden entrance connects to the ridge road and its loop without isolated path segments',()=>{
    const [entry,loop]=gardenPaths
    expect(roadEdgeDistance(...entry.points[0])).toBeLessThan(0)
    expect(entry.points.at(-1)).toEqual(loop.points[0])
    expect(loop.points[0][0]).toBeCloseTo(loop.points.at(-1)[0],8)
    expect(loop.points[0][1]).toBeCloseTo(loop.points.at(-1)[1],8)
    for(const [x,y] of loop.points) {
        expect(((x-garden.x)/9)**2+((y-garden.y)/7)**2).toBeCloseTo(1,8)
        expect(roadEdgeDistance(x,y)).toBeGreaterThan(loop.width/2)
    }
})

test('scaled canopies and dressing stay off pedestrian paths and the shelter terrace',()=>{
    for(const radius of [.9,1.4,2]) {
        const trees=grovePlacements(radius)
        for(const p of [...trees,...dressingPlacements(trees)]) {
            expect(gardenPathDistance(p.x,p.y)).toBeGreaterThanOrEqual(p.radius+.45)
            expect(gardenReserved(p.x,p.y,p.radius)).toBe(false)
        }
    }
    const {x,y,w,h}=garden.shelter
    for(const dx of [-w/2,0,w/2]) for(const dy of [-h/2,0,h/2]) expect(surfaceHeight(x+dx,y+dy)).toBe(0)
})

test('Blender shelter export is one untextured colored mesh within the reserved footprint',async()=>{
    const bytes=await Bun.file(new URL('../static/saksham/models/garden-shelter.glb',import.meta.url)).arrayBuffer()
    expect(bytes.byteLength).toBeLessThan(400_000)
    const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,new DataView(bytes).getUint32(12,true))))
    expect(json.images?.length || 0).toBe(0)
    expect(json.materials).toHaveLength(1)
    const gltf=await new GLTFLoader().parseAsync(bytes,'')
    gltf.scene.rotation.x=Math.PI/2;gltf.scene.updateMatrixWorld(true)
    const bounds=new THREE.Box3().setFromObject(gltf.scene),size=bounds.getSize(new THREE.Vector3())
    expect(size.x).toBeLessThan(garden.shelter.w)
    expect(size.y).toBeLessThan(garden.shelter.h)
    expect(bounds.min.z).toBeCloseTo(0,4)
    expect(size.z).toBeGreaterThan(3.3)
    expect(size.z).toBeLessThan(3.9)
    let meshes=0,triangles=0
    gltf.scene.traverse(node=>{
        if(!node.isMesh) return
        meshes++;triangles+=(node.geometry.index?.count || node.geometry.attributes.position.count)/3
        expect(node.geometry.getAttribute('color')).toBeDefined()
    })
    expect(meshes).toBe(1);expect(triangles).toBeLessThan(6000)
})
