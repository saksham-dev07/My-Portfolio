import * as THREE from 'three'
import { landscapeBounds, surfaceHeight } from './LandscapeLayout.js'

export const worldAtmosphere = Object.freeze({
    waterLevel: -2.4,
    shoreWidth: 32,
    fogColor: '#bed4d5',
    fogDensity: .0018,
    skyHorizon: '#bed4d5',
    skyZenith: '#79afca',
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
        const waterMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color('#4f8799').convertLinearToSRGB() })
        waterMaterial.onBeforeCompile = shader => {
            shader.uniforms.waterTime = this.waterTime
            shader.vertexShader = 'varying vec2 vWaterPosition;\n' + shader.vertexShader
            shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWaterPosition = position.xy;')
            shader.fragmentShader = 'varying vec2 vWaterPosition; uniform float waterTime;\n' + shader.fragmentShader
            shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
                float wave = sin(vWaterPosition.x * .12 + vWaterPosition.y * .06 + waterTime * .15)
                    * sin(vWaterPosition.y * .17 - waterTime * .09);
                diffuseColor.rgb *= .97 + .03 * wave;`)
        }
        waterMaterial.customProgramCacheKey = () => 'valley-lake-water-v1'
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
            },
            vertexShader: `varying vec3 vSkyDirection;
                void main() {
                    vSkyDirection = position;
                    gl_Position = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.0);
                    gl_Position.z = gl_Position.w;
                }`,
            fragmentShader: `varying vec3 vSkyDirection; uniform vec3 horizon; uniform vec3 zenith;
                void main() {
                    float elevation = max(0.0, normalize(vSkyDirection).z);
                    vec3 color = mix(horizon, zenith, smoothstep(0.0, .65, elevation));
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
