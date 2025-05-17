/**
 * VideoAnalysis.ts
 * Defines TypeScript interfaces for video analysis components including frame sequences,
 * clip metadata, motion analysis, content type classification, and scene detection.
 */

/**
 * Represents a single frame within a video sequence
 * @interface Frame
 */
export interface Frame {
  /** Unique identifier for the frame */
  id: string;
  /** Timestamp of the frame in milliseconds from the start of the video */
  timestamp: number;
  /** Frame number in the sequence */
  frameNumber: number;
  /** Optional path to the extracted frame image */
  imagePath?: string;
  /** Brightness value of the frame (0-1) */
  brightness?: number;
  /** Dominant colors in the frame as hex values */
  dominantColors?: string[];
  /** Detected objects within the frame */
  detectedObjects?: DetectedObject[];
}

/**
 * Represents an object detected within a frame
 * @interface DetectedObject
 */
export interface DetectedObject {
  /** Type/class of the detected object */
  type: string;
  /** Confidence score of the detection (0-1) */
  confidence: number;
  /** Bounding box coordinates of the detected object */
  boundingBox: BoundingBox;
}

/**
 * Represents a bounding box for detected objects
 * @interface BoundingBox
 */
export interface BoundingBox {
  /** X coordinate of the top-left corner (normalized 0-1) */
  x: number;
  /** Y coordinate of the top-left corner (normalized 0-1) */
  y: number;
  /** Width of the bounding box (normalized 0-1) */
  width: number;
  /** Height of the bounding box (normalized 0-1) */
  height: number;
}

/**
 * Represents a sequence of frames within a video
 * @interface FrameSequence
 */
export interface FrameSequence {
  /** Unique identifier for the sequence */
  id: string;
  /** Start timestamp of the sequence in milliseconds */
  startTime: number;
  /** End timestamp of the sequence in milliseconds */
  endTime: number;
  /** Array of frames in this sequence */
  frames: Frame[];
  /** Average brightness across the sequence (0-1) */
  averageBrightness?: number;
  /** Visual consistency score for the sequence (0-1) */
  visualConsistency?: number;
}

/**
 * Represents metadata for a video clip
 * @interface ClipMetadata
 */
export interface ClipMetadata {
  /** Unique identifier for the clip */
  id: string;
  /** Title or name of the clip */
  title?: string;
  /** Total duration of the clip in milliseconds */
  duration: number;
  /** Width of the video in pixels */
  width: number;
  /** Height of the video in pixels */
  height: number;
  /** Frames per second */
  frameRate: number;
  /** Video codec used (e.g., 'h264', 'vp9') */
  codec?: string;
  /** Bitrate of the video in kbps */
  bitrate?: number;
  /** Aspect ratio as a string (e.g., '16:9') */
  aspectRatio?: string;
  /** File size in bytes */
  fileSize?: number;
  /** File path or URL to the video */
  filePath: string;
  /** Creation date of the video */
  creationDate?: Date;
  /** Audio tracks associated with the video */
  audioTracks?: AudioTrackInfo[];
}

/**
 * Represents information about an audio track in the video
 * @interface AudioTrackInfo
 */
export interface AudioTrackInfo {
  /** Unique identifier for the audio track */
  id: string;
  /** Language of the audio track */
  language?: string;
  /** Audio codec used */
  codec?: string;
  /** Number of channels (1=mono, 2=stereo, etc.) */
  channels: number;
  /** Sample rate in Hz */
  sampleRate?: number;
  /** Bitrate in kbps */
  bitrate?: number;
}

/**
 * Enum for different types of camera movement
 * @enum CameraMovementType
 */
export enum CameraMovementType {
  STATIC = 'static',
  PAN = 'pan',
  TILT = 'tilt',
  ZOOM_IN = 'zoom_in',
  ZOOM_OUT = 'zoom_out',
  DOLLY_IN = 'dolly_in',
  DOLLY_OUT = 'dolly_out',
  TRUCK_LEFT = 'truck_left',
  TRUCK_RIGHT = 'truck_right',
  PEDESTAL_UP = 'pedestal_up',
  PEDESTAL_DOWN = 'pedestal_down',
  ROLL = 'roll',
  HANDHELD = 'handheld',
  UNKNOWN = 'unknown'
}

