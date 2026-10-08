import * as THREE from 'three'

const layers = {
    shadow: { height: .04, order: 10, units: -2 },
    accent: { height: .055, order: 20, units: -3 },
    backdrop: { height: .08, order: 30, units: -4 },
    label: { height: .10, order: 40, units: -5 },
}

// Ground decals retain depth testing: vehicles and buildings still occlude
// them. Physical separation plus a small depth bias survives all camera modes.
export function groundLayer(mesh, kind = 'label') {
    if (mesh.userData.groundLayer) return mesh
    const layer = layers[kind]
    const original = mesh.material
    // Named imported materials are shared by solid props. Unnamed decal
    // materials are owned by their component, including its opacity tweens.
    mesh.material = original.name ? original.clone() : original
    // Preserve reveal/hover uniform ownership. Only raster state is isolated.
    if (original.uniforms) mesh.material.uniforms = original.uniforms
    // Empty names intentionally keep per-texture shadows out of static batches.
    if (original.name) mesh.material.name += `:ground-${kind}`
    Object.assign(mesh.material, {
        transparent: true, depthWrite: false, depthTest: true,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: layer.units,
    })
    for (const texture of [mesh.material.map, mesh.material.alphaMap, mesh.material.uniforms?.tShadow?.value]) {
        if (!texture) continue
        texture.generateMipmaps = true
        texture.minFilter = THREE.LinearMipmapLinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.anisotropy = 4
        texture.needsUpdate = true
    }
    mesh.updateWorldMatrix(true, false)
    const world = mesh.getWorldPosition(new THREE.Vector3())
    world.z += layer.height
    if (mesh.parent) mesh.parent.worldToLocal(world)
    mesh.position.copy(world)
    mesh.renderOrder = layer.order
    mesh.userData.groundLayer = kind
    mesh.updateMatrix()
    return mesh
}

// Imported ground lettering shares materials with solid props. Classify only
// horizontal, near-ground meshes, then split their static batch material.
export function stabilizeGround(root, background, terrain) {
    root.updateWorldMatrix(true, true)
    const bounds = new THREE.Box3()
    root.traverse(mesh => {
        if (!mesh.isMesh || mesh === background || mesh === terrain || mesh.isInstancedMesh || mesh.userData.terrainShadow || mesh.userData.groundLayer) return
        if (!mesh.visible || !mesh.material || Array.isArray(mesh.material)) return
        for (let parent = mesh.parent; parent; parent = parent.parent) if (!parent.visible) return
        // Intro lettering starts at zero opacity and fades in after this pass.
        // Invisible raycast planes have no texture and must retain their position.
        if (mesh.material.opacity === 0 && !mesh.material.map && !mesh.material.alphaMap) return
        bounds.setFromObject(mesh)
        if (bounds.max.z - bounds.min.z > .025 || bounds.min.z < -.005 || bounds.max.z > .12) return
        const material = mesh.material
        const kind = material.map || material.alphaMap ? 'label'
            : material.uniforms?.tShadow ? 'shadow'
            : /Circle|Ring/.test(mesh.geometry.type) ? 'accent'
            : material.transparent && material.color?.getHex() === 0x181b2c ? 'backdrop' : 'label'
        groundLayer(mesh, kind)
    })
}

// Deform each moving blob onto the real heightfield instead of clipping a
// horizontal quad into slopes. Geometry belongs to this shadow, never shared.
export function conformShadow(mesh, heightAt) {
    const positions = mesh.geometry.attributes.position
    const cos = Math.cos(mesh.rotation.z), sin = Math.sin(mesh.rotation.z)
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i) * mesh.scale.x, y = positions.getY(i) * mesh.scale.y
        const height = heightAt(mesh.position.x + cos*x - sin*y, mesh.position.y + sin*x + cos*y)
        positions.setZ(i, (height + .06 - mesh.position.z) / mesh.scale.z)
    }
    positions.needsUpdate = true
    mesh.geometry.computeBoundingSphere()
}
