import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {modelLoader} from '../Utils/ModelLoader.js'
import {refinedGeometry,refinedPropsUrl} from './RefinedProps.js'
import {duskLanterns,installDuskMaterial} from './DuskLighting.js'
import {environmentConfig} from './EnvironmentConfig.js'
import {districtCourts} from './Sections/DistrictIdentityLayout.js'
import {surfaceHeight} from './LandscapeLayout.js'

export default class EveningEnvironment{
    constructor({container,time,passes,loader=modelLoader}){
        this.container=new THREE.Group();this.container.name='Evening atmosphere / lanterns and district inlays';container.add(this.container)
        Object.assign(this,{time,loader});this.disposed=false;this.nextScan=0;this.state='loading';this.materialCount=0
        this.materials=new WeakSet();this.visitMaterial=material=>{
            if(this.materials.has(material))return;this.materials.add(material)
            if(installDuskMaterial(material))this.materialCount++
        }
        this.scanMesh=mesh=>{
            if(!mesh.isMesh)return
            if(Array.isArray(mesh.material)){for(const material of mesh.material)this.visitMaterial(material)}
            else this.visitMaterial(mesh.material)
        }
        this.worldContainer=container
        if(environmentConfig.dusk.strength<=0){this.state='disabled';return}
        this.setLamps();this.setInlays()
        this.scan=()=>container.traverse(this.scanMesh);this.scan()
        // A slow material discovery handles deferred GLBs once; wind and driving
        // keep their existing frame callbacks, with no per-frame scene allocations.
        time.on('tick.eveningEnvironment',()=>{
            if(globalThis.document?.hidden||time.elapsed<this.nextScan)return
            this.nextScan=time.elapsed+1000;this.scan()
        })
        passes.glowsPass.material.uniforms.uAlpha.value=.025
        passes.glowsPass.material.uniforms.uColor.value.set('#ffe7c4').convertLinearToSRGB()
    }
    emission(material){material.userData.duskEmission=true;return material}
    setLamps(){
        const matrix=new THREE.Matrix4(),dummy=new THREE.Object3D()
        // Cover the original frosted glass while leaving the dark mullions exposed.
        // A core inside the opaque GLB glass would be completely occluded.
        this.cores=new THREE.InstancedMesh(new THREE.BoxGeometry(.35,.35,.375),this.emission(new THREE.MeshBasicMaterial({color:new THREE.Color('#ffd696').convertLinearToSRGB()})),duskLanterns.length)
        this.cores.name='Warm frosted lantern windows'
        duskLanterns.forEach((p,i)=>{matrix.makeTranslation(p.x,p.y,p.z+2.1);this.cores.setMatrixAt(i,matrix)})
        this.container.add(this.cores)
        const haloMaterial=this.emission(new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
            uniforms:{strength:{value:environmentConfig.dusk.lampStrength*environmentConfig.dusk.strength}},
            vertexShader:`varying vec2 vGlowUv;
                void main(){vGlowUv=uv;vec4 center=modelMatrix*instanceMatrix*vec4(0,0,0,1);
                    vec4 eye=viewMatrix*center;eye.xy+=position.xy;
                    gl_Position=projectionMatrix*eye;}`,
            fragmentShader:`varying vec2 vGlowUv;uniform float strength;
                void main(){float r=length(vGlowUv-.5)*2.0;
                    float halo=pow(max(0.0,1.0-r),3.0)*.38*strength;
                    gl_FragColor=vec4(vec3(1.0,.54,.19),halo);}`,
        }))
        this.halos=new THREE.InstancedMesh(new THREE.PlaneGeometry(2.6,2.6),haloMaterial,duskLanterns.length)
        this.halos.name='Local lantern halos / single billboard batch'
        duskLanterns.forEach((p,i)=>{matrix.makeTranslation(p.x,p.y,p.z+2.1);this.halos.setMatrixAt(i,matrix)})
        this.container.add(this.halos)
        for(const mesh of [this.cores,this.halos]){mesh.computeBoundingSphere();mesh.boundingSphere.radius+=2;mesh.userData.cameraCollision=false}
        this.loader.load(refinedPropsUrl,gltf=>{
            if(this.disposed)return
            try{
                const prototype=refinedGeometry(gltf.scene,'lamp'),points=duskLanterns.filter(p=>!p.existing)
                this.lamps=new THREE.InstancedMesh(prototype.geometry,new THREE.MeshMatcapMaterial({vertexColors:true}),points.length)
                this.lamps.name='Blender lanterns / empty roadside planting gaps';this.lamps.userData.cameraCollision=false
                points.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.updateMatrix();this.lamps.setMatrixAt(i,dummy.matrix)})
                this.lamps.computeBoundingSphere();this.container.add(this.lamps);this.scan();this.state='ready'
            }catch(error){this.state='error';this.error=error.message}
        },undefined,error=>{if(!this.disposed){this.state='error';this.error=error?.message||'Evening lanterns unavailable'}})
    }
    setInlays(){
        const pieces=[],colors={about:'#7fdbc8',skills:'#87c9f1',education:'#e8be77',highlights:'#efa7bf'}
        for(const p of districtCourts){
            // Thin lights hug the existing side borders; approach labels remain clear.
            for(const side of [-1,1]){
                const geometry=new THREE.BoxGeometry(.045,p.h*.65,.06),color=new THREE.Color(colors[p.id]).convertLinearToSRGB()
                geometry.translate(p.x+side*(p.w/2-.32),p.y-1,surfaceHeight(p.x,p.y)+.09)
                const data=new Float32Array(geometry.attributes.position.count*3)
                for(let i=0;i<data.length;i+=3)data.set([color.r,color.g,color.b],i)
                geometry.setAttribute('color',new THREE.BufferAttribute(data,3));pieces.push(geometry)
            }
        }
        this.inlays=new THREE.Mesh(mergeGeometries(pieces),this.emission(new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:environmentConfig.dusk.accentStrength})))
        pieces.forEach(p=>p.dispose());this.inlays.name='District light inlays / existing paving edges';this.inlays.userData.cameraCollision=false
        this.container.add(this.inlays)
    }
    dispose(){
        if(this.disposed)return;this.disposed=true;this.time.off('tick.eveningEnvironment')
        this.container.traverse(mesh=>{if(mesh.isMesh){mesh.geometry.dispose();mesh.material.dispose();if(mesh.isInstancedMesh)mesh.dispose()}})
        this.container.removeFromParent()
    }
}
