/**
 * Web Worker for video processing
 * This worker offloads CPU-intensive video processing tasks from the main thread
 */

// Define worker context type
const ctx: Worker = self as any;

// Import types
import { VideoAnalysis, VideoProcessingProgress, VideoChunkProgress } from '../services/VideoService';
import { ChunkProgress } from '../utils/fileChunker';

// Message types
export enum VideoWorkerMessageType {
  ANALYZE_VIDEO = 'ANALYZE_VIDEO',
  EXTRACT_FRAMES = 'EXTRACT_FRAMES',
  DETECT_SCENES = 'DETECT_SCENES',
  ANALYZE_CONTENT = 'ANALYZE_CONTENT',
  ANALYZE_MOTION = 'ANALYZE_MOTION',
  PROCESS_CHUNK = 'PROCESS_CHUNK',
  PROGRESS = 'PROGRESS',
  CHUNK_PROGRESS = 'CHUNK_PROGRESS',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
  CANCEL = 'CANCEL'
}

// Message interfaces
export interface VideoWorkerMessage {
  type: VideoWorkerMessageType;
  id: string;
  data?: any;
}

export interface VideoWorkerProgressMessage extends VideoWorkerMessage {
  type: VideoWorkerMessageType.PROGRESS;
  progress: VideoProcessingProgress;
}

export interface VideoWorkerChunkProgressMessage extends VideoWorkerMessage {
  type: VideoWorkerMessageType.CHUNK_PROGRESS;
  progress: VideoChunkProgress;
}

export interface VideoWorkerResultMessage extends VideoWorkerMessage {
  type: VideoWorkerMessageType.RESULT;
  result: any;
}

export interface VideoWorkerErrorMessage extends VideoWorkerMessage {
  type: VideoWorkerMessageType.ERROR;
  error: string;
  code?: string;
}

// Track pending operations
const pendingOperations = new Map<string, AbortController>();

// Handle messages from the main thread
ctx.addEventListener('message', async (event: MessageEvent<VideoWorkerMessage>) => {
  const { type, id, data } = event.data;
  
  // Handle cancel message
  if (type === VideoWorkerMessageType.CANCEL) {
    const controller = pendingOperations.get(id);
    if (controller) {
      controller.abort();
      pendingOperations.delete(id);
    }
    return;
  }
  
  // Create abort controller for this operation
  const abortController = new AbortController();
  pendingOperations.set(id, abortController);
  
  try {
    switch (type) {
      case VideoWorkerMessageType.ANALYZE_VIDEO:
        await handleAnalyzeVideo(id, data, abortController.signal);
        break;
        
      case VideoWorkerMessageType.EXTRACT_FRAMES:
        await handleExtractFrames(id, data, abortController.signal);
        break;
        
      case VideoWorkerMessageType.DETECT_SCENES:
        await handleDetectScenes(id, data, abortController.signal);
        break;
        
      case VideoWorkerMessageType.ANALYZE_CONTENT:
        await handleAnalyzeContent(id, data, abortController.signal);
        break;
        
      case VideoWorkerMessageType.ANALYZE_MOTION:
        await handleAnalyzeMotion(id, data, abortController.signal);
        break;
        
      case VideoWorkerMessageType.PROCESS_CHUNK:
        await handleProcessChunk(id, data, abortController.signal);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    // Don't send error if operation was aborted
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }
    
    // Send error message back to main thread
    ctx.postMessage({
      type: VideoWorkerMessageType.ERROR,
      id,
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN_ERROR'
    } as VideoWorkerErrorMessage);
  } finally {
    // Clean up
    pendingOperations.delete(id);
  }
});

/**
 * Send progress update to main thread
 */
function sendProgress(id: string, progress: number, stage: string, message: string): void {
  ctx.postMessage({
    type: VideoWorkerMessageType.PROGRESS,
    id,
    progress: {
      progress,
      stage,
      message
    }
  } as VideoWorkerProgressMessage);
}

/**
 * Send chunk progress update to main thread
 */
function sendChunkProgress(id: string, progress: ChunkProgress, stage: string): void {
  ctx.postMessage({
    type: VideoWorkerMessageType.CHUNK_PROGRESS,
    id,
    progress: {
      ...progress,
      stage
    }
  } as VideoWorkerChunkProgressMessage);
}

/**
 * Send result to main thread
 */
function sendResult(id: string, result: any): void {
  ctx.postMessage({
    type: VideoWorkerMessageType.RESULT,
    id,
    result
  } as VideoWorkerResultMessage);
}

/**
 * Handle ANALYZE_VIDEO message
 */
