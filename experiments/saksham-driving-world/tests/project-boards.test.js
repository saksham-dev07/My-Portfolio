import { expect, test } from 'bun:test'
import * as THREE from 'three'
import ProjectsSection from '../src/javascript/World/Sections/ProjectsSection.js'

test('project frames, collision and artwork turn together toward each promenade approach', () => {
    const previousImage = globalThis.Image
    globalThis.Image = class { addEventListener() {} }
    const authoredAngle = 25 * Math.PI / 180
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(4, 3))
    plane.geometry.rotateX(Math.PI / 2)
    plane.rotation.z = authoredAngle
    const placed = []
    const section = {
        items: [], container: new THREE.Group(), time: { on() {} },
        camera: {}, objects: { add: options => placed.push(options) },
        areas: { add: () => ({ on() {} }) },
        resources: { items: { projectsBoardStructure: { scene: new THREE.Group() }, projectsBoardCollision: { scene: new THREE.Group() } } },
        meshes: { boardPlane: plane, areaLabel: new THREE.Mesh() },
        geometries: { floor: new THREE.PlaneGeometry(16, 8) }
    }
    try {
        for(let index = 0; index < 12; index++) {
            ProjectsSection.prototype.add.call(section, {
                name: `Project ${index}`, imageSources: ['test.png'], floorTexture: new THREE.Texture(),
                link: { x: 0, y: -6.5, halfExtents: { x: 3.2, y: 1.5 } }
            })
            const project = section.items[index], display = project.boards.items[0].planeMesh
            const normal = new THREE.Vector3(0, -1, 0).applyQuaternion(display.quaternion)
            // Every display faces the road (-Y) and the arriving end of its row.
            const arrivalSide = Math.floor(index / 4) % 2 ? 1 : -1
            expect(normal.y).toBeLessThan(-.7)
            expect(normal.x * arrivalSide).toBeGreaterThan(.7)
            expect(placed[index].rotation.z + authoredAngle).toBeCloseTo(display.rotation.z, 6)
            expect(placed[index].offset.toArray()).toEqual([display.position.x, display.position.y, 0])
        }
        expect(plane.rotation.z).toBe(authoredAngle)
    } finally {
        globalThis.Image = previousImage
        for(const project of section.items) {
            project.floor.texture.dispose(); project.floor.material.dispose()
            project.boards.items.forEach(board => board.planeMesh.material.dispose())
        }
        plane.geometry.dispose(); plane.material.dispose(); section.geometries.floor.dispose()
    }
})
