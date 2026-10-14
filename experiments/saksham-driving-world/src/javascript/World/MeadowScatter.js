import {roads,roadShoulder,landscapeBounds,surfaceHeight,projectSites,landscapeSigns} from './LandscapeLayout.js'
import {landmarkTreeClearances} from './EnvironmentLayout.js'
import {profilePathClearances} from './Sections/ProfilePaths.js'
import {scenicReservations,playgroundUpgrades} from './ScenicRouteLayout.js'
import {gardenReserved} from './GardenLayout.js'
import {directionSigns} from './Sections/DirectionSigns.js'
import {environmentConfig} from './EnvironmentConfig.js'
import {fieldNoise,seededRandom} from './FieldNoise.js'

// Static corridor index makes thousands of placement checks cheap. Exact road
// segment distances are checked inside each bucket; no coarse-mask leaks.
const cell=12,buckets=new Map(),key=(x,y)=>`${x},${y}`,borderSegments=[]
let borderLength=0
for(const road of roads)for(let i=1;i<road.samples.length;i++){
    const a=road.samples[i-1],b=road.samples[i],width=road.width/2+(road.shoulder??roadShoulder),pad=width+4
    const segment={a,b,width,dx:b.x-a.x,dy:b.y-a.y}
    segment.length2=segment.dx*segment.dx+segment.dy*segment.dy
    segment.length=Math.sqrt(segment.length2);borderLength+=segment.length
    borderSegments.push({...segment,end:borderLength})
    for(let x=Math.floor((Math.min(a.x,b.x)-pad)/cell);x<=Math.floor((Math.max(a.x,b.x)+pad)/cell);x++)for(let y=Math.floor((Math.min(a.y,b.y)-pad)/cell);y<=Math.floor((Math.max(a.y,b.y)+pad)/cell);y++){
        const k=key(x,y);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(segment)
    }
}
export function nearDrivingLane(x,y,radius){
    for(const s of buckets.get(key(Math.floor(x/cell),Math.floor(y/cell)))||[]){
        const t=Math.max(0,Math.min(1,((x-s.a.x)*s.dx+(y-s.a.y)*s.dy)/s.length2))
        if(Math.hypot(x-s.a.x-t*s.dx,y-s.a.y-t*s.dy)<s.width+radius+.55)return true
    }
    return false
}
const clearances=[...landmarkTreeClearances,...profilePathClearances,...scenicReservations,
    ...projectSites.map(p=>({...p,w:23,h:22})),...playgroundUpgrades.map(p=>({...p,w:5,h:5})),
    {x:-54.6,y:-100,w:9.6,h:4.2},{x:-54,y:-44,w:9,h:5},
]
const plantingSigns=[...landscapeSigns,...directionSigns]
export function meadowClear(x,y,radius=.12){
    const b=landscapeBounds
    if(x<b.minX+2||x>b.maxX-2||y<b.minY+2||y>b.maxY-2||nearDrivingLane(x,y,radius))return false
    if(clearances.some(p=>Math.abs(x-p.x)<p.w/2+radius+.35&&Math.abs(y-p.y)<p.h/2+radius+.35))return false
    if(plantingSigns.some(p=>Math.hypot(x-p.x,y-p.y)<radius+1.6)||gardenReserved(x,y,radius))return false
    return true
}
export function meadowProps(trees,existing=[]){
    const random=seededRandom(environmentConfig.seed+411),points=[]
    const clusters=[[-25,-51],[-35,-65],[33,-15],[75,-11],[115,-10],[142,-11],[77,-48],[122,-88],[-57,-91],[-45,-131],[76,-132],[136,-131]]
    for(const [group,[cx,cy]]of clusters.entries()){
      const local=[]
      for(let attempt=0;attempt<45&&local.length<5;attempt++){
        const i=local.length
        const angle=random()*Math.PI*2,r=1.2+random()*3,x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r
        const kind=i===0?`rock-${group%3}`:i===2?`rock-${(group+1)%3}`:['rock-0','bush','rock-1','log','stump'][i],radius=kind==='log'?.85:kind==='bush'?.7:kind==='rock-2'?1.15:.7
        if(!meadowClear(x,y,radius)||[...existing,...points,...local].some(p=>Math.hypot(p.x-x,p.y-y)<radius+(p.radius||.7)+.3)||trees.some(p=>Math.hypot(p.x-x,p.y-y)<radius+.65))continue
        const z=surfaceHeight(x,y);if(Math.abs(surfaceHeight(x+1,y)-z)>.4||Math.abs(surfaceHeight(x,y+1)-z)>.4)continue
        local.push({kind,x,y,z,scale:.8+random()*.25,angle:random()*Math.PI*2,radius,group})
      }
      if(local.length>=3)points.push(...local)
    }
    return points
}
export function* meadowGrassSteps(trees,props=[]){
    const random=seededRandom(environmentConfig.seed+713),items=[]
    const b=landscapeBounds,target=Math.min(environmentConfig.grassLimit,Math.round((b.maxX-b.minX)*(b.maxY-b.minY)*environmentConfig.grassDensity*.4))
    const occupied=new Set()
    for(let attempt=0;attempt<target*18&&items.length<target;attempt++){
        if(attempt%400===0)yield
        let x=b.minX+random()*(b.maxX-b.minX),y=b.minY+random()*(b.maxY-b.minY)
        // Dense ribbons frame actual road corridors, with irregular meadow gaps.
        // Length-weighting keeps tightly sampled curves from getting extra grass.
        if(random()<environmentConfig.grassBorderBias){
            const distance=random()*borderLength
            let low=0,high=borderSegments.length-1
            while(low<high){const mid=(low+high)>>1;if(borderSegments[mid].end<distance)low=mid+1;else high=mid}
            const s=borderSegments[low],t=random(),offset=(s.width+.9+random()*5.2)*(random()<.5?-1:1)
            x=s.a.x+s.dx*t-s.dy/s.length*offset;y=s.a.y+s.dy*t+s.dx/s.length*offset
        }
        const density=fieldNoise(x/11,y/11,environmentConfig.seed)
        if(random()>.15+.85*density*density||!meadowClear(x,y,.12))continue
        const slot=key(Math.floor(x/.3),Math.floor(y/.3));if(occupied.has(slot))continue
        if(props.some(p=>Math.hypot(x-p.x,y-p.y)<(p.radius||.5)+.2)||trees.some(p=>Math.hypot(x-p.x,y-p.y)<.3))continue
        const z=surfaceHeight(x,y)
        if(Math.abs(surfaceHeight(x+.4,y)-z)>.20||Math.abs(surfaceHeight(x,y+.4)-z)>.20)continue
        occupied.add(slot);items.push({kind:'grass',x,y,z,angle:random()*Math.PI*2,scale:1.15+random()*.8,shade:.88+random()*.22})
    }
    return items
}
export function meadowGrass(trees,props=[]){
    const steps=meadowGrassSteps(trees,props)
    let result=steps.next();while(!result.done)result=steps.next()
    return result.value
}
