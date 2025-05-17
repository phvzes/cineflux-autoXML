/**
 * VideoService.ts
 * 
 * Service for video file processing, frame extraction, and analysis.
 * This follows the same patterns established in AudioService.
 */

import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import * as cv from '@techstark/opencv-js';
import { v4 as uuidv4 } from 'uuid';

// Types
import {
  VideoFile,
  VideoMetadata,
  VideoAnalysis,
  VideoFrame,
  Scene,
  ContentData,
  ClipType,
  MotionData,
  VideoServiceEvents,
  FrameExtractionOptions,
  SceneDetectionOptions,
} from '../types/video-types';

/**
 * VideoService handles all video file processing, analysis, and manipulation.
 */
export class VideoService {
  private ffmpeg: any;
  private isFFmpegLoaded: boolean = false;
  private eventListeners: Map<VideoServiceEvents, Function[]> = new Map();
  private videoCache: Map<string, VideoFile> = new Map();
  private analysisCache: Map<string, VideoAnalysis> = new Map();
  private frameCache: Map<string, VideoFrame[]> = new Map();
  
  constructor() {
    this.ffmpeg = createFFmpeg({
      log: false,
      corePath: '/assets/ffmpeg-core/ffmpeg-core.js',
    });
    
    // Initialize event listener collections
    Object.values(VideoServiceEvents).forEach(event => {
      this.eventListeners.set(event, []);
    });
  }
  
  /**
   * Ensures FFmpeg is loaded before proceeding
   */
  private async ensureFFmpegLoaded(): Promise<void> {
    if (!this.isFFmpegLoaded) {
      try {
        await this.ffmpeg.load();
        this.isFFmpegLoaded = true;
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        throw new Error('Failed to load video processing library');
      }
    }
  }
  
