import {expect,test} from 'bun:test'
import * as THREE from 'three'
import CANNON from 'cannon'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {refinedGeometry,refinedPlacement} from '../src/javascript/World/RefinedProps.js'
import {activityPropCollision} from '../src/javascript/World/ActivityProps.js'
import {scenicKinds,roadsideDetails,roadsideBenches,playgroundUpgrades,ridgeArch,retiredPlaygroundMeshes,retiredPlaygroundCollisions,retainPlaygroundScene} from '../src/javascript/World/ScenicRouteLayout.js'
import {roadEdgeDistance,projectSites} from '../src/javascript/World/LandscapeLayout.js'
import {profilePathClearances} from '../src/javascript/World/Sections/ProfilePaths.js'
import ScenicRoutes from '../src/javascript/World/ScenicRoutes.js'

const bytes=await Bun.file(new URL('../static/saksham/models/scenic-kit.glb',import.meta.url)).arrayBuffer()
const scene=(await new GLTFLoader().parseAsync(bytes,'')).scene
const benchScene=(await new GLTFLoader().parseAsync(await Bun.file(new URL('../static/saksham/models/refined-props.glb',import.meta.url)).arrayBuffer(),'')).scene

test('scenic kit is a bounded texture-free export with grounded art and continuous ramp metadata',()=>{
    expect(bytes.byteLength).toBeLessThan(400000)
    const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,new DataView(bytes).getUint32(12,true))))
    expect(json.images?.length||0).toBe(0);expect(json.materials).toHaveLength(1)
    let triangles=0
    for(const kind of scenicKinds){const item=refinedGeometry(scene,kind);triangles+=item.geometry.attributes.position.count/3;expect(item.geometry.boundingBox.min.z).toBeGreaterThan(-.005);item.geometry.dispose()}
    expect(triangles).toBeLessThan(13000)
    const combined=refinedPlacement(scene,[...playgroundUpgrades,ridgeArch,...roadsideDetails])
    expect(combined.geometry.attributes.position.count/3).toBeLessThan(55000);combined.geometry.dispose()
})

test('roadside art leaves driving shoulders, district lettering and project entry pads clear',()=>{
    for(const [source,placements] of [[scene,roadsideDetails],[benchScene,roadsideBenches]])for(const p of placements){
        const geometry=refinedPlacement(source,[p]).geometry,{min,max}=geometry.boundingBox
        const stepsX=Math.ceil((max.x-min.x)/.3),stepsY=Math.ceil((max.y-min.y)/.3)
        for(let i=0;i<=stepsX;i++)for(let j=0;j<=stepsY;j++){
            const x=min.x+(max.x-min.x)*i/stepsX,y=min.y+(max.y-min.y)*j/stepsY
            expect(roadEdgeDistance(x,y)).toBeGreaterThan(.1)
            expect(profilePathClearances.some(rect=>Math.abs(x-rect.x)<rect.w/2+.1&&Math.abs(y-rect.y)<rect.h/2+.1)).toBe(false)
            expect(projectSites.some(site=>Math.abs(x-site.x)<3.4&&Math.abs(y-(site.y-6.5))<1.7)).toBe(false)
            expect(Math.abs(x+54.6)<4.8&&Math.abs(y+100)<2).toBe(false)
        }
        geometry.dispose()
    }
    // Opposing jumps remain inside the practice lawn, not the entrance lane.
    for(const p of playgroundUpgrades){const geometry=refinedPlacement(scene,[p]).geometry,positions=geometry.attributes.position;for(let i=0;i<positions.count;i++)expect(roadEdgeDistance(positions.getX(i),positions.getY(i))).toBeGreaterThan(.1);geometry.dispose()}
})

