import * as THREE from 'three'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import fontData from 'three/examples/fonts/helvetiker_bold.typeface.json'

const signFont = new FontLoader().parse(fontData)

export const directionSigns = [
    { text: 'SKILLS', x: -5, y: -91, right: false, angle: 0 },
    { text: 'HIGHLIGHTS', x: 9, y: -91, right: true, angle: 0 },
    { text: 'EDUCATION', x: 17, y: -104, right: false, angle: Math.PI / 2 },
]

// Clone the original arrow board and pole, preserving authored bevels/materials.
// Replace only the lettering; mirrored geometry never mirrors the text.
export default class DirectionSigns {
    constructor(template, container, solids) {
        this.items = []
        if (!template?.children.length) return
        template.updateMatrixWorld(true)
        // The south-facing original board is long along Y. Bake a quarter
        // turn so every copy uses a horizontal X board and a Y-facing label.
        const aligned = new THREE.Group()
        const quarterTurn = new THREE.Matrix4().makeRotationZ(Math.PI / 2)
        for (const node of template.children) {
            if (!node.isMesh) continue
            const mesh = new THREE.Mesh(node.geometry.clone().applyMatrix4(quarterTurn.clone().multiply(node.matrixWorld)), node.material)
            mesh.name = node.name
            aligned.add(mesh)
        }
        template = aligned
        template.updateMatrixWorld(true)
        const bounds = new THREE.Box3().setFromObject(template)
        const origin = bounds.getCenter(new THREE.Vector3())
        origin.z = bounds.min.z
        const board = template.getObjectByName('shadeWhite084')
        const boardBounds = new THREE.Box3().setFromObject(board)
        const boardCenter = boardBounds.getCenter(new THREE.Vector3()).sub(origin)
        const boardSize = boardBounds.getSize(new THREE.Vector3())
        // Keep the support inside the board thickness, never over its lettering.
        const support = template.getObjectByName('shadeBrown004')
        const supportBounds = new THREE.Box3().setFromObject(support)
        support.geometry.translate(0, boardBounds.getCenter(new THREE.Vector3()).y - supportBounds.getCenter(new THREE.Vector3()).y, 0)
        const supportVertices = support.geometry.attributes.position
        for (let i = 0; i < supportVertices.count; i++) {
            supportVertices.setZ(i, Math.min(supportVertices.getZ(i), boardBounds.min.z + .02))
        }
        support.geometry.computeVertexNormals()
        const positions = board.geometry.attributes.position
        const tipRanges = [[Infinity, -Infinity], [Infinity, -Infinity]]
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i), z = positions.getZ(i)
            for (let side = 0; side < 2; side++) if (Math.abs(x - (side ? boardBounds.max.x : boardBounds.min.x)) < .04) {
                tipRanges[side][0] = Math.min(tipRanges[side][0], z)
                tipRanges[side][1] = Math.max(tipRanges[side][1], z)
            }
        }
        const pointsRight = tipRanges[1][1] - tipRanges[1][0] < tipRanges[0][1] - tipRanges[0][0]
        for (const sign of directionSigns) {
            const group = new THREE.Group()
            group.name = `Direction / ${sign.text}`
            group.position.set(sign.x, sign.y, 0)
            group.rotation.z = sign.angle
            const copy = template.clone(true)
            copy.position.copy(origin).multiplyScalar(-1)
            copy.updateMatrix()
            const holder = new THREE.Group()
            holder.scale.x = sign.right === pointsRight ? 1 : -1
            holder.add(copy)
            group.add(holder)
            const textX = boardCenter.x * holder.scale.x
            const material = [new THREE.MeshBasicMaterial({ color: '#725747' }), new THREE.MeshBasicMaterial({ color: '#4b342b' })]
            const geometry = new TextGeometry(sign.text, { font: signFont, size: 1, depth: .018, curveSegments: 3, bevelEnabled: false })
            geometry.computeBoundingBox()
            const textBounds = geometry.boundingBox
            const textSize = textBounds.getSize(new THREE.Vector3())
            // Tall, tightly fitted dimensional letters like the original sign.
            geometry.translate(-textBounds.getCenter(new THREE.Vector3()).x, -textBounds.getCenter(new THREE.Vector3()).y, 0)
            geometry.scale(boardSize.x * .76 / textSize.x, boardSize.z * .66 / textSize.y, 1)
            for (const side of [-1, 1]) {
                const label = new THREE.Mesh(geometry, material)
                label.name = `Raised lettering / ${sign.text} / ${side}`
                label.rotation.set(Math.PI / 2, 0, side > 0 ? Math.PI : 0)
                label.position.set(textX, (side < 0 ? boardBounds.min.y : boardBounds.max.y) - origin.y + side * .035, boardCenter.z)
                group.add(label)
            }
            container.add(group)
            this.items.push(group)
            const pole = new THREE.Object3D()
            pole.name = 'box'
            pole.position.set(sign.x, sign.y, (bounds.max.z - bounds.min.z) / 2)
            pole.scale.set(.45, .45, bounds.max.z - bounds.min.z)
            solids.push(pole)
        }
    }
}
