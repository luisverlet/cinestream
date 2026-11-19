import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/jellyfin': {
        target: process.env.VITE_JELLYFIN_URL || 'http://localhost:8096',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/jellyfin/, ''),
      }
    }
  },
  build: {
    target: 'es2020',
    cssMinify: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          hls: ['hls.js'],
          preact: ['preact', 'preact/hooks']
        }
      }
    }
  }
});

