import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import mimeFix from './vite-mime-plugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determine the base path from environment or default to '/'
  const basePath = env.VITE_PUBLIC_PATH || '/';
  
  return {
    base: basePath,
    plugins: [
      react(),
      mimeFix(), // Use our improved MIME type plugin
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
        allow: ['..'], // Allow serving files from one level up (for monorepo setups)
      },
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    preview: {
      port: 4173,
      host: true,
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    // Ensure all asset types are properly handled
    assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp'],
  };
});
