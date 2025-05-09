/**
 * VideoService.test.ts
 * 
 * Unit tests for the VideoService
 */

import { vi, describe, it, expect, beforeEach, afterEach, MockInstance } from 'vitest';
import { VideoService } from '../VideoService';
import { ClipType, VideoServiceEvents } from '../../types/video-types';
import { safeStringify } from '../../utils/safeStringify';

// Mock dependencies
vi.mock('@ffmpeg/ffmpeg', () => {
  return {
    createFFmpeg: () => ({
      load: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockResolvedValue(undefined),
      FS: vi.fn().mockImplementation((cmd, fileName, data) => {
        if (cmd === 'readFile') {
          if (fileName === 'output.json') {
            return new TextEncoder().encode(safeStringify({
              streams: [{
                width: 1920,
                height: 1080,
                duration: '60.0',
                r_frame_rate: '30/1',
                codec_name: 'h264',
                bit_rate: '5000000'
              }]
            }));
          } else if (fileName === 'thumbnail.jpg') {
            return new Uint8Array([1, 2, 3]); // Mock image data
          }
        }
        return undefined;
      })
    }),
    fetchFile: vi.fn().mockResolvedValue(new Uint8Array())
  };
});

vi.mock('@techstark/opencv-js', () => {
  return {
    Mat: function() {
      return {
        delete: vi.fn()
      };
    },
    matFromImageData: vi.fn().mockReturnValue({
      delete: vi.fn()
    }),
    cvtColor: vi.fn(),
    absdiff: vi.fn(),
    mean: vi.fn().mockReturnValue([10]),
    meanStdDev: vi.fn().mockReturnValue({
      mean: { data64F: [128, 128, 128] },
      stddev: { data64F: [40, 40, 40] }
    }),
    CascadeClassifier: function() {
      return {
        load: vi.fn(),
        detectMultiScale: vi.fn()
      };
    },
    RectVector: function() {
      return {
        size: vi.fn().mockReturnValue(0),
        delete: vi.fn()
      };
    },
    split: vi.fn(),
    magnitude: vi.fn(),
    calcOpticalFlowFarneback: vi.fn(),
    MatVector: function() {
      return {
        get: vi.fn().mockReturnValue({
          delete: vi.fn()
        }),
        delete: vi.fn()
      };
    },
    CV_32F: 0,
    TermCriteria: function() {
      return {};
    },
    TermCriteria_EPS: 1,
    TermCriteria_MAX_ITER: 2,
    KMEANS_PP_CENTERS: 0,
    kmeans: vi.fn(),
    COLOR_RGBA2GRAY: 0,
    COLOR_RGBA2RGB: 0
  };
});

// Mock the global Image constructor
class MockImage {
  width = 1920;
  height = 1080;
  onload: () => void = () => {};
  onerror: () => void = () => {};
  src = '';
  
  constructor() {
    setTimeout(() => this.onload(), 0);
  }
}

global.Image = MockImage as any;

// Mock canvas
const mockCanvasContext = {
  drawImage: vi.fn(),
  getImageData: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray(1920 * 1080 * 4),
    width: 1920,
    height: 1080
  })
};

const mockCanvas = {
  getContext: vi.fn().mockReturnValue(mockCanvasContext),
  width: 1920,
  height: 1080
};

global.document.createElement = vi.fn().mockImplementation((tag) => {
  if (tag === 'canvas') {
    return mockCanvas;
  }
  return {} as any;
});

// Create a mock File object
const createMockFile = () => {
  return new File(
    [new ArrayBuffer(1024)],
    'test-video.mp4',
    { type: 'video/mp4' }
  );
};

// Create mock frames for testing
const createMockFrames = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    time: i / 30, // Assuming 30fps
    imageData: {
      data: new Uint8ClampedArray(1920 * 1080 * 4),
      width: 1920,
      height: 1080
    } as ImageData,
    width: 1920,
    height: 1080,
    thumbnail: `data:image/jpeg;base64,mockBase64Data${i}`
  }));
};

