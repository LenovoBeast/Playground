import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Playground/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 550
  },
  server: { port: 3000 }
})