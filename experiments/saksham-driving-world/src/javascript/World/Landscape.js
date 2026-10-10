import * as THREE from 'three'
import { landscapeGrid, surfaceHeight, roads, landscapeBounds, roadShoulder, landscapeSigns, researchTerraces, smooth } from './LandscapeLayout.js'
import { roadMaskPixels } from './RoadMask.js'
import { paintRoadMarkings, packRoadMask, roadPaintStyle } from './RoadMarkings.js'
import DirectionSigns from './Sections/DirectionSigns.js'
import ResearchGateway from './ResearchGateway.js'
import { grovePlacements, landmarkTreePlacements, flowerBeds } from './EnvironmentLayout.js'
import EnvironmentDressing from './EnvironmentDressing.js'
import { garden, gardenPaths, meadowPatches, meadowOutline } from './GardenLayout.js'
import GardenShelter from './GardenShelter.js'
import BotanicalDressing from './BotanicalDressing.js'
import { terrainPalette, terrainBlendWeights } from './TerrainPalette.js'

export default class Landscape {
    constructor({ objects, scene, camera, config, time, directionSignTemplate }) {
        this.container = new THREE.Group()
        this.container.name = 'Field Notes · sculpted valley'
        this.physics = objects.physics
        this.setTerrain()
        this.setRoads()
        this.clearOriginalTrees(objects)
        this.setGroves()
        this.dressing = new EnvironmentDressing({ container: this.container, objects, camera, time, trees: this.groves || [] })
        this.botanicals = new BotanicalDressing({container:this.container,objects,camera,time,trees:this.groves,props:this.dressing.placements,onReady:trees=>this.dressing.setTreeReady(trees)})
        this.garden = new GardenShelter({container:this.container,objects,camera,time})
        this.setSignalArch()
        this.gateway = new ResearchGateway({ container: this.container, physics: this.physics, camera, time })
        const signSolids=[]
        const signs=landscapeSigns.map(sign=>({...sign,z:surfaceHeight(sign.x,sign.y)}))
        this.directionSigns=new DirectionSigns(directionSignTemplate,this.container,signSolids,signs)
        if(signSolids.length) this.physics.addObjectFromThree({meshes:signSolids,offset:new THREE.Vector3(),rotation:new THREE.Euler(),mass:0,sleep:true})
        scene.fog = new THREE.FogExp2(terrainPalette.fog, .0032)
        scene.fog.color.convertLinearToSRGB()
        time.on('tick', () => { scene.fog.density = camera.view === 'top' ? 0 : .0032 })
        camera.instance.far = 300
        camera.instance.updateProjectionMatrix()
        if (config.debugWorld) {
            this.terrain.material.wireframe = true
            this.physics.models.container.visible = true
            this.container.add(new THREE.Box3Helper(new THREE.Box3(
                new THREE.Vector3(landscapeBounds.minX,landscapeBounds.minY,0),
                new THREE.Vector3(landscapeBounds.maxX,landscapeBounds.maxY,18)), '#ffd594'))
        }
    }

