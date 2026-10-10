import { expect, test } from 'bun:test'
import { AssetQueue, assetConcurrency } from '../src/javascript/Utils/AssetQueue.js'
import Loader from '../src/javascript/Utils/Loader.js'

test('the network gate prioritizes an explicit destination and recovers its slot after a failure', async () => {
    const queue = new AssetQueue(1)
    const calls = []
    let release
    const first = queue.schedule(() => new Promise(resolve => { release = resolve; calls.push('active') }))
    const background = queue.schedule(() => calls.push('background'), 10, 'background')
    const destination = queue.schedule(() => { calls.push('destination'); throw new Error('offline') }, 10, 'destination')
    const failed = destination.catch(() => 'caught')
    queue.promote('destination', 0)
    await Promise.resolve()
    expect(queue.active).toBe(1)
    release()
    await Promise.all([first, background, failed])
    expect(calls).toEqual(['active', 'destination', 'background'])
    expect(assetConcurrency({ effectiveType: '2g' })).toBe(2)
    expect(assetConcurrency({ effectiveType: 'slow-2g' })).toBe(2)
    expect(assetConcurrency({ effectiveType: '4g', saveData: true })).toBe(2)
    expect(assetConcurrency({ effectiveType: '4g' })).toBe(4)
})

test('a failed core file does not unlock entry; retry keeps previously loaded resources', async () => {
    const loader = new Loader({ queue: new AssetQueue(1) })
    const calls = []
    let online = false, readyCount = 0
    loader.loaders = [{ extensions: ['glb'], action: async resource => {
        calls.push(resource.name)
        if (resource.name === 'car' && !online) throw new Error('offline')
        return { name: resource.name }
    } }]
    loader.on('end', () => readyCount++)
    const failed = new Promise(resolve => loader.on('error', resolve))
    loader.load([{ name: 'ground', source: 'ground.glb' }, { name: 'car', source: 'car.glb' }])
    await failed
    expect(readyCount).toBe(0)
    expect(loader.loaded).toBe(1)
    expect(calls).toEqual(['ground', 'car', 'car'])
    online = true
    const ready = new Promise(resolve => loader.on('end', resolve))
    loader.retryFailed()
    await ready
    expect(loader.loaded).toBe(2)
    expect(loader.toLoad).toBe(2)
    expect(loader.failures.size).toBe(0)
    expect(readyCount).toBe(1)
    expect(calls).toEqual(['ground', 'car', 'car', 'car'])
})
