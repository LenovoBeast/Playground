import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Playground/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  },
  server: { port: 3000 }
})