/**
 * Represents camera movement analysis for a segment of video
 * @interface CameraMovement
 */
export interface CameraMovement {
  /** Type of camera movement detected */
  type: CameraMovementType;
  /** Start timestamp of the movement in milliseconds */
  startTime: number;
  /** End timestamp of the movement in milliseconds */
  endTime: number;
  /** Confidence score of the detection (0-1) */
  confidence: number;
  /** Speed of the movement (normalized 0-1, where 1 is fastest) */
  speed?: number;
  /** Direction of movement in degrees (0-359) if applicable */
  direction?: number;
}

/**
 * Represents subject movement analysis within a video segment
 * @interface SubjectMovement
 */
export interface SubjectMovement {
  /** Identifier for the tracked subject */
  subjectId: string;
  /** Type of subject (e.g., 'person', 'vehicle', 'animal') */
  subjectType: string;
  /** Start timestamp of the tracking in milliseconds */
  startTime: number;
  /** End timestamp of the tracking in milliseconds */
  endTime: number;
  /** Array of positions over time */
  trajectory: TrajectoryPoint[];
  /** Overall movement speed (normalized 0-1) */
  averageSpeed?: number;
  /** Direction of movement in degrees (0-359) if consistent */
  primaryDirection?: number;
}

/**
 * Represents a point in a subject's movement trajectory
 * @interface TrajectoryPoint
 */
export interface TrajectoryPoint {
  /** Timestamp in milliseconds */
  timestamp: number;
  /** X position (normalized 0-1) */
  x: number;
  /** Y position (normalized 0-1) */
  y: number;
  /** Optional Z position for 3D tracking (normalized 0-1) */
  z?: number;
  /** Size of the subject at this point (normalized 0-1) */
  size?: number;
}

/**
 * Comprehensive motion analysis for a video segment
 * @interface MotionAnalysis
 */
export interface MotionAnalysis {
  /** Unique identifier for this analysis */
  id: string;
  /** Start timestamp of the analysis in milliseconds */
  startTime: number;
  /** End timestamp of the analysis in milliseconds */
  endTime: number;
  /** Camera movement detections */
  cameraMovements: CameraMovement[];
  /** Subject movement tracking */
  subjectMovements: SubjectMovement[];
  /** Overall motion intensity score (0-1) */
  motionIntensity: number;
  /** Stability score for the segment (0-1, where 1 is most stable) */
  stabilityScore?: number;
  /** Visual flow vectors if available */
  opticalFlow?: OpticalFlowData;
}

/**
 * Represents optical flow data for motion analysis
 * @interface OpticalFlowData
 */
export interface OpticalFlowData {
  /** Timestamp of the optical flow data */
  timestamp: number;
  /** Downsampled grid of flow vectors */
  flowVectors: FlowVector[];
  /** Average magnitude of flow */
  averageMagnitude: number;
  /** Dominant direction of flow in degrees (0-359) */
  dominantDirection?: number;
}

/**
 * Represents a single optical flow vector
 * @interface FlowVector
 */
export interface FlowVector {
  /** X position in the grid (normalized 0-1) */
  x: number;
  /** Y position in the grid (normalized 0-1) */
  y: number;
  /** X component of the flow vector */
  dx: number;
  /** Y component of the flow vector */
  dy: number;
  /** Magnitude of the flow vector */
  magnitude: number;
}

/**
 * Enum for different types of video content
 * @enum ContentType
 */
