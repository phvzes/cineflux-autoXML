// Mock for @techstark/opencv-js
import { jest } from '@jest/globals';

export const Mat = function() {
  return {
    delete: jest.fn()
  };
};

export const matFromImageData = jest.fn().mockReturnValue({
  delete: jest.fn()
});

export const cvtColor = jest.fn();
export const absdiff = jest.fn();
export const mean = jest.fn().mockReturnValue([10]);
export const meanStdDev = jest.fn().mockReturnValue({
  mean: { data64F: [128, 128, 128] },
  stddev: { data64F: [40, 40, 40] }
});

export const CascadeClassifier = function() {
  return {
    load: jest.fn(),
    detectMultiScale: jest.fn()
  };
};

export const RectVector = function() {
  return {
    size: jest.fn().mockReturnValue(0),
    delete: jest.fn()
  };
};

export const split = jest.fn();
export const magnitude = jest.fn();
export const calcOpticalFlowFarneback = jest.fn();
export const MatVector = function() {
  return {
    get: jest.fn().mockReturnValue({
      delete: jest.fn()
    }),
    delete: jest.fn()
  };
};

export const CV_32F = 0;
export const TermCriteria = function() {
  return {};
};

export const TermCriteria_EPS = 1;
export const TermCriteria_MAX_ITER = 2;
export const KMEANS_PP_CENTERS = 0;
export const kmeans = jest.fn();
export const COLOR_RGBA2GRAY = 0;
export const COLOR_RGBA2RGB = 0;
