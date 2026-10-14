import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const PALETTE = {
    trunkDark: '#6e4e37',
    trunkLight: '#8f694b',
    heartwood: '#cfa97e',
    barkRing: '#b38962',
    leafDeep: '#2e573d',
    leafMid: '#487849',
    leafBright: '#6b9652',
    leafSun: '#84ab5c',
    pineDeep: '#264b38',
    pineMid: '#3b6946',
    pineTip: '#5c8752',
    rockBase: '#5d6958',
    rockMid: '#7c7b70',
    rockTop: '#969183',
    rockWarm: '#8b7f6e',
    grassRoot: '#4b734b',
    grassMid: '#58824e',
    grassTip: '#759c57',
    flowerStem: '#467346',
    flowerCenter: '#e8c455',
}

function paintGeometry(geometry, colorFn, sphericalNormalCenter = null, upwardNormalBias = 0) {
    const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry.clone()
    nonIndexed.computeVertexNormals()
    const pos = nonIndexed.attributes.position
    const norm = nonIndexed.attributes.normal
    const colors = new Float32Array(pos.count * 3)
    const color = new THREE.Color()
    const v = new THREE.Vector3()
    const n = new THREE.Vector3()

    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i)
        n.fromBufferAttribute(norm, i)
        if (sphericalNormalCenter) {
            const radial = v.clone().sub(sphericalNormalCenter).normalize()
            n.lerp(radial, 0.72).normalize()
        }
        if (upwardNormalBias > 0) {
            n.lerp(new THREE.Vector3(0, 0, 1), upwardNormalBias).normalize()
        }
        norm.setXYZ(i, n.x, n.y, n.z)
        colorFn(v, n, color, i)
        color.convertLinearToSRGB()
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
    }
    nonIndexed.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return nonIndexed
}

function makeFoliagePuff(x, y, z, rx, ry, rz, lowHex, highHex, detail = 2) {
    const geo = new THREE.IcosahedronGeometry(1, detail)
    const pos = geo.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i)
        const wave = 1 + 0.05 * Math.sin(v.x * 4.2 + z) * Math.cos(v.y * 3.8 - x)
        v.x = v.x * rx * wave + x
        v.y = v.y * ry * wave + y
        v.z = v.z * rz * (v.z < 0 ? 0.92 : 1.04) + z
        pos.setXYZ(i, v.x, v.y, v.z)
    }
    const low = new THREE.Color(lowHex)
    const high = new THREE.Color(highHex)
    const center = new THREE.Vector3(x, y, z - rz * 0.12)
    return paintGeometry(
        geo,
        (p, n, out) => {
            const t = THREE.MathUtils.clamp((p.z - (z - rz)) / (2 * rz) + n.z * 0.22, 0, 1)
            out.copy(low).lerp(high, t)
        },
        center,
        0.2
    )
}

function makeBranch(from, to, rBottom = 0.08, rTop = 0.045) {
    const start = new THREE.Vector3(...from)
    const end = new THREE.Vector3(...to)
    const delta = end.clone().sub(start)
    const len = delta.length()
    const mid = start.clone().add(end).multiplyScalar(0.5)
    const branch = new THREE.CylinderGeometry(rTop, rBottom, len, 7, 1)
    const up = new THREE.Vector3(0, 1, 0)
    const quat = new THREE.Quaternion().setFromUnitVectors(up, delta.clone().normalize())
    branch.applyQuaternion(quat)
    branch.translate(mid.x, mid.y, mid.z)
    const cDark = new THREE.Color(PALETTE.trunkDark)
    const cLight = new THREE.Color(PALETTE.trunkLight)
    return paintGeometry(branch, (_p, n, out) => {
        const t = THREE.MathUtils.clamp((n.x * -0.4 + n.y * -0.3 + 0.5) * 0.7, 0, 1)
        out.copy(cDark).lerp(cLight, t)
    })
}

