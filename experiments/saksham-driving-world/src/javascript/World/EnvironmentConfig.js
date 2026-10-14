// Desktop environment controls. Restart the world after changing layout values.
export const environmentConfig = Object.freeze({
    seed: 18276,
    grassDensity: 1.1,
    grassLimit: 14000,
    flowerCount: 240,
    hillHeight: .7,
    treeCount: 85,
    treeSpacing: 4.8,
    patchScale: 31,
    detailStrength: .07,
    grassWind: .035,
    grassViewDistance: 100,
    grassChunkSize: 32,
    grassBorderBias: .65,
    fogDistance: 480,
    sunIntensity: .85,
    ambientIntensity: 1.05,
    // Bright cinematic late-afternoon light. Set strength to 0 for daylight.
    dusk: Object.freeze({strength: .55, exposure: 1.08, lampStrength: .8, accentStrength: .5,
        shadowFill: [.72,.80,.98], sunKey: [1.15,1.06,.90],
        horizon: '#bdc6cb', zenith: '#6b91b2', water: '#4f8492'}),
    parks: [
        {id:'west-pocket',x:-21,y:-67,w:7,h:7},
        {id:'promenade-pocket',x:51,y:-48,w:7,h:7},
    ],
    parkPaths: [
        {park:'west-pocket',x:-14.55,y:-67,w:5.9,h:1.05},
        {park:'promenade-pocket',x:51,y:-42.9,w:1.05,h:3.2},
    ],
})