describe('VideoService', () => {
  let videoService: VideoService;
  let mockEventListener: MockInstance;
  
  beforeEach(() => {
    videoService = new VideoService();
    mockEventListener = vi.fn();
    
    // Reset URL.createObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    
    // Clear all mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('loadVideoFile', () => {
    it('should load a video file and extract metadata', async () => {
      const file = createMockFile();
      
      const result = await videoService.loadVideoFile(file);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('test-video.mp4');
      expect(result.blobUrl).toBe('blob:mock-url');
      expect(result.duration).toBe(60);
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
      expect(result.fps).toBe(30);
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    });
    
    it('should cache video files to avoid duplicate processing', async () => {
      const file = createMockFile();
      
      await videoService.loadVideoFile(file);
      const extractMetadataSpy = vi.spyOn(videoService, 'extractMetadata');
      await videoService.loadVideoFile(file);
      
      expect(extractMetadataSpy).not.toHaveBeenCalled();
    });
    
    it('should handle errors during video loading', async () => {
      const file = createMockFile();
      
      vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
        throw new Error('Mock error');
      });
      
      await expect(videoService.loadVideoFile(file)).rejects.toThrow('Failed to load video file');
    });
  });
  
  describe('extractMetadata', () => {
    it('should extract metadata from a video file', async () => {
      const file = createMockFile();
      
      const metadata = await videoService.extractMetadata(file);
      
      expect(metadata).toBeDefined();
      expect(metadata.width).toBe(1920);
      expect(metadata.height).toBe(1080);
      expect(metadata.duration).toBe(60);
      expect(metadata.fps).toBe(30);
      expect(metadata.codec).toBe('h264');
      expect(metadata.bitrate).toBe(5000000);
    });
    
    it('should handle fraction frame rates', async () => {
      const file = createMockFile();
      
      // Mock ffmpeg output with fraction frame rate
      const ffmpegFsSpy = vi.spyOn(videoService['ffmpeg'], 'FS');
      ffmpegFsSpy.mockImplementation((cmd, fileName) => {
        if (cmd === 'readFile' && fileName === 'output.json') {
          return new TextEncoder().encode(safeStringify({
            streams: [{
              width: 1920,
              height: 1080,
              duration: '60.0',
              r_frame_rate: '24000/1001', // 23.976 fps
              codec_name: 'h264',
              bit_rate: '5000000'
            }]
          }));
        }
        return undefined;
      });
      
      const metadata = await videoService.extractMetadata(file);
      
      expect(metadata.fps).toBeCloseTo(23.976, 2);
    });
    
    it('should return default values if metadata extraction fails', async () => {
      const file = createMockFile();
      
      // Mock ffmpeg run to throw an error
      vi.spyOn(videoService['ffmpeg'], 'run').mockRejectedValue(new Error('Mock error'));
      
      const metadata = await videoService.extractMetadata(file);
      
      expect(metadata).toBeDefined();
      expect(metadata.width).toBe(0);
      expect(metadata.height).toBe(0);
      expect(metadata.duration).toBe(0);
      expect(metadata.fps).toBe(30);
      expect(metadata.codec).toBe('');
      expect(metadata.bitrate).toBe(0);
    });
  });
  
  describe('generateThumbnail', () => {
    it('should generate a thumbnail from a video file', async () => {
      const file = createMockFile();
      
      const thumbnail = await videoService.generateThumbnail(file);
      
      expect(thumbnail).toMatch(/^data:image\/jpeg;base64,/);
      expect(videoService['ffmpeg'].run).toHaveBeenCalledWith(
        '-ss', '1',
        '-i', 'test-video.mp4',
        '-frames:v', '1',
        '-q:v', '2',
        '-vf', 'scale=300:-1',
        'thumbnail.jpg'
      );
    });
    
    it('should use the specified time for thumbnail generation', async () => {
      const file = createMockFile();
      const time = 30;
      
      await videoService.generateThumbnail(file, time);
      
      expect(videoService['ffmpeg'].run).toHaveBeenCalledWith(
        '-ss', '30',
        '-i', 'test-video.mp4',
        '-frames:v', '1',
        '-q:v', '2',
        '-vf', 'scale=300:-1',
        'thumbnail.jpg'
      );
    });
    
    it('should return a placeholder image if thumbnail generation fails', async () => {
      const file = createMockFile();
      
      // Mock ffmpeg run to throw an error
      vi.spyOn(videoService['ffmpeg'], 'run').mockRejectedValue(new Error('Mock error'));
      
      const thumbnail = await videoService.generateThumbnail(file);
      
      expect(thumbnail).toMatch(/^data:image\/png;base64,/);
    });
  });
  
  describe('analyzeVideo', () => {
    it('should analyze a video file and return results', async () => {
      const file = createMockFile();
      
      // Register event listener
      videoService.addEventListener(VideoServiceEvents.ANALYSIS_COMPLETE, mockEventListener);
      
      // Mock dependencies
      vi.spyOn(videoService, 'loadVideoFile').mockResolvedValue({
        id: 'mock-id',
        file,
        name: 'test-video.mp4',
        size: 1024,
        type: 'video/mp4',
        blobUrl: 'blob:mock-url',
        duration: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        thumbnail: 'data:image/jpeg;base64,mockBase64Data',
        metadata: {
          width: 1920,
          height: 1080,
          duration: 60,
          fps: 30,
          codec: 'h264',
          bitrate: 5000000
        }
      });
      
      vi.spyOn(videoService, 'extractFrames').mockResolvedValue(createMockFrames(10));
      vi.spyOn(videoService, 'detectScenes').mockResolvedValue([
        {
          id: 'scene-1',
          startFrame: 0,
          endFrame: 4,
          startTime: 0,
          endTime: 4 / 30,
          duration: 4 / 30,
          keyFrameIndex: 0
        },
        {
          id: 'scene-2',
          startFrame: 5,
          endFrame: 9,
          startTime: 5 / 30,
          endTime: 9 / 30,
          duration: 4 / 30,
          keyFrameIndex: 5
        }
      ]);
      
      vi.spyOn(videoService, 'analyzeContent').mockResolvedValue({
        hasFaces: false,
        faceCount: 0,
        dominantColors: [
          { r: 100, g: 100, b: 100 },
          { r: 200, g: 200, b: 200 }
        ],
        brightness: 128,
        contrast: 40,
        hasText: false,
        isOutdoor: false,
        hasMotion: false
      });
      
      vi.spyOn(videoService, 'analyzeMotion').mockResolvedValue({
        averageMotion: 5,
        motionByFrame: [
          { frameIndex: 1, time: 1 / 30, motionAmount: 5 },
          { frameIndex: 2, time: 2 / 30, motionAmount: 5 }
        ],
        hasHighMotion: false,
        hasCameraMovement: false
      });
      
      vi.spyOn(videoService, 'classifyClipType').mockResolvedValue(ClipType.B_ROLL_STATIC);
      
      const analysis = await videoService.analyzeVideo(file);
      
      expect(analysis).toBeDefined();
      expect(analysis.videoId).toBe('mock-id');
      expect(analysis.duration).toBe(60);
      expect(analysis.frameCount).toBe(10);
      expect(analysis.scenes).toHaveLength(2);
      expect(analysis.contentAnalysis).toBeDefined();
      expect(analysis.motionData).toBeDefined();
      expect(analysis.clipType).toBe(ClipType.B_ROLL_STATIC);
      
      // Check events
      expect(mockEventListener).toHaveBeenCalledWith({ analysis });
    });
    
    it('should emit progress events during analysis', async () => {
      const file = createMockFile();
      const progressListener = vi.fn();
      
      // Register event listener
      videoService.addEventListener(VideoServiceEvents.PROGRESS, progressListener);
      
      // Mock dependencies as in the previous test
      vi.spyOn(videoService, 'loadVideoFile').mockResolvedValue({
        id: 'mock-id',
        file,
        name: 'test-video.mp4',
        size: 1024,
        type: 'video/mp4',
        blobUrl: 'blob:mock-url',
        duration: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        thumbnail: 'data:image/jpeg;base64,mockBase64Data',
        metadata: {
          width: 1920,
          height: 1080,
          duration: 60,
          fps: 30,
          codec: 'h264',
          bitrate: 5000000
        }
      });
      
      vi.spyOn(videoService, 'extractFrames').mockResolvedValue(createMockFrames(10));
      vi.spyOn(videoService, 'detectScenes').mockResolvedValue([]);
      vi.spyOn(videoService, 'analyzeContent').mockResolvedValue({
        hasFaces: false,
        faceCount: 0,
        dominantColors: [],
        brightness: 0,
        contrast: 0,
        hasText: false,
        isOutdoor: false,
        hasMotion: false
      });
      vi.spyOn(videoService, 'analyzeMotion').mockResolvedValue({
        averageMotion: 0,
        motionByFrame: [],
        hasHighMotion: false,
        hasCameraMovement: false
      });
      vi.spyOn(videoService, 'classifyClipType').mockResolvedValue(ClipType.UNKNOWN);
      
      await videoService.analyzeVideo(file);
      
      // Check progress events
      expect(progressListener).toHaveBeenCalledTimes(3);
      expect(progressListener).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 0.1, message: 'Extracting frames...' })
      );
      expect(progressListener).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 0.4, message: 'Detecting scenes...' })
      );
      expect(progressListener).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 0.7, message: 'Analyzing content...' })
      );
    });
    
    it('should cache analysis results for subsequent calls', async () => {
      const file = createMockFile();
      
      // Mock dependencies
      vi.spyOn(videoService, 'loadVideoFile').mockResolvedValue({
        id: 'mock-id',
        file,
        name: 'test-video.mp4',
        size: 1024,
        type: 'video/mp4',
        blobUrl: 'blob:mock-url',
        duration: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        thumbnail: 'data:image/jpeg;base64,mockBase64Data',
        metadata: {
          width: 1920,
          height: 1080,
          duration: 60,
          fps: 30,
          codec: 'h264',
          bitrate: 5000000
        }
      });
      vi.spyOn(videoService, 'extractFrames').mockResolvedValue(createMockFrames(10));
      vi.spyOn(videoService, 'detectScenes').mockResolvedValue([]);
      vi.spyOn(videoService, 'analyzeContent').mockResolvedValue({
        hasFaces: false,
        faceCount: 0,
        dominantColors: [],
        brightness: 0,
        contrast: 0,
        hasText: false,
        isOutdoor: false,
        hasMotion: false
      });
      vi.spyOn(videoService, 'analyzeMotion').mockResolvedValue({
        averageMotion: 0,
        motionByFrame: [],
        hasHighMotion: false,
        hasCameraMovement: false
      });
      vi.spyOn(videoService, 'classifyClipType').mockResolvedValue(ClipType.UNKNOWN);
      
      await videoService.analyzeVideo(file);
      
      // Clear mocks and call again
      vi.clearAllMocks();
      
      await videoService.analyzeVideo(file);
      
      // The actual analysis methods should not be called again
      expect(videoService.extractFrames).not.toHaveBeenCalled();
      expect(videoService.detectScenes).not.toHaveBeenCalled();
      expect(videoService.analyzeContent).not.toHaveBeenCalled();
      expect(videoService.analyzeMotion).not.toHaveBeenCalled();
      expect(videoService.classifyClipType).not.toHaveBeenCalled();
    });
    
    it('should handle errors during analysis', async () => {
      const file = createMockFile();
      const errorListener = vi.fn();
      
      // Register event listener
      videoService.addEventListener(VideoServiceEvents.ERROR, errorListener);
      
      // Mock loadVideoFile to throw
      vi.spyOn(videoService, 'loadVideoFile').mockRejectedValue(new Error('Mock error'));
      
      await expect(videoService.analyzeVideo(file)).rejects.toThrow('Failed to analyze video');
      
      // Check error event
      expect(errorListener).toHaveBeenCalledWith({
        message: 'Failed to analyze video: Mock error',
        error: expect.any(Error)
      });
    });
  });
  
  describe('extractFrames', () => {
    it('should extract frames from a video file', async () => {
      const file = createMockFile();
      
      const frames = await videoService.extractFrames(file);
      
      expect(frames).toBeDefined();
      expect(frames.length).toBeGreaterThan(0);
      expect(frames[0]).toHaveProperty('index', 0);
      expect(frames[0]).toHaveProperty('time', 0);
      expect(frames[0]).toHaveProperty('imageData');
      expect(frames[0]).toHaveProperty('width', 1920);
      expect(frames[0]).toHaveProperty('height', 1080);
      expect(frames[0]).toHaveProperty('thumbnail');
    });
    
    it('should respect the fps and maxFrames options', async () => {
      const file = createMockFile();
      const options = { fps: 2, maxFrames: 5 };
      
      await videoService.extractFrames(file, options);
      
      expect(videoService['ffmpeg'].run).toHaveBeenCalledWith(
        '-i', 'test-video.mp4',
        '-vf', 'fps=2',
        '-frames:v', '5',
        '-q:v', '1',
        'frame_%04d.jpg'
      );
    });
    
    it('should cache frames for subsequent calls', async () => {
      const file = createMockFile();
      const options = { fps: 1, maxFrames: 300 };
      
      await videoService.extractFrames(file, options);
      
      // Clear mocks and call again with same parameters
      vi.clearAllMocks();
      
      await videoService.extractFrames(file, options);
      
      // ffmpeg should not be called again
      expect(videoService['ffmpeg'].run).not.toHaveBeenCalled();
    });
    
    it('should handle errors during frame extraction', async () => {
      const file = createMockFile();
      
      // Mock ffmpeg run to throw
      vi.spyOn(videoService['ffmpeg'], 'run').mockRejectedValue(new Error('Mock error'));
      
      await expect(videoService.extractFrames(file)).rejects.toThrow('Failed to extract frames');
    });
  });
  
  describe('detectScenes', () => {
    it('should detect scenes in video frames', async () => {
      const frames = createMockFrames(10);
      
      const scenes = await videoService.detectScenes(frames);
      
      expect(scenes).toBeDefined();
      expect(scenes.length).toBeGreaterThanOrEqual(1); // At least the first scene
      expect(scenes[0]).toHaveProperty('id');
      expect(scenes[0]).toHaveProperty('startFrame', 0);
      expect(scenes[0]).toHaveProperty('startTime', 0);
    });
    
    it('should detect scene changes based on threshold', async () => {
      const frames = createMockFrames(10);
      
      // Mock the difference calculation to create a scene change
      vi.spyOn(require('@techstark/opencv-js'), 'mean')
        .mockReturnValueOnce([5]) // Below threshold
        .mockReturnValueOnce([5]) // Below threshold
        .mockReturnValueOnce([40]) // Above threshold (new scene)
        .mockReturnValueOnce([5]) // Below threshold
        .mockReturnValue([5]); // Below threshold
      
      const scenes = await videoService.detectScenes(frames, { threshold: 30 });
      
      expect(scenes.length).toBe(2); // Initial scene + one scene change
      expect(scenes[0].startFrame).toBe(0);
      expect(scenes[0].endFrame).toBe(2);
      expect(scenes[1].startFrame).toBe(3);
    });
    
    it('should return empty array if no frames are provided', async () => {
      const scenes = await videoService.detectScenes([]);
      
      expect(scenes).toEqual([]);
    });
    
    it('should handle errors during scene detection', async () => {
      const frames = createMockFrames(10);
      
      // Mock matFromImageData to throw
      vi.spyOn(require('@techstark/opencv-js'), 'matFromImageData')
        .mockImplementation(() => {
          throw new Error('Mock error');
        });
      
      await expect(videoService.detectScenes(frames)).rejects.toThrow('Failed to detect scenes');
    });
  });
  
  describe('analyzeContent', () => {
    it('should analyze content of a video frame', async () => {
      const frame = createMockFrames(1)[0];
      
      const contentData = await videoService.analyzeContent(frame);
      
      expect(contentData).toBeDefined();
      expect(contentData).toHaveProperty('brightness');
      expect(contentData).toHaveProperty('contrast');
      expect(contentData).toHaveProperty('hasFaces');
      expect(contentData).toHaveProperty('dominantColors');
    });
    
    it('should handle errors and return default values', async () => {
      const frame = createMockFrames(1)[0];
      
      // Mock matFromImageData to throw
      vi.spyOn(require('@techstark/opencv-js'), 'matFromImageData')
        .mockImplementation(() => {
          throw new Error('Mock error');
        });
      
      const contentData = await videoService.analyzeContent(frame);
      
      expect(contentData).toBeDefined();
      expect(contentData).toEqual({
        hasFaces: false,
        faceCount: 0,
        dominantColors: [],
        brightness: 0,
        contrast: 0,
        hasText: false,
        isOutdoor: false,
        hasMotion: false
      });
    });
  });
  
  describe('analyzeMotion', () => {
    it('should analyze motion across video frames', async () => {
      const frames = createMockFrames(5);
      
      const motionData = await videoService.analyzeMotion(frames);
      
      expect(motionData).toBeDefined();
      expect(motionData).toHaveProperty('averageMotion');
      expect(motionData).toHaveProperty('motionByFrame');
      expect(motionData).toHaveProperty('hasHighMotion');
      expect(motionData).toHaveProperty('hasCameraMovement');
    });
    
    it('should return default values if less than 2 frames are provided', async () => {
      const frames = createMockFrames(1);
      
      const motionData = await videoService.analyzeMotion(frames);
      
      expect(motionData).toEqual({
        averageMotion: 0,
        motionByFrame: [],
        hasHighMotion: false,
        hasCameraMovement: false
      });
    });
    
    it('should handle errors and return default values', async () => {
      const frames = createMockFrames(5);
      
      // Mock matFromImageData to throw
      vi.spyOn(require('@techstark/opencv-js'), 'matFromImageData')
        .mockImplementation(() => {
          throw new Error('Mock error');
        });
      
      const motionData = await videoService.analyzeMotion(frames);
      
      expect(motionData).toEqual({
        averageMotion: 0,
        motionByFrame: [],
        hasHighMotion: false,
        hasCameraMovement: false
      });
    });
  });
  
  describe('classifyClipType', () => {
    it('should classify clip type based on analysis', async () => {
      const analysis = {
        contentAnalysis: [
          { hasFaces: true, faceCount: 1, dominantColors: [], brightness: 0, contrast: 0, hasText: false, isOutdoor: false, hasMotion: false }
        ],
        motionData: {
          hasHighMotion: true,
          averageMotion: 15,
          motionByFrame: [],
          hasCameraMovement: false
        }
      };
      
      const clipType = await videoService.classifyClipType(analysis);
      
      expect(clipType).toBe(ClipType.ACTION); // Faces + high motion = action
    });
    
    it('should classify as PERFORMANCE when faces present but low motion', async () => {
      const analysis = {
        contentAnalysis: [
          { hasFaces: true, faceCount: 1, dominantColors: [], brightness: 0, contrast: 0, hasText: false, isOutdoor: false, hasMotion: false }
        ],
        motionData: {
          hasHighMotion: false,
          averageMotion: 5,
          motionByFrame: [],
          hasCameraMovement: false
        }
      };
      
      const clipType = await videoService.classifyClipType(analysis);
      
      expect(clipType).toBe(ClipType.PERFORMANCE);
    });
    
    it('should classify as B_ROLL_DYNAMIC when no faces but high motion', async () => {
      const analysis = {
        contentAnalysis: [
          { hasFaces: false, faceCount: 0, dominantColors: [], brightness: 0, contrast: 0, hasText: false, isOutdoor: false, hasMotion: false }
        ],
        motionData: {
          hasHighMotion: true,
          averageMotion: 15,
          motionByFrame: [],
          hasCameraMovement: false
        }
      };
      
      const clipType = await videoService.classifyClipType(analysis);
      
      expect(clipType).toBe(ClipType.B_ROLL_DYNAMIC);
    });
    
    it('should classify as B_ROLL_STATIC when no faces and low motion', async () => {
      const analysis = {
        contentAnalysis: [
          { hasFaces: false, faceCount: 0, dominantColors: [], brightness: 0, contrast: 0, hasText: false, isOutdoor: false, hasMotion: false }
        ],
        motionData: {
          hasHighMotion: false,
          averageMotion: 5,
          motionByFrame: [],
          hasCameraMovement: false
        }
      };
      
      const clipType = await videoService.classifyClipType(analysis);
      
      expect(clipType).toBe(ClipType.B_ROLL_STATIC);
    });
    
    it('should return UNKNOWN if contentAnalysis or motionData are missing', async () => {
      const analysis = {};
      
      const clipType = await videoService.classifyClipType(analysis);
      
      expect(clipType).toBe(ClipType.UNKNOWN);
    });
    
    it('should handle errors and return UNKNOWN', async () => {
      const analysis = {
        contentAnalysis: [
          { hasFaces: true, faceCount: 1, dominantColors: [], brightness: 0, contrast: 0, hasText: false, isOutdoor: false, hasMotion: false }
        ],
        motionData: {
          hasHighMotion: true,
          averageMotion: 15,
          motionByFrame: [],
          hasCameraMovement: false
        }
      };
      
      // Mock implementation to throw
      vi.spyOn(analysis.contentAnalysis, 'some').mockImplementation(() => {
        throw new Error('Mock error');
      });
      
      const clipType = await videoService.classifyClipType(analysis);
      
      expect(clipType).toBe(ClipType.UNKNOWN);
    });
  });
  
  describe('event listeners', () => {
    it('should add and remove event listeners', () => {
      const listener = vi.fn();
      
      videoService.addEventListener(VideoServiceEvents.ANALYSIS_START, listener);
      
      // Emit event
      videoService['emitEvent'](VideoServiceEvents.ANALYSIS_START, { file: createMockFile() });
      
      expect(listener).toHaveBeenCalled();
      
      // Remove listener
      videoService.removeEventListener(VideoServiceEvents.ANALYSIS_START, listener);
      
      // Clear mock and emit again
      listener.mockClear();
      videoService['emitEvent'](VideoServiceEvents.ANALYSIS_START, { file: createMockFile() });
      
      expect(listener).not.toHaveBeenCalled();
    });
    
    it('should handle errors in event listeners', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const listener = vi.fn().mockImplementation(() => {
        throw new Error('Mock error in listener');
      });
      
      videoService.addEventListener(VideoServiceEvents.ANALYSIS_START, listener);
      
      // Emit event
      videoService['emitEvent'](VideoServiceEvents.ANALYSIS_START, { file: createMockFile() });
      
      expect(listener).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in event listener'),
        expect.any(Error)
      );
    });
  });
  
  describe('dispose', () => {
    it('should clear all caches and event listeners', () => {
      const listener = vi.fn();
      videoService.addEventListener(VideoServiceEvents.ANALYSIS_START, listener);
      
      // Add items to caches
      videoService['videoCache'].set('test', {} as any);
      videoService['analysisCache'].set('test', {} as any);
      videoService['frameCache'].set('test', [] as any);
      
      videoService.dispose();
      
      expect(videoService['videoCache'].size).toBe(0);
      expect(videoService['analysisCache'].size).toBe(0);
      expect(videoService['frameCache'].size).toBe(0);
      expect(videoService['eventListeners'].get(VideoServiceEvents.ANALYSIS_START)).toEqual([]);
      
      // Emit event to confirm listener is gone
      videoService['emitEvent'](VideoServiceEvents.ANALYSIS_START, { file: createMockFile() });
      
      expect(listener).not.toHaveBeenCalled();
    });
  });
});