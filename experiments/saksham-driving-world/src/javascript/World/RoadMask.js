// A one-time chamfer distance field, in thirds of a pixel. Derive the curb from
// the asphalt union rather than overlapping independent shoulder strokes.
function distances(mask, width, height, foreground) {
    const field = new Uint16Array(mask.length)
    for (let i = 0; i < field.length; i++) field[i] = Boolean(mask[i]) === foreground ? 0 : 32767
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const i = y*width+x
        if (!field[i]) continue
        let value = field[i], candidate
        if (x) { candidate = field[i-1]+3; if (candidate < value) value = candidate }
        if (y) {
            candidate = field[i-width]+3; if (candidate < value) value = candidate
            if (x) { candidate = field[i-width-1]+4; if (candidate < value) value = candidate }
            if (x < width-1) { candidate = field[i-width+1]+4; if (candidate < value) value = candidate }
        }
        field[i] = value
    }
    for (let y = height-1; y >= 0; y--) for (let x = width-1; x >= 0; x--) {
        const i = y*width+x
        if (!field[i]) continue
        let value = field[i], candidate
        if (x < width-1) { candidate = field[i+1]+3; if (candidate < value) value = candidate }
        if (y < height-1) {
            candidate = field[i+width]+3; if (candidate < value) value = candidate
            if (x) { candidate = field[i+width-1]+4; if (candidate < value) value = candidate }
            if (x < width-1) { candidate = field[i+width+1]+4; if (candidate < value) value = candidate }
        }
        field[i] = value
    }
    return field
}

export function roadMaskPixels(coverage, width, height, shoulderPixels, filletPixels) {
    const mask = new Uint8Array(coverage.length)
    for (let i = 0; i < mask.length; i++) mask[i] = coverage[i] >= 128 ? 1 : 0
    let field = distances(mask, width, height, true)
    const expanded = new Uint8Array(mask.length)
    for (let i = 0; i < mask.length; i++) expanded[i] = field[i] <= filletPixels*3 ? 1 : 0
    field = distances(expanded, width, height, false)
    // Closing rounds only concave intersections; straight lanes keep their width.
    const closed = new Uint8Array(mask.length)
    for (let i = 0; i < mask.length; i++) closed[i] = mask[i] || field[i] > filletPixels*3 ? 1 : 0
    field = distances(closed, width, height, true)
    const pixels = new Uint8ClampedArray(mask.length*4)
    for (let i = 0; i < mask.length; i++) {
        const asphalt = closed[i] ? 255 : coverage[i]
        pixels[i*4] = Math.max(asphalt, Math.round(255*Math.max(0, Math.min(1, shoulderPixels+.5-field[i]/3))))
        pixels[i*4+1] = asphalt
        pixels[i*4+3] = 255
    }
    return pixels
}