  /**
   * Loads a video file and creates a blob URL for preview
   * @param file The video File object to load
   * @returns Promise resolving to a VideoFile object
   */
  async loadVideoFile(file: File): Promise<VideoFile> {
    try {
      // Check cache first
      const fileId = file.name + file.size + file.lastModified;
      if (this.videoCache.has(fileId)) {
        return this.videoCache.get(fileId)!;
      }
      
      // Create blob URL for preview
      const blobUrl = URL.createObjectURL(file);
      
      // Extract metadata
      const metadata = await this.extractMetadata(file);
      
      // Generate thumbnail
      const thumbnail = await this.generateThumbnail(file);
      
      const videoFile: VideoFile = {
        id: uuidv4(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        blobUrl,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        fps: metadata.fps,
        thumbnail,
        metadata
      };
      
      // Cache the video file
      this.videoCache.set(fileId, videoFile);
      
      return videoFile;
    } catch (error) {
      console.error('Error loading video file:', error);
      throw new Error(`Failed to load video file: ${error.message}`);
    }
  }
  
  /**
   * Extracts metadata from a video file
   * @param file The video File object
   * @returns Promise resolving to VideoMetadata
   */
  async extractMetadata(file: File): Promise<VideoMetadata> {
    await this.ensureFFmpegLoaded();
    
    try {
      // Write file to FFmpeg virtual file system
      this.ffmpeg.FS('writeFile', file.name, await fetchFile(file));
      
      // Run FFprobe to get video information
      await this.ffmpeg.run(
        '-i', file.name,
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,r_frame_rate,duration',
        '-of', 'json',
        'output.json'
      );
      
      // Read the output
      const data = this.ffmpeg.FS('readFile', 'output.json');
      const json = JSON.parse(new TextDecoder().decode(data));
      
      // Process frame rate (often returned as a fraction like "24000/1001")
      let fps = 30; // default
      if (json.streams[0].r_frame_rate) {
        const fractionMatch = json.streams[0].r_frame_rate.match(/(\d+)\/(\d+)/);
        if (fractionMatch) {
          fps = parseInt(fractionMatch[1], 10) / parseInt(fractionMatch[2], 10);
        } else {
          fps = parseFloat(json.streams[0].r_frame_rate);
        }
      }
      
      // Clean up
      this.ffmpeg.FS('unlink', file.name);
      this.ffmpeg.FS('unlink', 'output.json');
      
      return {
        width: json.streams[0].width || 0,
        height: json.streams[0].height || 0,
        duration: parseFloat(json.streams[0].duration) || 0,
        fps,
        codec: json.streams[0].codec_name || '',
        bitrate: parseInt(json.streams[0].bit_rate, 10) || 0
      };
    } catch (error) {
      console.error('Error extracting video metadata:', error);
      
      // Return default values if metadata extraction fails
      return {
        width: 0,
        height: 0,
        duration: 0,
        fps: 30,
        codec: '',
        bitrate: 0
      };
    }
  }
  
  /**
   * Generates a thumbnail from a video file at a specific time
   * @param file The video File object
   * @param time Time in seconds (default: 1)
   * @returns Promise resolving to a base64 thumbnail image
   */
  async generateThumbnail(file: File, time: number = 1): Promise<string> {
    await this.ensureFFmpegLoaded();
    
    try {
      // Write file to FFmpeg virtual file system
      this.ffmpeg.FS('writeFile', file.name, await fetchFile(file));
      
      // Extract a frame at the specified time
      await this.ffmpeg.run(
        '-ss', time.toString(),
        '-i', file.name,
        '-frames:v', '1',
        '-q:v', '2',
        '-vf', 'scale=300:-1',
        'thumbnail.jpg'
      );
      
      // Read the output
      const data = this.ffmpeg.FS('readFile', 'thumbnail.jpg');
      
      // Convert to base64
      const base64 = btoa(
        Array.from(new Uint8Array(data.buffer))
          .map(b => String.fromCharCode(b))
          .join('')
      );
      
      // Clean up
      this.ffmpeg.FS('unlink', file.name);
      this.ffmpeg.FS('unlink', 'thumbnail.jpg');
      
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Return a placeholder image on error
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAABmJLR0QA/wD/AP+gvaeTAAADqUlEQVR4nO3UMQEAIAzAMMC/5+GiHCQKenXPzAKgcF4HAHyzsIBMYQGZwgIyhQVkCgvIFBaQKSwgU1hAprCATGEBmcICMoUFZAoLyBQWkCksIFNYQKawgExhAZnCAjKFBWQKC8gUFpApLCBTWECmsIBMYQGZwgIyhQVkCgvIFBaQKSwgU1hAprCATGEBmcICMoUFZAoLyBQWkCksIFNYQKawgExhAZnCAjKFBWQKC8gUFpApLCBTWECmsIBMYQGZwgIyhQVkCgvIFBaQKSwgU1hAprCATGEBmcICMoUFZAoLyBQWkCksIFNYQKawgExhAZnCAjKFBWQKC8gUFpApLCBTWECmsIBMYQGZwgIyhQVkCgvIFBaQKSwgU1hAprCATGEBmcICMoUFZAoLyBQWkCksIFNYQKawgExhAZnCAjKFBWQKC8gUFpApLCBTWECmsIBMYQGZwgIyhQVkCgvIFBaQKSwgU1hAprCATGEBmcICMoUFZAoLyBQWkCksIFNYQKawgExhAZnCAjKFBWQKC8gUFpApLCBTWECmsIBMYQGZwgIyhQVkCgvIFBaQKSwgU1hAprCATGEBmcICMoUFZAoLyBQWkCksIFNYQKawgExhAZnCAjKFBWQKC8gUFpApLCBTWECmsIBMYQGZwgIyhQVkCgvIFBaQKSwgU1hAprCATGEBmcICMoUFZAoLyBQWkCksIFNYQKawgExhAZnCAjKFBWQKC8gUFpApLCBTWECmsIBMYQGZwgIyhQVkCgvIFBaQKSwgU1hAprCATGEBmcICMoUFZAoLyBQWkCksIFNYQKawgExhAZnCAjKFBWQKC8gUFpApLCBTWECmsIBMYQGZwgIyhQVkCgvIFBaQKSwgU1hAprCATGEBmcICMoUFZAoLyBQWkCksIFNYQKawgExhAZnCAjKFBWQKC8gUFpApLCBTWECmsIBMYQGZwgIyhQVkCgvIFBaQKSwgU1hAprCATGEBmcICMoUFZAoLyBQWkCksIFNYQKawgExhAZnCAjKFBWQKC8gUFpApLCBTWECmsIBMYQGZwgIyhQVkCgvIFBaQKSwgU1hAprCATGEBmcICMoUFZAoLyBQWkCksIFNYQKawgExhAZnCAjKFBWQKC8gUFpApLCBTWECmsIBMYQGZwgIyhQVkCgvIFBaQKSwgU1hAprCATGEBmcICMoUFZAoLyBQWkCksIFNYQKawgExhAZnCAjKFBWQKC8gUFpApLCBTWECmsIBMYQGZwgIyhQVkCgvIfgwXBrl5bFQUAAAAAElFTkSuQmCC';
    }
  }
  
  /**
   * Analyzes a video file for scenes, content, and motion
   * @param file The video File object to analyze
   * @returns Promise resolving to VideoAnalysis
   */
  async analyzeVideo(file: File): Promise<VideoAnalysis> {
    try {
      // Check cache first
      const fileId = file.name + file.size + file.lastModified;
      if (this.analysisCache.has(fileId)) {
        return this.analysisCache.get(fileId)!;
      }
      
      // Emit start event
      this.emitEvent(VideoServiceEvents.ANALYSIS_START, { file });
      
      // Load the video file
      const videoFile = await this.loadVideoFile(file);
      
      // Extract frames
      this.emitEvent(VideoServiceEvents.PROGRESS, { 
        message: 'Extracting frames...',
        progress: 0.1 
      });
      
      const frames = await this.extractFrames(file, {
        fps: 1, // 1 frame per second for analysis
        maxFrames: 300 // Limit the number of frames for performance
      });
      
      // Detect scenes
      this.emitEvent(VideoServiceEvents.PROGRESS, { 
        message: 'Detecting scenes...',
        progress: 0.4 
      });
      
      const scenes = await this.detectScenes(frames);
      
      // Analyze content
      this.emitEvent(VideoServiceEvents.PROGRESS, { 
        message: 'Analyzing content...',
        progress: 0.7 
      });
      
      const contentAnalysis = await Promise.all(
        scenes.map(scene => this.analyzeContent(frames[scene.startFrame]))
      );
      
      // Analyze motion
      this.emitEvent(VideoServiceEvents.PROGRESS, { 
        message: 'Analyzing motion...',
        progress: 0.9 
      });
      
      const motionData = await this.analyzeMotion(frames);
      
      // Create the analysis result
      const analysis: VideoAnalysis = {
        videoId: videoFile.id,
        duration: videoFile.duration,
        frameCount: frames.length,
        scenes,
        contentAnalysis,
        motionData,
        clipType: await this.classifyClipType({ scenes, contentAnalysis, motionData })
      };
      
      // Cache the analysis
      this.analysisCache.set(fileId, analysis);
      
      // Emit complete event
      this.emitEvent(VideoServiceEvents.ANALYSIS_COMPLETE, { analysis });
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing video:', error);
      
      // Emit error event
      this.emitEvent(VideoServiceEvents.ERROR, { 
        message: `Failed to analyze video: ${error.message}`,
        error 
      });
      
      throw new Error(`Failed to analyze video: ${error.message}`);
    }
  }
  
  /**
   * Extracts frames from a video file for analysis
   * @param file The video File object
   * @param options Frame extraction options
   * @returns Promise resolving to an array of VideoFrame objects
   */
  async extractFrames(
    file: File, 
    options: FrameExtractionOptions = { fps: 1, maxFrames: 300 }
  ): Promise<VideoFrame[]> {
    await this.ensureFFmpegLoaded();
    
    try {
      // Check cache first
      const cacheKey = `${file.name}_${options.fps}_${options.maxFrames}`;
      if (this.frameCache.has(cacheKey)) {
        return this.frameCache.get(cacheKey)!;
      }
      
      // Get video metadata
      const metadata = await this.extractMetadata(file);
      
      // Calculate frameRate and total frames
      const frameRate = options.fps || 1;
      const totalFramesToExtract = Math.min(
        Math.ceil(metadata.duration * frameRate),
        options.maxFrames || 300
      );
      
      // Write file to FFmpeg virtual file system
      this.ffmpeg.FS('writeFile', file.name, await fetchFile(file));
      
      // Extract frames
      await this.ffmpeg.run(
        '-i', file.name,
        '-vf', `fps=${frameRate}`,
        '-frames:v', totalFramesToExtract.toString(),
        '-q:v', '1',
        'frame_%04d.jpg'
      );
      
      // Read frames and convert to VideoFrame objects
      const frames: VideoFrame[] = [];
      
      for (let i = 1; i <= totalFramesToExtract; i++) {
        const frameFileName = `frame_${i.toString().padStart(4, '0')}.jpg`;
        try {
          const frameData = this.ffmpeg.FS('readFile', frameFileName);
          
          // Convert to ImageData using Canvas
          const img = new Image();
          const base64 = btoa(
            Array.from(new Uint8Array(frameData.buffer))
              .map(b => String.fromCharCode(b))
              .join('')
          );
          
          img.src = `data:image/jpeg;base64,${base64}`;
          
          // Wait for image to load
          await new Promise<void>(resolve => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Continue even if image fails to load
          });
          
          // Create canvas and get ImageData
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx!.drawImage(img, 0, 0);
          const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
          
          // Add frame to result
          frames.push({
            index: i - 1,
            time: (i - 1) / frameRate,
            imageData,
            width: img.width,
            height: img.height,
            thumbnail: `data:image/jpeg;base64,${base64}`
          });
          
          // Clean up
          this.ffmpeg.FS('unlink', frameFileName);
        } catch (error) {
          console.warn(`Failed to extract frame ${i}:`, error);
        }
      }
      
      // Clean up
      this.ffmpeg.FS('unlink', file.name);
      
      // Cache the frames
      this.frameCache.set(cacheKey, frames);
      
      return frames;
    } catch (error) {
      console.error('Error extracting frames:', error);
      throw new Error(`Failed to extract frames: ${error.message}`);
    }
  }
  
