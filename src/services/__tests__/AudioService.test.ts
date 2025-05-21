// src/services/__tests__/audioService.test.ts
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import AudioService, { AudioProcessingError } from '../AudioService';
import { AudioAnalysis, Beat, BeatAnalysis, EnergyAnalysis, EnergySample } from '../../types/AudioAnalysis';

// Create an instance of AudioService for testing
const audioService = new AudioService();

// Mock the Web Audio API
class MockAudioContext {
  state = 'running';
  
  constructor() {}
  
  decodeAudioData(buffer: ArrayBuffer, onSuccess: (buffer: AudioBuffer) => void, onError?: (error: Error) => void) {
    // Simulate successful decoding with a mock AudioBuffer
    onSuccess(mockAudioBuffer);
  }
  
  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

// Mock AudioBuffer
const mockAudioBuffer: AudioBuffer = {
  length: 48000 * 10, // 10 seconds of audio at 48kHz
  duration: 10, // 10 seconds
  sampleRate: 48000,
  numberOfChannels: 2,
  getChannelData: jest.fn((channel: any) => {
    // Return a mock channel data array with sine wave data
    const data = new Float32Array(48000 * 10);
    for (let i = 0; i < data.length; i++) {
      // Generate a sine wave with some "beats" at regular intervals
      data[i] = Math.sin(i * 0.01) * 0.5;
      
      // Add "beats" every 0.5 seconds (24000 samples)
      if (i % 24000 < 1000) {
        data[i] *= 1.5; // Increase amplitude for beats
      }
    }
    return data;
  })
};

// Mock fetch response
const mockFetchResponse = {
  ok: true,
  headers: {
    get: jest.fn((name: any) => name === 'Content-Length' ? '1000000' : null)
  },
  body: {
    getReader: jest.fn(() => ({
      read: jest.fn()
        .mockResolvedValueOnce({ done: false, value: new Uint8Array(500000) })
        .mockResolvedValueOnce({ done: false, value: new Uint8Array(500000) })
        .mockResolvedValueOnce({ done: true })
    }))
  }
};

// Mock File
class MockFile {
  name: string;
  type: string;
  size: number;
  
