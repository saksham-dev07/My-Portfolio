// Shared reservations keep procedural trees and furniture out of the courts.
// The original landmark positions, labels, interaction pads and roads stay put.
export const districtPalette = Object.freeze({
    green: '#285545', lawn: '#63885a', cream: '#d9c8a7', light: '#eee2c5',
    terracotta: '#b96e50', brass: '#c9aa70', charcoal: '#505953', soil: '#493e32',
})

export const districtCourts = [
    { id: 'about', x: 2, y: -77, w: 16.8, h: 18, corner: 2.2 },
    { id: 'skills', x: -24, y: -87.2, w: 16, h: 17, corner: 1.1 },
    { id: 'highlights', x: 30, y: -86.7, w: 17, h: 18, corner: 2.2 },
    { id: 'education', x: 2, y: -109.8, w: 19, h: 17.8, corner: 1.3 },
]

export const districtFurniture = [
    { id: 'about-west-bench', district: 'about', kind: 'bench', x: -5.4, y: -76, angle: -Math.PI / 2 },
    { id: 'about-east-bench', district: 'about', kind: 'bench', x: 9.4, y: -76, angle: Math.PI / 2 },
    { id: 'about-west-bed', district: 'about', kind: 'bed', x: -4.5, y: -84.6 },
    { id: 'about-east-bed', district: 'about', kind: 'bed', x: 8.5, y: -84.6 },
    { id: 'skills-tool-rack', district: 'skills', kind: 'rack', x: -29.1, y: -91.8 },
    { id: 'skills-tool-chest', district: 'skills', kind: 'chest', x: -18.8, y: -94.3 },
    { id: 'skills-task-light', district: 'skills', kind: 'lamp', x: -29.1, y: -94.4 },
    { id: 'highlights-west-pennant', district: 'highlights', kind: 'banner', x: 23.7, y: -94.4, side: 1 },
    { id: 'highlights-east-pennant', district: 'highlights', kind: 'banner', x: 36.3, y: -94.4, side: -1 },
    { id: 'campus-west-bed', district: 'education', kind: 'bed', x: -5.8, y: -109.3, angle: Math.PI / 2 },
    { id: 'campus-east-bed', district: 'education', kind: 'bed', x: 9.8, y: -109.3, angle: Math.PI / 2 },
    { id: 'campus-west-bench', district: 'education', kind: 'bench', x: -5.7, y: -116.9 },
    { id: 'campus-east-bench', district: 'education', kind: 'bench', x: 9.7, y: -116.9 },
    { id: 'campus-west-lantern', district: 'education', kind: 'lamp', x: -6.2, y: -113.5 },
    { id: 'campus-east-lantern', district: 'education', kind: 'lamp', x: 10.2, y: -113.5 },
]

export const districtReservations = districtCourts.map(court => ({ x: court.x, y: court.y, w: court.w, h: court.h }))

// Visual wheel effects recognise paved courts without changing car physics.
// About remains lawn/gravel, where dust is appropriate.
export function isDistrictPaving(x, y) {
    return districtCourts.some(court => {
        if (court.id === 'about') return false
        const dx = Math.abs(x - court.x), dy = Math.abs(y - court.y)
        if (dx > court.w / 2 || dy > court.h / 2) return false
        return Math.hypot(Math.max(0, dx - (court.w / 2 - court.corner)), Math.max(0, dy - (court.h / 2 - court.corner))) <= court.corner
    })
}
