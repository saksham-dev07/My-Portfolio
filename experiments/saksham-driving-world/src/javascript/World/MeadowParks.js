import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {environmentConfig} from './EnvironmentConfig.js'
import {surfaceHeight} from './LandscapeLayout.js'
import RefinedPropBatch,{refinedGeometry} from './RefinedProps.js'
import {meadowAssetUrl} from './MeadowEnvironment.js'
import {groundLayer} from './GroundLayers.js'

export const parkPlacements=environmentConfig.parks.flatMap(p=>[
    {id:p.id+'-fountain',kind:'fountain',x:p.x,y:p.y},
    {id:p.id+'-west-bench',kind:'bench',x:p.x-2.4,y:p.y+.3,angle:Math.PI/2},
    {id:p.id+'-east-bench',kind:'bench',x:p.x+2.4,y:p.y+.3,angle:-Math.PI/2},
    ...[-1.05,1.05].map((dx,i)=>({id:p.id+'-rail-'+i,kind:'fence',x:p.x+dx,y:p.y-3.1})),
]).map(p=>({...p,z:surfaceHeight(p.x,p.y)}))

export default class MeadowParks{
    constructor({container,objects,camera,time,loader}){
        Object.assign(this,{container,objects,time});this.meshes=[];this.materials=[];this.disposed=false;this.clock={value:0};this.surge={value:0}
        this.jetDummy=new THREE.Object3D()
        this.props=new RefinedPropBatch({name:'meadowParkProps',url:meadowAssetUrl,placements:parkPlacements,objects,camera,time,container,loader,onReady:(_,scene)=>this.finish(scene)})
        this.pave()
        time.on('tick.meadowParkWater',()=>{
            if(globalThis.document?.hidden)return
            this.clock.value=(time.elapsed||0)*.001
            const carPos=this.objects?.physics?.car?.chassis?.body?.position
            if(carPos&&this.jets){
                let maxBoost=0
                environmentConfig.parks.forEach((p,i)=>{
                    const dist=Math.hypot(carPos.x-p.x,carPos.y-p.y)
                    const proximity=Math.max(0,1-dist/10.5)
                    maxBoost=Math.max(maxBoost,proximity)
                    const pulse=1+.12*Math.sin(this.clock.value*4.2+i*1.7)
                    const jetScaleZ=(1+proximity*.85)*pulse
                    const baseZ=surfaceHeight(p.x,p.y)
                    this.jetDummy.rotation.set(0,0,0)
                    this.jetDummy.scale.set(1+proximity*.25,1+proximity*.25,jetScaleZ)
                    this.jetDummy.position.set(p.x,p.y,baseZ+.33+.39*jetScaleZ)
                    this.jetDummy.updateMatrix()
                    this.jets.setMatrixAt(i,this.jetDummy.matrix)
                })
                this.jets.instanceMatrix.needsUpdate=true
                this.surge.value=maxBoost
            }
        })
    }
    pave(){
        const parts=[]
        for(const p of environmentConfig.parks){
            const base=surfaceHeight(p.x,p.y)
            parts.push(new THREE.CircleGeometry(2.75,32).translate(p.x,p.y,base))
            parts.push(new THREE.RingGeometry(2.79,3.02,48).translate(p.x,p.y,base))
        }
        for(const path of environmentConfig.parkPaths)if(environmentConfig.parks.some(p=>p.id===path.park))parts.push(new THREE.PlaneGeometry(path.w,path.h).translate(path.x,path.y,surfaceHeight(path.x,path.y)))
        if(!parts.length)return
        const material=new THREE.MeshBasicMaterial({color:new THREE.Color('#d9c8a7').convertLinearToSRGB()}),mesh=new THREE.Mesh(mergeGeometries(parts),material)
        parts.forEach(p=>p.dispose());mesh.name='Pocket parks / sandstone paths';this.container.add(mesh);groundLayer(mesh,'surface');this.meshes.push(mesh);this.materials.push(material)
    }
    finish(scene){
        const waterGeometry=new THREE.CircleGeometry(.745,24),waterMaterial=new THREE.MeshBasicMaterial({color:'#6db6ac'}),dummy=new THREE.Object3D()
        waterMaterial.onBeforeCompile=shader=>{
            shader.uniforms.parkWaterTime=this.clock
            shader.uniforms.parkWaterSurge=this.surge
            shader.fragmentShader='uniform float parkWaterTime;uniform float parkWaterSurge;\n'+shader.fragmentShader
            shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
                float r=length(vUv-.5)*2.0;
                float speed=1.7+parkWaterSurge*2.2;
                float ring=sin(r*45.0-parkWaterTime*speed);
                diffuseColor.rgb*=.95+(.04+.04*parkWaterSurge)*ring;
                diffuseColor.rgb+=vec3(.12,.18,.16)*smoothstep(.65,.98,ring)*parkWaterSurge;`)
        }
        // Explicit UV use keeps the standard material's UV varying available.
        waterMaterial.defines={USE_UV:''};waterMaterial.customProgramCacheKey=()=> 'park-ripples-v2'
        const waters=new THREE.InstancedMesh(waterGeometry,waterMaterial,environmentConfig.parks.length)
        const jetGeometry=new THREE.CylinderGeometry(.025,.055,.78,6).rotateX(Math.PI/2),jets=new THREE.InstancedMesh(jetGeometry,waterMaterial,environmentConfig.parks.length)
        this.waters=waters;this.jets=jets
        environmentConfig.parks.forEach((p,i)=>{
            dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.position.set(p.x,p.y,surfaceHeight(p.x,p.y)+.19);dummy.updateMatrix();waters.setMatrixAt(i,dummy.matrix)
            dummy.position.z=surfaceHeight(p.x,p.y)+.72;dummy.updateMatrix();jets.setMatrixAt(i,dummy.matrix)
        })
        for(const [mesh,name]of [[waters,'Pocket parks / rippling basins'],[jets,'Pocket parks / water spouts']]){mesh.name=name;mesh.userData.cameraCollision=false;mesh.computeBoundingSphere();this.container.add(mesh);this.meshes.push(mesh)}
        this.materials.push(waterMaterial)
        const flowerGeometry=refinedGeometry(scene,'flower').geometry,flowerMaterial=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),flowers=new THREE.InstancedMesh(flowerGeometry,flowerMaterial,environmentConfig.parks.length*48)
        const color=new THREE.Color();let index=0
        for(const p of environmentConfig.parks)for(let i=0;i<48;i++){
            const angle=Math.PI*(i/47)+Math.PI,r=2.05+(i%3)*.18
            dummy.position.set(p.x+Math.cos(angle)*r,p.y+Math.sin(angle)*r,surfaceHeight(p.x,p.y));dummy.scale.setScalar(.8+(i%4)*.09);dummy.rotation.set(0,0,i*2.4);dummy.updateMatrix();flowers.setMatrixAt(index,dummy.matrix)
            color.set(['#f6e1a0','#f3eee4','#e5a6ba'][i%3]);flowers.setColorAt(index++,color)
        }
        flowers.name='Pocket parks / flower borders';flowers.userData.cameraCollision=false;flowers.computeBoundingSphere();this.container.add(flowers);this.meshes.push(flowers);this.materials.push(flowerMaterial)
    }
    dispose(){if(this.disposed)return;this.disposed=true;this.time.off('tick.meadowParkWater');this.props.dispose();for(const mesh of this.meshes){mesh.removeFromParent();mesh.geometry.dispose();if(mesh.isInstancedMesh)mesh.dispose()}for(const m of this.materials)m.dispose()}
}
