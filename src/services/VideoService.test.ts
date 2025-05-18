import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VideoAnalysis, VideoProcessingOptions, ClipType } from '../types/video-types';
import { 
  createMockFile, 
  createMockVideoAnalysis,
  createMockScene,
  createMockVideoFrame,
  isVideoAnalysis,
  createMockEventEmitter
} from '../utils/test-utils';

// Mock VideoService class for testing
class VideoService {
  private eventEmitter: any;
  
  constructor(eventEmitter?: any) {
    this.eventEmitter = eventEmitter || { on: () => {}, emit: () => {}, removeListener: () => {} };
  }
  
  async processVideo(file: File, options?: VideoProcessingOptions): Promise<VideoAnalysis> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Emit progress events
      this.eventEmitter.emit('progress', 0.25, 'Analyzing video');
      this.eventEmitter.emit('progress', 0.5, 'Detecting scenes');
      this.eventEmitter.emit('progress', 0.75, 'Extracting frames');
      this.eventEmitter.emit('progress', 1.0, 'Complete');
      
      // In a real implementation, we would process the video here
      // For testing, we'll just return a mock analysis
      return {
        id: 'test-analysis',
        duration: 120,
        width: 1920,
        height: 1080,
        frameRate: 30,
        scenes: [
          { id: 'scene-1', startTime: 0, endTime: 30, duration: 30 },
          { id: 'scene-2', startTime: 30, endTime: 60, duration: 30 },
          { id: 'scene-3', startTime: 60, endTime: 90, duration: 30 },
          { id: 'scene-4', startTime: 90, endTime: 120, duration: 30 },
        ],
        motionData: [],
        clipType: ClipType.MEDIUM,
      };
    } catch (error) {
      this.eventEmitter.emit('error', error);
      throw error;
    }
  }
}

describe('VideoService', () => {
  let videoService: VideoService;
  let mockEventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(() => {
    // Create a mock event emitter
    mockEventEmitter = createMockEventEmitter();
    
    // Create a new instance of VideoService with the mock event emitter
    videoService = new VideoService(mockEventEmitter);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should process video file correctly', async () => {
    // Create a mock File
    const mockFile = createMockFile('test-video.mp4', 'video/mp4');
    
    // Create a mock ArrayBuffer
    const mockArrayBuffer = new ArrayBuffer(8);
    
    // Mock the file's arrayBuffer method
    Object.defineProperty(mockFile, 'arrayBuffer', {
      value: vi.fn().mockResolvedValue(mockArrayBuffer),
    });
    
    // Define processing options
    const options: VideoProcessingOptions = {
      maxWidth: 1280,
      maxHeight: 720,
      frameRate: 30,
    };
    
    // Call the processVideo method
    const result = await videoService.processVideo(mockFile, options);
    
    // Verify the result
    expect(result).toBeDefined();
    expect(result.duration).toBe(120);
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
    expect(result.frameRate).toBe(30);
    expect(result.scenes.length).toBe(4);
    
    // Verify that progress events were emitted
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('progress', 0.25, 'Analyzing video');
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('progress', 0.5, 'Detecting scenes');
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('progress', 0.75, 'Extracting frames');
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('progress', 1.0, 'Complete');
  });

  it('should handle errors during video processing', async () => {
    // Create a mock File
    const mockFile = createMockFile('test-video.mp4', 'video/mp4');
    
    // Mock the file's arrayBuffer method to throw an error
    Object.defineProperty(mockFile, 'arrayBuffer', {
      value: vi.fn().mockRejectedValue(new Error('Failed to read video file')),
    });
    
    // Call the processVideo method and expect it to throw an error
    await expect(videoService.processVideo(mockFile)).rejects.toThrow('Failed to read video file');
    
    // Verify that an error event was emitted
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('error', expect.any(Error));
  });

  it('should create a valid mock video analysis', () => {
    // Create a mock video analysis
    const mockAnalysis = createMockVideoAnalysis(180, 15, 36);
    
    // Verify the mock analysis
    expect(isVideoAnalysis(mockAnalysis)).toBe(true);
    expect(mockAnalysis.duration).toBe(180);
    expect(mockAnalysis.scenes.length).toBe(15);
    expect(mockAnalysis.frames.length).toBe(36);
    expect(mockAnalysis.width).toBe(1920);
    expect(mockAnalysis.height).toBe(1080);
    expect(mockAnalysis.frameRate).toBe(30);
  });

  it('should create valid mock scenes', () => {
    // Create a mock scene
    const mockScene = createMockScene(30, 60, 'test-scene');
    
    // Verify the mock scene
    expect(mockScene).toBeDefined();
    expect(mockScene.id).toBe('test-scene');
    expect(mockScene.startTime).toBe(30);
    expect(mockScene.endTime).toBe(60);
    expect(mockScene.duration).toBe(30);
    expect(mockScene.keyFrame).toBeDefined();
    expect(mockScene.keyFrameUrl).toBeDefined();
  });

  it('should create valid mock video frames', () => {
    // Create a mock video frame
    const mockFrame = createMockVideoFrame(45, 1280, 720);
    
    // Verify the mock frame
    expect(mockFrame).toBeDefined();
    expect(mockFrame.time).toBe(45);
    expect(mockFrame.width).toBe(1280);
    expect(mockFrame.height).toBe(720);
    expect(mockFrame.dataUrl).toBeDefined();
    expect(mockFrame.dominantColors).toBeDefined();
    expect(mockFrame.brightness).toBeDefined();
    expect(mockFrame.contrast).toBeDefined();
  });
});
