import { surfaceHeight } from './LandscapeLayout.js'

export const scenicKitUrl='./saksham/models/scenic-kit.glb'
export const scenicKinds=['ramp-large','ramp-small','goal-post','ridge-arch','channel','bridge','border','bollard','lemon']
export const playgroundUpgrades=[
    {id:'east-jump',kind:'ramp-large',x:-32.5,y:-43.75,angle:Math.PI/2},
    {id:'west-jump',kind:'ramp-large',x:-44,y:-43.75,angle:-Math.PI/2},
    {id:'north-practice',kind:'ramp-small',x:-37.2,y:-39,angle:Math.PI/2},
    {id:'south-practice',kind:'ramp-small',x:-37.2,y:-48.8,angle:Math.PI/2},
    {id:'practice-goal',kind:'goal-post',x:-38.17,y:-43.66,angle:Math.PI/2},
]
export const ridgeArch={id:'ridge-aperture',kind:'ridge-arch',x:-49,y:-80,z:Math.max(surfaceHeight(-55,-80),surfaceHeight(-43,-80))+.04,radius:8}
export const roadsideBenches=[
    {id:'west-avenue-rest',kind:'bench',x:-17,y:-64,angle:-Math.PI/2},
    {id:'east-avenue-rest',kind:'bench',x:22,y:-65,angle:Math.PI/2},
    {id:'promenade-rest',kind:'bench',x:50,y:-68,angle:-Math.PI/2},
    {id:'garden-approach-rest',kind:'bench',x:-55,y:-104,angle:Math.PI},
]
// Three short drains per court, with a pedestrian crossing at the centre.
// These sit parallel to the road, beyond its painted shoulder.
export const drainageRuns=[{x:75,y:-34},{x:105,y:-74},{x:135,y:-114}]
export const roadsideDetails=[
    ...drainageRuns.flatMap(({x,y},i)=>[
        ...[-6,0,6].map((dx,n)=>({id:`drain-${i}-${n}`,kind:'channel',x:x+dx,y,angle:Math.PI/2})),
        {id:`crossing-${i}`,kind:'bridge',x,y,z:.12},
        ...[-5,5].map((dx,n)=>({id:`border-${i}-${n}`,kind:'border',x:x+dx,y:y+2.1})),
        ...[-2,2].map((dx,n)=>({id:`reflector-${i}-${n}`,kind:'bollard',x:x+dx,y:y-1.1})),
    ]),
    {id:'west-rest-border',kind:'border',x:-17,y:-62.2,angle:Math.PI/2},
    {id:'east-rest-border',kind:'border',x:23.8,y:-65,angle:Math.PI/2},
    {id:'garden-rest-border',kind:'border',x:-55,y:-105.8},
].map(p=>({...p,z:surfaceHeight(p.x,p.y)+(p.z || 0)}))

export const scenicReservations=[...roadsideDetails,...roadsideBenches].map(p=>({
    x:p.x,y:p.y,w:p.kind==='channel'?6.1:p.kind==='border'&&!p.angle?4.7:2.3,
    h:p.kind==='border'&&p.angle?4.7:p.kind==='bridge'?2.1:1.3,
}))
// Explicit retirement keeps nearby trees, fences and rocks intact.
// Match GLTFLoader sanitization: underscores distinguish ramp meshes from
// unrelated fence meshes such as shadeBrown.014 -> shadeBrown014.
export const playgroundNodeName=name=>name.replace(/\s/g,'_').replace(/[[\].:/]/g,'')
const clean=playgroundNodeName
export const retiredPlaygroundMeshes=new Set([
    'shadeBeige_001','shadeBeige_002','shadeBeige_003','shadeBeige_005','shadeBeige_006','shadeBeige_007','shadeBeige_008','shadeBeige_009','shadeBeige','shadeRed_003','shadeRed_004','shadeBrown.059',
    ...['018','019','020','021','022','023','014'].flatMap(n=>[`shadeBrown_${n}`,`shadeBrown_${n}.001`]),
    ...Array.from({length:18},(_,i)=>`shadeBrown_017.${String(i+2).padStart(3,'0')}`),
    ...Array.from({length:8},(_,i)=>`shadeBrown_015.${String(i+1).padStart(3,'0')}`),
    ...Array.from({length:4},(_,i)=>`shadeBrown_016.${String(i+1).padStart(3,'0')}`),
].map(clean))
export const retiredPlaygroundCollisions=new Set(Array.from({length:8},(_,i)=>`Cube${String(i+86).padStart(3,'0')}`))
export function retainPlaygroundScene(scene,retired) {
    const copy=scene.clone(true)
    copy.traverse(node=>{if(retired.has(clean(node.name))) node.userData.retiredScenic=true})
    const remove=[];copy.traverse(node=>{if(node.userData.retiredScenic)remove.push(node)})
    remove.forEach(node=>node.removeFromParent())
    return copy
}
