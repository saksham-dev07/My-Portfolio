import {test,expect} from 'bun:test'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {environmentConfig} from '../src/javascript/World/EnvironmentConfig.js'
import {fieldNoise} from '../src/javascript/World/FieldNoise.js'
import {terrainHeight,landscapeGrid,roadDistance,foundations,surfaceHeight,roads,roadEdgeDistance} from '../src/javascript/World/LandscapeLayout.js'
import {grovePlacements,landmarkTreePlacements,dressingPlacements} from '../src/javascript/World/EnvironmentLayout.js'
import {meadowClear,meadowGrass,meadowProps,nearDrivingLane} from '../src/javascript/World/MeadowScatter.js'
import {refinedGeometry,refinedPlacement} from '../src/javascript/World/RefinedProps.js'
import MeadowEnvironment,{meadowAssetKinds,meadowWindShader,meadowCarUniforms,updateMeadowCarInteraction} from '../src/javascript/World/MeadowEnvironment.js'
import MeadowParks,{parkPlacements} from '../src/javascript/World/MeadowParks.js'
import {detailPixels,fieldSurfaceShader,terrainCarUniforms,updateTerrainCarReaction} from '../src/javascript/World/TerrainSurface.js'

const trees=grovePlacements(2),existing=dressingPlacements([...trees,...landmarkTreePlacements(2,trees)]),props=meadowProps(trees,existing),grass=meadowGrass(trees,[...existing,...props])
const bytes=await Bun.file(new URL('../static/saksham/models/environment-refresh.glb',import.meta.url)).arrayBuffer(),scene=(await new GLTFLoader().parseAsync(bytes,'')).scene

test('all new Blender assets are grounded, named, under 500 triangles and share one palette',()=>{
    expect(bytes.byteLength).toBeLessThan(100000)
    const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,new DataView(bytes).getUint32(12,true))))
    expect(json.materials).toHaveLength(1);expect(json.images?.length||0).toBe(0)
    for(const kind of meadowAssetKinds){const item=refinedGeometry(scene,kind),p=item.geometry.boundingBox;expect(p.min.z).toBeGreaterThan(-.005);expect(item.geometry.attributes.position.count/3).toBeLessThan(500);item.geometry.dispose()}
    const tree=refinedGeometry(scene,'tree-round');expect(tree.geometry.boundingBox.max.z).toBeCloseTo(4.8,2);tree.geometry.dispose()
    const tuft=refinedGeometry(scene,'grass');expect(tuft.geometry.attributes.position.count/3).toBe(6);tuft.geometry.dispose()
})

test('rolling hills preserve every protected road cell and existing foundation elevation',()=>{
    const g=landscapeGrid();let changed=0
    for(let ix=0;ix<g.nx;ix++)for(let iy=0;iy<g.ny;iy++){
        const x=g.minX+ix*g.step,y=g.minY+iy*g.step,original=terrainHeight(x,y,true),height=g.heights[ix][iy]
        if(roadDistance(x,y)<=6)expect(height).toBe(original)
        if(height>original+.01)changed++
        expect(height-original).toBeLessThanOrEqual(environmentConfig.hillHeight+.0001)
    }
    expect(changed).toBeGreaterThan(100)
    for(const p of foundations)expect(surfaceHeight(p.x,p.y)).toBe(0)
    for(const p of environmentConfig.parks)for(const dx of [-2,0,2])for(const dy of [-2,0,2])expect(surfaceHeight(p.x+dx,p.y+dy)).toBe(0)
})

test('grass is deterministic, noise-clumped and excluded from roads, plazas, signs and props',()=>{
    expect(grass.length).toBeGreaterThan(4000);expect(grass.length).toBeLessThanOrEqual(environmentConfig.grassLimit)
    expect(meadowGrass(trees,[...existing,...props])).toEqual(grass)
    for(const p of grass){expect(meadowClear(p.x,p.y,.12)).toBe(true);expect(p.z).toBe(surfaceHeight(p.x,p.y))}
    // Check the fast spatial road guard against the real paved corridors.
    for(const road of roads)for(let i=0;i<road.samples.length;i+=15){const p=road.samples[i];expect(nearDrivingLane(p.x,p.y,.12)).toBe(true)}
    expect(detailPixels()).toEqual(detailPixels());expect(fieldNoise(10,11)).not.toBe(fieldNoise(37,19));expect(fieldSurfaceShader).toContain('p*.56');expect(fieldSurfaceShader).toContain('p*.091')
    expect(fieldSurfaceShader).toContain('uTerrainCarTrail')
})