test('new ramp colliders follow the authored slopes through the flat landings',()=>{
    for(const p of playgroundUpgrades.filter(p=>p.kind.startsWith('ramp'))){
        const profile=scene.getObjectByName(p.kind).userData.design.rampProfile,physics={world:new CANNON.World()}
        const collision=activityPropCollision({...p,scale:1},physics,profile),c=Math.cos(p.angle),s=Math.sin(p.angle)
        for(let i=0;i<25;i++){
            const y=profile.near+.02+(profile.end-profile.near-.04)*i/24,x=p.x-y*s,worldY=p.y+y*c,result=new CANNON.RaycastResult()
            expect(physics.world.raycastClosest(new CANNON.Vec3(x,worldY,3),new CANNON.Vec3(x,worldY,-1),{skipBackfaces:true},result)).toBe(true)
            const z=y<profile.join?profile.ground+(profile.height-profile.ground)*(y-profile.near)/(profile.join-profile.near):profile.height
            expect(result.hitPointWorld.z).toBeCloseTo(z,4);expect(result.hitNormalWorld.z).toBeGreaterThan(.9)
        }
        physics.world.removeBody(collision.body)
    }
})

test('stone arch faces render from both approaches without exposing flipped faces',()=>{
    const {geometry}=refinedGeometry(scene,'ridge-arch'),mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial()),ray=new THREE.Raycaster()
    for(let i=0;i<24;i++)for(const side of [-1,1]){
        const angle=Math.PI*(i+.5)/24,x=Math.cos(angle)*6,z=Math.sin(angle)*6+.08
        ray.set(new THREE.Vector3(x,side*3,z),new THREE.Vector3(0,-side,0))
        const hit=ray.intersectObject(mesh)[0]
        expect(hit).toBeDefined();expect(hit.distance).toBeCloseTo(2.3,2)
    }
    geometry.dispose();mesh.material.dispose()
})

test('retirement removes only the old jumps and posts, preserving the original rail and tree proxies',()=>{
    for(const [file,retired] of [['base',retiredPlaygroundMeshes],['collision',retiredPlaygroundCollisions]]){
        const data=Bun.file(new URL(`../static/models/playground/static/${file}.glb`,import.meta.url))
        // Runtime filtering is also safe on an older, unpruned checkout.
        const sample=new THREE.Group();for(const name of ['shadeBrown_017002','Cube086','Cube069','shadeGreen003']){const mesh=new THREE.Mesh();mesh.name=name;sample.add(mesh)}
        const copy=retainPlaygroundScene(sample,retired)
        expect(copy.getObjectByName(file==='base'?'shadeBrown_017002':'Cube086')).toBeUndefined()
        expect(copy.getObjectByName(file==='base'?'shadeGreen003':'Cube069')).toBeDefined();expect(sample.children).toHaveLength(4)
        expect(data.size).toBeLessThan(file==='base'?90000:6500)
    }
})

test('scenic batches load once and cleanup owns added colliders, decals and dynamic fruit art',()=>{
    const context=new Proxy({}, {get:(_,key)=>key==='measureText'?()=>({width:100}):()=>{}})
    const page={createElement:()=>({getContext:()=>context})},saved=globalThis.document;globalThis.document=page
    const world=new CANNON.World(),container=new THREE.Group(),ticks=new Map(),requests=[]
    const objects={physics:{world,addObjectFromThree:({meshes})=>{const body=new CANNON.Body({mass:0});for(const mesh of meshes)body.addShape(new CANNON.Box(new CANNON.Vec3(...mesh.scale.toArray().map(v=>v/2))),new CANNON.Vec3(...mesh.position.toArray()));world.addBody(body);return{body}}}}
    const oldFruit=new THREE.Group();oldFruit.add(new THREE.Mesh());const code={label:new THREE.Mesh(),lemon:{container:oldFruit}}
    try{
        const routes=new ScenicRoutes({container,objects,config:{touch:false},easterEggs:{konamiCode:code},time:{on:(name,cb)=>ticks.set(name,cb),off:name=>ticks.delete(name)},loader:{load:(url,ready)=>requests.push({url,ready})}})
        routes.models.load();routes.models.load();routes.benches.load();expect(requests).toHaveLength(2)
        requests[0].ready({scene});requests[1].ready({scene:benchScene});expect(routes.models.state).toBe('ready');expect(routes.benches.state).toBe('ready')
        expect(world.bodies).toHaveLength(7);expect(oldFruit.children[0].visible).toBe(false);expect(code.label.visible).toBe(false)
        routes.dispose();routes.dispose();expect(world.bodies).toHaveLength(0);expect(container.children).toHaveLength(0);expect(oldFruit.children).toHaveLength(1);expect(ticks.size).toBe(0)
    }finally{globalThis.document=saved}
})
