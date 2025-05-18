/**
 * WebAssembly module type definitions
 * 
 * This file provides TypeScript type definitions for WebAssembly modules
 * used in the application, including FFmpeg.wasm and OpenCV.js.
 */

/**
 * Declaration for importing WebAssembly modules
 */
declare module '*.wasm' {
  /**
   * The WebAssembly module instance
   */
  const wasmModule: WebAssembly.Module;
  
  /**
   * Default export of the WebAssembly module
   */
  export default wasmModule;
}

/**
 * WebAssembly Memory Interface
 */
interface WebAssemblyMemory extends WebAssembly.Memory {
  /**
   * Get a view of the memory as a Uint8Array
   */
  buffer: ArrayBuffer;
}

/**
 * WebAssembly Instance Interface
 */
interface WebAssemblyInstance extends WebAssembly.Instance {
  /**
   * Exported functions and values from the WebAssembly module
   */
  exports: Record<string, WebAssembly.ExportValue>;
}

/**
 * Interface for WebAssembly module exports
 * This can be extended for specific modules
 */
export interface WasmModuleExports {
  /** 
   * Generic index signature for any exported functions
   */
  [key: string]: WebAssembly.ExportValue;
}

/**
 * Interface for FFmpeg WebAssembly module
 */
export interface FFmpegWasmModule extends WasmModuleExports {
  /** Initialize the module */
  _initialize?: () => number;
  /** Run a command */
  _run_command?: (cmdPtr: number) => number;
  /** Allocate memory */
  _malloc?: (size: number) => number;
  /** Free memory */
  _free?: (ptr: number) => void;
  /** Get the last error message */
  _get_last_error_message?: () => number;
  /** Write data to memory */
  _write_data?: (ptr: number, size: number) => number;
  /** Read data from memory */
  _read_data?: (ptr: number, size: number) => number;
  /** Get the version string */
  _get_version?: () => number;
}

/**
 * Interface for OpenCV WebAssembly module
 */
export interface OpenCVWasmModule extends WasmModuleExports {
  /** Initialize the module */
  _initialize?: () => number;
  /** Process an image */
  _process_image?: (imgPtr: number, width: number, height: number) => number;
  /** Allocate memory */
  _malloc?: (size: number) => number;
  /** Free memory */
  _free?: (ptr: number) => void;
  /** Create a new Mat object */
  _cv_mat_new?: (rows: number, cols: number, type: number) => number;
  /** Delete a Mat object */
  _cv_mat_delete?: (matPtr: number) => void;
  /** Get data from a Mat object */
  _cv_mat_get_data?: (matPtr: number) => number;
  /** Set data in a Mat object */
  _cv_mat_set_data?: (matPtr: number, dataPtr: number, size: number) => void;
}

/**
 * FFmpeg.wasm Module Interface
 */
declare module 'ffmpeg.wasm' {
  /**
   * Create an FFmpeg instance
   */
  export function createFFmpeg(options?: {
    /** Whether to log FFmpeg output */
    log?: boolean;
    /** Path to FFmpeg core files */
    corePath?: string;
    /** Whether to use multi-threading */
    multiThread?: boolean;
  }): FFmpegInstance;

  /**
   * Fetch a file from a URL or File object
   */
  export function fetchFile(file: string | File | Blob): Promise<Uint8Array>;

  /**
   * FFmpeg instance interface
   */
  export interface FFmpegInstance {
    /** Load the FFmpeg core */
    load(): Promise<void>;
    /** Run FFmpeg commands */
    run(...args: string[]): Promise<void>;
    /** File system operations */
    FS(operation: string, ...args: any[]): any;
    /** Set progress callback */
    setProgress(callback: (progress: { ratio: number }) => void): void;
    /** Set logger callback */
    setLogger(callback: (message: { type: string; message: string }) => void): void;
    /** Set exit callback */
    setExit(callback: (code: number) => void): void;
    /** Whether the FFmpeg core is loaded */
    isLoaded(): boolean;
  }
}

/**
 * OpenCV.js Module Interface
 */
