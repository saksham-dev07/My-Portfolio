import * as THREE from 'three'
import CANNON from 'cannon'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { surfaceHeight } from './LandscapeLayout.js'
import { groundLayer } from './GroundLayers.js'

export const activityPropPlacements=Object.freeze([
    {id:'maidan-scoreboard',x:-43,y:-24,scale:1.25,angle:0},
    {id:'campus-checkpoint',x:2,y:-98.5,scale:1.25,angle:Math.PI/2},
    {id:'chai-cart',x:-52,y:-119,scale:.85,angle:0},
    {id:'ramp-deck',x:-54,y:-44,scale:1,angle:-Math.PI/2},
])

export const activityPropBoxes={
    'maidan-scoreboard':[
        {center:[-1.3,0,1.15],size:[.3,.35,2.3]},
        {center:[1.3,0,1.15],size:[.3,.35,2.3]},
        {center:[0,-.045,1.5],size:[2.46,.16,1.35]},
        {center:[0,0,2.22],size:[3,.35,.16]},
    ],
    'campus-checkpoint':[
        {center:[-2.275,0,1.43],size:[.45,.45,2.86]},
        {center:[2.275,0,1.43],size:[.45,.45,2.86]},
        {center:[0,0,2.975],size:[5,.36,.23]},
        {center:[0,0,3.225],size:[1.66,.14,.35]},
    ],
    'chai-cart':[
        // Authored Blender metres: keep the service opening genuinely open.
        {center:[0,0,.82],size:[2.46,1.22,1]},
        {center:[0,0,1.255],size:[2.68,1.42,.13]},
        ...[-1,1].flatMap(side=>[-.49,.49].map(y=>({center:[side*1.09,y,1.89],size:[.075,.075,1.15]}))),
        ...[-1,1].map(side=>({center:[side*1.31,.18,.405],size:[.13,.8,.8]})),
        {center:[0,0,2.47],size:[3.22,1.89,.3]},
    ],
}

// Shipping GLBs are Y-up. Bake the complete hierarchy once, preserving each
// flat PBR material colour in the world's existing display-space matcap pass.
// The result is one small static geometry and one shared material per asset.
export function activityPropGeometry(scene) {
    scene.updateMatrixWorld(true)
    const conversion=new THREE.Matrix4().makeRotationX(Math.PI/2),parts=[],color=new THREE.Color()
    scene.traverse(node=>{
        if(!node.isMesh) return
        const indexed=node.geometry.clone(),geometry=indexed.index ? indexed.toNonIndexed() : indexed
        if(geometry!==indexed) indexed.dispose()
        geometry.applyMatrix4(conversion.clone().multiply(node.matrixWorld))
        const count=geometry.attributes.position.count,source=geometry.getAttribute('color'),colors=new Float32Array(count*3)
        const materials=Array.isArray(node.material) ? node.material : [node.material]
        const materialForVertex=new Uint8Array(count)
        for(const group of geometry.groups) materialForVertex.fill(group.materialIndex,group.start,Math.min(count,group.start+group.count))
        for(let i=0;i<count;i++) {
            color.copy(materials[materialForVertex[i]]?.color || new THREE.Color(0xffffff))
            if(source) color.multiply(new THREE.Color(source.getX(i),source.getY(i),source.getZ(i)))
            color.convertLinearToSRGB();colors[i*3]=color.r;colors[i*3+1]=color.g;colors[i*3+2]=color.b
        }
        for(const name of Object.keys(geometry.attributes)) if(name!=='position') geometry.deleteAttribute(name)
        geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.clearGroups()
        parts.push(geometry)
    })
    if(!parts.length) throw new Error('The optional prop contains no mesh geometry')
    const merged=mergeGeometries(parts)
    parts.forEach(geometry=>geometry.dispose())
    if(!merged) throw new Error('The optional prop geometry could not be combined')
    merged.computeBoundingBox();merged.computeBoundingSphere()
    return merged
}

