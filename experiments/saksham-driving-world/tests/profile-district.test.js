import { test, expect } from 'bun:test'
import * as THREE from 'three'
import ProfileDistrict from '../src/javascript/World/Sections/ProfileDistrict.js'
import Walls from '../src/javascript/World/Walls.js'
import { profilePathClearances } from '../src/javascript/World/Sections/ProfilePaths.js'
import { profileSections } from '../src/javascript/sakshamProfile.js'
import { roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'

test('district furniture leaves main and journey entry pads clear', () => {
    const previousDocument = globalThis.document
    globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, fillText() {}, measureText: text => ({ width: text.length * 25 }) }) }) }
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
        let resetCount = 0
        const walls = new Walls({ objects: { add() { return { collision: { reset() { resetCount++ } } } } } })
        const district = new ProfileDistrict({
            directionSignTemplate: signTemplate,
            objects: { items: [{ container: tree }], getConvertedMesh: () => { const group = new THREE.Group(); group.add(new THREE.Mesh(new THREE.BoxGeometry(1, .5, .4))); return group }, physics: { addObjectFromThree: options => { collider = options; return options } } },
            resources: { items: { brickBase: { scene: new THREE.Group() }, brickCollision: { scene: new THREE.Group() }, tilesABase: { scene: new THREE.Group() } } },
            walls: { add: options => { experimentOptions = options; return walls.add(options) } },
            areas: { add: options => { entries.push(options); return { on(event, callback) { if (options.position.x === 30 && options.position.y === -115) resetExperiment = callback } } } },
            tiles: { add: road => roads.push(road) },
        }, new THREE.Group(), [])
        expect(collider.mass).toBe(0)
        expect(district.directionSigns.items.length).toBe(3)
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
        // Tile footprints stay outside readable labels and interaction pads;
        // junction deduplication prevents stacked or intersecting markers.
        for (const [index, marker] of district.markers.entries()) {
            for (const rect of profilePathClearances) expect(Math.abs(marker.point.x - rect.x) < rect.w / 2 + .85 && Math.abs(marker.point.y - rect.y) < rect.h / 2 + .85).toBe(false)
            for (const other of district.markers.slice(index + 1)) expect(marker.point.distanceTo(other.point)).toBeGreaterThanOrEqual(1.45)
        }
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
    }
})