    setTerrain() {
        const grid = landscapeGrid(), vertices = [], indices = []
        for (let ix=0;ix<grid.nx;ix++) for (let iy=0;iy<grid.ny;iy++) vertices.push(grid.minX+ix*grid.step,grid.minY+iy*grid.step,grid.heights[ix][iy])
        for (let ix=0;ix<grid.nx-1;ix++) for (let iy=0;iy<grid.ny-1;iy++) {
            const a=ix*grid.ny+iy,b=(ix+1)*grid.ny+iy,c=a+1,d=b+1
            indices.push(a,b,c,b,d,c)
        }
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3))
        geometry.setIndex(indices)
        geometry.computeVertexNormals()
        const colors=[], vegetation=[], normal=geometry.attributes.normal, position=geometry.attributes.position
        const valley=new THREE.Color(terrainPalette.valley), foothill=new THREE.Color(terrainPalette.foothill)
        const stone=new THREE.Color(terrainPalette.stone), crest=new THREE.Color(terrainPalette.crest)
        const terraceColors=terrainPalette.terraces.map(color=>new THREE.Color(color))
        const light=new THREE.Vector3(-.5,-.35,1).normalize(), n=new THREE.Vector3()
        for(let i=0;i<position.count;i++) {
            const weights=terrainBlendWeights(position.getZ(i),normal.getZ(i))
            const color=valley.clone().lerp(foothill,weights.foothill).lerp(stone,weights.rock).lerp(crest,weights.crest)
            vegetation.push(weights.meadow)
            researchTerraces.forEach((terrace,index)=>{
                const edgeX=1-smooth(51,58,Math.abs(position.getX(i)-105))
                const edgeY=1-smooth(10,16,Math.abs(position.getY(i)-terrace.y))
                color.lerp(terraceColors[index],edgeX*edgeY*.18*weights.meadow)
            })
            const illumination=.78+Math.max(0,n.fromBufferAttribute(normal,i).dot(light))*.25
            const variation=1+.035*Math.sin(position.getX(i)*.19+position.getY(i)*.11)
            color.multiplyScalar(illumination*variation)
            // Original matcap/postprocess pipeline already writes display-space
            // colour. Match it rather than applying a second gamma conversion.
            color.convertLinearToSRGB()
            colors.push(color.r,color.g,color.b)
        }
        geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3))
        geometry.setAttribute('terrainVegetation',new THREE.Float32BufferAttribute(vegetation,1))
        // Baked vertex lighting keeps the cliff hierarchy without shadow maps.
        this.terrain=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true}))
        this.terrain.name='Shared Cannon heightfield terrain'
        this.container.add(this.terrain)
    }

    setRoads() {
        // Paint one union onto the actual heightfield. There are no separate road
        // triangles to cross, z-fight, float above slopes or leave wedge-shaped gaps.
        const {minX,maxX,minY,maxY}=landscapeBounds
        const canvas=document.createElement('canvas')
        canvas.width=2048;canvas.height=1440
        const context=canvas.getContext('2d')
        const scale=canvas.width/(maxX-minX)
        context.lineCap='round';context.lineJoin='round'
        const trace=road=>{
            context.beginPath()
            road.samples.forEach((p,i)=>context[i ? 'lineTo' : 'moveTo']((p.x-minX)*scale,(maxY-p.y)*scale))
            if(road.closed) context.closePath()
        }
        for(const road of roads) {
            trace(road)
            context.lineWidth=road.width*scale
            context.strokeStyle='#fff';context.stroke()
        }
        const image=context.getImageData(0,0,canvas.width,canvas.height)
        const coverage=new Uint8Array(canvas.width*canvas.height)
        for(let i=0;i<coverage.length;i++) coverage[i]=image.data[i*4+3]
        image.data.set(roadMaskPixels(coverage,canvas.width,canvas.height,roadShoulder*scale,.65*scale))
        // Street edges/dashes and rally graphics share this existing terrain
        // texture. Junction gaps are authored from the full road network.
        const paint=paintRoadMarkings(context,canvas.width,canvas.height)
        for(let i=0;i<coverage.length;i++) image.data[i*4+2]=Math.min(paint.white[i*4+3],image.data[i*4+1])
        context.putImageData(image,0,0)
        // Subpixel antialiasing removes the distance field's pixel stair steps
        // at close zoom without softening the authored road geometry.
        context.globalCompositeOperation='copy'
        context.filter='blur(0.6px)'
        context.drawImage(canvas,0,0)
        // Alpha stores terracotta kerbs, not transparency. Typed bytes preserve
        // RGB where alpha is zero; row flipping is explicit and portable.
        const filtered=context.getImageData(0,0,canvas.width,canvas.height).data
        this.roadMask=new THREE.DataTexture(packRoadMask(filtered,paint.terracotta,canvas.width,canvas.height),canvas.width,canvas.height)
        this.roadMask.needsUpdate=true
        this.roadMask.generateMipmaps=true
        this.roadMask.minFilter=THREE.LinearMipmapLinearFilter
        this.roadMask.magFilter=THREE.LinearFilter
        this.roadMask.anisotropy=4
        const asphalt=new THREE.Color('#454d4b').convertLinearToSRGB()
        const shoulder=new THREE.Color('#a7ac90').convertLinearToSRGB()
        const white=new THREE.Color(roadPaintStyle.white).convertLinearToSRGB()
        const kerb=new THREE.Color(roadPaintStyle.kerb).convertLinearToSRGB()
        const gardenMask=this.setGardenSurface()
        const grass=new THREE.Color('#50884d').convertLinearToSRGB()
        const path=new THREE.Color('#c4ae86').convertLinearToSRGB()
        const soil=new THREE.Color('#997955').convertLinearToSRGB()
        this.terrain.material.onBeforeCompile=shader=>{
            shader.uniforms.roadMask={value:this.roadMask}
            shader.uniforms.roadAsphalt={value:asphalt}
            shader.uniforms.roadShoulder={value:shoulder}
            shader.uniforms.roadWhite={value:white}
            shader.uniforms.roadKerb={value:kerb}
            shader.uniforms.gardenMask={value:gardenMask}
            shader.uniforms.gardenGrass={value:grass}
            shader.uniforms.gardenPath={value:path}
            shader.uniforms.gardenSoil={value:soil}
            shader.vertexShader='attribute float terrainVegetation; varying float vMeadowWeight; varying vec2 vRoadUv;\n'+shader.vertexShader
            shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
                vMeadowWeight=terrainVegetation;
                vRoadUv=(position.xy-vec2(${minX}.0,${minY}.0))/vec2(${maxX-minX}.0,${maxY-minY}.0);`)
            shader.fragmentShader='uniform sampler2D roadMask; uniform sampler2D gardenMask; uniform vec3 gardenGrass; uniform vec3 gardenPath; uniform vec3 gardenSoil; uniform vec3 roadAsphalt; uniform vec3 roadShoulder; uniform vec3 roadWhite; uniform vec3 roadKerb; varying float vMeadowWeight; varying vec2 vRoadUv;\n'+shader.fragmentShader
            shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
                vec4 coverage=texture2D(roadMask,vRoadUv);
                vec3 gardenPaint=texture2D(gardenMask,vRoadUv).rgb;
                float grassVariation=.97+.03*sin(vRoadUv.x*370.0+sin(vRoadUv.y*230.0));
                diffuseColor.rgb=mix(diffuseColor.rgb,gardenGrass*grassVariation,gardenPaint.r*.64*vMeadowWeight);
                diffuseColor.rgb=mix(diffuseColor.rgb,gardenSoil,gardenPaint.b*.7);
                diffuseColor.rgb=mix(diffuseColor.rgb,gardenPath,gardenPaint.g);
                diffuseColor.rgb=mix(diffuseColor.rgb,roadShoulder,coverage.r);
                diffuseColor.rgb=mix(diffuseColor.rgb,roadAsphalt,coverage.g);
                diffuseColor.rgb=mix(diffuseColor.rgb,roadWhite,coverage.b);
                diffuseColor.rgb=mix(diffuseColor.rgb,roadKerb,coverage.a);`)
        }
        this.terrain.material.customProgramCacheKey=()=> 'heightfield-road-paint-v7'
        this.terrain.material.needsUpdate=true
    }

    setGardenSurface() {
        const {minX,maxX,minY,maxY}=landscapeBounds
        const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=720
        const context=canvas.getContext('2d'),scale=canvas.width/(maxX-minX)
        const px=x=>(x-minX)*scale,py=y=>(maxY-y)*scale
        const image=context.createImageData(canvas.width,canvas.height)
        const trace=(points)=>{
            context.beginPath();points.forEach(([x,y],i)=>context[i ? 'lineTo' : 'moveTo'](px(x),py(y)));context.closePath()
        }
        meadowPatches.forEach((patch,index)=>{
            context.filter=patch.garden ? 'blur(1px)' : 'blur(4px)'
            trace(meadowOutline(patch,index))
            context.fillStyle='#fff';context.fill()
        })
        context.filter='none'
        const grass=context.getImageData(0,0,canvas.width,canvas.height).data
        context.clearRect(0,0,canvas.width,canvas.height)
        context.lineCap='round';context.lineJoin='round';context.strokeStyle='#fff'
        for(const path of gardenPaths) {
            context.beginPath();path.points.forEach(([x,y],i)=>context[i ? 'lineTo' : 'moveTo'](px(x),py(y)))
            context.lineWidth=path.width*scale;context.stroke()
        }
        const s=garden.shelter
        context.beginPath();context.roundRect(px(s.x-s.w/2),py(s.y+s.h/2),s.w*scale,s.h*scale,1.2*scale)
        context.fillStyle='#fff';context.fill()
        const paths=context.getImageData(0,0,canvas.width,canvas.height).data
        context.clearRect(0,0,canvas.width,canvas.height);context.filter='blur(1px)'
        flowerBeds.forEach(([x,y,rx,ry],index)=>{
            trace(meadowOutline({x,y,rx,ry},index));context.fill()
        })
        const soil=context.getImageData(0,0,canvas.width,canvas.height).data
        for(let i=0;i<grass.length;i+=4) {
            image.data[i]=grass[i+3];image.data[i+1]=paths[i+3];image.data[i+2]=soil[i+3];image.data[i+3]=255
        }
        context.putImageData(image,0,0)
        const texture=new THREE.CanvasTexture(canvas)
        texture.minFilter=THREE.LinearMipmapLinearFilter;texture.anisotropy=4
        this.gardenMask=texture
        return texture
    }

    clearOriginalTrees(objects) {
        this.retiredTreeAnchors=[]
        this.legacyTrees=[]
        this.relocatedTrees=[]
        for(const item of objects.items) {
            if(!item.shouldMerge) continue
            item.container.updateWorldMatrix(true,true)
            const floorMeshes=item.container.children.filter(node=>node.material?.uniforms?.tShadow)
            for(const canopy of item.container.children.filter(node=>/^shadeGreen/i.test(node.name))) {
                const bounds=new THREE.Box3().setFromObject(canopy)
                const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3())
                const trunks=item.container.children.filter(node=>{
                    if(!/^shadeBrown/i.test(node.name)) return false
                    const b=new THREE.Box3().setFromObject(node),p=b.getCenter(new THREE.Vector3())
                    return Math.hypot(p.x-center.x,p.y-center.y)<.4 && b.max.z<=bounds.min.z+.5
                })
                const baseZ=Math.min(bounds.min.z,...trunks.map(node=>new THREE.Box3().setFromObject(node).min.z))
                this.retiredTreeAnchors.push({
                    x:center.x,y:center.y,z:baseZ,
                    radius:Math.hypot(size.x,size.y)/2,height:bounds.max.z-baseZ,
                    sourceObject:item,floorMeshes,
                })
                const collision=item.collision,body=collision?.body
                if(body) {
                    // A compound body also owns rails, boulders and benches.
                    // Remove only the narrow proxy directly beneath this crown.
                    const remove=[]
                    body.shapeOffsets.forEach((offset,index)=>{
                        const point=body.pointToWorldFrame(offset),shape=body.shapes[index]
                        if(Math.hypot(point.x-center.x,point.y-center.y)>.6 || !shape.halfExtents || Math.max(shape.halfExtents.x,shape.halfExtents.y)>1.5) return
                        if(point.z<baseZ-.2 || point.z>bounds.max.z+.2) return
                        remove.push(index)
                    })
                    for(const index of remove.reverse()) {
                        const shape=body.shapes.splice(index,1)[0]
                        body.shapeOffsets.splice(index,1);body.shapeOrientations.splice(index,1)
                        if(shape.body===body) shape.body=null
                        const debug=collision.model?.meshes.splice(index,1)[0]
                        if(debug) {debug.removeFromParent();debug.geometry?.dispose()}
                    }
                    body.updateMassProperties();body.updateBoundingRadius();body.aabbNeedsUpdate=true
                }
                for(const node of [canopy,...trunks]) item.container.remove(node)
            }
        }
    }

    setGroves() {
        // The Blender kit is normalized to 4.8m trees with a <2m crown radius.
        // Keep the existing valley groves and add deliberately framed courtyard
        // groups; no source blocks or mismatched legacy trunk proxies remain.
        const groves=grovePlacements(2)
        groves.forEach(p=>{p.treeScale=p.scale})
        this.landmarkTrees=landmarkTreePlacements(2,groves)
        this.groves=[...groves,...this.landmarkTrees]
        this.groveMeshes=[]
    }

    setSignalArch() {
        // One authored silhouette: a thick stone aperture straddles the scenic
        // route. The open centre is wide enough to drive through.
        const centerX=-49, centerY=-80, radius=6.5
        const base=Math.min(surfaceHeight(centerX-radius+.5,centerY),surfaceHeight(centerX+radius-.5,centerY))-.15
        const shape=new THREE.Shape()
        shape.moveTo(-radius,0)
        shape.absarc(0,0,radius,Math.PI,0,true)
        shape.lineTo(radius-1.05,0)
        shape.absarc(0,0,radius-1.05,0,Math.PI,false)
        shape.closePath()
        const geometry=new THREE.ExtrudeGeometry(shape,{depth:1.5,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.14,bevelThickness:.14,curveSegments:36})
        geometry.rotateX(Math.PI/2)
        const arch=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#c2afa1',roughness:.9,metalness:.05}))
        arch.position.set(centerX,centerY,base)
        arch.name='Signal aperture · ridge landmark'
        this.container.add(arch)
        const points=Array.from({length:49},(_,i)=>{
            const angle=Math.PI*i/48
            return new THREE.Vector3(centerX+Math.cos(angle)*(radius-.5),centerY-1.68,base+Math.sin(angle)*(radius-.5))
        })
        const seam=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.045,4,false),new THREE.MeshBasicMaterial({color:'#d7f3ee'}))
        seam.name='Signal thread'
        this.container.add(seam)
        // Coarse pillars are the only reachable solid portions; the crown is
        // safely above the car and never creates an invisible drive-through wall.
        const solids=[-1,1].map(side=>{
            const box=new THREE.Object3D();box.name='box'
            box.position.set(centerX+side*(radius-.5),centerY-.75,base+1.5)
            box.scale.set(1.3,1.9,3)
            return box
        })
        this.physics.addObjectFromThree({meshes:solids,offset:new THREE.Vector3(),rotation:new THREE.Euler(),mass:0,sleep:true})
    }
}
