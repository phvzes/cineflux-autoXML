/**
 * Browser Optimizations
 * Browser-specific optimizations for performance
 */

// Browser detection
export enum BrowserType {
  CHROME = 'chrome',
  FIREFOX = 'firefox',
  SAFARI = 'safari',
  EDGE = 'edge',
  IE = 'ie',
  OPERA = 'opera',
  UNKNOWN = 'unknown'
}

/**
 * Detect the current browser
 * @returns Browser type
 */
export function detectBrowser(): BrowserType {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.indexOf('chrome') > -1 && userAgent.indexOf('edg') === -1) {
    return BrowserType.CHROME;
  } else if (userAgent.indexOf('firefox') > -1) {
    return BrowserType.FIREFOX;
  } else if (userAgent.indexOf('safari') > -1 && userAgent.indexOf('chrome') === -1) {
    return BrowserType.SAFARI;
  } else if (userAgent.indexOf('edg') > -1) {
    return BrowserType.EDGE;
  } else if (userAgent.indexOf('msie') > -1 || userAgent.indexOf('trident') > -1) {
    return BrowserType.IE;
  } else if (userAgent.indexOf('opera') > -1 || userAgent.indexOf('opr') > -1) {
    return BrowserType.OPERA;
  } else {
    return BrowserType.UNKNOWN;
  }
}

/**
 * Check if the current browser is Chrome
 * @returns True if the browser is Chrome
 */
export function isChrome(): boolean {
  return detectBrowser() === BrowserType.CHROME;
}

/**
 * Check if the current browser supports hardware acceleration
 * @returns True if hardware acceleration is supported
 */
export function supportsHardwareAcceleration(): boolean {
  // Check for WebGL support as a proxy for hardware acceleration
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

/**
 * Check if the current browser supports the Web Codecs API
 * @returns True if Web Codecs API is supported
 */
export function supportsWebCodecs(): boolean {
  return typeof window !== 'undefined' && 'VideoDecoder' in window;
}

/**
 * Check if the current browser supports the Media Source Extensions API
 * @returns True if MSE API is supported
 */
export function supportsMSE(): boolean {
  return typeof window !== 'undefined' && 'MediaSource' in window;
}

/**
 * Check if the current browser supports the WebAssembly SIMD extension
 * @returns True if WebAssembly SIMD is supported
 */
export function supportsWasmSIMD(): boolean {
  try {
    // Feature detection for WebAssembly SIMD
    return WebAssembly.validate(new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, // magic bytes
      0x01, 0x00, 0x00, 0x00, // version
      0x01, 0x04, 0x01, 0x60, 0x00, 0x00, // type section
      0x03, 0x02, 0x01, 0x00, // function section
      0x0a, 0x05, 0x01, 0x03, 0x00, 0xfd, 0x0c // code section with SIMD instruction
    ]));
  } catch (e) {
    return false;
  }
}

/**
 * Get optimal video processing settings for the current browser
 * @returns Optimal video processing settings
 */
export function getOptimalVideoSettings(): {
  useHardwareAcceleration: boolean;
  useWebCodecs: boolean;
  useMSE: boolean;
  useWasmSIMD: boolean;
  maxConcurrentFrames: number;
  useTransferableObjects: boolean;
  useSharedArrayBuffer: boolean;
} {
  const browser = detectBrowser();
  const hasHardwareAcceleration = supportsHardwareAcceleration();
  const hasWebCodecs = supportsWebCodecs();
  const hasMSE = supportsMSE();
  const hasWasmSIMD = supportsWasmSIMD();
  
  // Default settings
  const settings = {
    useHardwareAcceleration: hasHardwareAcceleration,
    useWebCodecs: hasWebCodecs,
    useMSE: hasMSE,
    useWasmSIMD: hasWasmSIMD,
    maxConcurrentFrames: 4,
    useTransferableObjects: true,
    useSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined'
  };
  
  // Browser-specific optimizations
  switch (browser) {
    case BrowserType.CHROME:
      // Chrome-specific optimizations
      settings.maxConcurrentFrames = 8; // Chrome handles more concurrent frames well
      break;
      
    case BrowserType.FIREFOX:
      // Firefox-specific optimizations
      settings.maxConcurrentFrames = 4;
      break;
      
    case BrowserType.SAFARI:
      // Safari-specific optimizations
      settings.maxConcurrentFrames = 2; // Safari is more conservative
      settings.useTransferableObjects = false; // Safari has issues with some transferable objects
      break;
      
    case BrowserType.EDGE:
      // Edge-specific optimizations
      settings.maxConcurrentFrames = 6;
      break;
      
    default:
      // Default for unknown browsers
      settings.maxConcurrentFrames = 2;
      break;
  }
  
  return settings;
}