  /**
   * Detects scene boundaries in a video
   * @param frames Array of VideoFrame objects
   * @param options Scene detection options
   * @returns Promise resolving to an array of Scene objects
   */
  async detectScenes(
    frames: VideoFrame[],
    options: SceneDetectionOptions = { threshold: 30 }
  ): Promise<Scene[]> {
    try {
      const scenes: Scene[] = [];
      
      if (frames.length === 0) {
        return scenes;
      }
      
      // First frame is always a new scene
      scenes.push({
        id: uuidv4(),
        startFrame: 0,
        endFrame: 0,
        startTime: frames[0].time,
        endTime: frames[0].time,
        duration: 0,
        keyFrameIndex: 0
      });
      
      // Calculate difference between consecutive frames
      for (let i = 1; i < frames.length; i++) {
        const prevFrame = frames[i - 1];
        const currentFrame = frames[i];
        
        // Convert to OpenCV format
        const prevMat = cv.matFromImageData(prevFrame.imageData);
        const currentMat = cv.matFromImageData(currentFrame.imageData);
        
        // Convert to grayscale
        const prevGray = new cv.Mat();
        const currentGray = new cv.Mat();
        cv.cvtColor(prevMat, prevGray, cv.COLOR_RGBA2GRAY);
        cv.cvtColor(currentMat, currentGray, cv.COLOR_RGBA2GRAY);
        
        // Calculate absolute difference
        const diff = new cv.Mat();
        cv.absdiff(prevGray, currentGray, diff);
        
        // Calculate mean difference
        const mean = cv.mean(diff);
        const difference = mean[0]; // First channel
        
        // Free memory
        prevMat.delete();
        currentMat.delete();
        prevGray.delete();
        currentGray.delete();
        diff.delete();
        
        // Check if difference exceeds threshold
        if (difference > options.threshold) {
          // End previous scene
          const lastScene = scenes[scenes.length - 1];
          lastScene.endFrame = i - 1;
          lastScene.endTime = prevFrame.time;
          lastScene.duration = lastScene.endTime - lastScene.startTime;
          
          // Start new scene
          scenes.push({
            id: uuidv4(),
            startFrame: i,
            endFrame: i,
            startTime: currentFrame.time,
            endTime: currentFrame.time,
            duration: 0,
            keyFrameIndex: i
          });
        }
      }
      
      // End the last scene
      const lastScene = scenes[scenes.length - 1];
      const lastFrame = frames[frames.length - 1];
      lastScene.endFrame = frames.length - 1;
      lastScene.endTime = lastFrame.time;
      lastScene.duration = lastScene.endTime - lastScene.startTime;
      
      return scenes;
    } catch (error) {
      console.error('Error detecting scenes:', error);
      throw new Error(`Failed to detect scenes: ${error.message}`);
    }
  }
  