  constructor(name: string, type: string, size: number) {
    this.name = name;
    this.type = type;
    this.size = size;
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  }
}

describe('AudioService', () => {
  // Setup global mocks
  beforeEach(() => {
    // Mock window.AudioContext
    global.AudioContext = MockAudioContext as any;
    (global as any).webkitAudioContext = MockAudioContext as any;
    
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue(mockFetchResponse);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('loadAudio', () => {
    it('should load audio from a File object', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000);
      
      // Mock the arrayBuffer method
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(1000000));
      
      // Create a progress callback spy
      const progressCallback = jest.fn();
      
      // Call loadAudio
      const result = await audioService.loadAudio(mockFile as unknown as File, progressCallback);
      
      // Verify the result
      expect(result).toBe(mockAudioBuffer);
      
      // Verify the progress callback was called
      expect(progressCallback).toHaveBeenCalledTimes(3); // Initial, loading, and complete
      expect(progressCallback).toHaveBeenCalledWith(0, 'Initializing audio context...');
      expect(progressCallback).toHaveBeenCalledWith(10, 'Reading audio file...');
      expect(progressCallback).toHaveBeenCalledWith(100, 'Audio loaded successfully');
      
      // Verify arrayBuffer was called
      expect(mockFile.arrayBuffer).toHaveBeenCalledTimes(1);
    });
    
    it('should load audio from a URL', async () => {
      // Create a progress callback spy
      const progressCallback = jest.fn();
      
      // Call loadAudio with a URL
      const result = await audioService.loadAudio('https://example.com/audio.mp3', progressCallback);
      
      // Verify the result
      expect(result).toBe(mockAudioBuffer);
      
      // Verify fetch was called with the correct URL
      expect(fetch).toHaveBeenCalledWith('https://example.com/audio.mp3');
      
      // Verify the progress callback was called
      expect(progressCallback).toHaveBeenCalledTimes(4); // Initial, fetching, decoding, and complete
      expect(progressCallback).toHaveBeenCalledWith(0, 'Initializing audio context...');
      expect(progressCallback).toHaveBeenCalledWith(10, 'Fetching audio file...');
      expect(progressCallback).toHaveBeenCalledWith(80, 'Decoding audio data...');
      expect(progressCallback).toHaveBeenCalledWith(100, 'Audio loaded successfully');
    });
    
    it('should handle fetch errors', async () => {
      // Mock fetch to return an error response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      });
      
      // Call loadAudio with a URL and expect it to throw
      await expect(audioService.loadAudio('https://example.com/not-found.mp3'))
        .rejects.toThrow(AudioProcessingError);
      
      // Verify the error has the correct code
      try {
        await audioService.loadAudio('https://example.com/not-found.mp3');
      } catch (error) {
        expect(error).toBeInstanceOf(AudioProcessingError);
        expect((error as AudioProcessingError).code).toBe('FETCH_ERROR');
        expect((error as AudioProcessingError).message).toContain('Not Found');
      }
    });
    
    it('should handle decoding errors', async () => {
      // Mock decodeAudioData to fail
      const mockErrorContext = {
        decodeAudioData: (buffer: ArrayBuffer, onSuccess: (buffer: AudioBuffer) => void, onError?: (error: Error) => void) => {
          if (onError) onError(new Error('Failed to decode audio data'));
        },
        close: () => Promise.resolve()
      };
      
      global.AudioContext = jest.fn(() => mockErrorContext) as any;
      
      // Call loadAudio and expect it to throw
      await expect(audioService.loadAudio('https://example.com/invalid-audio.mp3'))
        .rejects.toThrow(AudioProcessingError);
      
      // Verify the error has the correct code
      try {
        await audioService.loadAudio('https://example.com/invalid-audio.mp3');
      } catch (error) {
        expect(error).toBeInstanceOf(AudioProcessingError);
        expect((error as AudioProcessingError).code).toBe('DECODE_ERROR');
      }
    });
  });
  
  describe('extractWaveform', () => {
    it('should extract waveform data from an audio buffer', async () => {
      // Create a progress callback spy
      const progressCallback = jest.fn();
      
      // Call extractWaveform
      const result = await audioService.extractWaveform(mockAudioBuffer, progressCallback);
      
      // Verify the result structure
      expect(result).toHaveProperty('duration', 10);
      expect(result).toHaveProperty('sampleRate', 48000);
      expect(result).toHaveProperty('channels', 2);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('maxAmplitude');
      expect(result).toHaveProperty('minAmplitude');
      
      // Verify the data array has the expected length
      // We expect about 1000 samples for a 10-second audio file
      expect(result.data.length).toBeGreaterThanOrEqual(1000);
      
      // Verify the progress callback was called
      expect(progressCallback).toHaveBeenCalledTimes(11); // Once for each 10% increment
      expect(progressCallback).toHaveBeenLastCalledWith(100);
    });
  });
  
  describe('detectBeats', () => {
    it('should detect beats in an audio buffer', async () => {
      // Create a progress callback spy
      const progressCallback = jest.fn();
      
      // Call detectBeats
      const result = await audioService.detectBeats(mockAudioBuffer, progressCallback);
      
      // Verify the result structure
      expect(result).toHaveProperty('beats');
      expect(result).toHaveProperty('averageConfidence');
      
      // Verify the beats array contains beat objects
      expect(Array.isArray(result.beats)).toBe(true);
      
      // Our mock data has beats every 0.5 seconds, so we should have around 20 beats
      // But the algorithm might not detect all of them due to the threshold
      expect(result.beats.length).toBeGreaterThan(0);
      
      // Verify each beat has the expected properties
      if (result.beats.length > 0) {
        expect(result.beats[0]).toHaveProperty('time');
        expect(result.beats[0]).toHaveProperty('confidence');
        expect(typeof result.beats[0].time).toBe('number');
        expect(typeof result.beats[0].confidence).toBe('number');
      }
      
      // Verify the progress callback was called
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenLastCalledWith(100);
    });
  });
  
  describe('analyzeEnergy', () => {
    it('should analyze energy levels in an audio buffer', async () => {
      // Create a progress callback spy
      const progressCallback = jest.fn();
      
      // Call analyzeEnergy
      const result = await audioService.analyzeEnergy(mockAudioBuffer, progressCallback);
      
      // Verify the result structure
      expect(result).toHaveProperty('samples');
      expect(result).toHaveProperty('averageEnergy');
      expect(result).toHaveProperty('peakEnergy');
      expect(result).toHaveProperty('peakEnergyTime');
      
      // Verify the samples array contains energy samples
      expect(Array.isArray(result.samples)).toBe(true);
      expect(result.samples.length).toBeGreaterThan(0);
      
      // Verify each sample has the expected properties
      if (result.samples.length > 0) {
        expect(result.samples[0]).toHaveProperty('time');
        expect(result.samples[0]).toHaveProperty('level');
        expect(typeof result.samples[0].time).toBe('number');
        expect(typeof result.samples[0].level).toBe('number');
      }
      
      // Verify the progress callback was called
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenLastCalledWith(100);
    });
  });
  
  describe('estimateTempo', () => {
    it('should estimate tempo from beat data', async () => {
      // Create mock beats with regular intervals (120 BPM = 0.5s between beats)
      const beats: Beat[] = Array.from({ length: 20 }, (_: any, i: any) => ({
        time: i * 0.5,
        confidence: 0.8
      }));
      
      // Call estimateTempo
      const result = await audioService.estimateTempo(beats, 10);
      
      // Verify the result structure
      expect(result).toHaveProperty('bpm');
      expect(result).toHaveProperty('timeSignature');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('isStable');
      
      // Verify the BPM is close to 120
      expect(result.bpm).toBeCloseTo(120, 0);
      
      // Verify the time signature
      expect(result.timeSignature).toEqual({ numerator: 4, denominator: 4 });
      
      // Verify the tempo is stable (our mock data has perfectly regular beats)
      expect(result.isStable).toBe(true);
    });
    
    it('should handle insufficient beat data', async () => {
      // Call estimateTempo with too few beats
      const result = await audioService.estimateTempo([], 10);
      
      // Verify it returns a default tempo
      expect(result.bpm).toBe(120);
      expect(result.timeSignature).toEqual({ numerator: 4, denominator: 4 });
      expect(result.confidence).toBe(0.5);
      expect(result.isStable).toBe(true);
    });
    
    it('should detect tempo variations in unstable tempo', async () => {
      // Create mock beats with varying intervals
      const beats: Beat[] = [];
      
      // First 5 seconds: 120 BPM
      for (let i = 0; i < 10; i++) {
        beats.push({ time: i * 0.5, confidence: 0.8 });
      }
      
      // Next 5 seconds: 160 BPM
      for (let i = 0; i < 13; i++) {
        beats.push({ time: 5 + (i * 0.375), confidence: 0.8 });
      }
      
      // Call estimateTempo
      const result = await audioService.estimateTempo(beats, 10);
      
      // Verify the result has variations
      expect(result.isStable).toBe(false);
      expect(result.variations).toBeDefined();
      expect(Array.isArray(result.variations)).toBe(true);
      
      // Verify we have at least one variation
      if (result.variations && result.variations.length > 0) {
        expect(result.variations[0]).toHaveProperty('startTime');
        expect(result.variations[0]).toHaveProperty('bpm');
      }
    });
  });
  
  describe('detectSections', () => {
    it('should detect sections in the audio', async () => {
      // Create mock energy analysis
      const energyAnalysis: EnergyAnalysis = {
        samples: Array.from({ length: 100 }, (_: any, i: any) => ({
          time: i * 0.1,
          level: i < 50 ? 0.5 : 0.8 // Change in energy level at 5 seconds
        })),
        averageEnergy: 0.65,
        peakEnergy: 0.8,
        peakEnergyTime: 9.9
      };
      
      // Create mock beat analysis
      const beatAnalysis: BeatAnalysis = {
        beats: Array.from({ length: 20 }, (_: any, i: any) => ({
          time: i * 0.5,
          confidence: 0.8
        })),
        averageConfidence: 0.8
      };
      
      // Call detectSections
      const result = await audioService.detectSections(energyAnalysis, beatAnalysis, 10);
      
      // Verify the result structure
      expect(result).toHaveProperty('sections');
      expect(Array.isArray(result.sections)).toBe(true);
      
      // Verify we have at least one section
      expect(result.sections.length).toBeGreaterThan(0);
      
      // Verify each section has the expected properties
      if (result.sections.length > 0) {
        expect(result.sections[0]).toHaveProperty('start');
        expect(result.sections[0]).toHaveProperty('duration');
        expect(result.sections[0]).toHaveProperty('label');
        expect(result.sections[0]).toHaveProperty('confidence');
      }
    });
    
    it('should handle insufficient energy samples', async () => {
      // Create mock energy analysis with few samples
      const energyAnalysis: EnergyAnalysis = {
        samples: Array.from({ length: 5 }, (_: any, i: any) => ({
          time: i * 0.1,
          level: 0.5
        })),
        averageEnergy: 0.5,
        peakEnergy: 0.5,
        peakEnergyTime: 0.4
      };
      
      // Create mock beat analysis
      const beatAnalysis: BeatAnalysis = {
        beats: [],
        averageConfidence: 0
      };
      
      // Call detectSections
      const result = await audioService.detectSections(energyAnalysis, beatAnalysis, 10);
      
      // Verify it returns a single section
      expect(result.sections.length).toBe(1);
      expect(result.sections[0].start).toBe(0);
      expect(result.sections[0].duration).toBe(10);
      expect(result.sections[0].label).toBe('Section 1');
    });
  });
  
  describe('analyzeAudio', () => {
    it('should analyze an audio file and return complete analysis', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000) as unknown as File;
      
      // Create a progress callback spy
      const progressCallback = jest.fn();
      
      // Mock the individual analysis methods
      const loadAudioSpy = jest.spyOn(audioService, 'loadAudio').mockResolvedValue(mockAudioBuffer);
      const extractWaveformSpy = jest.spyOn(audioService, 'extractWaveform').mockResolvedValue({
        duration: 10,
        sampleRate: 48000,
        channels: 2,
        data: [0.5, 0.6, 0.7],
        maxAmplitude: 0.7,
        minAmplitude: 0.5
      });
      const detectBeatsSpy = jest.spyOn(audioService, 'detectBeats').mockResolvedValue({
        beats: [{ time: 1, confidence: 0.8 }, { time: 2, confidence: 0.9 }],
        averageConfidence: 0.85
      });
      const analyzeEnergySpy = jest.spyOn(audioService, 'analyzeEnergy').mockResolvedValue({
        samples: [{ time: 0, level: 0.5 }, { time: 1, level: 0.6 }],
        averageEnergy: 0.55,
        peakEnergy: 0.6,
        peakEnergyTime: 1
      });
      const estimateTempoSpy = jest.spyOn(audioService, 'estimateTempo').mockResolvedValue({
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        confidence: 0.9,
        isStable: true
      });
      const detectSectionsSpy = jest.spyOn(audioService, 'detectSections').mockResolvedValue({
        sections: [{ start: 0, duration: 10, label: 'Section 1', confidence: 0.8 }]
      });
      
      // Call analyzeAudio
      const result = await audioService.analyzeAudio(mockFile, progressCallback);
      
      // Verify the result structure
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('waveform');
      expect(result).toHaveProperty('beats');
      expect(result).toHaveProperty('tempo');
      expect(result).toHaveProperty('energy');
      expect(result).toHaveProperty('sections');
      
      // Verify metadata
      expect(result.metadata.title).toBe('test.mp3');
      expect(result.metadata.duration).toBe(10);
      expect(result.metadata.format).toBe('mp3');
      
      // Verify all analysis methods were called
      expect(loadAudioSpy).toHaveBeenCalled();
      expect(extractWaveformSpy).toHaveBeenCalled();
      expect(detectBeatsSpy).toHaveBeenCalled();
      expect(analyzeEnergySpy).toHaveBeenCalled();
      expect(estimateTempoSpy).toHaveBeenCalled();
      expect(detectSectionsSpy).toHaveBeenCalled();
      
      // Verify the progress callback was called multiple times
      expect(progressCallback).toHaveBeenCalledTimes(7); // Initial + each step + complete
      expect(progressCallback).toHaveBeenLastCalledWith(100, 'Analysis complete');
    });
    
    it('should handle errors during analysis', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000) as unknown as File;
      
      // Mock loadAudio to throw an error
      jest.spyOn(audioService, 'loadAudio').mockRejectedValue(
        new AudioProcessingError('Failed to load audio', 'LOAD_ERROR')
      );
      
      // Call analyzeAudio and expect it to throw
      await expect(audioService.analyzeAudio(mockFile, jest.fn()))
        .rejects.toThrow(AudioProcessingError);
      
      // Verify the error has the correct code
      try {
        await audioService.analyzeAudio(mockFile, jest.fn());
      } catch (error) {
        expect(error).toBeInstanceOf(AudioProcessingError);
        expect((error as AudioProcessingError).code).toBe('ANALYSIS_ERROR');
      }
    });
  });
  
  describe('extractBPM', () => {
    it('should extract BPM from an audio file', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000) as unknown as File;
      
      // Mock the individual analysis methods
      jest.spyOn(audioService, 'loadAudio').mockResolvedValue(mockAudioBuffer);
      jest.spyOn(audioService, 'detectBeats').mockResolvedValue({
        beats: [{ time: 1, confidence: 0.8 }, { time: 2, confidence: 0.9 }],
        averageConfidence: 0.85
      });
      jest.spyOn(audioService, 'estimateTempo').mockResolvedValue({
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        confidence: 0.9,
        isStable: true
      });
      
      // Call extractBPM
      const result = await audioService.extractBPM(mockFile);
      
      // Verify the result structure
      expect(result).toHaveProperty('bpm');
      expect(result).toHaveProperty('beats');
      
      // Verify the BPM value
      expect(result.bpm).toBe(120);
      
      // Verify the beats array
      expect(Array.isArray(result.beats)).toBe(true);
      expect(result.beats).toEqual([1, 2]);
    });
    
    it('should handle errors and return fallback values', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000) as unknown as File;
      
      // Mock loadAudio to throw an error
      jest.spyOn(audioService, 'loadAudio').mockRejectedValue(
        new AudioProcessingError('Failed to load audio', 'LOAD_ERROR')
      );
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call extractBPM
      const result = await audioService.extractBPM(mockFile);
      
      // Verify the result has fallback values
      expect(result.bpm).toBe(120);
      expect(Array.isArray(result.beats)).toBe(true);
      expect(result.beats.length).toBe(100);
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
  
  describe('createWaveform', () => {
    it('should create a waveform visualization for an audio file', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000) as unknown as File;
      
      // Mock the individual analysis methods
      jest.spyOn(audioService, 'loadAudio').mockResolvedValue(mockAudioBuffer);
      jest.spyOn(audioService, 'extractWaveform').mockResolvedValue({
        duration: 10,
        sampleRate: 48000,
        channels: 2,
        data: Array.from({ length: 1000 }, () => Math.random()),
        maxAmplitude: 1,
        minAmplitude: 0
      });
      
      // Call createWaveform
      const result = await audioService.createWaveform(mockFile, 500, 200);
      
      // Verify the result is an array of the correct length
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(500);
      
      // Verify the values are within the height range
      for (const value of result) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(200);
      }
    });
    
    it('should handle errors and return fallback waveform', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000) as unknown as File;
      
      // Mock loadAudio to throw an error
      jest.spyOn(audioService, 'loadAudio').mockRejectedValue(
        new AudioProcessingError('Failed to load audio', 'LOAD_ERROR')
      );
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call createWaveform
      const result = await audioService.createWaveform(mockFile, 500, 200);
      
      // Verify the result is a fallback waveform
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(500);
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
  
  describe('AudioProcessingError', () => {
    it('should create an error with the correct properties', () => {
      const error = new AudioProcessingError('Test error message', 'TEST_ERROR');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AudioProcessingError');
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_ERROR');
    });
  });
});
