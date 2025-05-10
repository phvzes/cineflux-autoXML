import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// MIME types mapping - expanded to include all common file types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.cjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request: ${req.url}`);
  
  // Set CORS headers for WASM support
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  
  // Parse URL to get the pathname
  let pathname = req.url;
  
  // Remove query parameters if any
  if (pathname.includes('?')) {
    pathname = pathname.split('?')[0];
  }
  
  // If the URL is '/', serve index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Construct the file path
  const filePath = path.join(DIST_DIR, pathname);
  console.log(`Looking for file: ${filePath}`);
  
  // Check if the file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      console.log(`File not found: ${filePath}, serving index.html instead`);
      // If the file doesn't exist, serve index.html for client-side routing
      const indexPath = path.join(DIST_DIR, 'index.html');
      
      fs.readFile(indexPath, (err, data) => {
        if (err) {
          console.error(`Error reading index.html: ${err.message}`);
          res.writeHead(500);
          res.end('Error loading index.html');
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }
    
    // Read the file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(`Error reading file ${filePath}: ${err.message}`);
        res.writeHead(500);
        res.end(`Error loading ${pathname}`);
        return;
      }
      
      // Get the file extension
      const ext = path.extname(filePath).toLowerCase();
      
      // Set the content type based on the file extension
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      console.log(`Serving ${filePath} with content type: ${contentType}`);
      
      // Send the response
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Serving files from: ${DIST_DIR}`);
  
  // List files in the dist directory
  console.log('Files in dist directory:');
  try {
    const files = fs.readdirSync(DIST_DIR);
    files.forEach(file => {
      console.log(`- ${file}`);
    });
    
    // Check assets directory
    const assetsDir = path.join(DIST_DIR, 'assets');
    if (fs.existsSync(assetsDir)) {
      console.log('Files in assets directory:');
      const assetFiles = fs.readdirSync(assetsDir);
      assetFiles.forEach(file => {
        console.log(`- assets/${file}`);
      });
    }
  } catch (err) {
    console.error(`Error listing files: ${err.message}`);
  }
});
