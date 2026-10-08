import { test, expect } from 'bun:test'
import * as THREE from 'three'
import Objects from '../src/javascript/World/Objects.js'
import { roadEdgeDistance, roads, distanceToRoad } from '../src/javascript/World/LandscapeLayout.js'
import { profileSections } from '../src/javascript/sakshamProfile.js'
import { groundLayer, stabilizeGround, conformShadow } from '../src/javascript/World/GroundLayers.js'
import { roadMaskPixels } from '../src/javascript/World/RoadMask.js'

test('baked shadow parser separates overlays from the physical ground depth', () => {
    const material=new THREE.ShaderMaterial({transparent:true,uniforms:{tShadow:{value:null},uShadowColor:{value:null},uAlpha:{value:0}}})
    material.shadowColor='#d04500'
    const objects={materials:{items:{floorShadow:material}},floorShadows:[]}
    Objects.prototype.setParsers.call(objects)
    const source=new THREE.Mesh(new THREE.PlaneGeometry(1,1))
    source.scale.set(10,10,1)
    const shadow=objects.parsers.items.find(parser=>parser.regex.test('floor')).apply(source,{floorShadowTexture:new THREE.Texture()})
    expect(shadow.position.z).toBeGreaterThan(.02)
    expect(shadow.material.depthWrite).toBe(false)
    expect(shadow.material.polygonOffset).toBe(true)
    expect(shadow.material.polygonOffsetUnits).toBeLessThan(0)
    expect(shadow.material.name).toBe('') // Separate shadow textures must not merge.
})

test('ground text keeps reveal uniforms and cannot change the material of solid props', () => {
    const material=new THREE.ShaderMaterial({uniforms:{uRevealProgress:{value:0}}})
    material.name='shadeWhite'
    const root=new THREE.Group(), group=new THREE.Group()
    group.position.set(4,8,0);group.rotation.z=.4;root.add(group)
    const label=new THREE.Mesh(new THREE.PlaneGeometry(4,1),material)
    const prop=new THREE.Mesh(new THREE.BoxGeometry(1,1,3),material)
    const mouse=new THREE.Mesh(new THREE.PlaneGeometry(8,4),new THREE.MeshBasicMaterial({transparent:true,opacity:0}))
    const intro=new THREE.Mesh(new THREE.PlaneGeometry(4,1),new THREE.MeshBasicMaterial({transparent:true,opacity:0,alphaMap:new THREE.Texture()}))
    prop.position.z=1.5;mouse.position.z=-.01
    group.add(label,prop,mouse,intro)
    stabilizeGround(root)
    expect(label.material).not.toBe(material)
    expect(label.material.uniforms).toBe(material.uniforms)
    material.uniforms.uRevealProgress.value=1
    expect(label.material.uniforms.uRevealProgress.value).toBe(1)
    expect(label.material.depthTest).toBe(true)
    expect(label.getWorldPosition(new THREE.Vector3()).z).toBeCloseTo(.1)
    expect(prop.material.polygonOffset).toBe(false)
    expect(mouse.position.z).toBe(-.01)
    expect(intro.position.z).toBeCloseTo(.1)
    expect(intro.material.polygonOffset).toBe(true)
    groundLayer(label)
    expect(label.position.z).toBeCloseTo(.1) // Applying the policy twice cannot lift twice.
})

test('a rotated moving shadow follows uneven ground across its whole footprint', () => {
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1,8,8))
    mesh.scale.set(6,3,2.4);mesh.position.set(-52,-90,.8);mesh.rotation.z=.7
    const height=(x,y)=>.4+Math.sin(x*.2)*Math.cos(y*.15)*.2
    conformShadow(mesh,height)
    mesh.updateMatrixWorld(true)
    const positions=mesh.geometry.attributes.position,point=new THREE.Vector3()
    for(let i=0;i<positions.count;i++) {
        point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld)
        expect(point.z-height(point.x,point.y)).toBeCloseTo(.06,5)
    }
})

test('one continuous curb surrounds a filleted T junction without shoulder spikes', () => {
    const width=64,height=64,coverage=new Uint8Array(width*height)
    for(let y=0;y<height;y++) for(let x=0;x<width;x++) if((x>=28&&x<=36&&y>=12&&y<=52)||(x>=12&&x<=52&&y>=28&&y<=36)) coverage[y*width+x]=255
    const pixels=roadMaskPixels(coverage,width,height,2,4)
    const channel=(x,y,c)=>pixels[(y*width+x)*4+c]
    expect(channel(27,27,1)).toBe(255) // Concave corner becomes a gentle fillet.
    expect(channel(26,20,0)).toBeGreaterThan(0)
    expect(channel(24,20,0)).toBe(0) // Straight shoulders do not grow randomly.
    expect(channel(20,20,0)).toBe(0) // No bulb filling the entire junction square.
    for(let i=0;i<coverage.length;i++) expect(pixels[i*4]).toBeGreaterThanOrEqual(pixels[i*4+1])
})

test('pavement and shoulders leave breathing room around every profile and secret pad', () => {
    const pads=[...profileSections.map(section=>({x:section.x,y:section.y-4,w:8,h:4})),{x:-58,y:-60,w:4,h:4}]
    for(const pad of pads) for(let i=0;i<=20;i++) {
        const t=i/20
        for(const [x,y] of [[pad.x-pad.w/2+pad.w*t,pad.y-pad.h/2],[pad.x-pad.w/2+pad.w*t,pad.y+pad.h/2],[pad.x-pad.w/2,pad.y-pad.h/2+pad.h*t],[pad.x+pad.w/2,pad.y-pad.h/2+pad.h*t]]) expect(roadEdgeDistance(x,y)).toBeGreaterThanOrEqual(.3)
    }
})

test('the secret approach joins the ridge centreline without extending into its island', () => {
    const approach=roads.find(road=>road.name==='Quiet clearing')
    const ridge=roads.find(road=>road.name==='Ridge detour')
    const start=approach.samples[0]
    expect(distanceToRoad(ridge,start.x,start.y)).toBeLessThan(.4)
    expect(approach.curve.getLength()).toBeLessThan(4)
})