  /**
   * Analyzes the content of a video frame
   * @param frame The VideoFrame to analyze
   * @returns Promise resolving to ContentData
   */
  async analyzeContent(frame: VideoFrame): Promise<ContentData> {
    try {
      // Convert to OpenCV format
      const mat = cv.matFromImageData(frame.imageData);
      
      // Default content data
      const contentData: ContentData = {
        hasFaces: false,
        faceCount: 0,
        dominantColors: [],
        brightness: 0,
        contrast: 0,
        hasText: false,
        isOutdoor: false,
        hasMotion: false
      };
      
      // Simple brightness and contrast calculation
      const rgbMat = new cv.Mat();
      cv.cvtColor(mat, rgbMat, cv.COLOR_RGBA2RGB);
      
      const meanStdDev = cv.meanStdDev(rgbMat);
      contentData.brightness = (meanStdDev.mean.data64F[0] + 
                            meanStdDev.mean.data64F[1] + 
                            meanStdDev.mean.data64F[2]) / 3;
      contentData.contrast = (meanStdDev.stddev.data64F[0] + 
                           meanStdDev.stddev.data64F[1] + 
                           meanStdDev.stddev.data64F[2]) / 3;
      
      // Face detection (simplified, should use proper DNN in production)
      try {
        const faceCascade = new cv.CascadeClassifier();
        faceCascade.load('haarcascade_frontalface_default.xml');
        
        const grayMat = new cv.Mat();
        cv.cvtColor(mat, grayMat, cv.COLOR_RGBA2GRAY);
        
        const faces = new cv.RectVector();
        faceCascade.detectMultiScale(grayMat, faces);
        
        contentData.hasFaces = faces.size() > 0;
        contentData.faceCount = faces.size();
        
        // Free memory
        grayMat.delete();
        faces.delete();
      } catch (error) {
        console.warn('Face detection not available:', error);
      }
      
      // Dominant color extraction
      try {
        const pixels = new cv.Mat();
        cv.cvtColor(mat, pixels, cv.COLOR_RGBA2RGB);
        
        // Reshape to a single column of 3-channel pixels
        pixels.convertTo(pixels, cv.CV_32F);
        const samples = pixels.reshape(1, pixels.rows * pixels.cols);
        
        // K-means clustering
        const K = 3; // Number of dominant colors
        const labels = new cv.Mat();
        const criteria = new cv.TermCriteria(
          cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER,
          10,
          1.0
        );
        const attempts = 5;
        const centers = new cv.Mat();
        
        cv.kmeans(
          samples,
          K,
          labels,
          criteria,
          attempts,
          cv.KMEANS_PP_CENTERS,
          centers
        );
        
        // Extract colors from centers
        for (let i = 0; i < K; i++) {
          contentData.dominantColors.push({
            r: Math.round(centers.data32F[i * 3]),
            g: Math.round(centers.data32F[i * 3 + 1]),
            b: Math.round(centers.data32F[i * 3 + 2])
          });
        }
        
        // Free memory
        pixels.delete();
        samples.delete();
        labels.delete();
        centers.delete();
      } catch (error) {
        console.warn('Color extraction not available:', error);
      }
      
      // Free memory
      mat.delete();
      rgbMat.delete();
      
      return contentData;
    } catch (error) {
      console.error('Error analyzing content:', error);
      return {
        hasFaces: false,
        faceCount: 0,
        dominantColors: [],
        brightness: 0,
        contrast: 0,
        hasText: false,
        isOutdoor: false,
        hasMotion: false
      };
    }
  }
  
