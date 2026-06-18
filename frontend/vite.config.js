import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ── Development Proxy ─────────────────────────────────────────────────────
  // In dev, all /api and /media requests are forwarded to the Django backend.
  // In production, VITE_API_URL in .env.production points directly to Railway.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // ── Production Build ──────────────────────────────────────────────────────
  build: {
    outDir: 'dist',
    // Source maps disabled for production (reduces bundle size)
    sourcemap: false,
    // Warn when chunks exceed 800kb
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Vite 8 (Rolldown) requires manualChunks as a function, not an object
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor'
          }
          if (id.includes('node_modules/axios')) {
            return 'axios'
          }
        },
      },
    },
  },
})
