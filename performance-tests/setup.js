
// Performance test setup
const { performance } = require('perf_hooks');
global.performance = performance;

// Mock browser APIs if needed
global.AudioContext = class AudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.destination = {};
    this.currentTime = 0;
  }
  createAnalyser() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteFrequencyData: jest.fn(),
      getFloatTimeDomainData: jest.fn()
    };
  }
  createGain() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      gain: { value: 1.0 }
    };
  }
  createBufferSource() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      buffer: null
    };
  }
  decodeAudioData: jest.fn()
};

// Mock for WebAssembly
if (!global.WebAssembly) {
  global.WebAssembly = {
    instantiate: jest.fn(),
    compile: jest.fn(),
    instantiateStreaming: jest.fn(),
    compileStreaming: jest.fn(),
    Module: class {},
    Instance: class {},
    Memory: class {},
    Table: class {},
    CompileError: class extends Error {},
    LinkError: class extends Error {},
    RuntimeError: class extends Error {}
  };
}

// Mock for HTMLVideoElement and HTMLCanvasElement
class MockHTMLVideoElement {
  constructor() {
    this.width = 640;
    this.height = 480;
    this.currentTime = 0;
    this.duration = 60;
    this.videoWidth = 640;
    this.videoHeight = 480;
    this.readyState = 4; // HAVE_ENOUGH_DATA
  }
  play() { return Promise.resolve(); }
  pause() {}
  addEventListener() {}
  removeEventListener() {}
}

class MockHTMLCanvasElement {
  constructor() {
    this.width = 640;
    this.height = 480;
  }
  getContext() {
    return {
      drawImage: jest.fn(),
      getImageData: jest.fn().mockReturnValue({
        data: new Uint8ClampedArray(640 * 480 * 4),
        width: 640,
        height: 480
      })
    };
  }
}

global.HTMLVideoElement = MockHTMLVideoElement;
global.HTMLCanvasElement = MockHTMLCanvasElement;
