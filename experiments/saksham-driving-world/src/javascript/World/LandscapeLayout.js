import * as THREE from 'three'
import { profilePaths, profilePathClearances, educationStops } from './Sections/ProfilePaths.js'
import { garden } from './GardenLayout.js'

export const landscapeSigns = [
    { text: 'PROJECTS', x: 30, y: -32, right: true, angle: 0 },
    { text: 'RIDGE ROAD', x: -34, y: -96, right: false, angle: 0 },
    ...educationStops.map(stop => ({ text: stop.title, x: -24, y: stop.y, right: true, angle: 0, target: stop })),
]

// Z-up metres. Foundations remain at the original elevation; geography grows
// between destinations, not beneath their existing artwork or interaction pads.
export const landscapeBounds = { minX: -76, maxX: 180, minY: -148, maxY: 32, step: 2 }
export const researchTerraces = [
    { y: -24, title: '01 / APPLIED SYSTEMS', color: '#b6e3d5', ground: '#53747c' },
    { y: -64, title: '02 / DATA & OPERATIONS', color: '#f5d4b3', ground: '#827080' },
    { y: -104, title: '03 / SMALL EXPERIMENTS', color: '#d8dcff', ground: '#666e93' },
]
export function projectPosition(index) {
    const row = Math.floor(index / 4)
    const column = row % 2 ? 3 - index % 4 : index % 4
    return { x: 60 + column * 30, y: -24 - row * 40 }
}
export const projectSites = Array.from({ length: 12 }, (_, index) => projectPosition(index))
export const foundations = [
    { x: 0, y: -2, w: 36, h: 32 },
    { x: 0, y: -30, w: 35, h: 28 },
    { x: -38, y: -34, w: 49, h: 42 },
    { x: 2, y: -56, w: 30, h: 26 },
    { x: 7, y: -97, w: 88, h: 58 },
    { x: -60, y: -100, w: 12, h: 10 },
    { x: -58, y: -60, w: 10, h: 10 },
    { ...garden.shelter },
    ...projectSites.map(site => ({ x: site.x, y: site.y - 2, w: 23, h: 22 })),
]

// Authored avenues, quarter-turns and one roundabout. Junctions share exact
// coordinates; no freeform spline overshoot or independently stacked surfaces.
export const roadDefinitions = [
    { name: 'Hub roundabout', center: [0,-30], radius: 6, width: 3.2, shoulder: .35, closed: true },
    { name: 'Arrival', points: [[0,-10],[0,-24]], width: 3.2, shoulder: .35 },
    { name: 'Research approach', points: [[6,-30],[22,-30],[22,-38],[60,-38]], width: 4.4, cornerRadius: 6 },
    { name: 'Research promenade', points: [[60,-38],[165,-38],[165,-78],[46,-78],[46,-118],[165,-118],[165,-136],[40,-136],[40,-119]], width: 4.4, cornerRadius: 12 },
    // Two true quarter-turns lead into a straight playground entrance. The old
    // 3m end stub forced a bend tighter than the lane, folding its inner curb.
    { name: 'Playground', points: [[-6,-30],[-21,-30],[-21,-42],[-28,-42]], width: 3.2, cornerRadius: 4, circularCorners: true },
    { name: 'Personal avenue', points: [[0,-36],[0,-60.5]], width: 3.2, shoulder: .35 },
    { name: 'Garden west', points: [[0,-60.5],[-9,-60.5],[-9,-71.5]], width: 3.2, cornerRadius: 6 },
    { name: 'Garden east', points: [[0,-60.5],[13,-60.5],[13,-71.5]], width: 3.2, cornerRadius: 6 },
    ...profilePaths.map((points, index) => ({ name: `Courtyard ${index + 1}`, points, width: 3.2, cornerRadius: 3.5 })),
    { name: 'Ridge detour', points: [[-22,-98.5],[-49,-98.5],[-49,-74],[-57,-65],[-66,-76],[-66,-126],[-40,-134],[-19,-134],[2,-124]], width: 3.2, cornerRadius: 8 },
    { name: 'Quiet clearing', points: [[-58,-67],[-58,-64]], width: 2.4 },
]
export const roadShoulder = .35

