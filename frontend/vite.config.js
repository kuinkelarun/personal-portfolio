import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // bind explicitly to IPv4 loopback to avoid localhost IPv6/IPv4 resolution
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      // Proxy API calls to Flask during development
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        ws: true,
        // keep path unchanged, but ensure trailing slash handling is consistent
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
    },
  }
})
