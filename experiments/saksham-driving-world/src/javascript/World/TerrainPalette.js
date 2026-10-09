// One land palette for the entire valley. Exposed rock is driven by the actual
// terrain height and normal, so authored meadow paint cannot erase the ridge.
export const terrainPalette = {
    valley: '#4d754e',
    foothill: '#71875b',
    stone: '#927859',
    crest: '#b6a082',
    terraces: ['#516f52', '#617752', '#567858'],
    fog: '#a6b49a',
}

const smooth = (low, high, value) => {
    const t = Math.max(0, Math.min(1, (value-low)/(high-low)))
    return t*t*(3-2*t)
}

export function terrainBlendWeights(height, normalZ = 1) {
    const slope = 1-Math.max(0, Math.min(1, normalZ))
    const elevationRock = smooth(3.5, 11, height)
    const slopeRock = smooth(.1, .4, slope)*.82
    const rock = 1-(1-elevationRock)*(1-slopeRock)
    return {
        foothill: smooth(.5, 5, height)*.62,
        rock,
        crest: smooth(9, 17, height)*.35,
        meadow: 1-rock,
    }
}
