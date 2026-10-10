export function assetConcurrency(connection = globalThis.navigator?.connection) {
    return connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '') ? 2 : 4
}

// Explicit navigation takes priority over queued decoration. Inflight work
// finishes normally, keeping one small, bounded network/decode gate for the world.
export class AssetQueue {
    constructor(limit = assetConcurrency()) {
        this.limit = limit
        this.active = 0
        this.pending = []
        this.sequence = 0
    }
    schedule(run, priority = 10, key = null) {
        return new Promise((resolve, reject) => {
            this.pending.push({ run, priority, key, resolve, reject, order: this.sequence++ })
            this.drain()
        })
    }
    promote(key, priority) {
        for (const task of this.pending) if (task.key === key) task.priority = Math.min(task.priority, priority)
    }
    drain() {
        this.pending.sort((a, b) => a.priority - b.priority || a.order - b.order)
        while (this.active < this.limit && this.pending.length) {
            const task = this.pending.shift()
            this.active++
            Promise.resolve().then(task.run).then(task.resolve, task.reject).finally(() => {
                this.active--
                this.drain()
            })
        }
    }
}

export const assetQueue = new AssetQueue()
