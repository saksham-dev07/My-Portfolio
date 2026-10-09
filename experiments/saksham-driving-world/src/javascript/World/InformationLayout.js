import * as THREE from 'three'

export const retiredInformationMeshes = new Set([
    'shadeWhite111', 'shadeWhite', 'shadeWhite112', 'shadeRed005', 'shadeBlue',
    'shadeGray007', 'shadeRed001',
])
export const retiredInformationCollisions = new Set(['Cube055', 'Cube058', 'Cube059', 'Cube'])
export const informationLandmark = { x: -7, y: 6, scale: 1 }
export const retiredInformationShadows = [
    { x: -6.17, y: 6.37, radius: 1.28, height: 3.89 },
    { x: -4.35, y: 4.38, radius: .63, height: 1.85 },
]
export const informationNodeName = name => name.replace(/\./g, '')

export function buildInformationStatic(base, collision) {
    const cloneExcept = (source, retired) => {
        const group = new THREE.Group()
        for (const node of source.children) if (!retired.has(informationNodeName(node.name))) group.add(node.clone(true))
        return group
    }
    return { base: cloneExcept(base, retiredInformationMeshes), collision: cloneExcept(collision, retiredInformationCollisions) }
}
