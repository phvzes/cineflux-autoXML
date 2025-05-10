// vite-mime-plugin.js
export default function mimeFix() {
  return {
    name: 'vite-plugin-mime-fix',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Set correct MIME types for JavaScript modules
        if (req.url) {
          const url = req.url.split('?')[0]; // Remove query parameters
          
          // JavaScript files
          if (url.endsWith('.js') || url.endsWith('.mjs') || 
              url.endsWith('.ts') || url.endsWith('.tsx') || 
              url.endsWith('.jsx')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          }
          // SVG files
          else if (url.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
          }
          // CSS files
          else if (url.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
          }
          // JSON files
          else if (url.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
          }
          // HTML files
          else if (url.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
          }
          // WASM files
          else if (url.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
          }
        }
        
        // Also intercept setHeader calls to ensure correct MIME type
        const originalSetHeader = res.setHeader;
        res.setHeader = function(name, value) {
          if (name.toLowerCase() === 'content-type') {
            // Fix JavaScript MIME types
            if (value === 'text/javascript' || value === 'application/octet-stream') {
              const url = req.url?.split('?')[0] || '';
              
              // Set appropriate MIME type based on file extension
              if (url.endsWith('.js') || url.endsWith('.mjs') || 
                  url.endsWith('.ts') || url.endsWith('.tsx') || 
                  url.endsWith('.jsx')) {
                return originalSetHeader.call(this, name, 'application/javascript; charset=utf-8');
              }
              // SVG files
              else if (url.endsWith('.svg')) {
                return originalSetHeader.call(this, name, 'image/svg+xml');
              }
            }
          }
          return originalSetHeader.call(this, name, value);
        };
        
        next();
      });
    }
  };
}
