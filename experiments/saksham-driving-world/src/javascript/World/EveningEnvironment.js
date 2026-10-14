import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {modelLoader} from '../Utils/ModelLoader.js'
import {refinedGeometry,refinedPropsUrl} from './RefinedProps.js'
import {applyDuskPreset,duskLanterns,installDuskMaterial} from './DuskLighting.js'
import {atmosphereOrder,environmentConfig} from './EnvironmentConfig.js'
import {districtCourts} from './Sections/DistrictIdentityLayout.js'
import {surfaceHeight} from './LandscapeLayout.js'
import {meadowClear,nearDrivingLane} from './MeadowScatter.js'
import {meadowCarUniforms} from './MeadowEnvironment.js'

const landmarkAnchors = [
    {id:'about',x:2,y:-80,rx:2.8,ry:2.8,color:'#7fdbc8'},
    {id:'skills',x:-24,y:-90,rx:4.1,ry:3.1,color:'#87c9f1'},
    {id:'highlights',x:30,y:-90,rx:5.4,ry:3.9,color:'#efa7bf'},
    {id:'education',x:2,y:-112,rx:6.8,ry:4.4,color:'#e8be77'},
]

// Interactive kinetic wind spinners placed at scenic pull-offs and overlooks
export const windSpinnerAnchors = [
    [-17, -60.5], [22, -61.5], [50, -64.5], [-55, -101.5],
    [-44, -77.5], [-54, -77.5], [14, -28], [-14, -28],
].filter(([x, y]) => !nearDrivingLane(x, y, 0.75) && meadowClear(x, y, 0.25))
 .map(([x, y], i) => ({ x, y, z: surfaceHeight(x, y), phase: i * 1.15 }))

export const fireflyAnchors = (() => {
    const hubs = [
        ...duskLanterns.map(p => ({x:p.x,y:p.y,spread:2.2})),
        ...environmentConfig.parks.map(p => ({x:p.x,y:p.y,spread:3.4})),
        ...landmarkAnchors.map(p => ({x:p.x,y:p.y,spread:3.8})),
    ]
    const points = []
    for(let i=0;i<64;i++){
        const hub = hubs[i % hubs.length]
        const angle = i * 2.3999632 + (i % 5) * .35
        const radius = .75 + ((i * 7) % 11) / 11 * hub.spread
        const x = hub.x + Math.cos(angle) * radius
        const y = hub.y + Math.sin(angle) * radius
        const safeX = nearDrivingLane(x, y, .65) ? hub.x : x
        const safeY = nearDrivingLane(x, y, .65) ? hub.y : y
        points.push({
            x: safeX,
            y: safeY,
            z: surfaceHeight(safeX, safeY) + .55 + (i % 7) * .28,
            phase: (i * 1.6180339) % (Math.PI * 2),
            speed: .65 + (i % 5) * .18,
            tint: (i % 3) / 2,
        })
    }
    return points
})()