function makeTrunk(height, rBottom, rTop, flare = true, branches = []) {
    const parts = []
    const trunk = new THREE.CylinderGeometry(rTop, rBottom, height, 10, 4)
    trunk.rotateX(Math.PI / 2)
    trunk.translate(0, 0, height / 2)
    const pos = trunk.attributes.position
    for (let i = 0; i < pos.count; i++) {
        const z = pos.getZ(i)
        const bend = Math.sin((z / height) * Math.PI) * 0.025
        pos.setX(i, pos.getX(i) + bend)
    }
    const cDark = new THREE.Color(PALETTE.trunkDark)
    const cLight = new THREE.Color(PALETTE.trunkLight)
    parts.push(
        paintGeometry(trunk, (p, n, out) => {
            const t = THREE.MathUtils.clamp((p.z / height) * 0.55 + (n.x * -0.4 + n.y * -0.3 + 0.5) * 0.45, 0, 1)
            out.copy(cDark).lerp(cLight, t)
        })
    )
    if (flare) {
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2 + 0.35
            const root = new THREE.ConeGeometry(rBottom * 0.55, 0.38, 6)
            const m = new THREE.Matrix4()
                .makeRotationZ(angle)
                .multiply(new THREE.Matrix4().makeTranslation(rBottom * 0.72, 0, 0.14))
                .multiply(new THREE.Matrix4().makeRotationY(-0.68))
            root.applyMatrix4(m)
            parts.push(
                paintGeometry(root, (_p, _n, out) => {
                    out.copy(cDark).lerp(cLight, 0.35)
                })
            )
        }
    }
    for (const [from, to, rb, rt] of branches) {
        parts.push(makeBranch(from, to, rb, rt))
    }
    return parts
}

function buildTreeRound() {
    // Trunk reaches z=3.25m deep inside the central crown, with 4 sturdy branches
    // and a lower collar puff at z=2.35m so there is zero gap from any angle.
    const branches = [
        [[0, 0, 1.65], [-0.68, 0.16, 2.78], 0.09, 0.05],
        [[0, 0, 1.72], [0.64, -0.14, 2.95], 0.09, 0.05],
        [[0, 0, 1.68], [0.10, 0.62, 2.82], 0.08, 0.045],
        [[0, 0, 1.60], [-0.16, -0.60, 2.70], 0.08, 0.045],
    ]
    const parts = [
        ...makeTrunk(3.25, 0.18, 0.09, true, branches),
        makeFoliagePuff(0, 0, 2.38, 0.92, 0.90, 0.76, PALETTE.leafDeep, PALETTE.leafMid, 2),
        makeFoliagePuff(0, 0, 3.42, 1.34, 1.30, 1.35, PALETTE.leafDeep, PALETTE.leafSun, 2),
        makeFoliagePuff(-0.72, 0.18, 2.82, 0.88, 0.88, 0.90, PALETTE.leafDeep, PALETTE.leafBright, 2),
        makeFoliagePuff(0.68, -0.16, 3.02, 0.92, 0.86, 0.95, PALETTE.leafMid, PALETTE.leafSun, 2),
        makeFoliagePuff(0.12, 0.68, 2.88, 0.84, 0.84, 0.84, PALETTE.leafDeep, PALETTE.leafBright, 1),
        makeFoliagePuff(-0.18, -0.66, 2.76, 0.80, 0.80, 0.80, PALETTE.leafDeep, PALETTE.leafMid, 1),
    ]
    return finalizeGeometry(parts)
}

