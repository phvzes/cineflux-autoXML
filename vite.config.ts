import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  const isProduction = mode === 'production';
  const skipTypeCheck = process.env.SKIP_TS_CHECK === 'true';
  
  return {
    plugins: [
      react(),
      // Add visualizer in analyze mode
      mode === 'analyze' && visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html'
      }),
      {
        name: 'mime-type-fix',
        configureServer: (server) => {
          server.middlewares.use((req, res, next) => {
            // Set CORS headers for WASM support
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            
            // Set correct MIME types for JavaScript modules
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
      // Disable source maps in production for smaller bundles
      sourcemap: !isProduction,
      // Target modern browsers for better performance
      target: 'esnext',
      // Minification settings
      minify: isProduction ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        }
      },
      // Set chunk size warning limit (in kB)
      chunkSizeWarningLimit: 300,
      // Empty the outDir before building
      emptyOutDir: true,
      // Output directory
      outDir: 'dist',
      assetsDir: 'assets',
      // Configure Rollup options
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        },
        output: {
          // Configure code splitting
          manualChunks: (id) => {
            // Create a separate chunk for WebAssembly-related modules
            if (id.includes('@ffmpeg') || 
                id.includes('opencv-js') || 
                id.includes('essentia.js') || 
                id.includes('meyda')) {
              return 'wasm-modules';
            }
            
            // Create a vendor chunk for React and related libraries
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/react-dom') || 
                id.includes('node_modules/scheduler')) {
              return 'react-vendor';
            }
            
            // Create a chunk for UI-related libraries
            if (id.includes('node_modules/lucide-react') || 
                id.includes('node_modules/react-dropzone') || 
                id.includes('node_modules/react-player')) {
              return 'ui-vendor';
            }
            
            // Create a chunk for audio processing libraries
            if (id.includes('node_modules/wavesurfer.js') || 
                id.includes('node_modules/web-audio-beat-detector')) {
              return 'audio-vendor';
            }
            
            // Other node_modules go to a separate vendor chunk
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          // Configure chunk and asset naming
          entryFileNames: isProduction 
            ? 'assets/[name].[hash].js' 
            : 'assets/[name].js',
          chunkFileNames: isProduction 
            ? 'assets/[name].[hash].js' 
            : 'assets/[name].js',
          assetFileNames: isProduction 
            ? 'assets/[name].[hash].[ext]' 
            : 'assets/[name].[ext]',
        }
      },
      // Optimize WebAssembly loading
      assetsInlineLimit: 0, // Don't inline WebAssembly files
    },
    // Configure public directory
    publicDir: 'public',
    // Configure server
    server: {
      middlewareMode: false,
      fs: {
        strict: false,
      },
      headers: {
        'Content-Type': 'application/javascript',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    // Define environment variables
    define: {
      // Make environment variables available to the client
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || mode),
      'process.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION || '0.1.0'),
      'process.env.VITE_WASM_CDN_URL': JSON.stringify(env.VITE_WASM_CDN_URL || ''),
      'process.env.VITE_FEATURE_FLAGS': JSON.stringify(env.VITE_FEATURE_FLAGS || '{}'),
    },
    // Configure optimizeDeps for faster development
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        'react-router-dom',
        'zustand'
      ],
      exclude: [
        // Exclude WebAssembly modules from pre-bundling
        '@ffmpeg/core',
        '@ffmpeg/ffmpeg',
        '@techstark/opencv-js',
        'essentia.js',
        'meyda'
      ]
    },
    // Configure preview server
    preview: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
  };
});
