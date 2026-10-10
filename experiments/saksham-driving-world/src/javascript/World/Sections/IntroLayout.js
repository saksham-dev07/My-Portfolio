// World-space contracts for the arrival courtyard. Keep the spawn and its
// connection to the first road open; decorative props occupy the side bays.
export const introLayout = Object.freeze({
    forecourt: { x: 0, y: 2.4, width: 18, depth: 17, radius: 1.2 },
    departure: { halfWidth: 2.4, fromY: -9, toY: 4.6 },
    keys: { x: -6.2, y: -.6, labelY: -3.1 },
    other: { x: 6.3, y: -.5 },
    title: { x: 0, y: 12.2, width: 12, height: 3.1 },
    signs: [
        { x: -6.4, y: 3.3, lines: ['START HERE', 'DRIVE. DISCOVER. PLAY.'] },
        { x: 6.4, y: 3.3, lines: ['GO EXPLORE', 'FOLLOW THE STONE TRAIL'] },
    ],
    brickCorners: [
        { x: -10.3, y: 1.5, angle: Math.PI / 2 },
        { x: 10.3, y: 1.5, angle: Math.PI / 2 },
    ],
})
