/**
 * AudioService.comprehensive.test.ts
 * Comprehensive tests for the AudioService class
 */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AudioService } from '../AudioService';
import { 
  AudioAnalysis, 
  AudioProcessingOptions, 
  Beat, 
  BeatAnalysis, 
  EnergySample, 
  EnergyAnalysis,
  AudioSegment,
  WaveformData
} from '../../types/audio-types';
import { createMockAudioFile, createMockAudioBuffer, createMockAudioAnalysis } from '../../utils/test/test-utils';

// Mock the errorHandler
jest.mock('../../utils/errorHandler', () => {
  return {
    __esModule: true,
    ErrorType: {
      AUDIO_PROCESSING: 'AUDIO_PROCESSING',
      NETWORK: 'NETWORK',
      VALIDATION: 'VALIDATION',
      INTERNAL: 'INTERNAL'
    },
    ErrorSeverity: {
      INFO: 'INFO',
      WARNING: 'WARNING',
      ERROR: 'ERROR',
      CRITICAL: 'CRITICAL'
    },
    errorHandler: {
      handle: jest.fn(),
      log: jest.fn()
    }
  };
});

// Mock AudioContext
const mockDecodeAudioData = jest.fn();
const mockClose = jest.fn().mockResolvedValue(undefined);

// Mock global AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  decodeAudioData: mockDecodeAudioData,
  close: mockClose,
  createAnalyser: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    fftSize: 2048,
    getByteFrequencyData: jest.fn(),
    getFloatTimeDomainData: jest.fn()
  }),
  createGain: jest.fn().mockReturnValue({
    gain: { value: 1 },
    connect: jest.fn(),
    disconnect: jest.fn()
  }),
  state: 'running'
}));

// Mock webkitAudioContext for Safari support
(global as any).webkitAudioContext = jest.fn().mockImplementation(() => ({
  decodeAudioData: mockDecodeAudioData,
  close: mockClose
}));

// Setup global fetch mock
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    body: {
      getReader: () => ({
        read: jest.fn().mockResolvedValueOnce({
          done: false,
          value: new Uint8Array(500000)
        }).mockResolvedValueOnce({
          done: true,
          value: undefined
        })
      })
    },
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1000))
  } as unknown as Response)
);