async function handleAnalyzeVideo(id: string, data: any, signal: AbortSignal): Promise<void> {
  const { videoFile, useChunkedProcessing } = data;
  
  if (useChunkedProcessing) {
    // For large files, we process in chunks
    // This would be implemented in a real application
    // For this example, we'll simulate the process
    
    sendProgress(id, 0.05, 'loading', 'Preparing to process large video file...');
    
    // Simulate chunk processing
    const totalChunks = 20;
    
    for (let i = 0; i < totalChunks; i++) {
      // Check if operation was cancelled
      if (signal.aborted) {
        throw new DOMException('Operation aborted', 'AbortError');
      }
      
      // Determine which processing stage we're in based on chunk index
      let stage = 'loading';
      let message = 'Loading video file...';
      let baseProgress = 0;
      
      if (i < totalChunks * 0.2) {
        stage = 'loading';
        message = 'Loading video file...';
        baseProgress = 0;
      } else if (i < totalChunks * 0.4) {
        stage = 'frames';
        message = 'Extracting frames...';
        baseProgress = 0.2;
      } else if (i < totalChunks * 0.7) {
        stage = 'scenes';
        message = 'Detecting scenes...';
        baseProgress = 0.4;
      } else if (i < totalChunks * 0.9) {
        stage = 'content';
        message = 'Analyzing content...';
        baseProgress = 0.7;
      } else {
        stage = 'motion';
        message = 'Analyzing motion...';
        baseProgress = 0.9;
      }
      
      // Calculate progress
      const chunkProgress = (i + 1) / totalChunks;
      const stageWeight = stage === 'loading' ? 0.2 : 
                         stage === 'frames' ? 0.2 : 
                         stage === 'scenes' ? 0.3 : 
                         stage === 'content' ? 0.2 : 0.1;
      
      const stageProgress = chunkProgress * stageWeight;
      const overallProgress = baseProgress + stageProgress;
      
      // Send progress update
      sendProgress(id, overallProgress, stage, message);
      
      // Send chunk progress update
      sendChunkProgress(id, {
        chunkIndex: i,
        chunksTotal: totalChunks,
        bytesProcessed: (i + 1) * (videoFile.size / totalChunks),
        totalBytes: videoFile.size,
        percentage: ((i + 1) / totalChunks) * 100
      }, stage);
      
      // Simulate processing delay
      await simulateDelay(100);
    }
  } else {
    // For standard-sized files, we process in one go
    
    // Simulate video loading
    sendProgress(id, 0.1, 'loading', 'Loading video file...');
    await simulateDelay(300);
    
    // Check if operation was cancelled
    if (signal.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
    
    // Simulate frame extraction
    sendProgress(id, 0.3, 'frames', 'Extracting frames...');
    await simulateDelay(400);
    
    // Check if operation was cancelled
    if (signal.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
    
    // Simulate scene detection
    sendProgress(id, 0.6, 'scenes', 'Detecting scenes...');
    await simulateDelay(500);
    
    // Check if operation was cancelled
    if (signal.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
    
    // Simulate content analysis
    sendProgress(id, 0.8, 'content', 'Analyzing content...');
    await simulateDelay(300);
    
    // Check if operation was cancelled
    if (signal.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
    
    // Simulate motion analysis
    sendProgress(id, 0.9, 'motion', 'Analyzing motion...');
    await simulateDelay(200);
    
    // Check if operation was cancelled
    if (signal.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
  }
  
  // Complete the analysis
  sendProgress(id, 1.0, 'complete', 'Finalizing analysis...');
  
  // Create mock analysis results
  const analysis: VideoAnalysis = {
    duration: 120, // 2 minutes
    frameRate: 30,
    resolution: { width: 1920, height: 1080 },
    scenes: [
      { startTime: 0, endTime: 15, keyFrameUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' },
      { startTime: 15, endTime: 45, keyFrameUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' },
      { startTime: 45, endTime: 75, keyFrameUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' },
      { startTime: 75, endTime: 105, keyFrameUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' },
      { startTime: 105, endTime: 120, keyFrameUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }
    ],
    contentAnalysis: [
      { time: 10, content: 'Opening scene' },
      { time: 30, content: 'Character introduction' },
      { time: 60, content: 'Main action sequence' },
      { time: 90, content: 'Resolution' },
      { time: 115, content: 'Closing scene' }
    ]
  };
  
  sendResult(id, analysis);
}

/**
 * Handle EXTRACT_FRAMES message
 */
async function handleExtractFrames(id: string, data: any, signal: AbortSignal): Promise<void> {
  const { videoFile, frameRate } = data;
  
  // Simulate frame extraction
  const totalFrames = 100;
  
  for (let i = 0; i < totalFrames; i++) {
    // Check if operation was cancelled
    if (signal.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
    
    // Send progress update
    sendProgress(id, (i + 1) / totalFrames, 'frames', `Extracting frame ${i + 1}/${totalFrames}...`);
    
    // Simulate processing delay
    await simulateDelay(20);
  }
  
  // Create mock frames data
  const frames = Array.from({ length: totalFrames }, (_, i) => ({
    time: i / frameRate,
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  }));
  
  sendResult(id, frames);
}

/**
 * Handle DETECT_SCENES message
 */
async function handleDetectScenes(id: string, data: any, signal: AbortSignal): Promise<void> {
  const { frames } = data;
  
  // Simulate scene detection
  const totalFrames = frames.length;
  
  for (let i = 0; i < totalFrames - 1; i++) {
    // Check if operation was cancelled
    if (signal.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
    
    // Send progress update
    sendProgress(id, (i + 1) / (totalFrames - 1), 'scenes', `Detecting scenes (${i + 1}/${totalFrames - 1})...`);
    
    // Simulate processing delay
    await simulateDelay(30);
  }
  
  // Create mock scenes data
  const scenes = [
    { startTime: 0, endTime: 15, keyFrameUrl: frames[0].dataUrl },
    { startTime: 15, endTime: 45, keyFrameUrl: frames[15].dataUrl },
    { startTime: 45, endTime: 75, keyFrameUrl: frames[45].dataUrl },
    { startTime: 75, endTime: 105, keyFrameUrl: frames[75].dataUrl },
    { startTime: 105, endTime: 120, keyFrameUrl: frames[90].dataUrl }
  ];
  
  sendResult(id, scenes);
}

/**
 * Handle ANALYZE_CONTENT message
 */
async function handleAnalyzeContent(id: string, data: any, signal: AbortSignal): Promise<void> {
  const { frames } = data;
  
  // Simulate content analysis
  const framesToAnalyze = frames.filter((_, i) => i % 10 === 0); // Analyze every 10th frame
  const totalFrames = framesToAnalyze.length;
  
  for (let i = 0; i < totalFrames; i++) {
    // Check if operation was cancelled
    if (signal.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
    
    // Send progress update
    sendProgress(id, (i + 1) / totalFrames, 'content', `Analyzing content (${i + 1}/${totalFrames})...`);
    
    // Simulate processing delay
    await simulateDelay(50);
  }
  
  // Create mock content analysis data
  const contentAnalysis = [
    { time: 10, content: 'Opening scene' },
    { time: 30, content: 'Character introduction' },
    { time: 60, content: 'Main action sequence' },
    { time: 90, content: 'Resolution' },
    { time: 115, content: 'Closing scene' }
  ];
  
  sendResult(id, contentAnalysis);
}

/**
 * Handle ANALYZE_MOTION message
 */
async function handleAnalyzeMotion(id: string, data: any, signal: AbortSignal): Promise<void> {
  const { frames } = data;
  
  // Simulate motion analysis
  const framePairs = frames.length - 1;
  
  for (let i = 0; i < framePairs; i++) {
    // Check if operation was cancelled
    if (signal.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
    
    // Send progress update
    sendProgress(id, (i + 1) / framePairs, 'motion', `Analyzing motion (${i + 1}/${framePairs})...`);
    
    // Simulate processing delay
    await simulateDelay(40);
  }
  
  // Create mock motion analysis data
  const motionAnalysis = {
    motionVectors: Array.from({ length: framePairs }, (_, i) => ({
      fromTime: frames[i].time,
      toTime: frames[i + 1].time,
      magnitude: Math.random() * 100
    })),
    highMotionSegments: [
      { startTime: 20, endTime: 35 },
      { startTime: 50, endTime: 70 },
      { startTime: 90, endTime: 100 }
    ]
  };
  
  sendResult(id, motionAnalysis);
}

/**
 * Handle PROCESS_CHUNK message
 */
async function handleProcessChunk(id: string, data: any, signal: AbortSignal): Promise<void> {
  const { chunk, chunkIndex, chunksTotal } = data;
  
  // Simulate chunk processing
  // In a real implementation, this would process the chunk data
  
  // Determine which processing stage we're in based on chunk index
  let stage = 'loading';
  
  if (chunkIndex < chunksTotal * 0.2) {
    stage = 'loading';
  } else if (chunkIndex < chunksTotal * 0.4) {
    stage = 'frames';
  } else if (chunkIndex < chunksTotal * 0.7) {
    stage = 'scenes';
  } else if (chunkIndex < chunksTotal * 0.9) {
    stage = 'content';
  } else {
    stage = 'motion';
  }
  
  // Simulate processing delay
  await simulateDelay(100);
  
  // Send chunk progress update
  sendChunkProgress(id, {
    chunkIndex,
    chunksTotal,
    bytesProcessed: chunk.byteLength,
    totalBytes: chunk.byteLength * chunksTotal,
    percentage: ((chunkIndex + 1) / chunksTotal) * 100
  }, stage);
  
  // Return mock result
  sendResult(id, { chunkIndex, processed: true });
}

/**
 * Simulate a processing delay
 */
async function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export worker
export default {} as typeof Worker & { new(): Worker };