test('groves have Poisson spacing and decorative clusters contain three to five props',()=>{
    expect(trees).toEqual(grovePlacements(2))
    for(let i=0;i<trees.length;i++)for(let j=i+1;j<trees.length;j++)expect(Math.hypot(trees[i].x-trees[j].x,trees[i].y-trees[j].y)).toBeGreaterThanOrEqual(environmentConfig.treeSpacing-.0001)
    const groups=new Map();for(const p of props){expect(meadowClear(p.x,p.y,p.radius)).toBe(true);groups.set(p.group,(groups.get(p.group)||0)+1)}
    expect(groups.size).toBeGreaterThan(2);for(const count of groups.values()){expect(count).toBeGreaterThanOrEqual(3);expect(count).toBeLessThanOrEqual(5)}
    expect(new Set(props.map(p=>p.kind)).has('log')).toBe(true);expect(new Set(props.map(p=>p.kind)).has('stump')).toBe(true)
})

test('pocket park artwork stays beyond the original driving shoulders',()=>{
    const item=refinedPlacement(scene,parkPlacements),positions=item.geometry.attributes.position
    for(let i=0;i<positions.count;i+=9)expect(roadEdgeDistance(positions.getX(i),positions.getY(i))).toBeGreaterThan(.8)
    item.geometry.dispose()
})

test('grass roots never intersect actual park paving or its approach paths',()=>{
    const container=new THREE.Group(),time={on:()=>{},off:()=>{}},parks=new MeadowParks({container,time,objects:{},camera:{},loader:{load:()=>{}}})
    const paving=parks.meshes[0],ray=new THREE.Raycaster();paving.updateMatrixWorld(true)
    for(const p of grass){ray.set(new THREE.Vector3(p.x,p.y,p.z+2),new THREE.Vector3(0,0,-1));expect(ray.intersectObject(paving)).toHaveLength(0)}
    parks.dispose()
})

test('instanced environment owns its resources, bounded batches, car trampling uniforms and optional-load teardown',()=>{
    const container=new THREE.Group(),callbacks=new Map(),world=new CANNON.World(),requests=[]
    const time={elapsed:0,on:(n,cb)=>callbacks.set(n,cb),off:n=>callbacks.delete(n)}
    const objects={physics:{world,addObjectFromThree:()=>{const body=new CANNON.Body({mass:0});world.addBody(body);return{body}}}}
    const camera={instance:new THREE.PerspectiveCamera()}
    const meadow=new MeadowEnvironment({container,objects,camera,time,trees,existingProps:existing,loader:{load:(url,ready)=>requests.push(ready)}})
    meadow.load();meadow.load();expect(requests).toHaveLength(1);requests[0]({scene});expect(meadow.state).toBe('ready')
    expect(meadow.instances.every(p=>p.isInstancedMesh)).toBe(true);expect(meadow.instances.length).toBeLessThan(125)
    const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <alphatest_fragment>'}
    meadowWindShader(shader,meadow.clock,meadow.motion,true);expect(shader.vertexShader).toContain('instanceMatrix');expect(shader.fragmentShader).toContain('meadowFade')
    expect(shader.vertexShader).toContain('vGrassTrample');expect(shader.fragmentShader).toContain('bladeGradient')
    updateMeadowCarInteraction({x:12,y:-40,z:.35},{x:4,y:0},0,.016)
    expect(meadowCarUniforms.uMeadowCarPos.value.x).toBe(12)
    expect(meadowCarUniforms.uMeadowCarPos.value.w).toBeCloseTo(4,5)
    updateTerrainCarReaction({x:12,y:-40,z:.35},{x:4,y:0},false,.016)
    expect(terrainCarUniforms.uTerrainCarPos.value.w).toBe(1)
    const parks=new MeadowParks({container,objects,camera,time,loader:{load:()=>{}}});parks.props.load();parks.dispose();meadow.dispose();meadow.dispose()
    expect(world.bodies).toHaveLength(0);expect(callbacks.size).toBe(0);expect(container.children).toHaveLength(0)
})

test('yielded meadow generation preserves its seed, prevents premature loading and stops on disposal',async()=>{
    const container=new THREE.Group(),time={on(){},off(){}},requests=[],objects={},camera={}
    const meadow=new MeadowEnvironment({container,time,objects,camera,trees,existingProps:existing,deferScatter:true,loader:{load:()=>requests.push(true)}})
    meadow.load();expect(requests).toHaveLength(0);expect(meadow.grass).toHaveLength(0)
    let slices=0
    const pending=meadow.prepareScatter(async()=>{slices++})
    expect(meadow.prepareScatter()).toBe(pending);await pending
    expect(slices).toBeGreaterThan(20);expect(meadow.grass).toEqual(meadowGrass(trees,meadow.scatterProps))
    meadow.load();expect(requests).toHaveLength(1);meadow.dispose()
    const stopped=new MeadowEnvironment({container,time,objects,camera,trees,existingProps:existing,deferScatter:true,loader:{load(){}}})
    await stopped.prepareScatter(async()=>stopped.dispose())
    expect(stopped.scatterReady).toBe(false);expect(stopped.grass).toHaveLength(0)
})
