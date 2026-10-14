import * as THREE from 'three'
import { landscapeBounds, surfaceHeight } from './LandscapeLayout.js'
import { atmospherePresets, environmentConfig } from './EnvironmentConfig.js'

const eveningColor=(day,night,strength=environmentConfig.dusk.strength)=>new THREE.Color(day).lerp(new THREE.Color(night),strength).getStyle()

export const worldAtmosphere = Object.freeze({
    waterLevel: -2.4,
    shoreWidth: 32,
    fogColor: eveningColor('#bed4d5',environmentConfig.dusk.horizon),
    fogDensity: 1/environmentConfig.fogDistance,
    skyHorizon: eveningColor('#bed4d5',environmentConfig.dusk.horizon),
    skyZenith: eveningColor('#79afca',environmentConfig.dusk.zenith),
    viewDistance: 650,
})

function shorelinePoint(x, y, t) {
    const b = landscapeBounds
    const direction = new THREE.Vector2(x - (b.minX + b.maxX) / 2, y - (b.minY + b.maxY) / 2).normalize()
    const width = worldAtmosphere.shoreWidth + 9 * Math.sin(x * .043 + y * .031) + 4 * Math.cos(y * .12)
    const descent = THREE.MathUtils.smoothstep(t, .35, 1)
    const height = THREE.MathUtils.lerp(surfaceHeight(x, y), worldAtmosphere.waterLevel - .35, descent)
        + Math.sin(t * Math.PI) * (1.8 + .9 * Math.sin(x * .11 + y * .07))
    return new THREE.Vector3(x + direction.x * width * t, y + direction.y * width * t, height)
}

// Reuse the shipped Blender broadleaf trees in small shoreline groves. These
// sit beyond the physics boundary and remain purely decorative.
export function coastalTreePlacements() {
    const b = landscapeBounds, corners = [[b.minX, b.minY], [b.maxX, b.minY], [b.maxX, b.maxY], [b.minX, b.maxY]]
    return Array.from({ length: 48 }, (_, i) => {
        const side = Math.floor(i / 12), grove = Math.floor(i % 12 / 3), member = i % 3
        const t = (grove + .5) / 4 + (member - 1) * .018
        const start = corners[side], end = corners[(side + 1) % 4]
        const p = shorelinePoint(THREE.MathUtils.lerp(start[0], end[0], t), THREE.MathUtils.lerp(start[1], end[1], t), .1 + member * .075)
        return { x: p.x, y: p.y, z: p.z, kind: 'tree-broadleaf', angle: i * 2.4, scale: .62 + .15 * Math.sin(i * 3.2), renderOnly: true }
    })
}