function buildTreePine() {
    // Trunk runs up to z=3.85m through all 4 overlapping bough skirts.
    const parts = [...makeTrunk(3.85, 0.17, 0.07, true)]
    const tiers = [
        { z: 1.75, r: 1.42, h: 1.55, low: PALETTE.pineDeep, high: PALETTE.pineMid },
        { z: 2.58, r: 1.15, h: 1.42, low: PALETTE.pineDeep, high: PALETTE.pineTip },
        { z: 3.35, r: 0.88, h: 1.28, low: PALETTE.pineMid, high: PALETTE.leafBright },
        { z: 4.05, r: 0.58, h: 1.10, low: PALETTE.pineMid, high: PALETTE.leafSun },
    ]
    tiers.forEach((tier, idx) => {
        const radialSegments = 14
        const cone = new THREE.ConeGeometry(tier.r, tier.h, radialSegments, 2)
        cone.rotateX(Math.PI / 2)
        cone.translate(0, 0, tier.z)
        const pos = cone.attributes.position
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i)
            const y = pos.getY(i)
            const z = pos.getZ(i)
            const r = Math.hypot(x, y)
            if (r > 0.05) {
                const angle = Math.atan2(y, x) + idx * 0.45
                const scallop = Math.sin(angle * 7) * 0.08 * (r / tier.r)
                const flare = 1 + Math.sin(angle * 7) * 0.06
                pos.setXYZ(i, x * flare, y * flare, z + scallop - (r / tier.r) * 0.08)
            }
        }
        const low = new THREE.Color(tier.low)
        const high = new THREE.Color(tier.high)
        parts.push(
            paintGeometry(
                cone,
                (p, _n, out) => {
                    const t = THREE.MathUtils.clamp((p.z - (tier.z - tier.h / 2)) / tier.h, 0, 1)
                    out.copy(low).lerp(high, t)
                },
                new THREE.Vector3(0, 0, tier.z - 0.2),
                0.28
            )
        )
    })
    return finalizeGeometry(parts)
}

function buildTreeBushy() {
    // Trunk extends to z=3.05m with 4 forked branches and a central collar puff at z=2.28m
    // so the trunk connects seamlessly into the surrounding canopy lobes.
    const branches = [
        [[0, 0, 1.48], [-0.66, 0.22, 2.65], 0.095, 0.055],
        [[0, 0, 1.52], [0.66, 0.20, 2.75], 0.095, 0.055],
        [[0, 0, 1.42], [-0.38, -0.62, 2.58], 0.09, 0.05],
        [[0, 0, 1.46], [0.44, -0.56, 2.68], 0.09, 0.05],
    ]
    const parts = [...makeTrunk(3.05, 0.19, 0.095, true, branches)]
    const crowns = [
        [0, 0, 2.28, 0.94, 0.94, 0.78, PALETTE.leafDeep, PALETTE.leafMid],
        [0, 0, 3.22, 1.18, 1.18, 1.12, PALETTE.leafMid, PALETTE.leafSun],
        [-0.70, 0.24, 2.70, 0.90, 0.88, 0.88, PALETTE.leafDeep, PALETTE.leafBright],
        [0.70, 0.22, 2.82, 0.90, 0.88, 0.90, PALETTE.leafMid, PALETTE.leafSun],
        [-0.42, -0.66, 2.64, 0.86, 0.86, 0.84, PALETTE.leafDeep, PALETTE.leafBright],
        [0.46, -0.60, 2.76, 0.85, 0.85, 0.86, PALETTE.leafDeep, PALETTE.leafBright],
    ]
    for (const [x, y, z, rx, ry, rz, low, high] of crowns) {
        parts.push(makeFoliagePuff(x, y, z, rx, ry, rz, low, high, 2))
    }
    return finalizeGeometry(parts)
}

function buildTreeSmall() {
    // Trunk extends to z=2.25m right into the main crown, plus two side branches.
    const branches = [
        [[0, 0, 1.18], [0.42, -0.14, 1.88], 0.07, 0.04],
        [[0, 0, 1.24], [-0.38, 0.20, 1.96], 0.065, 0.04],
    ]
    const parts = [
        ...makeTrunk(2.25, 0.14, 0.075, true, branches),
        makeFoliagePuff(0, 0, 1.72, 0.68, 0.68, 0.58, PALETTE.leafDeep, PALETTE.leafMid, 1),
        makeFoliagePuff(0, 0, 2.30, 0.96, 0.94, 0.98, PALETTE.leafMid, PALETTE.leafSun, 2),
        makeFoliagePuff(0.44, -0.15, 1.90, 0.66, 0.66, 0.68, PALETTE.leafDeep, PALETTE.leafBright, 2),
        makeFoliagePuff(-0.40, 0.20, 2.00, 0.62, 0.62, 0.64, PALETTE.leafDeep, PALETTE.leafBright, 1),
    ]
    return finalizeGeometry(parts)
}