export function roadCurve({ points, center, radius, cornerRadius = 3.5, circularCorners = false }) {
    if (center) {
        const curve = new THREE.CurvePath()
        const circle = new THREE.EllipseCurve(...center,radius,radius,0,Math.PI*2,false,0)
        // CurvePath expects Vector3 curves; retain a mathematically circular hub.
        const arc = new THREE.Curve()
        arc.getPoint = t => { const p=circle.getPoint(t); return new THREE.Vector3(p.x,p.y,0) }
        curve.add(arc)
        return curve
    }
    const vectors = points.map(([x,y]) => new THREE.Vector3(x,y,0))
    const curve = new THREE.CurvePath()
    let previous = vectors[0]
    for (let i = 1; i < vectors.length - 1; i++) {
        const corner = vectors[i]
        const beforeAllowance = corner.distanceTo(vectors[i-1]) * (circularCorners && i === 1 ? .9 : .45)
        const afterAllowance = corner.distanceTo(vectors[i+1]) * (circularCorners && i === vectors.length - 2 ? .9 : .45)
        const radius = Math.min(cornerRadius, beforeAllowance, afterAllowance)
        const before = corner.clone().add(vectors[i-1].clone().sub(corner).normalize().multiplyScalar(radius))
        const after = corner.clone().add(vectors[i+1].clone().sub(corner).normalize().multiplyScalar(radius))
        curve.add(new THREE.LineCurve3(previous,before))
        if(circularCorners) {
            const incoming = corner.clone().sub(vectors[i-1]).normalize()
            const outgoing = vectors[i+1].clone().sub(corner).normalize()
            if(Math.abs(incoming.dot(outgoing)) > .000001) throw new Error('Circular road corners require perpendicular approach segments')
            const arcCenter = before.clone().add(outgoing.clone().multiplyScalar(radius))
            const startAngle = Math.atan2(before.y - arcCenter.y, before.x - arcCenter.x)
            const sweep = Math.sign(incoming.x*outgoing.y - incoming.y*outgoing.x) * Math.PI / 2
            const arc = new THREE.Curve()
            arc.getPoint = (t, target = new THREE.Vector3()) => target.set(
                arcCenter.x + radius*Math.cos(startAngle + sweep*t),
                arcCenter.y + radius*Math.sin(startAngle + sweep*t), 0
            )
            arc.getPointAt = arc.getPoint
            arc.getLength = () => radius*Math.abs(sweep)
            arc.getTangent = (t, target = new THREE.Vector3()) => target.set(
                -Math.sin(startAngle + sweep*t)*Math.sign(sweep),
                Math.cos(startAngle + sweep*t)*Math.sign(sweep), 0
            )
            arc.getTangentAt = arc.getTangent
            curve.add(arc)
        } else curve.add(new THREE.QuadraticBezierCurve3(before,corner,after))
        previous = after
    }
    curve.add(new THREE.LineCurve3(previous,vectors.at(-1)))
    return curve
}

