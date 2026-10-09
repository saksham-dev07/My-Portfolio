import { surfaceHeight } from '../LandscapeLayout.js'

export const bowlingRules = Object.freeze({ attempts: 3, pinCount: 10, minimumRoll: 2.5, quietPeriod: .7, maximumRoll: 9, tiltCosine: .65, pinDisplacement: .55 })

function up(quaternion) {
    const {x,y,z,w}=quaternion
    return {x:2*(x*z+w*y),y:2*(y*z-w*x),z:1-2*(x*x+y*y)}
}

// Read the body, never the interpolated render mesh. A pin counts once when it
// tips or leaves its spot, even if a later collision bounces it upright again.
export function pinIsDown(body,origin) {
    const current=up(body.quaternion),initial=up(origin.quaternion)
    const alignment=current.x*initial.x+current.y*initial.y+current.z*initial.z
    return alignment<bowlingRules.tiltCosine || Math.hypot(body.position.x-origin.position.x,body.position.y-origin.position.y)>bowlingRules.pinDisplacement || body.position.z<origin.position.z-.25
}

export class BowlingRound {
    constructor() {this.reset()}
    reset() {this.phase='ready';this.attempts=[];this.total=0;this.knocked=new Set();this.elapsed=0;this.quiet=0}
    roll() {
        if(this.phase!=='ready') return false
        this.phase='rolling';this.elapsed=0;this.quiet=0;this.knocked.clear()
        return true
    }
    update(delta,pins,quiet) {
        if(this.phase!=='rolling') return false
        this.elapsed+=delta
        pins.forEach((down,index)=>{if(down) this.knocked.add(index)})
        this.quiet=quiet ? this.quiet+delta : 0
        if(this.elapsed<bowlingRules.maximumRoll && (this.elapsed<bowlingRules.minimumRoll || this.quiet<bowlingRules.quietPeriod)) return false
        const score=Math.min(bowlingRules.pinCount,this.knocked.size)
        this.attempts.push(score);this.total+=score;this.phase='result'
        return true
    }
    next() {
        if(this.phase!=='result' || this.attempts.length>=bowlingRules.attempts) return false
        this.phase='ready';this.knocked.clear();this.elapsed=0;this.quiet=0
        return true
    }
}

const zero=vector=>vector?.set(0,0,0)
const copy=(target,source)=>{if(target && source) target.copy(source)}

export function resetBowlingBody(collision) {
    const body=collision.body
    body.position.copy(collision.origin.position);body.quaternion.copy(collision.origin.quaternion)
    copy(body.previousPosition,body.position);copy(body.interpolatedPosition,body.position)
    copy(body.previousQuaternion,body.quaternion);copy(body.interpolatedQuaternion,body.quaternion)
    zero(body.velocity);zero(body.angularVelocity);zero(body.force);zero(body.torque)
    body.aabbNeedsUpdate=true
    if(collision.origin.sleep) body.sleep()
    else body.wakeUp()
}

function bodyState(body) {
    return {
        position:body.position.clone(),quaternion:body.quaternion.clone(),velocity:body.velocity.clone(),angularVelocity:body.angularVelocity.clone(),force:body.force.clone(),torque:body.torque.clone(),sleepState:body.sleepState,
    }
}

function capture(body,state) {
    for(const name of ['position','quaternion','velocity','angularVelocity','force','torque']) state[name].copy(body[name])
    state.sleepState=body.sleepState
}

function restore(body,state) {
    for(const name of ['position','quaternion','velocity','angularVelocity','force','torque']) body[name].copy(state[name])
    copy(body.previousPosition,body.position);copy(body.interpolatedPosition,body.position)
    copy(body.previousQuaternion,body.quaternion);copy(body.interpolatedQuaternion,body.quaternion)
    body.aabbNeedsUpdate=true
    if(state.sleepState===2) body.sleep()
    else body.wakeUp()
}

