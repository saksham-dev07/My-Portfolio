import { expect, test } from 'bun:test'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { grovePlacements, landmarkTreePlacements, clearLandmarkPlanting, landmarkTreeClearances, dressingPlacements, flowerPlacements } from '../src/javascript/World/EnvironmentLayout.js'
import { garden, gardenReserved, gardenPathDistance, meadowPatches, meadowOutline } from '../src/javascript/World/GardenLayout.js'
import { roadEdgeDistance, foundationDistance, researchTerraces } from '../src/javascript/World/LandscapeLayout.js'
import BotanicalDressing, { pondRimInset } from '../src/javascript/World/BotanicalDressing.js'
import { profilePathClearances } from '../src/javascript/World/Sections/ProfilePaths.js'

test('Blender tree groups frame every district and preserve complete animated crown clearances',()=>{
    const groves=grovePlacements(2),trees=landmarkTreePlacements(2,groves)
    expect(trees).toEqual(landmarkTreePlacements(2,groves))
    expect(new Set(trees.map(p=>p.group)).size).toBe(8)
    expect(trees.length).toBeGreaterThan(20)
    for(const p of trees) {
        expect(clearLandmarkPlanting(p.x,p.y,p.radius)).toBe(true)
        expect(roadEdgeDistance(p.x,p.y)-p.radius).toBeGreaterThanOrEqual(.8)
        expect(p.radius).toBeGreaterThan(1.788*p.scale+.07*p.scale)
        for(const rect of [...landmarkTreeClearances,...profilePathClearances]) expect(Math.abs(p.x-rect.x)<rect.w/2+p.radius+.65 && Math.abs(p.y-rect.y)<rect.h/2+p.radius+.65).toBe(false)
        for(const other of [...groves,...trees.filter(tree=>tree!==p)]) expect(Math.hypot(other.x-p.x,other.y-p.y)).toBeGreaterThanOrEqual((p.radius+other.radius)*.85+.5)
    }
})

test('loaded botanical trunks follow the new authored positions, scales and ground heights',()=>{
    const trees=[...grovePlacements(2),...landmarkTreePlacements(2,grovePlacements(2))]
    const subject={trees},calls=[]
    BotanicalDressing.prototype.setTreeCollisions.call(subject,{addObjectFromThree:options=>{calls.push(options);return options}})
    expect(calls).toHaveLength(1)
    expect(calls[0].meshes).toHaveLength(trees.length)
    for(const [index,trunk] of subject.treeTrunks.entries()) {
        const tree=trees[index]
        expect(trunk.position.x).toBe(tree.x);expect(trunk.position.y).toBe(tree.y)
        expect(trunk.position.z-trunk.scale.z/2).toBeCloseTo(tree.z,6)
        expect(trunk.scale.x).toBe(.5*tree.scale)
        expect(trunk.rotation.z).toBe(tree.angle)
        expect(roadEdgeDistance(trunk.position.x,trunk.position.y)).toBeGreaterThan(tree.radius+.79)
    }
})

test('flower beds keep roads, paths, pond, landmarks and chapter titles clear',()=>{
    const trees=grovePlacements(2),props=dressingPlacements(trees),flowers=flowerPlacements(trees,props)
    expect(flowers.length).toBeGreaterThan(30)
    expect(flowers).toEqual(flowerPlacements(trees,props))
    for(const p of flowers) {
        expect(roadEdgeDistance(p.x,p.y)-p.radius).toBeGreaterThanOrEqual(.8)
        expect(foundationDistance(p.x,p.y)-p.radius).toBeGreaterThanOrEqual(.65)
        expect(gardenReserved(p.x,p.y,p.radius)).toBe(false)
        for(const title of researchTerraces) expect(Math.abs(p.x-105)>=17+p.radius || Math.abs(p.y-(title.y-19))>=1.8+p.radius).toBe(true)
        expect(trees.every(tree=>Math.hypot(tree.x-p.x,tree.y-p.y)>=p.radius+.7)).toBe(true)
        expect(props.every(prop=>Math.hypot(prop.x-p.x,prop.y-p.y)>=p.radius+prop.radius*.85)).toBe(true)
    }
})

