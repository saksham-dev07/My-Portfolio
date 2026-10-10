import { test, expect } from 'bun:test'
import * as THREE from 'three'
import ProfileDistrict from '../src/javascript/World/Sections/ProfileDistrict.js'
import Walls from '../src/javascript/World/Walls.js'
import { profileSections } from '../src/javascript/sakshamProfile.js'
import { roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'

test('district furniture leaves main and journey entry pads clear', () => {
    const previousDocument = globalThis.document
    const previousWindow = globalThis.window
    const dispatched = []
    globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, fillText() {}, measureText: text => ({ width: text.length * 25 }) }) }) }
    globalThis.window = { dispatchEvent: event => dispatched.push(event) }
    try {
        const tree = new THREE.Group()
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 3))
        canopy.name = 'shadeGreen'
        const originalTreeMaterial=canopy.material
        tree.add(canopy)
        const signTemplate = new THREE.Group()
        const pole = new THREE.Mesh(new THREE.BoxGeometry(.3, .3, 4))
        pole.name = 'shadeBrown004'
        pole.position.z = 2
        const board = new THREE.Mesh(new THREE.BoxGeometry(4, .3, 1))
        board.name = 'shadeWhite084'
        board.position.z = 3.5
        signTemplate.add(pole, board)
        const entries = profileSections.map(section => ({ position: new THREE.Vector2(section.x, section.y - 4), halfExtents: new THREE.Vector2(4, 2) }))
        const roads = []
        let collider
        let experimentOptions
        let resetExperiment
        const educationInteractions = []
        let resetCount = 0
        const walls = new Walls({ objects: { add() { return { collision: { reset() { resetCount++ } } } } } })
        const district = new ProfileDistrict({
            directionSignTemplate: signTemplate,
            objects: { items: [{ container: tree }], getConvertedMesh: () => { const group = new THREE.Group(); group.add(new THREE.Mesh(new THREE.BoxGeometry(1, .5, .4))); return group }, physics: { addObjectFromThree: options => { collider = options; return options } } },
            resources: { items: { brickBase: { scene: new THREE.Group() }, brickCollision: { scene: new THREE.Group() } } },
            walls: { add: options => { experimentOptions = options; return walls.add(options) } },
            areas: { add: options => { entries.push(options); return { on(event, callback) {
                if (options.position.x === 30 && options.position.y === -115) resetExperiment = callback
                if (options.position.x === -20) educationInteractions.push(callback)
            } } } },
        }, new THREE.Group(), [])
        expect(collider.mass).toBe(0)
        expect(district.directionSigns.items.length).toBe(3)
        expect(district.educationChapters).toBeUndefined()
        expect(district.educationAreas.map(({ chapter, position, halfExtents }) => ({ chapter, x: position.x, y: position.y, w: halfExtents.x * 2, h: halfExtents.y * 2 }))).toEqual([
            { chapter: 'school', x: -20, y: -103, w: 3, h: 3 },
            { chapter: 'science', x: -20, y: -109, w: 3, h: 3 },
            { chapter: 'campus', x: -20, y: -115, w: 3, h: 3 },
        ])
        educationInteractions.forEach(interact => interact())
        expect(dispatched.map(({ type, detail }) => ({ type, detail }))).toEqual([
            { type: 'drive-section', detail: { id: 'education', chapter: 'school' } },
            { type: 'drive-section', detail: { id: 'education', chapter: 'science' } },
            { type: 'drive-section', detail: { id: 'education', chapter: 'campus' } },
        ])
        // The photographic portrait's baseline is .35m: its support must meet
        // that exact height rather than floating or cutting into the sculpture.
        const portraitCap = district.container.getObjectByName('About portrait / brass portrait cap')
        const capBounds = new THREE.Box3().setFromObject(portraitCap)
        expect(capBounds.max.z).toBeCloseTo(.35, 6)
        const portraitBody = district.solids.find(solid => solid.userData.feature === 'About portrait / plinth')
        expect(portraitBody.position.z + portraitBody.scale.z / 2).toBeCloseTo(.35, 6)
        const lawnBounds = new THREE.Box3().setFromObject(district.container.getObjectByName('About courtyard / composed lawn'))
        expect(lawnBounds.min.x).toBeGreaterThan(-6)
        expect(lawnBounds.max.x).toBeLessThan(10)
        expect(lawnBounds.min.y).toBeGreaterThan(-80)
        const up = new THREE.Vector3(0, 1, 0), normal = new THREE.Vector3(0, 0, 1)
        for (const [title, x] of [['APPLIED AI', -4.5], ['FULL STACK', 8.5]]) {
            const board = district.container.getObjectByName(`About skills / ${title} / green board`)
            const bounds = new THREE.Box3().setFromObject(board)
            expect(board.position.x).toBe(x)
            expect(bounds.max.z).toBeCloseTo(2.06, 6)
            expect(bounds.getSize(new THREE.Vector3()).x).toBeCloseTo(3.6, 6)
            // Two physically separated faces stay upright from both approach
            // directions; mirrored or upside-down labels fail these vectors.
            for (const [face, direction] of [['front', -1], ['back', 1]]) {
                const label = district.container.getObjectByName(`About skills / ${title} / ${face}`)
                expect(up.clone().applyQuaternion(label.quaternion).z).toBeCloseTo(1, 6)
                expect(normal.clone().applyQuaternion(label.quaternion).y).toBeCloseTo(direction, 6)
                expect(label.position.y).toBeCloseTo(-73 + direction * .145, 6)
                expect(label.material.alphaMap.generateMipmaps).toBe(true)
            }
        }
        expect(experimentOptions.object.mass).toBe(.5)
        expect(experimentOptions.shape.widthCount).toBe(4)
        resetExperiment()
        expect(resetCount).toBe(10)
        expect(district.solids.length).toBeGreaterThan(8)
        // Tree rendering and collisions are now owned together by the loaded
        // botanical kit; the district retains every wall and interaction pad.
        expect(district.trees).toHaveLength(0)
        const legacyCanopies=[]
        district.container.traverse(node=>{if(/^shadeGreen/i.test(node.name)) legacyCanopies.push(node)})
        expect(legacyCanopies).toHaveLength(0)
        expect(canopy.material).toBe(originalTreeMaterial)
        for (const entry of entries) for (const solid of district.solids) {
            if (solid.position.z - solid.scale.z / 2 > 1.6) continue
            const intersects = Math.abs(solid.position.x - entry.position.x) < solid.scale.x / 2 + entry.halfExtents.x
                && Math.abs(solid.position.y - entry.position.y) < solid.scale.y / 2 + entry.halfExtents.y
            expect(intersects).toBe(false)
        }
        // All route markings now belong to the terrain mask. The district
        // must construct without a tile model resource or a tile factory.
        expect(district.markers).toBeUndefined()
        // Check a car-width corridor along the complete route network.
        for (const path of district.paths) for (let i = 1; i < path.length; i++) roads.push({ start: new THREE.Vector2(...path[i - 1]), delta: new THREE.Vector2(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]) })
        const blocked = []
        for (const road of roads) {
            const steps = Math.ceil(road.delta.length() * 2)
            for (let i = 0; i <= steps; i++) for (const solid of district.solids) {
                if (solid.position.z - solid.scale.z / 2 > 1.6) continue
                const x = road.start.x + road.delta.x * i / steps
                const y = road.start.y + road.delta.y * i / steps
                if (Math.abs(solid.position.x - x) < solid.scale.x / 2 + .9 && Math.abs(solid.position.y - y) < solid.scale.y / 2 + .9) blocked.push([x, y])
            }
        }
        expect(blocked).toEqual([])
    } finally {
        if (previousDocument === undefined) delete globalThis.document
        else globalThis.document = previousDocument
        if (previousWindow === undefined) delete globalThis.window
        else globalThis.window = previousWindow
    }
})
