// One composed pedestrian garden beside the ridge route, in Z-up metres.
// The same paths drive the terrain paint and vegetation clearance.
export const garden = { x:-50, y:-115, rx:13, ry:10, shelter:{x:-45,y:-116,w:8.5,h:6.5}, pond:{x:-54.3,y:-115,rx:3.2,ry:2.1} }
export const meadowPatches = [
    {x:-50,y:-115,rx:13,ry:10,garden:true},
    {x:-23,y:-7,rx:12,ry:9,turn:.2}, {x:28,y:-6,rx:12,ry:8,turn:-.3},
    {x:77,y:-7,rx:19,ry:9,turn:.1}, {x:116,y:-7,rx:15,ry:8,turn:-.15}, {x:146,y:-6,rx:15,ry:9,turn:.2},
    {x:72,y:-130,rx:14,ry:5,turn:-.15}, {x:134,y:-130,rx:15,ry:5,turn:.15},
    {x:-59,y:-81,rx:8,ry:11,turn:.15},
]
// Hand-tuned lobes vary the meadow silhouettes without moving their anchors.
export function meadowOutline(patch,index=0) {
    const count=64,turn=patch.turn || 0,cos=Math.cos(turn),sin=Math.sin(turn)
    return Array.from({length:count},(_,i)=>{
        const angle=i*Math.PI*2/count
        const radius=patch.garden ? 1 : 1+.09*Math.sin(angle*3+index*.8)+.05*Math.sin(angle*5-index*.6)
        const x=Math.cos(angle)*patch.rx*radius,y=Math.sin(angle)*patch.ry*radius
        return [patch.x+x*cos-y*sin,patch.y+x*sin+y*cos]
    })
}
export const gardenPaths = [
    {width:1.35,points:Array.from({length:25},(_,i)=>{
        const t=i/24,u=1-t
        // Join the actual rounded road approach, rather than its unbuilt corner.
        return [u*u*-41+2*u*t*-50+t*t*-50,u*u*-98.5+2*u*t*-98.5+t*t*-108]
    })},
    {width:1.25,points:Array.from({length:97},(_,i)=>{
        const angle=Math.PI/2+i*Math.PI*2/96
        return [garden.x+Math.cos(angle)*9,garden.y+Math.sin(angle)*7]
    })},
]
export function gardenPathDistance(x,y) {
    let distance=Infinity
    for(const path of gardenPaths) for(let i=1;i<path.points.length;i++) {
        const [ax,ay]=path.points[i-1],[bx,by]=path.points[i],dx=bx-ax,dy=by-ay
        const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)))
        distance=Math.min(distance,Math.hypot(x-ax-t*dx,y-ay-t*dy)-path.width/2)
    }
    return distance
}
export function gardenReserved(x,y,radius) {
    const s=garden.shelter,p=garden.pond
    return gardenPathDistance(x,y)<radius+.45 ||
        (Math.abs(x-s.x)<s.w/2+radius+.6 && Math.abs(y-s.y)<s.h/2+radius+.6) ||
        Math.hypot((x-p.x)/(p.rx+radius+.3),(y-p.y)/(p.ry+radius+.3))<1
}
export const gardenTreeAnchors = [[-60,-108,.85],[-60,-120,.85],[-53,-125,.8],[-42,-125,.8],[-40,-108,.8]]
