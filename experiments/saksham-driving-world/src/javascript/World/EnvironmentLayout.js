import { foundationDistance, landscapeBounds, landscapeSigns, researchTerraces, roadEdgeDistance, surfaceHeight } from './LandscapeLayout.js'
import { profilePathClearances } from './Sections/ProfilePaths.js'
import { gardenReserved, gardenTreeAnchors } from './GardenLayout.js'
import { directionSigns } from './Sections/DirectionSigns.js'
import { hubActivities } from './HubLayout.js'

// Unlike terrain foundations, these rectangles describe the actual artwork,
// furniture and labels. Planting can frame a courtyard without filling it.
export const landmarkTreeClearances = [
    {x:0,y:2.4,w:19,h:19.8}, {x:30,y:-110,w:14,h:17},
    {x:0,y:8,w:15,h:7.5}, {x:0,y:-1,w:7,h:8},
    {x:16,y:-2,w:7,h:7}, {x:-14,y:1,w:5,h:5}, {x:9,y:5,w:5,h:5}, {x:-12,y:-13,w:2,h:6},
    {x:-38,y:-32,w:43,h:37}, {x:2,y:-54,w:27,h:19},
    ...hubActivities.map(({x,y})=>({x,y,w:7.4,h:7.4})),
    {x:-24,y:-83,w:7,h:5}, {x:30,y:-83,w:10,h:7}, {x:2,y:-105,w:13,h:8},
    {x:-30,y:-81,w:.8,h:5}, {x:-18,y:-78,w:5.4,h:.8},
    {x:25,y:-77,w:5.4,h:.8}, {x:35,y:-77,w:5.4,h:.8},
    {x:-9,y:-105,w:.8,h:6.5}, {x:10,y:-105,w:.8,h:6.5},
    {x:-12,y:-112,w:4.2,h:.8}, {x:13,y:-112,w:4.2,h:.8},
    {x:30,y:-106,w:7,h:8},
]

export function clearLandmarkPlanting(x,y,radius) {
    const b=landscapeBounds
    if(x-radius<b.minX+3 || x+radius>b.maxX-3 || y-radius<b.minY+3 || y+radius>b.maxY-3) return false
    if(roadEdgeDistance(x,y)<radius+.8 || gardenReserved(x,y,radius)) return false
    if([...landmarkTreeClearances,...profilePathClearances].some(p=>Math.abs(x-p.x)<p.w/2+radius+.65 && Math.abs(y-p.y)<p.h/2+radius+.65)) return false
    if([...landscapeSigns,...directionSigns].some(p=>Math.hypot(x-p.x,y-p.y)<radius+2.5)) return false
    const h=surfaceHeight(x,y)
    return Math.max(...[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>Math.abs(surfaceHeight(x+dx,y+dy)-h)))<.75
}

export function landmarkTreePlacements(baseRadius=2,existing=[]) {
    // Short, differently sized groups frame the outside of each activity.
    // The portrait, campus facade, reset pads and all approach lanes stay open.
    const groups=[
        ['arrival',[[-22,6,.96],[-26,10,.72],[25,5,1.02],[29,9,.76]]],
        ['playground',[[-49,-9,.95],[-55,-11,.74],[-64,-19,.92],[-65,-43,.92],[-56,-55,.8]]],
        ['information',[[-21,-55,.92],[-25,-59,.72],[23,-53,.98],[27,-58,.7]]],
        ['portrait',[[-17,-69,.82],[-21,-73,.96],[21,-70,.98],[25,-74,.72]]],
        ['skills',[[-37,-80,1.02],[-37,-85,.72]]],
        ['highlights',[[39,-70,.96],[34,-72,.72]]],
        ['campus',[[-13,-107,.76],[20,-112,.72],[20,-119,.64]]],
        ['journey',[[-34,-109,.95],[-35,-116,.7]]],
    ]
    const items=[]
    for(const [group,anchors] of groups) for(const [x,y,scale] of anchors) {
        const radius=baseRadius*scale+.12
        if(!clearLandmarkPlanting(x,y,radius)) continue
        if([...items,...existing].some(p=>Math.hypot(p.x-x,p.y-y)<(p.radius+radius)*.85+.5)) continue
        items.push({group,x,y,z:surfaceHeight(x,y),scale,treeScale:scale,radius,angle:(x*.37+y*.21)%(Math.PI*2),kind:items.length%4===2 ? 'tree-copper' : 'tree-broadleaf'})
    }
    return items
}

