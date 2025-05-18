
/**
 * ExtendedFile.ts
 * 
 * Defines TypeScript interfaces for extended File objects with additional properties
 * used throughout the application.
 */

/**
 * Extends the standard File interface with additional properties
 * used in the application for media files
 */
export interface ExtendedFile extends File {
  /** Path property sometimes added to File objects */
  path?: string;
  /** Last modified date as a Date object */
  lastModifiedDate?: Date;
  /** Preview URL for the file */
  preview?: string;
  /** Whether the file has been processed */
  processed?: boolean;
  /** Any additional metadata associated with the file */
  metadata?: Record<string, any>;
}

/**
 * Represents a music file with additional audio-specific properties
 */
export interface MusicFile {
  /** The original file object */
  file: ExtendedFile;
  /** Name of the file */
  name: string;
  /** Size of the file in bytes */
  size: number;
  /** MIME type of the file */
  type: string;
  /** Duration of the audio in seconds */
  duration: number;
  /** URL for accessing the file (blob URL) */
  url: string;
  /** Waveform data for visualization */
  waveform?: number[];
}

/**
 * Represents a video file with additional video-specific properties
 */
export interface VideoFileObject {
  /** The original file object */
  file: ExtendedFile;
  /** Name of the file */
  name: string;
  /** Size of the file in bytes */
  size: number;
  /** MIME type of the file */
  type: string;
  /** Duration of the video in seconds */
  duration: number;
  /** Width of the video in pixels */
  width: number;
  /** Height of the video in pixels */
  height: number;
  /** Frames per second */
  fps: number;
  /** URL for accessing the file (blob URL) */
  url: string;
  /** Thumbnail image data URL */
  thumbnail?: string;
  /** Blob URL for the video */
  blobUrl?: string;
}

/**
 * Type guard to check if a File object is an ExtendedFile
 * @param file The file to check
 * @returns True if the file is an ExtendedFile
 */
export function isExtendedFile(file: File): file is ExtendedFile {
  return 'path' in file || 'preview' in file || 'processed' in file || 'metadata' in file;
}
