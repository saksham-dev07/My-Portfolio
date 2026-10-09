import { expect, test } from 'bun:test'
import CANNON from 'cannon'
import { readFileSync } from 'node:fs'
import BowlingGame, { BowlingRound, bowlingRules, pinIsDown, resetBowlingBody } from '../src/javascript/World/Activities/BowlingGame.js'
import EventEmitter from '../src/javascript/Utils/EventEmitter.js'

function collision(body) {
    return {body,origin:{position:body.position.clone(),quaternion:body.quaternion.clone(),sleep:true}}
}

function assetNodes(name) {
    const buffer=readFileSync(new URL(`../static/models/${name}/collision.glb`,import.meta.url))
    return JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString()).nodes
}

const pinNodes=assetNodes('bowlingPin'),ballNodes=assetNodes('bowlingBall')

function pinBody(material) {
    const body=new CANNON.Body({mass:.1,material}),center=pinNodes.find(node=>node.name==='center').translation
    for(const node of pinNodes.filter(node=>node.name.startsWith('Cylinder'))) {
        body.addShape(new CANNON.Cylinder(node.scale[0],node.scale[0],node.scale[2],8),new CANNON.Vec3(node.translation[0]-center[0],node.translation[1]-center[1],node.translation[2]-center[2]))
    }
    body.position.z=center[2]+.1;body.allowSleep=true;body.sleepSpeedLimit=.01
    return body
}

function fixture() {
    const world=new CANNON.World();world.gravity.set(0,0,-13);world.allowSleep=true
    const floor=new CANNON.Material(),dummy=new CANNON.Material()
    world.addContactMaterial(new CANNON.ContactMaterial(floor,dummy,{friction:.05,restitution:.3,contactEquationStiffness:1000}))
    world.addContactMaterial(new CANNON.ContactMaterial(dummy,dummy,{friction:.5,restitution:.3,contactEquationStiffness:1000}))
    world.addBody(new CANNON.Body({mass:0,shape:new CANNON.Plane(),material:floor}))
    const pins=[]
    for(let row=0;row<4;row++) for(let column=0;column<4-row;column++) {
        const body=pinBody(dummy)
        body.position.x=-48+row*.65;body.position.y=column-1.5+row*.5
        world.addBody(body);body.sleep();pins.push({collision:collision(body)})
    }
    const sphere=ballNodes.find(node=>node.name==='Sphere'),center=ballNodes.find(node=>node.name==='center').translation
    const ballBody=new CANNON.Body({mass:1,shape:new CANNON.Sphere(sphere.scale[0]),material:dummy})
    ballBody.position.set(-28,-30,center[2]);ballBody.quaternion.setFromEuler(Math.PI*.5,0,0)
    // The rack is authored around y=-30, as in PlaygroundSection.
    for(const pin of pins) {pin.collision.body.position.y-=30;pin.collision.origin.position.y-=30}
    world.addBody(ballBody);ballBody.sleep()
    const ball={collision:collision(ballBody)},carBody=new CANNON.Body({mass:40,shape:new CANNON.Box(new CANNON.Vec3(1,.5,.5)),material:dummy})
    world.addBody(carBody)
    const physics={world,lastSafePosition:new CANNON.Vec3(),car:{chassis:{body:carBody},oldPosition:new CANNON.Vec3(),brakeLocked:false}}
    const time=new EventEmitter();time.delta=1000/60;time.elapsed=0
    const events=new EventTarget(),document=new EventTarget();document.hidden=false;document.querySelector=()=>null
    const updates=[];events.addEventListener('drive-activity-update',event=>updates.push(event.detail))
    const game=new BowlingGame({time,physics,pins,ball,eventTarget:events,document})
    const tick=(frames=1)=>{for(let i=0;i<frames;i++) {world.step(1/60);time.elapsed+=time.delta;time.trigger('tick')}}
    return {world,physics,pins,ball,time,events,document,updates,game,tick}
}

test('pin scoring uses physics tilt and displacement, preserving each knockdown through rebounds',()=>{
    const body=new CANNON.Body(),origin={position:new CANNON.Vec3(),quaternion:new CANNON.Quaternion()}
    expect(pinIsDown(body,origin)).toBe(false)
    body.position.set(.4,0,0);expect(pinIsDown(body,origin)).toBe(false)
    body.position.x=.56;expect(pinIsDown(body,origin)).toBe(true)
    body.position.set(0,0,0);body.quaternion.setFromEuler(1,0,0);expect(pinIsDown(body,origin)).toBe(true)
    const round=new BowlingRound();round.roll()
    round.update(.2,[true,false,false],false)
    round.update(.2,[false,false,false],false)
    expect(round.knocked.size).toBe(1)
    expect(round.attempts).toHaveLength(0)
})

test('a roll has a settling window and a hard timeout, with exactly three scored attempts',()=>{
    const round=new BowlingRound()
    expect(round.next()).toBe(false);expect(round.roll()).toBe(true);expect(round.roll()).toBe(false)
    round.update(2,[true,false,false],true)
    expect(round.phase).toBe('rolling')
    round.update(.5,[true,false,false],true);expect(round.attempts).toEqual([1])
    expect(round.next()).toBe(true);round.roll()
    round.update(8.9,Array(10).fill(true),false);expect(round.phase).toBe('rolling')
    round.update(.1,Array(10).fill(true),false);expect(round.attempts).toEqual([1,10])
    round.next();round.roll();round.update(9,Array(10).fill(false),false)
    expect(round.total).toBe(11);expect(round.attempts).toEqual([1,10,0])
    expect(round.next()).toBe(false);expect(round.roll()).toBe(false)
})

