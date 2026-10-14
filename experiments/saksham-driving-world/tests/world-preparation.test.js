import {test,expect} from 'bun:test'
import WorldPreparation from '../src/javascript/Utils/WorldPreparation.js'
import {vergeRoadClearance} from '../src/javascript/World/RoadClearance.js'
import {roadEdgeDistance,landscapeBounds} from '../src/javascript/World/LandscapeLayout.js'
import World from '../src/javascript/World/index.js'
import EventEmitter from '../src/javascript/Utils/EventEmitter.js'
import * as CANNON from 'cannon-es'
import gsap from 'gsap'

test('the real world Enter method never builds the scene and cannot run before shader warm-up',async()=>{
    const previousWindow=globalThis.window,calls=[],resources=new EventEmitter()
    let ready=0,compileStarted=false,finishCompile
    resources.on('worldReady',()=>ready++)
    const compile=new Promise(resolve=>{finishCompile=resolve})
    const world=Object.assign(Object.create(World.prototype),{
        resources,container:{visible:true},camera:{pan:{enable(){}},instance:{}},scene:{},controls:{},physics:{car:{}},
        prepareCore:()=>calls.push('core'),setSections:()=>calls.push('sections'),prepareLandscape:()=>calls.push('landscape'),
        prepareScenery:()=>calls.push('scenery'),landscape:{meadow:{prepareScatter:async()=>calls.push('grass'),load:()=>calls.push('grass-load')}},
        renderer:{compileAsync:()=>{compileStarted=true;return compile}},time:{trigger:()=>calls.push('render')},
    })
    globalThis.window={setTimeout:()=>0}
    try{
        expect(world.start()).toBe(false);expect(calls).toHaveLength(0)
        const preparation=world.prepare();expect(world.prepare()).toBe(preparation)
        while(!compileStarted)await new Promise(resolve=>setTimeout(resolve,0))
        expect(world.start()).toBe(false);expect(ready).toBe(0)
        finishCompile();expect(await preparation).toBe(true);expect(ready).toBe(1)
        const count=calls.length;expect(world.start()).toBe(true);expect(world.start()).toBe(false)
        expect(calls).toHaveLength(count);expect(world.camera.car).toBe(world.physics.car)
    }finally{globalThis.window=previousWindow}
})

test('the real reveal wakes the parked car without relocating it into the sky or hiding its model',()=>{
    const previousWindow=globalThis.window,body=new CANNON.Body({mass:40})
    body.position.set(0,0,.35);body.previousPosition.copy(body.position);body.sleep()
    const world={time:new EventEmitter(),physics:{car:{chassis:{body}}},shadows:{alpha:0},sections:{},controls:{},
        sounds:{engine:{volume:{master:0}},play(){}},materials:{shades:{items:{}}},objects:{floorShadows:[]}}
    globalThis.window={setTimeout:()=>0}
    try{
        World.prototype.setReveal.call(world);world.reveal.go()
        expect(body.position.z).toBe(.35);expect(body.previousPosition.z).toBe(.35);expect(body.sleepState).toBe(0)
        expect(world.reveal.matcapsProgress).toBe(1)
    }finally{gsap.killTweensOf(world.shadows);gsap.killTweensOf(world.sounds.engine.volume);globalThis.window=previousWindow}
})

test('scene preparation yields between stages and waits for shader readiness before enabling entry',async()=>{
    const calls=[],progress=[]
    let finishLighting
    const lighting=new Promise(resolve=>{finishLighting=resolve})
    const preparation=new WorldPreparation({yieldTask:async()=>{calls.push('yield')},onProgress:state=>progress.push(state.progress),steps:[
        {message:'scene',run:()=>calls.push('scene')},
        {message:'lighting',run:()=>{calls.push('lighting');return lighting}},
    ]})
    const first=preparation.prepare(),second=preparation.prepare()
    expect(first).toBe(second);expect(preparation.ready).toBe(false);expect(calls).toEqual(['yield'])
    for(let i=0;i<8;i++)await Promise.resolve()
    expect(calls).toEqual(['yield','scene','yield','lighting']);expect(preparation.ready).toBe(false)
    finishLighting();expect(await first).toBe(true);expect(preparation.ready).toBe(true);expect(progress.at(-1)).toBe(1)
    expect(await preparation.prepare()).toBe(true);expect(calls.filter(p=>p==='scene')).toHaveLength(1)
})

test('navigation away cancels pending setup and a failed warmup never marks the world ready',async()=>{
    let cancelled=false,called=0
    const aborted=new WorldPreparation({yieldTask:async()=>{cancelled=true},cancelled:()=>cancelled,steps:[{run:()=>called++}]})
    expect(await aborted.prepare()).toBe(false);expect(called).toBe(0);expect(aborted.ready).toBe(false)
    const failed=new WorldPreparation({yieldTask:async()=>{},steps:[{run:()=>{throw new Error('warmup failed')}}]})
    await expect(failed.prepare()).rejects.toThrow('warmup failed')
    expect(failed.ready).toBe(false);expect(failed.state).toBe('error')
})

test('local verge queries preserve the original road paint distance, including the analytic roundabout',()=>{
    const b=landscapeBounds
    for(let x=b.minX;x<=b.maxX;x+=8)for(let y=b.minY;y<=b.maxY;y+=8){
        expect(vergeRoadClearance(x,y)).toBeCloseTo(Math.min(4,roadEdgeDistance(x,y)),8)
    }
    for(let i=0;i<120;i++){
        const angle=i*Math.PI/60
        for(const radius of [5,8,10,12,15]){
            const x=Math.cos(angle)*radius,y=-30+Math.sin(angle)*radius
            expect(vergeRoadClearance(x,y)).toBeCloseTo(Math.min(4,roadEdgeDistance(x,y)),8)
        }
    }
})
