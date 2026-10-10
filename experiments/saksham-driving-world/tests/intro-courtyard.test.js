import { expect, test } from 'bun:test'
import * as THREE from 'three'
import IntroSection, { introPropOffset } from '../src/javascript/World/Sections/IntroSection.js'
import { introLayout } from '../src/javascript/World/Sections/IntroLayout.js'
import Walls from '../src/javascript/World/Walls.js'

function createIntro(keyCollisionScene = new THREE.Group()) {
    const calls = [], collisions = [], tileRuns = [], removed = []
    const objects = {
        add(options) {
            calls.push(options)
            const center = options.collision.children?.find(node => /^center_?[0-9]{0,3}?$/i.test(node.name))?.position || new THREE.Vector3()
            return { collision: { body: { position: options.offset.clone().add(center) }, reset() {} } }
        },
        physics: {
            addObjectFromThree(options) { collisions.push(options); return { body: {} } },
            world: { removeBody(body) { removed.push(body) } },
        },
    }
    // Deliberately omit introStatic resources: retired scattered rocks and
    // their atlas shadow must not reappear as an invisible spawn obstruction.
    const resources = { items: {
        introInstructionsArrowsTexture: new THREE.Texture(), introInstructionsOtherTexture: new THREE.Texture(),
        introInstructionsLabels: { scene: { children: [{ name: 'arrows', geometry: new THREE.PlaneGeometry(7, 2) }] } },
        introArrowKeyBase: { scene: {} }, introArrowKeyCollision: { scene: keyCollisionScene },
        hornBase: { scene: {} }, hornCollision: { scene: {} },
        brickBase: { scene: {} }, brickCollision: { scene: {} },
    } }
    const intro = new IntroSection({ config: { touch: false }, objects, resources, walls: new Walls({ objects }), tiles: { add(run) { tileRuns.push(run) } }, x: 0, y: 0 })
    return { intro, calls, collisions, tileRuns, removed }
}

function withCanvas(callback) {
    const previous = globalThis.document
    globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, fillText() {}, measureText: text => ({ width: text.length * 25 }) }) }) }
    try { callback() } finally {
        if (previous === undefined) delete globalThis.document
        else globalThis.document = previous
    }
}

test('the arrival forecourt leaves the car spawn and road departure clear', () => withCanvas(() => {
    const { intro, calls, collisions, tileRuns } = createIntro()
    expect(collisions).toHaveLength(1)
    expect(collisions[0].mass).toBe(0)
    expect(intro.courtyardSolids).toHaveLength(6)
    for (const solid of intro.courtyardSolids) {
        // Sweep a full car-width footprint from spawn to the road. Surface
        // paint has no physics body and all boards stay outside this sweep.
        for (let y = introLayout.departure.fromY; y <= introLayout.departure.toY; y += .25) {
            const overlap = Math.abs(solid.position.x) < solid.scale.x / 2 + 1.35
                && Math.abs(solid.position.y - y) < solid.scale.y / 2 + 1.6
            expect(overlap).toBe(false)
        }
    }
    for (const prop of calls.filter(call => call.mass > 0)) {
        expect(Math.abs(prop.offset.x)).toBeGreaterThan(introLayout.departure.halfWidth + 1.5)
    }
    expect(calls.filter(call => call.base === intro.resources.items.brickBase.scene)).toHaveLength(14)
    expect(calls.filter(call => call.base === intro.resources.items.introArrowKeyBase.scene)).toHaveLength(4)
    expect(calls.filter(call => call.soundName === 'horn')).toHaveLength(1)
    // Roads are painted by the terrain shader. The entry must never add
    // solid stepping tiles back into the driving corridor.
    expect(tileRuns).toHaveLength(0)
    const paving = intro.courtyard.getObjectByName('Arrival / warm limestone paving')
    const bounds = new THREE.Box3().setFromObject(paving)
    expect(bounds.min.y).toBeLessThan(-5)
    expect(bounds.max.y).toBeGreaterThan(10)
    expect(paving.material.depthWrite).toBe(false)
    expect(paving.userData.groundLayer).toBe('accent')
    // Depth-write-free decals are painter's layers. Without distinct orders,
    // camera-distance sorting lets the large base overpaint the far bay.
    const paintOrders = {
        'Arrival / sandstone edge': 20,
        'Arrival / warm limestone paving': 21,
        'Arrival / departure lane': 22,
        'Arrival / emerald instruction bay': 22,
        'Arrival / lane brass edge': 23,
        'Arrival / bay header inset': 23,
        'Arrival / departure arrow': 24,
    }
    for (const mesh of intro.courtyard.children) {
        if (Object.hasOwn(paintOrders, mesh.name)) expect(mesh.renderOrder).toBe(paintOrders[mesh.name])
    }
}))

