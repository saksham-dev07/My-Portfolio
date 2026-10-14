import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import RefinedPropBatch, { refinedGeometry } from './RefinedProps.js'
import { activityPropCollision } from './ActivityProps.js'
import { scenicKitUrl, playgroundUpgrades, ridgeArch, roadsideBenches, roadsideDetails } from './ScenicRouteLayout.js'
import { surfaceHeight } from './LandscapeLayout.js'
import { groundLayer } from './GroundLayers.js'

export function puzzleCourtTexture(touch=false,page=globalThis.document) {
    const canvas=page.createElement('canvas');canvas.width=1024;canvas.height=384
    const ctx=canvas.getContext('2d')
    ctx.fillStyle='#18392f';ctx.fillRect(0,0,1024,384)
    ctx.strokeStyle='#c9aa70';ctx.lineWidth=5;ctx.strokeRect(12,12,1000,360)
    ctx.fillStyle='#e6d9bd';ctx.font='800 52px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle'
    ctx.fillText('THE HIDDEN CODE',512,78)
    const directions=[0,0,Math.PI,Math.PI,-Math.PI/2,Math.PI/2,-Math.PI/2,Math.PI/2]
    const count=touch?8:10,width=75,start=512-(count-1)*width/2
    for(let i=0;i<count;i++) {
        const x=start+i*width;ctx.strokeStyle='#63885a';ctx.lineWidth=2;ctx.strokeRect(x-29,149,58,64)
        ctx.fillStyle='#dfbc7b'
        if(i<8) {
            ctx.save();ctx.translate(x,181);ctx.rotate(directions[i]);ctx.beginPath()
            ctx.moveTo(0,-20);ctx.lineTo(19,-1);ctx.lineTo(7,-1);ctx.lineTo(7,20);ctx.lineTo(-7,20);ctx.lineTo(-7,-1);ctx.lineTo(-19,-1);ctx.closePath();ctx.fill();ctx.restore()
        } else {ctx.font='800 34px system-ui, sans-serif';ctx.fillText(i===8?'B':'A',x,182)}
    }
    ctx.fillStyle='#d6d2bb';ctx.font='600 25px system-ui, sans-serif'
    ctx.fillText(touch?'SWIPE THE SEQUENCE TO DISCOVER A SURPRISE':'TRY THE ARROW KEYS, THEN B AND A',512,294)
    const texture=new THREE.CanvasTexture(canvas);texture.anisotropy=16
    texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter
    return texture
}

export default class ScenicRoutes {
    constructor({container,objects,camera,time,easterEggs,config,loader}) {
        Object.assign(this,{container,objects,easterEggs,config});this.bodies=[];this.owned=[];this.disposed=false
        const shared={objects,camera,time,container,loader}
        this.models=new RefinedPropBatch({...shared,name:'scenicRouteModels',url:scenicKitUrl,
            placements:[...playgroundUpgrades,ridgeArch,...roadsideDetails],
            onReady:(batch,scene)=>{
                for(const p of playgroundUpgrades.filter(p=>p.kind.startsWith('ramp'))) {
                    const profile=scene.getObjectByName(p.kind).userData.design.rampProfile
                    this.bodies.push(activityPropCollision({...p,scale:1},objects.physics,profile).body)
                }
                this.setArchFootings(batch.material)
                this.setLemon(scene,batch.material)
            },
        })
        this.benches=new RefinedPropBatch({...shared,name:'roadsideRestBenches',placements:roadsideBenches.map(p=>({...p,z:surfaceHeight(p.x,p.y)}))})
        this.setRestPaving()
        this.setPuzzleCourt()
    }

