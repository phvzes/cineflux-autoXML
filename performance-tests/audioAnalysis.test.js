
const fs = require('fs');
const path = require('path');
const { PerformanceTimer, createReport, loadFileAsArrayBuffer } = require('./perf-helpers');

describe('Audio Analysis Performance', () => {
  const ITERATIONS = 3;
  const REPORT_PATH = path.join(__dirname, 'reports', 'audio-analysis-report.json');
  const AUDIO_FILE_PATH = path.join(__dirname, 'test-assets', 'sample.wav');
  let results = [];
  let audioBuffer;

  beforeAll(async () => {
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Load audio file
    try {
      const arrayBuffer = await loadFileAsArrayBuffer(AUDIO_FILE_PATH);
      
      // Mock audio decoding
      audioBuffer = {
        duration: 5,
        length: 220500,
        numberOfChannels: 1,
        sampleRate: 44100,
        getChannelData: () => new Float32Array(220500).fill(0.5)
      };
    } catch (error) {
      console.error('Error loading audio file:', error);
      // Create a mock audio buffer if file loading fails
      audioBuffer = {
        duration: 5,
        length: 220500,
        numberOfChannels: 1,
        sampleRate: 44100,
        getChannelData: () => new Float32Array(220500).fill(0.5)
      };
    }
  });

  test('Beat detection performance', async () => {
    const timer = new PerformanceTimer('Beat Detection');
    
    const detectBeats = () => {
      const channelData = audioBuffer.getChannelData(0);
      const bufferSize = 1024;
      const beats = [];
      
      // Simple beat detection algorithm (for testing purposes)
      for (let i = 0; i < channelData.length - bufferSize; i += bufferSize) {
        let sum = 0;
        for (let j = 0; j < bufferSize; j++) {
          sum += Math.abs(channelData[i + j]);
        }
        const average = sum / bufferSize;
        
        if (average > 0.2) { // Arbitrary threshold
          beats.push({
            time: i / audioBuffer.sampleRate,
            intensity: average
          });
        }
      }
      
      return beats;
    };
    
    const result = await timer.measure(detectBeats, ITERATIONS);
    results.push(result);
    
    console.log(`Beat detection average time: ${result.average.toFixed(2)}ms`);
    
    // Assert that processing time is within acceptable range
    expect(result.average).toBeLessThan(1000);
  });

  test('Waveform generation performance', async () => {
    const timer = new PerformanceTimer('Waveform Generation');
    
    const generateWaveform = () => {
      const channelData = audioBuffer.getChannelData(0);
      const numberOfPoints = 1000; // Number of points in the waveform visualization
      const waveform = [];
      
      const blockSize = Math.floor(channelData.length / numberOfPoints);
      
      for (let i = 0; i < numberOfPoints; i++) {
        const startIndex = i * blockSize;
        let sum = 0;
        
        for (let j = 0; j < blockSize; j++) {
          if (startIndex + j < channelData.length) {
            sum += Math.abs(channelData[startIndex + j]);
          }
        }
        
        waveform.push(sum / blockSize);
      }
      
      return waveform;
    };
    
    const result = await timer.measure(generateWaveform, ITERATIONS);
    results.push(result);
    
    console.log(`Waveform generation average time: ${result.average.toFixed(2)}ms`);
    
    // Assert that processing time is within acceptable range
    expect(result.average).toBeLessThan(500);
  });

  test('Frequency analysis performance', async () => {
    const timer = new PerformanceTimer('Frequency Analysis');
    
    const analyzeFrequency = () => {
      const channelData = audioBuffer.getChannelData(0);
      const fftSize = 2048;
      const frequencies = [];
      
      // Mock FFT calculation (for testing purposes)
      // In a real implementation, this would use Web Audio API's AnalyserNode
      for (let i = 0; i < channelData.length - fftSize; i += fftSize) {
        let sum = 0;
        for (let j = 0; j < fftSize; j++) {
          sum += Math.abs(channelData[i + j]);
        }
        
        frequencies.push(sum / fftSize);
      }
      
      return frequencies;
    };
    
    const result = await timer.measure(analyzeFrequency, ITERATIONS);
    results.push(result);
    
    console.log(`Frequency analysis average time: ${result.average.toFixed(2)}ms`);
    
    // Assert that processing time is within acceptable range
    expect(result.average).toBeLessThan(800);
  });

  afterAll(() => {
    // Create a performance report
    createReport(results, REPORT_PATH);
  });
});
