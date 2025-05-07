import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-response-headers',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          // Force JavaScript MIME type for module scripts
          const originalSetHeader = res.setHeader;
          res.setHeader = function(name, value) {
            if (name === 'Content-Type' && value === 'text/javascript') {
              return originalSetHeader.call(this, name, 'application/javascript; charset=utf-8');
            }
            return originalSetHeader.call(this, name, value);
          };
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
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
    }
  },
});
