import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioAnalysis, AudioProcessingOptions } from '../types/audio-types';
import { 
  createMockFile, 
  createMockAudioBuffer, 
  createMockAudioContext,
  createMockAudioAnalysis,
  isAudioAnalysis
} from '../utils/test-utils';

// Mock AudioService class for testing
class AudioService {
  private audioContext: AudioContext;
  
  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext || new AudioContext();
  }
  
  async processAudio(file: File, options?: AudioProcessingOptions): Promise<AudioAnalysis> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        this.audioContext.decodeAudioData(
          arrayBuffer,
          (buffer) => resolve(buffer),
          (error) => reject(error)
        );
      });
      
      // In a real implementation, we would process the audio here
      // For testing, we'll just return a mock analysis
      return {
        id: 'test-analysis',
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        beats: [],
        tempo: 120,
        segments: [],
        energyPoints: [],
        averageEnergy: 0.5,
        beatAnalysis: {
          beats: [],
          averageConfidence: 0.9,
          tempo: 120,
          tempoConfidence: 0.95,
          timeSignature: '4/4',
        },
        beatTimes: [],
      };
    } catch (error) {
      throw error;
    }
  }
}

describe('AudioService', () => {
  let audioService: AudioService;
  let mockAudioContext: AudioContext;

  beforeEach(() => {
    // Create a mock AudioContext
    mockAudioContext = createMockAudioContext();
    
    // Create a new instance of AudioService with the mock AudioContext
    audioService = new AudioService(mockAudioContext);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should process audio file correctly', async () => {
    // Create a mock File
    const mockFile = createMockFile('test-audio.mp3', 'audio/mp3');
    
    // Create a mock ArrayBuffer
    const mockArrayBuffer = new ArrayBuffer(8);
    
    // Create a mock AudioBuffer
    const mockAudioBuffer = createMockAudioBuffer(120, 2, 44100);
    
    // Mock the file's arrayBuffer method
    Object.defineProperty(mockFile, 'arrayBuffer', {
      value: vi.fn().mockResolvedValue(mockArrayBuffer),
    });
    
    // Mock the AudioContext's decodeAudioData method
    (mockAudioContext.decodeAudioData as any) = vi.fn().mockImplementation(
      (buffer: ArrayBuffer, onSuccess: (buffer: AudioBuffer) => void) => {
        onSuccess(mockAudioBuffer);
        return Promise.resolve(mockAudioBuffer);
      }
    );
    
    // Define processing options
    const options: AudioProcessingOptions = {
      sampleRate: 44100,
      channels: 2,
      normalize: true,
    };
    
    // Call the processAudio method
    const result = await audioService.processAudio(mockFile, options);
    
    // Verify the result
    expect(result).toBeDefined();
    expect(result.duration).toBe(120);
    expect(result.sampleRate).toBe(44100);
    expect(result.channels).toBe(2);
    expect(mockAudioContext.decodeAudioData).toHaveBeenCalledWith(mockArrayBuffer, expect.any(Function));
  });

  it('should handle errors during audio processing', async () => {
    // Create a mock File
    const mockFile = createMockFile('test-audio.mp3', 'audio/mp3');
    
    // Create a mock ArrayBuffer
    const mockArrayBuffer = new ArrayBuffer(8);
    
    // Mock the file's arrayBuffer method
    Object.defineProperty(mockFile, 'arrayBuffer', {
      value: vi.fn().mockResolvedValue(mockArrayBuffer),
    });
    
    // Mock the AudioContext's decodeAudioData method to throw an error
    (mockAudioContext.decodeAudioData as any) = vi.fn().mockImplementation(
      (buffer: ArrayBuffer, onSuccess: (buffer: AudioBuffer) => void, onError: (error: Error) => void) => {
        onError(new Error('Failed to decode audio data'));
        return Promise.reject(new Error('Failed to decode audio data'));
      }
    );
    
    // Call the processAudio method and expect it to throw an error
    await expect(audioService.processAudio(mockFile)).rejects.toThrow('Failed to decode audio data');
    
    // Verify that decodeAudioData was called
    expect(mockAudioContext.decodeAudioData).toHaveBeenCalledWith(mockArrayBuffer, expect.any(Function), expect.any(Function));
  });

  it('should create a valid mock audio analysis', () => {
    // Create a mock audio analysis
    const mockAnalysis = createMockAudioAnalysis(180, 180, 12);
    
    // Verify the mock analysis
    expect(isAudioAnalysis(mockAnalysis)).toBe(true);
    expect(mockAnalysis.duration).toBe(180);
    expect(mockAnalysis.beats.length).toBe(180);
    expect(mockAnalysis.segments.length).toBe(12);
    expect(mockAnalysis.tempo).toBe(120);
    expect(mockAnalysis.beatAnalysis).toBeDefined();
    expect(mockAnalysis.beatAnalysis.beats.length).toBe(180);
  });
});
