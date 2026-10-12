// Z-up world coordinates. The main approach travels toward -Y, so titles and
// entry pads belong on the +Y side of the artworks, ahead of their silhouettes.
// Navigation, planting exclusions and visible interaction frames share these.
export const profileArtworkPositions = {
    about: { x: 2, y: -80 },
    skills: { x: -24, y: -90 },
    highlights: { x: 30, y: -90 },
    education: { x: 2, y: -112 },
}

export const profileForecourts = {
    about: { title: { x: 2, y: -73, w: 12, h: 2.4 }, entry: { x: 2, y: -69.9, w: 7, h: 3 } },
    skills: { title: { x: -24, y: -83.5, w: 12, h: 2.4 }, entry: { x: -24, y: -80.4, w: 7, h: 3 } },
    highlights: { title: { x: 30, y: -83.5, w: 12, h: 2.4 }, entry: { x: 30, y: -80.4, w: 7, h: 3 } },
    // The rally start lives farther east; the campus now has a centered, open
    // approach between its facade and the circuit, with a gap between labels.
    education: { title: { x: 2, y: -105.8, w: 12, h: 2.4 }, entry: { x: 2, y: -102.4, w: 8, h: 3 } },
}

export const curiosityLabel = { x: 1.2, y: -65.5, w: 11, h: 4 }
export const campusForecourt = { x: 2, y: -104.7, w: 16, h: 7.6 }
