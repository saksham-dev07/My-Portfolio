import * as THREE from 'three'

export const retiredInformationMeshes = new Set([
    'shadeWhite111', 'shadeWhite', 'shadeWhite112', 'shadeRed005', 'shadeBlue',
    'shadeGray007', 'shadeRed001',
    'shadeOrange024', 'shadeWhite114', 'shadeWhite_033', 'shadeOrange005',
    'shadeOrange003', 'shadeWhite115', 'shadeOrange006', 'shadeOrange022',
    'shadeWhite_036', 'shadeWhite_037', 'shadeWhite_038', 'shadeWhite_039', 'shadeWhite116',
])
export const retiredInformationCollisions = new Set(['Cube055', 'Cube058', 'Cube059', 'Cube', 'Cube063', 'Cube064', 'Cube065', 'Cube066', 'Cube067', 'Cube068'])
export const informationLandmark = { x: -7, y: 6, scale: 1 }
export const retiredInformationShadows = [
    { x: -6.17, y: 6.37, radius: 1.28, height: 3.89 },
    { x: -4.35, y: 4.38, radius: .63, height: 1.85 },
    ...[1.9, 4.3, 6.7, 9.1].map((x, i) => ({ x, y: .667, radius: i ? 1 : 1.65, height: 2 })),
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
