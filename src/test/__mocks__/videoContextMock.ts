// src/test/__mocks__/videoContextMock.ts

/**
 * Mock for HTML Video Element
 */
export class MockHTMLVideoElement {
  src: string = '';
  currentTime: number = 0;
  duration: number = 120; // Default 2 minutes
  videoWidth: number = 1920;
  videoHeight: number = 1080;
  readyState: number = 4; // HAVE_ENOUGH_DATA
  paused: boolean = true;
  muted: boolean = false;
  volume: number = 1;
  playbackRate: number = 1;
  
  // Event handlers
  onloadedmetadata: ((event: Event) => void) | null = null;
  onloadeddata: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  oncanplay: ((event: Event) => void) | null = null;
  ontimeupdate: ((event: Event) => void) | null = null;
  onended: ((event: Event) => void) | null = null;
  
  // Mock methods
  load = jest.fn();
  play = jest.fn().mockImplementation(() => Promise.resolve());
  pause = jest.fn();
  
  // Helper to trigger events
  triggerEvent(eventName: string): void {
    const handler = this[`on${eventName}`];
    if (handler) {
      handler(new Event(eventName));
    }
  }
  
  // Mock seeking behavior
  set currentTime(time: number) {
    this._currentTime = time;
    if (this.ontimeupdate) {
      this.ontimeupdate(new Event('timeupdate'));
    }
  }
  
  get currentTime(): number {
    return this._currentTime;
  }
  
  private _currentTime: number = 0;
}

/**
 * Mock for ImageBitmap
 */
export class MockImageBitmap {
  width: number = 1920;
  height: number = 1080;
  close = jest.fn();
}

/**
 * Mock for OffscreenCanvas
 */
export class MockOffscreenCanvas {
  width: number;
  height: number;
  
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  
  getContext = jest.fn().mockImplementation((contextType: string) => {
    if (contextType === '2d') {
      return new MockCanvasRenderingContext2D();
    }
    return null;
  });
  
  transferToImageBitmap = jest.fn().mockImplementation(() => {
    return new MockImageBitmap();
  });
  
  convertToBlob = jest.fn().mockImplementation(async () => {
    return new Blob(['mock image data'], { type: 'image/png' });
  });
}

/**
 * Mock for CanvasRenderingContext2D
 */
export class MockCanvasRenderingContext2D {
  canvas: MockOffscreenCanvas = new MockOffscreenCanvas(1920, 1080);
  
  // Drawing methods
  drawImage = jest.fn();
  getImageData = jest.fn().mockImplementation(() => {
    return {
      data: new Uint8ClampedArray(1920 * 1080 * 4), // RGBA data
      width: 1920,
      height: 1080,
      colorSpace: 'srgb'
    };
  });
  putImageData = jest.fn();
  
  // State methods
  save = jest.fn();
  restore = jest.fn();
  
  // Path methods
  beginPath = jest.fn();
  closePath = jest.fn();
  moveTo = jest.fn();
  lineTo = jest.fn();
  rect = jest.fn();
  arc = jest.fn();
  
  // Fill and stroke methods
  fill = jest.fn();
  stroke = jest.fn();
  fillRect = jest.fn();
  strokeRect = jest.fn();
  clearRect = jest.fn();
  
  // Text methods
  fillText = jest.fn();
  strokeText = jest.fn();
  measureText = jest.fn().mockReturnValue({ width: 100 });
  
  // Style properties
  fillStyle: string = '#000000';
  strokeStyle: string = '#000000';
  lineWidth: number = 1;
  font: string = '10px sans-serif';
  textAlign: CanvasTextAlign = 'start';
  textBaseline: CanvasTextBaseline = 'alphabetic';
}

/**
 * Mock for WebAssembly
 */
export const mockWebAssembly = {
  compile: jest.fn().mockResolvedValue(new WebAssembly.Module(new Uint8Array())),
  instantiate: jest.fn().mockResolvedValue({
    instance: {
      exports: {
        memory: new WebAssembly.Memory({ initial: 10, maximum: 100 }),
        processFrame: jest.fn(),
        detectScenes: jest.fn(),
        analyzeMotion: jest.fn()
      }
    },
    module: new WebAssembly.Module(new Uint8Array())
  }),
  instantiateStreaming: jest.fn().mockResolvedValue({
    instance: {
      exports: {
        memory: new WebAssembly.Memory({ initial: 10, maximum: 100 }),
        processFrame: jest.fn(),
        detectScenes: jest.fn(),
        analyzeMotion: jest.fn()
      }
    },
    module: new WebAssembly.Module(new Uint8Array())
  }),
  Module: WebAssembly.Module,
  Instance: WebAssembly.Instance,
  Memory: WebAssembly.Memory
};

