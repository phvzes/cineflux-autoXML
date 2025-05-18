/**
 * AudioService.test.ts
 * Tests for the AudioService class
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioService } from '../AudioService';
import { 
  AudioAnalysis, 
  AudioProcessingOptions, 
  Beat, 
  BeatAnalysis, 
  EnergySample, 
  EnergyAnalysis,
  WaveformData
} from '../../types/audio-types';
import { createMockAudioFile, createMockAudioBuffer, MockFile } from '../../utils/test/test-utils';

// Mock AudioContext decodeAudioData function
const mockDecodeAudioData = (
  arrayBuffer: ArrayBuffer, 
  onSuccess: (buffer: AudioBuffer) => void
) => {
  // Simulate successful decoding with a mock AudioBuffer
  onSuccess(mockAudioBuffer);
  return Promise.resolve(mockAudioBuffer);
};

// Create a mock AudioBuffer for testing
const mockAudioBuffer: AudioBuffer = {
  duration: 120, // 2 minutes
  numberOfChannels: 2,
  sampleRate: 44100,
  length: 44100 * 120,
  getChannelData: (channel: number) => {
    // Return a mock channel data array with sine wave data
    const data = new Float32Array(44100 * 120);
    for (let i = 0; i < data.length; i++) {
      // Create a simple sine wave pattern
      data[i] = Math.sin(i * 0.01) * 0.5;
      
      // Add some beats every 0.5 seconds (120 BPM)
      if (i % 22050 === 0) {
        data[i] = 0.9; // Higher amplitude for beats
      }
    }
    return data;
  },
  copyFromChannel: vi.fn(),
  copyToChannel: vi.fn()
} as unknown as AudioBuffer;

// Mock fetch response for URL-based audio loading
const mockFetchResponse = {
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: new Headers(),
  body: {
    getReader: () => ({
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: new Uint8Array(500000) })
        .mockResolvedValueOnce({ done: false, value: new Uint8Array(500000) })
        .mockResolvedValueOnce({ done: true })
    })
  },
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1000000)),
  json: vi.fn(),
  text: vi.fn()
} as unknown as Response;

// Mock File class for testing
class MockFile {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;

  constructor(name: string, type: string, size: number) {
    this.name = name;
    this.type = type;
    this.size = size;
    this.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(size));
  }
}

describe('AudioService', () => {
  let audioService: AudioService;
  let progressCallback: (progress: number, step?: string) => void;

  beforeEach(() => {
    // Setup global mocks
    global.AudioContext = vi.fn().mockImplementation(() => ({
      decodeAudioData: mockDecodeAudioData,
      close: vi.fn().mockResolvedValue(undefined)
    })) as unknown as typeof AudioContext;

    // Create a new instance of AudioService
    audioService = new AudioService();

    // Create a progress callback
    progressCallback = vi.fn();

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue(mockFetchResponse);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('loadAudio', () => {
    it('should load audio from a File object', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000);
      
      // Mock the arrayBuffer method
      mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(1000000));
      
      // Call the loadAudio method
      const result = await AudioService.loadAudio(mockFile as unknown as File, progressCallback);
      
      // Verify the result
      expect(result).toBe(mockAudioBuffer);
      
      // Verify that the AudioContext was created
      expect(global.AudioContext).toHaveBeenCalled();
      
      // Verify that decodeAudioData was called
      expect(mockFile.arrayBuffer).toHaveBeenCalledTimes(1);
    });

    it('should load audio from a URL', async () => {
      // Call the loadAudio method with a URL
      const result = await AudioService.loadAudio('https://example.com/audio.mp3', progressCallback);
      
      // Verify the result
      expect(result).toBe(mockAudioBuffer);
      
      // Verify that fetch was called
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/audio.mp3');
    });

    it('should handle errors when loading audio', async () => {
      // Mock AudioContext to throw an error
      global.AudioContext = vi.fn().mockResolvedValue({
        decodeAudioData: vi.fn().mockRejectedValue(new Error('Failed to decode audio data'))
      }) as unknown as typeof AudioContext;
      
      // Create a mock error context
      const mockErrorContext = {
        decodeAudioData: vi.fn().mockRejectedValue(new Error('Failed to decode audio data')),
        close: vi.fn().mockResolvedValue(undefined)
      };
      
      // Override the AudioContext constructor
      global.AudioContext = vi.fn(() => mockErrorContext) as any;
      
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000);
      
      // Call the loadAudio method and expect it to throw an error
      await expect(AudioService.loadAudio(mockFile as unknown as File, progressCallback))
        .rejects.toThrow('Failed to decode audio data');
    });
  });

  describe('extractWaveform', () => {
    it('should extract waveform data from an AudioBuffer', async () => {
      // Call the extractWaveform method
      const result = await AudioService.extractWaveform(mockAudioBuffer, progressCallback);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.sampleRate).toBe(mockAudioBuffer.sampleRate);
      expect(result.channels).toBe(mockAudioBuffer.numberOfChannels);
      expect(result.duration).toBe(mockAudioBuffer.duration);
    });
  });

  describe('detectBeats', () => {
    it('should detect beats in an AudioBuffer', async () => {
      // Call the detectBeats method
      const result = await AudioService.detectBeats(mockAudioBuffer, progressCallback);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.beats).toBeInstanceOf(Array);
      expect(result.beats.length).toBeGreaterThan(0);
      
      // Our mock data has beats every 0.5 seconds, so we should have around 20 beats
      // for a 10-second segment (default analysis window)
      expect(result.beats.length).toBeGreaterThanOrEqual(10);
      
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
      // Call the analyzeEnergy method
      const result = await AudioService.analyzeEnergy(mockAudioBuffer, progressCallback);
      
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
      // Create mock beats with regular intervals (120 BPM = 0.5s between beats)
      const beats: Beat[] = [];
      for (let i = 0; i < 20; i++) {
        beats.push({
          time: i * 0.5,
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
      
      // Verify the tempo is stable (our mock data has perfectly regular beats)
      expect(result.isStable).toBe(true);
    });

    it('should estimate tempo from irregular beats', () => {
      // Create mock beats with varying intervals
      const beats: Beat[] = [];
      let time = 0;
      
      for (let i = 0; i < 20; i++) {
        // Add some randomness to the beat times
        const interval = 0.5 + (Math.random() * 0.1 - 0.05);
        time += interval;
        
        beats.push({
          time,
          confidence: 0.8,
          energy: 0.7
        });
      }
      
      // Call the estimateTempo method
      const result = AudioService.estimateTempo(beats, 10);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.bpm).toBeGreaterThan(100); // Should be around 120 BPM
      expect(result.bpm).toBeLessThan(140);
      expect(result.confidence).toBeLessThan(1); // Confidence should be lower for irregular beats
      
      // Verify the tempo is not perfectly stable
      expect(result.isStable).toBe(false);
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
        averageEnergy: 0.5,
        peakEnergy: 0.8,
        peakEnergyTime: 30,
        dynamicRange: 0.6
      };
      
      // Create mock beat analysis
      const beatAnalysis: BeatAnalysis = {
        beats: Array.from({ length: 240 }, (_, i) => ({
          time: i * 0.5,
          confidence: 0.9,
          energy: 0.8,
          isDownbeat: i % 4 === 0
        })),
        averageConfidence: 0.9,
        tempo: 120,
        tempoConfidence: 0.95,
        timeSignature: '4/4'
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

    it('should handle energy analysis with few samples', () => {
      // Create mock energy analysis with few samples
      const energyAnalysis: EnergyAnalysis = {
        samples: Array.from({ length: 5 }, (_, i) => ({
          time: i * 24,
          value: 0.5,
          level: 0.5
        })),
        averageEnergy: 0.5
      };
      
      // Create mock beat analysis
      const beatAnalysis: BeatAnalysis = {
        beats: Array.from({ length: 240 }, (_, i) => ({
          time: i * 0.5,
          confidence: 0.9,
          energy: 0.8
        })),
        tempo: 120
      };
      
      // Call the detectSections method
      const result = AudioService.detectSections(energyAnalysis, beatAnalysis, 120);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.sections).toBeInstanceOf(Array);
      expect(result.sections.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeAudio', () => {
    it('should analyze audio file and return comprehensive results', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000) as unknown as File;
      
      // Mock the individual analysis methods
      const loadAudioSpy = vi.spyOn(AudioService, 'loadAudio').mockResolvedValue(mockAudioBuffer);
      const extractWaveformSpy = vi.spyOn(AudioService, 'extractWaveform').mockResolvedValue({
        data: Array.from({ length: 1000 }, (_, i) => Math.sin(i * 0.01)),
        sampleRate: 44100,
        channels: 2,
        duration: 120
      } as WaveformData);
      const detectBeatsSpy = vi.spyOn(AudioService, 'detectBeats').mockResolvedValue({
        beats: Array.from({ length: 240 }, (_, i) => ({ time: i * 0.5, confidence: 0.9, energy: 0.8 }))
      } as BeatAnalysis);
      const analyzeEnergySpy = vi.spyOn(AudioService, 'analyzeEnergy').mockResolvedValue({
        samples: Array.from({ length: 100 }, (_, i) => ({ time: i * 1.2, value: 0.7, level: 0.7 })),
        averageEnergy: 0.7
      } as EnergyAnalysis);
      const estimateTempoSpy = vi.spyOn(AudioService, 'estimateTempo').mockResolvedValue({
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        confidence: 0.95,
        isStable: true
      });
      const detectSectionsSpy = vi.spyOn(AudioService, 'detectSections').mockResolvedValue({
        sections: Array.from({ length: 3 }, (_, i) => ({
          startTime: i * 40,
          endTime: (i + 1) * 40,
          duration: 40,
          energy: 0.7,
          tempo: 120
        }))
      });
      
      // Call the analyzeAudio method
      const result = await AudioService.analyzeAudio(mockFile, progressCallback);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.duration).toBe(mockAudioBuffer.duration);
      expect(result.sampleRate).toBe(mockAudioBuffer.sampleRate);
      expect(result.channels).toBe(mockAudioBuffer.numberOfChannels);
      expect(result.beats).toBeInstanceOf(Array);
      expect(result.tempo).toBe(120);
      expect(result.segments).toBeInstanceOf(Array);
      expect(result.energyPoints).toBeInstanceOf(Array);
      expect(result.averageEnergy).toBe(0.7);
      
      // Verify that the individual analysis methods were called
      expect(loadAudioSpy).toHaveBeenCalledWith(mockFile, expect.any(Function));
      expect(extractWaveformSpy).toHaveBeenCalledWith(mockAudioBuffer, expect.any(Function));
      expect(detectBeatsSpy).toHaveBeenCalledWith(mockAudioBuffer, expect.any(Function));
      expect(analyzeEnergySpy).toHaveBeenCalledWith(mockAudioBuffer, expect.any(Function));
      expect(estimateTempoSpy).toHaveBeenCalledWith(expect.any(Array), mockAudioBuffer.duration);
      expect(detectSectionsSpy).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), mockAudioBuffer.duration);
    });

    it('should handle errors during audio analysis', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000) as unknown as File;
      
      // Mock loadAudio to throw an error
      vi.spyOn(AudioService, 'loadAudio').mockRejectedValue(
        new Error('Failed to load audio file')
      );
      
      // Call the analyzeAudio method and expect it to throw an error
      await expect(AudioService.analyzeAudio(mockFile, vi.fn()))
        .rejects.toThrow('Failed to load audio file');
      
      // Verify that the error was logged
      try {
        await AudioService.analyzeAudio(mockFile, vi.fn());
      } catch (error) {
        expect(error.message).toBe('Failed to load audio file');
      }
    });
  });

  describe('extractBPM', () => {
    it('should extract BPM from an audio file', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000) as unknown as File;
      
      // Mock the required methods
      vi.spyOn(AudioService, 'loadAudio').mockResolvedValue(mockAudioBuffer);
      vi.spyOn(AudioService, 'detectBeats').mockResolvedValue({
        beats: Array.from({ length: 240 }, (_, i) => ({ time: i * 0.5, confidence: 0.9, energy: 0.8 }))
      } as BeatAnalysis);
      vi.spyOn(AudioService, 'estimateTempo').mockResolvedValue({
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        confidence: 0.95,
        isStable: true
      });
      
      // Call the extractBPM method
      const result = await AudioService.extractBPM(mockFile);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.bpm).toBe(120);
      expect(result.confidence).toBe(0.95);
      expect(result.isStable).toBe(true);
    });

    it('should handle errors during BPM extraction', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000) as unknown as File;
      
      // Mock loadAudio to throw an error
      vi.spyOn(AudioService, 'loadAudio').mockRejectedValue(
        new Error('Failed to load audio file')
      );
      
      // Mock console.error to prevent actual logging
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the extractBPM method
      const result = await AudioService.extractBPM(mockFile);
      
      // Verify the result contains default values
      expect(result).toBeDefined();
      expect(result.bpm).toBe(0);
      expect(result.confidence).toBe(0);
      expect(result.isStable).toBe(false);
      
      // Verify that the error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('createWaveform', () => {
    it('should create a waveform from an audio file', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000) as unknown as File;
      
      // Mock the required methods
      vi.spyOn(AudioService, 'loadAudio').mockResolvedValue(mockAudioBuffer);
      vi.spyOn(AudioService, 'extractWaveform').mockResolvedValue({
        data: Array.from({ length: 1000 }, (_, i) => Math.sin(i * 0.01)),
        sampleRate: 44100,
        channels: 2,
        duration: 120,
        peaks: Array.from({ length: 500 }, (_, i) => Math.sin(i * 0.02)),
        rms: Array.from({ length: 500 }, (_, i) => Math.sin(i * 0.02) * 0.7)
      } as WaveformData);
      
      // Call the createWaveform method
      const result = await AudioService.createWaveform(mockFile, 500, 200);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBe(1000);
      expect(result.sampleRate).toBe(44100);
      expect(result.channels).toBe(2);
      expect(result.duration).toBe(120);
      expect(result.peaks).toBeInstanceOf(Array);
      expect(result.peaks.length).toBe(500);
      expect(result.rms).toBeInstanceOf(Array);
      expect(result.rms.length).toBe(500);
    });

    it('should handle errors during waveform creation', async () => {
      // Create a mock File
      const mockFile = new MockFile('test.mp3', 'audio/mp3', 1000000) as unknown as File;
      
      // Mock loadAudio to throw an error
      vi.spyOn(AudioService, 'loadAudio').mockRejectedValue(
        new Error('Failed to load audio file')
      );
      
      // Mock console.error to prevent actual logging
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the createWaveform method
      const result = await AudioService.createWaveform(mockFile, 500, 200);
      
      // Verify the result contains default values
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBe(0);
      expect(result.sampleRate).toBe(44100);
      expect(result.channels).toBe(0);
      expect(result.duration).toBe(0);
      
      // Verify that the error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
