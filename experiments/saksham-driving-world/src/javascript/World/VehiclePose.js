import * as THREE from 'three'

const rotation = new THREE.Quaternion()

export function captureVehiclePose(body) {
    body.previousPosition.copy(body.position)
    if (!body.previousQuaternion) body.previousQuaternion = body.quaternion.clone()
    else body.previousQuaternion.copy(body.quaternion)
}

// Cannon 0.6 does not interpolate orientation. Present the previous/current
// simulation poses together, one fixed step behind, without extrapolating into
// obstacles. Reuse the mesh and quaternion; no frame-time allocations.
export function vehiclePose(mesh, body, world) {
    const dt = world?.dt > 0 ? world.dt : 1/60
    const alpha = Math.min(1, Math.max(0, (world?.time ?? 0) % dt / dt))
    if (body.sleepState === 2 || body.previousPosition.distanceTo(body.position) > 8) {
        mesh.position.copy(body.position)
        mesh.quaternion.copy(body.quaternion)
        return
    }
    mesh.position.lerpVectors(body.previousPosition, body.position, alpha)
    rotation.copy(body.quaternion)
    mesh.quaternion.copy(body.previousQuaternion || body.quaternion).slerp(rotation, alpha)
}