export default class EveningEnvironment{
    constructor({container,time,passes,backdrop=null,meadow=null,car=null,loader=modelLoader}){
        this.container=new THREE.Group();this.container.name='Evening atmosphere / lanterns and district inlays';container.add(this.container)
        Object.assign(this,{time,passes,backdrop,meadow,car,loader});this.disposed=false;this.nextScan=0;this.state='loading';this.materialCount=0
        this.mode=environmentConfig.defaultAtmosphere||'dusk'
        this.fireflyTime={value:0}
        this.fireflyMotion={value:1}
        this.preference=globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)')
        this.syncMotion=()=>{this.fireflyMotion.value=this.preference?.matches?0:1}
        this.syncMotion()
        this.preference?.addEventListener?.('change',this.syncMotion)
        this.materials=new WeakSet();this.visitMaterial=material=>{
            if(this.materials.has(material))return;this.materials.add(material)
            if(installDuskMaterial(material))this.materialCount++
        }
        this.scanMesh=mesh=>{
            if(!mesh.isMesh)return
            if(Array.isArray(mesh.material)){for(const material of mesh.material)this.visitMaterial(material)}
            else this.visitMaterial(mesh.material)
        }
        this.worldContainer=container
        if(environmentConfig.dusk.strength<=0){this.state='disabled';return}
        this.setLamps();this.setInlays();this.setWindSpinners();this.setFireflies()
        this.scan=()=>container.traverse(this.scanMesh);this.scan()
        // A slow material discovery handles deferred GLBs once; wind and driving
        // keep their existing frame callbacks, with no per-frame scene allocations.
        time.on('tick.eveningEnvironment',()=>{
            if(globalThis.document?.hidden)return
            this.fireflyTime.value=(time.elapsed||0)*.001
            if(time.elapsed<this.nextScan)return
            this.nextScan=time.elapsed+1000;this.scan()
        })
        this.setAtmosphere(this.mode)
    }
    emission(material){material.userData.duskEmission=true;return material}
    setLamps(){
        const matrix=new THREE.Matrix4(),dummy=new THREE.Object3D()
        this.cores=new THREE.InstancedMesh(new THREE.BoxGeometry(.35,.35,.375),this.emission(new THREE.MeshBasicMaterial({color:new THREE.Color('#ffd696').convertLinearToSRGB()})),duskLanterns.length)
        this.cores.name='Warm frosted lantern windows'
        duskLanterns.forEach((p,i)=>{matrix.makeTranslation(p.x,p.y,p.z+2.1);this.cores.setMatrixAt(i,matrix)})
        this.container.add(this.cores)
        const haloMaterial=this.emission(new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
            uniforms:{
                strength:{value:environmentConfig.dusk.lampStrength*environmentConfig.dusk.strength},
                uCarPos:meadowCarUniforms.uMeadowCarPos,
            },
            vertexShader:`varying vec2 vGlowUv;
                varying float vCarBoost;
                uniform vec4 uCarPos;
                void main(){
                    vGlowUv=uv;
                    vec4 center=modelMatrix*instanceMatrix*vec4(0,0,0,1);
                    float dist=length(center.xy-uCarPos.xy);
                    vCarBoost=1.0+.42*(1.0-smoothstep(1.5,9.5,dist))*step(-50.0,uCarPos.z);
                    vec4 eye=viewMatrix*center;
                    eye.xy+=position.xy*vCarBoost;
                    gl_Position=projectionMatrix*eye;
                }`,
            fragmentShader:`varying vec2 vGlowUv;varying float vCarBoost;uniform float strength;
                void main(){float r=length(vGlowUv-.5)*2.0;
                    float halo=pow(max(0.0,1.0-r),3.0)*.38*strength*vCarBoost;
                    gl_FragColor=vec4(vec3(1.0,.56,.21),halo);}`,
        }))
        this.halos=new THREE.InstancedMesh(new THREE.PlaneGeometry(2.6,2.6),haloMaterial,duskLanterns.length)
        this.halos.name='Local lantern halos / single billboard batch'
        duskLanterns.forEach((p,i)=>{matrix.makeTranslation(p.x,p.y,p.z+2.1);this.halos.setMatrixAt(i,matrix)})
        this.container.add(this.halos)
        for(const mesh of [this.cores,this.halos]){mesh.computeBoundingSphere();mesh.boundingSphere.radius+=2;mesh.userData.cameraCollision=false}
        this.loader.load(refinedPropsUrl,gltf=>{
            if(this.disposed)return
            try{
                const prototype=refinedGeometry(gltf.scene,'lamp'),points=duskLanterns.filter(p=>!p.existing)
                this.lamps=new THREE.InstancedMesh(prototype.geometry,new THREE.MeshMatcapMaterial({vertexColors:true}),points.length)
                this.lamps.name='Blender lanterns / empty roadside planting gaps';this.lamps.userData.cameraCollision=false
                points.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.updateMatrix();this.lamps.setMatrixAt(i,dummy.matrix)})
                this.lamps.computeBoundingSphere();this.container.add(this.lamps);this.scan();this.state='ready'
            }catch(error){this.state='error';this.error=error.message}
        },undefined,error=>{if(!this.disposed){this.state='error';this.error=error?.message||'Evening lanterns unavailable'}})
    }
    setInlays(){
        const pieces=[],colors={about:'#7fdbc8',skills:'#87c9f1',education:'#e8be77',highlights:'#efa7bf'}
        for(const p of districtCourts){
            // Raised 3D border strips sit above the paving at z+.09 so they never Z-fight with ground decals.
            for(const side of [-1,1]){
                const geometry=new THREE.BoxGeometry(.045,p.h*.65,.06),color=new THREE.Color(colors[p.id]).convertLinearToSRGB()
                geometry.translate(p.x+side*(p.w/2-.32),p.y-1,surfaceHeight(p.x,p.y)+.09)
                const data=new Float32Array(geometry.attributes.position.count*3)
                for(let i=0;i<data.length;i+=3)data.set([color.r,color.g,color.b],i)
                geometry.setAttribute('color',new THREE.BufferAttribute(data,3));pieces.push(geometry)
            }
        }
        this.inlays=new THREE.Mesh(mergeGeometries(pieces),this.emission(new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:environmentConfig.dusk.accentStrength})))
        pieces.forEach(p=>p.dispose());this.inlays.name='District light inlays / existing paving edges';this.inlays.userData.cameraCollision=false
        this.container.add(this.inlays)
    }
    setWindSpinners(){
        if(!windSpinnerAnchors.length)return
        const postParts=[],colorPost=new THREE.Color('#50695b').convertLinearToSRGB(),colorCap=new THREE.Color('#d9ba7b').convertLinearToSRGB()
        for(const p of windSpinnerAnchors){
            const post=new THREE.CylinderGeometry(.035,.05,1.55,6)
            post.rotateX(Math.PI/2)
            post.translate(p.x,p.y,p.z+.775)
            const data=new Float32Array(post.attributes.position.count*3)
            for(let i=0;i<data.length;i+=3)data.set([colorPost.r,colorPost.g,colorPost.b],i)
            post.setAttribute('color',new THREE.BufferAttribute(data,3))
            postParts.push(post)
        }
        this.spinnerPosts=new THREE.Mesh(
            mergeGeometries(postParts),
            this.emission(new THREE.MeshBasicMaterial({vertexColors:true}))
        )
        postParts.forEach(p=>p.dispose())
        this.spinnerPosts.name='Roadside kinetic wind spinner posts'
        this.spinnerPosts.userData.cameraCollision=false
        this.container.add(this.spinnerPosts)

        const bladeParts=[]
        for(let b=0;b<6;b++){
            const a=(b/6)*Math.PI*2
            const vane=new THREE.BoxGeometry(.36,.07,.018)
            vane.translate(.19,0,0)
            vane.rotateZ(a)
            const c=(b%2===0)?colorCap:new THREE.Color('#80cbb2').convertLinearToSRGB()
            const data=new Float32Array(vane.attributes.position.count*3)
            for(let i=0;i<data.length;i+=3)data.set([c.r,c.g,c.b],i)
            vane.setAttribute('color',new THREE.BufferAttribute(data,3))
            bladeParts.push(vane)
        }
        const rotorGeo=mergeGeometries(bladeParts)
        bladeParts.forEach(p=>p.dispose())
        const phases=new Float32Array(windSpinnerAnchors.length)
        rotorGeo.setAttribute('aSpinnerPhase',new THREE.InstancedBufferAttribute(phases,1))
        const rotorMat=this.emission(new THREE.ShaderMaterial({
            vertexColors:true,
            uniforms:{
                uTime:this.fireflyTime,
                uMotion:this.fireflyMotion,
                uCarPos:meadowCarUniforms.uMeadowCarPos,
            },
            vertexShader:`
                attribute float aSpinnerPhase;
                varying vec3 vSpinnerColor;
                varying float vSpinBoost;
                uniform float uTime;
                uniform float uMotion;
                uniform vec4 uCarPos;
                void main(){
                    vSpinnerColor=color;
                    vec3 anchor=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);
                    float dist=length(anchor.xy-uCarPos.xy);
                    float nearCar=(1.0-smoothstep(1.5,9.0,dist))*step(-50.0,uCarPos.z);
                    vSpinBoost=nearCar;
                    float angle=(uTime*(1.6+nearCar*5.5)*uMotion)+aSpinnerPhase;
                    float c=cos(angle),s=sin(angle);
                    vec3 spun=vec3(position.x*c-position.y*s,position.x*s+position.y*c,position.z);
                    gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(spun,1.0);
                }
            `,
            fragmentShader:`
                varying vec3 vSpinnerColor;
                varying float vSpinBoost;
                void main(){
                    vec3 lit=vSpinnerColor+vec3(.18,.15,.06)*vSpinBoost;
                    gl_FragColor=vec4(lit,1.0);
                }
            `,
        }))
        this.spinnerRotors=new THREE.InstancedMesh(rotorGeo,rotorMat,windSpinnerAnchors.length)
        this.spinnerRotors.name='Roadside kinetic wind spinner rotors'
        this.spinnerRotors.userData.cameraCollision=false
        const matrix=new THREE.Matrix4()
        windSpinnerAnchors.forEach((p,i)=>{
            phases[i]=p.phase
            matrix.makeTranslation(p.x,p.y,p.z+1.55)
            this.spinnerRotors.setMatrixAt(i,matrix)
        })
        this.spinnerRotors.computeBoundingSphere()
        this.spinnerRotors.boundingSphere.radius+=4
        this.container.add(this.spinnerRotors)
    }
    setFireflies(){
        const geometry=new THREE.PlaneGeometry(.34,.34)
        const phases=new Float32Array(fireflyAnchors.length)
        const speeds=new Float32Array(fireflyAnchors.length)
        const tints=new Float32Array(fireflyAnchors.length)
        const matrix=new THREE.Matrix4()
        const material=this.emission(new THREE.ShaderMaterial({
            transparent:true,
            depthWrite:false,
            blending:THREE.AdditiveBlending,
            uniforms:{
                uTime:this.fireflyTime,
                uMotion:this.fireflyMotion,
                uCarPos:meadowCarUniforms.uMeadowCarPos,
                uFireflyStrength:{value:environmentConfig.dusk.fireflyStrength ?? .68},
                uPollenStrength:{value:environmentConfig.dusk.pollenStrength ?? .45},
            },
            vertexShader:`
                attribute float aPhase;
                attribute float aSpeed;
                attribute float aTint;
                varying vec2 vParticleUv;
                varying float vPulse;
                varying float vTint;
                uniform float uTime;
                uniform float uMotion;
                uniform vec4 uCarPos;
                void main(){
                    vParticleUv=uv;
                    vTint=aTint;
                    float t=uTime*aSpeed*uMotion+aPhase;
                    vPulse=.5+.5*sin(t*2.4+aPhase);
                    vec3 anchor=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);
                    float carDist=length(anchor.xy-uCarPos.xy);
                    float swirl=(1.0-smoothstep(1.0,7.5,carDist))*step(-50.0,uCarPos.z)*uMotion;
                    anchor.x+=sin(t*1.1+aPhase)*(.42+swirl*.55)*uMotion;
                    anchor.y+=cos(t*.85+aPhase*1.3)*(.42+swirl*.55)*uMotion;
                    anchor.z+=sin(t*1.65+aPhase*.7)*.24*uMotion+swirl*.45;
                    vec4 eye=viewMatrix*vec4(anchor,1.0);
                    float scale=(.65+.55*vPulse)*(1.0+swirl*.35);
                    eye.xy+=position.xy*scale;
                    gl_Position=projectionMatrix*eye;
                }
            `,
            fragmentShader:`
                varying vec2 vParticleUv;
                varying float vPulse;
                varying float vTint;
                uniform float uFireflyStrength;
                uniform float uPollenStrength;
                void main(){
                    float dist=length(vParticleUv-.5)*2.0;
                    float core=pow(max(0.0,1.0-dist),2.8);
                    vec3 fireflyColor=mix(vec3(1.0,.78,.28),vec3(.58,.98,.56),vTint*.65+.35*vPulse);
                    vec3 pollenColor=mix(vec3(1.0,.94,.72),vec3(.96,.84,.58),vTint);
                    float totalStrength=max(uFireflyStrength,uPollenStrength*.55);
                    float modeMix=clamp(uFireflyStrength/max(.001,uFireflyStrength+uPollenStrength),0.0,1.0);
                    vec3 color=mix(pollenColor,fireflyColor,modeMix);
                    float alpha=core*(.28+.72*vPulse)*totalStrength*.75;
                    gl_FragColor=vec4(color,alpha);
                }
            `,
        }))
        geometry.setAttribute('aPhase',new THREE.InstancedBufferAttribute(phases,1))
        geometry.setAttribute('aSpeed',new THREE.InstancedBufferAttribute(speeds,1))
        geometry.setAttribute('aTint',new THREE.InstancedBufferAttribute(tints,1))
        this.fireflies=new THREE.InstancedMesh(geometry,material,fireflyAnchors.length)
        this.fireflies.name='Ambient fireflies and golden pollen motes'
        this.fireflies.userData.cameraCollision=false
        fireflyAnchors.forEach((p,i)=>{
            phases[i]=p.phase
            speeds[i]=p.speed
            tints[i]=p.tint
            matrix.makeTranslation(p.x,p.y,p.z)
            this.fireflies.setMatrixAt(i,matrix)
        })
        this.fireflies.computeBoundingSphere()
        this.fireflies.boundingSphere.radius+=8
        this.container.add(this.fireflies)
    }
    setAtmosphere(mode='dusk'){
        const preset=applyDuskPreset(mode)
        this.mode=preset.id
        if(this.cores){
            this.cores.visible=preset.lampStrength>0.01
            this.cores.material.color.set(preset.id==='night'?'#ffe2a8':'#ffd696').convertLinearToSRGB()
        }
        if(this.halos){
            this.halos.visible=preset.lampStrength>0.01
            this.halos.material.uniforms.strength.value=preset.lampStrength*preset.strength
        }
        if(this.inlays){
            this.inlays.material.opacity=preset.accentStrength
        }
        if(this.fireflies){
            this.fireflies.material.uniforms.uFireflyStrength.value=preset.fireflyStrength ?? 0
            this.fireflies.material.uniforms.uPollenStrength.value=preset.pollenStrength ?? 0
        }
        if(this.passes?.glowsPass?.material?.uniforms){
            this.passes.glowsPass.material.uniforms.uAlpha.value=preset.glowAlpha
            this.passes.glowsPass.material.uniforms.uColor.value.set(preset.glowColor).convertLinearToSRGB()
        }
        this.backdrop?.setAtmosphere?.(preset)
        this.meadow?.setAtmosphere?.(preset)
        this.car?.setHeadlightMode?.(preset)
        return preset
    }
    cycleAtmosphere(){
        const index=atmosphereOrder.indexOf(this.mode)
        const next=atmosphereOrder[(index+1)%atmosphereOrder.length]
        return this.setAtmosphere(next)
    }
    dispose(){
        if(this.disposed)return;this.disposed=true;this.time.off('tick.eveningEnvironment')
        this.preference?.removeEventListener?.('change',this.syncMotion)
        this.container.traverse(mesh=>{if(mesh.isMesh){mesh.geometry.dispose();mesh.material.dispose();if(mesh.isInstancedMesh)mesh.dispose()}})
        this.container.removeFromParent()
    }
}
