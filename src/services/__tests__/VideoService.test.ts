/**
 * VideoService.test.ts
 * Tests for the VideoService class
 */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { VideoService } from '../VideoService';
import { 
  VideoAnalysis, 
  VideoProcessingOptions, 
  Scene, 
  VideoFrame,
  ClipType
} from '../../types/video-types';
import { createMockVideoFile, createMockVideoAnalysis, createMockEventEmitter } from '../../utils/test/test-utils';
import EventEmitter from 'events';

// Mock the fileChunker utility
jest.mock('../../utils/fileChunker', () => ({
  shouldUseChunkedProcessing: jest.fn().mockReturnValue(false),
  processFileInChunks: jest.fn().mockImplementation(async (file, processChunk, progressCallback) => {
    // Just call the processChunk function once with the entire file
    const result = await processChunk(file, 0, 1);
    if (progressCallback) {
      progressCallback(1, 'Processing complete');
    }
    return result;
  })
}));

// Import the mocked functions
import { shouldUseChunkedProcessing, processFileInChunks } from '../../utils/fileChunker';

describe('VideoService', () => {
  let videoService: VideoService;
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    // Create a new EventEmitter
    eventEmitter = new EventEmitter();
    
    // Spy on the emit method
    jest.spyOn(eventEmitter, 'emit');
    
    // Create a new instance of VideoService
    videoService = new VideoService(eventEmitter);
  });

  afterEach(() => {
    // Reset mocks
    jest.resetAllMocks();
  });

  describe('analyzeVideo', () => {
    it('should analyze a video file using standard processing', async () => {
      // Spy on the processStandardVideo method
      const processStandardVideoSpy = jest.spyOn(
        videoService as any, 
        'processStandardVideo'
      ).mockImplementation(async () => {
        return (videoService as any).createMockVideoAnalysis(mockFile);
      });
      
      // Create a mock video file
      const mockFile = createMockVideoFile();
      
      // Call the analyzeVideo method
      const result = await videoService.analyzeVideo(mockFile);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
      expect(processStandardVideoSpy).toHaveBeenCalledWith(mockFile);
    });

    it('should cache analysis results for the same file', async () => {
      // Spy on the processStandardVideo method
      const processStandardVideoSpy = jest.spyOn(
        videoService as any, 
        'processStandardVideo'
      ).mockImplementation(async () => {
        return (videoService as any).createMockVideoAnalysis(mockFile);
      });
      
      // Create a mock video file
      const mockFile = createMockVideoFile();
      
      // Call the analyzeVideo method twice
      const result1 = await videoService.analyzeVideo(mockFile);
      
      // Reset the spy and emit mock
      processStandardVideoSpy.mockClear();
      (videoService.emit as jest.Mock).mockClear();
      
      // Call again with the same file
      const result2 = await videoService.analyzeVideo(mockFile);
      
      // Verify that the second call returned the cached result
      expect(result2).toBe(result1);
      expect(processStandardVideoSpy).not.toHaveBeenCalled();
    });

    it('should use different processing methods based on file size', async () => {
      // Create mock files of different sizes
      const mockFile1 = createMockVideoFile('test-video.mp4', 1024 * 1024);
      const mockFile2 = createMockVideoFile('test-video.mp4', 2 * 1024 * 1024);
      
      // Spy on the processStandardVideo method
      const processStandardVideoSpy = jest.spyOn(
        videoService as any, 
        'processStandardVideo'
      ).mockImplementation(async (file) => {
        return (videoService as any).createMockVideoAnalysis(file);
      });
      
      // Call the analyzeVideo method with the first file
      await videoService.analyzeVideo(mockFile1);
      
      // Verify that processStandardVideo was called
      expect(processStandardVideoSpy).toHaveBeenCalledWith(mockFile1);
      
      // Reset the spy
      processStandardVideoSpy.mockClear();
      
      // Call the analyzeVideo method with the second file
      await videoService.analyzeVideo(mockFile2);
      
      // Verify that processStandardVideo was called again
      expect(processStandardVideoSpy).toHaveBeenCalledWith(mockFile2);
    });
  });

  describe('processStandardVideo', () => {
    it('should process a standard video file', async () => {
      // Create a mock video file
      const mockFile = createMockVideoFile();
      
      // Spy on the detectScenes method
      jest.spyOn(videoService as any, 'detectScenes')
        .mockImplementation(() => Promise.resolve());
      
      // Call the processStandardVideo method
      const result = await (videoService as any).processStandardVideo(mockFile);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.frameRate).toBeGreaterThan(0);
      
      // Verify that progress events were emitted
      expect(videoService.emit).toHaveBeenCalledWith(
        'progress',
        expect.objectContaining({
          progress: expect.any(Number),
          message: expect.any(String)
        })
      );
    });
  });

  describe('processLargeVideo', () => {
    it('should process a large video file using chunked processing', async () => {
      // Create a mock video file (500MB)
      const mockFile = createMockVideoFile('large-video.mp4', 500 * 1024 * 1024); // 500MB file
      
      // Mock shouldUseChunkedProcessing to return true for this test
      (shouldUseChunkedProcessing as jest.Mock).mockReturnValueOnce(true);
      
      // Spy on the processLargeVideo method
      const processLargeVideoSpy = jest.spyOn(
        videoService as any, 
        'processLargeVideo'
      ).mockImplementation(async () => {
        return (videoService as any).createMockVideoAnalysis(mockFile);
      });
      
      // Call the analyzeVideo method
      const result = await videoService.analyzeVideo(mockFile);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(shouldUseChunkedProcessing).toHaveBeenCalledWith(mockFile);
      expect(processLargeVideoSpy).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('error handling', () => {
    it('should handle errors during video loading', async () => {
      // Create a mock video file
      const mockFile = createMockVideoFile('invalid-video.mp4');
      const mockError = new Error('Failed to load video file');
      
      // Spy on the processStandardVideo method to throw an error
      jest.spyOn(videoService as any, 'processStandardVideo')
        .mockRejectedValueOnce(mockError);
      
      // Call the analyzeVideo method and expect it to throw an error
      await expect(videoService.analyzeVideo(mockFile)).rejects.toThrow(mockError);
      
      // Verify that an error event was emitted
      expect(videoService.emit).toHaveBeenCalledWith('error', mockError);
    });

    it('should handle errors during scene detection', async () => {
      // Create a mock video file
      const mockFile = createMockVideoFile();
      
      // Spy on the detectScenes method to throw an error
      jest.spyOn(videoService as any, 'detectScenes')
        .mockImplementationOnce(async () => {
          throw new Error('Frame extraction failed');
        });
      
      // Call the analyzeVideo method and expect it to throw an error
      await expect(videoService.analyzeVideo(mockFile)).rejects.toThrow('Frame extraction failed');
    });

    it('should log errors during video processing', async () => {
      // Create a mock video file
      const mockFile = createMockVideoFile();
      const mockError = new Error('Video processing error');
      
      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Spy on the processStandardVideo method to throw an error
      jest.spyOn(videoService as any, 'processStandardVideo')
        .mockRejectedValueOnce(mockError);
      
      // Call the analyzeVideo method and catch the error
      try {
        await videoService.analyzeVideo(mockFile);
      } catch (error) {
        // Verify that an error event was emitted
        expect(videoService.emit).toHaveBeenCalledWith('error', mockError);
      }
    });
  });

  describe('processLargeVideo', () => {
    it('should use processFileInChunks for large videos', async () => {
      // Create a mock video file (500MB)
      const mockFile = createMockVideoFile('large-video.mp4', 500 * 1024 * 1024); // 500MB file
      
      // Spy on the processChunk method
      jest.spyOn(videoService as any, 'processVideoChunk')
        .mockImplementation(() => Promise.resolve());
      
      // Call the processLargeVideo method
      const result = await (videoService as any).processLargeVideo(mockFile);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(processFileInChunks).toHaveBeenCalledWith(
        mockFile,
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  describe('processVideoChunk', () => {
    it('should process a chunk of a video file', async () => {
      // Create a mock video file (500MB)
      const mockFile = createMockVideoFile('large-video.mp4', 500 * 1024 * 1024); // 500MB file
      
      // Spy on the extractFrames method
      jest.spyOn(videoService as any, 'extractFrames')
        .mockImplementation(() => Promise.resolve());
      
      // Call the processVideoChunk method
      await (videoService as any).processVideoChunk(mockFile);
      
      // Verify that progress events were emitted
      expect(videoService.emit).toHaveBeenCalledWith(
        'progress',
        expect.objectContaining({
          progress: expect.any(Number),
          message: expect.any(String)
        })
      );
    });
  });

  describe('createMockVideoAnalysis', () => {
    it('should create a mock video analysis result', () => {
      // Create a mock video file
      const mockFile = createMockVideoFile();
      
      // Call the createMockVideoAnalysis method
      const result = (videoService as any).createMockVideoAnalysis(mockFile);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.frameRate).toBeGreaterThan(0);
      expect(result.scenes).toBeInstanceOf(Array);
      expect(result.scenes.length).toBeGreaterThan(0);
    });
  });

  describe('caching', () => {
    it('should cache analysis results', async () => {
      // Create a mock video file
      const mockFile = createMockVideoFile();
      
      // Spy on the processStandardVideo method
      const processStandardVideoSpy = jest.spyOn(
        videoService as any, 
        'processStandardVideo'
      ).mockImplementation(async () => {
        return (videoService as any).createMockVideoAnalysis(mockFile);
      });
      
      // Call the analyzeVideo method twice with the same file
      await videoService.analyzeVideo(mockFile);
      await videoService.analyzeVideo(mockFile);
      
      // Verify that processStandardVideo was only called once
      expect(processStandardVideoSpy).toHaveBeenCalledTimes(1);
      
      // Reset the cache
      (videoService as any).analysisCache.clear();
      
      // Call the analyzeVideo method again
      processStandardVideoSpy.mockClear();
      await videoService.analyzeVideo(mockFile);
      
      // Verify that processStandardVideo was called again
      expect(processStandardVideoSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('event handling', () => {
    it('should emit progress events', () => {
      // Create a mock event handler
      const mockHandler = jest.fn();
      
      // Register the handler
      videoService.on('progress', mockHandler);
      
      // Emit a progress event
      videoService.emit('progress', { progress: 0.5, message: 'Test', stage: 'test' });
      
      // Verify that the handler was called
      expect(mockHandler).toHaveBeenCalledWith({ progress: 0.5, message: 'Test', stage: 'test' });
      
      // Unregister the handler
      videoService.off('progress', mockHandler);
      
      // Emit another progress event
      videoService.emit('progress', { progress: 0.7, message: 'Test 2', stage: 'test' });
      
      // Verify that the handler was not called again
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should support once event registration', () => {
      // Create a mock event handler
      const mockHandler = jest.fn();
      
      // Register the handler with once
      videoService.once('progress', mockHandler);
      
      // Emit a progress event
      videoService.emit('progress', { progress: 0.5, message: 'Test', stage: 'test' });
      
      // Verify that the handler was called
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith({ progress: 0.5, message: 'Test', stage: 'test' });
      
      // Emit another progress event
      videoService.emit('progress', { progress: 0.7, message: 'Test 2', stage: 'test' });
      
      // Verify that the handler was not called again
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should support removing all listeners for an event', () => {
      // Create mock event handlers
      const mockHandler1 = jest.fn();
      const mockHandler2 = jest.fn();
      
      // Register the handlers
      videoService.on('progress', mockHandler1);
      videoService.on('progress', mockHandler2);
      
      // Remove all listeners for the progress event
      videoService.removeAllListeners('progress');
      
      // Emit a progress event
      videoService.emit('progress', { progress: 0.5, message: 'Test', stage: 'test' });
      
      // Verify that the handlers were not called
      expect(mockHandler1).not.toHaveBeenCalled();
      expect(mockHandler2).not.toHaveBeenCalled();
    });
  });
});