    setArchFootings(material) {
        const parts=[],solids=[]
        for(const x of [-55,-43]) {
            const low=surfaceHeight(x,-80)-.04,height=ridgeArch.z-low
            const solid=new THREE.Object3D();solid.name='box';solid.position.set(x,-80,low+height/2);solid.scale.set(1.38,1.88,height);solids.push(solid)
            // Short stone courses follow the two different ridge elevations.
            const rows=Math.max(1,Math.ceil(height/.4))
            for(let i=0;i<rows;i++) {
                const geometry=new THREE.BoxGeometry(1.38,1.88,height/rows-.012).toNonIndexed()
                geometry.translate(x,-80,low+(i+.5)*height/rows)
                const color=new THREE.Color(i%2?'#d9c8a7':'#e6d9bd').convertLinearToSRGB()
                const values=new Float32Array(geometry.attributes.position.count*3)
                for(let n=0;n<values.length;n+=3) values.set([color.r,color.g,color.b],n)
                geometry.setAttribute('color',new THREE.BufferAttribute(values,3));geometry.deleteAttribute('uv');parts.push(geometry)
            }
        }
        const mesh=new THREE.Mesh(mergeGeometries(parts),material);mesh.name='Ridge gateway / stepped stone foundations'
        parts.forEach(p=>p.dispose());this.container.add(mesh);this.owned.push(mesh)
        const body=this.objects.physics.addObjectFromThree({meshes:solids,offset:new THREE.Vector3(),rotation:new THREE.Euler(),mass:0,sleep:true})?.body
        if(body)this.bodies.push(body)
    }

    setLemon(scene,material) {
        const original=this.easterEggs?.konamiCode?.lemon?.container
        if(!original)return
        const {geometry}=refinedGeometry(scene,'lemon')
        geometry.translate(0,0,-.43)
        geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(original.rotation).invert())
        for(const mesh of original.children)mesh.visible=false
        const fruit=new THREE.Mesh(geometry,material);fruit.name='Hidden code / sculpted lemon and leaf'
        original.add(fruit);this.owned.push(fruit)
    }

    setPuzzleCourt() {
        const code=this.easterEggs?.konamiCode
        if(!code)return
        code.label.visible=false
        this.puzzleTexture=puzzleCourtTexture(this.config.touch)
        this.puzzleMaterial=new THREE.MeshBasicMaterial({map:this.puzzleTexture,toneMapped:false})
        const geometry=new THREE.PlaneGeometry(9.3,3.5,32,12),positions=geometry.attributes.position
        for(let i=0;i<positions.count;i++)positions.setZ(i,surfaceHeight(-54.6-positions.getX(i),-100-positions.getY(i)))
        const court=new THREE.Mesh(geometry,this.puzzleMaterial)
        court.name='Hidden code / readable puzzle court';court.position.set(-54.6,-100,.018);court.rotation.z=Math.PI
        this.container.add(court);groundLayer(court,'backdrop');this.owned.push(court)
    }

    setRestPaving() {
        const parts=[],color=new THREE.Color('#d9c8a7')
        const tile=(x,y,w,h)=>{
            const geometry=new THREE.PlaneGeometry(w,h)
            geometry.translate(x,y,surfaceHeight(x,y))
            const values=new Float32Array(geometry.attributes.position.count*3)
            for(let i=0;i<values.length;i+=3)values.set([color.r,color.g,color.b],i)
            geometry.setAttribute('color',new THREE.BufferAttribute(values,3));parts.push(geometry)
        }
        for(const p of roadsideBenches) {
            const w=p.angle===Math.PI?3.2:1.8,h=p.angle===Math.PI?1.8:3.2
            // Small inset paving joints, rather than a featureless slab.
            for(let i=0;i<3;i++)for(let j=0;j<3;j++)tile(p.x+(i-1)*w/3,p.y+(j-1)*h/3,w/3-.035,h/3-.035)
        }
        for(const p of roadsideDetails.filter(p=>p.kind==='bridge'))for(const dy of [-1.1,1.3])tile(p.x,p.y+dy,1.7,.28)
        const material=new THREE.MeshBasicMaterial({vertexColors:true})
        const paving=new THREE.Mesh(mergeGeometries(parts),material);paving.name='Roadside rest bays / jointed sandstone'
        parts.forEach(p=>p.dispose());this.container.add(paving);groundLayer(paving,'surface');this.owned.push(paving);this.pavingMaterial=material
    }

    dispose() {
        if(this.disposed)return;this.disposed=true
        this.models.dispose();this.benches.dispose()
        for(const body of this.bodies)body.world?.removeBody(body)
        for(const mesh of this.owned){mesh.removeFromParent();mesh.geometry.dispose()}
        this.puzzleMaterial?.dispose();this.puzzleTexture?.dispose();this.pavingMaterial?.dispose()
    }
}
