import * as THREE from 'three'
import { labelTexture } from '../StudioLabels.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { projectSites, researchTerraces, surfaceHeight } from './LandscapeLayout.js'
import { groundLayer } from './GroundLayers.js'
import { terrainPalette } from './TerrainPalette.js'

// Quiet wayfinding replaces duplicate tile lanes, decorative pools and
// uncollidable trees. Landscape owns the terrain, roads and roadside groves.
export default class Scenery {
    constructor() {
        this.container = new THREE.Group()
        this.container.name = 'Field Notes · district wayfinding'
        const label = (text,x,y,width,color) => {
            const geometry = new THREE.PlaneGeometry(width,2,Math.ceil(width/2),2)
            const vertices = geometry.attributes.position
            for(let i=0;i<vertices.count;i++) vertices.setZ(i,surfaceHeight(x+vertices.getX(i),y+vertices.getY(i)))
            const mesh = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,alphaMap:labelTexture([text],1024,128),transparent:true,depthWrite:false}))
            mesh.position.set(x,y,.028)
            this.container.add(mesh)
            groundLayer(mesh,'label')
        }
        // Painted forecourts organize the twelve boards into three chapters.
        // They add three merged draws and leave every road and entry pad clear.
        researchTerraces.forEach((terrace,row)=>{
            label(terrace.title,105,terrace.y-19,34,terrace.color)
            const geometries=projectSites.slice(row*4,row*4+4).map(site=>{
                const shape=new THREE.Shape()
                const w=11,h=9.5,r=1.4
                shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r)
                shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h)
                shape.lineTo(-w+r,h);shape.quadraticCurveTo(-w,h,-w,h-r)
                shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h)
                return new THREE.ShapeGeometry(shape,5).translate(site.x,site.y-1,0)
            })
            const material=new THREE.MeshBasicMaterial({color:terrace.color,transparent:true,opacity:.11,depthWrite:false})
            const forecourts=new THREE.Mesh(mergeGeometries(geometries),material)
            geometries.forEach(geometry=>geometry.dispose())
            forecourts.name=terrace.title+' / painted forecourts'
            this.container.add(forecourts)
            groundLayer(forecourts,'accent')
        })
        label('02 / FIELD NOTES',2,-128,22,'#d5dded')
        const plazaMaterial=new THREE.MeshBasicMaterial({color:terrainPalette.foothill})
        plazaMaterial.color.convertLinearToSRGB()
        const plaza=new THREE.Mesh(new THREE.CircleGeometry(3.8,64),plazaMaterial)
        plaza.position.set(0,-30,.017)
        this.container.add(plaza)
        const hub = new THREE.Mesh(new THREE.RingGeometry(3.8,3.95,64),new THREE.MeshBasicMaterial({color:'#c6c9a8',transparent:true,opacity:.4,depthWrite:false}))
        hub.position.set(0,-30,.023)
        this.container.add(hub)
    }
}
