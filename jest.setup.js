// Import Testing Library utilities
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock global objects that might not be available in the test environment
global.AudioContext = class MockAudioContext {
  constructor() {}
  decodeAudioData() {}
  close() { return Promise.resolve(); }
};

global.webkitAudioContext = global.AudioContext;

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

// Mock canvas
global.document.createElement = jest.fn((tag) => {
  if (tag === 'canvas') {
    return {
      getContext: jest.fn(() => ({
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(1920 * 1080 * 4),
          width: 1920,
          height: 1080
        }))
      })),
      width: 1920,
      height: 1080
    };
  }
  return {};
});

// Mock Image
global.Image = class MockImage {
  constructor() {
    this.width = 1920;
    this.height = 1080;
    this.onload = () => {};
    this.onerror = () => {};
    this.src = '';
    setTimeout(() => this.onload(), 0);
  }
};
import { TextEncoder, TextDecoder } from 'util';
import { v4 as uuidv4 } from 'uuid';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.uuidv4 = uuidv4;
