
/**
 * video.types.ts
 * 
 * Central definitions for video-related types used throughout the application.
 * These types are used for video analysis, processing, and editing.
 */

/**
 * Represents a scene detected in a video
 */
export interface Scene {
  /** Unique identifier for the scene */
  id: string;
  /** Start time of the scene in seconds */
  startTime: number;
  /** End time of the scene in seconds */
  endTime: number;
  /** Duration of the scene in seconds */
  duration: number;
  /** Confidence level of the scene detection (0-1) */
  confidence?: number;
  /** Type or category of the scene */
  type?: string;
  /** Tags associated with the scene */
  tags?: string[];
  /** Thumbnail image URL or data for the scene */
  thumbnail?: string;
  /** Average brightness of the scene (0-1) */
  brightness?: number;
  /** Average motion level in the scene (0-1) */
  motionLevel?: number;
  /** Dominant colors in the scene */
  dominantColors?: string[];
  /** Whether the scene contains faces */
  hasFaces?: boolean;
  /** Number of faces detected in the scene */
  faceCount?: number;
  /** Whether the scene contains text */
  hasText?: boolean;
  /** Detected text content in the scene */
  textContent?: string;
  /** Quality score of the scene (0-1) */
  qualityScore?: number;
  /** Additional metadata for the scene */
  metadata?: Record<string, any>;
}

/**
 * Options for scene detection
 */
export interface SceneDetectionOptions {
  /** Threshold for scene change detection (0-1) */
  threshold: number;
  /** Minimum duration of a scene in seconds */
  minSceneDuration: number;
  /** Whether to detect content-based scenes rather than just visual changes */
  contentBased: boolean;
  /** Whether to analyze each scene for additional metadata */
  analyzeSceneContent: boolean;
  /** Maximum number of scenes to detect (0 for unlimited) */
  maxScenes: number;
}

/**
 * Result of scene detection analysis
 */
export interface SceneDetectionResult {
  /** Array of detected scenes */
  scenes: Scene[];
  /** Total number of scenes detected */
  sceneCount: number;
  /** Average scene duration in seconds */
  averageSceneDuration: number;
  /** Options used for the scene detection */
  options: SceneDetectionOptions;
  /** Duration of the video in seconds */
  videoDuration: number;
}

/**
 * Represents a video file
 */
export interface VideoFile {
  /** Unique identifier for the video file */
  id: string;
  /** Original filename */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type of the file */
  type: string;
  /** URL or path to the video file */
  url: string;
  /** Duration of the video in seconds */
  duration?: number;
  /** Width of the video in pixels */
  width?: number;
  /** Height of the video in pixels */
  height?: number;
  /** Frame rate of the video in frames per second */
  frameRate?: number;
  /** Bitrate of the video in bits per second */
  bitrate?: number;
  /** Codec used for the video */
  codec?: string;
  /** Whether the video has audio */
  hasAudio?: boolean;
  /** Thumbnail image URL or data */
  thumbnail?: string;
  /** Date when the video was created or uploaded */
  createdAt?: Date;
  /** Additional metadata for the video */
  metadata?: Record<string, any>;
}

/**
 * Represents a complete video analysis result
 */
export interface VideoAnalysis {
  /** The video file that was analyzed */
  videoFile: VideoFile;
  /** Scene detection results */
  sceneDetection: SceneDetectionResult;
  /** Motion analysis data */
  motion?: {
    /** Overall motion level (0-1) */
    overallMotionLevel: number;
    /** Motion samples over time */
    samples: Array<{
      /** Time in seconds */
      time: number;
      /** Motion level (0-1) */
      level: number;
    }>;
    /** Timestamps of significant motion events */
    significantMotionEvents: number[];
  };
  /** Face detection data */
  faces?: {
    /** Total number of faces detected */
    totalFaceCount: number;
    /** Timestamps where faces are present */
    facePresenceTimestamps: number[];
    /** Regions with the highest face counts */
    highFaceCountRegions: Array<{
      /** Start time in seconds */
      startTime: number;
      /** End time in seconds */
      endTime: number;
      /** Number of faces in this region */
      faceCount: number;
    }>;
  };
  /** Quality analysis data */
  quality?: {
    /** Overall quality score (0-1) */
    overallQualityScore: number;
    /** Sharpness score (0-1) */
    sharpness: number;
    /** Brightness score (0-1) */
    brightness: number;
    /** Contrast score (0-1) */
    contrast: number;
    /** Noise level (0-1) */
    noiseLevel: number;
    /** Stability score (0-1) */
    stability: number;
    /** Regions with poor quality */
    poorQualityRegions: Array<{
      /** Start time in seconds */
      startTime: number;
      /** End time in seconds */
      endTime: number;
      /** Issue description */
      issue: string;
    }>;
  };
  /** Content analysis data */
  content?: {
    /** Detected objects */
    objects: string[];
    /** Detected actions */
    actions: string[];
    /** Detected settings/locations */
    settings: string[];
    /** Content tags */
    tags: string[];
    /** Content description */
    description: string;
  };
  /** Audio analysis data if the video has audio */
  audio?: any;
  /** Analysis timestamp */
  analyzedAt: Date;
  /** Any additional properties */
  [key: string]: any;
}
