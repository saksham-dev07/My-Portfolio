import { test, expect } from 'bun:test'
import CANNON from 'cannon'
import * as THREE from 'three'
import Landscape from '../src/javascript/World/Landscape.js'
import { landscapeGrid, surfaceHeight, roads, foundations, projectSites, distanceToRoad, roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'

test('rendered terrain agrees with Cannon triangle raycasts, including slopes and seams', () => {
    const grid = landscapeGrid()
    const world = new CANNON.World()
    const body = new CANNON.Body({ mass: 0, shape: new CANNON.Heightfield(grid.heights, { elementSize: grid.step }) })
    body.position.set(grid.minX, grid.minY, 0)
    world.addBody(body)
    for (let i = 0; i < 150; i++) {
        const x = grid.minX + 1.13 + ((i * 19.73) % (grid.maxX - grid.minX - 3))
        const y = grid.minY + 1.29 + ((i * 13.17) % (grid.maxY - grid.minY - 3))
        const result = new CANNON.RaycastResult()
        expect(world.raycastClosest(new CANNON.Vec3(x,y,40),new CANNON.Vec3(x,y,-10),{},result)).toBe(true)
        expect(result.hitPointWorld.z).toBeCloseTo(surfaceHeight(x,y),5)
    }
})

test('all destinations retain flat foundations and roads have gentle longitudinal grades', () => {
    for (const site of foundations) expect(surfaceHeight(site.x,site.y)).toBe(0)
    for (const site of projectSites) {
        expect(surfaceHeight(site.x,site.y+5)).toBe(0)
        expect(surfaceHeight(site.x,site.y-8.5)).toBe(0)
    }
    for (const road of roads) {
        const points=road.curve.getSpacedPoints(Math.ceil(road.curve.getLength()*2))
        for (let i=1;i<points.length;i++) {
            const a=points[i-1],b=points[i]
            const grade=Math.abs(surfaceHeight(a.x,a.y)-surfaceHeight(b.x,b.y))/a.distanceTo(b)
            expect(grade).toBeLessThan(.2)
        }
    }
})

test('the bounded landscape uses one modest seamless heightfield with visible ridges', () => {
    const grid=landscapeGrid()
    expect((grid.nx-1)*(grid.ny-1)*2).toBeLessThan(25000)
    expect(Math.min(...grid.heights.flat())).toBeGreaterThanOrEqual(0)
    expect(surfaceHeight(grid.minX,-80)).toBeGreaterThan(7)
    expect(surfaceHeight(grid.maxX,-80)).toBeGreaterThan(7)
    expect(surfaceHeight(0,grid.minY)).toBeGreaterThan(7)
    expect(surfaceHeight(90,-48)).toBeGreaterThan(2)
    expect(surfaceHeight(90,-88)).toBeGreaterThan(2)
})

test('every avenue belongs to one connected network and the hub island stays clear', () => {
    const connected=new Set([0])
    for(let pass=0;pass<roads.length;pass++) for(let i=0;i<roads.length;i++) {
        if(connected.has(i)) continue
        if([...connected].some(j=>roads[i].samples.some(p=>distanceToRoad(roads[j],p.x,p.y)<(roads[i].width+roads[j].width)/2))) connected.add(i)
    }
    expect(connected.size).toBe(roads.length)
    // A driveable circle surrounds the original central sculpture, rather than
    // sending an avenue through it. All four entrances land on that circle.
    expect(roadEdgeDistance(0,-30)).toBeGreaterThan(3)
    for(const [x,y] of [[0,-24],[0,-36],[-6,-30],[6,-30]]) expect(roadEdgeDistance(x,y)).toBeLessThan(0)
    const hub=roads.find(road=>road.center)
    for(const p of hub.samples) expect(Math.hypot(p.x,p.y+30)).toBeCloseTo(6,5)
})

test('retiring an original tree removes its rendering and proxy while exposing its baked shadow footprint', () => {
    const container=new THREE.Group()
    const canopy=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.5,3))
    canopy.name='shadeGreen';canopy.position.set(13,-90,2.5)
    const trunk=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,1))
    trunk.name='shadeBrown003';trunk.position.set(13,-90,.5)
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.ShaderMaterial({uniforms:{tShadow:{value:null}}}))
    container.add(canopy,trunk,floor)
    const body=new CANNON.Body({mass:0})
    body.addShape(new CANNON.Box(new CANNON.Vec3(.25,.25,.5)),new CANNON.Vec3(13,-90,.5))
    body.addShape(new CANNON.Box(new CANNON.Vec3(2,2,1)),new CANNON.Vec3(30,-80,1))
    const debugTrunk=new THREE.Object3D();debugTrunk.position.copy(trunk.position)
    const collision={body,model:{meshes:[debugTrunk]}},item={shouldMerge:true,container,collision},subject={}
    Landscape.prototype.clearOriginalTrees.call(subject,{items:[item]})
    expect(subject.retiredTreeAnchors).toHaveLength(1)
    const retired=subject.retiredTreeAnchors[0]
    expect(retired.x).toBe(13);expect(retired.y).toBe(-90)
    expect(retired.height).toBe(4);expect(retired.radius).toBeCloseTo(Math.hypot(1.5,1.5)/2,5)
    expect(retired.sourceObject).toBe(item);expect(retired.floorMeshes).toEqual([floor])
    expect(canopy.parent).toBeNull();expect(trunk.parent).toBeNull()
    expect(floor.parent).toBe(container)
    expect(body.shapes).toHaveLength(1)
    expect(body.shapeOffsets[0].x).toBe(30)
    expect(body.shapeOffsets).toHaveLength(body.shapes.length)
    expect(body.shapeOrientations).toHaveLength(body.shapes.length)
    expect(collision.model.meshes).toHaveLength(0)
    expect(body.aabbNeedsUpdate).toBe(true)
})