export enum ContentType {
  PERFORMANCE = 'performance',
  INTERVIEW = 'interview',
  B_ROLL = 'b_roll',
  ESTABLISHING_SHOT = 'establishing_shot',
  DIALOGUE = 'dialogue',
  ACTION = 'action',
  MONTAGE = 'montage',
  TITLE_CARD = 'title_card',
  CREDITS = 'credits',
  TRANSITION = 'transition',
  STOCK_FOOTAGE = 'stock_footage',
  USER_GENERATED = 'user_generated',
  ANIMATION = 'animation',
  UNKNOWN = 'unknown'
}

/**
 * Represents content type classification for a video segment
 * @interface ContentTypeClassification
 */
export interface ContentTypeClassification {
  /** Unique identifier for this classification */
  id: string;
  /** Start timestamp of the segment in milliseconds */
  startTime: number;
  /** End timestamp of the segment in milliseconds */
  endTime: number;
  /** Primary content type detected */
  primaryType: ContentType;
  /** Confidence score for the primary type (0-1) */
  confidence: number;
  /** Secondary content types with confidence scores */
  secondaryTypes?: {
    type: ContentType;
    confidence: number;
  }[];
  /** Tags or keywords associated with the content */
  tags?: string[];
  /** Descriptive summary of the content */
  description?: string;
}

/**
 * Enum for different types of scenes
 * @enum SceneType
 */
export enum SceneType {
  INTERIOR = 'interior',
  EXTERIOR = 'exterior',
  DAY = 'day',
  NIGHT = 'night',
  URBAN = 'urban',
  RURAL = 'rural',
  NATURE = 'nature',
  DOMESTIC = 'domestic',
  INDUSTRIAL = 'industrial',
  UNDERWATER = 'underwater',
  AERIAL = 'aerial',
  SPACE = 'space',
  ABSTRACT = 'abstract',
  UNKNOWN = 'unknown'
}

/**
 * Represents a detected scene in a video
 * @interface Scene
 */
export interface Scene {
  /** Unique identifier for the scene */
  id: string;
  /** Start timestamp of the scene in milliseconds */
  startTime: number;
  /** End timestamp of the scene in milliseconds */
  endTime: number;
  /** Duration of the scene in milliseconds */
  duration: number;
  /** Types of scene detected */
  sceneTypes: SceneType[];
  /** Confidence score for scene boundary detection (0-1) */
  boundaryConfidence: number;
  /** Visual similarity score with previous scene (0-1, where 0 is completely different) */
  visualSimilarityToPrevious?: number;
  /** Key frames that represent this scene */
  keyFrames?: Frame[];
  /** Descriptive summary of the scene */
  description?: string;
}

/**
 * Represents the complete scene detection analysis for a video
 * @interface SceneDetectionResult
 */
export interface SceneDetectionResult {
  /** Unique identifier for this analysis */
  id: string;
  /** Array of detected scenes */
  scenes: Scene[];
  /** Total number of scenes detected */
  sceneCount: number;
  /** Average scene duration in milliseconds */
  averageSceneDuration: number;
  /** Timestamp of the analysis */
  analysisTimestamp: Date;
  /** Version of the scene detection algorithm used */
  algorithmVersion?: string;
  /** Parameters used for scene detection */
  detectionParameters?: Record<string, any>;
}

/**
 * Comprehensive video analysis result combining all analysis components
 * @interface VideoAnalysisResult
 */
export interface VideoAnalysisResult {
  /** Unique identifier for this analysis */
  id: string;
  /** Metadata about the analyzed clip */
  clipMetadata: ClipMetadata;
  /** Frame sequences extracted from the video */
  frameSequences?: FrameSequence[];
  /** Motion analysis results */
  motionAnalysis?: MotionAnalysis;
  /** Content type classifications */
  contentClassifications?: ContentTypeClassification[];
  /** Scene detection results */
  sceneDetection?: SceneDetectionResult;
  /** Timestamp when the analysis was performed */
  analysisTimestamp: Date;
  /** Version of the analysis system */
  analysisVersion: string;
  /** Processing time in milliseconds */
  processingTime?: number;
  /** Any errors or warnings encountered during analysis */
  issues?: {
    type: 'error' | 'warning';
    message: string;
    timestamp: number;
  }[];
}