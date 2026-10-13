import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Playground/',
  // Vite 5 does not consume the newer additional-host environment flag.
  server: {
    allowedHosts: process.env.PREVIEW_HOST ? [process.env.PREVIEW_HOST] : [],
  },
  build: {
    // three.js alone minifies to ~510 kB and is now isolated in vendor-three
    // (128 kB gzip, cached independently). Raising the warning limit keeps the
    // signal honest: everything else is split and small.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split heavy, rarely-changing dependencies into their own chunks so
        // app-code changes don't invalidate them in users' caches.
        // Rolldown (Vite 8) requires the function form of manualChunks.
        manualChunks(id) {
          if (!/node_modules[\\/]/.test(id)) return undefined;
          if (/node_modules[\\/]three[\\/]/.test(id)) return 'vendor-three';
          if (/node_modules[\\/](gsap|framer-motion)[\\/]/.test(id)) return 'vendor-motion';
          if (/node_modules[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
          if (/node_modules[\\/]@phosphor-icons[\\/]/.test(id)) return 'vendor-icons';
          return undefined;
        },
      },
    },
  },
})