export default class BowlingGame {
    constructor({time,physics,pins,ball,eventTarget=window,document:documentRef=document}) {
        this.id='bowling';this.time=time;this.physics=physics;this.pins=pins;this.ball=ball
        this.events=eventTarget;this.document=documentRef;this.round=new BowlingRound()
        this.active=false;this.paused=false;this.aim=0;this.announceElapsed=0;this.lastAnnouncedKnocked=0
        this.collisions=[...pins.map(pin=>pin.collision),ball.collision]
        this.pauseStates=this.collisions.map(collision=>bodyState(collision.body))
        this.savedDamping={linear:ball.collision.body.linearDamping,angular:ball.collision.body.angularDamping}
        const origin=ball.collision.origin.position
        this.spawn={x:origin.x+3.5,y:origin.y,z:surfaceHeight(origin.x+3.5,origin.y)+.6,angle:Math.PI}
        this.focus={x:(origin.x+pins[0].collision.origin.position.x)/2,y:origin.y,z:.6}
        this.onPreStep=()=>this.syncPause()
        physics.world?.addEventListener('preStep',this.onPreStep)
        this.onVisibility=()=>this.syncPause()
        documentRef.addEventListener?.('visibilitychange',this.onVisibility)
        time.on('tick.bowlingGame',()=>this.tick())
    }

    resetRack() {for(const collision of this.collisions) resetBowlingBody(collision)}

    placeCar() {
        const car=this.physics.car,body=car.chassis.body,{x,y,z,angle}=this.spawn
        body.position.set(x,y,z);body.quaternion.setFromEuler(0,0,angle)
        zero(body.velocity);zero(body.angularVelocity);zero(body.force);zero(body.torque)
        copy(body.previousPosition,body.position);copy(body.interpolatedPosition,body.position)
        copy(body.previousQuaternion,body.quaternion);copy(body.interpolatedQuaternion,body.quaternion)
        copy(car.oldPosition,body.position);copy(this.physics.lastSafePosition,body.position)
        car.speed=0;car.forwardSpeed=0;car.steering=0;body.aabbNeedsUpdate=true;body.wakeUp()
        const vehicle=car.vehicle
        if(vehicle) for(let i=0;i<vehicle.wheelInfos.length;i++) {
            vehicle.applyEngineForce(0,i);vehicle.setSteeringValue(0,i);vehicle.updateWheelTransform(i)
            const wheel=car.wheels?.bodies?.[i],pose=vehicle.wheelInfos[i].worldTransform
            if(wheel) {
                wheel.position.copy(pose.position);wheel.quaternion.copy(pose.quaternion)
                copy(wheel.previousPosition,wheel.position);copy(wheel.interpolatedPosition,wheel.position)
                copy(wheel.previousQuaternion,wheel.quaternion);copy(wheel.interpolatedQuaternion,wheel.quaternion)
                zero(wheel.velocity);zero(wheel.angularVelocity);zero(wheel.force);zero(wheel.torque)
            }
        }
    }

    start() {
        if(this.active) {this.emit();return false}
        this.active=true;this.paused=false;this.aim=0;this.round.reset();this.resetRack();this.placeCar()
        // Slightly reduce the legacy ball drag for a readable single roll;
        // restore both values when leaving the activity.
        this.ball.collision.body.linearDamping=.025;this.ball.collision.body.angularDamping=.025
        this.emit();return true
    }

    stop() {
        if(!this.active) return false
        this.active=false;this.paused=false;this.resetRack()
        this.ball.collision.body.linearDamping=this.savedDamping.linear
        this.ball.collision.body.angularDamping=this.savedDamping.angular
        return true
    }

    isPaused() {return Boolean(this.document.hidden || this.document.querySelector?.('dialog[open]') || this.physics.car.brakeLocked)}

    syncPause() {
        if(!this.active) return
        const paused=this.isPaused()
        if(paused && !this.paused) this.collisions.forEach((collision,index)=>capture(collision.body,this.pauseStates[index]))
        if(!paused && this.paused) this.collisions.forEach((collision,index)=>restore(collision.body,this.pauseStates[index]))
        this.paused=paused
        if(paused) this.collisions.forEach((collision,index)=>{
            const body=collision.body,state=this.pauseStates[index]
            body.position.copy(state.position);body.quaternion.copy(state.quaternion)
            zero(body.velocity);zero(body.angularVelocity);zero(body.force);zero(body.torque);body.sleep()
        })
    }

