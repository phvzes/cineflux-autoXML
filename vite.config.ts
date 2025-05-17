import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determine the base path from environment or default to './'
  const basePath = env.VITE_PUBLIC_PATH || './';
  
  return {
    base: basePath,
    plugins: [
      react(),
      {
        name: 'configure-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Set CORS headers
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            
            // Handle MIME types
            if (req.url) {
              const url = req.url.split('?')[0];
              
              // Set correct MIME type for WebAssembly files
              if (url.endsWith('.wasm')) {
                res.setHeader('Content-Type', 'application/wasm');
              }
              // Set correct MIME type for JavaScript files
              else if (url.endsWith('.js') || url.endsWith('.mjs')) {
                res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
              }
              // Set correct MIME type for SVG files
              else if (url.endsWith('.svg')) {
                res.setHeader('Content-Type', 'image/svg+xml');
              }
            }
            
            next();
          });
        }
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
      // Ensure assets are properly handled
      assetsInlineLimit: 0,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          // Manual chunks for better code splitting
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            ffmpeg: ['@ffmpeg/ffmpeg', '@ffmpeg/core', '@ffmpeg/util'],
            ui: ['tailwindcss', 'lucide-react'],
          },
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'tailwindcss', 'lucide-react'],
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/core', '@techstark/opencv-js']
    },
    publicDir: 'public',
    server: {
      middlewareMode: false,
      fs: {
        strict: false,
        allow: ['..'], // Allow serving files from one level up (for monorepo setups)
      },
      headers: {
        // Cross-Origin Isolation headers for SharedArrayBuffer support
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
      // Explicitly set MIME types for JavaScript modules
      mimeTypes: {
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.wasm': 'application/wasm'
      }
    },
    preview: {
      port: 4173,
      host: true,
      headers: {
        // Cross-Origin Isolation headers for SharedArrayBuffer support
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
      // Explicitly set MIME types for JavaScript modules
      mimeTypes: {
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.wasm': 'application/wasm'
      }
    },
    // Ensure all asset types are properly handled
    assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp', '**/*.wasm'],
  };
});
