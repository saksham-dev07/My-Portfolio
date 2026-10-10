import EventEmitter from './EventEmitter.js'
import { assetQueue } from './AssetQueue.js'
import { fetchModel } from './ModelLoader.js'

export default class Loader extends EventEmitter {
    constructor({ queue = assetQueue } = {}) {
        super()
        this.queue = queue
        this.toLoad = 0
        this.loaded = 0
        this.items = {}
        this.failures = new Map()
        this.inflight = new Set()
        this.loaders = [
            { extensions: ['jpg', 'jpeg', 'png', 'webp'], action: resource => new Promise((resolve, reject) => {
                const image = new Image()
                const timeout = setTimeout(() => { image.src = ''; reject(new Error('Image timed out')) }, 90000)
                image.onload = () => { clearTimeout(timeout); resolve(image) }
                image.onerror = () => { clearTimeout(timeout); reject(new Error('Image unavailable')) }
                image.src = resource.source
            }) },
            { extensions: ['glb', 'gltf'], action: resource => fetchModel(resource.source) },
        ]
    }
    load(resources = []) {
        this.toLoad += resources.length
        for (const resource of resources) this.loadOne(resource)
    }
    async loadOne(resource) {
        if (this.inflight.has(resource.name) || Object.hasOwn(this.items, resource.name)) return
        this.inflight.add(resource.name)
        const extension = resource.source.split('?')[0].split('.').at(-1).toLowerCase()
        const loader = this.loaders.find(item => item.extensions.includes(extension))
        try {
            if (!loader) throw new Error('Unsupported resource')
            let data
            for (let attempt = 0; attempt < 2; attempt++) {
                try { data = await this.queue.schedule(() => loader.action(resource), 0); break }
                catch (error) { if (attempt) throw error }
            }
            this.failures.delete(resource.name)
            this.fileLoadEnd(resource, data)
        } catch {
            this.failures.set(resource.name, resource)
            this.trigger('error', [[...this.failures.values()]])
        } finally { this.inflight.delete(resource.name) }
    }
    retryFailed() {
        for (const resource of this.failures.values()) this.loadOne(resource)
    }
    fileLoadEnd(resource, data) {
        this.loaded++
        this.items[resource.name] = data
        this.trigger('fileEnd', [resource, data])
        if (this.loaded === this.toLoad) this.trigger('end')
    }
}
