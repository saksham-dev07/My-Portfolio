import * as THREE from 'three'

// The original atlases baked trees into the same image as rails and rocks.
// Erase only the old tree's projected footprint, preserving the other shadows.
export function retiredTreeMask(tree) {
    // The baked soft light spreads well beyond the original block crown.
    // Include its penumbra and long tail, rather than erasing only the stem.
    return new THREE.Vector4(tree.x, tree.y, tree.radius + 2, tree.height * 1.8 + .6)
}

export function suppressRetiredTreeShadows(trees, sun) {
    const atlases = new Map()
    for (const tree of trees) for (const mesh of tree.floorMeshes) {
        if (!atlases.has(mesh)) atlases.set(mesh, [])
        atlases.get(mesh).push(retiredTreeMask(tree))
    }
    for (const [mesh, masks] of atlases) {
        mesh.material.defines = { ...mesh.material.defines, ERASED_TREE_COUNT: masks.length }
        mesh.material.uniforms.uErasedTrees = { value: masks }
        mesh.material.uniforms.uTreeShadowDirection = { value: new THREE.Vector2(sun.x, sun.y) }
        mesh.material.needsUpdate = true
        mesh.userData.retiredTreeShadows = masks.length
    }
    return atlases.size
}
