import * as THREE from 'three'
import {modelLoader} from '../Utils/ModelLoader.js'
import {refinedGeometry} from './RefinedProps.js'
import {enhanceMeadowGeometry} from './MeadowAssets.js'
import {meadowProps,meadowGrass,meadowGrassSteps} from './MeadowScatter.js'
import {atmospherePresets,environmentConfig} from './EnvironmentConfig.js'
import {seededRandom} from './FieldNoise.js'
import {duskLanterns} from './DuskLighting.js'
import {roadEdgeDistance} from './LandscapeLayout.js'
import {isDistrictPaving} from './Sections/DistrictIdentityLayout.js'
import {updateTerrainCarReaction} from './TerrainSurface.js'
import {yieldStartupTask} from '../Utils/WorldPreparation.js'

export const meadowAssetUrl='./saksham/models/environment-refresh.glb'
export const meadowAssetKinds=['tree-round','tree-pine','tree-bushy','tree-small','rock-0','rock-1','rock-2','bush','grass','flower','log','stump','bench','fountain','fence']

export const MEADOW_TRAIL_SLOTS = 6
export const meadowCarUniforms = {
    uMeadowCarPos: { value: new THREE.Vector4(0, 0, -100, 0) },
    uMeadowCarDir: { value: new THREE.Vector2(1, 0) },
    uMeadowCarTrail: { value: Array.from({ length: MEADOW_TRAIL_SLOTS }, () => new THREE.Vector4(0, 0, 0, 0)) },
}

let carTrailIndex = 0
let lastCarTrailX = 1e6
let lastCarTrailY = 1e6

export function updateMeadowCarInteraction(position, velocity, headingAngle = 0, dt = 0.016) {
    if (!position) return
    const vx = velocity?.x || 0
    const vy = velocity?.y || 0
    const speed = Math.hypot(vx, vy)
    const dirX = speed > 0.35 ? vx / speed : Math.cos(headingAngle)
    const dirY = speed > 0.35 ? vy / speed : Math.sin(headingAngle)

    meadowCarUniforms.uMeadowCarPos.value.set(position.x, position.y, position.z, speed)
    meadowCarUniforms.uMeadowCarDir.value.set(dirX, dirY)

    // Smooth, rapid elastic recovery (~0.9s) so grass gently springs back behind the wheels
    const decay = Math.max(0, 1 - dt * 1.35)
    for (let i = 0; i < MEADOW_TRAIL_SLOTS; i++) {
        const slot = meadowCarUniforms.uMeadowCarTrail.value[i]
        slot.z *= decay
        slot.w *= decay
    }

    if (speed > 0.8 && Math.hypot(position.x - lastCarTrailX, position.y - lastCarTrailY) > 0.9) {
        const slot = meadowCarUniforms.uMeadowCarTrail.value[carTrailIndex]
        const strength = Math.min(0.75, 0.35 + speed * 0.04)
        slot.set(position.x, position.y, dirX * strength, dirY * strength)
        carTrailIndex = (carTrailIndex + 1) % MEADOW_TRAIL_SLOTS
        lastCarTrailX = position.x
        lastCarTrailY = position.y
    }
}

