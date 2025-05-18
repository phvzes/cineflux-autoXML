/**
 * Mock implementation of AudioContext for testing
 */

// Mock AnalyserNode
export class MockAnalyserNode {
  fftSize: number = 2048;
  frequencyBinCount: number = 1024;
  minDecibels: number = -100;
  maxDecibels: number = -30;
  smoothingTimeConstant: number = 0.8;
  
  getFloatFrequencyData(array: Float32Array): void {
    array.fill(-50);
  }
  
  getByteFrequencyData(array: Uint8Array): void {
    array.fill(128);
  }
  
  getFloatTimeDomainData(array: Float32Array): void {
    array.fill(0);
  }
  
  getByteTimeDomainData(array: Uint8Array): void {
    array.fill(128);
  }
}

// Mock AudioBuffer
export class MockAudioBuffer {
  length: number = 44100 * 10; // 10 seconds
  duration: number = 10;
  sampleRate: number = 44100;
  numberOfChannels: number = 2;
  
  getChannelData(channel: number): Float32Array {
    return new Float32Array(this.length).fill(0.5);
  }
  
  copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel?: number): void {
    destination.fill(0.5);
  }
  
  copyToChannel(source: Float32Array, channelNumber: number, startInChannel?: number): void {
    // No-op
  }
}

// Mock AudioContext
export class MockAudioContext {
  destination: any = {};
  currentTime: number = 0;
  sampleRate: number = 44100;
  state: AudioContextState = 'running';
  
  createAnalyser(): MockAnalyserNode {
    return new MockAnalyserNode();
  }
  
  createGain(): any {
    return {
      gain: { value: 1 },
      connect: jest.fn(),
      disconnect: jest.fn()
    };
  }
  
  decodeAudioData(
    arrayBuffer: ArrayBuffer,
    successCallback?: (decodedData: AudioBuffer) => void,
    errorCallback?: (error: Error) => void
  ): Promise<AudioBuffer> {
    if (arrayBuffer.byteLength === 0) {
      const error = new Error('Invalid audio data');
      if (errorCallback) errorCallback(error);
      return Promise.reject(error);
    }
    
    const buffer = new MockAudioBuffer();
    if (successCallback) successCallback(buffer as unknown as AudioBuffer);
    return Promise.resolve(buffer as unknown as AudioBuffer);
  }
  
  close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }
}

// Mock WebAssembly
export const MockWebAssembly = {
  compile: jest.fn().mockResolvedValue({}),
  instantiate: jest.fn().mockResolvedValue({
    instance: {
      exports: {
        memory: new WebAssembly.Memory({ initial: 10, maximum: 100 }),
        analyze: jest.fn().mockReturnValue(0),
        process: jest.fn().mockReturnValue(0)
      }
    },
    module: {}
  }),
  instantiateStreaming: jest.fn().mockResolvedValue({
    instance: {
      exports: {
        memory: new WebAssembly.Memory({ initial: 10, maximum: 100 }),
        analyze: jest.fn().mockReturnValue(0),
        process: jest.fn().mockReturnValue(0)
      }
    },
    module: {}
  }),
  validate: jest.fn().mockReturnValue(true)
};

// Export the mocks
export default {
  MockAudioContext,
  MockAnalyserNode,
  MockAudioBuffer,
  MockWebAssembly
};
