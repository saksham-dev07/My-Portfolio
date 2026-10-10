import { profileSections } from '../../sakshamProfile.js'
import { circuitStops } from './ProfileCircuit.js'

export const educationStops = [
    { x: -19, y: -103, title: '2020 / SCHOOL', chapter: 'school', padOffsetX: -1 },
    { x: -19, y: -109, title: '2022 / SCIENCE', chapter: 'science', padOffsetX: -1 },
    { x: -19, y: -115, title: '2023 / VIT', chapter: 'campus', padOffsetX: -1 },
]
// One hierarchical route network:
// - two lanes leave the Information garden and flank the About portrait,
// - an About forecourt passes in front of its OPEN DETAILS pad,
// - an upper avenue runs directly beneath the Skills and Highlights pads,
// - one closed ring links the education journey, campus and rebuild clearing.
// Pads sit beside the road instead of being crossed or skirted by it.
export const profilePaths = [
    [[-9, -71.5], [-9, -98.5]],
    [[13, -71.5], [13, -98.5]],
    [[-9, -88.5], [13, -88.5]],
    [[2, -98.5], [40, -98.5], [40, -124], [-26.5, -124], [-26.5, -98.5], [2, -98.5]],
]

// Labels, pads, the portrait plinth and district signs stay beside the roads.
export const profilePathClearances = [
    ...circuitStops.map(stop => ({ x: stop.x + Math.cos(stop.angle) * 1.1, y: stop.y + Math.sin(stop.angle) * 1.1, w: Math.abs(Math.cos(stop.angle)) > .5 ? 5 : 4, h: Math.abs(Math.cos(stop.angle)) > .5 ? 4 : 5 })),
    ...profileSections.flatMap(section => [
        { x: section.x, y: section.y + 1, w: 16, h: 7 },
        { x: section.x, y: section.y - 4, w: 8, h: 4 },
    ]),
    { x: 1.2, y: -65, w: 11, h: 5.5 },
    { x: 2, y: -73, w: 5.5, h: 5.5 },
    { x: -4.5, y: -73, w: 3.6, h: .65 },
    { x: 8.5, y: -73, w: 3.6, h: .65 },
    { x: -4.5, y: -70.5, w: 2.5, h: .9 },
    { x: 8.5, y: -70.5, w: 2.5, h: .9 },
    ...educationStops.flatMap(({x,y,padOffsetX}) => [
        { x: x + padOffsetX, y, w: 3, h: 3 },
        { x: x + 4, y, w: 2.6, h: 3.2 },
    ]),
    { x: -19, y: -120, w: 11, h: 1.5 },
    { x: 30, y: -115, w: 6, h: 3 },
    { x: 30, y: -119, w: 12, h: 1.5 },
]