export function meadowWindShader(shader,clock,motion,grass){
    shader.uniforms.fieldTime=clock
    shader.uniforms.fieldMotion=motion
    Object.assign(shader.uniforms,meadowCarUniforms)
    shader.vertexShader=`uniform float fieldTime;
uniform float fieldMotion;
uniform vec4 uMeadowCarPos;
uniform vec2 uMeadowCarDir;
uniform vec4 uMeadowCarTrail[${MEADOW_TRAIL_SLOTS}];
varying vec3 vMeadowPosition;
varying float vGrassBladeH;
varying float vGrassGust;
varying float vGrassTrample;
`+shader.vertexShader
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        vec2 instanceXY=vec2(instanceMatrix[3][0],instanceMatrix[3][1]);
        float phase=instanceMatrix[3].x*.37+instanceMatrix[3].y*.23;
        float flex=smoothstep(${grass?'.01,.17':'1.8,4.8'},position.z);
        float gust=.5+.5*sin(fieldTime*1.35-instanceXY.x*.09-instanceXY.y*.07+sin(phase)*.6);
        float windAmp=${grass?'.026':'.035'}*(.8+.4*gust);
        vec2 worldWind=vec2(
            sin(fieldTime*1.15+phase)*windAmp,
            cos(fieldTime*.85+phase*.7)*windAmp*.55
        )*flex*fieldMotion;
        vec2 axisX=instanceMatrix[0].xy;
        vec2 axisY=instanceMatrix[1].xy;
        float invScale2=1.0/max(.04,dot(axisX,axisX));
        vec2 localWind=vec2(dot(worldWind,axisX),dot(worldWind,axisY))*invScale2;
        transformed.xy+=localWind;
        vGrassBladeH=clamp(position.z/.19,0.0,1.0);
        vGrassGust=gust;
        vGrassTrample=0.0;
        ${grass?`
        if(uMeadowCarPos.z>-50.0){
            vec2 delta=instanceXY-uMeadowCarPos.xy;
            vec2 rightDir=vec2(-uMeadowCarDir.y,uMeadowCarDir.x);
            float along=dot(delta,uMeadowCarDir);
            float across=dot(delta,rightDir);
            // Tight, smooth capsule footprint around the vehicle wheels and chassis
            float boxDist=length(vec2(along/1.55,across/1.05));
            float directCrush=smoothstep(1.05,.25,boxDist);
            vec2 radialDir=length(delta)>.001?normalize(delta):uMeadowCarDir;
            vec2 worldPush=normalize(radialDir+uMeadowCarDir*.35)*directCrush*.18;
            float wakeCrush=0.0;
            for(int i=0;i<${MEADOW_TRAIL_SLOTS};i++){
                vec4 trail=uMeadowCarTrail[i];
                float trailStrength=length(trail.zw);
                if(trailStrength>0.01){
                    vec2 td=instanceXY-trail.xy;
                    float tf=exp(-dot(td,td)*1.15)*trailStrength;
                    if(tf>wakeCrush){
                        wakeCrush=tf;
                        vec2 wakeDir=length(td)>.001?normalize(td):normalize(trail.zw);
                        worldPush+=wakeDir*tf*.10;
                    }
                }
            }
            vGrassTrample=clamp(max(directCrush,wakeCrush),0.0,1.0);
            // Convert worldPush into the instance's rotated local frame so every tuft
            // bends smoothly away from the car instead of twisting randomly!
            vec2 localPush=vec2(dot(worldPush,axisX),dot(worldPush,axisY))*invScale2;
            transformed.xy+=localPush*flex;
            transformed.z*=1.0-.48*vGrassTrample*flex;
        }
        `:''}
        vMeadowPosition=(modelMatrix*instanceMatrix*vec4(transformed,1.0)).xyz;`)
    if(grass){
        shader.fragmentShader=`varying vec3 vMeadowPosition;
varying float vGrassBladeH;
varying float vGrassGust;
varying float vGrassTrample;
`+shader.fragmentShader
        shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
            float meadowFade=1.0-smoothstep(${(environmentConfig.grassViewDistance*.65).toFixed(3)},${environmentConfig.grassViewDistance.toFixed(3)},length(vMeadowPosition-cameraPosition));
            if(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)>meadowFade)discard;
            vec3 rootColor=vec3(.31,.48,.29);
            vec3 midColor=mix(diffuseColor.rgb,vec3(.40,.58,.33),.45);
            vec3 tipColor=vec3(.56,.71,.38)+vec3(.05,.06,.02)*vGrassGust;
            vec3 bladeGradient=mix(rootColor,midColor,smoothstep(0.0,.52,vGrassBladeH));
            bladeGradient=mix(bladeGradient,tipColor,smoothstep(.42,1.0,vGrassBladeH));
            diffuseColor.rgb=mix(bladeGradient,rootColor*.92,vGrassTrample*.25);`)
    }
}