    handleAction(action) {
        if(!this.active) return false
        this.syncPause();if(this.paused) return false
        if(action==='roll' && this.round.roll()) {
            const body=this.ball.collision.body,vy=this.aim*.45
            body.wakeUp();body.velocity.set(-9,vy,0)
            const radius=body.shapes.find(shape=>typeof shape.radius==='number')?.radius || .6
            body.angularVelocity.set(-vy/radius,-9/radius,0)
            this.emit();return true
        }
        if((action==='aim-left' || action==='aim-right') && this.round.phase==='ready') {
            this.aim=Math.min(2,Math.max(-2,this.aim+(action==='aim-left' ? -1 : 1)))
            this.emit();return true
        }
        if(action==='next' && this.round.next()) {this.resetRack();this.placeCar();this.aim=0;this.emit();return true}
        if(action==='replay' && this.round.phase==='result' && this.round.attempts.length===bowlingRules.attempts) {
            this.round.reset();this.resetRack();this.placeCar();this.aim=0;this.emit();return true
        }
        return false
    }

    tick() {
        if(!this.active) return
        this.syncPause();if(this.paused) return
        const body=this.ball.collision.body,origin=this.ball.collision.origin.position
        if(this.round.phase==='ready' && (Math.hypot(body.velocity.x,body.velocity.y)>.65 || Math.hypot(body.position.x-origin.x,body.position.y-origin.y)>.45)) {this.round.roll();this.emit()}
        if(this.round.phase!=='rolling') return
        const delta=Math.min(.06,Math.max(0,this.time.delta*.001))
        const quiet=this.collisions.every(collision=>collision.body.velocity.length()<.2 && collision.body.angularVelocity.length()<.3)
        const finished=this.round.update(delta,this.pins.map(pin=>pinIsDown(pin.collision.body,pin.collision.origin)),quiet)
        this.announceElapsed+=delta
        if(finished || (this.lastAnnouncedKnocked!==this.round.knocked.size && this.announceElapsed>=.1)) this.emit()
    }

    snapshot() {
        const round=this.round,complete=round.attempts.length===bowlingRules.attempts
        const attempt=Math.min(bowlingRules.attempts,round.attempts.length+(round.phase==='result' ? 0 : 1))
        const last=round.attempts.at(-1)
        let message='Nudge the ball with your car, or aim and roll. Three fresh racks, thirty possible pins.'
        let actions=[]
        if(round.phase==='ready') {
            const aim=this.aim===0 ? 'center' : `${Math.abs(this.aim)} step${Math.abs(this.aim)>1 ? 's' : ''} ${this.aim<0 ? 'left' : 'right'}`
            message=`Aim: ${aim}. Roll the ball or push it with your car.`
            actions=[{id:'aim-left',label:'Aim left'},{id:'roll',label:'Roll ball'},{id:'aim-right',label:'Aim right'}]
        } else if(round.phase==='rolling') message='Let it roll. Your score settles with the pins.'
        else {
            message=last===10 ? 'Strike. A clean sweep!' : last===0 ? 'A practice roll. Adjust your aim and try again.' : `${last} pin${last===1 ? '' : 's'} down. Nicely played.`
            if(complete) message+=round.total>=24 ? ' Maidan champion.' : ' Your three-roll run is complete.'
            actions=[complete ? {id:'replay',label:'Play again'} : {id:'next',label:'Next roll'}]
        }
        return {id:this.id,title:'Maidan Bowling',active:this.active,phase:round.phase,message,scoreText:`${round.total} / 30 points | Roll ${attempt} of 3${round.phase==='rolling' ? ` | ${round.knocked.size} pins down` : ''}`,actions,attempt,total:round.total,knocked:round.knocked.size,attempts:[...round.attempts],aim:this.aim,focus:this.focus,spawn:this.spawn}
    }

    emit() {this.announceElapsed=0;this.lastAnnouncedKnocked=this.round.knocked.size;this.events.dispatchEvent(new CustomEvent('drive-activity-update',{detail:this.snapshot()}))}

    dispose() {
        this.stop();this.time.off('tick.bowlingGame')
        this.physics.world?.removeEventListener('preStep',this.onPreStep)
        this.document.removeEventListener?.('visibilitychange',this.onVisibility)
    }
}
