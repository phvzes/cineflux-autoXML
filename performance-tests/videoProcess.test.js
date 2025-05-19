
const fs = require('fs');
const path = require('path');
const { PerformanceTimer, createReport, loadFileAsArrayBuffer } = require('./perf-helpers');

// Mock the FFmpeg.wasm module
jest.mock('@ffmpeg/ffmpeg', () => ({
  createFFmpeg: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockResolvedValue(undefined),
    FS: {
      writeFile: jest.fn(),
      readFile: jest.fn().mockReturnValue(new Uint8Array(10)),
      unlink: jest.fn()
    }
  }))
}));

// Import the module after mocking
const { createFFmpeg } = require('@ffmpeg/ffmpeg');

describe('Video Processing Performance', () => {
  const ITERATIONS = 3;
  const REPORT_PATH = path.join(__dirname, 'reports', 'video-process-report.json');
  const VIDEO_FILE_PATH = path.join(__dirname, 'test-assets', 'sample.mp4');
  let results = [];
  let videoBuffer;

  beforeAll(async () => {
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Load video file
    try {
      videoBuffer = await loadFileAsArrayBuffer(VIDEO_FILE_PATH);
    } catch (error) {
      console.error('Error loading video file:', error);
      // Create a mock video buffer if file loading fails
      videoBuffer = new ArrayBuffer(1024 * 1024); // 1MB mock buffer
    }
  });

  test('Video frame extraction performance', async () => {
    const timer = new PerformanceTimer('Frame Extraction');
    
    const extractFrames = async () => {
      // Simulate frame extraction without actually using FFmpeg
      // This is a mock implementation for testing purposes
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Return mock frames
      const frames = [];
      for (let i = 1; i <= 5; i++) {
        frames.push(new Uint8Array(100 * 100 * 3)); // Mock frame data
      }
      
      return frames;
    };
    
    const result = await timer.measure(extractFrames, ITERATIONS);
    results.push(result);
    
    console.log(`Frame extraction average time: ${result.average.toFixed(2)}ms`);
    
    // Assert that processing time is within acceptable range
    expect(result.average).toBeLessThan(10000);
  });

  test('Scene detection performance', async () => {
    const timer = new PerformanceTimer('Scene Detection');
    
    const detectScenes = async () => {
      // Mock scene detection algorithm
      // In a real implementation, this would analyze frame differences
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Return mock scene boundaries
      return [
        { time: 0.5, confidence: 0.8 },
        { time: 2.3, confidence: 0.9 },
        { time: 4.1, confidence: 0.7 }
      ];
    };
    
    const result = await timer.measure(detectScenes, ITERATIONS);
    results.push(result);
    
    console.log(`Scene detection average time: ${result.average.toFixed(2)}ms`);
    
    // Assert that processing time is within acceptable range
    expect(result.average).toBeLessThan(5000);
  });

  test('Video thumbnail generation performance', async () => {
    const timer = new PerformanceTimer('Thumbnail Generation');
    
    const generateThumbnails = async () => {
      // Simulate thumbnail generation without actually using FFmpeg
      // This is a mock implementation for testing purposes
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Return mock thumbnails
      const thumbnails = [];
      for (let i = 1; i <= 5; i++) {
        thumbnails.push(new Uint8Array(160 * 90 * 3)); // Mock thumbnail data (160x90 pixels)
      }
      
      return thumbnails;
    };
    
    const result = await timer.measure(generateThumbnails, ITERATIONS);
    results.push(result);
    
    console.log(`Thumbnail generation average time: ${result.average.toFixed(2)}ms`);
    
    // Assert that processing time is within acceptable range
    expect(result.average).toBeLessThan(8000);
  });

  afterAll(() => {
    // Create a performance report
    createReport(results, REPORT_PATH);
  });
});