  /**
   * Analyzes motion across video frames
   * @param frames Array of VideoFrame objects
   * @returns Promise resolving to MotionData
   */
  async analyzeMotion(frames: VideoFrame[]): Promise<MotionData> {
    try {
      // Default motion data
      const motionData: MotionData = {
        averageMotion: 0,
        motionByFrame: [],
        hasHighMotion: false,
        hasCameraMovement: false
      };
      
      if (frames.length < 2) {
        return motionData;
      }
      
      let totalMotion = 0;
      
      // Calculate motion between consecutive frames
      for (let i = 1; i < frames.length; i++) {
        const prevFrame = frames[i - 1];
        const currentFrame = frames[i];
        
        // Convert to OpenCV format
        const prevMat = cv.matFromImageData(prevFrame.imageData);
        const currentMat = cv.matFromImageData(currentFrame.imageData);
        
        // Convert to grayscale
        const prevGray = new cv.Mat();
        const currentGray = new cv.Mat();
        cv.cvtColor(prevMat, prevGray, cv.COLOR_RGBA2GRAY);
        cv.cvtColor(currentMat, currentGray, cv.COLOR_RGBA2GRAY);
        
        // Calculate optical flow using Farneback method
        const flow = new cv.Mat();
        cv.calcOpticalFlowFarneback(
          prevGray, currentGray,
          flow, 0.5, 3, 15, 3, 5, 1.2, 0
        );
        
        // Split flow into x and y components
        const flowParts = new cv.MatVector();
        cv.split(flow, flowParts);
        
        // Calculate magnitude of flow vectors
        const magnitude = new cv.Mat();
        const flowX = flowParts.get(0);
        const flowY = flowParts.get(1);
        cv.magnitude(flowX, flowY, magnitude);
        
        // Calculate mean flow magnitude
        const meanFlow = cv.mean(magnitude)[0];
        totalMotion += meanFlow;
        
        // Add to frame motion data
        motionData.motionByFrame.push({
          frameIndex: i,
          time: currentFrame.time,
          motionAmount: meanFlow
        });
        
        // Free memory
        prevMat.delete();
        currentMat.delete();
        prevGray.delete();
        currentGray.delete();
        flow.delete();
        flowParts.delete();
        flowX.delete();
        flowY.delete();
        magnitude.delete();
      }
      
      // Calculate average motion
      motionData.averageMotion = totalMotion / (frames.length - 1);
      
      // Determine high motion
      motionData.hasHighMotion = motionData.averageMotion > 10;
      
      // Simplified camera movement detection
      // In a real implementation, this would use more sophisticated algorithms
      let consistentDirection = true;
      let previousDirection = 0;
      
      for (let i = 1; i < motionData.motionByFrame.length; i++) {
        const currentMotion = motionData.motionByFrame[i].motionAmount;
        const prevMotion = motionData.motionByFrame[i - 1].motionAmount;
        
        const direction = Math.sign(currentMotion - prevMotion);
        
        if (i > 1 && direction !== 0 && direction !== previousDirection) {
          consistentDirection = false;
          break;
        }
        
        if (direction !== 0) {
          previousDirection = direction;
        }
      }
      
      motionData.hasCameraMovement = consistentDirection && motionData.averageMotion > 5;
      
      return motionData;
    } catch (error) {
      console.error('Error analyzing motion:', error);
      return {
        averageMotion: 0,
        motionByFrame: [],
        hasHighMotion: false,
        hasCameraMovement: false
      };
    }
  }
  
