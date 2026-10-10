import * as THREE from 'three'
import { modelLoader } from '../Utils/ModelLoader.js'
import { surfaceHeight } from './LandscapeLayout.js'
import { groundLayer } from './GroundLayers.js'

// Authored in Blender. Two solid feet sit outside the research road; the open
// portal remains drivable. Artwork loads only when the approach is visible.
export const researchGateway = { x: 37, y: -38, halfOpening: 4.34, footOffset: 4.8 }

export default class ResearchGateway {
    constructor({ container, physics, camera, time }) {
        this.state = 'idle'
        const { x, y } = researchGateway
        const sphere = new THREE.Sphere(new THREE.Vector3(x,y,3),8)
        const frustum = new THREE.Frustum(), matrix = new THREE.Matrix4()
        let nextCheck = 0
        const check = () => {
            if (this.state !== 'idle' || time.elapsed < nextCheck) return
            nextCheck = time.elapsed + 300
            camera.instance.updateMatrixWorld()
            matrix.multiplyMatrices(camera.instance.projectionMatrix,camera.instance.matrixWorldInverse)
            frustum.setFromProjectionMatrix(matrix)
            const car = physics.car.chassis.body.position
            if (camera.view !== 'top' && !frustum.intersectsSphere(sphere) && Math.hypot(car.x-x,car.y-y)>35) return
            this.state = 'loading'
            modelLoader.load('./saksham/models/research-gateway.glb', gltf => {
                const model = new THREE.Group()
                model.name = 'Research gateway / Blender limestone and copper'
                gltf.scene.rotation.x = Math.PI/2
                model.add(gltf.scene)
                model.rotation.z = Math.PI/2
                model.position.set(x,y,surfaceHeight(x,y))
                container.add(model)
                this.model = model
                const solids = []
                for (const side of [-1,1]) {
                    const footY = y+side*researchGateway.footOffset
                    const solid = new THREE.Object3D()
                    solid.name='box';solid.position.set(x,footY,2.7);solid.scale.set(1.9,1.55,5.4)
                    solids.push(solid)
                    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:'#302b45',transparent:true,opacity:.18,depthWrite:false}))
                    shadow.scale.set(1.4,1.2,1);shadow.position.set(x,footY,.02)
                    groundLayer(shadow,'shadow');container.add(shadow)
                }
                const beam = new THREE.Object3D()
                beam.name='box';beam.position.set(x,y,5.85);beam.scale.set(1.2,10.4,1)
                solids.push(beam)
                this.collision=physics.addObjectFromThree({meshes:solids,offset:new THREE.Vector3(),rotation:new THREE.Euler(),mass:0,sleep:true})
                this.state='ready'
                time.off('tick.researchGateway')
            }, undefined, () => { this.state='error';time.off('tick.researchGateway') })
        }
        time.on('tick.researchGateway',check)
    }
}
