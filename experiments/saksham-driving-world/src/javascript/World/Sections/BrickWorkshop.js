import * as THREE from 'three'

export const workshopLayout = Object.freeze({
    court: { x: 30, y: -110, width: 14, depth: 17 },
    scoreboard: { x: 26, y: -102.5 },
    rebuild: { x: 30, y: -115, halfWidth: 3, halfDepth: 1.5 },
    workbench: { x: 34.5, y: -110, width: 2.8, depth: 2.6, height: 2.4 },
})

// Small settling motion is not a hit. Read actual Cannon bodies rather than
// the interpolated display mesh; fallen upper rows count as moved too.
export function brickHasMoved(collision) {
    const current = collision?.body?.position, origin = collision?.origin?.position
    if (!current || !origin) return false
    return Math.hypot(current.x - origin.x, current.y - origin.y) > .55 || Math.abs(current.z - origin.z) > .35
}

export function rebuildBrick(collision) {
    collision.reset()
    const body = collision.body
    if (!body) return
    for (const key of ['velocity', 'angularVelocity', 'force', 'torque']) body[key]?.set(0, 0, 0)
    body.previousPosition?.copy(body.position)
    body.interpolatedPosition?.copy(body.position)
    body.previousQuaternion?.copy(body.quaternion)
    body.interpolatedQuaternion?.copy(body.quaternion)
    body.aabbNeedsUpdate = true
    if (collision.origin?.sleep) body.sleep?.()
    else body.wakeUp?.()
}

// A local, untimed physics toy. Its counter describes the present stack, not
// a fabricated score or achievement. The same ten bodies are reused on reset.
export default class BrickWorkshop {
    constructor({ items, container, solids, time, matcap, document: page = globalThis.document }) {
        this.items = items
        this.time = time
        this.disposed = false
        this.moved = -1
        this.elapsed = 0
        this.draws = 0
        this.container = new THREE.Group()
        this.container.name = 'Maker yard / live stack counter'
        container.add(this.container)
        this.geometries = new Set()
        this.materials = new Set()
        const palette = new Map()
        const material = color => {
            if (!palette.has(color)) {
                const value = matcap ? new THREE.MeshMatcapMaterial({ matcap, color: new THREE.Color(color).convertLinearToSRGB() }) : new THREE.MeshBasicMaterial({ color })
                palette.set(color, value)
                this.materials.add(value)
            }
            return palette.get(color)
        }
        const block = (name, x, y, z, w, d, h, color, solid = false) => {
            const geometry = new THREE.BoxGeometry(w, d, h)
            this.geometries.add(geometry)
            const mesh = new THREE.Mesh(geometry, material(color))
            mesh.name = `Maker yard / ${name}`
            mesh.position.set(x, y, z)
            this.container.add(mesh)
            if (solid) {
                const proxy = new THREE.Object3D()
                proxy.name = 'box'
                proxy.userData.feature = mesh.name
                proxy.position.copy(mesh.position)
                proxy.scale.set(w, d, h)
                solids.push(proxy)
            }
        }
        const { x, y } = workshopLayout.scoreboard
        // Recess the panel inside a butt-jointed frame. Overlaying full-height
        // edge boxes on the panel put both exposed end faces at the same X,
        // while intersecting rails shared front planes at their corners.
        block('counter board', x, y, 1.90, 3.78, .30, 1.36, '#285545', true)
        for (const height of [1.18, 2.62]) block('brass counter trim', x, y, height, 3.94, .38, .08, '#c9aa70')
        for (const side of [-1.93, 1.93]) block('brass counter edge', x + side, y, 1.90, .08, .38, 1.36, '#c9aa70')
        for (const side of [-1.25, 1.25]) {
            block('counter post', x + side, y, .68, .11, .11, 1.24, '#a18b59', true)
            block('counter stone foot', x + side, y, .10, .52, .52, .20, '#d9c8a7', true)
        }

        const canvas = page.createElement('canvas')
        canvas.width = 768
        canvas.height = 384
        this.context = canvas.getContext('2d')
        this.texture = new THREE.CanvasTexture(canvas)
        this.texture.generateMipmaps = true
        this.texture.minFilter = THREE.LinearMipmapLinearFilter
        this.texture.anisotropy = 4
        const faceMaterial = new THREE.MeshBasicMaterial({ color: '#f6e4bd', alphaMap: this.texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })
        this.materials.add(faceMaterial)
        const faceGeometry = new THREE.PlaneGeometry(3.6, 1.28)
        this.geometries.add(faceGeometry)
        for (const [face, direction] of [['front', -1], ['back', 1]]) {
            const mesh = new THREE.Mesh(faceGeometry, faceMaterial)
            mesh.name = `Maker yard / counter ${face}`
            // A physical gap remains stable from grazing side and top views;
            // polygon offset is only an additional decal safeguard.
            mesh.position.set(x, y + direction * .17, 1.90)
            mesh.rotation.set(Math.PI / 2, 0, direction > 0 ? Math.PI : 0, 'ZXY')
            this.container.add(mesh)
        }
        this.refresh()
        time?.on('afterTick.brickWorkshop', () => this.tick())
    }

    tick() {
        if (this.disposed) return
        this.elapsed += Math.max(0, Math.min(60, this.time.delta || 0))
        if (this.elapsed < 100) return
        this.elapsed %= 100
        this.refresh()
    }

    refresh() {
        if (this.disposed) return false
        const count = this.items.reduce((total, item) => total + Number(brickHasMoved(item.collision)), 0)
        if (count === this.moved) return false
        this.moved = count
        const ctx = this.context
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, 768, 384)
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = '700 48px system-ui, sans-serif'
        ctx.fillText('MAKER YARD', 384, 67)
        ctx.font = '700 90px system-ui, sans-serif'
        ctx.fillText(`${count} / ${this.items.length} MOVED`, 384, 191)
        ctx.font = '600 28px system-ui, sans-serif'
        ctx.fillText('PUSH THE STACK. THEN REBUILD.', 384, 314)
        this.texture.needsUpdate = true
        this.draws++
        return true
    }

    rebuild() {
        if (this.disposed) return false
        for (const item of this.items) rebuildBrick(item.collision)
        this.elapsed = 0
        this.refresh()
        return true
    }

    snapshot() { return { moved: this.moved, total: this.items.length } }

    dispose() {
        if (this.disposed) return
        this.disposed = true
        this.time?.off('afterTick.brickWorkshop')
        this.container.removeFromParent()
        this.geometries.forEach(geometry => geometry.dispose())
        this.materials.forEach(value => value.dispose())
        this.texture.dispose()
    }
}
