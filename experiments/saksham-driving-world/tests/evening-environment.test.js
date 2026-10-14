import {test,expect} from 'bun:test'
import * as THREE from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import EveningEnvironment from '../src/javascript/World/EveningEnvironment.js'
import {duskLanterns,installDuskMaterial} from '../src/javascript/World/DuskLighting.js'
import {meadowClear,meadowGrass,nearDrivingLane} from '../src/javascript/World/MeadowScatter.js'
import {roadEdgeDistance} from '../src/javascript/World/LandscapeLayout.js'

const bytes=await Bun.file(new URL('../static/saksham/models/refined-props.glb',import.meta.url)).arrayBuffer()
const scene=(await new GLTFLoader().parseAsync(bytes,'')).scene
function fixture(){
    const callbacks=new Map(),container=new THREE.Group(),requests=[]
    const time={elapsed:0,on:(name,cb)=>callbacks.set(name,cb),off:name=>callbacks.delete(name)}
    const passes={glowsPass:{material:{uniforms:{uAlpha:{value:.17},uColor:{value:new THREE.Color()}}}}}
    const environment=new EveningEnvironment({container,time,passes,loader:{load:(url,cb)=>requests.push(cb)}})
    return {environment,container,time,requests,callbacks}
}

test('evening artwork reuses existing Blender lanterns and never enters roads or protected planting gaps',()=>{
    expect(duskLanterns.filter(p=>p.existing)).toHaveLength(3)
    for(const p of duskLanterns.filter(p=>!p.existing)){
        if(!p.court)expect(meadowClear(p.x,p.y,.5)).toBe(true)
        expect(nearDrivingLane(p.x,p.y,.5)).toBe(false)
        expect(roadEdgeDistance(p.x,p.y)).toBeGreaterThan(.5)
    }
    const grass=meadowGrass([],duskLanterns.map(p=>({...p,radius:.45})))
    for(const p of grass)for(const lamp of duskLanterns)expect(Math.hypot(p.x-lamp.x,p.y-lamp.y)).toBeGreaterThanOrEqual(.65)
})

test('material discovery composes deferred asset shaders once without touching their original geometry',()=>{
    const {environment,container,time,requests,callbacks}=fixture()
    requests[0]({scene});expect(environment.state).toBe('ready')
    const geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial(),mesh=new THREE.Mesh(geometry,material)
    let original=0;material.onBeforeCompile=()=>original++
    container.add(mesh);const positions=Array.from(geometry.attributes.position.array)
    time.elapsed=1100;callbacks.get('tick.eveningEnvironment')();const count=environment.materialCount
    time.elapsed=2200;callbacks.get('tick.eveningEnvironment')();expect(environment.materialCount).toBe(count)
    const shader={uniforms:{},vertexShader:'#include <project_vertex>',fragmentShader:'#include <fog_fragment>'}
    material.onBeforeCompile(shader);expect(original).toBe(1);expect(shader.uniforms.duskLamps.value).toHaveLength(duskLanterns.length)
    expect(Array.from(geometry.attributes.position.array)).toEqual(positions)
    expect(installDuskMaterial(material)).toBe(false)
    environment.dispose();environment.dispose();expect(callbacks.size).toBe(0);expect(container.children).toEqual([mesh])
    geometry.dispose();material.dispose()
})

test('destroying the scene before a deferred lantern response installs no artwork or timers',()=>{
    const {environment,container,requests,callbacks}=fixture()
    environment.dispose();requests[0]({scene});expect(container.children).toHaveLength(0);expect(callbacks.size).toBe(0)
})