export default class MeadowEnvironment{
    constructor({container,objects,camera,time,trees,existingProps=[],onReady=()=>{},loader=modelLoader,deferScatter=false}){
        Object.assign(this,{container,objects,camera,time,trees,onReady,loader});this.disposed=false;this.state='idle';this.instances=[];this.geometries=[];this.bodies=[]
        this.clock={value:0};this.motion={value:1};this.nextCheck=0
        this.frustum=new THREE.Frustum();this.matrix=new THREE.Matrix4()
        this.region=new THREE.Sphere(new THREE.Vector3(52,-58,3),155)
        this.props=meadowProps(trees,existingProps)
        this.scatterProps=[...existingProps,...this.props,...duskLanterns.map(p=>({...p,radius:.45}))]
        this.grass=deferScatter?[]:meadowGrass(trees,this.scatterProps);this.scatterReady=!deferScatter
        this.setFlowers()
        const matcap=objects?.materials?.shades?.items?.white?.uniforms?.matcap?.value
        this.material=matcap?new THREE.MeshMatcapMaterial({matcap,vertexColors:true}):new THREE.MeshLambertMaterial({vertexColors:true})
        this.treeMaterial=this.material.clone();this.treeMaterial.onBeforeCompile=s=>meadowWindShader(s,this.clock,this.motion,false);this.treeMaterial.customProgramCacheKey=()=> 'meadow-tree-wind-v3'
        this.grassMaterial=this.material.clone();this.grassMaterial.side=THREE.DoubleSide;this.grassMaterial.onBeforeCompile=s=>meadowWindShader(s,this.clock,this.motion,true);this.grassMaterial.customProgramCacheKey=()=> 'meadow-grass-wind-v3'
        this.sun=new THREE.DirectionalLight('#ffe8c9',environmentConfig.sunIntensity);this.sun.position.set(-55,-30,100);container.add(this.sun)
        this.ambient=new THREE.HemisphereLight('#d9e6dc','#4b6140',environmentConfig.ambientIntensity);this.ambient.up.set(0,0,1);this.ambient.position.set(0,0,100);container.add(this.ambient)
        this.preference=globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)');this.sync=()=>{this.motion.value=this.preference?.matches?0:1};this.sync();this.preference?.addEventListener('change',this.sync)
        time.on('tick.meadowEnvironment',()=>{
            if(this.disposed||globalThis.document?.hidden)return
            const dt=Math.min(time.delta||16.667,100)/1000
            this.clock.value=(time.elapsed||0)*.001
            const body=this.objects?.physics?.car?.chassis?.body
            if(body?.position){
                const onRoad=roadEdgeDistance(body.position.x,body.position.y)<-.12||isDistrictPaving(body.position.x,body.position.y)
                updateMeadowCarInteraction(body.position,body.velocity,0,dt)
                updateTerrainCarReaction(body.position,body.velocity,onRoad,dt)
            }
            if(!this.scatterReady||this.state!=='idle'||time.elapsed<this.nextCheck)return;this.nextCheck=time.elapsed+500
            camera.instance.updateMatrixWorld();this.matrix.multiplyMatrices(camera.instance.projectionMatrix,camera.instance.matrixWorldInverse);this.frustum.setFromProjectionMatrix(this.matrix)
            if(camera.view==='top'||this.frustum.intersectsSphere(this.region))this.load()
        })
    }

    setAtmosphere(modeOrPreset='dusk'){
        const preset=typeof modeOrPreset==='string'
            ? (atmospherePresets[modeOrPreset]||atmospherePresets.dusk)
            : modeOrPreset
        if(this.sun){
            this.sun.intensity=preset.sunIntensity ?? environmentConfig.sunIntensity
            this.sun.color.set(preset.id==='night'?'#b8ccf0':preset.id==='day'?'#fff3db':'#ffe8c9')
        }
        if(this.ambient){
            this.ambient.intensity=preset.ambientIntensity ?? environmentConfig.ambientIntensity
        }
        return preset
    }

    setFlowers(){
        const random=seededRandom(environmentConfig.seed+109),stride=Math.max(1,Math.floor(this.grass.length/environmentConfig.flowerCount))
        this.flowers=this.grass.filter((_,i)=>i%stride===0).slice(0,environmentConfig.flowerCount).map(p=>({...p,kind:'flower',scale:.95+random()*.45,tint:['#f5e6a0','#f5eee1','#e6a1b3','#a8d8f0'][Math.floor(random()*4)]}))
    }
    prepareScatter(yieldTask=yieldStartupTask){
        if(this.scatterPreparation)return this.scatterPreparation
        if(this.scatterReady)return Promise.resolve()
        this.scatterPreparation=this.buildScatter(yieldTask)
        return this.scatterPreparation
    }
    async buildScatter(yieldTask){
        const steps=meadowGrassSteps(this.trees,this.scatterProps)
        let result=steps.next()
        while(!result.done){await yieldTask();if(this.disposed)return;result=steps.next()}
        this.grass=result.value;this.setFlowers();this.scatterReady=true
    }

    load(){
        if(this.disposed||!this.scatterReady||this.state!=='idle')return;this.state='loading'
        this.loader.load(meadowAssetUrl,gltf=>{
            if(this.disposed)return
            try{
                const groups=new Map(),all=[...this.trees,...this.props,...this.grass,...this.flowers]
                for(const p of all){
                    const chunk=p.kind==='flower'?64:environmentConfig.grassChunkSize
                    const key=p.kind==='grass'||p.kind==='flower'?`${p.kind}:${Math.floor(p.x/chunk)},${Math.floor(p.y/chunk)}`:p.kind
                    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p)
                }
                const prototypes=new Map(),dummy=new THREE.Object3D(),color=new THREE.Color(),solids=[]
                for(const [key,points]of groups){
                    const kind=points[0].kind
                    if(!prototypes.has(kind)){
                        const raw=refinedGeometry(gltf.scene,kind)
                        const enhancedGeometry=enhanceMeadowGeometry(kind,raw.geometry)
                        if(enhancedGeometry!==raw.geometry)raw.geometry.dispose()
                        prototypes.set(kind,{...raw,geometry:enhancedGeometry})
                        this.geometries.push(enhancedGeometry)
                    }
                    const source=prototypes.get(kind),small=kind==='grass'||kind==='flower',tree=kind.startsWith('tree')
                    const mesh=new THREE.InstancedMesh(source.geometry,small?this.grassMaterial:tree?this.treeMaterial:this.material,points.length);mesh.name=`Meadow / ${key}`;mesh.userData.cameraCollision=false
                    points.forEach((p,i)=>{
                        dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,0,p.angle||0);dummy.scale.setScalar(p.scale||1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)
                        if(p.tint){
                            color.set(p.tint)
                        }else if(kind==='grass'){
                            const s=p.shade||1
                            color.setRGB(s*(.94+(i%5)*.02),s*(.97+(i%3)*.02),s*(.90+(i%4)*.02))
                        }else{
                            color.setRGB(p.shade||1,p.shade||1,p.shade||1)
                        }
                        mesh.setColorAt(i,color)
                        for(const box of source.boxes){
                            const solid=new THREE.Object3D();solid.name='box';solid.position.fromArray(box.center).applyMatrix4(dummy.matrix);solid.rotation.z=p.angle||0;solid.scale.fromArray(box.size).multiplyScalar(p.scale||1);solids.push(solid)
                        }
                    })
                    mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.08;containerAdd(this,mesh)
                }
                if(solids.length)this.collision=this.objects.physics.addObjectFromThree({meshes:solids,offset:new THREE.Vector3(),rotation:new THREE.Euler(),mass:0,sleep:true})
                this.state='ready';this.onReady(this.trees)
            }catch(error){this.state='error';this.error=error.message;this.clearArtwork()}
        },undefined,error=>{this.state='error';this.error=error?.message||'Environment kit unavailable'})
    }
    clearArtwork(){for(const mesh of this.instances){mesh.removeFromParent();mesh.dispose()}this.instances=[];for(const geometry of this.geometries)geometry.dispose();this.geometries=[];this.collision?.body?.world?.removeBody(this.collision.body)}
    dispose(){if(this.disposed)return;this.disposed=true;this.time.off('tick.meadowEnvironment');this.preference?.removeEventListener('change',this.sync);this.clearArtwork();for(const material of [this.material,this.treeMaterial,this.grassMaterial])material.dispose();this.sun.removeFromParent();this.ambient.removeFromParent()}
}
function containerAdd(owner,mesh){owner.container.add(mesh);owner.instances.push(mesh)}