declare module 'opencv.js' {
  /**
   * OpenCV module interface
   */
  export interface OpenCVModule {
    /** Initialize the module */
    onRuntimeInitialized: () => void;
    /** Read an image from a canvas element */
    imread(canvas: HTMLCanvasElement | string): Mat;
    /** Write an image to a canvas element */
    imshow(canvas: HTMLCanvasElement | string, mat: Mat): void;
    /** Convert an image to grayscale */
    cvtColor(src: Mat, dst: Mat, code: number): void;
    /** Resize an image */
    resize(src: Mat, dst: Mat, dsize: Size, fx?: number, fy?: number, interpolation?: number): void;
    /** Detect faces in an image */
    detectMultiScale(classifier: CascadeClassifier, image: Mat, scaleFactor?: number, minNeighbors?: number, flags?: number, minSize?: Size, maxSize?: Size): Rect[];
    /** Create a new Mat */
    Mat: new (rows: number, cols: number, type: number, data?: any) => Mat;
    /** Create a new Size */
    Size: new (width: number, height: number) => Size;
    /** Create a new Point */
    Point: new (x: number, y: number) => Point;
    /** Create a new Rect */
    Rect: new (x: number, y: number, width: number, height: number) => Rect;
    /** Create a new CascadeClassifier */
    CascadeClassifier: new () => CascadeClassifier;
    /** Constants */
    CV_8UC1: number;
    CV_8UC3: number;
    CV_8UC4: number;
    CV_32FC1: number;
    CV_32FC3: number;
    CV_32FC4: number;
    COLOR_RGB2GRAY: number;
    COLOR_RGBA2GRAY: number;
    COLOR_GRAY2RGB: number;
    COLOR_GRAY2RGBA: number;
    INTER_LINEAR: number;
    INTER_CUBIC: number;
    INTER_AREA: number;
    INTER_NEAREST: number;
  }

  /**
   * Mat interface
   */
  export interface Mat {
    /** Number of rows */
    rows: number;
    /** Number of columns */
    cols: number;
    /** Data type */
    type(): number;
    /** Get data from the Mat */
    data: Uint8Array | Float32Array;
    /** Get a specific element */
    ucharPtr(row: number, col: number): Uint8Array;
    /** Get a specific element */
    floatPtr(row: number, col: number): Float32Array;
    /** Delete the Mat */
    delete(): void;
  }

  /**
   * Size interface
   */
  export interface Size {
    /** Width */
    width: number;
    /** Height */
    height: number;
  }

  /**
   * Point interface
   */
  export interface Point {
    /** X coordinate */
    x: number;
    /** Y coordinate */
    y: number;
  }

  /**
   * Rect interface
   */
  export interface Rect {
    /** X coordinate */
    x: number;
    /** Y coordinate */
    y: number;
    /** Width */
    width: number;
    /** Height */
    height: number;
  }

  /**
   * CascadeClassifier interface
   */
  export interface CascadeClassifier {
    /** Load a classifier from a file */
    load(path: string): boolean;
    /** Detect objects */
    detectMultiScale(image: Mat, objects: Rect[], scaleFactor?: number, minNeighbors?: number, flags?: number, minSize?: Size, maxSize?: Size): void;
    /** Delete the classifier */
    delete(): void;
  }

  /**
   * Default export
   */
  const cv: OpenCVModule;
  export default cv;
}

/**
 * WebAssembly Module Interface for Audio Processing
 */
export interface AudioProcessingWasmModule extends WebAssembly.Module {
  /** Initialize the module */
  _initialize?: () => number;
  /** Process audio data */
  _process_audio?: (bufferPtr: number, length: number, sampleRate: number) => number;
  /** Detect beats in audio data */
  _detect_beats?: (bufferPtr: number, length: number, sampleRate: number) => number;
  /** Analyze energy in audio data */
  _analyze_energy?: (bufferPtr: number, length: number, sampleRate: number) => number;
  /** Allocate memory */
  _malloc?: (size: number) => number;
  /** Free memory */
  _free?: (ptr: number) => void;
  /** Get result buffer pointer */
  _get_result_buffer?: () => number;
  /** Get result buffer length */
  _get_result_length?: () => number;
}

/**
 * WebAssembly Module Interface for Video Processing
 */
export interface VideoProcessingWasmModule extends WebAssembly.Module {
  /** Initialize the module */
  _initialize?: () => number;
  /** Process video frame */
  _process_frame?: (framePtr: number, width: number, height: number) => number;
  /** Detect scenes in video */
  _detect_scenes?: (framesPtr: number, framesCount: number) => number;
  /** Analyze motion in video */
  _analyze_motion?: (framesPtr: number, framesCount: number) => number;
  /** Allocate memory */
  _malloc?: (size: number) => number;
  /** Free memory */
  _free?: (ptr: number) => void;
  /** Get result buffer pointer */
  _get_result_buffer?: () => number;
  /** Get result buffer length */
  _get_result_length?: () => number;
}
