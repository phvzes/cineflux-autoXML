
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
            res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self' blob:; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; frame-ancestors 'none';");
            
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
            } else if (url?.endsWith('.wasm')) {
              res.setHeader('Content-Type', 'application/wasm');
              // Set caching headers for WebAssembly files
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
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
      target: isProduction ? ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'] : 'esnext',
      // Minification settings - use esbuild for faster builds, terser for more aggressive minification
      minify: isProduction ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
          passes: 2, // Multiple passes for more aggressive optimization
          ecma: 2020, // Use modern ECMAScript features
        },
        mangle: {
          safari10: false, // No need to support Safari 10
        },
        format: {
          comments: false, // Remove comments
        },
      },
      // Set chunk size warning limit (in kB)
      chunkSizeWarningLimit: 500,
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
            
            // Create a chunk for routing and state management
            if (id.includes('node_modules/react-router') || 
                id.includes('node_modules/zustand')) {
              return 'router-state-vendor';
            }
            
            // Split by module size for better loading performance
            if (id.includes('node_modules')) {
              // Group smaller modules together to avoid excessive chunking
              return 'vendor';
            }
            
            // Split application code by feature area
            if (id.includes('/src/features/')) {
              const feature = id.split('/src/features/')[1].split('/')[0];
              return `feature-${feature}`;
            }
            
            // Split components into their own chunk
            if (id.includes('/src/components/')) {
              return 'components';
            }
          },
          // Configure chunk and asset naming with content hashing for optimal caching
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: (assetInfo) => {
            // Special handling for WebAssembly files
            if (assetInfo.name && assetInfo.name.endsWith('.wasm')) {
              return 'assets/wasm/[name].[hash].[ext]';
            }
            return 'assets/[name].[hash].[ext]';
          },
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
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self' blob:; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; frame-ancestors 'none';",
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
      ],
      // Enable esbuild's optimization for dependencies
      esbuildOptions: {
        target: 'es2020',
        supported: {
          'top-level-await': true,
        },
      },
    },
    // Configure preview server
    preview: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self' blob:; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; frame-ancestors 'none';",
      },
    },
  };
});
