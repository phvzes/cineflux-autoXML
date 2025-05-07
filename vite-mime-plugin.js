// vite-mime-plugin.js
export default function mimeFix() {
  return {
    name: 'vite-plugin-mime-fix',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Set correct MIME types for JavaScript modules
        if (req.url) {
          const url = req.url.split('?')[0]; // Remove query parameters
          if (url.endsWith('.js') || url.endsWith('.mjs') || 
              url.endsWith('.ts') || url.endsWith('.tsx') || 
              url.endsWith('.jsx')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          }
        }
        
        // Also intercept setHeader calls to ensure correct MIME type
        const originalSetHeader = res.setHeader;
        res.setHeader = function(name, value) {
          if (name === 'Content-Type' && 
             (value === 'text/javascript' || value === 'application/octet-stream')) {
            return originalSetHeader.call(this, name, 'application/javascript; charset=utf-8');
          }
          return originalSetHeader.call(this, name, value);
        };
        
        next();
      });
    }
  };
}