test('rack reset clears every residual velocity, force and interpolated pose',()=>{
    const body=new CANNON.Body({mass:1}),item=collision(body)
    body.position.set(4,5,6);body.quaternion.setFromEuler(1,2,3)
    for(const name of ['velocity','angularVelocity','force','torque']) body[name].set(4,5,6)
    resetBowlingBody(item)
    expect(body.position.almostEquals(item.origin.position)).toBe(true)
    expect(body.quaternion.toArray()).toEqual(item.origin.quaternion.toArray())
    expect(body.previousPosition.toArray()).toEqual(item.origin.position.toArray())
    expect(body.interpolatedQuaternion.toArray()).toEqual(item.origin.quaternion.toArray())
    for(const name of ['velocity','angularVelocity','force','torque']) expect(body[name].length()).toBe(0)
    expect(body.sleepState).toBe(CANNON.Body.SLEEPING)
})

test('assisted rolling produces real Cannon knockdowns and reuses the rack across the complete game',()=>{
    const f=fixture(),{game,world,ball,pins,physics,tick}=f,bodyCount=world.bodies.length
    try {
        expect(game.start()).toBe(true);expect(game.start()).toBe(false)
        expect(physics.car.chassis.body.position.toArray()).toEqual([-24.5,-30,.6])
        const forward=physics.car.chassis.body.quaternion.vmult(new CANNON.Vec3(1,0,0))
        expect(forward.x).toBeCloseTo(-1,6);expect(forward.y).toBeCloseTo(0,6)
        expect(game.handleAction('roll')).toBe(true)
        tick(600)
        expect(game.round.phase).toBe('result')
        expect(game.round.attempts[0]).toBeGreaterThanOrEqual(4)
        expect(ball.collision.body.position.x).toBeLessThan(-40)
        expect(game.snapshot().actions[0].id).toBe('next')
        for(let attempt=1;attempt<3;attempt++) {
            expect(game.handleAction('next')).toBe(true)
            expect(pins.every(pin=>pin.collision.body.position.almostEquals(pin.collision.origin.position))).toBe(true)
            expect(game.handleAction('roll')).toBe(true);tick(600)
        }
        expect(game.round.attempts).toHaveLength(3);expect(game.snapshot().actions[0].id).toBe('replay')
        expect(game.round.total).toBeGreaterThanOrEqual(12)
        expect(world.bodies).toHaveLength(bodyCount)
        expect(game.handleAction('next')).toBe(false)
        expect(game.handleAction('replay')).toBe(true)
        expect(game.round.total).toBe(0);expect(game.round.phase).toBe('ready')
        expect(world.bodies).toHaveLength(bodyCount)
    } finally {game.dispose()}
})

test('natural car pushes start scoring, and all three pause boundaries freeze the local simulation',()=>{
    const f=fixture(),{game,ball,physics,document,tick}=f
    try {
        game.start();ball.collision.body.wakeUp();ball.collision.body.velocity.set(-4,0,0);tick()
        expect(game.round.phase).toBe('rolling')
        for(const reason of ['hidden','dialog','brake']) {
            if(reason==='hidden') document.hidden=true
            if(reason==='dialog') document.querySelector=()=>({open:true})
            if(reason==='brake') physics.car.brakeLocked=true
            game.syncPause()
            const pausedAt=game.round.elapsed,position=ball.collision.body.position.clone()
            tick(120)
            expect(game.round.elapsed).toBe(pausedAt)
            expect(ball.collision.body.position.toArray()).toEqual(position.toArray())
            expect(game.handleAction('roll')).toBe(false)
            document.hidden=false;document.querySelector=()=>null;physics.car.brakeLocked=false
            tick()
            expect(game.round.elapsed).toBeGreaterThan(pausedAt)
        }
    } finally {game.dispose()}
})

test('aim stays bounded, live scores announce at most ten times a second, and leaving restores body ownership',()=>{
    const f=fixture(),{game,pins,ball,updates,time}=f,linear=ball.collision.body.linearDamping,angular=ball.collision.body.angularDamping
    try {
        expect(game.handleAction('roll')).toBe(false)
        game.start()
        for(let i=0;i<10;i++) game.handleAction('aim-left')
        expect(game.aim).toBe(-2)
        for(let i=0;i<20;i++) game.handleAction('aim-right')
        expect(game.aim).toBe(2)
        game.handleAction('roll');expect(ball.collision.body.velocity.toArray()).toEqual([-9,.9,0])
        updates.length=0
        for(let i=0;i<10;i++) {
            pins[i].collision.body.quaternion.setFromEuler(1,0,0)
            time.delta=10;game.tick()
        }
        expect(updates.length).toBeLessThanOrEqual(1)
        time.delta=100;game.tick();expect(updates.at(-1).knocked).toBe(10)
        expect(game.stop()).toBe(true);expect(game.stop()).toBe(false)
        expect(ball.collision.body.linearDamping).toBe(linear);expect(ball.collision.body.angularDamping).toBe(angular)
        for(const item of [...pins,ball]) {
            expect(item.collision.body.position.almostEquals(item.collision.origin.position)).toBe(true)
            expect(item.collision.body.velocity.length()).toBe(0)
        }
        const eventCount=updates.length;time.trigger('tick');expect(updates).toHaveLength(eventCount)
        expect(game.snapshot().active).toBe(false)
        expect(bowlingRules.attempts).toBe(3)
    } finally {game.dispose()}
})