/**
 * Mock for createImageBitmap
 */
export const mockCreateImageBitmap = jest.fn().mockImplementation(async () => {
  return new MockImageBitmap();
});

/**
 * Mock for URL.createObjectURL and URL.revokeObjectURL
 */
export const mockURL = {
  createObjectURL: jest.fn().mockImplementation((blob: Blob) => {
    return `mock-blob-url-${Math.random().toString(36).substring(2, 15)}`;
  }),
  revokeObjectURL: jest.fn()
};

/**
 * Mock for fetch API
 */
export const mockFetch = jest.fn().mockImplementation(async (url: string) => {
  if (url.includes('error')) {
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Not Found',
      json: async () => ({ error: 'Not Found' }),
      blob: async () => new Blob(['error'], { type: 'text/plain' }),
      arrayBuffer: async () => new ArrayBuffer(0)
    };
  }
  
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    text: async () => 'Mock response text',
    json: async () => ({ success: true, data: 'Mock data' }),
    blob: async () => new Blob(['mock video data'], { type: 'video/mp4' }),
    arrayBuffer: async () => new ArrayBuffer(1024)
  };
});

/**
 * Helper to create a mock video frame
 */
export function createMockVideoFrame(
  timestamp: number = 0,
  width: number = 1920,
  height: number = 1080
) {
  return {
    timestamp,
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4), // RGBA data
    format: 'RGBA32'
  };
}

/**
 * Helper to create a mock scene detection result
 */
export function createMockSceneDetection(
  totalFrames: number = 300,
  sceneCount: number = 5
) {
  const scenes = [];
  const framesPerScene = Math.floor(totalFrames / sceneCount);
  
  for (let i = 0; i < sceneCount; i++) {
    const startFrame = i * framesPerScene;
    const endFrame = (i === sceneCount - 1) ? totalFrames - 1 : (i + 1) * framesPerScene - 1;
    
    scenes.push({
      startFrame,
      endFrame,
      startTime: startFrame / 30, // Assuming 30fps
      endTime: endFrame / 30,
      confidence: 0.8 + (Math.random() * 0.2), // 0.8-1.0
      keyFrameIndex: startFrame + Math.floor(Math.random() * (endFrame - startFrame))
    });
  }
  
  return {
    scenes,
    totalFrames,
    fps: 30
  };
}

/**
 * Helper to create a mock motion analysis result
 */
export function createMockMotionAnalysis(
  totalFrames: number = 300
) {
  const motionData = [];
  
  for (let i = 0; i < totalFrames; i++) {
    motionData.push({
      frameIndex: i,
      timestamp: i / 30, // Assuming 30fps
      overallMotion: Math.random(),
      regionMotion: [
        Math.random() * 0.5, // Top left
        Math.random() * 0.5, // Top right
        Math.random() * 0.5, // Bottom left
        Math.random() * 0.5  // Bottom right
      ]
    });
  }
  
  return {
    motionData,
    averageMotion: 0.3 + (Math.random() * 0.4), // 0.3-0.7
    peakMotion: 0.8 + (Math.random() * 0.2), // 0.8-1.0
    peakMotionTime: Math.floor(Math.random() * totalFrames) / 30
  };
}

/**
 * Helper to create a mock metadata extraction result
 */
export function createMockMetadataExtraction() {
  return {
    format: 'MP4',
    codec: 'H.264',
    duration: 120, // 2 minutes
    frameRate: 30,
    bitrate: 5000000, // 5 Mbps
    resolution: { width: 1920, height: 1080 },
    aspectRatio: '16:9',
    colorSpace: 'BT.709',
    audioTracks: [
      {
        codec: 'AAC',
        channels: 2,
        sampleRate: 48000,
        bitrate: 192000 // 192 kbps
      }
    ],
    creationDate: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
}

/**
 * Helper to simulate WebAssembly availability
 */
export function setWebAssemblyAvailability(available: boolean) {
  if (!available) {
    // Mock WebAssembly to be undefined or throw errors
    global.WebAssembly = undefined;
  } else {
    // Restore WebAssembly
    global.WebAssembly = mockWebAssembly as any;
  }
}
