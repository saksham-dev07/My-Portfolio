import * as THREE from 'three'
import RefinedPropBatch from '../RefinedProps.js'
import { groundLayer } from '../GroundLayers.js'
import { districtCourts, districtFurniture, districtPalette as palette } from './DistrictIdentityLayout.js'

function courtGeometry({ w, h, corner: r }) {
    const x = w / 2, y = h / 2, shape = new THREE.Shape()
    shape.moveTo(-x + r, -y); shape.lineTo(x - r, -y)
    shape.quadraticCurveTo(x, -y, x, -y + r); shape.lineTo(x, y - r)
    shape.quadraticCurveTo(x, y, x - r, y); shape.lineTo(-x + r, y)
    shape.quadraticCurveTo(-x, y, -x, y - r); shape.lineTo(-x, -y + r)
    shape.quadraticCurveTo(-x, -y, -x + r, -y)
    return new THREE.ShapeGeometry(shape, 12)
}

const surfacePatterns = {
    about: `
        vec2 gardenPoint=p-vec2(0.0,-3.0);
        float ring=band(length(gardenPoint)-4.75,1.05,aa);
        float approach=band(p.x,1.45,aa)*smoothstep(1.0,1.3,p.y);
        float gravel=max(ring,approach);
        color=mix(lawn,cream,gravel);
        float speck=.985+.015*sin(p.x*1.1+sin(p.y*.9));
        color*=speck;
        float inlay=band(length(gardenPoint)-5.38,.075,aa);
        color=mix(color,terracotta,inlay*.8);
    `,
    skills: `
        color=charcoal;
        float row=floor((p.y+30.0)/1.5);
        float joint=min(abs(mod(p.x+mod(row,2.0)*.75+30.0,1.5)-.75),abs(mod(p.y+30.0,1.5)-.75));
        color=mix(color,cream,(1.0-smoothstep(.025-aa,.025+aa,joint))*.3);
        vec2 bay=abs(p-vec2(0.0,-2.8))-vec2(4.5,3.3);
        float bayEdge=band(max(bay.x,bay.y),.09,aa);
        color=mix(color,brass,bayEdge);
        float caution=band(p.x+6.2,.45,aa)*(1.0-smoothstep(5.5,5.7,abs(p.y+2.2)));
        float stripe=step(.5,fract((p.x+p.y)*1.5));
        color=mix(color,mix(cream,terracotta,stripe),caution);
    `,
    highlights: `
        color=mix(cream,light,.32);
        vec2 plazaPoint=p-vec2(0.0,-3.3);
        float radius=length(plazaPoint);
        color=mix(color,terracotta,band(radius-5.3,.22,aa));
        color=mix(color,green,band(radius-5.65,.10,aa));
        float angle=atan(plazaPoint.y,plazaPoint.x);
        float ray=abs(sin(angle*8.0))*radius;
        color=mix(color,brass,band(ray,.07,aa)*smoothstep(3.4,3.7,radius)*(1.0-smoothstep(5.0,5.2,radius)));
        color=mix(color,terracotta,band(abs(p.x)-7.45,.15,aa));
    `,
    education: `
        color=mix(cream,light,.35);
        float row=floor((p.y+30.0)/1.4);
        float joint=min(abs(mod(p.x+mod(row,2.0)*.7+30.0,1.4)-.7),abs(mod(p.y+30.0,1.4)-.7));
        color=mix(color,charcoal,(1.0-smoothstep(.023-aa,.023+aa,joint))*.32);
        float avenue=1.0-smoothstep(1.15-aa,1.15+aa,abs(p.x));
        color=mix(color,light,avenue*.5);
        color=mix(color,terracotta,band(abs(p.x)-1.3,.12,aa));
        color=mix(color,green,band(abs(p.x)-8.45,.12,aa));
    `,
}

