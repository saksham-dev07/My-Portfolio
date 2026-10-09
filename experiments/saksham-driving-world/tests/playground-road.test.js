import { expect, test } from 'bun:test'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { roads, roadShoulder, distanceToRoad, roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'
import PlaygroundSection from '../src/javascript/World/Sections/PlaygroundSection.js'
import AreaFloorBorderGeometry from '../src/javascript/Geometries/AreaFloorBorderGeometry.js'

test('playground entrance uses two tangent circular bends and a straight terminal', () => {
    const road = roads.find(item => item.name === 'Playground'), segments = road.curve.curves
    expect(segments).toHaveLength(5)
    expect(road.curve.getPoint(0).toArray()).toEqual([-6, -30, 0])
    expect(road.curve.getPoint(1).toArray()).toEqual([-28, -42, 0])
    expect(segments.at(-1).getLength()).toBeCloseTo(3, 6)
    expect(segments.at(-1).getTangent(1).toArray()).toEqual([-1, 0, 0])
    for(let i = 1; i < segments.length; i++) {
        expect(segments[i-1].getPoint(1).distanceTo(segments[i].getPoint(0))).toBeLessThan(.000001)
        expect(segments[i-1].getTangent(1).dot(segments[i].getTangent(0))).toBeGreaterThan(.99999)
    }
    const radius = 4, halfWidth = road.width/2 + roadShoulder
    expect(radius - halfWidth).toBeGreaterThan(2)
    for(const [index, [cx, cy]] of [[1, [-17, -34]], [3, [-25, -38]]]) {
        const arc = segments[index]
        expect(arc.getLength()).toBeCloseTo(Math.PI*radius/2, 6)
        for(let i = 0; i <= 40; i++) {
            const point = arc.getPoint(i/40), tangent = arc.getTangent(i/40)
            expect(Math.hypot(point.x-cx, point.y-cy)).toBeCloseTo(radius, 6)
            const normal = new THREE.Vector3(-tangent.y, tangent.x, 0)
            const a = point.clone().addScaledVector(normal, halfWidth), b = point.clone().addScaledVector(normal, -halfWidth)
            const offsetRadii = [Math.hypot(a.x-cx,a.y-cy),Math.hypot(b.x-cx,b.y-cy)].sort((a,b)=>a-b)
            expect(offsetRadii[0]).toBeCloseTo(radius-halfWidth, 6)
            expect(offsetRadii[1]).toBeCloseTo(radius+halfWidth, 6)
        }
    }
    for(const point of road.samples) {
        expect(point.x).toBeGreaterThanOrEqual(-28)
        expect(point.x).toBeLessThanOrEqual(-6)
        expect(point.y).toBeGreaterThanOrEqual(-42)
        expect(point.y).toBeLessThanOrEqual(-30)
    }
    expect(distanceToRoad(roads.find(item=>item.name==='Hub roundabout'), -6, -30)).toBe(0)
    // The rounded terminal and its shoulder stop before the retained ramp/bench
    // compound collider, whose eastern edge is x=-31.01956 at this entrance.
    expect(-28 - halfWidth - (-31.01956)).toBeGreaterThan(1)
})

test('bowling RESET label and entire interaction pad share a clear lawn position', async() => {
    const resources = { items: { areaResetTexture: new THREE.Texture() } }
    for(const name of ['bowlingPinBase', 'bowlingPinCollision', 'bowlingBallBase', 'bowlingBallCollision']) resources.items[name] = { scene: new THREE.Group() }
    const handlers = {}, resets = { pins: 0, ball: 0 }
    let area, pinOptions, ballOptions
    const subject = {
        x: -38, y: -34, resources, container: new THREE.Group(),
        areas: { add: options => { area = options; return { on: (name, handler) => { handlers[name] = handler } } } },
        walls: { add: options => { pinOptions = options; return { items: [{ collision: { reset: () => { resets.pins++ } } }] } } },
        objects: { add: options => { ballOptions = options; return { collision: { reset: () => { resets.ball++ } } } } }
    }
    PlaygroundSection.prototype.setBowling.call(subject)
    expect(area.position.toArray()).toEqual([-24.5, -28])
    expect(subject.bowling.areaLabelMesh.position.toArray()).toEqual([-24.5, -28, 0])
    expect(pinOptions.shape.position.toArray()).toEqual([-48, -30, 0])
    expect(ballOptions.offset.toArray()).toEqual([-28, -30, 0])
    handlers.interact()
    expect(resets).toEqual({ pins: 1, ball: 1 })

    const border = new AreaFloorBorderGeometry(area.halfExtents.x*2, area.halfExtents.y*2, .25)
    border.computeBoundingBox()
    const bounds = border.boundingBox.clone().translate(new THREE.Vector3(area.position.x, area.position.y, 0))
    let clearance = Infinity
    for(let ix = 0; ix <= 16; ix++) for(let iy = 0; iy <= 16; iy++)
        clearance = Math.min(clearance, roadEdgeDistance(
            bounds.min.x + (bounds.max.x-bounds.min.x)*ix/16,
            bounds.min.y + (bounds.max.y-bounds.min.y)*iy/16
        ))
    expect(clearance).toBeGreaterThan(.8)

    const collision = await new GLTFLoader().parseAsync(await Bun.file(new URL('../static/models/playground/static/collision.glb', import.meta.url)).arrayBuffer(), '')
    collision.scene.position.set(subject.x, subject.y, 0)
    collision.scene.updateMatrixWorld(true)
    for(const node of collision.scene.children) {
        const solid = new THREE.Box3().setFromObject(node)
        const overlap = bounds.max.x > solid.min.x && bounds.min.x < solid.max.x && bounds.max.y > solid.min.y && bounds.min.y < solid.max.y
        expect(overlap).toBe(false)
    }
    // The reset ball also remains outside the complete visible interaction pad.
    const ballDistance = Math.hypot(Math.max(0, bounds.min.x-ballOptions.offset.x, ballOptions.offset.x-bounds.max.x), Math.max(0, bounds.min.y-ballOptions.offset.y, ballOptions.offset.y-bounds.max.y))
    expect(ballDistance).toBeGreaterThan(.7081 + .2)
    collision.scene.traverse(node => { if(node.isMesh) { node.geometry.dispose(); node.material.dispose() } })
    border.dispose(); resources.items.areaResetTexture.dispose()
    subject.bowling.areaLabelMesh.geometry.dispose(); subject.bowling.areaLabelMesh.material.dispose()
})
