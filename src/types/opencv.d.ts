/**
 * Type declarations for OpenCV.js
 */

interface OpenCVMat {
  // Add properties and methods for the Mat class
  rows: number;
  cols: number;
  type(): number;
  size(): { height: number, width: number };
  // Add other Mat methods as needed
}

interface OpenCV {
  Mat: {
    new(): OpenCVMat;
    new(rows: number, cols: number, type: number): OpenCVMat;
    new(rows: number, cols: number, type: number, data: ArrayLike<number>): OpenCVMat;
    // Add other Mat constructors as needed
  };
  KMEANS_PP_CENTERS: number;
  // Add other OpenCV constants and methods as needed
  onRuntimeInitialized?: () => void;
}

declare global {
  interface Window {
    cv: OpenCV;
  }
}

export {};
