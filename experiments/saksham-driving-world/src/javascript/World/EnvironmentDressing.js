import * as THREE from 'three'
import { modelLoader } from '../Utils/ModelLoader.js'
import { dressingPlacements } from './EnvironmentLayout.js'
import { surfaceHeight } from './LandscapeLayout.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { groundLayer } from './GroundLayers.js'

export default class EnvironmentDressing {
    constructor({ container, objects, camera, time, trees }) {
        this.container=container
        this.placements=dressingPlacements(trees)
        this.state='idle'
        let nextCheck=0
        const frustum=new THREE.Frustum(),matrix=new THREE.Matrix4()
        const regions=[new THREE.Sphere(new THREE.Vector3(107,-48,3),47),new THREE.Sphere(new THREE.Vector3(-59,-95,3),35),new THREE.Sphere(new THREE.Vector3(107,-124,3),40)]
        time.on('tick.environmentDressing',()=>{
            if(this.state!=='idle' || time.elapsed<nextCheck) return
            nextCheck=time.elapsed+500
            camera.instance.updateMatrixWorld()
            matrix.multiplyMatrices(camera.instance.projectionMatrix,camera.instance.matrixWorldInverse)
            frustum.setFromProjectionMatrix(matrix)
            if(camera.view!=='top' && !regions.some(region=>frustum.intersectsSphere(region))) return
            this.state='loading'
            modelLoader.load('./saksham/models/environment-kit.glb',gltf=>{
                const material=new THREE.MeshMatcapMaterial({matcap:objects.materials.shades.items.white.uniforms.matcap.value,vertexColors:true})
                gltf.scene.updateMatrixWorld(true)
                const dummy=new THREE.Object3D(),conversion=new THREE.Matrix4().makeRotationX(Math.PI/2),solids=[]
                this.instances=[]
                gltf.scene.traverse(node=>{
                    if(!node.isMesh) return
                    const geometry=node.geometry.clone().applyMatrix4(conversion.clone().multiply(node.matrixWorld))
                    const colors=geometry.getAttribute('color'),color=new THREE.Color()
                    if(colors) for(let i=0;i<colors.count;i++) {
                        color.fromBufferAttribute(colors,i).convertLinearToSRGB()
                        colors.setXYZ(i,color.r,color.g,color.b)
                    }
                    const placements=this.placements.filter(p=>p.kind===node.name)
                    if(!placements.length) {geometry.dispose();return}
                    const mesh=new THREE.InstancedMesh(geometry,material,placements.length)
                    mesh.name=`Blender field kit / ${node.name}`
                    geometry.computeBoundingBox()
                    const size=geometry.boundingBox.getSize(new THREE.Vector3())
                    placements.forEach((p,index)=>{
                        const rock=p.kind.startsWith('rock')
                        const r=p.radius*(rock ? .65 : .4)
                        const base=Math.min(p.z,...[[r,0],[-r,0],[0,r],[0,-r]].map(([dx,dy])=>surfaceHeight(p.x+dx,p.y+dy)))-(rock ? .1 : .025)*p.scale
                        dummy.position.set(p.x,p.y,base)
                        dummy.rotation.set(0,0,p.angle);dummy.scale.setScalar(p.scale);dummy.updateMatrix()
                        mesh.setMatrixAt(index,dummy.matrix)
                        if(rock) {
                            const box=new THREE.Object3D();box.name='box'
                            box.position.set(p.x,p.y,base+size.z*p.scale*.4)
                            box.rotation.z=p.angle;box.scale.set(size.x*p.scale*.72,size.y*p.scale*.72,size.z*p.scale*.8)
                            solids.push(box)
                        }
                    })
                    mesh.computeBoundingSphere();container.add(mesh);this.instances.push(mesh)
                })
                if(solids.length) this.collision=objects.physics.addObjectFromThree({meshes:solids,offset:new THREE.Vector3(),rotation:new THREE.Euler(),mass:0,sleep:true})
                this.setContactShadows(container,this.readyTrees || [])
                gltf.scene.traverse(node=>{if(node.isMesh){node.geometry.dispose();node.material.dispose()}})
                this.state='ready';time.off('tick.environmentDressing')
            },undefined,()=>{this.state='error';time.off('tick.environmentDressing')})
        })
    }

    setTreeReady(trees) {
        this.readyTrees=trees
        if(this.state==='ready') this.setContactShadows(this.container,trees)
    }

    setContactShadows(container,trees) {
        if(this.shadow) {
            container.remove(this.shadow)
            this.shadow.geometry.dispose()
            this.shadow.material.map.dispose()
            this.shadow.material.dispose()
            this.shadow=null
        }
        const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64
        const context=canvas.getContext('2d'),gradient=context.createRadialGradient(32,32,3,32,32,31)
        gradient.addColorStop(0,'rgba(34,30,48,.7)');gradient.addColorStop(.5,'rgba(34,30,48,.3)');gradient.addColorStop(1,'rgba(34,30,48,0)')
        context.fillStyle=gradient;context.fillRect(0,0,64,64)
        const texture=new THREE.CanvasTexture(canvas)
        const geometries=[...trees,...this.placements.filter(p=>p.kind.startsWith('rock'))].map(p=>{
            const r=p.radius*1.3,geometry=new THREE.PlaneGeometry(r*2,r*2,8,8),positions=geometry.attributes.position
            for(let i=0;i<positions.count;i++) {
                const x=positions.getX(i)+p.x,y=positions.getY(i)+p.y
                positions.setXYZ(i,x,y,surfaceHeight(x,y))
            }
            return geometry
        })
        if(!geometries.length) {texture.dispose();return}
        const shadow=new THREE.Mesh(mergeGeometries(geometries),new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.3,depthWrite:false}))
        geometries.forEach(g=>g.dispose())
        shadow.name='Merged terrain-conforming grove and outcrop contact shadows'
        groundLayer(shadow,'shadow');container.add(shadow);this.shadow=shadow
    }
}
