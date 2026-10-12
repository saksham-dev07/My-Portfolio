// These are GLTFLoader's sanitized node names. Keep the original plinths,
// wayfinding signs and the rocks that correspond to the unchanged colliders.
export const retainedHubNodes = Object.freeze([
    'shadeWhite078', 'shadeWhite077', 'shadeWhite007', 'shadeWhite079', 'shadeWhite080',
    'shadeWhite_001001', 'shadeWhite_003002', 'shadeWhite_005001', 'shadeWhite_014001',
    'shadeWhite_015001', 'shadeWhite_015004', 'shadeWhite_015011', 'shadeWhite_015012',
    'shadeWhite_015013', 'shadeWhite_015014', 'shadeWhite_015015', 'shadeWhite_015016', 'shadeWhite_015017',
    'shadeBrown', 'shadeWhite081', 'shadeGray009',
    'shadeBrown004', 'shadeWhite084', 'shadeGray004',
    'shadeBrown005', 'shadeWhite085', 'shadeGray005'
])

export const hubPadTop = .95451218
// The main arrival is from +Y, looking down the -Y road. Furniture scenes
// present their open side to that approach; the dunk and arcade use side views
// so the backboard/cabinet cannot obscure the action.
export const hubActivities = Object.freeze([
    { id: 'basketball', x: 0, y: -30, angle: Math.PI / 2, pad: 'shadeWhite078' },
    { id: 'coding', x: -9, y: -21, angle: Math.PI, pad: 'shadeWhite077' },
    { id: 'tv', x: 9, y: -21, angle: Math.PI, pad: 'shadeWhite007' },
    { id: 'gym', x: -9, y: -39, angle: Math.PI, pad: 'shadeWhite079' },
    { id: 'gaming', x: 9, y: -39, angle: -Math.PI / 2, pad: 'shadeWhite080' }
].map(Object.freeze))

// Move original boards and their entire footing out of the three approach
// lanes. Geometry and Cannon proxies use the same measured translation.
export const hubSignRelocations = Object.freeze([
    {
        id: 'west', title: 'PLAYGROUND', board: 'shadeWhite081', lettering: 'shadeGray009', pole: 'shadeBrown', backSide: 1, delta: [0, 4.4],
        nodes: ['shadeBrown', 'shadeWhite081', 'shadeGray009', 'shadeWhite_003002', 'shadeWhite_015001', 'shadeWhite_015004'],
        colliders: ['Cube020', 'Cube024']
    },
    {
        id: 'east', title: 'PROJECTS', board: 'shadeWhite085', lettering: 'shadeGray005', pole: 'shadeBrown005', backSide: 1, delta: [0, 4.4],
        nodes: ['shadeBrown005', 'shadeWhite085', 'shadeGray005', 'shadeWhite_005001', 'shadeWhite_014001', 'shadeWhite_015011', 'shadeWhite_015012'],
        colliders: ['Cube022', 'Cube025', 'Cube026']
    },
    {
        id: 'south', title: 'INFORMATION', board: 'shadeWhite084', lettering: 'shadeGray004', pole: 'shadeBrown004', backSide: -1,
        // The original arrow points +Y. Turn it toward the Information garden
        // at (0, -56), from its relocated footing beside the south exit.
        delta: [-4.5, -5], angle: Math.atan2(-12, 4.25) - Math.PI / 2, pivot: [.25215, -9.10364],
        nodes: ['shadeBrown004', 'shadeWhite084', 'shadeGray004', 'shadeWhite_001001', 'shadeWhite_015013', 'shadeWhite_015014', 'shadeWhite_015015', 'shadeWhite_015016', 'shadeWhite_015017'],
        colliders: ['Cube021', 'Cube023']
    }
].map(group => Object.freeze({ ...group, delta: Object.freeze(group.delta), nodes: Object.freeze(group.nodes), colliders: Object.freeze(group.colliders) })))
