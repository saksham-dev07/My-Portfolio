import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { assetQueue } from './AssetQueue.js'

let gltfLoader
const cached = new Map()

function parser() {
    if (!gltfLoader) {
        // Three r186 ships URL-managed decoder assets; Vite fingerprints them.
        const draco = new DRACOLoader().setWorkerLimit(2)
        gltfLoader = new GLTFLoader().setDRACOLoader(draco)
        THREE.Cache.enabled = true
    }
    return gltfLoader
}

export async function fetchModel(url, onProgress) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90000)
    try {
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error(`Model request failed: ${response.status}`)
        const total = Number(response.headers.get('Content-Length')) || 0
        let bytes
        if (response.body && onProgress) {
            const reader = response.body.getReader(), chunks = []
            let loaded = 0, nextProgress = 0
            for (;;) {
                const { done, value } = await reader.read()
                if (done) break
                chunks.push(value)
                loaded += value.length
                if (performance.now() >= nextProgress || loaded === total) {
                    onProgress({ loaded, total })
                    nextProgress = performance.now() + 250
                }
            }
            bytes = new Uint8Array(loaded)
            let offset = 0
            for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
            onProgress({ loaded, total: total || loaded })
        } else bytes = new Uint8Array(await response.arrayBuffer())
        const base = new URL('.', new URL(url, globalThis.location?.href || 'http://localhost/')).href
        return await parser().parseAsync(bytes.buffer, base)
    } finally { clearTimeout(timeout) }
}

// Keep the optional art modules' injectable callback API, reuse the Draco pool,
// and retain only successful/inflight requests so a failed URL can be retried.
export const modelLoader = {
    load(url, onLoad, onProgress, onError = () => {}, priority = 10) {
        assetQueue.promote(url, priority)
        if (!cached.has(url)) {
            const promise = assetQueue.schedule(() => fetchModel(url, onProgress), priority, url)
            cached.set(url, promise)
            promise.catch(() => cached.delete(url))
        }
        cached.get(url).then(onLoad).catch(onError)
    },
}
