import {seededRandom} from './FieldNoise.js'

// Bridson Poisson-disc sampling with a spatial grid and seeded active list.
export function poissonDisc({bounds,spacing,seed,maxCount,accept,seeds=[]}){
    const random=seededRandom(seed),cell=spacing/Math.SQRT2,grid=new Map(),points=[],active=[]
    const key=(x,y)=>`${x},${y}`
    const fits=(x,y)=>{
        if(x<bounds.minX||x>bounds.maxX||y<bounds.minY||y>bounds.maxY||!accept(x,y))return false
        const gx=Math.floor(x/cell),gy=Math.floor(y/cell)
        for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){
            const p=grid.get(key(gx+dx,gy+dy));if(p&&Math.hypot(p.x-x,p.y-y)<spacing)return false
        }
        return true
    }
    const add=(x,y)=>{const p={x,y};points.push(p);active.push(p);grid.set(key(Math.floor(x/cell),Math.floor(y/cell)),p)}
    for(const [x,y]of seeds)if(fits(x,y))add(x,y)
    // Find one valid start in each disconnected grove, not only the first one.
    for(let i=0;i<600&&points.length<Math.min(maxCount,24);i++){
        const x=bounds.minX+random()*(bounds.maxX-bounds.minX),y=bounds.minY+random()*(bounds.maxY-bounds.minY)
        if(fits(x,y))add(x,y)
    }
    while(active.length&&points.length<maxCount){
        const index=Math.floor(random()*active.length),p=active[index];let found=false
        for(let i=0;i<24;i++){
            const angle=random()*Math.PI*2,r=spacing*(1+random()),x=p.x+Math.cos(angle)*r,y=p.y+Math.sin(angle)*r
            if(fits(x,y)){add(x,y);found=true;break}
        }
        if(!found){active[index]=active[active.length-1];active.pop()}
    }
    return points.slice(0,maxCount)
}