function buildBush() {
    const parts = [
        makeFoliagePuff(0, 0, 0.42, 0.50, 0.48, 0.42, PALETTE.leafDeep, PALETTE.leafSun, 2),
        makeFoliagePuff(-0.32, 0.08, 0.32, 0.40, 0.38, 0.34, PALETTE.leafDeep, PALETTE.leafBright, 2),
        makeFoliagePuff(0.32, 0.06, 0.34, 0.40, 0.38, 0.35, PALETTE.leafMid, PALETTE.leafSun, 2),
        makeFoliagePuff(0.04, -0.26, 0.30, 0.38, 0.36, 0.32, PALETTE.leafDeep, PALETTE.leafBright, 1),
    ]
    return finalizeGeometry(parts)
}

function buildRock(variant = 0) {
    const specs = [
        { rx: 0.36, ry: 0.30, h: 0.28, seed: 1.1 },
        { rx: 0.68, ry: 0.56, h: 0.54, seed: 2.7 },
        { rx: 0.98, ry: 0.78, h: 0.76, seed: 4.3 },
    ][variant] || { rx: 0.5, ry: 0.4, h: 0.4, seed: 1.0 }

    const makeStone = (ox, oy, rx, ry, h, s) => {
        const geo = new THREE.IcosahedronGeometry(1, 2)
        const pos = geo.attributes.position
        const v = new THREE.Vector3()
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i)
            const zNorm = v.z < 0 ? v.z * 0.45 : Math.pow(v.z, 0.82)
            const warp = 1 + 0.1 * Math.sin(v.x * 3.1 + s) * Math.cos(v.y * 2.7 - s)
            const x = ox + v.x * rx * warp
            const y = oy + v.y * ry * warp
            const z = Math.max(0.0, ((zNorm + 0.45) / 1.45) * h)
            pos.setXYZ(i, x, y, z)
        }
        const cBase = new THREE.Color(PALETTE.rockBase)
        const cMid = new THREE.Color(variant === 1 ? PALETTE.rockWarm : PALETTE.rockMid)
        const cTop = new THREE.Color(PALETTE.rockTop)
        return paintGeometry(
            geo,
            (p, n, out) => {
                const hRatio = THREE.MathUtils.clamp(p.z / h, 0, 1)
                out.copy(cBase).lerp(cMid, THREE.MathUtils.smoothstep(hRatio, 0.0, 0.55))
                out.lerp(cTop, THREE.MathUtils.smoothstep(hRatio, 0.5, 1.0) * Math.max(0, n.z))
            },
            new THREE.Vector3(ox, oy, h * 0.35),
            0.15
        )
    }

    const parts = [
        makeStone(0, 0, specs.rx, specs.ry, specs.h, specs.seed),
        makeStone(specs.rx * 0.52, -specs.ry * 0.35, specs.rx * 0.48, specs.ry * 0.44, specs.h * 0.52, specs.seed + 1.9),
    ]
    return finalizeGeometry(parts)
}

function buildLog() {
    const parts = []
    const body = new THREE.CylinderGeometry(0.19, 0.21, 1.46, 12, 4)
    body.rotateZ(Math.PI / 2)
    body.translate(0, 0, 0.2)
    const pos = body.attributes.position
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const z = pos.getZ(i)
        const angle = Math.atan2(z - 0.2, y)
        const ridge = 1 + 0.04 * Math.sin(angle * 6 + x * 2.5)
        pos.setY(i, y * ridge)
        pos.setZ(i, Math.max(0.0, 0.2 + (z - 0.2) * ridge + Math.sin(x * 2.1) * 0.015))
    }
    const cDark = new THREE.Color(PALETTE.trunkDark)
    const cLight = new THREE.Color(PALETTE.trunkLight)
    const cHeart = new THREE.Color(PALETTE.heartwood)
    parts.push(
        paintGeometry(body, (p, n, out) => {
            if (Math.abs(n.x) > 0.75) {
                const r = Math.hypot(p.y, p.z - 0.2)
                out.copy(cHeart).lerp(cLight, THREE.MathUtils.smoothstep(r, 0.1, 0.19))
            } else {
                out.copy(cDark).lerp(cLight, THREE.MathUtils.clamp(n.z * 0.5 + 0.5, 0, 1))
            }
        })
    )
    parts.push(makeFoliagePuff(0.18, 0.1, 0.36, 0.22, 0.14, 0.09, PALETTE.leafDeep, PALETTE.leafBright, 1))
    return finalizeGeometry(parts)
}

