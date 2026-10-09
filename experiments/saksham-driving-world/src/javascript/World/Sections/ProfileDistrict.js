import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { labelTexture } from '../../StudioLabels.js'
import { profilePaths, profilePathMarkers, profilePathClearances, educationStops } from './ProfilePaths.js'
import ProfileCircuit from './ProfileCircuit.js'
import DirectionSigns from './DirectionSigns.js'
// Authored scenery frames the landmarks; the eastern wall is a physics experiment.
export default class ProfileDistrict {
    constructor({ objects, areas, resources, walls, zones, time, camera, directionSignTemplate }, container, collisions) {
        const district = new THREE.Group()
        district.name = 'Lower district · courtyards and discovery loop'
        container.add(district)
        const solids = []
        const dummy = new THREE.Object3D()
        const sign = (lines, x, y, w = 8, h = 2, color = '#fff0d5', z = .055, backdrop = false) => {
            if (backdrop) {
                const plate = new THREE.Mesh(new THREE.PlaneGeometry(w + .4, h + .2), new THREE.MeshBasicMaterial({ color: '#181b2c', transparent: true, opacity: .7, depthWrite: false }))
                plate.position.set(x, y, z - .005)
                district.add(plate)
            }
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, alphaMap: labelTexture(lines, 1024, 256), transparent: true, depthWrite: false }))
            mesh.position.set(x, y, z)
            district.add(mesh)
        }

        // ── Helper: ground accent ring ─────────────────────────────────
        const accentRing = (x, y, innerR, outerR, color = '#c3cdf7', opacity = .18) => {
            const mesh = new THREE.Mesh(
                new THREE.RingGeometry(innerR, outerR, 64),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
            )
            mesh.position.set(x, y, .013)
            district.add(mesh)
        }

        const groundCircle = (x, y, radius, color = '#ffffff', opacity = .04) => {
            const mesh = new THREE.Mesh(
                new THREE.CircleGeometry(radius, 48),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
            )
            mesh.position.set(x, y, .011)
            district.add(mesh)
        }

        // ── Reuse original brick for edges ─────────────────────────────
        const brickSource = objects.getConvertedMesh(resources.items.brickBase.scene.children, { duplicated: true })
        brickSource.updateMatrixWorld(true)
        const brickBounds = new THREE.Box3().setFromObject(brickSource)
        const brickCenter = brickBounds.getCenter(new THREE.Vector3())
        const brickSize = brickBounds.getSize(new THREE.Vector3())
        const brickTransforms = []
        const brick = (x, y, z, angle = 0) => {
            dummy.position.set(x, y, z)
            dummy.rotation.set(0, 0, angle)
            dummy.scale.set(1.15 / brickSize.x, .55 / brickSize.y, .43 / brickSize.z)
            dummy.updateMatrix()
            brickTransforms.push(dummy.matrix.clone().multiply(new THREE.Matrix4().makeTranslation(-brickCenter.x, -brickCenter.y, -brickCenter.z)))
        }
        const edge = (x, y, count, angle = 0, courses = 2) => {
            for (let row = 0; row < courses; row++) for (let i = 0; i < count; i++) {
                const distance = (i - (count - 1) / 2) * 1.18 + (row % 2) * .28
                brick(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, .235 + row * .44, angle)
            }
            const shape = new THREE.Object3D()
            shape.name = 'box'
            shape.position.set(x, y, courses * .44 / 2)
            shape.scale.set(Math.abs(Math.cos(angle)) * count * 1.18 + Math.abs(Math.sin(angle)) * .55 + .56,
                Math.abs(Math.sin(angle)) * count * 1.18 + Math.abs(Math.cos(angle)) * .55 + .56, courses * .44)
            solids.push(shape)
        }

        // ═══════════════════════════════════════════════════════════════
        // 1. PORTRAIT GARDEN — Richer grove framing the bust
        // ═══════════════════════════════════════════════════════════════
        // Landscape's shared Blender tree batches frame these courtyards. Keep
        // this district responsible for its walls, pads and landmark geometry.
        // Scattered accent pools behind the portrait
        groundCircle(-10, -66, 2.5, '#d4e7ef', .025)
        groundCircle(14, -67, 2, '#c3cdf7', .02)

        // ═══════════════════════════════════════════════════════════════
        // 2. ABOUT COURTYARD — Multi-ring plaza with mosaic pattern
        // ═══════════════════════════════════════════════════════════════
        // Outer soft ground fill.
        // Main courtyard circle.
        const courtyard = new THREE.Mesh(new THREE.CircleGeometry(9.3, 64), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .07, depthWrite: false }))
        courtyard.position.set(2, -79, .012)
        district.add(courtyard)
        // Primary courtyard edge.
        const courtyardEdge = new THREE.Mesh(new THREE.RingGeometry(9.15, 9.3, 96), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .28, depthWrite: false }))
        courtyardEdge.position.set(2, -79, .014)
        district.add(courtyardEdge)
        // Secondary outer accent ring for depth.
        // Inner decorative mosaic ring surrounding the plinth.
        // Stepped radial accents (subtle compass rose effect).

        // ── Portrait plinth — stepped dark pedestal + marble top + halo ──
        const plinthBase = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 3.0, .14, 48), new THREE.MeshStandardMaterial({ color: '#25293d', roughness: .7 }))
        plinthBase.rotation.x = Math.PI / 2
        plinthBase.position.set(2, -73, .07)
        district.add(plinthBase)
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.65, .28, 48), new THREE.MeshStandardMaterial({ color: '#eee5d8', roughness: .85 }))
        plinth.rotation.x = Math.PI / 2
        plinth.position.set(2, -73, .24)
        district.add(plinth)
        // Double halo — inner bright + outer soft.
        const halo = new THREE.Mesh(new THREE.RingGeometry(2.95, 3.25, 64), new THREE.MeshBasicMaterial({ color: '#c3cdf7', transparent: true, opacity: .45, depthWrite: false }))
        halo.position.set(2, -73, .015)
        district.add(halo)
        const base = new THREE.Object3D()
        base.name = 'box'
        base.position.set(2, -73, .16)
        base.scale.set(5.8, 5.8, .35)
        solids.push(base)
        sign(['APPLIED AI'], -4.5, -73, 4.6, 1.1, '#ffffff', .055, true)
        sign(['FULL STACK'], 8.5, -73, 4.6, 1.1, '#ffffff', .055, true)

        // ═══════════════════════════════════════════════════════════════
        // 3. SKILLS WORK YARD — Denser, more intentional arrangement
        // ═══════════════════════════════════════════════════════════════
        edge(-30, -81, 3, Math.PI / 2, 3)
        edge(-18, -78, 4, 0, 2)
        // Additional low-course wall segment for enclosure feel.
        // Ground accent under the Skills section.
        groundCircle(-24, -85, 5, '#c3cdf7', .025)
        accentRing(-24, -85, 4.7, 5.0, '#c3cdf7', .08)

        // ═══════════════════════════════════════════════════════════════
        // 4. TROPHY / HIGHLIGHTS GARDEN — Better framing
        // ═══════════════════════════════════════════════════════════════
        edge(25, -77, 4)
        edge(35, -77, 4)
        sign(['CODEVITA / FINTECH / GRIDLOCK'], 30, -78.8, 12, 1.2)
        // Ground accent under Highlights.
        groundCircle(30, -85, 5, '#edc4da', .025)
        accentRing(30, -85, 4.7, 5.0, '#edc4da', .08)

        // ═══════════════════════════════════════════════════════════════
        // 5. CAMPUS / EDUCATION — Better garden framing
        // ═══════════════════════════════════════════════════════════════
        edge(-9, -105, 5, Math.PI / 2)
        edge(10, -105, 5, Math.PI / 2)
        // Additional wing walls for a more enclosed feeling.
        edge(-12, -112, 3, 0, 2)
        edge(13, -112, 3, 0, 2)
        // Frame the campus wings while keeping its facade, education title and
        // timeline pads visible from the lower road.
        // Ground accent under Education.
        groundCircle(2, -108, 6, '#ffe5b8', .02)
        accentRing(2, -108, 5.7, 6.0, '#ffe5b8', .07)

        // ═══════════════════════════════════════════════════════════════
        // 6. EDUCATION TIMELINE — Western ring road stops
        // ═══════════════════════════════════════════════════════════════
        for (const { x, y, title } of educationStops) {
            sign([title], x, y - .3, 7, 1.4)
            const area = areas.add({ position: new THREE.Vector2(x, y), halfExtents: new THREE.Vector2(3.5, 1.8) })
            area.on('interact', () => window.dispatchEvent(new CustomEvent('drive-section', { detail: 'education' })))
            // Subtle ring around each education pad.
            accentRing(x, y, 3.8, 4.0, '#ffe5b8', .1)
        }
        sign(['THE ROAD SO FAR'], -19, -120, 11, 1.5)

        // ═══════════════════════════════════════════════════════════════
        // 7. EASTERN CLEARING — Physics experiment with better framing
        // ═══════════════════════════════════════════════════════════════
        this.experiment = walls.add({
            object: { base: resources.items.brickBase.scene, collision: resources.items.brickCollision.scene,
                offset: new THREE.Vector3(), rotation: new THREE.Euler(),
                duplicated: true, mass: .5, soundName: 'brick',
                shadow: { sizeX: 1.2, sizeY: 1.8, offsetZ: -.15, alpha: .35 } },
            shape: { type: 'triangle', widthCount: 4, position: new THREE.Vector3(30, -105, .1),
                offsetWidth: new THREE.Vector3(0, 1.05, 0), offsetHeight: new THREE.Vector3(0, 0, .45),
                randomOffset: new THREE.Vector3(), randomRotation: new THREE.Vector3() }
        })
        const reset = areas.add({ position: new THREE.Vector2(30, -115), halfExtents: new THREE.Vector2(3, 1.5) })
        reset.on('interact', () => this.experiment.items.forEach(item => item.collision.reset()))
        sign(['REBUILD'], 30, -115, 5, 1)
        sign(['BREAK / BUILD / REPEAT'], 30, -119, 12, 1.5)
        // Ground accent under the physics experiment.
        groundCircle(30, -110, 4, '#edc4da', .02)

        // ═══════════════════════════════════════════════════════════════
        // 8. RING ROAD JUNCTION ACCENTS
        // ═══════════════════════════════════════════════════════════════
        // North entrance to the ring road.
        accentRing(2, -98.5, 2.5, 2.7, '#ffe5b8', .1)
        // East junction.
        accentRing(40, -111, 2, 2.2, '#edc4da', .08)
        // Southwest corner.
        accentRing(-26.5, -111, 2, 2.2, '#c3cdf7', .08)

        // ═══════════════════════════════════════════════════════════════
        // 9. MERGE INSTANCED BRICKS — same as original
        // ═══════════════════════════════════════════════════════════════
        brickSource.children.forEach(source => {
            if (!source.isMesh) return
            const pieces = brickTransforms.map(matrix => source.geometry.clone().applyMatrix4(matrix.clone().multiply(source.matrixWorld)))
            const geometry = mergeGeometries(pieces)
            pieces.forEach(piece => piece.dispose())
            const mesh = new THREE.Mesh(geometry, source.material)
            district.add(mesh)
        })

        // ═══════════════════════════════════════════════════════════════
        // 10. TILE ROAD NETWORK — same path markers as original
        // ═══════════════════════════════════════════════════════════════
        this.paths = profilePaths
        this.markers = profilePathMarkers()
        const tileSource = objects.getConvertedMesh(resources.items.tilesABase.scene.children, { duplicated: true })
        tileSource.updateMatrixWorld(true)
        tileSource.children.forEach(source => {
            if (!source.isMesh) return
            const pieces = this.markers.map(({ point, angle }) => {
                const matrix = new THREE.Matrix4().makeRotationZ(angle)
                matrix.setPosition(point.x, point.y, .015)
                return source.geometry.clone().applyMatrix4(matrix.multiply(source.matrixWorld))
            })
            const geometry = mergeGeometries(pieces)
            pieces.forEach(piece => piece.dispose())
            district.add(new THREE.Mesh(geometry, source.material))
        })

        // Tree collisions are owned by the loaded Blender botanical batches.
        this.directionSigns = new DirectionSigns(directionSignTemplate, district, solids)
        collisions.push(objects.physics.addObjectFromThree({ meshes: solids, offset: new THREE.Vector3(), rotation: new THREE.Euler(), mass: 0, sleep: true }))
        this.container = district
        this.solids = solids
        this.trees = []
        this.circuit = new ProfileCircuit({ zones, container: district, physics: objects.physics })
    }
}
