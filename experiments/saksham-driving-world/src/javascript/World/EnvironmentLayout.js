import { foundationDistance, landscapeBounds, landscapeSigns, roadEdgeDistance, surfaceHeight } from './LandscapeLayout.js'
import { profilePathClearances } from './Sections/ProfilePaths.js'

// Shared by planting, Blender dressing and clearance tests. Coordinates are Z-up.
export function clearPlanting(x,y,radius,maxSlope=.65) {
    const b=landscapeBounds
    if(x-radius<b.minX+3 || x+radius>b.maxX-3 || y-radius<b.minY+3 || y+radius>b.maxY-3) return false
    if(roadEdgeDistance(x,y)<radius+.8 || foundationDistance(x,y)<radius+.65) return false
    if(profilePathClearances.some(p=>Math.abs(x-p.x)<p.w/2+radius+1 && Math.abs(y-p.y)<p.h/2+radius+1)) return false
    if(landscapeSigns.some(p=>Math.hypot(x-p.x,y-p.y)<radius+2.5)) return false
    // Frame the gateway and ridge arch without blocking their openings or signs.
    if(Math.abs(x-37)<5+radius && Math.abs(y+38)<8+radius) return false
    if(Math.abs(x+49)<8+radius && Math.abs(y+80)<3+radius) return false
    const h=surfaceHeight(x,y)
    return Math.max(...[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>Math.abs(surfaceHeight(x+dx,y+dy)-h)))<maxSlope
}

function random(seed) {
    return () => { seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296 }
}

export function grovePlacements(baseRadius) {
    const rand=random(7183),items=[]
    // Elliptical clusters with open intervals, not a continuous roadside fence.
    const clusters=[[-23,-9,8,5,5],[29,-10,7,5,5],[76,-6,13,5,9],[116,-7,10,4,7],[145,-5,10,5,7],
        [-61,-78,8,10,6],[-58,-113,6,9,6],[-39,-135,7,3,4],[174,-91,3,9,3],
        [71,-131,10,3,4],[134,-130,10,3,4]]
    for(const [cx,cy,rx,ry,count] of clusters) {
        let accepted=0
        for(let attempt=0;attempt<count*30 && accepted<count;attempt++) {
            const a=rand()*Math.PI*2,r=Math.sqrt(rand()),size=rand()
            const scale=(size<.25 ? .76 : size>.85 ? 1.22 : 1)*( .9+rand()*.2)
            const radius=baseRadius*scale+.12 // Includes the animated crown envelope.
            const x=cx+Math.cos(a)*r*rx,y=cy+Math.sin(a)*r*ry
            if(!clearPlanting(x,y,radius)) continue
            if(items.some(p=>Math.hypot(p.x-x,p.y-y)<(p.radius+radius)*.85+.5)) continue
            items.push({x,y,z:surfaceHeight(x,y),scale,radius,angle:rand()*Math.PI*2})
            accepted++
        }
    }
    return items
}

export function dressingPlacements(trees) {
    const rand=random(6209),items=[]
    const add=(kind,x,y,scale,angle,maxSlope=1.4)=>{
        const radius=(kind.startsWith('rock') ? 1.55 : kind==='grass' ? .55 : .9)*scale
        if(!clearPlanting(x,y,radius,maxSlope)) return
        if(trees.some(p=>Math.hypot(p.x-x,p.y-y)<radius+.65)) return
        if(items.some(p=>Math.hypot(p.x-x,p.y-y)<(p.radius+radius)*.7)) return
        items.push({kind,x,y,z:surfaceHeight(x,y),scale,radius,angle})
    }
    // Short stratified outcrops follow the banks; gaps retain distant views.
    for(const [cx,cy,count] of [[76,-48,5],[107,-49,7],[142,-48,4],[81,-89,5],[121,-88,7],[-58,-87,5],[-58,-118,4]]) {
        for(let i=0;i<count;i++) {
            const x=cx+(i-(count-1)/2)*2.1,y=cy+(rand()-.5)*2.4
            add(`rock-${i%3}`,x,y,.65+rand()*.55,.2+rand()*.65)
            add(i%2 ? 'shrub-0' : 'grass',x-1.3,y-1.7,.8+rand()*.35,rand()*6.28,.8)
        }
    }
    for(let i=0;i<trees.length;i++) {
        const tree=trees[i]
        for(let n=0;n<3;n++) {
            const angle=rand()*Math.PI*2,r=1.35+rand()*1.7
            add(n===0 ? `shrub-${i%2}` : 'grass',tree.x+Math.cos(angle)*r,tree.y+Math.sin(angle)*r,.7+rand()*.5,angle,.8)
        }
    }
    return items
}
