import { afterEach, beforeEach, expect, test } from 'bun:test'
import * as THREE from 'three'
import Controls from '../src/javascript/World/Controls.js'
import Area from '../src/javascript/World/Area.js'
import EventEmitter from '../src/javascript/Utils/EventEmitter.js'

class Element extends EventTarget {
    style = {}
    constructor(tagName = 'div', contentEditable = null) {
        super()
        this.tagName = tagName
        this.contentEditable = contentEditable
    }
    appendChild(child) { child.parentElement = this }
    getBoundingClientRect() { return { left: 10, top: 10, width: 170, height: 170 } }
    closest(selector) {
        const matches = selector.split(',').map(part => part.trim())
        if(matches.includes(this.tagName) || (this.contentEditable !== null && this.contentEditable !== 'false' && matches.includes('[contenteditable]:not([contenteditable="false"])'))) return this
        return this.parentElement?.closest(selector) || null
    }
}

let oldWindow, oldDocument, controls, time
beforeEach(() => {
    oldWindow = globalThis.window
    oldDocument = globalThis.document
    globalThis.window = new EventTarget()
    globalThis.document = new EventTarget()
    document.body = new Element('body')
    document.hidden = false
    document.dialogOpen = false
    document.createElement = tag => new Element(tag)
    document.querySelector = () => document.dialogOpen ? {} : null
    time = new EventEmitter()
    controls = new Controls({ config: {}, sizes: new EventEmitter(), time })
})
afterEach(() => {
    globalThis.window = oldWindow
    globalThis.document = oldDocument
})

function dispatch(target, type, properties = {}) {
    const event = new Event(type, { cancelable: true })
    for(const [key, value] of Object.entries(properties)) Object.defineProperty(event, key, { value })
    target.dispatchEvent(event)
    return event
}
function key(type, code, target = document.body) {
    return dispatch(document, type, { code, target })
}
function touch(target, type, identifier = 1) {
    return dispatch(target, type, { changedTouches: [{ identifier, clientX: 145, clientY: 125 }] })
}
function expectReleased() {
    expect(Object.values(controls.actions).every(value => value === false)).toBe(true)
}

for(const interruption of ['blur', 'hidden']) {
    test(`${interruption} releases held keys and active mobile controls immediately`, () => {
        controls.setTouch()
        for(const code of ['KeyW', 'KeyD', 'KeyS', 'KeyA', 'Space', 'ShiftLeft']) key('keydown', code)
        for(const name of ['joystick', 'boost', 'forward', 'brake', 'backward']) touch(controls.touch[name].$element, 'touchstart')
        time.trigger('tick')
        expect(controls.touch.joystick.$cursor.style.transform).not.toBe('translateX(0px) translateY(0px)')
        if(interruption === 'blur') dispatch(window, 'blur')
        else {
            document.hidden = true
            dispatch(document, 'visibilitychange')
        }
        expectReleased()
        expect(controls.touch.joystick.active).toBe(false)
        expect(controls.touch.joystick.$cursor.style.transform).toBe('translateX(0px) translateY(0px)')
        expect(controls.touch.joystick.$limit.style.opacity).toBe('0.25')
        for(const name of ['joystick', 'boost', 'forward', 'brake', 'backward']) {
            expect(controls.touch[name].touchIdentifier).toBe(null)
            if(name !== 'joystick') expect(controls.touch[name].$border.style.opacity).toBe('0.25')
        }
    })
}

test('losing focus before touch controls exist safely releases acceleration', () => {
    key('keydown', 'KeyW')
    expect(controls.actions.up).toBe(true)
    dispatch(window, 'blur')
    expectReleased()
})

test('key release still stops driving after a dialog opens or focus moves to its button', () => {
    for(const code of ['KeyW', 'KeyD', 'KeyS', 'KeyA', 'Space', 'ShiftLeft']) key('keydown', code)
    document.dialogOpen = true
    for(const code of ['KeyW', 'KeyD', 'KeyS', 'KeyA', 'Space', 'ShiftLeft']) key('keyup', code, new Element('button'))
    expectReleased()
})

test('typing in UI does not accelerate or reset the car, while driving keys still work on the world', () => {
    const resets = []
    controls.on('action', action => resets.push(action))
    for(const target of [new Element('button'), new Element('a'), new Element('input'), new Element('textarea'), new Element('select'), new Element('div', ''), new Element('div', 'true'), new Element('div', 'plaintext-only')]) {
        const child = new Element('span')
        target.appendChild(child)
        key('keydown', 'KeyW', child)
        key('keyup', 'KeyR', child)
        expectReleased()
    }
    document.dialogOpen = true
    key('keydown', 'KeyW')
    key('keyup', 'KeyR')
    expectReleased()
    expect(resets).toEqual([])
    document.dialogOpen = false
    key('keydown', 'KeyW')
    key('keyup', 'KeyR')
    expect(controls.actions.up).toBe(true)
    expect(resets).toEqual(['reset'])
})

test('touch cancellation releases each pedal and allows another press', () => {
    controls.setTouch()
    for(const [name, action] of [['boost', 'boost'], ['forward', 'up'], ['brake', 'brake'], ['backward', 'down']]) {
        const control = controls.touch[name]
        touch(control.$element, 'touchstart', 1)
        expect(controls.actions[action]).toBe(true)
        touch(document, 'touchcancel', 2)
        expect(controls.actions[action]).toBe(true)
        touch(document, 'touchcancel', 1)
        expectReleased()
        expect(control.touchIdentifier).toBe(null)
        expect(control.$border.style.opacity).toBe('0.25')
        touch(control.$element, 'touchstart', 3)
        expect(controls.actions[action]).toBe(true)
        touch(document, 'touchend', 3)
        expectReleased()
    }
})

test('joystick cancellation ends the gesture once and removes its move listener', () => {
    controls.setTouch()
    let endings = 0, moves = 0
    controls.on('joystickEnd', () => endings++)
    controls.on('joystickMove', () => moves++)
    touch(controls.touch.joystick.$element, 'touchstart', 1)
    touch(controls.touch.joystick.$element, 'touchstart', 2)
    touch(document, 'touchmove', 1)
    expect(moves).toBe(1)
    touch(document, 'touchcancel', 1)
    const staleMove = touch(document, 'touchmove', 1)
    touch(document, 'touchend', 1)
    expect(staleMove.defaultPrevented).toBe(false)
    expect(moves).toBe(1)
    expect(endings).toBe(1)
    expect(controls.touch.joystick.active).toBe(false)
    expect(controls.touch.joystick.touchIdentifier).toBe(null)
    touch(controls.touch.joystick.$element, 'touchstart', 3)
    expect(controls.touch.joystick.active).toBe(true)
    touch(document, 'touchend', 3)
    expect(endings).toBe(2)
})

test('select and editable UI cannot activate a nearby area using Enter', () => {
    let interactions = 0
    const area = {
        halfExtents: { x: 2, y: 2 }, container: new THREE.Group(), time,
        active: true, initialTestCar: true, containsCar: () => true,
        interact: () => interactions++,
    }
    Area.prototype.setInteractions.call(area)
    for(const target of [new Element('select'), new Element('div', ''), new Element('div', 'plaintext-only')]) {
        const child = new Element('span')
        target.appendChild(child)
        const event = dispatch(window, 'keydown', { key: 'Enter', target: child })
        expect(event.defaultPrevented).toBe(false)
    }
    expect(interactions).toBe(0)
    const event = dispatch(window, 'keydown', { key: 'Enter', target: document.body })
    expect(event.defaultPrevented).toBe(true)
    expect(interactions).toBe(1)
})
