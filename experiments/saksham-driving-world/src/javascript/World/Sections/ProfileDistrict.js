import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { labelTexture } from '../../StudioLabels.js'
import { profilePaths, educationStops } from './ProfilePaths.js'
import ProfileCircuit from './ProfileCircuit.js'
import DirectionSigns from './DirectionSigns.js'
import EducationChapters from './EducationChapters.js'
import BrickWorkshop, { workshopLayout } from './BrickWorkshop.js'
import { groundLayer } from '../GroundLayers.js'
// Authored scenery frames the landmarks; the eastern wall is a physics experiment.
export default class ProfileDistrict {
    constructor({ objects, areas, resources, walls, zones, time, camera, directionSignTemplate }, container, collisions) {
        const district = new THREE.Group()
        district.name = 'Lower district · courtyards and discovery loop'
        container.add(district)
        const solids = []
        const dummy = new THREE.Object3D()
        const sign = (lines, x, y, w = 8, h = 2, color = '#fff0d5', z = .055, backdrop = false, titleSize = 60) => {
            if (backdrop) {
                const plate = new THREE.Mesh(new THREE.PlaneGeometry(w + .4, h + .2), new THREE.MeshBasicMaterial({ color: '#181b2c', transparent: true, opacity: .7, depthWrite: false }))
                plate.position.set(x, y, z - .005)
                groundLayer(plate, 'backdrop')
                district.add(plate)
            }
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, alphaMap: labelTexture(lines, 1024, 256, { titleSize }), transparent: true, depthWrite: false }))
            mesh.position.set(x, y, z)
            groundLayer(mesh, 'label')
            district.add(mesh)
        }

        // ── Helper: ground accent ring ─────────────────────────────────
        const accentRing = (x, y, innerR, outerR, color = '#c3cdf7', opacity = .18) => {
            const mesh = new THREE.Mesh(
                new THREE.RingGeometry(innerR, outerR, 64),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
            )
            mesh.position.set(x, y, .013)
            groundLayer(mesh, 'accent')
            district.add(mesh)
        }

        const groundCircle = (x, y, radius, color = '#ffffff', opacity = .04) => {
            const mesh = new THREE.Mesh(
                new THREE.CircleGeometry(radius, 48),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
            )
            mesh.position.set(x, y, .011)
            groundLayer(mesh, 'accent')
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
        // 2. ABOUT COURTYARD — Stone, emerald and brass portrait garden
        // ═══════════════════════════════════════════════════════════════
        // A smaller asymmetric lawn leaves the forecourt, title and all road
        // approaches open. Split inlays frame the sculpture without a giant
        // enclosing circle or a new barrier around the visitor.
        const lawnShape = new THREE.Shape()
        lawnShape.moveTo(-7.7, -.4)
        lawnShape.bezierCurveTo(-7.7, 3.5, -3.9, 5.5, .8, 4.7)
        lawnShape.bezierCurveTo(5.4, 5.1, 7.7, 3.4, 7.7, -.2)
        lawnShape.bezierCurveTo(7.7, -3.4, 3.1, -4.2, -.7, -4.2)
        lawnShape.bezierCurveTo(-4.9, -4.4, -7.7, -3.2, -7.7, -.4)
        const lawn = new THREE.Mesh(new THREE.ShapeGeometry(lawnShape, 16), new THREE.MeshBasicMaterial({ color: '#284f39', transparent: true, opacity: .20, depthWrite: false }))
        lawn.name = 'About courtyard / composed lawn'
        lawn.position.set(2, -75.1, 0)
        groundLayer(lawn, 'accent')
        district.add(lawn)
        const mosaic = new THREE.Group()
        mosaic.name = 'About courtyard / split stone inlays'
        district.add(mosaic)
        for (const start of [.10, Math.PI + .10]) {
            const arc = new THREE.Mesh(new THREE.RingGeometry(3.24, 3.43, 24, 1, start, Math.PI * .71), new THREE.MeshBasicMaterial({ color: '#e3d4ac', transparent: true, opacity: .48, depthWrite: false }))
            arc.position.set(2, -73, .016)
            mosaic.add(arc)
            groundLayer(arc, 'accent')
        }
        for (let i = 0; i < 6; i++) {
            const angle = .35 + i * Math.PI / 5
            const inset = new THREE.Mesh(new THREE.PlaneGeometry(.24, .24), new THREE.MeshBasicMaterial({ color: '#c3a66a', transparent: true, opacity: .58, depthWrite: false }))
            inset.position.set(2 + Math.cos(angle) * 3.72, -73 + Math.sin(angle) * 3.72, .016)
            inset.rotation.z = angle + Math.PI / 4
            mosaic.add(inset)
            groundLayer(inset, 'accent')
        }

        const matcap = objects.materials?.shades?.items?.white?.uniforms?.matcap?.value
        const palette = new Map()
        const material = color => {
            // These colours share the display-space matcap convention used by
            // the Blender botanical and activity assets, rather than applying
            // a second sRGB-to-linear conversion to the small authored palette.
            if (!palette.has(color)) palette.set(color, matcap ? new THREE.MeshMatcapMaterial({ matcap, color: new THREE.Color(color).convertLinearToSRGB() }) : new THREE.MeshBasicMaterial({ color }))
            return palette.get(color)
        }
        const block = (name, x, y, z, w, d, h, color, solid = false) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), material(color))
            mesh.name = name
            mesh.position.set(x, y, z)
            district.add(mesh)
            if (solid) {
                const box = new THREE.Object3D()
                box.name = 'box'
                box.userData.feature = name
                box.position.copy(mesh.position)
                box.scale.set(w, d, h)
                solids.push(box)
            }
            return mesh
        }
        const plinthLayers = [
            { name: 'warm stone foundation', radius: 2.9, bottom: 0, top: .16, color: '#d9c8a7' },
            { name: 'emerald drum', radius: 2.7, bottom: .16, top: .31, color: '#285545' },
            { name: 'brass portrait cap', radius: 2.55, bottom: .31, top: .35, color: '#d4b67b' },
        ]
        for (const layer of plinthLayers) {
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(layer.radius, layer.radius, layer.top - layer.bottom, 48), material(layer.color))
            mesh.name = `About portrait / ${layer.name}`
            mesh.rotation.x = Math.PI / 2
            mesh.position.set(2, -73, (layer.bottom + layer.top) / 2)
            district.add(mesh)
        }
        const base = new THREE.Object3D()
        base.name = 'box'
        base.userData.feature = 'About portrait / plinth'
        base.position.set(2, -73, .175)
        base.scale.set(5.8, 5.8, .35)
        solids.push(base)
        for (const [title, x] of [['APPLIED AI', -4.5], ['FULL STACK', 8.5]]) {
            const prefix = `About skills / ${title}`
            block(`${prefix} / green board`, x, -73, 1.45, 3.6, .28, 1.22, '#25483b', true)
            block(`${prefix} / brass lower trim`, x, -73, .89, 3.56, .30, .08, '#c9aa70')
            block(`${prefix} / brass upper trim`, x, -73, 2.01, 3.56, .30, .08, '#c9aa70')
            for (const offset of [-1.75, 1.75]) block(`${prefix} / brass side trim`, x + offset, -73, 1.45, .08, .30, 1.10, '#c9aa70')
            for (const offset of [-1.18, 1.18]) {
                block(`${prefix} / brass post`, x + offset, -73, .64, .10, .10, 1.18, '#b49760', true)
                block(`${prefix} / stone foot`, x + offset, -73, .11, .65, .65, .22, '#d9c8a7', true)
            }
            const texture = labelTexture([title], 1024, 256, { titleSize: 176 })
            texture.generateMipmaps = true
            texture.minFilter = THREE.LinearMipmapLinearFilter
            texture.anisotropy = 4
            const faceMaterial = new THREE.MeshBasicMaterial({ color: '#f5e2b4', alphaMap: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })
            for (const [face, direction] of [['front', -1], ['back', 1]]) {
                const label = new THREE.Mesh(new THREE.PlaneGeometry(3.1, .67), faceMaterial)
                label.name = `${prefix} / ${face}`
                label.position.set(x, -73 + direction * .145, 1.46)
                label.rotation.set(Math.PI / 2, 0, direction > 0 ? Math.PI : 0, 'ZXY')
                district.add(label)
            }
        }

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
        this.educationAreas = []
        for (const { x, y, title, chapter, padOffsetX } of educationStops) {
            const padX = x + padOffsetX
            sign([title], padX, y + 1.10, 3.4, .72, '#fff0d5', .055, false, 112)
            const area = areas.add({ position: new THREE.Vector2(padX, y), halfExtents: new THREE.Vector2(1.5, 1.5) })
            area.on('interact', () => window.dispatchEvent(new CustomEvent('drive-section', { detail: { id: 'education', chapter } })))
            this.educationAreas.push({ chapter, position: new THREE.Vector2(padX, y), halfExtents: new THREE.Vector2(1.5, 1.5), area })
        }
        sign(['THE ROAD SO FAR'], -19, -120, 11, 1.5)
        if (time && camera) this.educationChapters = new EducationChapters({ container: district, objects, camera, time })

        // ═══════════════════════════════════════════════════════════════
        // 7. MAKER YARD — A framed, reusable ten-brick physics workshop
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
        const courtShape = new THREE.Shape()
        const { x: courtX, y: courtY, width: courtW, depth: courtD } = workshopLayout.court
        const hw = courtW / 2, hd = courtD / 2, corner = .9
        courtShape.moveTo(-hw + corner, -hd)
        courtShape.lineTo(hw - corner, -hd)
        courtShape.quadraticCurveTo(hw, -hd, hw, -hd + corner)
        courtShape.lineTo(hw, hd - corner)
        courtShape.quadraticCurveTo(hw, hd, hw - corner, hd)
        courtShape.lineTo(-hw + corner, hd)
        courtShape.quadraticCurveTo(-hw, hd, -hw, hd - corner)
        courtShape.lineTo(-hw, -hd + corner)
        courtShape.quadraticCurveTo(-hw, -hd, -hw + corner, -hd)
        const court = new THREE.Mesh(new THREE.ShapeGeometry(courtShape, 8), new THREE.MeshBasicMaterial({ color: '#c6bb9f', transparent: true, opacity: .64, depthWrite: false }))
        court.name = 'Maker yard / warm stone court'
        court.position.set(courtX, courtY, .018)
        groundLayer(court, 'accent')
        court.renderOrder = 21
        district.add(court)
        const inlayMaterial = new THREE.MeshBasicMaterial({ color: '#dfc68e', transparent: true, opacity: .7, depthWrite: false })
        for (const dx of [-6.2, 6.2]) for (const dy of [-7.7, 7.7]) {
            for (const [w, d, ox, oy] of [[1.4, .09, -Math.sign(dx) * .7, 0], [.09, 1.4, 0, -Math.sign(dy) * .7]]) {
                const inlay = new THREE.Mesh(new THREE.PlaneGeometry(w, d), inlayMaterial)
                inlay.name = 'Maker yard / brass corner inlay'
                inlay.position.set(courtX + dx + ox, courtY + dy + oy, .034)
                groundLayer(inlay, 'accent')
                inlay.renderOrder = 23
                district.add(inlay)
            }
        }
        this.workshop = new BrickWorkshop({ items: this.experiment.items, container: district, solids, time, matcap })
        const { x: resetX, y: resetY, halfWidth, halfDepth } = workshopLayout.rebuild
        const reset = areas.add({ position: new THREE.Vector2(resetX, resetY), halfExtents: new THREE.Vector2(halfWidth, halfDepth) })
        reset.on('interact', () => this.workshop.rebuild())
        sign(['REBUILD'], resetX, resetY, 5, 1, '#fff0d5', .055, false, 96)
        sign(['NUDGE THE STACK'], 30, -108.8, 6.5, 1, '#fff0d5', .055, false, 112)
        sign(['BREAK / BUILD / REPEAT'], 30, -119.9, 12, 1.2, '#e6c994', .055, false, 96)

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
        // 10. ROAD NETWORK — paint belongs to the shared terrain surface.
        // ═══════════════════════════════════════════════════════════════
        this.paths = profilePaths

        // Tree collisions are owned by the loaded Blender botanical batches.
        this.directionSigns = new DirectionSigns(directionSignTemplate, district, solids)
        collisions.push(objects.physics.addObjectFromThree({ meshes: solids, offset: new THREE.Vector3(), rotation: new THREE.Euler(), mass: 0, sleep: true }))
        this.container = district
        this.solids = solids
        this.trees = []
        this.circuit = new ProfileCircuit({ zones, container: district, physics: objects.physics })
    }
}
