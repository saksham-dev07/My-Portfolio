import * as THREE from 'three'
import {modelLoader} from '../Utils/ModelLoader.js'
import {refinedGeometry} from './RefinedProps.js'
import {meadowProps,meadowGrass,meadowGrassSteps} from './MeadowScatter.js'
import {environmentConfig} from './EnvironmentConfig.js'
import {seededRandom} from './FieldNoise.js'
import {duskLanterns} from './DuskLighting.js'
import {yieldStartupTask} from '../Utils/WorldPreparation.js'

export const meadowAssetUrl='./saksham/models/environment-refresh.glb'
export const meadowAssetKinds=['tree-round','tree-pine','tree-bushy','tree-small','rock-0','rock-1','rock-2','bush','grass','flower','log','stump','bench','fountain','fence']

export function meadowWindShader(shader,clock,motion,grass){
    shader.uniforms.fieldTime=clock;shader.uniforms.fieldMotion=motion
    shader.vertexShader='uniform float fieldTime;uniform float fieldMotion;varying vec3 vMeadowPosition;\n'+shader.vertexShader
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        float phase=instanceMatrix[3].x*.37+instanceMatrix[3].y*.23;
        float flex=smoothstep(${grass?'.02,.40':'1.8,4.8'},position.z);
        transformed.x+=sin(fieldTime*1.1+phase)*flex*fieldMotion*${grass?environmentConfig.grassWind:'.035'};
        transformed.y+=cos(fieldTime*.8+phase*.7)*flex*fieldMotion*${grass?environmentConfig.grassWind*.5:'.018'};
        vMeadowPosition=(modelMatrix*instanceMatrix*vec4(transformed,1.0)).xyz;`)
    if(grass){
        shader.fragmentShader='varying vec3 vMeadowPosition;\n'+shader.fragmentShader
        shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
            float meadowFade=1.0-smoothstep(${(environmentConfig.grassViewDistance*.65).toFixed(3)},${environmentConfig.grassViewDistance.toFixed(3)},length(vMeadowPosition-cameraPosition));
            if(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)>meadowFade)discard;`)
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
        this.material=new THREE.MeshLambertMaterial({vertexColors:true})
        this.treeMaterial=this.material.clone();this.treeMaterial.onBeforeCompile=s=>meadowWindShader(s,this.clock,this.motion,false);this.treeMaterial.customProgramCacheKey=()=> 'meadow-tree-wind-v1'
        this.grassMaterial=this.material.clone();this.grassMaterial.side=THREE.DoubleSide;this.grassMaterial.onBeforeCompile=s=>meadowWindShader(s,this.clock,this.motion,true);this.grassMaterial.customProgramCacheKey=()=> 'meadow-grass-wind-v1'
        this.sun=new THREE.DirectionalLight('#ffe8c9',environmentConfig.sunIntensity);this.sun.position.set(-55,-30,100);container.add(this.sun)
        this.ambient=new THREE.HemisphereLight('#d9e6dc','#4b6140',environmentConfig.ambientIntensity);this.ambient.up.set(0,0,1);this.ambient.position.set(0,0,100);container.add(this.ambient)
        this.preference=globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)');this.sync=()=>{this.motion.value=this.preference?.matches?0:1};this.sync();this.preference?.addEventListener('change',this.sync)
        time.on('tick.meadowEnvironment',()=>{
            if(this.disposed||globalThis.document?.hidden)return
            this.clock.value=(time.elapsed||0)*.001
            if(!this.scatterReady||this.state!=='idle'||time.elapsed<this.nextCheck)return;this.nextCheck=time.elapsed+500
            camera.instance.updateMatrixWorld();this.matrix.multiplyMatrices(camera.instance.projectionMatrix,camera.instance.matrixWorldInverse);this.frustum.setFromProjectionMatrix(this.matrix)
            if(camera.view==='top'||this.frustum.intersectsSphere(this.region))this.load()
        })
    }

    setFlowers(){
        const random=seededRandom(environmentConfig.seed+109),stride=Math.max(1,Math.floor(this.grass.length/environmentConfig.flowerCount))
        this.flowers=this.grass.filter((_,i)=>i%stride===0).slice(0,environmentConfig.flowerCount).map(p=>({...p,kind:'flower',scale:.9+random()*.5,tint:['#f5e6a0','#f5eee1','#e6a1b3'][Math.floor(random()*3)]}))
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
                    if(!prototypes.has(kind)){const source=refinedGeometry(gltf.scene,kind);prototypes.set(kind,source);this.geometries.push(source.geometry)}
                    const source=prototypes.get(kind),small=kind==='grass'||kind==='flower',tree=kind.startsWith('tree')
                    const mesh=new THREE.InstancedMesh(source.geometry,small?this.grassMaterial:tree?this.treeMaterial:this.material,points.length);mesh.name=`Meadow / ${key}`;mesh.userData.cameraCollision=false
                    points.forEach((p,i)=>{
                        dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,0,p.angle||0);dummy.scale.setScalar(p.scale||1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)
                        if(p.tint)color.set(p.tint);else color.setRGB(p.shade||1,p.shade||1,p.shade||1);mesh.setColorAt(i,color)
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
