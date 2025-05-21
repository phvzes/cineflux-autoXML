/**
 * modules.d.ts
 * 
 * Type declarations for modules that don't have their own type definitions.
 */

// Declare modules without type definitions
declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.wav' {
  const src: string;
  export default src;
}

declare module '*.mp4' {
  const src: string;
  export default src;
}

declare module '*.webm' {
  const src: string;
  export default src;
}

declare module '*.mov' {
  const src: string;
  export default src;
}

declare module '*.wasm' {
  const wasm: any;
  export default wasm;
}

// Declare any missing modules from third-party libraries
declare module 'waveform-data' {
  export default class WaveformData {
    constructor(options: any);
    static create(buffer: ArrayBuffer): WaveformData;
    static createFromAudio(options: any, callback: (err: Error | null, waveform: WaveformData) => void): void;
    channels: number;
    channel(index: number): {
      min_array: () => Float32Array;
      max_array: () => Float32Array;
      min_value: (index: number) => number;
      max_value: (index: number) => number;
    };
    length: number;
    duration: number;
    sample_rate: number;
  }
}

// Declare any missing properties on existing modules
declare namespace cv {
  const KMEANS_PP_CENTERS: number;
  
  function meanStdDev(
    src: cv.Mat,
    mean?: cv.Mat,
    stddev?: cv.Mat,
    mask?: cv.Mat
  ): { mean: cv.Mat; stddev: cv.Mat };
}

// Declare any missing hooks
declare module '../hooks/useVideoService' {
  import VideoService from '../services/VideoService';
  
  export default function useVideoService(): {
    service: VideoService;
    isLoading: boolean;
    error: Error | null;
  };
}

declare module '../hooks/useAudioService' {
  import AudioService from '../services/AudioService';
  
  export default function useAudioService(): {
    service: AudioService;
    isLoading: boolean;
    error: Error | null;
  };
}
