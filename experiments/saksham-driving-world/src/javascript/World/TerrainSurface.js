import * as THREE from 'three'
import {environmentConfig} from './EnvironmentConfig.js'
import {noiseHash,smoothRange} from './FieldNoise.js'
import {landscapeSigns,foundationDistance} from './LandscapeLayout.js'
import {directionSigns} from './Sections/DirectionSigns.js'
import {vergeRoadClearance} from './RoadClearance.js'

const dirtSigns=[...landscapeSigns,...directionSigns]

export function terrainDirt(x,y){
    let weight=(1-smoothRange(.25,3.4,vergeRoadClearance(x,y)))*.28
    weight=Math.max(weight,(1-smoothRange(.3,2.4,foundationDistance(x,y)))*.12)
    for(const p of dirtSigns)weight=Math.max(weight,(1-smoothRange(.45,2.5,Math.hypot(x-p.x,y-p.y)))*.38)
    return weight
}
export function detailPixels(size=128,seed=environmentConfig.seed){
    const data=new Uint8Array(size*size*4)
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
        // Periodic coordinates make the tile seamless, including coarse grain.
        const fine=noiseHash(x%size,y%size,seed),coarse=noiseHash(Math.floor(x/4)% (size/4),Math.floor(y/4)% (size/4),seed+13)
        const n=Math.round((.65*fine+.35*coarse)*255),i=(y*size+x)*4
        data.set([n,n,n,255],i)
    }
    return data
}
export const fieldSurfaceShader=`
uniform sampler2D meadowDetail;
uniform float meadowSeed;
uniform float meadowPatchScale;
uniform float meadowDetailStrength;
varying float vFieldDirt;
float meadowHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+meadowSeed)*43758.5453);}
float meadowNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(meadowHash(i),meadowHash(i+vec2(1,0)),f.x),mix(meadowHash(i+vec2(0,1)),meadowHash(i+vec2(1,1)),f.x),f.y);}
vec3 meadowSurface(vec3 base,vec2 p,float vegetation){
    float n=.74*meadowNoise(p/meadowPatchScale)+.26*meadowNoise(p/(meadowPatchScale*.43)+19.0);
    vec3 lush=mix(vec3(.24,.38,.25),vec3(.34,.48,.30),smoothstep(.20,.45,n));
    lush=mix(lush,vec3(.43,.55,.33),smoothstep(.46,.75,n));
    lush=mix(lush,vec3(.53,.57,.35),smoothstep(.74,.92,meadowNoise(p/23.0+61.0))*.38);
    float a=texture2D(meadowDetail,p*.56).r;
    float b=texture2D(meadowDetail,mat2(.8,-.6,.6,.8)*p*.091+vec2(n,.37)).r;
    lush*=1.0+(a-.5)*meadowDetailStrength+(b-.5)*meadowDetailStrength*.6;
    float dirt=vFieldDirt*(.68+.32*meadowNoise(p/4.7));
    lush=mix(lush,vec3(.61,.54,.39),dirt);
    return mix(base,lush,vegetation*.82);
}`

export function installTerrainSurface(geometry,anisotropy=4){
    const positions=geometry.attributes.position,dirt=new Float32Array(positions.count)
    for(let i=0;i<positions.count;i++)dirt[i]=terrainDirt(positions.getX(i),positions.getY(i))
    geometry.setAttribute('fieldDirt',new THREE.BufferAttribute(dirt,1))
    const texture=new THREE.DataTexture(detailPixels(),128,128)
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter
    texture.generateMipmaps=true;texture.anisotropy=Math.min(8,anisotropy);texture.needsUpdate=true
    return {texture,uniforms:{meadowDetail:{value:texture},meadowSeed:{value:environmentConfig.seed},meadowPatchScale:{value:environmentConfig.patchScale},meadowDetailStrength:{value:environmentConfig.detailStrength}}}
}
