import * as THREE from 'three'
import {environmentConfig} from './EnvironmentConfig.js'
import {surfaceHeight} from './LandscapeLayout.js'
import {meadowClear,nearDrivingLane} from './MeadowScatter.js'
import {districtFurniture} from './Sections/DistrictIdentityLayout.js'

// Existing courtyard lanterns plus new lights in verified, empty planting gaps.
// All positions are static; no dynamic point lights or shadow-map passes.
export const duskLanterns = [
    ...districtFurniture.filter(p=>p.kind==='lamp').map(p=>({...p,existing:true})),
    // Park corners lie outside the circular paving, benches and planted beds.
    // These deliberately reserved furnishing spots are not meadow scatter.
    ...[[-24,-64],[-18,-64],[48,-51],[54,-51],[-5.5,-83],[9.5,-83]]
        .filter(([x,y])=>!nearDrivingLane(x,y,.5)).map(([x,y])=>({x,y,existing:false,court:true})),
    ...[[-19,-69],[-23,-65],[49,-50],[53,-46],[-23,-9],[29,-10],[-61,-77],[76,-6],[116,-7],[142,-10]]
        .filter(([x,y])=>meadowClear(x,y,.5)).map(([x,y])=>({x,y,existing:false})),
].map(p=>({...p,z:surfaceHeight(p.x,p.y),radius:5.5}))

export const duskUniforms = {
    duskStrength:{value:environmentConfig.dusk.strength},
    duskExposure:{value:environmentConfig.dusk.exposure},
    duskShadowFill:{value:new THREE.Vector3(...environmentConfig.dusk.shadowFill)},
    duskSunKey:{value:new THREE.Vector3(...environmentConfig.dusk.sunKey)},
    duskLampStrength:{value:environmentConfig.dusk.lampStrength},
    // Cache inverse squared radius so the pixel loop needs no divisions.
    duskLamps:{value:duskLanterns.map(p=>new THREE.Vector4(p.x,p.y,p.z+2.1,1/(p.radius*p.radius)))},
}

export const duskSurfaceShader = `
uniform float duskStrength;
uniform float duskExposure;
uniform vec3 duskShadowFill;
uniform vec3 duskSunKey;
uniform float duskLampStrength;
uniform vec4 duskLamps[${duskLanterns.length}];
vec3 duskSurface(vec3 color,vec3 point,vec3 normal,float relief){
    vec3 unitNormal=normalize(normal);
    float key=max(0.0,dot(unitNormal,normalize(vec3(-.55,-.35,1.0))));
    vec3 ambient=mix(duskShadowFill,duskSunKey,key);
    vec3 evening=color*mix(vec3(.97,.98,1.0),ambient,relief);
    for(int i=0;i<${duskLanterns.length};i++){
        vec3 delta=duskLamps[i].xyz-point;
        float falloff=1.0-dot(delta.xy,delta.xy)*duskLamps[i].w;
        // Most pixels are outside every lamp pool. Avoid their normalization
        // and lighting work, while retaining exactly the same falloff inside.
        if(falloff>0.0){
            float facing=max(.18,dot(unitNormal,normalize(delta)));
            evening+=color*vec3(.65,.32,.08)*falloff*falloff*facing*duskLampStrength;
        }
    }
    vec3 lit=mix(color,evening,duskStrength)*mix(1.0,duskExposure,duskStrength);
    // A gentle highlight shoulder keeps cream paving and model faces readable.
    return lit/(1.0+max(lit-vec3(.9),vec3(0.0))*.35);
}`

// Compose with existing wind, road, paving and asset shaders, preserving them.
// Custom matcaps already expose world positions; built-ins need a varying.
const installedMaterials=new WeakSet()
export function installDuskMaterial(material){
    if(installedMaterials.has(material) || material.userData.duskEmission)return false
    const customMatcap=material.isShaderMaterial&&material.vertexShader.includes('varying vec3 vWorldPosition')&&material.fragmentShader.includes('USE_MATCAP')
    if(!customMatcap && !(material.isMeshBasicMaterial||material.isMeshMatcapMaterial||material.isMeshLambertMaterial||material.isMeshStandardMaterial))return false
    if(material.transparent && !customMatcap && material.depthWrite===false && (material.map||material.alphaMap))return false
    material.userData.duskApplied=true
    installedMaterials.add(material)
    const previous=material.onBeforeCompile.bind(material),cache=material.customProgramCacheKey.bind(material)
    const originalKey=cache()
    material.onBeforeCompile=(shader,renderer)=>{
        previous(shader,renderer);Object.assign(shader.uniforms,duskUniforms)
        let point='vWorldPosition',normal='inverseTransformDirection(vNormal,viewMatrix)'
        if(!customMatcap){
            point='vDuskPoint';normal='vDuskNormal'
            shader.vertexShader='varying vec3 vDuskPoint; varying vec3 vDuskNormal;\n'+shader.vertexShader
            shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
                vec4 duskPosition=vec4(transformed,1.0);
                vec3 duskNormal=normal;
                #ifdef USE_INSTANCING
                    duskPosition=instanceMatrix*duskPosition;
                    duskNormal=mat3(instanceMatrix)*duskNormal;
                #endif
                vDuskPoint=(modelMatrix*duskPosition).xyz;
                vDuskNormal=normalize(mat3(modelMatrix)*duskNormal);`)
            shader.fragmentShader='varying vec3 vDuskPoint; varying vec3 vDuskNormal;\n'+shader.fragmentShader
        }
        // The GLSL bundler trims template whitespace; keep directives on a new line.
        shader.fragmentShader=duskSurfaceShader+'\n'+shader.fragmentShader
        // Leave text/maps brighter; shading gives solid props more dimensionality.
        const relief=material.map?'0.15':'1.0'
        shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`gl_FragColor.rgb=duskSurface(gl_FragColor.rgb,${point},${normal},${relief});\n#include <fog_fragment>`)
    }
    material.customProgramCacheKey=()=>originalKey+'|cinematic-light-v2'
    material.needsUpdate=true
    return true
}