// Follow every actual heightfield edge vertex, so the visual continuation
// meets the existing land without a raised seam or a second driving surface.
export function shorelineGeometry() {
    const b = landscapeBounds, edge = []
    for(let x = b.minX; x <= b.maxX; x += b.step) edge.push([x, b.minY])
    for(let y = b.minY + b.step; y <= b.maxY; y += b.step) edge.push([b.maxX, y])
    for(let x = b.maxX - b.step; x >= b.minX; x -= b.step) edge.push([x, b.maxY])
    for(let y = b.maxY - b.step; y > b.minY; y -= b.step) edge.push([b.minX, y])
    const vertices = [], indices = [], count = edge.length, rings = 6
    for(let ring = 0; ring <= rings; ring++) {
        const t = ring / rings
        for(const [x, y] of edge) {
            vertices.push(...shorelinePoint(x, y, t).toArray())
        }
    }
    for(let ring = 0; ring < rings; ring++) for(let i = 0; i < count; i++) {
        const next = (i + 1) % count, a = ring * count + i, c = ring * count + next, b = a + count, d = c + count
        indices.push(a, b, c, b, d, c)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
}

function hillGeometry(layer) {
    const b = landscapeBounds, cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2
    const rx = (b.maxX - b.minX) / 2 + 92 + layer * 78
    const ry = (b.maxY - b.minY) / 2 + 92 + layer * 78
    const vertices = [], indices = [], segments = 128, rings = 6
    for(let ring = 0; ring <= rings; ring++) for(let i = 0; i <= segments; i++) {
        const angle = i / segments * Math.PI * 2, t = ring / rings
        const ridge = 19 + 7 * Math.sin(angle * 3 + layer) + 5 * Math.cos(angle * 7 - layer * 2) + 3 * Math.sin(angle * 13)
        const ripple = 5 * Math.sin(angle * 5 + layer) + 3 * Math.sin(angle * 11)
        vertices.push(cx + (rx + t * 62 + ripple) * Math.cos(angle),
            cy + (ry + t * 62 + ripple) * Math.sin(angle),
            -3.2 + Math.pow(Math.sin(t * Math.PI), 1.4) * ridge * (1 + layer * .3))
    }
    for(let ring = 0; ring < rings; ring++) for(let i = 0; i < segments; i++) {
        const a = ring * (segments + 1) + i, b = a + segments + 1
        indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
}

function shadedLand(geometry, low, high) {
    const positions = geometry.attributes.position, normals = geometry.attributes.normal, colors = []
    const base = new THREE.Color(low), crest = new THREE.Color(high), light = new THREE.Vector3(-.5, -.35, 1).normalize()
    for(let i = 0; i < positions.count; i++) {
        const normal = new THREE.Vector3().fromBufferAttribute(normals, i)
        const color = base.clone().lerp(crest, THREE.MathUtils.clamp(positions.getZ(i) / 25, 0, 1))
        color.multiplyScalar(.84 + .16 * Math.max(0, normal.dot(light))).convertLinearToSRGB()
        colors.push(color.r, color.g, color.b)
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true }))
    mesh.userData.cameraCollision = false
    return mesh
}

