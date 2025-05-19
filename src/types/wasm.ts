
/**
 * Types for WebAssembly module integration
 */

export interface WasmModuleExports {
  [key: string]: any;
}

export interface WasmModuleImports {
  [key: string]: any;
}

export interface WasmModuleInstance {
  exports: WasmModuleExports;
  memory: WebAssembly.Memory;
}

export interface WasmModuleConfig {
  url: string;
  imports?: WasmModuleImports;
  cacheKey?: string;
  preload?: boolean;
}

export interface FFmpegWasmModule extends WasmModuleExports {
  createFile: (path: string, data: Uint8Array) => void;
  deleteFile: (path: string) => void;
  readFile: (path: string) => Uint8Array;
  run: (command: string) => number;
  exit: (code: number) => void;
  setLogger: (callback: (message: string) => void) => void;
  setProgress: (callback: (progress: number) => void) => void;
}

export interface OpenCVWasmModule extends WasmModuleExports {
  imread: (imageSource: HTMLImageElement | HTMLCanvasElement) => any;
  imshow: (canvasSource: HTMLCanvasElement, mat: any) => void;
  VideoCapture: new (videoSource: HTMLVideoElement) => any;
  detectAndCompute: (descriptor: any, keypoints: any) => any;
  matchKeypoints: (descriptors1: any, descriptors2: any) => any;
}

export interface EssentiaWasmModule extends WasmModuleExports {
  AudioLoader: {
    fromAudioBuffer: (audioBuffer: AudioBuffer) => any;
  };
  BeatTracker: {
    compute: (audioSignal: any) => { ticks: Float32Array; confidence: number };
  };
  Windowing: {
    compute: (frame: Float32Array, windowType: string) => Float32Array;
  };
  Spectrum: {
    compute: (frame: Float32Array) => Float32Array;
  };
  SpectralPeaks: {
    compute: (spectrum: Float32Array) => { frequencies: Float32Array; magnitudes: Float32Array };
  };
}

export interface WasmCacheEntry {
  module: WebAssembly.Module;
  timestamp: number;
  size: number;
}

export interface WasmLoadingProgress {
  moduleName: string;
  bytesLoaded: number;
  bytesTotal: number;
  percentage: number;
}

export type WasmLoadingProgressCallback = (progress: WasmLoadingProgress) => void;
export type WasmLoadingErrorCallback = (error: Error) => void;
export type WasmLoadingSuccessCallback = (instance: WasmModuleInstance) => void;