/**
 * Create an optimized video element for the current browser
 * @returns Optimized video element
 */
export function createOptimizedVideoElement(): HTMLVideoElement {
  const video = document.createElement('video');
  
  // Common optimizations
  video.autoplay = false;
  video.muted = true;
  video.playsInline = true;
  
  // Chrome-specific optimizations
  if (isChrome()) {
    // Enable hardware acceleration
    video.style.transform = 'translateZ(0)';
    
    // Add attributes for better performance in Chrome
    video.setAttribute('disablePictureInPicture', '');
    video.setAttribute('disableRemotePlayback', '');
  }
  
  return video;
}

/**
 * Create an optimized canvas for video processing
 * @param width Canvas width
 * @param height Canvas height
 * @returns Optimized canvas element and context
 */
export function createOptimizedCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Enable hardware acceleration
  canvas.style.transform = 'translateZ(0)';
  
  // Get context with optimized settings
  const ctx = canvas.getContext('2d', {
    alpha: false, // Disable alpha channel for better performance
    desynchronized: true, // Use desynchronized mode if available
    willReadFrequently: true // Optimize for frequent readback
  })!;
  
  return { canvas, ctx };
}

/**
 * Apply Chrome-specific video processing optimizations
 * @param videoElement Video element to optimize
 */
export function applyChromeVideoOptimizations(videoElement: HTMLVideoElement): void {
  if (!isChrome()) {
    return;
  }
  
  // Enable hardware acceleration
  videoElement.style.transform = 'translateZ(0)';
  
  // Disable features that aren't needed
  videoElement.setAttribute('disablePictureInPicture', '');
  videoElement.setAttribute('disableRemotePlayback', '');
  
  // Set playback rate to normal
  videoElement.playbackRate = 1.0;
  
  // Use 'auto' quality for better performance
  (videoElement as any).quality = 'auto';
  
  // Disable audio to improve video processing performance
  videoElement.muted = true;
  
  // Enable inline playback
  videoElement.playsInline = true;
}

/**
 * Create a video frame processor optimized for Chrome
 * @param processFrame Function to process a single frame
 * @returns Function to process a video element
 */
export function createChromeOptimizedFrameProcessor<T>(
  processFrame: (imageData: ImageData, timestamp: number) => Promise<T>
): (video: HTMLVideoElement, fps: number) => Promise<T[]> {
  return async (video: HTMLVideoElement, fps: number): Promise<T[]> => {
    // Apply Chrome-specific optimizations
    applyChromeVideoOptimizations(video);
    
    // Create optimized canvas
    const { canvas, ctx } = createOptimizedCanvas(video.videoWidth, video.videoHeight);
    
    // Calculate frame interval
    const duration = video.duration;
    const frameInterval = 1 / fps;
    const totalFrames = Math.floor(duration * fps);
    
    // Initialize results array
    const results: T[] = [];
    
    // Process frames
    for (let i = 0; i < totalFrames; i++) {
      const timestamp = i * frameInterval;
      
      // Seek to timestamp
      video.currentTime = timestamp;
      
      // Wait for video to update
      await new Promise<void>(resolve => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
      });
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Process frame
      const result = await processFrame(imageData, timestamp);
      results.push(result);
    }
    
    return results;
  };
}

// Export default object
export default {
  detectBrowser,
  isChrome,
  supportsHardwareAcceleration,
  supportsWebCodecs,
  supportsMSE,
  supportsWasmSIMD,
  getOptimalVideoSettings,
  createOptimizedVideoElement,
  createOptimizedCanvas,
  applyChromeVideoOptimizations,
  createChromeOptimizedFrameProcessor
};