// Shared by planting, Blender dressing and clearance tests. Coordinates are Z-up.
export function clearPlanting(x,y,radius,maxSlope=.65) {
    const b=landscapeBounds
    if(x-radius<b.minX+3 || x+radius>b.maxX-3 || y-radius<b.minY+3 || y+radius>b.maxY-3) return false
    if(roadEdgeDistance(x,y)<radius+.8 || foundationDistance(x,y)<radius+.65) return false
    if(profilePathClearances.some(p=>Math.abs(x-p.x)<p.w/2+radius+1 && Math.abs(y-p.y)<p.h/2+radius+1)) return false
    if(landscapeSigns.some(p=>Math.hypot(x-p.x,y-p.y)<radius+2.5)) return false
    if(gardenReserved(x,y,radius)) return false
    if(researchTerraces.some(p=>Math.abs(x-105)<17+radius && Math.abs(y-(p.y-19))<1.8+radius)) return false
    // Frame the gateway and ridge arch without blocking their openings or signs.
    if(Math.abs(x-37)<5+radius && Math.abs(y+38)<8+radius) return false
    if(Math.abs(x+49)<8+radius && Math.abs(y+80)<3+radius) return false
    const h=surfaceHeight(x,y)
    return Math.max(...[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>Math.abs(surfaceHeight(x+dx,y+dy)-h)))<maxSlope
}

function random(seed) {
    return () => { seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296 }
}

export function grovePlacements(baseRadius,existing=[]) {
    const rand=random(7183),items=[]
    // Elliptical clusters with open intervals, not a continuous roadside fence.
    const clusters=[[-23,-9,8,5,3],[29,-10,7,5,3],[76,-6,13,5,9],[116,-7,10,4,7],[145,-5,10,5,7],
        [-61,-78,8,10,6],[-39,-135,7,3,4],[174,-91,3,9,3],
        [71,-131,10,3,4],[134,-130,10,3,4]]
    for(const [cx,cy,rx,ry,count] of clusters) {
        let accepted=0
        for(let attempt=0;attempt<count*30 && accepted<count;attempt++) {
            const a=rand()*Math.PI*2,r=Math.sqrt(rand()),size=rand()
            const scale=(size<.25 ? .76 : size>.85 ? 1.22 : 1)*( .9+rand()*.2)
            const radius=baseRadius*scale+.12 // Includes the animated crown envelope.
            const x=cx+Math.cos(a)*r*rx,y=cy+Math.sin(a)*r*ry
            if(!clearPlanting(x,y,radius)) continue
            if(existing.some(p=>Math.hypot(p.x-x,p.y-y)<(p.radius+radius)*.85+.5)) continue
            if(items.some(p=>Math.hypot(p.x-x,p.y-y)<(p.radius+radius)*.85+.5)) continue
            items.push({x,y,z:surfaceHeight(x,y),scale,radius,angle:rand()*Math.PI*2})
            accepted++
        }
    }
    for(const [x,y,scale] of gardenTreeAnchors) {
        const radius=baseRadius*scale+.12
        if(!clearPlanting(x,y,radius) || [...items,...existing].some(p=>Math.hypot(p.x-x,p.y-y)<(p.radius+radius)*.85+.5)) continue
        items.push({x,y,z:surfaceHeight(x,y),scale,radius,angle:rand()*Math.PI*2})
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
    // Border beds hug the outside of the garden loop; keep the lawn open.
    for(const [cx,cy] of [[-60,-110],[-58,-122],[-51,-125],[-40,-123],[-40,-105.5]]) {
        for(let i=0;i<4;i++) {
            add(i%3===0 ? 'shrub-1' : 'grass',cx+(i-1.5)*.9,cy+(rand()-.5)*1.2,.65+rand()*.3,rand()*6.28,.8)
        }
    }
    return items
}

export const flowerBeds=[[75,-8,5.5,1.5],[113,-7.5,4.5,1.3],[146,-7,5.5,1.4],
    [73,-130,5,.9],[135,-130,5,.9],[-55,-106.5,1.5,.5],[-56,-124,1.5,.5],[-40,-108,1.2,1]]

export function flowerPlacements(trees,props=[]) {
    const rand=random(2741),items=[]
    // Eight small border beds give the gardens color while retaining open lawns.
    flowerBeds.forEach(([cx,cy,rx,ry],bed)=>{
        for(let attempt=0,accepted=0;attempt<180 && accepted<14;attempt++) {
            const angle=rand()*Math.PI*2,r=Math.sqrt(rand()),scale=.65+rand()*.3
            const x=cx+Math.cos(angle)*r*rx,y=cy+Math.sin(angle)*r*ry,radius=.7*scale
            if(!clearPlanting(x,y,radius,.8)) continue
            if(trees.some(p=>Math.hypot(p.x-x,p.y-y)<radius+.7)) continue
            if(props.some(p=>Math.hypot(p.x-x,p.y-y)<radius+p.radius*.85)) continue
            if(items.some(p=>Math.hypot(p.x-x,p.y-y)<radius+p.radius+.1)) continue
            items.push({kind:bed%2 ? 'flowers-lilac' : 'flowers-coral',x,y,z:surfaceHeight(x,y),radius,scale,angle:rand()*Math.PI*2})
            accepted++
        }
    })
    return items
}
