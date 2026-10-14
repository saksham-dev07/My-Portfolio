import * as THREE from 'three'
import {environmentConfig} from './EnvironmentConfig.js'
import {noiseHash,smoothRange} from './FieldNoise.js'
import {landscapeSigns,foundationDistance} from './LandscapeLayout.js'
import {directionSigns} from './Sections/DirectionSigns.js'
import {vergeRoadClearance} from './RoadClearance.js'

const dirtSigns=[...landscapeSigns,...directionSigns]

export const TERRAIN_TRAIL_SLOTS = 8
export const terrainCarUniforms = {
    uTerrainCarPos: { value: new THREE.Vector4(0, 0, -100, 0) },
    uTerrainCarTrail: { value: Array.from({ length: TERRAIN_TRAIL_SLOTS }, () => new THREE.Vector4(0, 0, 0, 0)) },
}

export function updateTerrainCarReaction(position, _velocity, onRoad = false) {
    if (!position) return
    terrainCarUniforms.uTerrainCarPos.value.set(position.x, position.y, position.z, onRoad ? 0.25 : 1.0)
}

export function terrainDirt(x,y){
    let weight=(1-smoothRange(.25,3.4,vergeRoadClearance(x,y)))*.28
    weight=Math.max(weight,(1-smoothRange(.3,2.4,foundationDistance(x,y)))*.12)
    for(const p of dirtSigns)weight=Math.max(weight,(1-smoothRange(.45,2.5,Math.hypot(x-p.x,y-p.y)))*.38)
    return weight
}
export function detailPixels(size=128,seed=environmentConfig.seed){
    const data=new Uint8Array(size*size*4)
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
        // Periodic coordinates make the tile seamless across all three channels:
        // R: fine turf grain, G: directional blade/clover thatch, B: soil/pebble grit.
        const fine=noiseHash(x%size,y%size,seed)
        const coarse=noiseHash(Math.floor(x/4)%(size/4),Math.floor(y/4)%(size/4),seed+13)
        const blade=noiseHash((x+Math.floor(y/2))%size,Math.floor(y/2)%(size/2),seed+29)
        const clover=noiseHash(Math.floor(x/3)%(size/3),Math.floor(y/3)%(size/3),seed+47)
        const grit=noiseHash((x*2)%size,(y*2)%size,seed+71)
        const r=Math.round((.65*fine+.35*coarse)*255)
        const g=Math.round((.58*blade+.42*clover)*255)
        const b=Math.round((.52*grit+.48*fine)*255)
        const i=(y*size+x)*4
        data.set([r,g,b,255],i)
    }
    return data
}
export const fieldSurfaceShader=`
uniform sampler2D meadowDetail;
uniform float meadowSeed;
uniform float meadowPatchScale;
uniform float meadowDetailStrength;
uniform vec4 uTerrainCarPos;
uniform vec4 uTerrainCarTrail[${TERRAIN_TRAIL_SLOTS}];
varying float vFieldDirt;
float meadowHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+meadowSeed)*43758.5453);}
float meadowNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(meadowHash(i),meadowHash(i+vec2(1,0)),f.x),mix(meadowHash(i+vec2(0,1)),meadowHash(i+vec2(1,1)),f.x),f.y);}
vec3 meadowSurface(vec3 base,vec2 p,float vegetation){
    float n=.74*meadowNoise(p/meadowPatchScale)+.26*meadowNoise(p/(meadowPatchScale*.43)+19.0);
    float microPatch=meadowNoise(p/9.5+vec2(13.4,7.1));
    vec3 lush=mix(vec3(.25,.40,.25),vec3(.34,.49,.30),smoothstep(.18,.46,n));
    lush=mix(lush,vec3(.42,.56,.33),smoothstep(.45,.76,n));
    lush=mix(lush,vec3(.52,.59,.35),smoothstep(.70,.92,meadowNoise(p/23.0+61.0))*.38);
    lush=mix(lush,vec3(.30,.46,.28),smoothstep(.52,.86,microPatch)*.22);
    vec3 detailA=texture2D(meadowDetail,p*.56).rgb;
    vec3 detailB=texture2D(meadowDetail,mat2(.8,-.6,.6,.8)*p*.091+vec2(n,.37)).rgb;
    vec3 detailMicro=texture2D(meadowDetail,mat2(.94,.34,-.34,.94)*p*1.65).rgb;
    float a=detailA.r;
    float b=detailB.r;
    float thatch=(detailMicro.g-.5)*.45+(detailA.g-.5)*.35;
    float microRelief=1.0+(a-.5)*meadowDetailStrength*.65+(b-.5)*meadowDetailStrength*.45+thatch*meadowDetailStrength*.55;
    lush*=microRelief;
    float dirt=vFieldDirt*(.68+.32*meadowNoise(p/4.7));
    vec3 loam=mix(vec3(.57,.49,.36),vec3(.64,.56,.42),detailA.b);
    lush=mix(lush,loam,dirt);
    return mix(base,lush,vegetation*.85);
}`

export function installTerrainSurface(geometry,anisotropy=4){
    const positions=geometry.attributes.position,dirt=new Float32Array(positions.count)
    for(let i=0;i<positions.count;i++)dirt[i]=terrainDirt(positions.getX(i),positions.getY(i))
    geometry.setAttribute('fieldDirt',new THREE.BufferAttribute(dirt,1))
    const texture=new THREE.DataTexture(detailPixels(),128,128)
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter
    texture.generateMipmaps=true;texture.anisotropy=Math.min(8,anisotropy);texture.needsUpdate=true
    return {
        texture,
        uniforms:{
            meadowDetail:{value:texture},
            meadowSeed:{value:environmentConfig.seed},
            meadowPatchScale:{value:environmentConfig.patchScale},
            meadowDetailStrength:{value:environmentConfig.detailStrength},
            ...terrainCarUniforms,
        },
    }
}
