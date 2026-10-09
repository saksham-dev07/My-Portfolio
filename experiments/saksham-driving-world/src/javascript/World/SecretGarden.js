import * as THREE from 'three'
import { labelTexture } from '../StudioLabels.js'
import { groundLayer } from './GroundLayers.js'
import { surfaceHeight } from './LandscapeLayout.js'

export const secretGardenLocation=Object.freeze({x:-58,y:-60,halfExtent:2})

export class DiscoveryState {
    constructor() {this.count=0;this.availableAt=0}
    activate(now) {
        if(now<this.availableAt) return false
        this.count++;this.availableAt=now+900
        return true
    }
}

export function rangoliGeometry() {
    const positions=[],colors=[],palette=['#e8a35d','#f3ead4','#77a978']
    const color=new THREE.Color()
    const petal=[[.42,-.1],[.88,-.28],[1.56,0],[.88,.28],[.42,.1]]
    for(let i=0;i<12;i++) {
        const angle=i*Math.PI/6,c=Math.cos(angle),s=Math.sin(angle)
        const points=petal.map(([x,y])=>[x*c-y*s,x*s+y*c,0])
        color.set(palette[i%palette.length]).convertLinearToSRGB()
        for(let j=1;j<points.length-1;j++) for(const point of [points[0],points[j],points[j+1]]) {
            positions.push(...point);colors.push(color.r,color.g,color.b)
        }
    }
    const geometry=new THREE.BufferGeometry()
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3))
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3))
    geometry.computeVertexNormals()
    return geometry
}

// Reuses the original mystery area. The reward happens beside the visitor,
// rather than silently changing an unrelated model at the distant crossroads.
export default class SecretGarden {
    constructor({area,label,container,time}) {
        this.area=area;this.label=label;this.time=time;this.state=new DiscoveryState()
        const {x,y}=secretGardenLocation,z=surfaceHeight(x,y)
        this.preference=window.matchMedia('(prefers-reduced-motion: reduce)')
        this.playing=false
        label.geometry.dispose();label.geometry=new THREE.PlaneGeometry(4,.9)
        this.setLabel('DISCOVER')
        groundLayer(label,'label')
        this.rangoli=new THREE.Mesh(rangoliGeometry(),new THREE.MeshBasicMaterial({vertexColors:true}))
        this.rangoli.name='Secret clearing / twelve-petal rangoli'
        this.rangoli.position.set(x,y,z);this.rangoli.visible=false
        container.add(this.rangoli);groundLayer(this.rangoli,'accent')
        this.beacon=new THREE.Group();this.beacon.name='Secret clearing / curiosity seed'
        this.beacon.position.set(x,y,z);this.beacon.visible=false;container.add(this.beacon)
        const base=new THREE.Mesh(new THREE.CylinderGeometry(.28,.4,.15,8),new THREE.MeshBasicMaterial({color:new THREE.Color('#f3ead4').convertLinearToSRGB()}))
        base.rotation.x=Math.PI/2;base.position.z=.13;this.beacon.add(base)
        this.seed=new THREE.Mesh(new THREE.IcosahedronGeometry(.28,0),new THREE.MeshBasicMaterial({color:new THREE.Color('#f4bf68').convertLinearToSRGB()}))
        this.seed.position.z=1.1;this.beacon.add(this.seed)
        this.particles=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.055,0),new THREE.MeshBasicMaterial(),24)
        this.particles.name='Secret clearing / finite petal burst';this.particles.visible=false
        this.particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);container.add(this.particles)
        const color=new THREE.Color(),palette=['#e8a35d','#f3ead4','#77a978']
        for(let i=0;i<24;i++) this.particles.setColorAt(i,color.set(palette[i%3]).convertLinearToSRGB())
        this.dummy=new THREE.Object3D()
        area.on('interact',()=>this.reveal())
        area.on('in',()=>{if(!this.state.count && area.containsCar()) this.reveal()})
        window.addEventListener('drive-secret-replay',()=>this.reveal())
        time.on('tick.secretGarden',()=>this.tick())
    }

    setLabel(text) {
        if(this.ownedTexture) this.ownedTexture.dispose()
        this.ownedTexture=labelTexture([text],512,128)
        this.ownedTexture.generateMipmaps=true;this.ownedTexture.minFilter=THREE.LinearMipmapLinearFilter
        this.label.material.alphaMap=this.ownedTexture;this.label.material.needsUpdate=true
    }

    reveal() {
        if(!this.state.activate(this.time.elapsed)) return false
        this.setLabel('BLOOM AGAIN')
        // The raised ENTER prompt projects across the near edge of the pad.
        // Place the permanent label farther north and left of its framing tree.
        this.label.position.x=secretGardenLocation.x-5
        this.label.position.y=secretGardenLocation.y+4.5;this.label.updateMatrix()
        this.rangoli.visible=true;this.beacon.visible=true
        this.startedAt=this.time.elapsed;this.playing=!this.preference.matches
        this.rangoli.scale.setScalar(this.playing ? .15 : 1)
        this.particles.visible=this.playing
        this.seed.position.z=1.1
        if(this.playing) this.tick()
        window.dispatchEvent(new CustomEvent('drive-discovery',{detail:{
            title:this.state.count===1 ? 'Hidden garden discovered.' : 'The garden blooms again.',
            message:'A little color for the curious. Rangoli, reimagined.',
            count:this.state.count,
        }}))
        return true
    }

    tick() {
        // Hover may have raised the fence before the car arrived. Detect the
        // first real visit independently of that shared hover/entry transition.
        if(!this.state.count && this.area.containsCar()) this.reveal()
        if(!this.playing) return
        const elapsed=(this.time.elapsed-this.startedAt)*.001
        if(this.preference.matches || elapsed>=1.6) {
            this.playing=false;this.particles.visible=false;this.rangoli.scale.setScalar(1);this.seed.position.z=1.1
            return
        }
        const t=Math.min(1,elapsed/.75)
        this.rangoli.scale.setScalar(.15+.85*(1-(1-t)**3))
        this.seed.position.z=1.1+Math.sin(Math.min(1,elapsed/1.6)*Math.PI)*.38
        this.seed.rotation.z=elapsed*.5+this.state.count*Math.PI/6
        const {x,y}=secretGardenLocation,z=surfaceHeight(x,y)
        for(let i=0;i<24;i++) {
            const angle=i*Math.PI/12+this.state.count*.27,speed=.42+(i%4)*.13
            this.dummy.position.set(x+Math.cos(angle)*elapsed*speed,y+Math.sin(angle)*elapsed*speed,z+1.1+elapsed*(1.05+(i%3)*.2)-1.55*elapsed*elapsed)
            this.dummy.rotation.set(elapsed+i,elapsed*.5,angle)
            this.dummy.scale.setScalar(Math.max(0,1-elapsed/1.6));this.dummy.updateMatrix()
            this.particles.setMatrixAt(i,this.dummy.matrix)
        }
        this.particles.instanceMatrix.needsUpdate=true
        this.particles.computeBoundingSphere()
    }
}
