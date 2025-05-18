#!/usr/bin/env node

/**
 * analyze-bundle.js
 * 
 * Script to analyze the bundle size of the production build.
 * Helps ensure the application meets the performance targets.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const chalk = require('chalk');

// Configuration
const DIST_DIR = path.join(__dirname, '../dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const SIZE_LIMIT_KB = 300; // Maximum allowed size for main bundle (KB)

// Format size in KB
const formatSize = (bytes) => {
  return (bytes / 1024).toFixed(2) + ' KB';
};

// Format size with color based on limit
const formatSizeWithColor = (bytes, limit) => {
  const kb = bytes / 1024;
  const color = kb > limit ? 'red' : kb > limit * 0.8 ? 'yellow' : 'green';
  return chalk[color](formatSize(bytes));
};

// Get all JS files in the assets directory
const getJsFiles = () => {
  try {
    return fs.readdirSync(ASSETS_DIR)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(ASSETS_DIR, file));
  } catch (error) {
    console.error(chalk.red('Error reading assets directory:'), error.message);
    return [];
  }
};

// Get file size information (raw and gzipped)
const getFileSizeInfo = (filePath) => {
  try {
    const content = fs.readFileSync(filePath);
    const gzipped = zlib.gzipSync(content);
    
    return {
      path: filePath,
      name: path.basename(filePath),
      size: content.length,
      gzipSize: gzipped.length,
    };
  } catch (error) {
    console.error(chalk.red(`Error processing file ${filePath}:`), error.message);
    return null;
  }
};

// Main function
const analyzeBundle = () => {
  console.log(chalk.blue('Analyzing bundle size...'));
  
  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error(chalk.red('Error: dist directory not found. Run "npm run build" first.'));
    process.exit(1);
  }
  
  // Get all JS files
  const jsFiles = getJsFiles();
  
  if (jsFiles.length === 0) {
    console.error(chalk.red('No JS files found in the assets directory.'));
    process.exit(1);
  }
  
  // Get size information for each file
  const fileSizeInfos = jsFiles
    .map(getFileSizeInfo)
    .filter(Boolean)
    .sort((a, b) => b.gzipSize - a.gzipSize);
  
  // Calculate total size
  const totalSize = fileSizeInfos.reduce((sum, info) => sum + info.size, 0);
  const totalGzipSize = fileSizeInfos.reduce((sum, info) => sum + info.gzipSize, 0);
  
  // Find main bundle (usually the largest one)
  const mainBundle = fileSizeInfos[0];
  const isMainBundleOverLimit = mainBundle.gzipSize > SIZE_LIMIT_KB * 1024;
  
  // Print results
  console.log(chalk.blue('\nBundle Size Analysis:'));
  console.log(chalk.blue('====================='));
  
  // Print each file
  fileSizeInfos.forEach(info => {
    const isMainBundle = info === mainBundle;
    const name = isMainBundle ? chalk.bold(info.name) : info.name;
    const gzipSize = formatSizeWithColor(info.gzipSize, isMainBundle ? SIZE_LIMIT_KB : Infinity);
    
    console.log(
      `${name} ${chalk.gray('(gzipped)')} ${gzipSize}`
    );
  });
  
  // Print summary
  console.log(chalk.blue('\nSummary:'));
  console.log(chalk.blue('========'));
  console.log(`Total Size: ${formatSize(totalSize)}`);
  console.log(`Total Gzipped Size: ${formatSize(totalGzipSize)}`);
  console.log(`Main Bundle Gzipped Size: ${formatSizeWithColor(mainBundle.gzipSize, SIZE_LIMIT_KB)}`);
  
  // Print performance assessment
  console.log(chalk.blue('\nPerformance Assessment:'));
  console.log(chalk.blue('======================'));
  
  if (isMainBundleOverLimit) {
    console.log(chalk.red(`❌ Main bundle exceeds the ${SIZE_LIMIT_KB} KB limit.`));
    console.log(chalk.yellow('Consider further optimizations:'));
    console.log('- Split large components into smaller chunks');
    console.log('- Lazy load non-critical components');
    console.log('- Review and optimize large dependencies');
  } else {
    console.log(chalk.green(`✅ Main bundle is under the ${SIZE_LIMIT_KB} KB limit.`));
  }
  
  // Exit with appropriate code
  process.exit(isMainBundleOverLimit ? 1 : 0);
};

// Run the analysis
analyzeBundle();
