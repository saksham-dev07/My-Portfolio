import * as THREE from 'three'
import { modelLoader } from '../Utils/ModelLoader.js'
import { flowerPlacements } from './EnvironmentLayout.js'
import { garden } from './GardenLayout.js'
import { surfaceHeight } from './LandscapeLayout.js'

export const pondRimInset = .04

// One small Blender kit supplies every tree, including the landmark gardens.
// Four instanced batches hold the trees/flowers; the pond is one garden landmark.
export default class BotanicalDressing {
    constructor({container,objects,camera,time,trees,props,onReady=()=>{}}) {
        this.state='idle'
        this.flowers=flowerPlacements(trees,props)
        this.trees=trees.map((p,index)=>({...p,kind:p.kind ?? (index%3===1 ? 'tree-copper' : 'tree-broadleaf'),scale:p.treeScale ?? p.scale}))
        this.motion={value:1};this.clock={value:0}
        const preference=window.matchMedia('(prefers-reduced-motion: reduce)')
        const sync=()=>{this.motion.value=preference.matches ? 0 : 1}
        sync();preference.addEventListener('change',sync)
        time.on('tick.botanicalBreeze',()=>{this.clock.value=time.elapsed*.001*this.motion.value})
        const frustum=new THREE.Frustum(),matrix=new THREE.Matrix4()
        const regions=[new THREE.Sphere(new THREE.Vector3(0,-26,3),53),new THREE.Sphere(new THREE.Vector3(2,-99,3),48),new THREE.Sphere(new THREE.Vector3(105,-8,3),62),new THREE.Sphere(new THREE.Vector3(-55,-100,3),32),new THREE.Sphere(new THREE.Vector3(105,-130,3),42)]
        let nextCheck=0
        time.on('tick.botanicalLoad',()=>{
            if(this.state!=='idle' || time.elapsed<nextCheck) return
            nextCheck=time.elapsed+500
            camera.instance.updateMatrixWorld()
            matrix.multiplyMatrices(camera.instance.projectionMatrix,camera.instance.matrixWorldInverse)
            frustum.setFromProjectionMatrix(matrix)
            if(camera.view!=='top' && !regions.some(region=>frustum.intersectsSphere(region))) return
            this.state='loading'
            modelLoader.load('./saksham/models/botanical-kit.glb',gltf=>{
                const material=new THREE.MeshMatcapMaterial({matcap:objects.materials.shades.items.white.uniforms.matcap.value,vertexColors:true})
                const wind=material.clone()
                wind.onBeforeCompile=shader=>{
                    shader.uniforms.uBotanicalTime=this.clock;shader.uniforms.uBotanicalMotion=this.motion
                    shader.vertexShader='uniform float uBotanicalTime; uniform float uBotanicalMotion;\n'+shader.vertexShader
                    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
                        float flex=smoothstep(.2,4.8,position.z);
                        transformed.x+=sin(uBotanicalTime*.65+instanceMatrix[3].x*.19+instanceMatrix[3].y*.1)*flex*.07*uBotanicalMotion;`)
                }
                wind.customProgramCacheKey=()=> 'botanical-kit-breeze-v1'
                const conversion=new THREE.Matrix4().makeRotationX(Math.PI/2),dummy=new THREE.Object3D(),color=new THREE.Color()
                this.instances=[]
                gltf.scene.updateMatrixWorld(true)
                gltf.scene.traverse(node=>{
                    if(!node.isMesh) return
                    const geometry=node.geometry.clone().applyMatrix4(conversion.clone().multiply(node.matrixWorld))
                    const colors=geometry.getAttribute('color')
                    if(colors) for(let i=0;i<colors.count;i++) {
                        color.fromBufferAttribute(colors,i).convertLinearToSRGB();colors.setXYZ(i,color.r,color.g,color.b)
                    }
                    if(node.name==='pond-basin') {
                        const p=garden.pond,basin=new THREE.Mesh(geometry,material)
                        // Bury the sole rather than leaving a second surface
                        // coplanar with the lawn at grazing camera angles.
                        basin.position.set(p.x,p.y,surfaceHeight(p.x,p.y)-pondRimInset);basin.name='Garden pond / chamfered Blender stone rim'
                        container.add(basin);this.basin=basin
                        this.setPond({container,physics:objects.physics})
                        return
                    }
                    const placements=[...this.trees,...this.flowers].filter(p=>p.kind===node.name)
                    if(!placements.length) {geometry.dispose();return}
                    const mesh=new THREE.InstancedMesh(geometry,wind,placements.length)
                    mesh.name=`Blender botanical kit / ${node.name}`
                    placements.forEach((p,index)=>{
                        dummy.position.set(p.x,p.y,p.z-(p.kind.startsWith('flowers') ? .015 : 0))
                        dummy.rotation.set(0,0,p.angle);dummy.scale.setScalar(p.scale);dummy.updateMatrix()
                        mesh.setMatrixAt(index,dummy.matrix)
                    })
                    mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.15
                    container.add(mesh);this.instances.push(mesh)
                })
                this.setTreeCollisions(objects.physics)
                gltf.scene.traverse(node=>{if(node.isMesh){node.geometry.dispose();node.material.dispose()}})
                this.state='ready';time.off('tick.botanicalLoad');onReady(this.trees)
            },undefined,()=>{this.state='error';time.off('tick.botanicalLoad');time.off('tick.botanicalBreeze')})
        })
    }

    setTreeCollisions(physics) {
        // Proxies appear with their rendered trees, never before a delayed or
        // failed asset load. Broad crowns stay soft; only the visible stem is solid.
        this.treeTrunks=this.trees.map(p=>{
            const trunk=new THREE.Object3D();trunk.name='box'
            trunk.position.set(p.x,p.y,p.z+1.1*p.scale)
            trunk.rotation.z=p.angle;trunk.scale.set(.5*p.scale,.5*p.scale,2.2*p.scale)
            return trunk
        })
        if(this.treeTrunks.length) this.treeCollision=physics.addObjectFromThree({meshes:this.treeTrunks,offset:new THREE.Vector3(),rotation:new THREE.Euler(),mass:0,sleep:true})
    }

    setPond({container,physics}) {
        const p=garden.pond,ground=surfaceHeight(p.x,p.y)
        const water=new THREE.Mesh(new THREE.CircleGeometry(1,64).scale(2.78,1.68,1),new THREE.ShaderMaterial({
            fog:true,
            uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{
                uTime:this.clock,uDeep:{value:new THREE.Color('#276b69').convertLinearToSRGB()},uShore:{value:new THREE.Color('#84c9af').convertLinearToSRGB()},
            }]),
            vertexShader:`varying vec2 vPondUv;
                #include <fog_pars_vertex>
                void main(){vPondUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mvPosition;
                    #include <fog_vertex>
                }`,
            fragmentShader:`uniform float uTime;uniform vec3 uDeep;uniform vec3 uShore;varying vec2 vPondUv;
                #include <fog_pars_fragment>
                void main(){
                    float r=length(vPondUv-.5)*2.0;
                    float shore=smoothstep(.42,1.0,r);
                    float ripple=sin(r*28.0-uTime*.7)*.018;
                    float light=pow(max(0.0,1.0-abs(vPondUv.x+vPondUv.y-.85)*6.0),5.0)*.08;
                    gl_FragColor=vec4(mix(uDeep,uShore,shore*.7)+vec3(ripple+light),1.0);
                    #include <fog_fragment>
                }`,
        }))
        // Keep the same live uniform after UniformsUtils clones the fog block.
        water.material.uniforms.uTime=this.clock
        water.position.set(p.x,p.y,ground+.14);water.name='Garden pond / quiet teal ripples'
        container.add(water);this.water=water
        const solids=[]
        for(let i=0;i<24;i++) {
            const angle=(i+.5)*Math.PI*2/24,rx=3,ry=1.9
            const solid=new THREE.Object3D();solid.name='box'
            solid.position.set(p.x+Math.cos(angle)*rx,p.y+Math.sin(angle)*ry,ground+.12-pondRimInset)
            solid.rotation.z=Math.atan2(Math.cos(angle)*ry,-Math.sin(angle)*rx)
            solid.scale.set(Math.hypot(Math.sin(angle)*rx,Math.cos(angle)*ry)*Math.PI*2/24,.36,.24)
            solids.push(solid)
        }
        this.pondCollision=physics.addObjectFromThree({meshes:solids,offset:new THREE.Vector3(),rotation:new THREE.Euler(),mass:0,sleep:true})
    }
}
