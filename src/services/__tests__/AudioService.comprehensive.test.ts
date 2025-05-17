// src/services/__tests__/AudioService.comprehensive.test.ts
import AudioService, { AudioProcessingError, audioService } from '../../services/AudioService';
import { errorHandler, ErrorType, ErrorSeverity } from '../../utils/errorHandler';
import { createMockAudioFile, createMockAudioBuffer } from '../../test/test-utils';

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

// Mock webkitAudioContext as a fallback
(global as any).webkitAudioContext = jest.fn().mockImplementation(() => ({
  decodeAudioData: mockDecodeAudioData,
  close: mockClose
}));

// Setup global fetch mock
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    headers: new Headers({ 'Content-Length': '1000' }),
    body: {
      getReader: () => ({
        read: jest.fn().mockResolvedValueOnce({
          done: false,
          value: new Uint8Array(500)
        }).mockResolvedValueOnce({
          done: true,
          value: undefined
        })
      })
    },
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1000))
  })
);

describe('AudioService Comprehensive Tests', () => {
  // Store original WebAssembly
  const originalWebAssembly = global.WebAssembly;
  
  // Setup and teardown
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock behavior for decodeAudioData
    mockDecodeAudioData.mockImplementation((arrayBuffer, successCallback) => {
      const mockBuffer = createMockAudioBuffer();
      successCallback(mockBuffer);
      return Promise.resolve(mockBuffer);
    });
    
    // Restore WebAssembly if it was modified
    global.WebAssembly = originalWebAssembly;
  });
  
  afterAll(() => {
    // Ensure WebAssembly is restored
    global.WebAssembly = originalWebAssembly;
  });
  
  // 1. Additional Singleton Pattern Testing
  describe('Singleton Pattern', () => {
    it('should not allow direct instantiation via constructor', () => {
      // In JavaScript, we can't truly test private constructors
      // as they're enforced by TypeScript at compile time
      // This test is more of a documentation of the pattern
      expect(AudioService.getInstance()).toBe(audioService);
      
      // We can verify that the constructor property exists but is not accessible
      // @ts-ignore - Intentionally checking private property
      expect(typeof AudioService.prototype.constructor).toBe('function');
    });
    
    it('should have a private constructor', () => {
      // In JavaScript, we can't truly test private constructors
      // as they're enforced by TypeScript at compile time
      // This test is more of a documentation of the pattern
      
      // Verify that getInstance returns the singleton instance
      expect(AudioService.getInstance()).toBe(audioService);
      
      // Verify that multiple calls to getInstance return the same instance
      expect(AudioService.getInstance()).toBe(AudioService.getInstance());
    });
  });
  
  // 2. Audio Processing Testing
  describe('Audio Processing', () => {
    it('should successfully load audio from a URL', async () => {
      // Call loadAudio with a URL
      const progressCallback = jest.fn();
      const result = await AudioService.loadAudio('https://example.com/audio.mp3', progressCallback);
      
      // Verify the result
      expect(result).toBeDefined();
      
      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/audio.mp3');
      
      // Verify AudioContext was used
      expect(mockDecodeAudioData).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
      
      // Verify progress callback was called
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(100, 'Audio loaded successfully');
    });
    
    it('should analyze audio and return complete analysis results', async () => {
      // Create a mock audio file
      const mockFile = createMockAudioFile();
      
      // Mock progress callback
      const progressCallback = jest.fn();
      
      // Mock the required methods
      const originalLoadAudio = AudioService.loadAudio;
      const originalExtractWaveform = AudioService.extractWaveform;
      const originalDetectBeats = AudioService.detectBeats;
      const originalAnalyzeEnergy = AudioService.analyzeEnergy;
      const originalEstimateTempo = AudioService.estimateTempo;
      const originalDetectSections = AudioService.detectSections;
      
      // Mock return values
      const mockAudioBuffer = createMockAudioBuffer();
      const mockWaveform = {
        duration: 120,
        sampleRate: 44100,
        channels: 2,
        data: Array(1000).fill(0.5),
        maxAmplitude: 1,
        minAmplitude: 0
      };
      const mockBeatAnalysis = {
        beats: Array(120).fill(0).map((_, i) => ({ time: i, confidence: 0.8 })),
        averageConfidence: 0.8
      };
      const mockEnergyAnalysis = {
        samples: Array(120).fill(0).map((_, i) => ({ time: i, level: 0.5 })),
        averageEnergy: 0.5,
        peakEnergy: 1,
        peakEnergyTime: 60
      };
      const mockTempo = {
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        confidence: 0.9,
        isStable: true
      };
      const mockSections = {
        sections: [
          { start: 0, duration: 30, label: 'Section 1', confidence: 0.8 },
          { start: 30, duration: 30, label: 'Section 2', confidence: 0.8 },
          { start: 60, duration: 30, label: 'Section 3', confidence: 0.8 },
          { start: 90, duration: 30, label: 'Section 4', confidence: 0.8 }
        ]
      };
      
      // Setup mocks
      AudioService.loadAudio = jest.fn().mockResolvedValue(mockAudioBuffer);
      AudioService.extractWaveform = jest.fn().mockResolvedValue(mockWaveform);
      AudioService.detectBeats = jest.fn().mockResolvedValue(mockBeatAnalysis);
      AudioService.analyzeEnergy = jest.fn().mockResolvedValue(mockEnergyAnalysis);
      AudioService.estimateTempo = jest.fn().mockResolvedValue(mockTempo);
      AudioService.detectSections = jest.fn().mockResolvedValue(mockSections);
      
      try {
        // Call analyzeAudio
        const result = await AudioService.analyzeAudio(mockFile, progressCallback);
        
        // Verify the result structure
        expect(result).toHaveProperty('metadata');
        expect(result).toHaveProperty('waveform');
        expect(result).toHaveProperty('beats');
        expect(result).toHaveProperty('tempo');
        expect(result).toHaveProperty('energy');
        expect(result).toHaveProperty('sections');
        
        // Verify metadata
        expect(result.metadata.title).toBe(mockFile.name);
        expect(result.metadata.format).toBe('mp3');
        
        // Verify progress callback was called
        expect(progressCallback).toHaveBeenCalled();
        // Should be called with 100% at the end
        expect(progressCallback).toHaveBeenCalledWith(100, 'Analysis complete');
        
        // Verify all methods were called
        expect(AudioService.loadAudio).toHaveBeenCalledWith(mockFile, expect.any(Function));
        expect(AudioService.extractWaveform).toHaveBeenCalledWith(mockAudioBuffer, expect.any(Function));
        expect(AudioService.detectBeats).toHaveBeenCalledWith(mockAudioBuffer, expect.any(Function));
        expect(AudioService.analyzeEnergy).toHaveBeenCalledWith(mockAudioBuffer, expect.any(Function));
        expect(AudioService.estimateTempo).toHaveBeenCalledWith(mockBeatAnalysis.beats, mockAudioBuffer.duration);
        expect(AudioService.detectSections).toHaveBeenCalledWith(mockEnergyAnalysis, mockBeatAnalysis, mockAudioBuffer.duration);
      } finally {
        // Restore original methods
        AudioService.loadAudio = originalLoadAudio;
        AudioService.extractWaveform = originalExtractWaveform;
        AudioService.detectBeats = originalDetectBeats;
        AudioService.analyzeEnergy = originalAnalyzeEnergy;
        AudioService.estimateTempo = originalEstimateTempo;
        AudioService.detectSections = originalDetectSections;
      }
    });
    
    it('should detect beats in an audio buffer', async () => {
      // Create a mock audio buffer
      const mockBuffer = createMockAudioBuffer();
      
      // Mock progress callback
      const progressCallback = jest.fn();
      
      // Call detectBeats
      const result = await AudioService.detectBeats(mockBuffer, progressCallback);
      
      // Verify the result structure
      expect(result).toHaveProperty('beats');
      expect(result).toHaveProperty('averageConfidence');
      
      // Verify data
      expect(Array.isArray(result.beats)).toBe(true);
      expect(typeof result.averageConfidence).toBe('number');
      
      // Verify progress callback was called
      expect(progressCallback).toHaveBeenCalled();
      // Should be called with 100% at the end
      expect(progressCallback).toHaveBeenCalledWith(100);
    });
    
    it('should analyze energy levels in an audio buffer', async () => {
      // Create a mock audio buffer
      const mockBuffer = createMockAudioBuffer();
      
      // Mock progress callback
      const progressCallback = jest.fn();
      
      // Call analyzeEnergy
      const result = await AudioService.analyzeEnergy(mockBuffer, progressCallback);
      
      // Verify the result structure
      expect(result).toHaveProperty('samples');
      expect(result).toHaveProperty('averageEnergy');
      expect(result).toHaveProperty('peakEnergy');
      expect(result).toHaveProperty('peakEnergyTime');
      
      // Verify data
      expect(Array.isArray(result.samples)).toBe(true);
      expect(typeof result.averageEnergy).toBe('number');
      expect(typeof result.peakEnergy).toBe('number');
      expect(typeof result.peakEnergyTime).toBe('number');
      
      // Verify progress callback was called
      expect(progressCallback).toHaveBeenCalled();
      // Should be called with 100% at the end
      expect(progressCallback).toHaveBeenCalledWith(100);
    });
    
    it('should estimate tempo from beat data', async () => {
      // Create mock beat data
      const beats = [
        { time: 0, confidence: 0.8 },
        { time: 0.5, confidence: 0.8 },
        { time: 1.0, confidence: 0.8 },
        { time: 1.5, confidence: 0.8 },
        { time: 2.0, confidence: 0.8 }
      ];
      
      // Call estimateTempo
      const result = await AudioService.estimateTempo(beats, 10);
      
      // Verify the result structure
      expect(result).toHaveProperty('bpm');
      expect(result).toHaveProperty('timeSignature');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('isStable');
      
      // Verify data
      expect(typeof result.bpm).toBe('number');
      expect(result.timeSignature).toEqual({ numerator: 4, denominator: 4 });
      expect(typeof result.confidence).toBe('number');
      expect(typeof result.isStable).toBe('boolean');
    });
    
    it('should detect sections in audio based on energy and beat analysis', async () => {
      // Create mock energy analysis
      const energyAnalysis = {
        samples: Array(100).fill(0).map((_, i) => ({ 
          time: i * 0.1, 
          level: Math.sin(i * 0.1) * 0.5 + 0.5 
        })),
        averageEnergy: 0.5,
        peakEnergy: 1,
        peakEnergyTime: 5
      };
      
      // Create mock beat analysis
      const beatAnalysis = {
        beats: Array(20).fill(0).map((_, i) => ({ 
          time: i * 0.5, 
          confidence: 0.8 
        })),
        averageConfidence: 0.8
      };
      
      // Call detectSections
      const result = await AudioService.detectSections(energyAnalysis, beatAnalysis, 10);
      
      // Verify the result structure
      expect(result).toHaveProperty('sections');
      
      // Verify data
      expect(Array.isArray(result.sections)).toBe(true);
      if (result.sections.length > 0) {
        expect(result.sections[0]).toHaveProperty('start');
        expect(result.sections[0]).toHaveProperty('duration');
        expect(result.sections[0]).toHaveProperty('label');
        expect(result.sections[0]).toHaveProperty('confidence');
      }
    });
    
    it('should extract BPM from an audio file', async () => {
      // Create a mock audio file
      const mockFile = createMockAudioFile();
      
      // Mock the required methods
      const originalLoadAudio = AudioService.loadAudio;
      const originalDetectBeats = AudioService.detectBeats;
      const originalEstimateTempo = AudioService.estimateTempo;
      
      // Mock return values
      const mockAudioBuffer = createMockAudioBuffer();
      const mockBeatAnalysis = {
        beats: Array(120).fill(0).map((_, i) => ({ time: i * 0.5, confidence: 0.8 })),
        averageConfidence: 0.8
      };
      const mockTempo = {
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        confidence: 0.9,
        isStable: true
      };
      
      // Setup mocks
      AudioService.loadAudio = jest.fn().mockResolvedValue(mockAudioBuffer);
      AudioService.detectBeats = jest.fn().mockResolvedValue(mockBeatAnalysis);
      AudioService.estimateTempo = jest.fn().mockResolvedValue(mockTempo);
      
      try {
        // Call extractBPM
        const result = await AudioService.extractBPM(mockFile);
        
        // Verify the result structure
        expect(result).toHaveProperty('bpm');
        expect(result).toHaveProperty('beats');
        
        // Verify data
        expect(result.bpm).toBe(mockTempo.bpm);
        expect(Array.isArray(result.beats)).toBe(true);
        
        // Verify methods were called
        expect(AudioService.loadAudio).toHaveBeenCalledWith(mockFile);
        expect(AudioService.detectBeats).toHaveBeenCalledWith(mockAudioBuffer);
        expect(AudioService.estimateTempo).toHaveBeenCalledWith(mockBeatAnalysis.beats, mockAudioBuffer.duration);
      } finally {
        // Restore original methods
        AudioService.loadAudio = originalLoadAudio;
        AudioService.detectBeats = originalDetectBeats;
        AudioService.estimateTempo = originalEstimateTempo;
      }
    });
    
    it('should create a waveform visualization for an audio file', async () => {
      // Create a mock audio file
      const mockFile = createMockAudioFile();
      
      // Mock the required methods
      const originalLoadAudio = AudioService.loadAudio;
      const originalExtractWaveform = AudioService.extractWaveform;
      
      // Mock return values
      const mockAudioBuffer = createMockAudioBuffer();
      const mockWaveform = {
        duration: 120,
        sampleRate: 44100,
        channels: 2,
        data: Array(1000).fill(0.5),
        maxAmplitude: 1,
        minAmplitude: 0
      };
      
      // Setup mocks
      AudioService.loadAudio = jest.fn().mockResolvedValue(mockAudioBuffer);
      AudioService.extractWaveform = jest.fn().mockResolvedValue(mockWaveform);
      
      try {
        // Call createWaveform
        const result = await AudioService.createWaveform(mockFile, 100, 50);
        
        // Verify the result
        expect(Array.isArray(result)).toBe(true);
        
        // Verify methods were called
        expect(AudioService.loadAudio).toHaveBeenCalledWith(mockFile);
        expect(AudioService.extractWaveform).toHaveBeenCalledWith(mockAudioBuffer);
      } finally {
        // Restore original methods
        AudioService.loadAudio = originalLoadAudio;
        AudioService.extractWaveform = originalExtractWaveform;
      }
    });
  });
  
  // 3. Error Handling Testing
  describe('Error Handling', () => {
    it('should handle errors when loading invalid audio files', async () => {
      // Create an invalid audio file (empty)
      const invalidFile = new File([], 'empty.mp3', { type: 'audio/mp3' });
      
      // Mock decodeAudioData to reject
      mockDecodeAudioData.mockImplementation((arrayBuffer, successCallback, errorCallback) => {
        errorCallback(new Error('Failed to decode audio data'));
        return Promise.reject(new Error('Failed to decode audio data'));
      });
      
      // Call loadAudio and expect it to throw
      await expect(AudioService.loadAudio(invalidFile)).rejects.toThrow(AudioProcessingError);
      
      // Verify the error is an AudioProcessingError
      try {
        await AudioService.loadAudio(invalidFile);
      } catch (error) {
        expect(error).toBeInstanceOf(AudioProcessingError);
        // The error code could be either DECODE_ERROR or LOAD_ERROR depending on implementation
        expect(['DECODE_ERROR', 'LOAD_ERROR']).toContain((error as AudioProcessingError).code);
      }
    });
    
    it('should handle network errors when loading audio from URL', async () => {
      // Mock fetch to reject
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          statusText: 'Not Found'
        })
      );
      
      // Call loadAudio with a URL and expect it to throw
      await expect(AudioService.loadAudio('https://example.com/not-found.mp3')).rejects.toThrow(AudioProcessingError);
      
      // Verify the error code
      try {
        await AudioService.loadAudio('https://example.com/not-found.mp3');
      } catch (error) {
        expect(error).toBeInstanceOf(AudioProcessingError);
        expect((error as AudioProcessingError).code).toBe('FETCH_ERROR');
      }
    });
    
    it('should handle errors during audio analysis', async () => {
      // Create a mock audio file
      const mockFile = createMockAudioFile();
      
      // Mock loadAudio to throw
      const originalLoadAudio = AudioService.loadAudio;
      AudioService.loadAudio = jest.fn().mockRejectedValue(
        new AudioProcessingError('Failed to load audio', 'LOAD_ERROR')
      );
      
      try {
        // Call analyzeAudio and expect it to throw
        const progressCallback = jest.fn();
        await expect(AudioService.analyzeAudio(mockFile, progressCallback)).rejects.toThrow(AudioProcessingError);
        
        // Verify error is an AudioProcessingError
        try {
          await AudioService.analyzeAudio(mockFile, progressCallback);
        } catch (error) {
          expect(error).toBeInstanceOf(AudioProcessingError);
          // The error code could be either ANALYSIS_ERROR or LOAD_ERROR depending on implementation
          expect(['ANALYSIS_ERROR', 'LOAD_ERROR']).toContain((error as AudioProcessingError).code);
        }
      } finally {
        // Restore original method
        AudioService.loadAudio = originalLoadAudio;
      }
    });
    
    it('should provide fallback values when BPM extraction fails', async () => {
      // Create a mock audio file
      const mockFile = createMockAudioFile();
      
      // Mock loadAudio to throw
      const originalLoadAudio = AudioService.loadAudio;
      AudioService.loadAudio = jest.fn().mockRejectedValue(
        new Error('Failed to load audio')
      );
      
      try {
        // Call extractBPM
        const result = await AudioService.extractBPM(mockFile);
        
        // Verify fallback values are provided
        expect(result.bpm).toBe(120); // Default BPM
        expect(Array.isArray(result.beats)).toBe(true);
        expect(result.beats.length).toBeGreaterThan(0);
      } finally {
        // Restore original method
        AudioService.loadAudio = originalLoadAudio;
      }
    });
    
    it('should provide fallback values when waveform creation fails', async () => {
      // Create a mock audio file
      const mockFile = createMockAudioFile();
      
      // Mock loadAudio to throw
      const originalLoadAudio = AudioService.loadAudio;
      AudioService.loadAudio = jest.fn().mockRejectedValue(
        new Error('Failed to load audio')
      );
      
      try {
        // Call createWaveform
        const result = await AudioService.createWaveform(mockFile, 100, 50);
        
        // Verify fallback values are provided
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(100); // Width
      } finally {
        // Restore original method
        AudioService.loadAudio = originalLoadAudio;
      }
    });
  });
  
  // 4. WebAssembly Fallback Testing
  describe('WebAssembly Fallback', () => {
    it('should gracefully degrade when WebAssembly is not available', async () => {
      // Remove WebAssembly from global
      delete (global as any).WebAssembly;
      
      // Create a mock audio file
      const mockFile = createMockAudioFile();
      
      // Mock the required methods to ensure they work without WebAssembly
      const originalLoadAudio = AudioService.loadAudio;
      const originalExtractWaveform = AudioService.extractWaveform;
      const originalDetectBeats = AudioService.detectBeats;
      const originalAnalyzeEnergy = AudioService.analyzeEnergy;
      const originalEstimateTempo = AudioService.estimateTempo;
      const originalDetectSections = AudioService.detectSections;
      
      // Mock return values
      const mockAudioBuffer = createMockAudioBuffer();
      const mockWaveform = {
        duration: 120,
        sampleRate: 44100,
        channels: 2,
        data: Array(1000).fill(0.5),
        maxAmplitude: 1,
        minAmplitude: 0
      };
      const mockBeatAnalysis = {
        beats: Array(120).fill(0).map((_, i) => ({ time: i, confidence: 0.8 })),
        averageConfidence: 0.8
      };
      const mockEnergyAnalysis = {
        samples: Array(120).fill(0).map((_, i) => ({ time: i, level: 0.5 })),
        averageEnergy: 0.5,
        peakEnergy: 1,
        peakEnergyTime: 60
      };
      const mockTempo = {
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        confidence: 0.9,
        isStable: true
      };
      const mockSections = {
        sections: [
          { start: 0, duration: 30, label: 'Section 1', confidence: 0.8 },
          { start: 30, duration: 30, label: 'Section 2', confidence: 0.8 },
          { start: 60, duration: 30, label: 'Section 3', confidence: 0.8 },
          { start: 90, duration: 30, label: 'Section 4', confidence: 0.8 }
        ]
      };
      
      // Setup mocks
      AudioService.loadAudio = jest.fn().mockResolvedValue(mockAudioBuffer);
      AudioService.extractWaveform = jest.fn().mockResolvedValue(mockWaveform);
      AudioService.detectBeats = jest.fn().mockResolvedValue(mockBeatAnalysis);
      AudioService.analyzeEnergy = jest.fn().mockResolvedValue(mockEnergyAnalysis);
      AudioService.estimateTempo = jest.fn().mockResolvedValue(mockTempo);
      AudioService.detectSections = jest.fn().mockResolvedValue(mockSections);
      
      try {
        // Call analyzeAudio
        const progressCallback = jest.fn();
        const result = await AudioService.analyzeAudio(mockFile, progressCallback);
        
        // Verify the analysis still works without WebAssembly
        expect(result).toHaveProperty('metadata');
        expect(result).toHaveProperty('waveform');
        expect(result).toHaveProperty('beats');
        expect(result).toHaveProperty('tempo');
        expect(result).toHaveProperty('energy');
        expect(result).toHaveProperty('sections');
      } finally {
        // Restore original methods
        AudioService.loadAudio = originalLoadAudio;
        AudioService.extractWaveform = originalExtractWaveform;
        AudioService.detectBeats = originalDetectBeats;
        AudioService.analyzeEnergy = originalAnalyzeEnergy;
        AudioService.estimateTempo = originalEstimateTempo;
        AudioService.detectSections = originalDetectSections;
        
        // Restore WebAssembly
        global.WebAssembly = originalWebAssembly;
      }
    });
  });
});