function buildStump() {
    const parts = [...makeTrunk(0.46, 0.31, 0.24, true)]
    const cap = new THREE.CylinderGeometry(0.23, 0.23, 0.02, 12)
    cap.rotateX(Math.PI / 2)
    cap.translate(0, 0, 0.465)
    const cHeart = new THREE.Color(PALETTE.heartwood)
    const cRing = new THREE.Color(PALETTE.barkRing)
    parts.push(
        paintGeometry(cap, (p, _n, out) => {
            const r = Math.hypot(p.x, p.y)
            const ring = 0.5 + 0.5 * Math.sin(r * 42.0)
            out.copy(cHeart).lerp(cRing, ring * 0.35)
        })
    )
    return finalizeGeometry(parts)
}

function buildGrassRosette() {
    const parts = []
    const bladeCount = 7
    const cRoot = new THREE.Color(PALETTE.grassRoot)
    const cMid = new THREE.Color(PALETTE.grassMid)
    const cTip = new THREE.Color(PALETTE.grassTip)
    for (let i = 0; i < bladeCount; i++) {
        const angle = (i / bladeCount) * Math.PI * 2 + (i % 2) * 0.22
        const cos = Math.cos(angle), sin = Math.sin(angle)
        const tx = -sin, ty = cos
        const radialOffset = 0.025 + (i % 3) * 0.022
        const reach = 0.11 + (i % 3) * 0.032
        const height = 0.14 + (i % 3) * 0.032
        const halfW = 0.036
        const r0x = cos * radialOffset - tx * halfW, r0y = sin * radialOffset - ty * halfW
        const r1x = cos * radialOffset + tx * halfW, r1y = sin * radialOffset + ty * halfW
        const m0x = cos * (radialOffset + reach * 0.52) - tx * (halfW * 0.6), m0y = sin * (radialOffset + reach * 0.52) - ty * (halfW * 0.6)
        const m1x = cos * (radialOffset + reach * 0.52) + tx * (halfW * 0.6), m1y = sin * (radialOffset + reach * 0.52) + ty * (halfW * 0.6)
        const mz = height * 0.62
        const tipX = cos * (radialOffset + reach), tipY = sin * (radialOffset + reach), tipZ = height
        const vertices = new Float32Array([
            r0x, r0y, 0.0, r1x, r1y, 0.0, m1x, m1y, mz,
            r0x, r0y, 0.0, m1x, m1y, mz, m0x, m0y, mz,
            m0x, m0y, mz, m1x, m1y, mz, tipX, tipY, tipZ,
        ])
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
        parts.push(
            paintGeometry(
                geo,
                (p, _n, out) => {
                    const t = THREE.MathUtils.clamp(p.z / height, 0, 1)
                    out.copy(cRoot).lerp(cMid, THREE.MathUtils.smoothstep(t, 0.0, 0.55))
                    out.lerp(cTip, THREE.MathUtils.smoothstep(t, 0.45, 1.0))
                },
                null,
                0.85
            )
        )
    }
    return finalizeGeometry(parts)
}

function finalizeGeometry(parts) {
    const merged = mergeGeometries(parts, false)
    parts.forEach(p => p.dispose())
    merged.computeBoundingBox()
    merged.computeBoundingSphere()
    return merged
}

export function enhanceMeadowGeometry(kind, fallbackGeometry) {
    try {
        switch (kind) {
            case 'tree-round':
                return buildTreeRound()
            case 'tree-pine':
                return buildTreePine()
            case 'tree-bushy':
                return buildTreeBushy()
            case 'tree-small':
                return buildTreeSmall()
            case 'bush':
            case 'shrub-0':
            case 'shrub-1':
                return buildBush()
            case 'rock-0':
                return buildRock(0)
            case 'rock-1':
                return buildRock(1)
            case 'rock-2':
                return buildRock(2)
            case 'log':
                return buildLog()
            case 'stump':
                return buildStump()
            case 'grass':
                return buildGrassRosette()
            default:
                return fallbackGeometry
        }
    } catch {
        return fallbackGeometry
    }
}
