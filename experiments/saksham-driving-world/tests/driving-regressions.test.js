import { test, expect } from 'bun:test'
import * as THREE from 'three'
import CANNON from 'cannon'
import IntroSection from '../src/javascript/World/Sections/IntroSection.js'
import Car from '../src/javascript/World/Car.js'
import { stabilizeGround } from '../src/javascript/World/GroundLayers.js'
import { captureVehiclePose } from '../src/javascript/World/VehiclePose.js'
import { landscapeSigns, roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'
import { educationStops } from '../src/javascript/World/Sections/ProfilePaths.js'
import Time from '../src/javascript/Utils/Time.js'
import DirectionSigns from '../src/javascript/World/Sections/DirectionSigns.js'

test('the intro reveal updates the material actually rendered by both instruction labels', () => {
    const intro={config:{touch:false},container:new THREE.Group(),objects:{add:()=>({})},resources:{items:{
        introInstructionsArrowsTexture:new THREE.Texture(),introInstructionsOtherTexture:new THREE.Texture(),
        introInstructionsLabels:{scene:{children:[{name:'arrows',geometry:new THREE.PlaneGeometry(7,2)}]}},
        introArrowKeyBase:{scene:{}},introArrowKeyCollision:{scene:{}},hornBase:{scene:{}},hornCollision:{scene:{}},
    }}}
    IntroSection.prototype.setInstructions.call(intro)
    IntroSection.prototype.setOtherInstructions.call(intro)
    stabilizeGround(intro.container)
    for(const label of [intro.instructions.arrows.label,intro.otherInstructions.label]) {
        label.material.opacity=1 // The existing reveal tween owns this reference.
        expect(label.mesh.material.opacity).toBe(1)
        expect(label.mesh.material).toBe(label.material)
        expect(label.mesh.material.polygonOffset).toBe(true)
    }
})

test('the vehicle renders between fixed physics steps instead of repeating poses', () => {
    const world=new CANNON.World(),body=new CANNON.Body({mass:1})
    body.position.set(0,0,2);body.velocity.set(6,0,0);body.linearDamping=0;world.addBody(body)
    captureVehiclePose(body)
    world.addEventListener('preStep',()=>captureVehiclePose(body))
    const callbacks=[]
    const car={models:{chassis:{scene:{children:[]}}},objects:{getConvertedMesh:()=>new THREE.Group()},
        physics:{world,car:{chassis:{body}}},container:new THREE.Group(),shadows:{add:()=>{}},time:{on:(_,callback)=>callbacks.push(callback)},transformControls:{enabled:false},position:new THREE.Vector3()}
    Car.prototype.setChassis.call(car)
    const positions=[]
    for(let frame=0;frame<40;frame++) {
        world.step(1/60,1/144,5)
        callbacks.forEach(callback=>callback())
        if(frame>8) positions.push(car.chassis.object.position.x)
    }
    expect(positions.every((x,i)=>i===0||x>positions[i-1])).toBe(true)
    expect(Math.max(...positions.slice(1).map((x,i)=>x-positions[i]))).toBeLessThan(.05)
})

test('journey arrow boards point to nearby matching stops with poles outside the road', () => {
    const boards=landscapeSigns.filter(sign=>sign.target)
    expect(boards).toHaveLength(educationStops.length)
    for(const board of boards) {
        expect(board.text).toBe(board.target.title)
        expect(board.right).toBe(true)
        expect(board.angle).toBe(0)
        expect(board.y).toBe(board.target.y)
        expect(board.target.x-board.x).toBeGreaterThan(4)
        expect(board.target.x-board.x).toBeLessThan(6)
        for(const dx of [-.225,.225]) for(const dy of [-.225,.225]) expect(roadEdgeDistance(board.x+dx,board.y+dy)).toBeGreaterThan(.3)
    }
})

test('both faces of turned direction boards keep raised lettering upright and front-facing',()=>{
    const template=new THREE.Group(),container=new THREE.Group()
    const board=new THREE.Mesh(new THREE.BoxGeometry(.3,8,1));board.name='shadeWhite084';board.position.z=3.4
    const pole=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,3));pole.name='shadeBrown004';pole.position.z=1.5
    template.add(board,pole)
    const signs=new DirectionSigns(template,container,[],[0,Math.PI/2].map((angle,i)=>({text:'SKILLS',x:i*10,y:0,angle,right:!!i})))
    container.updateMatrixWorld(true)
    for(const group of signs.items) for(const label of group.children.filter(node=>node.name.startsWith('Raised lettering'))) {
        const side=Number(label.name.split(' / ').at(-1))
        const up=new THREE.Vector3(0,1,0).transformDirection(label.matrixWorld)
        const normal=new THREE.Vector3(0,0,1).transformDirection(label.matrixWorld)
        const expected=new THREE.Vector3(0,side,0).applyAxisAngle(new THREE.Vector3(0,0,1),group.rotation.z)
        expect(up.z).toBeCloseTo(1,6)
        expect(normal.dot(expected)).toBeCloseTo(1,6)
    }
})

test('camera and shadows finish updating before a frame is rendered', () => {
    const events=[]
    const clock={tick:()=>{},current:Date.now()-16,start:Date.now()-100,trigger:phase=>events.push(phase)}
    const previous=globalThis.window
    globalThis.window={requestAnimationFrame:()=>1}
    try { Time.prototype.tick.call(clock) } finally { globalThis.window=previous }
    expect(events).toEqual(['tick','afterTick','render'])
})
