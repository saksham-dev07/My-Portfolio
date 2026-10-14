import { existsSync } from 'node:fs'
import { isAbsolute, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import glsl from 'vite-plugin-glsl'

const cannonEsEntry = fileURLToPath(new URL('./node_modules/cannon-es/dist/cannon-es.js', import.meta.url))
const legacyCannonEntry = fileURLToPath(new URL('./node_modules/cannon/build/cannon.js', import.meta.url))
const resolveAliases = [
    { find: /^three$/, replacement: fileURLToPath(new URL('./node_modules/three/src/Three.js', import.meta.url)) },
]
if (existsSync(cannonEsEntry)) {
    resolveAliases.push({ find: /^(cannon|cannon-es)$/, replacement: cannonEsEntry })
} else if (existsSync(legacyCannonEntry)) {
    resolveAliases.push({ find: /^(cannon|cannon-es)$/, replacement: legacyCannonEntry })
}

// Use Vite's existing watcher rather than a second glob/watcher dependency.
const reloadStaticAssets = {
    name: 'world-static-assets',
    configureServer(server) {
        const directory = server.config.publicDir
        const reload = file => {
            const path = relative(directory, file)
            if (!path.startsWith('..') && !isAbsolute(path))
                server.ws.send({ type: 'full-reload', path: '*' })
        }
        server.watcher.add(directory)
        for (const event of ['add', 'change', 'unlink']) server.watcher.on(event, reload)
        server.httpServer?.once('close', () => {
            for (const event of ['add', 'change', 'unlink']) server.watcher.off(event, reload)
        })
    },
}

export default {
    base: './',
    root: 'src/', // Sources files (typically where index.html is)
    publicDir: '../static/', // Path from "root" to static assets (files that are served as they are)
    css: { postcss: { plugins: [] } },
    resolve: {
        alias: resolveAliases,
    },
    server:
    {
        host: '127.0.0.1', // Open to local network and display URL
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env) // Open if it's not a CodeSandbox
    },
    build:
    {
        outDir: '../dist', // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: false, // Keep source/debug maps out of the published world
        rolldownOptions: {
            output: {
                strictExecutionOrder: true,
                codeSplitting: {
                    includeDependenciesRecursively: false,
                    groups: [
                        { name: 'three-vendor', test: /node_modules[\\/]three[\\/]/, minSize: 100000, maxSize: 900000, priority: 20 },
                        { name: 'physics-vendor', test: /node_modules[\\/](cannon|cannon-es)[\\/]/, priority: 10 },
                        { name: 'animation-vendor', test: /node_modules[\\/](gsap|howler)[\\/]/, priority: 10 },
                        { name: 'world-districts', test: /src[\\/]javascript[\\/]World[\\/]Sections[\\/]/, priority: 5 },
                    ],
                },
            },
        },
    },
    plugins:
    [
        glsl(), // Support GLSL files
        reloadStaticAssets
    ],
}
