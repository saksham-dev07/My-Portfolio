import { expect,test } from 'bun:test'
import * as THREE from 'three'
import CANNON from 'cannon'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import ActivityProps, { activityPropPlacements,activityPropGeometry,activityPropSolids,activityPropCollision,propLabelPlanes,rampProfile } from '../src/javascript/World/ActivityProps.js'
import EventEmitter from '../src/javascript/Utils/EventEmitter.js'
import { roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'
import { grovePlacements,landmarkTreePlacements } from '../src/javascript/World/EnvironmentLayout.js'
import { garden,gardenPathDistance } from '../src/javascript/World/GardenLayout.js'

async function asset(name) {
    const bytes=await Bun.file(new URL(`../static/saksham/models/${name}.glb`,import.meta.url)).arrayBuffer()
    return new GLTFLoader().parseAsync(bytes,'')
}

test('optional authored assets bake their hierarchy and flat colours into compact Z-up meshes',async()=>{
    let triangles=0
    for(const placement of activityPropPlacements) {
        const gltf=await asset(placement.id),original=[]
        gltf.scene.traverse(node=>{if(node.isMesh) original.push(node.geometry.attributes.position.array.slice())})
        const geometry=activityPropGeometry(gltf.scene),bounds=geometry.boundingBox,size=bounds.getSize(new THREE.Vector3())
        expect(bounds.min.z).toBeGreaterThan(-.001);expect(bounds.max.z).toBeGreaterThan(.9)
        expect(size.x).toBeGreaterThan(1.9)
        expect(geometry.attributes.color.count).toBe(geometry.attributes.position.count)
        triangles+=geometry.attributes.position.count/3
        let index=0
        gltf.scene.traverse(node=>{if(node.isMesh) expect(node.geometry.attributes.position.array).toEqual(original[index++])})
        expect(geometry.attributes.normal.count).toBe(geometry.attributes.position.count)
        geometry.dispose()
    }
    expect(triangles).toBeLessThan(5000)
})

test('the rally arch spans the existing start road with genuinely open vehicle clearance',()=>{
    const placement=activityPropPlacements.find(p=>p.id==='campus-checkpoint'),physics={world:new CANNON.World()}
    const collision=activityPropCollision(placement,physics),solids=collision.solids
    expect(physics.world.bodies).toHaveLength(1);expect(collision.body.shapes).toHaveLength(4)
    expect(collision.body.position.toArray()).toEqual([2,-98.5,0])
    const posts=solids.slice(0,2)
    for(const post of posts) {
        expect(Math.abs(post.position.y-placement.y)-post.scale.x/2).toBeGreaterThan(2.5)
        expect(Math.abs(post.position.x-placement.x)).toBeLessThan(.001)
    }
    const beam=solids[2]
    expect(beam.position.z-beam.scale.z/2).toBeCloseTo(3.575,5)
    // Drive a full car-sized box through the opening along +X. Neither posts nor
    // lintel may collide with its chassis anywhere across the start line.
    const car=new CANNON.Body({mass:40,shape:new CANNON.Box(new CANNON.Vec3(1.02,.52,.6))})
    physics.world.addBody(car)
    let contacts=0;car.addEventListener('collide',()=>contacts++)
    for(let i=0;i<21;i++) {car.position.set(-3+i*.5,-98.5,1);car.velocity.set(0,0,0);physics.world.step(1/60)}
    expect(contacts).toBe(0)
})

test('the scoreboard has a clear lawn footprint away from the lane rails, roads and tree crowns',()=>{
    const placement=activityPropPlacements.find(p=>p.id==='maidan-scoreboard'),solids=activityPropSolids(placement)
    const northRail=-34+7.6385393142700195+.26617133617401123/2
    for(const solid of solids) expect(solid.position.y-solid.scale.y/2-northRail).toBeGreaterThan(1.8)
    expect(roadEdgeDistance(placement.x,placement.y)).toBeGreaterThan(10)
    const grove=grovePlacements(2),trees=[...grove,...landmarkTreePlacements(2,grove)]
    for(const tree of trees) expect(Math.hypot(tree.x-placement.x,tree.y-placement.y)-tree.radius).toBeGreaterThan(3)
})

test('front and back label planes share resources but keep text upright and unmirrored',()=>{
    const texture=new THREE.Texture(),labels=propLabelPlanes({texture,width:2,height:1,z:1.5,frontY:-.11,backY:.11})
    try {
        expect(labels.front.geometry).toBe(labels.back.geometry);expect(labels.front.material).toBe(labels.back.material)
        const up=new THREE.Vector3(0,1,0),right=new THREE.Vector3(1,0,0),normal=new THREE.Vector3(0,0,1)
        expect(up.clone().applyQuaternion(labels.front.quaternion).z).toBeCloseTo(1,6)
        expect(up.clone().applyQuaternion(labels.back.quaternion).z).toBeCloseTo(1,6)
        expect(right.clone().applyQuaternion(labels.front.quaternion).x).toBeCloseTo(1,6)
        expect(right.clone().applyQuaternion(labels.back.quaternion).x).toBeCloseTo(-1,6)
        expect(normal.clone().applyQuaternion(labels.front.quaternion).y).toBeCloseTo(-1,6)
        expect(normal.clone().applyQuaternion(labels.back.quaternion).y).toBeCloseTo(1,6)
    } finally {labels.geometry.dispose();labels.material.dispose();texture.dispose()}
})

function fixture() {
    const time=new EventEmitter();time.elapsed=0
    const host=new EventTarget(),drawn=[],context={fillRect(){},fillText:text=>drawn.push(text),createRadialGradient:()=>({addColorStop(){}})}
    const document={createElement:()=>({getContext:()=>context})},requests=[]
    const loader={load:(url,ready,progress,error)=>requests.push({url,ready,error})}
    const camera={view:'top',instance:new THREE.PerspectiveCamera(50,1,.1,300)}
    const physics={world:new CANNON.World()},objects={physics,materials:{shades:{items:{white:{uniforms:{matcap:{value:new THREE.Texture()}}}}}}}
    const container=new THREE.Group(),props=new ActivityProps({container,objects,camera,time,loader,window:host,document})
    return {time,host,drawn,requests,camera,physics,objects,container,props}
}

test('props load after entry, one at a time, and failed optional art never creates invisible collisions',async()=>{
    const f=fixture(),{props,time,requests,physics,container}=f
    try {
        time.trigger('tick');expect(requests).toHaveLength(0)
        time.elapsed=800;time.trigger('tick');expect(requests).toHaveLength(1)
        time.elapsed=2000;time.trigger('tick');expect(requests).toHaveLength(1)
        requests[0].error(new Error('offline'));expect(props.items[0].state).toBe('error')
        expect(physics.world.bodies).toHaveLength(0);expect(container.children).toHaveLength(0)
        time.trigger('tick');expect(requests).toHaveLength(2)
        const checkpoint=await asset('campus-checkpoint');requests[1].ready(checkpoint)
        expect(props.items[1].state).toBe('ready');expect(physics.world.bodies).toHaveLength(1)
        expect(container.children).toHaveLength(1)
    } finally {props.dispose()}
    expect(physics.world.bodies).toHaveLength(0);expect(container.children).toHaveLength(0)
    time.elapsed=5000;time.trigger('tick');expect(requests).toHaveLength(2)
})

test('the Blender chai cart clears the pond, walking loop, shelter terrace and planted crowns',async()=>{
    const p=activityPropPlacements.find(p=>p.id==='chai-cart'),grove=grovePlacements(2),trees=[...grove,...landmarkTreePlacements(2,grove)]
    const gltf=await asset('chai-cart'),geometry=activityPropGeometry(gltf.scene),bounds=geometry.boundingBox
    const halfWidth=Math.max(Math.abs(bounds.min.x),Math.abs(bounds.max.x))*p.scale
    const halfDepth=Math.max(Math.abs(bounds.min.y),Math.abs(bounds.max.y))*p.scale
    const radius=Math.hypot(halfWidth,halfDepth)
    expect(gardenPathDistance(p.x,p.y)-radius).toBeGreaterThan(.5)
    expect(p.x+halfWidth).toBeLessThan(garden.shelter.x-3.6-1.5)
    expect(p.y+halfDepth).toBeLessThan(garden.pond.y-garden.pond.ry-1)
    for(const tree of trees) expect(Math.hypot(tree.x-p.x,tree.y-p.y)-tree.radius-radius).toBeGreaterThan(1.5)
    expect(roadEdgeDistance(p.x,p.y)-radius).toBeGreaterThan(7)
    // Shipping geometry stays grounded and leaves the counter-to-canopy gap
    // free in physics rather than trapping a vehicle in an invisible big box.
    const solids=activityPropSolids(p),physics={world:new CANNON.World()}
    const collision=activityPropCollision(p,physics),result=new CANNON.RaycastResult()
    expect(physics.world.raycastClosest(new CANNON.Vec3(p.x,p.y-.93*p.scale,1.7*p.scale),new CANNON.Vec3(p.x,p.y-.15*p.scale,1.7*p.scale),{skipBackfaces:true},result)).toBe(false)
    expect(solids).toHaveLength(9)
    physics.world.removeBody(collision.body)
    geometry.dispose()
})

test('the ramp collider follows the shipping GLB slope and landing with continuous upward surfaces',async()=>{
    const gltf=await asset('ramp-deck'),profile=rampProfile(gltf.scene),p=activityPropPlacements.find(p=>p.id==='ramp-deck')
    const physics={world:new CANNON.World()},collision=activityPropCollision(p,physics,profile)
    expect(collision.body.shapes).toHaveLength(2)
    expect(profile.join-profile.near).toBeCloseTo(5,3)
    expect(profile.end-profile.join).toBeCloseTo(2,3)
    expect(profile.height).toBeCloseTo(1,4)
    expect(profile.width).toBeCloseTo(3,3)
    for(let i=0;i<30;i++) {
        const localY=profile.near+.025+(profile.end-profile.near-.05)*i/29
        // The negative quarter turn places the low lip to the west and sends
        // cars east, away from the tree groups and into the clear landing lawn.
        const x=p.x+localY,y=p.y,result=new CANNON.RaycastResult()
        expect(physics.world.raycastClosest(new CANNON.Vec3(x,y,3),new CANNON.Vec3(x,y,-1),{skipBackfaces:true},result)).toBe(true)
        const height=localY<profile.join ? profile.ground+(profile.height-profile.ground)*(localY-profile.near)/(profile.join-profile.near) : profile.height
        expect(result.hitPointWorld.z).toBeCloseTo(height,4)
        expect(result.hitNormalWorld.z).toBeGreaterThan(.9)
    }
    expect(roadEdgeDistance(p.x,p.y)).toBeGreaterThan(15)
})

test('the score display remembers earlier game events, redraws scores and disposes owned GPU resources',async()=>{
    const f=fixture(),{props,host,drawn,time,requests,physics,container}=f
    host.dispatchEvent(new CustomEvent('drive-activity-update',{detail:{id:'bowling',total:17,attempt:3,phase:'rolling',attempts:[8,9]}}))
    time.elapsed=800;time.trigger('tick')
    requests[0].ready(await asset('maidan-scoreboard'))
    expect(drawn).toContain('17 / 30');expect(drawn).toContain('ROLL 3 OF 3')
    const texture=props.score.texture,geometry=props.items[0].geometry,material=props.material
    let textureDisposals=0,geometryDisposals=0,materialDisposals=0
    texture.addEventListener('dispose',()=>textureDisposals++);geometry.addEventListener('dispose',()=>geometryDisposals++);material.addEventListener('dispose',()=>materialDisposals++)
    host.dispatchEvent(new CustomEvent('drive-activity-update',{detail:{id:'bowling',total:26,attempt:3,phase:'result',attempts:[8,9,9]}}))
    expect(drawn).toContain('26 / 30');expect(drawn).toContain('THREE ROLLS COMPLETE')
    props.dispose();props.dispose()
    expect(textureDisposals).toBe(1);expect(geometryDisposals).toBe(1);expect(materialDisposals).toBe(1)
    expect(physics.world.bodies).toHaveLength(0);expect(container.children).toHaveLength(0)
    const count=drawn.length
    host.dispatchEvent(new CustomEvent('drive-activity-update',{detail:{id:'bowling',total:0}}))
    expect(drawn).toHaveLength(count)
})
