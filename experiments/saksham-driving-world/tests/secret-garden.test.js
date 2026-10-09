import { expect, test } from 'bun:test'
import * as THREE from 'three'
import SecretGarden, { DiscoveryState, rangoliGeometry, secretGardenLocation } from '../src/javascript/World/SecretGarden.js'
import Area from '../src/javascript/World/Area.js'
import EventEmitter from '../src/javascript/Utils/EventEmitter.js'
import { discoveryNotice } from '../src/javascript/DiscoveryNotice.js'
import { landmarkTreePlacements, grovePlacements } from '../src/javascript/World/EnvironmentLayout.js'

class Element extends EventTarget {
    attributes={};children=[];hidden=false
    setAttribute(name,value) {this.attributes[name]=value}
    append(...children) {this.children.push(...children)}
    closest() {return null}
    getContext() {return {fillRect(){},fillText(){},measureText:text=>({width:text.length*30})}}
}

function secretFixture(reducedMotion=false) {
    const previous={window:globalThis.window,document:globalThis.document}
    const window=new EventTarget(),document={body:new Element(),createElement:()=>new Element(),querySelector:()=>null}
    window.matchMedia=()=>({matches:reducedMotion})
    window.setTimeout=callback=>{window.cooldown=callback;return 1};window.clearTimeout=()=>{}
    globalThis.window=window;globalThis.document=document
    const container=new THREE.Group(),label=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({alphaMap:new THREE.Texture()}))
    label.position.set(secretGardenLocation.x,secretGardenLocation.y,.03);container.add(label)
    const time=new EventEmitter();time.elapsed=0
    const area=new EventEmitter()
    Object.assign(area,{container:new THREE.Group(),halfExtents:new THREE.Vector2(2,2),time,active:true,initialTestCar:true,containsCar:()=>area.carInside,interact:()=>area.trigger('interact')})
    Area.prototype.setInteractions.call(area)
    const secret=new SecretGarden({area,label,container,time})
    return {secret,area,time,container,window,document,restore:()=>{globalThis.window=previous.window;globalThis.document=previous.document}}
}

test('the secret rangoli fits inside the existing pad with a tiny texture-free mesh',()=>{
    const geometry=rangoliGeometry(),positions=geometry.attributes.position
    expect(positions.count/3).toBeLessThan(50)
    expect(geometry.attributes.color.count).toBe(positions.count)
    for(let i=0;i<positions.count;i++) {
        expect(Math.hypot(positions.getX(i),positions.getY(i))).toBeLessThan(secretGardenLocation.halfExtent-.3)
        expect(positions.getZ(i)).toBe(0)
    }
    geometry.dispose()
})

test('discovery cooldown bounds repeated activation without losing the first reveal',()=>{
    const state=new DiscoveryState()
    expect(state.activate(0)).toBe(true)
    expect(state.activate(1)).toBe(false)
    expect(state.activate(899)).toBe(false)
    expect(state.activate(900)).toBe(true)
    expect(state.count).toBe(2)
})

test('driving reveals once, Enter replays, and editable or open-dialog input stays guarded',()=>{
    const fixture=secretFixture(),{secret,area,time,window,document,container}=fixture
    try {
        const announcements=[];window.addEventListener('drive-discovery',event=>announcements.push(event.detail))
        area.carInside=false;area.trigger('in')
        expect(secret.state.count).toBe(0)
        expect(secret.label.position.x).toBe(secretGardenLocation.x)
        expect(secret.label.position.y).toBe(secretGardenLocation.y)
        // A hovered pad is already "in" before the car enters; the visit must
        // still reveal even when Area has no new in transition to emit.
        area.carInside=true;time.trigger('tick')
        expect(secret.rangoli.visible).toBe(true);expect(secret.beacon.visible).toBe(true)
        expect(announcements[0].title).toBe('Hidden garden discovered.')
        const childCount=container.children.length
        time.elapsed=1000
        const blocked=new Event('keydown',{cancelable:true})
        Object.defineProperties(blocked,{key:{value:'Enter'},target:{value:{closest:()=>({})}}})
        window.dispatchEvent(blocked);expect(secret.state.count).toBe(1)
        document.querySelector=()=>({})
        const dialogKey=new Event('keydown',{cancelable:true});Object.defineProperty(dialogKey,'key',{value:'Enter'})
        window.dispatchEvent(dialogKey);expect(secret.state.count).toBe(1)
        document.querySelector=()=>null
        const key=new Event('keydown',{cancelable:true});Object.defineProperties(key,{key:{value:'Enter'},target:{value:document.body}})
        window.dispatchEvent(key)
        expect(key.defaultPrevented).toBe(true);expect(secret.state.count).toBe(2)
        expect(announcements[1].title).toBe('The garden blooms again.')
        expect(container.children).toHaveLength(childCount)
        time.elapsed=2600;time.trigger('tick')
        expect(secret.playing).toBe(false);expect(secret.particles.visible).toBe(false)
        expect(secret.rangoli.scale.x).toBe(1)
        expect(secret.label.userData.groundLayer).toBe('label')
        expect(secret.label.position.y).toBe(secretGardenLocation.y+4.5)
        expect(secret.label.position.y-.45).toBeGreaterThan(secretGardenLocation.y+secretGardenLocation.halfExtent)
        // The complete label footprint also clears the planted tree at the
        // north-east corner, rather than trading the prompt overlap for foliage.
        const groves=grovePlacements(2),trees=[...groves,...landmarkTreePlacements(2,groves)]
        for(const tree of trees) {
            const dx=Math.max(0,Math.abs(tree.x-secret.label.position.x)-2)
            const dy=Math.max(0,Math.abs(tree.y-secret.label.position.y)-.45)
            expect(Math.hypot(dx,dy)).toBeGreaterThan(tree.radius)
        }
    } finally {fixture.restore()}
})

test('reduced motion reveals the complete reward instantly and the notice offers accessible replay and dismissal',()=>{
    const fixture=secretFixture(true),{secret,area,window,document}=fixture
    try {
        let focus=0
        const notice=discoveryNotice({document,window,focusWorld:()=>focus++})
        expect(notice.panel.hidden).toBe(true)
        area.interact()
        expect(secret.rangoli.visible).toBe(true);expect(secret.rangoli.scale.x).toBe(1)
        expect(secret.playing).toBe(false);expect(secret.particles.visible).toBe(false)
        expect(notice.panel.hidden).toBe(false)
        expect(notice.message.attributes['aria-live']).toBe('polite')
        expect(notice.message.textContent).toContain('Hidden garden discovered.')
        expect(notice.replay.disabled).toBe(true);window.cooldown();expect(notice.replay.disabled).toBe(false)
        fixture.time.elapsed=1000;notice.replay.dispatchEvent(new Event('click'))
        expect(secret.state.count).toBe(2);expect(focus).toBe(1)
        notice.dismiss.dispatchEvent(new Event('click'))
        expect(notice.panel.hidden).toBe(true);expect(focus).toBe(2)
    } finally {fixture.restore()}
})