test('arrival lettering remains upright on both sign faces and owns its cleanup', () => withCanvas(() => {
    const { intro, removed } = createIntro()
    intro.container.updateMatrixWorld(true)
    for (const { lines } of introLayout.signs) {
        for (const [face, direction] of [['front', -1], ['back', 1]]) {
            const mesh = intro.courtyard.getObjectByName(`Arrival / ${lines[0]} ${face} lettering`)
            expect(new THREE.Vector3(0, 1, 0).transformDirection(mesh.matrixWorld).z).toBeCloseTo(1, 6)
            expect(new THREE.Vector3(0, 0, 1).transformDirection(mesh.matrixWorld).y).toBeCloseTo(direction, 6)
            expect(mesh.material.alphaMap.generateMipmaps).toBe(true)
        }
    }
    const texture = intro.courtyardTextures[0], geometry = intro.courtyard.children[0].geometry
    let textureDisposals = 0, geometryDisposals = 0
    texture.addEventListener('dispose', () => textureDisposals++)
    geometry.addEventListener('dispose', () => geometryDisposals++)
    const body = intro.courtyardCollision.body
    intro.dispose()
    intro.dispose()
    expect(removed).toEqual([body])
    expect(textureDisposals).toBe(1)
    expect(geometryDisposals).toBe(1)
}))

test('shipping arrow keys with an authored scene origin land inside the left demonstration bay', async () => {
    const bytes = await Bun.file(new URL('../static/models/intro/arrowKey/collision.glb', import.meta.url)).arrayBuffer()
    const view = new DataView(bytes)
    const gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, view.getUint32(12, true))))
    const authored = gltf.nodes.find(node => /^center/.test(node.name))
    expect(authored.translation).toBeDefined()
    expect(Math.abs(authored.translation[0])).toBeGreaterThan(4)
    const collision = new THREE.Group(), marker = new THREE.Object3D()
    // GLTFLoader sanitizes dots out of Blender node names before physics sees
    // them. Keep the real shipping coordinate rather than an origin-only mock.
    marker.name = THREE.PropertyBinding.sanitizeNodeName(authored.name)
    marker.position.fromArray(authored.translation)
    collision.add(marker)
    withCanvas(() => {
        const { intro, calls } = createIntro(collision)
        const keyCalls = calls.filter(call => call.base === intro.resources.items.introArrowKeyBase.scene)
        let index = 0
        for (const [key, dx, dy, rotation] of [['up', 0, 0, 0], ['down', 0, -.8, Math.PI], ['left', -.8, -.8, Math.PI * .5], ['right', .8, -.8, -Math.PI * .5]]) {
            const body = intro.instructions.arrows[key].collision.body
            expect(body.position.x).toBeCloseTo(introLayout.keys.x + dx, 6)
            expect(body.position.y).toBeCloseTo(introLayout.keys.y + dy, 6)
            expect(body.position.z).toBeCloseTo(marker.position.z, 6)
            const offset = introPropOffset(collision, introLayout.keys.x + dx, introLayout.keys.y + dy)
            expect(offset.z).toBe(0)
            expect(keyCalls[index++].rotation.z).toBeCloseTo(rotation, 6)
        }
        expect(marker.position.toArray()).toEqual(authored.translation)
    })
})
