import { expect, test } from 'bun:test'
import * as THREE from 'three'
import CANNON from 'cannon'
import Camera from '../src/javascript/Camera.js'
import Physics from '../src/javascript/World/Physics.js'
import EventEmitter from '../src/javascript/Utils/EventEmitter.js'

function vehicle() {
    const time = new EventEmitter(), controls = new EventEmitter()
    time.delta = 16
    controls.actions = { up: false, down: false, left: false, right: false, brake: false, boost: false }
    const physics = {
        config: {}, time, controls, world: new CANNON.World(),
        models: { container: new THREE.Group() },
        materials: { items: { wheel: new CANNON.Material() } },
        sounds: { play() {} }
    }
    Physics.prototype.setCar.call(physics)
    return { physics, time, controls }
}

test('R reset recreates the vehicle while auto-follow reads its live chassis', () => {
    const { physics, time, controls } = vehicle()
    const oldBody = physics.car.chassis.body
    const camera = Object.assign(Object.create(Camera.prototype), {
        car: physics.car, carBody: oldBody, time,
        driving: false, stationaryTime: 0, following: false, exploring: false,
        orbitControls: { enabled: false },
        focusCar() { this.following = true }
    })
    controls.trigger('action', ['reset'])
    const currentBody = physics.car.chassis.body
    expect(currentBody).not.toBe(oldBody)
    expect(physics.world.bodies.includes(oldBody)).toBe(false)
    expect(camera.getCarBody()).toBe(currentBody)
    oldBody.velocity.set(0, 0, 0)
    currentBody.velocity.set(4, 0, 0)
    camera.updateDriving()
    expect(camera.driving).toBe(true)
    expect(camera.following).toBe(true)
    // Once stopped, a manual exploration remains held even if the old body moves.
    currentBody.velocity.set(0, 0, 0)
    time.delta = 60
    for(let i = 0; i < 6; i++) camera.updateDriving()
    camera.following = false
    oldBody.velocity.set(6, 0, 0)
    camera.updateDriving()
    expect(camera.driving).toBe(false)
    expect(camera.following).toBe(false)
})

test('map brake persists across frames and keyboard release until the dialog closes', () => {
    const { physics, time, controls } = vehicle()
    const brakes = () => physics.car.vehicle.wheelInfos.map(wheel => wheel.brake)
    physics.car.brake()
    for(let i = 0; i < 12; i++) time.trigger('tick')
    expect(brakes()).toEqual(Array(4).fill(physics.car.options.controlsBrakeStrength))
    // A Space key release during a dialog must not release its parking brake.
    controls.actions.brake = false
    time.trigger('tick')
    expect(brakes().every(value => value > 0)).toBe(true)
    // A recreated vehicle also retains the external lock.
    controls.trigger('action', ['reset'])
    time.trigger('tick')
    expect(brakes().every(value => value > 0)).toBe(true)
    physics.car.unbrake()
    time.trigger('tick')
    expect(brakes()).toEqual([0, 0, 0, 0])
    // Ordinary Space braking and release still work after returning to the world.
    controls.actions.brake = true
    time.trigger('tick')
    expect(brakes().every(value => value > 0)).toBe(true)
    controls.actions.brake = false
    time.trigger('tick')
    expect(brakes()).toEqual([0, 0, 0, 0])
})
