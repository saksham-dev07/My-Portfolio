import { expect, test } from 'bun:test'
import * as THREE from 'three'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { retiredTreeMask, suppressRetiredTreeShadows } from '../src/javascript/World/RetiredTreeShadows.js'
import EnvironmentDressing from '../src/javascript/World/EnvironmentDressing.js'

test('retired trees erase their own atlas footprints without altering reveal or unrelated shadows', () => {
    const atlas = () => new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.ShaderMaterial({
        defines: { ERASED_TREE_COUNT: 0 }, uniforms: { uAlpha: { value: .7 }, tShadow: { value: new THREE.Texture() } },
    }))
    const first = atlas(), second = atlas(), untouched = atlas()
    const reveal = first.material.uniforms.uAlpha, image = first.material.uniforms.tShadow
    const count = suppressRetiredTreeShadows([
        { x: 10, y: -12, radius: 1, height: 5, floorMeshes: [first] },
        { x: 15, y: -20, radius: 1.5, height: 4, floorMeshes: [first] },
        { x: -40, y: -30, radius: 2, height: 6, floorMeshes: [second] },
    ], new THREE.Vector3(2 / 3, 2.65 / 3.75, -1))
    expect(count).toBe(2)
    expect(first.material.defines.ERASED_TREE_COUNT).toBe(2)
    expect(second.material.defines.ERASED_TREE_COUNT).toBe(1)
    expect(first.material.uniforms.uErasedTrees.value[0].toArray()).toEqual([10, -12, 3, 9.6])
    expect(first.material.uniforms.uAlpha).toBe(reveal)
    expect(first.material.uniforms.tShadow).toBe(image)
    expect(untouched.material.defines.ERASED_TREE_COUNT).toBe(0)
    expect(untouched.material.uniforms.uErasedTrees).toBeUndefined()
})

test('the original atlas tree penumbra disappears while a separate rock shadow remains', async () => {
    const atlas = fileURLToPath(new URL('../static/models/intro/static/floorShadow.png', import.meta.url))
    const { data, info } = await sharp(atlas).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const alphaAt = (x, y) => {
        const px = Math.round((x + 15) / 30 * 512), py = Math.round((15 - y) / 30 * 512)
        return 1 - data[(py * info.width + px) * info.channels] / 255
    }
    const anchors = [[-5.9202, 3.7353], [-5.3828, -.9856], [2.6115, 7.0493], [4.518, 8.1693], [8.45655, -.96406], [7.8267, -10.0908], [-7.4309, -12.7691]]
    const masks = anchors.map(([x, y]) => retiredTreeMask({ x, y, radius: .9837, height: 3.19316 }))
    const remaining = (x, y) => masks.reduce((alpha, tree) => {
        const ray = new THREE.Vector2(2 / 3, 2.65 / 3.75).multiplyScalar(tree.w)
        const point = new THREE.Vector2(x - tree.x, y - tree.y)
        const along = THREE.MathUtils.clamp(point.dot(ray) / ray.lengthSq(), 0, 1)
        const distance = point.sub(ray.multiplyScalar(along)).length()
        return alpha * THREE.MathUtils.smoothstep(distance, tree.z * .8, tree.z + .5)
    }, alphaAt(x, y))
    // A visible soft tail that survived the smaller crown-only mask.
    const tail = [8.45655 + .09814, -.96406 + 3.60078]
    expect(alphaAt(...tail)).toBeGreaterThan(.04)
    expect(remaining(...tail)).toBeLessThan(.001)
    const rock = [-7.617, -5.508]
    expect(alphaAt(...rock)).toBeGreaterThan(.8)
    expect(remaining(...rock)).toBeCloseTo(alphaAt(...rock), 5)
})

test('tree contact shadows wait for the actual botanical meshes, in either loading order', () => {
    const trees = [{ x: 1, y: -12, radius: 2 }], calls = []
    const subject = { state: 'loading', container: new THREE.Group(), setContactShadows: (container, placements) => calls.push({ container, placements }) }
    EnvironmentDressing.prototype.setTreeReady.call(subject, trees)
    expect(subject.readyTrees).toBe(trees)
    expect(calls).toHaveLength(0)
    subject.state = 'ready'
    EnvironmentDressing.prototype.setTreeReady.call(subject, trees)
    expect(calls).toHaveLength(1)
    expect(calls[0].placements).toBe(trees)
    expect(calls[0].container).toBe(subject.container)
})
