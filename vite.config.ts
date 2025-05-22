import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mime-type-fix',
      configureServer: (server) => {
        server.middlewares.use((req, res, next) => {
          // Set CORS headers for WASM support
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          
          // Set correct MIME types for various file types
          const url = req.url?.split('?')[0];
          if (url?.endsWith('.js') || url?.endsWith('.mjs')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          } else if (url?.endsWith('.ts') || url?.endsWith('.tsx') || url?.endsWith('.jsx')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          } else if (url?.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
          } else if (url?.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
          } else if (url?.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
          } else if (url?.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
          } else if (url?.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
          } else if (url === '/' || url === '') {
            // Handle root URL as HTML
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
          } else if (url?.includes('/src/types/wasm/flow/')) {
            // Handle WASM type files
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          }
          
          next();
        });
      },
    }
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
    target: 'esnext',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  publicDir: 'public',
  server: {
    middlewareMode: false,
    fs: {
      strict: false,
    },
    headers: {
      // Remove global Content-Type header as it's handled by the mime-type-fix plugin
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
});