import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Emite SVG/imagens como ficheiros em dist/assets (hash no nome) em vez de data-URLs
    // gigantes dentro do JS — mais fiável em CDNs (Render) e melhor para cache.
    assetsInlineLimit: 0,
  },
})