describe('AudioService Comprehensive Tests', () => {
  let audioService: AudioService;
  let progressCallback: (progress: number, step?: string) => void;

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Setup default mock behavior for decodeAudioData
    mockDecodeAudioData.mockImplementation((arrayBuffer, successCallback) => {
      const mockBuffer = createMockAudioBuffer();
      successCallback(mockBuffer);
      return Promise.resolve(mockBuffer);
    });
    
    // Create a new instance of AudioService
    audioService = new AudioService();
    
    // Create a progress callback
    progressCallback = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('loadAudio', () => {
    it('should load audio from a File object', async () => {
      // Create a mock audio file
      const mockFile = createMockAudioFile();
      
      // Call the loadAudio method
      const result = await AudioService.loadAudio(mockFile, progressCallback);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.duration).toBe(120);
      expect(result.numberOfChannels).toBe(2);
      expect(result.sampleRate).toBe(44100);
      
      // Verify that the AudioContext was created
      expect(global.AudioContext).toHaveBeenCalled();
      
      // Verify that decodeAudioData was called
      expect(mockDecodeAudioData).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });

    it('should load audio from a URL', async () => {
      // Call the loadAudio method with a URL
      const result = await AudioService.loadAudio('https://example.com/audio.mp3', progressCallback);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.duration).toBe(120);
      expect(result.numberOfChannels).toBe(2);
      expect(result.sampleRate).toBe(44100);
      
      // Verify that fetch was called
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/audio.mp3');
      
      // Verify that decodeAudioData was called
      expect(mockDecodeAudioData).toHaveBeenCalled();
    });
  });

  describe('analyzeAudio', () => {
    it('should analyze audio file and return comprehensive results', async () => {
      // Create a mock audio file
      const mockFile = createMockAudioFile();
      
      // Create a mock audio buffer
      const mockAudioBuffer = createMockAudioBuffer();
      
      // Create mock analysis results
      const mockWaveform: WaveformData = {
        data: Array.from({ length: 1000 }, (_, i) => Math.sin(i * 0.01)),
        sampleRate: 44100,
        channels: 2,
        duration: 120
      };
      
      const mockBeatAnalysis: BeatAnalysis = {
        beats: Array.from({ length: 240 }, (_, i) => ({ 
          time: i * 0.5, 
          confidence: 0.9, 
          energy: 0.8 
        }))
      };
      
      const mockEnergyAnalysis: EnergyAnalysis = {
        samples: Array.from({ length: 100 }, (_, i) => ({ 
          time: i * 1.2, 
          value: 0.7, 
          level: 0.7 
        })),
        averageEnergy: 0.7
      };
      
      const mockTempo = {
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        confidence: 0.95,
        isStable: true
      };
      
      const mockSections = {
        sections: Array.from({ length: 3 }, (_, i) => ({
          startTime: i * 40,
          endTime: (i + 1) * 40,
          duration: 40,
          energy: 0.7,
          tempo: 120
        }))
      };
      
      // Setup mocks
      AudioService.loadAudio = jest.fn().mockResolvedValue(mockAudioBuffer);
      AudioService.extractWaveform = jest.fn().mockResolvedValue(mockWaveform);
      AudioService.detectBeats = jest.fn().mockResolvedValue(mockBeatAnalysis);
      AudioService.analyzeEnergy = jest.fn().mockResolvedValue(mockEnergyAnalysis);
      AudioService.estimateTempo = jest.fn().mockResolvedValue(mockTempo);
      AudioService.detectSections = jest.fn().mockResolvedValue(mockSections);
      
      // Call the analyzeAudio method
      try {
        const result = await AudioService.analyzeAudio(mockFile, progressCallback);
        
        // Verify the result
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.duration).toBe(mockAudioBuffer.duration);
        expect(result.sampleRate).toBe(mockAudioBuffer.sampleRate);
        expect(result.channels).toBe(mockAudioBuffer.numberOfChannels);
        expect(result.beats).toBeInstanceOf(Array);
        expect(result.tempo).toBe(mockTempo.bpm);
        expect(result.segments).toBeInstanceOf(Array);
        expect(result.metadata).toBeDefined();
        expect(result.metadata.title).toBe(mockFile.name);
        
        // Verify that the individual analysis methods were called
        expect(AudioService.loadAudio).toHaveBeenCalledWith(mockFile, expect.any(Function));
        expect(AudioService.extractWaveform).toHaveBeenCalledWith(mockAudioBuffer, expect.any(Function));
        expect(AudioService.detectBeats).toHaveBeenCalledWith(mockAudioBuffer, expect.any(Function));
        expect(AudioService.analyzeEnergy).toHaveBeenCalledWith(mockAudioBuffer, expect.any(Function));
        expect(AudioService.estimateTempo).toHaveBeenCalledWith(mockBeatAnalysis.beats, mockAudioBuffer.duration);
        expect(AudioService.detectSections).toHaveBeenCalledWith(mockEnergyAnalysis, mockBeatAnalysis, mockAudioBuffer.duration);
      } catch (error) {
        fail(`Test failed with error: ${error.message}`);
      }
    });
  });

  describe('detectBeats', () => {
    it('should detect beats in an AudioBuffer', async () => {
      // Create a mock audio buffer
      const mockBuffer = createMockAudioBuffer();
      
      // Call the detectBeats method
      const result = await AudioService.detectBeats(mockBuffer, progressCallback);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.beats).toBeInstanceOf(Array);
      expect(result.beats.length).toBeGreaterThan(0);
      
      // Verify that each beat has the required properties
      result.beats.forEach(beat => {
        expect(beat.time).toBeGreaterThanOrEqual(0);
        expect(beat.confidence).toBeGreaterThanOrEqual(0);
        expect(beat.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('analyzeEnergy', () => {
    it('should analyze energy in an AudioBuffer', async () => {
      // Create a mock audio buffer
      const mockBuffer = createMockAudioBuffer();
      
      // Call the analyzeEnergy method
      const result = await AudioService.analyzeEnergy(mockBuffer, progressCallback);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.samples).toBeInstanceOf(Array);
      expect(result.samples.length).toBeGreaterThan(0);
      expect(result.averageEnergy).toBeGreaterThanOrEqual(0);
      expect(result.averageEnergy).toBeLessThanOrEqual(1);
      
      // Verify that each energy sample has the required properties
      result.samples.forEach(sample => {
        expect(sample.time).toBeGreaterThanOrEqual(0);
        expect(sample.value).toBeGreaterThanOrEqual(0);
        expect(sample.value).toBeLessThanOrEqual(1);
        expect(sample.level).toBeGreaterThanOrEqual(0);
        expect(sample.level).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('estimateTempo', () => {
    it('should estimate tempo from regular beats', () => {
      // Create mock beat data
      const beats: Beat[] = [];
      for (let i = 0; i < 20; i++) {
        beats.push({
          time: i * 0.5, // 120 BPM = 0.5s between beats
          confidence: 0.9,
          energy: 0.8
        });
      }
      
      // Call the estimateTempo method
      const result = AudioService.estimateTempo(beats, 10);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.bpm).toBeCloseTo(120, 0); // Allow some margin of error
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.isStable).toBe(true);
    });
  });

  describe('detectSections', () => {
    it('should detect sections based on energy and beats', () => {
      // Create mock energy analysis
      const energyAnalysis: EnergyAnalysis = {
        samples: Array.from({ length: 100 }, (_, i) => ({
          time: i * 1.2,
          value: 0.5 + Math.sin(i * 0.1) * 0.3, // Create some variation
          level: 0.5 + Math.sin(i * 0.1) * 0.3
        })),
        averageEnergy: 0.5
      };
      
      // Create mock beat analysis
      const beatAnalysis: BeatAnalysis = {
        beats: Array.from({ length: 240 }, (_, i) => ({
          time: i * 0.5,
          confidence: 0.9,
          energy: 0.8
        }))
      };
      
      // Call the detectSections method
      const result = AudioService.detectSections(energyAnalysis, beatAnalysis, 120);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.sections).toBeInstanceOf(Array);
      expect(result.sections.length).toBeGreaterThan(0);
      
      // Verify that each section has the required properties
      result.sections.forEach(section => {
        expect(section.startTime).toBeGreaterThanOrEqual(0);
        expect(section.endTime).toBeLessThanOrEqual(120);
        expect(section.duration).toBeGreaterThan(0);
        expect(section.energy).toBeGreaterThanOrEqual(0);
        expect(section.energy).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('error handling', () => {
    it('should handle errors during audio loading', async () => {
      // Setup decodeAudioData to throw an error
      mockDecodeAudioData.mockImplementation((arrayBuffer, successCallback, errorCallback) => {
        if (errorCallback) {
          errorCallback(new Error('Failed to decode audio data'));
        }
        return Promise.reject(new Error('Failed to decode audio data'));
      });
      
      // Mock fetch to return an error response
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: () => Promise.resolve('Not Found')
        } as unknown as Response)
      );
      
      // Call the loadAudio method with a URL and expect it to throw an error
      await expect(AudioService.loadAudio('https://example.com/not-found.mp3', progressCallback))
        .rejects.toThrow();
    });

    it('should handle errors during audio analysis', async () => {
      // Create a mock audio file
      const mockFile = createMockAudioFile();
      
      // Mock loadAudio to throw an error
      AudioService.loadAudio = jest.fn().mockRejectedValue(
        new Error('Failed to load audio file')
      );
      
      // Call the analyzeAudio method and expect it to throw an error
      await expect(AudioService.analyzeAudio(mockFile, progressCallback)).rejects.toThrow(Error);
      
      try {
        await AudioService.analyzeAudio(mockFile, progressCallback);
      } catch (error) {
        expect(error.message).toBe('Failed to load audio file');
      }
    });

    it('should handle errors during BPM extraction', async () => {
      // Create a mock audio file
      const mockFile = createMockAudioFile();
      
      // Mock loadAudio to throw an error
      AudioService.loadAudio = jest.fn().mockRejectedValue(
        new Error('Failed to load audio file')
      );
      
      // Call the extractBPM method
      const result = await AudioService.extractBPM(mockFile);
      
      // Verify the result contains default values
      expect(result).toBeDefined();
      expect(result.bpm).toBe(0);
      expect(result.confidence).toBe(0);
      expect(result.isStable).toBe(false);
    });

    it('should handle errors during waveform creation', async () => {
      // Create a mock audio file
      const mockFile = createMockAudioFile();
      
      // Mock loadAudio to throw an error
      AudioService.loadAudio = jest.fn().mockRejectedValue(
        new Error('Failed to load audio file')
      );
      
      // Call the createWaveform method
      const result = await AudioService.createWaveform(mockFile, 100, 50);
      
      // Verify the result contains default values
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBe(0);
      expect(result.sampleRate).toBe(44100);
      expect(result.channels).toBe(0);
      expect(result.duration).toBe(0);
    });
  });

  describe('analyzeAudio with options', () => {
    it('should analyze audio with custom options', async () => {
      // Create a mock audio file
      const mockFile = createMockAudioFile();
      
      // Create a mock audio buffer
      const mockAudioBuffer = createMockAudioBuffer();
      
      // Create mock analysis results
      const mockWaveform = {
        data: Array.from({ length: 1000 }, (_, i) => Math.sin(i * 0.01)),
        sampleRate: 44100,
        channels: 2,
        duration: 120
      };
      
      const mockBeatAnalysis = {
        beats: Array.from({ length: 240 }, (_, i) => ({ 
          time: i * 0.5, 
          confidence: 0.9, 
          energy: 0.8 
        }))
      };
      
      const mockEnergyAnalysis = {
        samples: Array.from({ length: 100 }, (_, i) => ({ 
          time: i * 1.2, 
          value: 0.7, 
          level: 0.7 
        })),
        averageEnergy: 0.7
      };
      
      const mockTempo = {
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        confidence: 0.95,
        isStable: true
      };
      
      const mockSections = {
        sections: Array.from({ length: 3 }, (_, i) => ({
          startTime: i * 40,
          endTime: (i + 1) * 40,
          duration: 40,
          energy: 0.7,
          tempo: 120
        }))
      };
      
      // Setup mocks
      AudioService.loadAudio = jest.fn().mockResolvedValue(mockAudioBuffer);
      AudioService.extractWaveform = jest.fn().mockResolvedValue(mockWaveform);
      AudioService.detectBeats = jest.fn().mockResolvedValue(mockBeatAnalysis);
      AudioService.analyzeEnergy = jest.fn().mockResolvedValue(mockEnergyAnalysis);
      AudioService.estimateTempo = jest.fn().mockResolvedValue(mockTempo);
      AudioService.detectSections = jest.fn().mockResolvedValue(mockSections);
      
      // Define custom options
      const options: AudioProcessingOptions = {
        sampleRate: 48000,
        channels: 1,
        duration: 60,
        startTime: 10,
        normalize: true,
        windowSize: 2048,
        hopSize: 512,
        minFrequency: 20,
        maxFrequency: 20000
      };
      
      // Call the analyzeAudio method with options
      const result = await AudioService.analyzeAudio(mockFile, progressCallback, options);
      
      // Verify the result
      expect(result).toBeDefined();
    });
  });
});
