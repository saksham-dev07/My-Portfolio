import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  plugins: [
    react(),
    // Pre-compress all assets with Brotli (best ratio) and Gzip (fallback)
    // Vercel serves pre-compressed files automatically when available
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br|gz)$/i, /\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/i],
      threshold: 1024,  // Only compress files > 1KB
    }),
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br|gz)$/i, /\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/i],
      threshold: 1024,
    }),
  ],
  build: {
    target: 'es2020',
    // CSS optimization (uses Vite's built-in esbuild minifier)
    // Minification via esbuild (built into Vite — zero extra deps)
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],  // Strip console.log & debugger in production
      legalComments: 'none',          // Remove license comments
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-core': ['three'],
          'three-drei': ['@react-three/drei', '@react-three/fiber'],
          'framer-motion': ['framer-motion'],
          'icons-vendor': ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1200,
    assetsInlineLimit: 4096,   // Inline tiny assets < 4KB as base64 (saves HTTP requests)
    reportCompressedSize: true, // Show gzip sizes in build output
  },
})
