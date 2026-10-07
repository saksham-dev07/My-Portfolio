import restart from 'vite-plugin-restart'
import glsl from 'vite-plugin-glsl'

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
        restart({ restart: [ '../static/**', ] }) // Restart server on static file change
    ],
}
