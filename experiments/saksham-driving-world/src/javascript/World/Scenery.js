import * as THREE from 'three'

// Ambient environmental decoration scattered across the upper world between
// sections. Lightweight ground markings, accent rings, directional arrows,
// and soft glow circles that make empty stretches feel designed, not barren.
export default class Scenery {
    constructor({ objects, resources, tiles }) {
        this.container = new THREE.Group()
        this.container.name = 'Environmental scenery'

        // Reuse the same tree clone routine from ProfileDistrict.
        const treeSource = new THREE.Group()
        const originalTree = objects.items.find(o => o.container.children.some(n => n.name === 'shadeGreen'))
        if (originalTree) {
            for (const node of originalTree.container.children.filter(n => ['shadeGreen', 'shadeBrown003'].includes(n.name))) {
                treeSource.add(node.clone())
            }
        }
        const bounds = new THREE.Box3().setFromObject(treeSource)
        const center = bounds.getCenter(new THREE.Vector3())
        const scale = 3.8 / Math.max(.01, bounds.max.z - bounds.min.z)
        treeSource.children.forEach(node => {
            node.position.x -= center.x
            node.position.y -= center.y
            node.position.z -= bounds.min.z
            node.updateMatrix()
        })

        const tree = (x, y, size = 1, angle = 0) => {
            const copy = treeSource.clone(true)
            copy.position.set(x, y, .02)
            copy.scale.setScalar(scale * size)
            copy.rotation.z = angle
            copy.updateMatrix()
            this.container.add(copy)
        }

        // ── Soft ground accent rings ───────────────────────────────────
        // Subtle glow circles mark key junctions and rest areas.
        const accentRing = (x, y, innerR, outerR, color = '#c3cdf7', opacity = .18) => {
            const mesh = new THREE.Mesh(
                new THREE.RingGeometry(innerR, outerR, 64),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
            )
            mesh.position.set(x, y, .013)
            this.container.add(mesh)
        }

        const groundCircle = (x, y, radius, color = '#ffffff', opacity = .04) => {
            const mesh = new THREE.Mesh(
                new THREE.CircleGeometry(radius, 48),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
            )
            mesh.position.set(x, y, .011)
            this.container.add(mesh)
        }

        // Dashed directional stripe — a series of small rectangles along a path.
        const dashedStripe = (x1, y1, x2, y2, color = '#ffffff', opacity = .08, dashLen = .8, gapLen = 1.2) => {
            const dx = x2 - x1, dy = y2 - y1
            const length = Math.sqrt(dx * dx + dy * dy)
            const angle = Math.atan2(dy, dx)
            const stripeW = .18, stripeH = dashLen
            let distance = 0
            while (distance < length) {
                const cx = x1 + (dx / length) * (distance + dashLen / 2)
                const cy = y1 + (dy / length) * (distance + dashLen / 2)
                const dash = new THREE.Mesh(
                    new THREE.PlaneGeometry(stripeW, stripeH),
                    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
                )
                dash.position.set(cx, cy, .015)
                dash.rotation.z = angle - Math.PI / 2
                this.container.add(dash)
                distance += dashLen + gapLen
            }
        }

        // ── Trees along the main north–south corridor ──────────────────
        // Between Intro (y = 0) and Crossroads (y = -30).
        tree(-11, -8, .85, .3)
        tree(10, -6, .95, -.2)
        tree(-13, -16, .7, .5)
        tree(12, -18, .88, -.4)
        tree(-10, -24, 1.05, .1)
        tree(11, -25, .72, -.3)

        // ── Trees flanking the crossroads ──────────────────────────────
        // The crossroads sits at (0, -30); roads go east to projects, west to
        // playground, and south to information.
        tree(-18, -28, .9, .4)
        tree(-16, -36, .78, -.2)
        tree(18, -28, 1.0, .3)
        tree(16, -35, .65, -.5)

        // ── East corridor: crossroads → projects (y = -30, x = 12 → 30) ──
        tree(20, -25, .75, .2)
        tree(22, -36, .85, -.3)

        // ── West corridor: crossroads → playground (y = -34, x = -20 → -38) ──
        tree(-24, -28, .68, .4)
        tree(-28, -38, .9, -.2)
        tree(-35, -28, .82, .5)

        // ── South corridor: crossroads → information (y = -30 → -55) ──
        tree(-7, -40, .95, .3)
        tree(8, -42, .72, -.4)
        tree(-6, -48, .8, .2)
        tree(9, -50, .88, -.1)

        // ── Accent rings at route junctions ────────────────────────────
        // Crossroads junction hub.
        groundCircle(0, -30, 5, '#c3cdf7', .035)
        accentRing(0, -30, 4.7, 5.0, '#c3cdf7', .14)

        // Information section arrival (1.2, -55).
        groundCircle(1.2, -55, 4.5, '#d4e7ef', .03)
        accentRing(1.2, -55, 4.2, 4.5, '#d4e7ef', .12)

        // Playground arrival (-38, -34).
        groundCircle(-38, -34, 4, '#edc4da', .03)
        accentRing(-38, -34, 3.7, 4.0, '#edc4da', .12)

        // ── Ground dashes along long corridors ─────────────────────────
        // These give the roads a sense of direction and motion.
        // North–south main road (intro to crossroads).
        dashedStripe(0, -5, 0, -28, '#c3cdf7', .06)

        // Crossroads east arm (to projects).
        dashedStripe(7, -30, 26, -30, '#ffe5b8', .06)

        // Crossroads west arm (to playground).
        dashedStripe(-7, -30, -32, -34, '#edc4da', .05)

        // Crossroads south arm (to information).
        dashedStripe(0, -32, 1.2, -52, '#d4e7ef', .05)

        // Information south into profile district.
        dashedStripe(1.2, -57, 0, -66, '#ffffff', .04)

        // ── Small decorative ground pools ──────────────────────────────
        // Soft translucent circles add visual interest in open stretches.
        groundCircle(-5, -12, 2, '#9585be', .025)
        groundCircle(6, -20, 1.8, '#788ace', .02)
        groundCircle(-4, -38, 2.2, '#b9c5eb', .025)
        groundCircle(14, -32, 1.5, '#c3cdf7', .02)
        groundCircle(-30, -32, 1.8, '#edc4da', .02)

        // ── Tile markers at section boundaries ─────────────────────────
        // Add extra tiles to fill sparse corridors, using the existing tile
        // system from the world. These connect sections visually.

        // Extra tiles east of the crossroads toward the first project.
        tiles.add({ start: new THREE.Vector2(14, -30), delta: new THREE.Vector2(12, 0) })

        // Extra tiles west of the crossroads toward the playground.
        tiles.add({ start: new THREE.Vector2(-20, -30), delta: new THREE.Vector2(-12, -4) })

        // Extra tiles south from information into the profile district.
        tiles.add({ start: new THREE.Vector2(1.2, -57), delta: new THREE.Vector2(-1, -9) })
    }
}
