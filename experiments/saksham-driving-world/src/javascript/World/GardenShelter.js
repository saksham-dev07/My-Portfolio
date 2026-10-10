import * as THREE from 'three'
import { modelLoader } from '../Utils/ModelLoader.js'
import { garden } from './GardenLayout.js'
import { surfaceHeight } from './LandscapeLayout.js'
import { groundLayer } from './GroundLayers.js'

// The Blender shelter is the garden's single landmark. Its open sides leave
// sightlines to the campus; the garden requires no new frame-by-frame animation.
export default class GardenShelter {
    constructor({container,objects,camera,time}) {
        this.state='idle'
        const s=garden.shelter,sphere=new THREE.Sphere(new THREE.Vector3(garden.x,garden.y,2),16)
        const frustum=new THREE.Frustum(),matrix=new THREE.Matrix4()
        let nextCheck=0
        time.on('tick.gardenShelter',()=>{
            if(this.state!=='idle' || time.elapsed<nextCheck) return
            nextCheck=time.elapsed+500
            camera.instance.updateMatrixWorld()
            matrix.multiplyMatrices(camera.instance.projectionMatrix,camera.instance.matrixWorldInverse)
            frustum.setFromProjectionMatrix(matrix)
            if(camera.view!=='top' && !frustum.intersectsSphere(sphere)) return
            this.state='loading'
            modelLoader.load('./saksham/models/garden-shelter.glb',gltf=>{
                const material=new THREE.MeshMatcapMaterial({matcap:objects.materials.shades.items.white.uniforms.matcap.value,vertexColors:true})
                const color=new THREE.Color()
                gltf.scene.traverse(node=>{
                    if(!node.isMesh) return
                    const colors=node.geometry.getAttribute('color')
                    if(colors) for(let i=0;i<colors.count;i++) {
                        color.fromBufferAttribute(colors,i).convertLinearToSRGB();colors.setXYZ(i,color.r,color.g,color.b)
                    }
                    node.material.dispose();node.material=material
                })
                gltf.scene.rotation.x=Math.PI/2
                gltf.scene.position.set(s.x,s.y,surfaceHeight(s.x,s.y))
                gltf.scene.name='Garden study shelter / Blender timber and limestone'
                this.model=gltf.scene;container.add(this.model)
                // The terrace is solid as well as the posts: never pass through it.
                const ground=surfaceHeight(s.x,s.y),solids=[]
                const solid=new THREE.Object3D();solid.name='box'
                solid.position.set(s.x,s.y,ground+.1175);solid.scale.set(7.2,5,.235);solids.push(solid)
                for(const ix of [-1,1]) for(const iy of [-1,1]) {
                    const post=new THREE.Object3D();post.name='box'
                    post.position.set(s.x+ix*2.77,s.y+iy*1.8,ground+1.82)
                    post.scale.set(.5,.45,3.2);solids.push(post)
                }
                const seat=new THREE.Object3D();seat.name='box'
                seat.position.set(s.x,s.y+1.62,ground+.73);seat.scale.set(5.24,.63,.7);solids.push(seat)
                this.collision=objects.physics.addObjectFromThree({meshes:solids,offset:new THREE.Vector3(),rotation:new THREE.Euler(),mass:0,sleep:true})
                const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64
                const context=canvas.getContext('2d'),gradient=context.createRadialGradient(32,32,12,32,32,31)
                gradient.addColorStop(0,'rgba(34,30,48,.65)');gradient.addColorStop(1,'rgba(34,30,48,0)')
                context.fillStyle=gradient;context.fillRect(0,0,64,64)
                const shadow=new THREE.Mesh(new THREE.PlaneGeometry(9,7),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,opacity:.3,depthWrite:false}))
                shadow.position.set(s.x,s.y,surfaceHeight(s.x,s.y));shadow.name='Shelter terrace contact shadow'
                groundLayer(shadow,'shadow');container.add(shadow)
                this.state='ready';time.off('tick.gardenShelter')
            },undefined,()=>{this.state='error';time.off('tick.gardenShelter')})
        })
    }
}