export function activityPropSolids(placement,boxes=activityPropBoxes[placement.id] || []) {
    const group=new THREE.Object3D();group.position.set(placement.x,placement.y,surfaceHeight(placement.x,placement.y))
    group.rotation.z=placement.angle;group.scale.setScalar(placement.scale);group.updateMatrix()
    return boxes.map(box=>{
        const solid=new THREE.Object3D();solid.name='box'
        solid.position.fromArray(box.center).applyMatrix4(group.matrix);solid.scale.fromArray(box.size).multiplyScalar(placement.scale)
        solid.rotation.z=placement.angle+(box.angle || 0)
        return solid
    })
}

export function rampProfile(scene) {
    scene.updateMatrixWorld(true)
    const read=name=>{
        const node=scene.getObjectByName(name)
        if(!node?.isMesh) throw new Error('The optional ramp is missing its deck surface')
        const geometry=node.geometry.clone().applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI/2).multiply(node.matrixWorld))
        geometry.computeBoundingBox()
        const bounds=geometry.boundingBox.clone(),position=geometry.attributes.position,high=[]
        for(let i=0;i<position.count;i++) if(Math.abs(position.getZ(i)-bounds.max.z)<.001) high.push(position.getY(i))
        geometry.dispose()
        return {bounds,highY:high.reduce((sum,y)=>sum+y,0)/high.length}
    }
    const slope=read('Ramp_Continuous_Teak_Top'),deck=read('Deck_Continuous_Teak_Top')
    if(Math.abs(slope.highY-deck.bounds.min.y)>.02 || Math.abs(slope.bounds.max.z-deck.bounds.max.z)>.001 || slope.highY<=slope.bounds.min.y || slope.bounds.max.z<.2 || slope.bounds.max.z>1.5) throw new Error('The optional ramp does not form a continuous safe deck')
    const bounds=new THREE.Box3().setFromObject(scene)
    return {width:bounds.max.x-bounds.min.x,near:slope.bounds.min.y,join:slope.highY,end:deck.bounds.max.y,height:deck.bounds.max.z,ground:slope.bounds.min.z}
}

export function activityPropCollision(placement,physics,profile) {
    const solids=activityPropSolids(placement)
    if(!solids.length && !profile) return null
    const center=new CANNON.Vec3(placement.x,placement.y,surfaceHeight(placement.x,placement.y))
    const body=new CANNON.Body({mass:0,material:physics.materials?.items?.dummy,position:center})
    // Rotate the compound body rather than each offset shape: Cannon 0.6's
    // AABB path otherwise rotates oriented shape offsets a second time.
    body.quaternion.setFromEuler(0,0,placement.angle)
    for(const box of activityPropBoxes[placement.id] || []) body.addShape(
        new CANNON.Box(new CANNON.Vec3(...box.size.map(value=>value*placement.scale/2))),
        new CANNON.Vec3(...box.center.map(value=>value*placement.scale)),
    )
    if(profile) {
        const {width,near,join,end,height,ground}=profile,s=placement.scale
        const points=[[-width/2,near,ground-.04],[width/2,near,ground-.04],[width/2,join,ground-.04],[-width/2,join,ground-.04],[-width/2,near,ground],[width/2,near,ground],[width/2,join,height],[-width/2,join,height]].map(point=>new CANNON.Vec3(...point.map(value=>value*s)))
        const wedge=new CANNON.ConvexPolyhedron(points,[[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])
        body.addShape(wedge)
        body.addShape(new CANNON.Box(new CANNON.Vec3(width*s/2,(end-join)*s/2,height*s/2)),new CANNON.Vec3(0,(join+end)*.5*s,height*s/2))
    }
    physics.world.addBody(body)
    return {body,solids}
}

function disposeSource(scene) {
    const geometries=new Set(),materials=new Set(),textures=new Set()
    scene.traverse(node=>{if(node.isMesh) {
        geometries.add(node.geometry)
        for(const material of Array.isArray(node.material) ? node.material : [node.material]) {
            materials.add(material);for(const value of Object.values(material)) if(value?.isTexture) textures.add(value)
        }
    }})
    textures.forEach(texture=>texture.dispose());geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose())
}

export function propLabelPlanes({texture,width,height,z,frontY,backY}) {
    const geometry=new THREE.PlaneGeometry(width,height),material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false})
    const front=new THREE.Mesh(geometry,material),back=new THREE.Mesh(geometry,material)
    front.position.set(0,frontY,z);front.rotation.x=Math.PI/2
    back.position.set(0,backY,z);back.rotation.set(Math.PI/2,0,Math.PI,'ZYX')
    return {front,back,geometry,material}
}

