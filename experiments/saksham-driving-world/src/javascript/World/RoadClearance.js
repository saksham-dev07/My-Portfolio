import {roads,roadShoulder} from './LandscapeLayout.js'

// Bounded exact queries for verge paint. The paint fades out before four metres;
// distant road segments therefore cannot affect it. Physics/road layout is untouched.
const range=4,cell=12,buckets=new Map(),circles=[]
for(const road of roads){
    const width=road.width/2+(road.shoulder??roadShoulder)
    if(road.center){circles.push({center:road.center,radius:road.radius,width});continue}
    for(let i=1;i<road.samples.length;i++){
        const a=road.samples[i-1],b=road.samples[i],dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy
        if(!length2)continue
        const segment={a,dx,dy,length2,width},pad=width+range
        for(let x=Math.floor((Math.min(a.x,b.x)-pad)/cell);x<=Math.floor((Math.max(a.x,b.x)+pad)/cell);x++)
            for(let y=Math.floor((Math.min(a.y,b.y)-pad)/cell);y<=Math.floor((Math.max(a.y,b.y)+pad)/cell);y++){
                const key=`${x},${y}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(segment)
            }
    }
}
export function vergeRoadClearance(x,y){
    let distance=range
    for(const road of circles)distance=Math.min(distance,Math.abs(Math.hypot(x-road.center[0],y-road.center[1])-road.radius)-road.width)
    for(const s of buckets.get(`${Math.floor(x/cell)},${Math.floor(y/cell)}`)||[]){
        const t=Math.max(0,Math.min(1,((x-s.a.x)*s.dx+(y-s.a.y)*s.dy)/s.length2))
        distance=Math.min(distance,Math.hypot(x-s.a.x-t*s.dx,y-s.a.y-t*s.dy)-s.width)
    }
    return distance
}
