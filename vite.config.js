import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        redoman: 'qr-admin.html',
        redirect: 'redirect.html'
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          qr: ['qrcode.react'],
          motion: ['framer-motion', 'react-zoom-pan-pinch']
        }
      }
    }
  }
})