export default class ActivityProps {
    constructor({container,objects,camera,time,loader=new GLTFLoader(),window:host=window,document:page=document}) {
        this.container=container;this.objects=objects;this.camera=camera;this.time=time;this.loader=loader;this.window=host;this.document=page
        this.items=activityPropPlacements.map(placement=>({placement,state:'idle'}));this.loadedTriangles=0;this.disposed=false;this.loading=false
        this.labels=[];this.collisions=[];this.nextCheck=time.elapsed+750
        this.material=new THREE.MeshMatcapMaterial({matcap:objects.materials.shades.items.white.uniforms.matcap.value,vertexColors:true})
        this.material.name='Activity props / shared world matcap'
        this.frustum=new THREE.Frustum();this.matrix=new THREE.Matrix4()
        this.lastBowling=null
        this.onUpdate=event=>{if(event.detail?.id==='bowling') {this.lastBowling=event.detail;this.drawScore()}}
        host.addEventListener('drive-activity-update',this.onUpdate)
        time.on('tick.activityProps',()=>this.checkLoad())
    }

    checkLoad() {
        if(this.disposed || this.loading || this.time.elapsed<this.nextCheck) return
        this.nextCheck=this.time.elapsed+500
        this.camera.instance.updateMatrixWorld()
        this.matrix.multiplyMatrices(this.camera.instance.projectionMatrix,this.camera.instance.matrixWorldInverse)
        this.frustum.setFromProjectionMatrix(this.matrix)
        const item=this.items.find(item=>item.state==='idle' && (this.camera.view==='top' || this.frustum.intersectsSphere(new THREE.Sphere(new THREE.Vector3(item.placement.x,item.placement.y,2),8))))
        if(!item) return
        item.state='loading';this.loading=true
        this.loader.load(`./saksham/models/${item.placement.id}.glb`,gltf=>{
            this.loading=false
            if(this.disposed) {disposeSource(gltf.scene);return}
            try {this.addAsset(item,gltf.scene);item.state='ready'}
            catch {item.state='error'}
            finally {disposeSource(gltf.scene)}
        },undefined,()=>{this.loading=false;item.state='error'})
    }

    addAsset(item,scene) {
        const profile=item.placement.id==='ramp-deck' ? rampProfile(scene) : null
        const geometry=activityPropGeometry(scene),triangles=geometry.attributes.position.count/3
        if(this.loadedTriangles+triangles>5000) {geometry.dispose();throw new Error('Optional activity props exceeded their triangle budget')}
        const p=item.placement,group=new THREE.Group(),mesh=new THREE.Mesh(geometry,this.material)
        group.name=`Activity prop / ${p.id}`;group.position.set(p.x,p.y,surfaceHeight(p.x,p.y));group.scale.setScalar(p.scale);group.rotation.z=p.angle
        group.add(mesh);group.updateMatrix();group.matrixAutoUpdate=false
        this.container.add(group);item.group=group;item.geometry=geometry;item.mesh=mesh;this.loadedTriangles+=triangles
        item.collision=activityPropCollision(p,this.objects.physics,profile)
        if(item.collision) {
            this.collisions.push(item.collision)
        }
        if(p.id==='maidan-scoreboard') this.setScoreboard(group)
        if(p.id==='campus-checkpoint') this.setCheckpointLabel(group)
        if(p.id==='chai-cart') this.setChaiLabel(group)
        this.setContactShadows(group,p.id,profile)
    }

    makeCanvas(width,height) {
        const canvas=this.document.createElement('canvas');canvas.width=width;canvas.height=height
        const texture=new THREE.CanvasTexture(canvas);texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.anisotropy=4
        return {canvas,texture,context:canvas.getContext('2d')}
    }

    setScoreboard(group) {
        this.score=this.makeCanvas(1024,512)
        const labels=propLabelPlanes({texture:this.score.texture,width:2.2,height:1.1,z:1.5,frontY:-.108,backY:.108})
        labels.front.name='Maidan bowling / live score front';labels.back.name='Maidan bowling / live score back'
        group.add(labels.front,labels.back);this.labels.push({...labels,texture:this.score.texture})
        this.drawScore()
    }

