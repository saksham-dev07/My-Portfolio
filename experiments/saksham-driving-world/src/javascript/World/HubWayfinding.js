import * as THREE from 'three'
import { retainedHubNodes, hubSignRelocations } from './HubLayout.js'
import { raisedSignFaces } from './Sections/DirectionSigns.js'

export function buildHubStatic(baseScene, collisionScene) {
    const allowed = new Set(retainedHubNodes), base = new THREE.Group()
    for(const node of baseScene.children) {
        if(allowed.has(node.name) && !hubSignRelocations.some(sign => sign.lettering === node.name)) base.add(node.clone())
    }
    // Resource meshes remain at their authoring coordinates: the original sign
    // template is reused elsewhere, and reloads must never accumulate offsets.
    const collision = collisionScene.clone(true)
    const move = (scene, names, { delta: [x, y], angle = 0, pivot = [0, 0] }) => {
        for(const name of names) {
            const node = scene.getObjectByName(name)
            if(!node) continue
            if(angle) {
                node.position.sub(new THREE.Vector3(...pivot, 0)).applyAxisAngle(new THREE.Vector3(0, 0, 1), angle).add(new THREE.Vector3(...pivot, 0))
                node.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), angle)
            }
            node.position.x += x
            node.position.y += y
            node.updateMatrix()
        }
    }
    for(const group of hubSignRelocations) {
        move(base, group.nodes, group)
        move(collision, group.colliders, group)
        // A post should end at the board, rather than covering the lettering
        // on one face. Clone geometry before editing the reused resource.
        const board = base.getObjectByName(group.board), pole = base.getObjectByName(group.pole)
        if(board && pole) {
            base.updateMatrixWorld(true)
            const bottom = new THREE.Box3().setFromObject(board).min.z - pole.position.z + .02
            pole.geometry = pole.geometry.clone()
            const vertices = pole.geometry.attributes.position
            for(let i = 0; i < vertices.count; i++) vertices.setZ(i, Math.min(vertices.getZ(i), bottom))
            vertices.needsUpdate = true
            pole.geometry.computeVertexNormals()
            pole.geometry.computeBoundingBox()
            pole.geometry.computeBoundingSphere()
        }
    }
    return { base, collision }
}

// Replace oversized original lettering with matching, upright faces on both
// sides, including signs turned toward their actual destination.
export function hubSignBacks(convertedBase, offset) {
    convertedBase.updateMatrixWorld(true)
    const faces = []
    for(const sign of hubSignRelocations) {
        const board = convertedBase.getObjectByName(sign.board)
        if(!board) continue
        faces.push(...raisedSignFaces(board, sign.title, offset))
    }
    return faces
}