test('pond rim stays inside the garden loop and its full footprint is reserved',()=>{
    const p=garden.pond
    for(let i=0;i<96;i++) {
        const a=i*Math.PI*2/96,x=p.x+Math.cos(a)*p.rx,y=p.y+Math.sin(a)*p.ry
        expect(gardenPathDistance(x,y)).toBeGreaterThan(.5)
        expect(gardenReserved(x,y,.05)).toBe(true)
    }
    const meadow=meadowPatches[2],outline=meadowOutline(meadow,2)
    expect(outline).toHaveLength(64)
    expect(outline).toEqual(meadowOutline(meadow,2))
    // Distinct lobes keep the meadow from becoming another identical oval.
    const radii=outline.map(([x,y])=>Math.hypot((x-meadow.x)/meadow.rx,(y-meadow.y)/meadow.ry))
    expect(Math.max(...radii)-Math.min(...radii)).toBeGreaterThan(.1)
})

test('pond collisions match the low visible rim and leave the walking loop open',()=>{
    let solids=[]
    const subject={clock:{value:0}},container=new THREE.Group()
    BotanicalDressing.prototype.setPond.call(subject,{container,physics:{addObjectFromThree:({meshes})=>{solids=meshes;return {}}}})
    expect(solids).toHaveLength(24)
    for(const solid of solids) {
        expect(solid.position.z+solid.scale.z/2).toBeCloseTo(.24-pondRimInset,5)
        solid.updateMatrix()
        for(const x of [-.5,.5]) for(const y of [-.5,.5]) {
            const corner=new THREE.Vector3(x,y,0).applyMatrix4(solid.matrix)
            expect(gardenPathDistance(corner.x,corner.y)).toBeGreaterThan(.4)
        }
    }
    subject.water.geometry.dispose();subject.water.material.dispose()
})

test('Blender botanical kit fits planting envelopes without textures or a decoder',async()=>{
    const bytes=await Bun.file(new URL('../static/saksham/models/botanical-kit.glb',import.meta.url)).arrayBuffer()
    expect(bytes.byteLength).toBeLessThan(300_000)
    const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,new DataView(bytes).getUint32(12,true))))
    expect(json.images?.length || 0).toBe(0)
    expect(json.materials).toHaveLength(1)
    expect(json.extensionsRequired?.length || 0).toBe(0)
    const gltf=await new GLTFLoader().parseAsync(bytes,'')
    gltf.scene.updateMatrixWorld(true)
    const names=[]
    gltf.scene.traverse(node=>{
        if(!node.isMesh) return
        names.push(node.name)
        const g=node.geometry.clone().applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI/2).multiply(node.matrixWorld))
        const positions=g.attributes.position,radius=node.name.startsWith('tree') ? 2 : .7
        g.computeBoundingBox()
        expect(g.boundingBox.min.z).toBeCloseTo(0,4)
        if(node.name==='pond-basin') {
            expect(g.boundingBox.max.x).toBeCloseTo(garden.pond.rx,4)
            expect(g.boundingBox.max.y).toBeCloseTo(garden.pond.ry,4)
            expect(g.boundingBox.max.z).toBeCloseTo(.24,4)
            const index=g.index,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3()
            let tops=0,bottoms=0
            for(let i=0;i<(index?.count || positions.count);i+=3) {
                const vertex=n=>index ? index.getX(i+n) : i+n
                a.fromBufferAttribute(positions,vertex(0));b.fromBufferAttribute(positions,vertex(1));c.fromBufferAttribute(positions,vertex(2))
                const top=[a,b,c].every(p=>Math.abs(p.z-.24)<.001),bottom=[a,b,c].every(p=>Math.abs(p.z)<.001)
                const normal=b.clone().sub(a).cross(c.clone().sub(a))
                if(top) {expect(normal.z).toBeGreaterThan(0);tops++}
                if(bottom) {expect(normal.z).toBeLessThan(0);bottoms++}
            }
            expect(tops).toBeGreaterThanOrEqual(48);expect(bottoms).toBeGreaterThanOrEqual(48)
        } else for(let i=0;i<positions.count;i++) expect(Math.hypot(positions.getX(i),positions.getY(i))).toBeLessThanOrEqual(radius)
        expect(g.getAttribute('color')).toBeDefined()
        expect((g.index?.count || positions.count)/3).toBeLessThan(1600)
        g.dispose()
    })
    expect(names.sort()).toEqual(['flowers-coral','flowers-lilac','pond-basin','tree-broadleaf','tree-copper'])
})