  /**
   * Classifies the type of video clip based on analysis
   * @param analysis Video analysis data
   * @returns Promise resolving to ClipType
   */
  async classifyClipType(analysis: Partial<VideoAnalysis>): Promise<ClipType> {
    try {
      // Simple classification logic
      // In a real implementation, this would use more sophisticated ML algorithms
      
      const { contentAnalysis, motionData } = analysis;
      
      if (!contentAnalysis || !motionData) {
        return ClipType.UNKNOWN;
      }
      
      // Check for faces (likely performance clip)
      const hasFaces = contentAnalysis.some(content => content.hasFaces);
      
      // Check for high motion
      const hasHighMotion = motionData.hasHighMotion;
      
      // Simple classification rules
      if (hasFaces && !hasHighMotion) {
        return ClipType.PERFORMANCE;
      } else if (hasFaces && hasHighMotion) {
        return ClipType.ACTION;
      } else if (!hasFaces && hasHighMotion) {
        return ClipType.B_ROLL_DYNAMIC;
      } else {
        return ClipType.B_ROLL_STATIC;
      }
    } catch (error) {
      console.error('Error classifying clip type:', error);
      return ClipType.UNKNOWN;
    }
  }
  
  /**
   * Disposes of resources and clears caches
   */
  dispose(): void {
    this.videoCache.clear();
    this.analysisCache.clear();
    this.frameCache.clear();
    this.eventListeners.clear();
  }
  
  /**
   * Adds an event listener for VideoService events
   * @param event The event to listen for
   * @param callback Callback function to execute when event occurs
   */
  addEventListener(event: VideoServiceEvents, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }
  
  /**
   * Removes an event listener
   * @param event The event the listener was registered for
   * @param callback The callback function to remove
   */
  removeEventListener(event: VideoServiceEvents, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    const filteredListeners = listeners.filter(listener => listener !== callback);
    this.eventListeners.set(event, filteredListeners);
  }
  
  /**
   * Emits an event to all registered listeners
   * @param event The event to emit
   * @param data Data to pass to listeners
   */
  private emitEvent(event: VideoServiceEvents, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

// Export singleton instance
const videoService = new VideoService();
export default videoService;