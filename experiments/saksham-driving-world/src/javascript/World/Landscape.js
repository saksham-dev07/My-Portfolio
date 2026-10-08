import * as THREE from 'three'
import { landscapeGrid, surfaceHeight, roadEdgeDistance, roads, landscapeBounds, roadsidePosition, roadShoulder, landscapeSigns, researchTerraces, smooth } from './LandscapeLayout.js'
import { roadMaskPixels } from './RoadMask.js'
import DirectionSigns from './Sections/DirectionSigns.js'
import ResearchGateway from './ResearchGateway.js'
import { grovePlacements } from './EnvironmentLayout.js'
import EnvironmentDressing from './EnvironmentDressing.js'

export default class Landscape {
    constructor({ objects, scene, camera, config, time, directionSignTemplate }) {
        this.container = new THREE.Group()
        this.container.name = 'Field Notes · sculpted valley'
        this.physics = objects.physics
        this.setTerrain()
        this.setRoads()
        this.clearOriginalTrees(objects)
        this.setGroves(objects, time)
        this.dressing = new EnvironmentDressing({ container: this.container, objects, camera, time, trees: this.groves || [] })
        this.setSignalArch()
        this.gateway = new ResearchGateway({ container: this.container, physics: this.physics, camera, time })
        const signSolids=[]
        const signs=landscapeSigns.map(sign=>({...sign,z:surfaceHeight(sign.x,sign.y)}))
        this.directionSigns=new DirectionSigns(directionSignTemplate,this.container,signSolids,signs)
        if(signSolids.length) this.physics.addObjectFromThree({meshes:signSolids,offset:new THREE.Vector3(),rotation:new THREE.Euler(),mass:0,sleep:true})
        scene.fog = new THREE.FogExp2('#9299bc', .0032)
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
        const colors=[], normal=geometry.attributes.normal, position=geometry.attributes.position
        const valley=new THREE.Color('#72769f'), stone=new THREE.Color('#b6a6a0'), crest=new THREE.Color('#e3c7ab')
        const terraceColors=researchTerraces.map(terrace=>new THREE.Color(terrace.ground))
        const light=new THREE.Vector3(-.5,-.35,1).normalize(), n=new THREE.Vector3()
        for(let i=0;i<position.count;i++) {
            const h=position.getZ(i), slope=1-normal.getZ(i)
            const color=valley.clone().lerp(stone,THREE.MathUtils.clamp(h/10+slope*.8,0,1)).lerp(crest,THREE.MathUtils.clamp((h-7)/14,0,.55))
            researchTerraces.forEach((terrace,index)=>{
                const edgeX=1-smooth(51,58,Math.abs(position.getX(i)-105))
                const edgeY=1-smooth(10,16,Math.abs(position.getY(i)-terrace.y))
                color.lerp(terraceColors[index],edgeX*edgeY*.62)
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
        // The unused blue channel holds fine lane paint, on the same surface as
        // the asphalt. No new road meshes, draw calls, or depth overlap.
        context.clearRect(0,0,canvas.width,canvas.height)
        context.setLineDash([1.25*scale,2.75*scale])
        context.lineWidth=.12*scale
        context.strokeStyle='#fff'
        for(const road of roads.filter(road=>road.name.startsWith('Research'))) { trace(road);context.stroke() }
        const paint=context.getImageData(0,0,canvas.width,canvas.height).data
        for(let i=0;i<coverage.length;i++) image.data[i*4+2]=Math.min(paint[i*4+3],image.data[i*4+1])
        context.setLineDash([])
        context.putImageData(image,0,0)
        // Subpixel antialiasing removes the distance field's pixel stair steps
        // at close zoom without softening the authored road geometry.
        context.globalCompositeOperation='copy'
        context.filter='blur(0.6px)'
        context.drawImage(canvas,0,0)
        this.roadMask=new THREE.CanvasTexture(canvas)
        this.roadMask.generateMipmaps=true
        this.roadMask.minFilter=THREE.LinearMipmapLinearFilter
        this.roadMask.anisotropy=4
        const asphalt=new THREE.Color('#494e70').convertLinearToSRGB()
        const shoulder=new THREE.Color('#aba7b2').convertLinearToSRGB()
        this.terrain.material.onBeforeCompile=shader=>{
            shader.uniforms.roadMask={value:this.roadMask}
            shader.uniforms.roadAsphalt={value:asphalt}
            shader.uniforms.roadShoulder={value:shoulder}
            shader.vertexShader='varying vec2 vRoadUv;\n'+shader.vertexShader
            shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
                vRoadUv=(position.xy-vec2(${minX}.0,${minY}.0))/vec2(${maxX-minX}.0,${maxY-minY}.0);`)
            shader.fragmentShader='uniform sampler2D roadMask; uniform vec3 roadAsphalt; uniform vec3 roadShoulder; varying vec2 vRoadUv;\n'+shader.fragmentShader
            shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
                vec3 coverage=texture2D(roadMask,vRoadUv).rgb;
                diffuseColor.rgb=mix(diffuseColor.rgb,roadShoulder,coverage.r);
                diffuseColor.rgb=mix(diffuseColor.rgb,roadAsphalt,coverage.g);
                diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.91,.86,.74),coverage.b*.65);`)
        }
        this.terrain.material.customProgramCacheKey=()=> 'heightfield-road-union-v3'
        this.terrain.material.needsUpdate=true
    }

    clearOriginalTrees(objects) {
        this.relocatedTrees=[]
        for(const item of objects.items) {
            if(!item.shouldMerge) continue
            item.container.updateWorldMatrix(true,true)
            for(const canopy of item.container.children.filter(node=>/^shadeGreen/i.test(node.name))) {
                const bounds=new THREE.Box3().setFromObject(canopy)
                const center=bounds.getCenter(new THREE.Vector3())
                const size=bounds.getSize(new THREE.Vector3())
                const radius=Math.hypot(size.x,size.y)/2
                if(roadEdgeDistance(center.x,center.y)>=radius+.6) continue
                // The old Information tree joins the western grove, rather than
                // landing directly behind the portrait when moved by proximity.
                const gardenTree=center.x>-8 && center.x<0 && center.y>-68 && center.y<-62
                const target=roadsidePosition(gardenTree ? -14 : center.x,gardenTree ? -65 : center.y,radius)
                const delta=new THREE.Vector3(target.x-center.x,target.y-center.y,0)
                if(delta.lengthSq()<.01) continue
                delta.z=surfaceHeight(target.x,target.y)-surfaceHeight(center.x,center.y)
                const baseZ=bounds.min.z
                // Move the canopy and its matching trunk before static batching.
                for(const node of item.container.children) {
                    if(node!==canopy && !/^shadeBrown/i.test(node.name)) continue
                    const b=new THREE.Box3().setFromObject(node),p=b.getCenter(new THREE.Vector3())
                    if(node!==canopy && (Math.hypot(p.x-center.x,p.y-center.y)>.4 || b.max.z>baseZ+.5)) continue
                    const localDelta=delta.clone().transformDirection(item.container.matrixWorld.clone().invert()).multiplyScalar(delta.length())
                    node.position.add(localDelta);node.updateMatrix()
                }
                // The original trunks live inside compound Cannon bodies. Move
                // their offsets too, otherwise a ghost trunk would block the road.
                const body=item.collision.body
                body.shapeOffsets.forEach((offset,index)=>{
                    const point=body.pointToWorldFrame(offset)
                    const shape=body.shapes[index]
                    if(Math.hypot(point.x-center.x,point.y-center.y)>.6 || !shape.halfExtents || Math.max(shape.halfExtents.x,shape.halfExtents.y)>1.5) return
                    const local=body.quaternion.inverse().vmult({x:delta.x,y:delta.y,z:delta.z})
                    offset.vadd(local,offset)
                    item.collision.model.meshes[index]?.position.add(new THREE.Vector3(local.x,local.y,local.z))
                })
                body.updateBoundingRadius();body.aabbNeedsUpdate=true
                this.relocatedTrees.push({from:[center.x,center.y],to:[target.x,target.y],radius})
            }
        }
    }

    setGroves(objects, time) {
        const tree=objects.items.find(item=>item.container.children.some(node=>node.name==='shadeGreen'))
        if(!tree) return
        const source=new THREE.Group()
        tree.container.children.filter(node=>['shadeGreen','shadeBrown003'].includes(node.name)).forEach(node=>source.add(node.clone()))
        source.updateMatrixWorld(true)
        const bounds=new THREE.Box3().setFromObject(source), center=bounds.getCenter(new THREE.Vector3())
        const baseScale=4.5/Math.max(.01,bounds.max.z-bounds.min.z)
        const size=bounds.getSize(new THREE.Vector3())
        const placements=grovePlacements(Math.hypot(size.x,size.y)*baseScale/2)
        // Retain the normalized size for understory placement and collision scale.
        placements.forEach(p=>{p.treeScale=p.scale;p.scale*=baseScale})
        const dummy=new THREE.Object3D(), trunkShapes=[]
        for(const node of source.children) {
            if(!node.isMesh) continue
            const canopy=node.name==='shadeGreen'
            const material=new THREE.MeshMatcapMaterial({
                matcap:objects.materials.shades.items.white.uniforms.matcap.value,
                color:canopy ? '#9cac77' : '#967568',
            })
            material.color.convertLinearToSRGB()
            if(canopy) {
                node.geometry.computeBoundingBox()
                const {min,max}=node.geometry.boundingBox
                const breeze={value:0},motion={value:1}
                const preference=window.matchMedia('(prefers-reduced-motion: reduce)')
                const syncMotion=()=>{motion.value=preference.matches ? 0 : 1}
                syncMotion();preference.addEventListener('change',syncMotion)
                time.on('tick',()=>{breeze.value=time.elapsed*.001})
                material.onBeforeCompile=shader=>{
                    shader.uniforms.uBreeze=breeze;shader.uniforms.uGroveMotion=motion
                    shader.vertexShader='uniform float uBreeze; uniform float uGroveMotion;\n'+shader.vertexShader
                    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
                        float crown=clamp((position.z-(${min.z.toFixed(5)}))/${Math.max(.01,max.z-min.z).toFixed(5)},0.0,1.0);
                        transformed.x+=sin(uBreeze*.8+instanceMatrix[3].x*.17+instanceMatrix[3].y*.11)*crown*crown*.08*uGroveMotion;`)
                }
                material.customProgramCacheKey=()=> 'grove-matcap-breeze-v1'
            }
            const instances=new THREE.InstancedMesh(node.geometry,material,placements.length)
            placements.forEach((p,index)=>{
                dummy.position.set(p.x,p.y,p.z)
                dummy.rotation.set(0,0,p.angle)
                dummy.scale.setScalar(p.scale)
                dummy.updateMatrix()
                const origin=new THREE.Matrix4().makeTranslation(-center.x,-center.y,-bounds.min.z)
                instances.setMatrixAt(index,dummy.matrix.clone().multiply(origin).multiply(node.matrixWorld))
            })
            instances.computeBoundingSphere()
            this.container.add(instances)
        }
        for(const p of placements) {
            const trunk=new THREE.Object3D()
            trunk.name='box'
            trunk.position.set(p.x,p.y,p.z+.75*p.treeScale)
            trunk.scale.set(.55*p.treeScale,.55*p.treeScale,1.5*p.treeScale)
            trunkShapes.push(trunk)
        }
        if(trunkShapes.length) this.physics.addObjectFromThree({meshes:trunkShapes,offset:new THREE.Vector3(),rotation:new THREE.Euler(),mass:0,sleep:true})
        this.groves=placements
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
