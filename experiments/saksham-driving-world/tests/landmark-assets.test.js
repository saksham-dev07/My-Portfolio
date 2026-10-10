import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { getBounds } from '@gltf-transform/functions'
import draco3d from 'draco3d'
import sharp from 'sharp'
import assets from '../src/javascript/World/Sections/landmark-assets.json'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
})

for (const [id, asset] of Object.entries(assets)) test(`${id} compressed art preserves triangles, texture pixels and layout bounds`, async () => {
    const url = new URL(`../static/${asset.url.replace('./', '')}`, import.meta.url)
    const bytes = new Uint8Array(await Bun.file(url).arrayBuffer())
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12)
    expect(asset.url).toContain(`-${hash}.glb`)
    expect(bytes.length).toBe(asset.bytes)
    expect(bytes.length).toBeLessThan(asset.originalBytes * .55)
    const document = await io.readBinary(bytes)
    const triangles = document.getRoot().listMeshes().reduce((count, mesh) => count +
        mesh.listPrimitives().reduce((sum, p) => sum + p.getIndices().getCount() / 3, 0), 0)
    expect(triangles).toBe(asset.triangles)
    const bounds = getBounds(document.getRoot().listScenes()[0])
    const extent = Math.max(...asset.bounds.max.map((value, i) => value - asset.bounds.min[i]))
    for (const side of ['min', 'max']) for (let axis = 0; axis < 3; axis++)
        expect(Math.abs(bounds[side][axis] - asset.bounds[side][axis])).toBeLessThan(extent / 65535 * 2)
    const textures = document.getRoot().listTextures()
    expect(textures).toHaveLength(asset.textures.length)
    for (let index = 0; index < textures.length; index++) {
        const image = Buffer.from(textures[index].getImage())
        const metadata = await sharp(image).metadata()
        const pixels = await sharp(image).ensureAlpha().raw().toBuffer()
        expect([metadata.width, metadata.height]).toEqual([asset.textures[index].width, asset.textures[index].height])
        expect(createHash('sha256').update(pixels).digest('hex')).toBe(asset.textures[index].pixelHash)
    }
}, 10000)
