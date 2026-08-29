import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
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
    assetsInlineLimit: 4096, // Inline tiny assets < 4KB as base64 (saves HTTP requests)
  }
})