test('retiring rotated compound trees preserves rails, shared materials and their collisions', () => {
    const container=new THREE.Group()
    container.position.set(1.2,-55,0);container.rotation.z=.65
    const originalGreen=new THREE.MeshBasicMaterial({color:'#e9d554'})
    const originalBrown=new THREE.MeshBasicMaterial({color:'#aa7733'})
    const body=new CANNON.Body({mass:0})
    body.position.set(1.2,-55,0);body.quaternion.setFromEuler(0,0,.65)
    const pairs=[],debug=[]
    for(const [index,[x,y]] of [[0,[-2,2]],[1,[3,-1]]]) {
        const canopy=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.5,3),originalGreen)
        canopy.name=index ? 'shadeGreen001' : 'shadeGreen';canopy.position.set(x,y,2.4)
        const trunk=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,1),originalBrown)
        trunk.name=index ? 'shadeBrown004' : 'shadeBrown003';trunk.position.set(x,y,.5)
        container.add(canopy,trunk)
        body.addShape(new CANNON.Box(new CANNON.Vec3(.5,.5,1.5)),new CANNON.Vec3(x,y,1.5))
        const mesh=new THREE.Object3D();mesh.position.set(x,y,1.5);mesh.scale.set(1,1,3)
        debug.push(mesh);pairs.push({canopy,trunk})
    }
    const rail=new THREE.Mesh(new THREE.BoxGeometry(4,.3,1),originalBrown)
    rail.name='shadeBrownRail';rail.position.set(-2,4,.5);container.add(rail)
    body.addShape(new CANNON.Box(new CANNON.Vec3(2,.15,.5)),new CANNON.Vec3(-2,4,.5))
    const oldRailPosition=rail.position.clone(),oldRailOffset=body.shapeOffsets[2].clone(),oldRailShape=body.shapes[2]
    container.updateWorldMatrix(true,true)
    const roots=pairs.map(({canopy})=>new THREE.Box3().setFromObject(canopy).getCenter(new THREE.Vector3()))
    const subject={}
    Landscape.prototype.clearOriginalTrees.call(subject,{items:[{shouldMerge:true,container,collision:{body,model:{meshes:debug}}}]})
    expect(subject.retiredTreeAnchors).toHaveLength(2)
    for(const [index,{canopy,trunk}] of pairs.entries()) {
        expect(subject.retiredTreeAnchors[index].x).toBeCloseTo(roots[index].x,5)
        expect(subject.retiredTreeAnchors[index].y).toBeCloseTo(roots[index].y,5)
        expect(canopy.parent).toBeNull();expect(trunk.parent).toBeNull()
    }
    expect(rail.position).toEqual(oldRailPosition);expect(rail.material).toBe(originalBrown)
    expect(body.shapeOffsets).toEqual([oldRailOffset]);expect(body.shapes).toEqual([oldRailShape])
    expect(originalGreen.color.getHexString()).toBe('e9d554')
    expect(container.children).toEqual([rail])
})
