
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Performance measurement utility class
 */
class PerformanceTimer {
  constructor(name) {
    this.name = name;
    this.startTime = 0;
    this.endTime = 0;
    this.measurements = [];
  }

  /**
   * Start the timer
   */
  start() {
    this.startTime = performance.now();
    return this;
  }

  /**
   * Stop the timer and record the measurement
   */
  stop() {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;
    this.measurements.push(duration);
    return duration;
  }

  /**
   * Get the average duration of all measurements
   */
  getAverage() {
    if (this.measurements.length === 0) return 0;
    const sum = this.measurements.reduce((a, b) => a + b, 0);
    return sum / this.measurements.length;
  }

  /**
   * Get the median duration of all measurements
   */
  getMedian() {
    if (this.measurements.length === 0) return 0;
    const sorted = [...this.measurements].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Reset the timer
   */
  reset() {
    this.startTime = 0;
    this.endTime = 0;
    this.measurements = [];
    return this;
  }

  /**
   * Run a function and measure its execution time
   * @param {Function} fn - The function to measure
   * @param {number} iterations - Number of iterations to run
   * @returns {Object} Measurement results
   */
  async measure(fn, iterations = 1) {
    this.reset();
    
    for (let i = 0; i < iterations; i++) {
      this.start();
      if (fn.constructor.name === 'AsyncFunction') {
        await fn();
      } else {
        fn();
      }
      this.stop();
    }
    
    return {
      name: this.name,
      iterations,
      average: this.getAverage(),
      median: this.getMedian(),
      min: Math.min(...this.measurements),
      max: Math.max(...this.measurements),
      measurements: this.measurements
    };
  }
}

/**
 * Create a performance report
 * @param {Array} results - Array of measurement results
 * @param {string} outputPath - Path to save the report
 */
function createReport(results, outputPath) {
  const report = {
    timestamp: new Date().toISOString(),
    results
  };
  
  // Print to console
  console.log(chalk.bold.blue('\n=== Performance Test Results ==='));
  results.forEach(result => {
    console.log(chalk.bold(`\n${result.name} (${result.iterations} iterations):`));
    console.log(chalk.green(`  Average: ${result.average.toFixed(2)}ms`));
    console.log(chalk.yellow(`  Median: ${result.median.toFixed(2)}ms`));
    console.log(chalk.red(`  Min/Max: ${result.min.toFixed(2)}ms / ${result.max.toFixed(2)}ms`));
  });
  
  // Save to file
  if (outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(chalk.blue(`\nReport saved to: ${outputPath}`));
  }
  
  return report;
}

/**
 * Load a file as an ArrayBuffer
 * @param {string} filePath - Path to the file
 * @returns {Promise<ArrayBuffer>} The file as an ArrayBuffer
 */
async function loadFileAsArrayBuffer(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data.buffer);
    });
  });
}

/**
 * Get the size of a file in bytes
 * @param {string} filePath - Path to the file
 * @returns {number} Size in bytes
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

module.exports = {
  PerformanceTimer,
  createReport,
  loadFileAsArrayBuffer,
  getFileSize
};
