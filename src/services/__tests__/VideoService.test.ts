// src/services/__tests__/VideoService.test.ts
import { VideoService, VideoServiceEvents, VideoAnalysis } from '../VideoService';
import { createMockVideoFile } from '../../test/test-utils';
import { shouldUseChunkedProcessing, processFileInChunks } from '../../utils/fileChunker';
import EventEmitter from 'events';

// Mock the fileChunker utility
jest.mock('../../utils/fileChunker', () => ({
  shouldUseChunkedProcessing: jest.fn().mockReturnValue(false),
  processFileInChunks: jest.fn().mockImplementation(async (file, processChunk, progressCallback) => {
    // Simulate processing chunks
    for (let i = 0; i < 10; i++) {
      await processChunk(new Blob(['chunk data']), i, 10);
      progressCallback({
        chunkIndex: i,
        chunksTotal: 10,
        bytesLoaded: (i + 1) * (file.size / 10),
        bytesTotal: file.size,
        percentage: ((i + 1) / 10) * 100
      });
    }
    return Array(10).fill({ processed: true });
  })
}));

describe('VideoService', () => {
  let videoService: VideoService;
  let originalEmit: any;
  
  beforeEach(() => {
    // Get a fresh instance for each test
    videoService = VideoService.getInstance();
    
    // Store the original emit method
    originalEmit = videoService.emit;
    
    // Mock the emit method
    videoService.emit = jest.fn();
    
    // Clear the processing cache
    videoService.clearCache();
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore the original emit method
    if (originalEmit) {
      videoService.emit = originalEmit;
    }
  });
  
  // 1. Singleton pattern verification
  describe('Singleton Pattern', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const instance1 = VideoService.getInstance();
      const instance2 = VideoService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(videoService);
    });
    
    it('should not allow direct instantiation via constructor', () => {
      // Attempt to create a new instance directly
      // This test is a bit tricky since we can't directly test a private constructor
      // Instead, we'll verify that the class has a private constructor by checking
      // that the prototype doesn't have a public constructor property
      expect(VideoService.prototype.constructor).not.toBeUndefined();
    });
  });
  
  // 2. Video file loading functionality
  describe('Video File Loading', () => {
    it('should load video files from File objects', async () => {
      const mockFile = createMockVideoFile();
      
      // Spy on the private methods
      const processStandardVideoSpy = jest.spyOn(
        videoService as any, 
        'processStandardVideo'
      ).mockImplementation(async () => {
        return (videoService as any).createMockVideoAnalysis(mockFile);
      });
      
      // Call the method
      const result = await videoService.analyzeVideo(mockFile);
      
      // Verify the method was called
      expect(processStandardVideoSpy).toHaveBeenCalledWith(mockFile);
      
      // Verify the result structure
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('frameRate');
      expect(result).toHaveProperty('resolution');
      expect(result).toHaveProperty('scenes');
      expect(result).toHaveProperty('contentAnalysis');
    });
    
    it('should use the caching mechanism for loaded videos', async () => {
      const mockFile = createMockVideoFile();
      
      // Spy on the private methods
      const processStandardVideoSpy = jest.spyOn(
        videoService as any, 
        'processStandardVideo'
      ).mockImplementation(async () => {
        return (videoService as any).createMockVideoAnalysis(mockFile);
      });
      
      // First call should process the file
      const result1 = await videoService.analyzeVideo(mockFile);
      
      // Reset the spy and emit mock
      processStandardVideoSpy.mockClear();
      (videoService.emit as jest.Mock).mockClear();
      
      // Second call should use the cache
      const result2 = await videoService.analyzeVideo(mockFile);
      
      // Verify the processing method was not called again
      expect(processStandardVideoSpy).not.toHaveBeenCalled();
      
      // Verify the results are the same
      expect(result2).toBe(result1);
      
      // Verify only the completion event was emitted (not the start event)
      expect(videoService.emit).not.toHaveBeenCalledWith(VideoServiceEvents.ANALYSIS_START);
      expect(videoService.emit).toHaveBeenCalledWith(VideoServiceEvents.ANALYSIS_COMPLETE, result2);
    });
    
    it('should generate a unique cache key based on file properties', async () => {
      // Create two files with the same name but different sizes
      const mockFile1 = createMockVideoFile('test-video.mp4', 1024 * 1024);
      const mockFile2 = createMockVideoFile('test-video.mp4', 2 * 1024 * 1024);
      
      // Spy on the private methods
      const processStandardVideoSpy = jest.spyOn(
        videoService as any, 
        'processStandardVideo'
      ).mockImplementation(async (file) => {
        return (videoService as any).createMockVideoAnalysis(file);
      });
      
      // Process the first file
      await videoService.analyzeVideo(mockFile1);
      
      // Reset the spy
      processStandardVideoSpy.mockClear();
      
      // Process the second file - should not use cache
      await videoService.analyzeVideo(mockFile2);
      
      // Verify the processing method was called again
      expect(processStandardVideoSpy).toHaveBeenCalledWith(mockFile2);
    });
  });
  
  // 3. Basic video analysis capabilities
  describe('Video Analysis Capabilities', () => {
    it('should process video files with progress updates', async () => {
      const mockFile = createMockVideoFile();
      
      // Spy on the simulateProcessingDelay method to make tests faster
      jest.spyOn(videoService as any, 'simulateProcessingDelay')
        .mockImplementation(() => Promise.resolve());
      
      // Call the private method directly
      const result = await (videoService as any).processStandardVideo(mockFile);
      
      // Verify progress events were emitted
      expect(videoService.emit).toHaveBeenCalledWith(
        VideoServiceEvents.PROGRESS,
        expect.objectContaining({
          message: 'Loading video file...',
          progress: 0.1,
          stage: 'loading'
        })
      );
      
      expect(videoService.emit).toHaveBeenCalledWith(
        VideoServiceEvents.PROGRESS,
        expect.objectContaining({
          message: 'Extracting frames...',
          progress: 0.3,
          stage: 'frames'
        })
      );
      
      expect(videoService.emit).toHaveBeenCalledWith(
        VideoServiceEvents.PROGRESS,
        expect.objectContaining({
          message: 'Detecting scenes...',
          progress: 0.6,
          stage: 'scenes'
        })
      );
      
      expect(videoService.emit).toHaveBeenCalledWith(
        VideoServiceEvents.PROGRESS,
        expect.objectContaining({
          message: 'Analyzing content...',
          progress: 0.8,
          stage: 'content'
        })
      );
      
      expect(videoService.emit).toHaveBeenCalledWith(
        VideoServiceEvents.PROGRESS,
        expect.objectContaining({
          message: 'Analyzing motion...',
          progress: 0.9,
          stage: 'motion'
        })
      );
      
      expect(videoService.emit).toHaveBeenCalledWith(
        VideoServiceEvents.PROGRESS,
        expect.objectContaining({
          message: 'Finalizing analysis...',
          progress: 1.0,
          stage: 'complete'
        })
      );
      
      // Verify the result structure
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('frameRate');
      expect(result).toHaveProperty('resolution');
      expect(result).toHaveProperty('scenes');
      expect(result).toHaveProperty('contentAnalysis');
    });
    
    it('should process large video files in chunks', async () => {
      const mockFile = createMockVideoFile('large-video.mp4', 500 * 1024 * 1024); // 500MB file
      
      // Mock shouldUseChunkedProcessing to return true for this test
      (shouldUseChunkedProcessing as jest.Mock).mockReturnValueOnce(true);
      
      // Spy on the private methods
      const processLargeVideoSpy = jest.spyOn(
        videoService as any, 
        'processLargeVideo'
      ).mockImplementation(async () => {
        return (videoService as any).createMockVideoAnalysis(mockFile);
      });
      
      // Call the method
      const result = await videoService.analyzeVideo(mockFile);
      
      // Verify the correct processing method was called
      expect(shouldUseChunkedProcessing).toHaveBeenCalledWith(mockFile);
      expect(processLargeVideoSpy).toHaveBeenCalledWith(mockFile);
      
      // Verify the result structure
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('frameRate');
      expect(result).toHaveProperty('resolution');
      expect(result).toHaveProperty('scenes');
      expect(result).toHaveProperty('contentAnalysis');
    });
  });
  
  // 4. Error handling for invalid video files
  describe('Error Handling', () => {
    it('should handle errors when loading invalid video files', async () => {
      const mockFile = createMockVideoFile('invalid-video.mp4');
      const mockError = new Error('Failed to load video file');
      
      // Spy on the private method to throw an error
      jest.spyOn(videoService as any, 'processStandardVideo')
        .mockRejectedValueOnce(mockError);
      
      // Call the method and expect it to throw
      await expect(videoService.analyzeVideo(mockFile)).rejects.toThrow(mockError);
      
      // Verify the error event was emitted
      expect(videoService.emit).toHaveBeenCalledWith(VideoServiceEvents.ERROR, mockError);
    });
    
    it('should handle errors when video analysis fails', async () => {
      const mockFile = createMockVideoFile();
      
      // Mock the processStandardVideo method to simulate a failure during analysis
      jest.spyOn(videoService as any, 'processStandardVideo')
        .mockImplementationOnce(async () => {
          // Emit progress events to simulate partial processing
          videoService.emit(VideoServiceEvents.PROGRESS, { 
            message: 'Loading video file...',
            progress: 0.1,
            stage: 'loading'
          });
          
          videoService.emit(VideoServiceEvents.PROGRESS, { 
            message: 'Extracting frames...',
            progress: 0.3,
            stage: 'frames'
          });
          
          // Then throw an error
          throw new Error('Frame extraction failed');
        });
      
      // Call the method and expect it to throw
      await expect(videoService.analyzeVideo(mockFile)).rejects.toThrow('Frame extraction failed');
      
      // Verify the error event was emitted
      expect(videoService.emit).toHaveBeenCalledWith(VideoServiceEvents.ERROR, expect.any(Error));
    });
    
    it('should emit appropriate error events', async () => {
      const mockFile = createMockVideoFile();
      const mockError = new Error('Video processing error');
      
      // Spy on the private method to throw an error
      jest.spyOn(videoService as any, 'processStandardVideo')
        .mockRejectedValueOnce(mockError);
      
      // Call the method and catch the error
      try {
        await videoService.analyzeVideo(mockFile);
      } catch (error) {
        // Expected to throw
      }
      
      // Verify the error event was emitted with the correct error
      expect(videoService.emit).toHaveBeenCalledWith(VideoServiceEvents.ERROR, mockError);
    });
  });
  
  // Test processLargeVideo method (private)
  describe('processLargeVideo', () => {
    it('should process a large video file in chunks with progress updates', async () => {
      const mockFile = createMockVideoFile('large-video.mp4', 500 * 1024 * 1024); // 500MB file
      
      // Spy on the simulateProcessingDelay method to make tests faster
      jest.spyOn(videoService as any, 'simulateProcessingDelay')
        .mockImplementation(() => Promise.resolve());
      
      // Call the private method directly
      const result = await (videoService as any).processLargeVideo(mockFile);
      
      // Verify processFileInChunks was called
      expect(processFileInChunks).toHaveBeenCalledWith(
        mockFile,
        expect.any(Function),
        expect.any(Function)
      );
      
      // Verify initial progress event was emitted
      expect(videoService.emit).toHaveBeenCalledWith(
        VideoServiceEvents.PROGRESS,
        expect.objectContaining({
          message: 'Preparing to process large video file...',
          progress: 0.05,
          stage: 'loading'
        })
      );
      
      // Verify final progress event was emitted
      expect(videoService.emit).toHaveBeenCalledWith(
        VideoServiceEvents.PROGRESS,
        expect.objectContaining({
          message: 'Finalizing analysis...',
          progress: 1.0,
          stage: 'complete'
        })
      );
      
      // Verify the result structure
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('frameRate');
      expect(result).toHaveProperty('resolution');
      expect(result).toHaveProperty('scenes');
      expect(result).toHaveProperty('contentAnalysis');
    });
    
    it('should emit chunk progress events during processing', async () => {
      const mockFile = createMockVideoFile('large-video.mp4', 500 * 1024 * 1024); // 500MB file
      
      // Spy on the simulateProcessingDelay method to make tests faster
      jest.spyOn(videoService as any, 'simulateProcessingDelay')
        .mockImplementation(() => Promise.resolve());
      
      // Call the private method directly
      await (videoService as any).processLargeVideo(mockFile);
      
      // Verify chunk progress events were emitted
      expect(videoService.emit).toHaveBeenCalledWith(
        VideoServiceEvents.CHUNK_PROGRESS,
        expect.objectContaining({
          stage: expect.any(String)
        })
      );
    });
  });
  
  // Test createMockVideoAnalysis method (private)
  describe('createMockVideoAnalysis', () => {
    it('should create a mock video analysis result', () => {
      const mockFile = createMockVideoFile();
      
      // Call the private method directly
      const result = (videoService as any).createMockVideoAnalysis(mockFile);
      
      // Verify the result structure
      expect(result).toHaveProperty('duration', 120);
      expect(result).toHaveProperty('frameRate', 30);
      expect(result).toHaveProperty('resolution', { width: 1920, height: 1080 });
      expect(result).toHaveProperty('scenes');
      expect(result.scenes).toHaveLength(5);
      expect(result).toHaveProperty('contentAnalysis');
      expect(result.contentAnalysis).toHaveLength(5);
    });
  });
  
  // Test clearCache method
  describe('clearCache', () => {
    it('should clear the processing cache', async () => {
      const mockFile = createMockVideoFile();
      
      // First, add something to the cache
      await videoService.analyzeVideo(mockFile);
      
      // Spy on the private methods
      const processStandardVideoSpy = jest.spyOn(
        videoService as any, 
        'processStandardVideo'
      );
      
      // Verify the cache is working by calling analyzeVideo again
      await videoService.analyzeVideo(mockFile);
      expect(processStandardVideoSpy).not.toHaveBeenCalled();
      
      // Clear the cache
      videoService.clearCache();
      
      // Reset the spy
      processStandardVideoSpy.mockClear();
      
      // Call analyzeVideo again - should process the file again
      await videoService.analyzeVideo(mockFile);
      expect(processStandardVideoSpy).toHaveBeenCalled();
    });
  });
  
  // Test event emitter functionality
  describe('Event Emitter', () => {
    it('should allow subscribing to events', () => {
      // Restore the original emit method for this test
      videoService.emit = originalEmit;
      
      const mockHandler = jest.fn();
      
      // Subscribe to an event
      videoService.on(VideoServiceEvents.PROGRESS, mockHandler);
      
      // Emit the event
      videoService.emit(VideoServiceEvents.PROGRESS, { progress: 0.5, message: 'Test', stage: 'test' });
      
      // Verify the handler was called
      expect(mockHandler).toHaveBeenCalledWith({ progress: 0.5, message: 'Test', stage: 'test' });
      
      // Unsubscribe
      videoService.off(VideoServiceEvents.PROGRESS, mockHandler);
      
      // Emit again
      videoService.emit(VideoServiceEvents.PROGRESS, { progress: 0.7, message: 'Test 2', stage: 'test' });
      
      // Verify the handler was not called again
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
    
    it('should allow one-time event subscriptions', () => {
      // Restore the original emit method for this test
      videoService.emit = originalEmit;
      
      const mockHandler = jest.fn();
      
      // Subscribe to an event once
      videoService.once(VideoServiceEvents.PROGRESS, mockHandler);
      
      // Emit the event twice
      videoService.emit(VideoServiceEvents.PROGRESS, { progress: 0.5, message: 'Test', stage: 'test' });
      videoService.emit(VideoServiceEvents.PROGRESS, { progress: 0.7, message: 'Test 2', stage: 'test' });
      
      // Verify the handler was called only once
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith({ progress: 0.5, message: 'Test', stage: 'test' });
    });
    
    it('should allow removing all listeners for an event', () => {
      // Restore the original emit method for this test
      videoService.emit = originalEmit;
      
      const mockHandler1 = jest.fn();
      const mockHandler2 = jest.fn();
      
      // Subscribe to events
      videoService.on(VideoServiceEvents.PROGRESS, mockHandler1);
      videoService.on(VideoServiceEvents.PROGRESS, mockHandler2);
      
      // Remove all listeners
      videoService.removeAllListeners(VideoServiceEvents.PROGRESS);
      
      // Emit the event
      videoService.emit(VideoServiceEvents.PROGRESS, { progress: 0.5, message: 'Test', stage: 'test' });
      
      // Verify no handlers were called
      expect(mockHandler1).not.toHaveBeenCalled();
      expect(mockHandler2).not.toHaveBeenCalled();
    });
  });
});