    drawScore() {
        if(!this.score) return
        const {context:ctx,canvas,texture}=this.score,score=this.lastBowling
        ctx.fillStyle='#143c30';ctx.fillRect(0,0,canvas.width,canvas.height)
        ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f4ead4'
        ctx.font='700 72px system-ui, sans-serif';ctx.fillText('MAIDAN BOWLING',512,88)
        ctx.font='700 184px system-ui, sans-serif';ctx.fillText(`${score?.total || 0} / 30`,512,266)
        ctx.fillStyle='#e6ad70';ctx.font='600 52px system-ui, sans-serif'
        const detail=score ? score.phase==='result' && score.attempts?.length===3 ? 'THREE ROLLS COMPLETE' : `ROLL ${score.attempt || 1} OF 3` : 'STEP UP. TAKE THREE ROLLS.'
        ctx.fillText(detail,512,424);texture.needsUpdate=true
    }

    setCheckpointLabel(group) {
        const {canvas,texture,context:ctx}=this.makeCanvas(768,160)
        ctx.fillStyle='#143c30';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#f4ead4'
        ctx.font='700 58px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('START / FINISH',384,80)
        const labels=propLabelPlanes({texture,width:1.62,height:.31,z:3.225,frontY:-.082,backY:.082})
        labels.front.name='Campus rally / start front';labels.back.name='Campus rally / start back'
        group.add(labels.front,labels.back);this.labels.push({...labels,texture})
    }

    setChaiLabel(group) {
        const {canvas,texture,context:ctx}=this.makeCanvas(768,220)
        ctx.fillStyle='#f4ead4';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#143c30'
        ctx.font='700 76px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('CHAI BREAK',384,83)
        ctx.fillStyle='#94652f';ctx.font='600 28px system-ui, sans-serif';ctx.fillText('SLOW DOWN. SIP.',384,160)
        const labels=propLabelPlanes({texture,width:1.27,height:.32,z:.82,frontY:-.647,backY:.647})
        labels.front.name='Garden chai cart / cream counter lettering'
        group.add(labels.front);this.labels.push({...labels,texture})
    }

    setContactShadows(group,id,profile) {
        if(!this.contactMaterial) {
            const {texture,context:ctx}=this.makeCanvas(64,64),gradient=ctx.createRadialGradient(32,32,7,32,32,31)
            gradient.addColorStop(0,'rgba(21,42,29,.6)');gradient.addColorStop(1,'rgba(21,42,29,0)')
            ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);texture.needsUpdate=true
            this.contactTexture=texture;this.contactGeometry=new THREE.PlaneGeometry(1,1)
            this.contactMaterial=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.23,depthWrite:false})
        }
        const footprints=id==='maidan-scoreboard' ? [[-1.3,0,.5,.55],[1.3,0,.5,.55]]
            : id==='campus-checkpoint' ? [[-2.275,0,.65,.65],[2.275,0,.65,.65]]
            : id==='chai-cart' ? [[0,.1,3.03,1.68]]
            : [[0,(profile.near+profile.end)/2,profile.width+.3,profile.end-profile.near+.3]]
        for(const [x,y,width,depth] of footprints) {
            const shadow=new THREE.Mesh(this.contactGeometry,this.contactMaterial)
            shadow.name=`Activity prop / ${id} contact shadow`;shadow.position.set(x,y,0);shadow.scale.set(width,depth,1)
            group.add(shadow);groundLayer(shadow,'shadow')
        }
    }

    dispose() {
        if(this.disposed) return
        this.disposed=true;this.time.off('tick.activityProps');this.window.removeEventListener('drive-activity-update',this.onUpdate)
        for(const item of this.items) {if(item.group) this.container.remove(item.group);item.geometry?.dispose()}
        for(const collision of this.collisions) {
            this.objects.physics.world.removeBody(collision.body)
        }
        for(const label of this.labels) {label.geometry.dispose();label.material.dispose();label.texture.dispose()}
        this.contactGeometry?.dispose();this.contactMaterial?.dispose();this.contactTexture?.dispose()
        this.material.dispose();this.score=null
    }
}