export default class WorldBackdrop {
    constructor({ container, scene, camera, time }) {
        this.time = time
        this.scene = scene
        this.container = new THREE.Group()
        this.container.name = 'Valley boundary / lake and distant hills'
        container.add(this.container)
        const sourceShoreGeometry = shorelineGeometry()
        const shoreGeometry = sourceShoreGeometry.toNonIndexed()
        sourceShoreGeometry.dispose()
        shoreGeometry.computeVertexNormals()
        this.shore = shadedLand(shoreGeometry, '#a3957d', '#927859')
        this.shore.name = 'Rocky shoreline / continuous terrain edge'
        this.container.add(this.shore)
        // One instanced draw adds a broken, natural waterline without loading
        // rock textures or placing new obstacles in the drivable world.
        this.rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0),
            new THREE.MeshBasicMaterial({ color: new THREE.Color('#b6ab94').convertLinearToSRGB() }), 72)
        this.rocks.name = 'Shoreline boulders / outside driving bounds'
        this.rocks.userData.cameraCollision = false
        const matrix = new THREE.Matrix4(), rotation = new THREE.Quaternion(), b = landscapeBounds
        const corners = [[b.minX, b.minY], [b.maxX, b.minY], [b.maxX, b.maxY], [b.minX, b.maxY]]
        for(let i = 0; i < this.rocks.count; i++) {
            const side = Math.floor(i / 18), t = (i % 18 + .5) / 18
            const start = corners[side], end = corners[(side + 1) % 4]
            const point = shorelinePoint(THREE.MathUtils.lerp(start[0], end[0], t), THREE.MathUtils.lerp(start[1], end[1], t), .84 + .06 * Math.sin(i * 4.7))
            const scale = .9 + .8 * (.5 + .5 * Math.sin(i * 2.3))
            point.z += scale * .2
            rotation.setFromEuler(new THREE.Euler(i * .41, i * .17, i * 1.7))
            matrix.compose(point, rotation, new THREE.Vector3(scale * 1.7, scale * 1.1, scale))
            this.rocks.setMatrixAt(i, matrix)
        }
        this.rocks.instanceMatrix.needsUpdate = true
        this.container.add(this.rocks)
        this.hills = [0, 1].map(layer => {
            const mesh = shadedLand(hillGeometry(layer), layer ? '#8ea9a6' : '#688875', layer ? '#afc0b4' : '#9aad91')
            mesh.name = `Distant foothills / layer ${layer + 1}`
            this.container.add(mesh)
            return mesh
        })
        this.waterTime = { value: 0 }
        this.waterDusk = { value: environmentConfig.dusk.strength }
        const waterMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(eveningColor('#4f8799',environmentConfig.dusk.water)).convertLinearToSRGB() })
        waterMaterial.onBeforeCompile = shader => {
            shader.uniforms.waterTime = this.waterTime
            shader.uniforms.waterDusk = this.waterDusk
            shader.vertexShader = 'varying vec2 vWaterPosition;\n' + shader.vertexShader
            shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWaterPosition = position.xy;')
            shader.fragmentShader = 'varying vec2 vWaterPosition; uniform float waterTime; uniform float waterDusk;\n' + shader.fragmentShader
            shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
                float primaryWave = sin(vWaterPosition.x * .12 + vWaterPosition.y * .06 + waterTime * .42)
                    * sin(vWaterPosition.y * .17 - waterTime * .28);
                float crossRipple = cos(vWaterPosition.x * .27 - vWaterPosition.y * .21 + waterTime * .65)
                    * sin(vWaterPosition.x * .09 + vWaterPosition.y * .31 - waterTime * .36);
                float wave = primaryWave * .68 + crossRipple * .32;
                vec2 worldXY = vWaterPosition + vec2(52.0, -58.0);
                vec2 boxDelta = max(abs(worldXY - vec2(52.0, -58.0)) - vec2(128.0, 92.0), vec2(0.0));
                float shoreDist = length(boxDelta);
                float shoreBand = exp(-shoreDist * .085) * (.55 + .45 * sin(shoreDist * .85 - waterTime * 1.35 + primaryWave * 1.6));
                diffuseColor.rgb *= .95 + .05 * wave;
                diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.82, .91, .94), clamp(shoreBand * .22, 0.0, .28));
                float glint = pow(max(0.0, wave), 14.0) * (.14 + .12 * waterDusk);
                vec3 glintTint = mix(vec3(.32, .48, .58), vec3(.58, .66, .92), waterDusk);
                diffuseColor.rgb += glintTint * glint;`)
        }
        waterMaterial.customProgramCacheKey = () => 'valley-lake-water-v2'
        this.water = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), waterMaterial)
        this.water.name = 'Boundary lake / subtle moving water'
        this.water.position.set(52, -58, worldAtmosphere.waterLevel)
        this.water.userData.cameraCollision = false
        this.water.userData.groundLayer = 'water'
        this.container.add(this.water)
        this.sky = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.ShaderMaterial({
            side: THREE.BackSide, depthTest: false, depthWrite: false,
            uniforms: {
                horizon: { value: new THREE.Color(worldAtmosphere.skyHorizon).convertLinearToSRGB() },
                zenith: { value: new THREE.Color(worldAtmosphere.skyZenith).convertLinearToSRGB() },
                starStrength: { value: environmentConfig.dusk.starStrength ?? .35 },
                duskStrength: { value: environmentConfig.dusk.strength },
                skyTime: this.waterTime,
            },
            vertexShader: `varying vec3 vSkyDirection;
                void main() {
                    vSkyDirection = position;
                    gl_Position = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.0);
                    gl_Position.z = gl_Position.w;
                }`,
            fragmentShader: `varying vec3 vSkyDirection;
                uniform vec3 horizon;
                uniform vec3 zenith;
                uniform float starStrength;
                uniform float duskStrength;
                uniform float skyTime;
                void main() {
                    vec3 direction = normalize(vSkyDirection);
                    float elevation = max(0.0, direction.z);
                    vec3 color = mix(horizon, zenith, smoothstep(0.0, .65, elevation));
                    float sunsetBand = exp(-elevation * 6.5) * smoothstep(.1, .75, duskStrength) * (1.0 - smoothstep(.75, .95, duskStrength));
                    color += vec3(.14, .06, .02) * sunsetBand;
                    vec3 moonDir = normalize(vec3(-.25, -.55, .8));
                    float moonDot = dot(direction, moonDir);
                    float moon = smoothstep(.99935, .99960, moonDot) * smoothstep(.05, .45, duskStrength);
                    float halo = pow(max(0.0, moonDot), 160.0) * (.055 + .045 * starStrength) * smoothstep(.05, .45, duskStrength);
                    color += vec3(.45, .52, .80) * halo;
                    color = mix(color, vec3(.88, .91, .99), moon);
                    if(starStrength > 0.01 && elevation > 0.16) {
                        vec2 starUv = direction.xy / (direction.z + .38) * 145.0;
                        vec2 starGrid = floor(starUv);
                        float seed = fract(sin(dot(starGrid, vec2(127.1, 311.7))) * 43758.5453);
                        if(seed > .975) {
                            vec2 starCenter = vec2(.25 + .5 * fract(seed * 19.3), .25 + .5 * fract(seed * 41.7));
                            float starDist = length(fract(starUv) - starCenter);
                            float starDisk = smoothstep(.16, .02, starDist);
                            float twinkle = .55 + .45 * sin(skyTime * (1.2 + fract(seed * 37.0) * 2.4) + seed * 62.8);
                            float skyFade = smoothstep(.16, .52, elevation);
                            color += vec3(.88, .93, 1.0) * starDisk * twinkle * skyFade * starStrength * .85;
                        }
                    }
                    gl_FragColor = vec4(color, 1.0);
                }`,
        }))
        this.sky.name = 'Valley sky / blue zenith and warm horizon'
        this.sky.frustumCulled = false
        this.sky.renderOrder = -1000
        this.sky.userData.cameraCollision = false
        this.container.add(this.sky)
        scene.fog = new THREE.FogExp2(worldAtmosphere.fogColor, worldAtmosphere.fogDensity)
        scene.fog.color.convertLinearToSRGB()
        camera.instance.far = worldAtmosphere.viewDistance
        camera.instance.updateProjectionMatrix()
        time.on('tick.worldBackdrop', () => {
            scene.fog.density = camera.view === 'top' ? 0 : worldAtmosphere.fogDensity
            this.waterTime.value = (time.elapsed || 0) / 1000
        })
    }

    setAtmosphere(modeOrPreset = 'dusk') {
        const preset = typeof modeOrPreset === 'string'
            ? (atmospherePresets[modeOrPreset] || atmospherePresets.dusk)
            : modeOrPreset
        const horizonCss = eveningColor('#bed4d5', preset.horizon, preset.strength)
        const zenithCss = eveningColor('#79afca', preset.zenith, preset.strength)
        const waterCss = eveningColor('#4f8799', preset.water, preset.strength)
        this.waterDusk.value = preset.strength
        this.water.material.color.set(waterCss).convertLinearToSRGB()
        this.sky.material.uniforms.horizon.value.set(horizonCss).convertLinearToSRGB()
        this.sky.material.uniforms.zenith.value.set(zenithCss).convertLinearToSRGB()
        this.sky.material.uniforms.starStrength.value = preset.starStrength ?? 0
        this.sky.material.uniforms.duskStrength.value = preset.strength
        if(this.scene?.fog) {
            this.scene.fog.color.set(horizonCss).convertLinearToSRGB()
        }
        return preset
    }

    dispose() {
        this.time.off('tick.worldBackdrop')
        this.container.traverse(mesh => {
            if(!mesh.isMesh) return
            mesh.geometry.dispose()
            mesh.material.dispose()
            if(mesh.isInstancedMesh) mesh.dispose()
        })
        this.container.removeFromParent()
    }
}
