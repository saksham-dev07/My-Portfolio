import * as THREE from 'three'
import { labelTexture } from '../StudioLabels.js'

// Quiet wayfinding replaces duplicate tile lanes, decorative pools and
// uncollidable trees. Landscape owns the terrain, roads and roadside groves.
export default class Scenery {
    constructor() {
        this.container = new THREE.Group()
        this.container.name = 'Field Notes · district wayfinding'
        const label = (text,x,y,width,color) => {
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width,2),new THREE.MeshBasicMaterial({color,alphaMap:labelTexture([text],1024,128),transparent:true,depthWrite:false}))
            mesh.position.set(x,y,.028)
            this.container.add(mesh)
        }
        label('01 / THE RESEARCH PROMENADE',105,-9,31,'#f1d5b3')
        label('02 / FIELD NOTES',2,-128,22,'#d5dded')
        const plazaMaterial=new THREE.MeshBasicMaterial({color:'#747998'})
        plazaMaterial.color.convertLinearToSRGB()
        const plaza=new THREE.Mesh(new THREE.CircleGeometry(3.8,64),plazaMaterial)
        plaza.position.set(0,-30,.017)
        this.container.add(plaza)
        const hub = new THREE.Mesh(new THREE.RingGeometry(3.8,3.95,64),new THREE.MeshBasicMaterial({color:'#c3cdf7',transparent:true,opacity:.4,depthWrite:false}))
        hub.position.set(0,-30,.023)
        this.container.add(hub)
    }
}
