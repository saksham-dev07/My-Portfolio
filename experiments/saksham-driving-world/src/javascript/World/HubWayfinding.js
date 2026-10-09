import * as THREE from 'three'
import { retainedHubNodes, hubSignRelocations } from './HubLayout.js'

export function buildHubStatic(baseScene, collisionScene) {
    const allowed = new Set(retainedHubNodes), base = new THREE.Group()
    for(const node of baseScene.children) {
        if(allowed.has(node.name)) base.add(node.clone())
    }
    // Resource meshes remain at their authoring coordinates: the original sign
    // template is reused elsewhere, and reloads must never accumulate offsets.
    const collision = collisionScene.clone(true)
    const move = (scene, names, [x, y]) => {
        for(const name of names) {
            const node = scene.getObjectByName(name)
            if(!node) continue
            node.position.x += x
            node.position.y += y
            node.updateMatrix()
        }
    }
    for(const group of hubSignRelocations) {
        move(base, group.nodes, group.delta)
        move(collision, group.colliders, group.delta)
    }
    return { base, collision }
}