export const roads = roadDefinitions.map(definition => {
    const curve = roadCurve(definition)
    const points = curve.getSpacedPoints(Math.ceil(curve.getLength()*2))
    return { ...definition, curve, samples: points }
})
export const smooth = (low, high, value) => {
    const t = THREE.MathUtils.clamp((value-low)/(high-low),0,1)
    return t*t*(3-2*t)
}
const hill = (x,y,cx,cy,rx,ry,height) => height * Math.exp(-2*((x-cx)**2/rx**2+(y-cy)**2/ry**2))
export function roadDistance(x,y) {
    let distance = Infinity
    for (const road of roads) distance = Math.min(distance,distanceToRoad(road,x,y))
    return distance
}
export function distanceToRoad(road,x,y) {
    if (road.center) return Math.abs(Math.hypot(x-road.center[0],y-road.center[1])-road.radius)
    let distance=Infinity
    for(let i=1;i<road.samples.length;i++) {
        const a=road.samples[i-1],b=road.samples[i],dx=b.x-a.x,dy=b.y-a.y
        const t=THREE.MathUtils.clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy),0,1)
        distance=Math.min(distance,Math.hypot(x-a.x-t*dx,y-a.y-t*dy))
    }
    return distance
}
// Signed clearance from the full paved corridor, including its shoulder.
export function roadEdgeDistance(x,y) {
    return Math.min(...roads.map(road=>distanceToRoad(road,x,y)-road.width/2-(road.shoulder ?? roadShoulder)))
}
export function roadsidePosition(x,y,radius) {
    if(roadEdgeDistance(x,y)>=radius+.6) return {x,y}
    // Deterministic nearby relocation keeps established groves together. Reject
    // the entire canopy envelope, and leave labels/interaction pads unobstructed.
    for(let distance=1;distance<=18;distance++) for(let i=0;i<24;i++) {
        const angle=i*Math.PI/12,px=x+Math.cos(angle)*distance,py=y+Math.sin(angle)*distance
        if(roadEdgeDistance(px,py)<radius+.6) continue
        if(profilePathClearances.some(rect=>Math.abs(px-rect.x)<rect.w/2+radius && Math.abs(py-rect.y)<rect.h/2+radius)) continue
        return {x:px,y:py}
    }
    throw new Error(`No safe roadside planting position near ${x}, ${y}`)
}
export function foundationDistance(x,y) {
    let distance = Infinity
    for (const site of foundations) distance = Math.min(distance,Math.hypot(Math.max(0,Math.abs(x-site.x)-site.w/2),Math.max(0,Math.abs(y-site.y)-site.h/2)))
    return distance
}
export function terrainHeight(x,y) {
    const {minX,maxX,minY,maxY} = landscapeBounds
    const edge = Math.min(x-minX,maxX-x,y-minY,maxY-y)
    // Deliberate west ridge, north headland, east escarpment, quiet south basin.
    const bank = (cx,cy,length,height) => {
        const spine=cy+1.4*Math.sin((x-cx)*.055)
        const width=y>spine ? 6 : 11
        return hill(x,y,cx,spine,length,width,height)
    }
    const macro = hill(x,y,-61,-86,17,45,12) + hill(x,y,22,21,35,20,11)
        + hill(x,y,76,23,32,16,7) + hill(x,y,145,22,28,23,10)
        + hill(x,y,179,-49,17,34,12) + hill(x,y,178,-105,15,27,9)
        + hill(x,y,73,-147,34,16,8) + hill(x,y,137,-145,28,13,6)
        + bank(98,-48,39,5.2) + bank(130,-49,21,2.4)
        + bank(111,-88,44,5.8) + bank(76,-89,18,2.2)
    const detail = (.28*Math.sin(x*.15)*Math.cos(y*.13)+.1*Math.sin((x+y)*.43)) * smooth(.5,3,macro)
    // Broad, varying foothills break the tray-like rim without altering bounds.
    const rimWidth=10+5*(.5+.5*Math.sin(x*.047+y*.031))
    const rimHeight=8+2*(.5+.5*Math.cos(x*.037-y*.026))
    const native = Math.max(0,macro+detail+(1-smooth(0,rimWidth,edge))*rimHeight)
    const road = roadDistance(x,y)
    const site = foundationDistance(x,y)
    // The level corridor includes the shoulders and a full heightfield cell.
    // Ridge roads rise gently to 1 m; every old foundation stays at zero.
    const ridgeElevation = hill(x,y,-55,-87,18,36,1) * smooth(0,8,site)
    const elevation=(native*smooth(5.5,9.5,road)+ridgeElevation*(1-smooth(5.5,9.5,road))) * smooth(2,7,site)
    // A level garden lawn and walking loop transition into the west ridge's
    // planted berm. The shelter never sits on an isolated raised terrain island.
    const gardenEdge=Math.hypot((x-garden.x)/garden.rx,(y-garden.y)/garden.ry)
    return elevation*smooth(.78,1.3,gardenEdge)
}

let cached
export function landscapeGrid() {
    if (cached) return cached
    const {minX,maxX,minY,maxY,step} = landscapeBounds
    const nx = (maxX-minX)/step+1, ny = (maxY-minY)/step+1
    const heights = Array.from({length:nx},(_,ix)=>Array.from({length:ny},(_,iy)=>terrainHeight(minX+ix*step,minY+iy*step)))
    cached = { heights,nx,ny,...landscapeBounds }
    return cached
}

// Exact piecewise-linear Cannon Heightfield surface, including its diagonal.
// Roads and vegetation sample this, never an independently evaluated noise field.
export function surfaceHeight(x,y) {
    const grid = landscapeGrid()
    const gx = THREE.MathUtils.clamp((x-grid.minX)/grid.step,0,grid.nx-1.000001)
    const gy = THREE.MathUtils.clamp((y-grid.minY)/grid.step,0,grid.ny-1.000001)
    const ix = Math.floor(gx), iy = Math.floor(gy), u = gx-ix, v = gy-iy
    const a = grid.heights[ix][iy], b = grid.heights[ix+1][iy], c = grid.heights[ix][iy+1], d = grid.heights[ix+1][iy+1]
    return u+v <= 1 ? a+(b-a)*u+(c-a)*v : d+(c-d)*(1-u)+(b-d)*(1-v)
}