function surfaceMaterial(id) {
    const material = new THREE.MeshBasicMaterial({ color: '#ffffff', depthWrite: false })
    material.onBeforeCompile = shader => {
        for (const [name, value] of Object.entries(palette)) shader.uniforms[`district_${name}`] = { value: new THREE.Color(value).convertLinearToSRGB() }
        shader.vertexShader = 'varying vec2 vDistrictPoint;\n' + shader.vertexShader
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvDistrictPoint=position.xy;')
        shader.fragmentShader = `varying vec2 vDistrictPoint;
            ${Object.keys(palette).map(name => `uniform vec3 district_${name};`).join('\n')}
            float band(float distance,float width,float aa){return 1.0-smoothstep(width*.5-aa,width*.5+aa,abs(distance));}
        ` + shader.fragmentShader
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
            vec2 p=vDistrictPoint;
            float aa=clamp(.5*length(fwidth(p)),.005,.4);
            ${Object.keys(palette).map(name => `vec3 ${name}=district_${name};`).join('\n')}
            vec3 color=cream;
            ${surfacePatterns[id]}
            diffuseColor.rgb=color;
        `)
    }
    material.customProgramCacheKey = () => `district-court-${id}-v1`
    return material
}

// Four terrain-level surfaces, one merged prop batch and two small pennants.
// All surfaces are drivable decoration; only furniture receives solid proxies.
export default class DistrictScenery {
    constructor({ objects, time, camera, loader }, container, collisions) {
        this.time = time
        this.container = new THREE.Group()
        this.container.name = 'Profile districts / garden, workshop, campus, celebration'
        container.add(this.container)
        this.geometries = new Set(); this.materials = new Set(); this.solids = []
        this.surfaces = []
        for (const court of districtCourts) {
            const geometry = courtGeometry(court), material = surfaceMaterial(court.id)
            this.geometries.add(geometry); this.materials.add(material)
            const mesh = new THREE.Mesh(geometry, material)
            mesh.name = `${court.id} / district surface`
            mesh.position.set(court.x, court.y, 0)
            this.container.add(mesh); groundLayer(mesh, 'surface'); this.surfaces.push(mesh)
        }
        this.props = new RefinedPropBatch({ name: 'refinedDistrictProps',
            placements: districtFurniture.map(item => ({ ...item,
                kind: item.kind === 'banner' ? 'banner-stand' : item.kind === 'lamp' && item.district === 'skills' ? 'workshop-lamp' : item.kind,
                angle: ['rack', 'chest'].includes(item.kind) ? (item.angle || 0) + Math.PI : item.angle,
                mirrorX: item.kind === 'banner' ? item.side : 1 })),
            objects, time, camera, loader, container: this.container, collisions,
            onReady: batch => { this.solids = batch.solids; this.collision = batch.collision },
        })
        this.clock = { value: 0 }; this.motion = { value: 1 }
        const preference = globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)')
        this.syncMotion = () => { this.motion.value = preference?.matches ? 0 : 1 }
        this.syncMotion(); preference?.addEventListener?.('change', this.syncMotion); this.preference = preference
        this.setBanners()
        time?.on('tick.districtScenery', () => {
            if (!globalThis.document?.hidden && camera?.view !== 'top') this.clock.value = time.elapsed * .001
        })
    }

    setBanners() {
        const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })
        material.onBeforeCompile = shader => {
            shader.uniforms.districtTime = this.clock; shader.uniforms.districtMotion = this.motion
            shader.vertexShader = 'uniform float districtTime; uniform float districtMotion;\n' + shader.vertexShader
            shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
                transformed.z+=sin(districtTime*1.4+uv.y*4.0)*.075*(1.0-uv.y)*districtMotion;`)
            shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
                float trim=step(vUv.x,.075)+step(.925,vUv.x)+step(.90,vUv.y);
                float medal=1.0-smoothstep(.13,.15,length(vUv-vec2(.5,.65)));
                diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.86,.68),clamp(trim+medal,0.0,1.0));`)
        }
        // Enable UVs for the woven trim/medallion without loading a texture.
        material.defines = { USE_UV: '' }; material.customProgramCacheKey = () => 'district-pennants-v1'
        this.materials.add(material)
        districtFurniture.filter(item => item.kind === 'banner').forEach((item, index) => {
            const geometry = new THREE.PlaneGeometry(1.2, 2.2, 6, 12)
            const positions = geometry.attributes.position
            for (let i = 0; i < positions.count; i++) if (positions.getY(i) < -1.05) positions.setY(i, -1.1 + .24 * (1 - Math.abs(positions.getX(i)) / .6))
            const color = new THREE.Color(index ? palette.terracotta : palette.green).convertLinearToSRGB(), colors = []
            for (let i = 0; i < positions.count; i++) colors.push(color.r, color.g, color.b)
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
            geometry.computeBoundingSphere(); geometry.boundingSphere.radius += .08
            this.geometries.add(geometry)
            const mesh = new THREE.Mesh(geometry, material)
            mesh.name = `${item.id} / pennant`
            mesh.position.set(item.x + item.side * .64, item.y, 2.56); mesh.rotation.x = Math.PI / 2
            this.container.add(mesh)
        })
    }

    dispose() {
        if (this.disposed) return
        this.disposed = true
        this.props.dispose()
        this.time?.off('tick.districtScenery'); this.preference?.removeEventListener?.('change', this.syncMotion)
        this.container.removeFromParent()
        this.geometries.forEach(geometry => geometry.dispose()); this.materials.forEach(material => material.dispose())
    }
}
