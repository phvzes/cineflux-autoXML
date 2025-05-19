
/**
 * Post-build script to ensure WebAssembly files have proper headers and are placed in the correct directory
 * This script runs after the build process to organize and optimize WebAssembly files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const distDir = path.resolve(__dirname, '../dist');
const assetsDir = path.resolve(distDir, 'assets');
const wasmDir = path.resolve(assetsDir, 'wasm');

// Create wasm directory if it doesn't exist
if (!fs.existsSync(wasmDir)) {
  fs.mkdirSync(wasmDir, { recursive: true });
  console.log('Created wasm directory:', wasmDir);
}

// Function to find and move WebAssembly files
function processWasmFiles() {
  let count = 0;
  
  // Recursively search for .wasm files
  function findWasmFiles(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && filePath !== wasmDir) {
        findWasmFiles(filePath);
      } else if (file.endsWith('.wasm') && !filePath.startsWith(wasmDir)) {
        // Move the file to the wasm directory
        const destPath = path.join(wasmDir, file);
        fs.copyFileSync(filePath, destPath);
        fs.unlinkSync(filePath);
        count++;
        console.log(`Moved: ${filePath} -> ${destPath}`);
      }
    }
  }
  
  findWasmFiles(distDir);
  console.log(`Processed ${count} WebAssembly files`);
}

// Process WebAssembly files
processWasmFiles();

console.log('WebAssembly optimization complete!');
