import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import mimeFix from './vite-mime-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mimeFix()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          ffmpeg: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
          ui: ['tailwindcss', 'lucide-react'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'tailwindcss', 'lucide-react'],
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    // Explicitly set MIME types for TypeScript and JavaScript files
    fs: {
      strict: true,
    },
  },
});
