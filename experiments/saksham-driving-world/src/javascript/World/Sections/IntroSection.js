import { labelTexture } from '../../StudioLabels.js'
import * as THREE from 'three'
import { groundLayer } from '../GroundLayers.js'
import { introLayout } from './IntroLayout.js'

// Physics.addObjectFromThree adds an authored centre marker to the body
// position, independently of its rotation. Older GLBs retain scene-space
// origins, so offset their XY marker to place the actual prop in its bay.
export function introPropOffset(collision, x, y, z = 0)
{
    const center = collision.children?.find(node => /^center_?[0-9]{0,3}?$/i.test(node.name) || /^center\.[0-9]+$/i.test(node.name))?.position
    return new THREE.Vector3(x - (center?.x || 0), y - (center?.y || 0), z)
}

export default class IntroSection
{
    constructor(_options)
    {
        // Options
        this.config = _options.config
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.areas = _options.areas
        this.walls = _options.walls
        this.debug = _options.debug
        this.x = _options.x
        this.y = _options.y

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        this.setCourtyard()
        this.setInstructions()
        this.setOtherInstructions()
        this.setTitles()
        this.setDikes()
    }

    setCourtyard()
    {
        this.courtyard = new THREE.Group()
        this.courtyard.name = 'Arrival / warm stone forecourt'
        this.container.add(this.courtyard)
        this.courtyardSolids = []
        this.courtyardTextures = []
        const palette = new Map()
        const matcap = this.objects.materials?.shades?.items?.white?.uniforms?.matcap?.value
        const material = color => {
            if (!palette.has(color)) palette.set(color, matcap
                ? new THREE.MeshMatcapMaterial({ matcap, color: new THREE.Color(color).convertLinearToSRGB() })
                : new THREE.MeshBasicMaterial({ color }))
            return palette.get(color)
        }
        const roundedRect = (width, depth, radius) => {
            const shape = new THREE.Shape(), x = -width / 2, y = -depth / 2
            shape.moveTo(x + radius, y)
            shape.lineTo(x + width - radius, y)
            shape.quadraticCurveTo(x + width, y, x + width, y + radius)
            shape.lineTo(x + width, y + depth - radius)
            shape.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth)
            shape.lineTo(x + radius, y + depth)
            shape.quadraticCurveTo(x, y + depth, x, y + depth - radius)
            shape.lineTo(x, y + radius)
            shape.quadraticCurveTo(x, y, x + radius, y)
            return new THREE.ShapeGeometry(shape, 8)
        }
        const surface = (name, geometry, color, x, y, z = 0, opacity = 1, paintOrder = 22) => {
            const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }))
            mesh.name = name
            mesh.position.set(x, y, z)
            this.courtyard.add(mesh)
            groundLayer(mesh, 'accent')
            // Transparent decals do not write depth. Explicit paint ordering
            // keeps the far instruction bay visible from every camera angle.
            mesh.renderOrder = paintOrder
            return mesh
        }
        const { forecourt } = introLayout
        surface('Arrival / sandstone edge', roundedRect(forecourt.width, forecourt.depth, forecourt.radius), '#bda987', forecourt.x, forecourt.y, -.030, 1, 20)
        surface('Arrival / warm limestone paving', roundedRect(forecourt.width - .36, forecourt.depth - .36, forecourt.radius - .12), '#d9ceb1', forecourt.x, forecourt.y, -.026, 1, 21)
        // Surface markings have no collider or raised curb. The car can leave
        // the courtyard in every direction, especially along its road axis.
        surface('Arrival / departure lane', new THREE.PlaneGeometry(4.6, 15.1), '#456b53', 0, -1.85)
        for (const x of [-2.25, 2.25]) surface('Arrival / lane brass edge', new THREE.PlaneGeometry(.065, 15.1), '#d7b975', x, -1.85, .006, 1, 23)
        for (const { x, y } of [introLayout.keys, introLayout.other]) {
            surface('Arrival / emerald instruction bay', roundedRect(5.5, 7.4, .55), '#3e6049', x, y - .7, .008)
            surface('Arrival / bay header inset', new THREE.PlaneGeometry(4.5, .08), '#c6ad77', x, y + 2.4, .014, 1, 23)
        }
        for (const y of [-6.1, -7.8]) {
            const arrow = new THREE.Shape()
            arrow.moveTo(-.15, .6); arrow.lineTo(.15, .6); arrow.lineTo(.15, -.1)
            arrow.lineTo(.55, -.1); arrow.lineTo(0, -.7); arrow.lineTo(-.55, -.1)
            arrow.lineTo(-.15, -.1); arrow.closePath()
            surface('Arrival / departure arrow', new THREE.ShapeGeometry(arrow), '#f5e5bb', 0, y, .02, 1, 24)
        }
        const block = (name, x, y, z, width, depth, height, color, solid = false) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, depth, height), material(color))
            mesh.name = name
            mesh.position.set(x, y, z)
            this.courtyard.add(mesh)
            if (solid) {
                const box = new THREE.Object3D()
                box.name = 'box'
                box.userData.feature = name
                box.position.copy(mesh.position)
                box.scale.set(width, depth, height)
                this.courtyardSolids.push(box)
            }
            return mesh
        }
        for (const { x, y, lines } of introLayout.signs) {
            const name = `Arrival / ${lines[0]}`
            block(`${name} stone foot`, x, y, .14, 2.1, .82, .28, '#cdbc98', true)
            block(`${name} brass upright`, x, y, .65, .16, .16, 1.12, '#b89961', true)
            block(`${name} emerald board`, x, y, 1.95, 4.4, .25, 1.72, '#244b3b', true)
            // Cap the panel with butt joints; equal-width overlapping strips
            // leave coplanar side faces that fight at grazing camera angles.
            for (const z of [1.0575, 2.8425]) block(`${name} brass trim`, x, y, z, 4.46, .29, .065, '#cdb17c')
            const texture = labelTexture(lines, 1024, 384, { titleSize: 144, detailSize: 48 })
            texture.generateMipmaps = true
            texture.minFilter = THREE.LinearMipmapLinearFilter
            texture.anisotropy = 4
            this.courtyardTextures.push(texture)
            const faceMaterial = new THREE.MeshBasicMaterial({ color: '#f8e5bb', alphaMap: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })
            for (const direction of [-1, 1]) {
                const face = new THREE.Mesh(new THREE.PlaneGeometry(3.94, 1.46), faceMaterial)
                face.name = `${name} ${direction < 0 ? 'front' : 'back'} lettering`
                face.position.set(x, y + direction * .145, 1.95)
                face.rotation.set(Math.PI / 2, 0, direction > 0 ? Math.PI : 0, 'ZYX')
                this.courtyard.add(face)
            }
        }
        if (this.objects.physics) this.courtyardCollision = this.objects.physics.addObjectFromThree({ meshes: this.courtyardSolids, offset: new THREE.Vector3(), rotation: new THREE.Euler(), mass: 0, sleep: true })
    }

    setInstructions()
    {
        this.instructions = {}

        /**
         * Arrows
         */
        this.instructions.arrows = {}

        // Label
        this.instructions.arrows.label = {}

        this.instructions.arrows.label.texture = this.config.touch ? this.resources.items.introInstructionsControlsTexture : this.resources.items.introInstructionsArrowsTexture
        this.instructions.arrows.label.texture.magFilter = THREE.NearestFilter
        this.instructions.arrows.label.texture.minFilter = THREE.LinearFilter

        this.instructions.arrows.label.material = new THREE.MeshBasicMaterial({ transparent: true, alphaMap: this.instructions.arrows.label.texture, color: 0xffffff, depthWrite: false, opacity: 0 })

        this.instructions.arrows.label.geometry = this.resources.items.introInstructionsLabels.scene.children.find((_mesh) => _mesh.name === 'arrows').geometry

        this.instructions.arrows.label.mesh = new THREE.Mesh(this.instructions.arrows.label.geometry, this.instructions.arrows.label.material)
        // The original GLB stores lettering away from its origin. Centre its
        // geometry in the demonstration bay without mutating the shared mesh.
        this.instructions.arrows.label.geometry.computeBoundingBox()
        const labelCenter = this.instructions.arrows.label.geometry.boundingBox.getCenter(new THREE.Vector3())
        this.instructions.arrows.label.mesh.scale.setScalar(.76)
        this.instructions.arrows.label.mesh.position.set(introLayout.keys.x - labelCenter.x * .76, introLayout.keys.labelY - labelCenter.y * .76, -labelCenter.z * .76)
        this.container.add(this.instructions.arrows.label.mesh)
        groundLayer(this.instructions.arrows.label.mesh, 'label')

        if(!this.config.touch)
        {
            // Keys
            this.instructions.arrows.up = this.objects.add({
                base: this.resources.items.introArrowKeyBase.scene,
                collision: this.resources.items.introArrowKeyCollision.scene,
                offset: introPropOffset(this.resources.items.introArrowKeyCollision.scene, introLayout.keys.x, introLayout.keys.y),
                rotation: new THREE.Euler(0, 0, 0),
                duplicated: true,
                shadow: { sizeX: 1, sizeY: 1, offsetZ: - 0.2, alpha: 0.5 },
                mass: 1.5,
                soundName: 'brick'
            })
            this.instructions.arrows.down = this.objects.add({
                base: this.resources.items.introArrowKeyBase.scene,
                collision: this.resources.items.introArrowKeyCollision.scene,
                offset: introPropOffset(this.resources.items.introArrowKeyCollision.scene, introLayout.keys.x, introLayout.keys.y - .8),
                rotation: new THREE.Euler(0, 0, Math.PI),
                duplicated: true,
                shadow: { sizeX: 1, sizeY: 1, offsetZ: - 0.2, alpha: 0.5 },
                mass: 1.5,
                soundName: 'brick'
            })
            this.instructions.arrows.left = this.objects.add({
                base: this.resources.items.introArrowKeyBase.scene,
                collision: this.resources.items.introArrowKeyCollision.scene,
                offset: introPropOffset(this.resources.items.introArrowKeyCollision.scene, introLayout.keys.x - .8, introLayout.keys.y - .8),
                rotation: new THREE.Euler(0, 0, Math.PI * 0.5),
                duplicated: true,
                shadow: { sizeX: 1, sizeY: 1, offsetZ: - 0.2, alpha: 0.5 },
                mass: 1.5,
                soundName: 'brick'
            })
            this.instructions.arrows.right = this.objects.add({
                base: this.resources.items.introArrowKeyBase.scene,
                collision: this.resources.items.introArrowKeyCollision.scene,
                offset: introPropOffset(this.resources.items.introArrowKeyCollision.scene, introLayout.keys.x + .8, introLayout.keys.y - .8),
                rotation: new THREE.Euler(0, 0, - Math.PI * 0.5),
                duplicated: true,
                shadow: { sizeX: 1, sizeY: 1, offsetZ: - 0.2, alpha: 0.5 },
                mass: 1.5,
                soundName: 'brick'
            })
        }
    }

    setOtherInstructions()
    {
        if(this.config.touch)
        {
            return
        }

        this.otherInstructions = {}
        this.otherInstructions.x = introLayout.other.x
        this.otherInstructions.y = introLayout.other.y

        // Container
        this.otherInstructions.container = new THREE.Object3D()
        this.otherInstructions.container.position.x = this.otherInstructions.x
        this.otherInstructions.container.position.y = this.otherInstructions.y
        this.otherInstructions.container.matrixAutoUpdate = false
        this.otherInstructions.container.updateMatrix()
        this.container.add(this.otherInstructions.container)

        // Label
        this.otherInstructions.label = {}

        this.otherInstructions.label.geometry = new THREE.PlaneGeometry(4.8, 4.8, 1, 1)

        this.otherInstructions.label.texture = this.resources.items.introInstructionsOtherTexture
        this.otherInstructions.label.texture.magFilter = THREE.NearestFilter
        this.otherInstructions.label.texture.minFilter = THREE.LinearFilter

        this.otherInstructions.label.material = new THREE.MeshBasicMaterial({ transparent: true, alphaMap: this.otherInstructions.label.texture, color: 0xffffff, depthWrite: false, opacity: 0 })

        this.otherInstructions.label.mesh = new THREE.Mesh(this.otherInstructions.label.geometry, this.otherInstructions.label.material)
        this.otherInstructions.label.mesh.matrixAutoUpdate = false
        this.otherInstructions.container.add(this.otherInstructions.label.mesh)
        groundLayer(this.otherInstructions.label.mesh, 'label')

        // Horn
        this.otherInstructions.horn = this.objects.add({
            base: this.resources.items.hornBase.scene,
            collision: this.resources.items.hornCollision.scene,
            offset: new THREE.Vector3(this.otherInstructions.x + .8, this.otherInstructions.y - 2.9, 0.2),
            rotation: new THREE.Euler(0, 0, 0.5),
            duplicated: true,
            shadow: { sizeX: 1.65, sizeY: 0.75, offsetZ: - 0.1, alpha: 0.4 },
            mass: 1.5,
            soundName: 'horn',
            sleep: false
        })
    }

    setTitles()
    {
        const texture = labelTexture(['SAKSHAM AGARWAL', 'SOFTWARE / APPLIED AI', 'VIT BHOPAL / CLASS OF 2027'], 1024, 256)
        const title = new THREE.Mesh(new THREE.PlaneGeometry(introLayout.title.width, introLayout.title.height), new THREE.MeshBasicMaterial({ alphaMap: texture, transparent: true, depthWrite: false, color: '#f8ebce' }))
        title.name = 'Arrival / identity floor lettering'
        title.position.set(introLayout.title.x, introLayout.title.y, 0)
        this.container.add(title)
        groundLayer(title, 'label')
        this.title = title
    }

    setDikes()
    {
        this.dikes = { items: [] }
        this.dikes.brickOptions = {
            base: this.resources.items.brickBase.scene,
            collision: this.resources.items.brickCollision.scene,
            offset: new THREE.Vector3(0, 0, .1),
            rotation: new THREE.Euler(),
            duplicated: true,
            shadow: { sizeX: 1.2, sizeY: 1.8, offsetZ: -.15, alpha: .35 },
            mass: .5,
            soundName: 'brick'
        }
        // A pair of low practice walls frames the outer bays. Deterministic
        // courses replace the scattered L-shapes without blocking departure.
        for (const corner of introLayout.brickCorners) {
            this.dikes.items.push(this.walls.add({
                object: this.dikes.brickOptions,
                shape: {
                    type: 'brick', equilibrateLastLine: true,
                    widthCount: 4, heightCount: 2,
                    position: new THREE.Vector3(this.x + corner.x, this.y + corner.y, 0),
                    offsetWidth: new THREE.Vector3(0, 1.05, 0),
                    offsetHeight: new THREE.Vector3(0, 0, .45),
                    randomOffset: new THREE.Vector3(),
                    randomRotation: new THREE.Vector3()
                }
            }))
        }
    }

    dispose()
    {
        if (this.disposed) return
        this.disposed = true
        const geometries = new Set(), materials = new Set()
        this.courtyard?.traverse(mesh => {
            if (!mesh.isMesh) return
            geometries.add(mesh.geometry)
            materials.add(mesh.material)
        })
        for (const geometry of geometries) geometry.dispose()
        for (const material of materials) material.dispose()
        for (const texture of this.courtyardTextures || []) texture.dispose()
        this.title?.geometry.dispose()
        this.title?.material.alphaMap.dispose()
        this.title?.material.dispose()
        this.instructions?.arrows.label.material.dispose()
        this.otherInstructions?.label.geometry.dispose()
        this.otherInstructions?.label.material.dispose()
        if (this.courtyardCollision?.body) this.objects.physics.world.removeBody(this.courtyardCollision.body)
        this.container.remove(this.courtyard)
        this.courtyard = null
        this.courtyardCollision = null
    }
}
