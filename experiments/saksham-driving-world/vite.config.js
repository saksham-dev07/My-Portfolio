import { isAbsolute, relative } from 'node:path'
import glsl from 'vite-plugin-glsl'

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
    server:
    {
        host: '127.0.0.1', // Open to local network and display URL
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env) // Open if it's not a CodeSandbox
    },
    build:
    {
        outDir: '../dist', // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: false // Keep source/debug maps out of the published world
    },
    plugins:
    [
        glsl(), // Support GLSL files
        reloadStaticAssets
    ],
}
