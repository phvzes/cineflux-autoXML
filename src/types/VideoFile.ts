/**
 * VideoFile type definitions
 */
import { FileInfo, FileMetadata, FileProcessingInfo, FileProcessingStatus, FileSourceType, MediaDuration, MimeCategory, MimeTypeInfo, Resolution } from './FileTypes';

/**
 * Represents a video file in the application
 */
export interface VideoFile extends FileInfo {
  /**
   * Video-specific metadata
   */
  videoMetadata: {
    /**
     * Frame rate in frames per second
     */
    frameRate: number;
    
    /**
     * Codec used for the video
     */
    codec?: string;
    
    /**
     * Bitrate in bits per second
     */
    bitrate?: number;
    
    /**
     * Whether the video has audio
     */
    hasAudio: boolean;
    
    /**
     * Number of audio channels if the video has audio
     */
    audioChannels?: number;
    
    /**
     * Audio sample rate if the video has audio
     */
    audioSampleRate?: number;
    
    /**
     * Audio codec if the video has audio
     */
    audioCodec?: string;
    
    /**
     * Whether the video has subtitles
     */
    hasSubtitles: boolean;
    
    /**
     * Array of subtitle tracks if the video has subtitles
     */
    subtitleTracks?: {
      language: string;
      label: string;
      type: string;
    }[];
    
    /**
     * Color space information
     */
    colorSpace?: string;
    
    /**
     * Additional video metadata
     */
    [key: string]: unknown;
  };
  
  /**
   * Extracted frames from the video
   */
  extractedFrames?: {
    /**
     * Time in seconds when the frame occurs
     */
    time: number;
    
    /**
     * Data URL of the frame image
     */
    dataUrl: string;
  }[];
  
  /**
   * Thumbnail image for the video
   */
  thumbnail: string;
}

/**
 * Type guard to check if an object is a VideoFile
 */
export function isVideoFile(obj: unknown): obj is VideoFile {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const file = obj as Partial<VideoFile>;
  
  return (
    file.mimeInfo !== undefined &&
    file.mimeInfo.category === MimeCategory.VIDEO &&
    file.videoMetadata !== undefined &&
    typeof file.videoMetadata.frameRate === 'number' &&
    typeof file.videoMetadata.hasAudio === 'boolean' &&
    typeof file.videoMetadata.hasSubtitles === 'boolean' &&
    file.thumbnail !== undefined
  );
}

/**
 * Creates a new VideoFile object
 */
export function createVideoFile(
  file: File,
  metadata: Partial<FileMetadata> = {},
  videoMetadata: Partial<VideoFile['videoMetadata']> = {},
  resolution: Resolution = { width: 0, height: 0, aspectRatio: 0 },
  duration: MediaDuration = { seconds: 0, formatted: '00:00:00.000' },
  processing: Partial<FileProcessingInfo> = {}
): VideoFile {
  const id = metadata.id || `video-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date();
  
  const mimeInfo: MimeTypeInfo = {
    mimeType: file.type || 'video/mp4',
    category: MimeCategory.VIDEO,
    isSupported: true,
    extensions: [file.name.split('.').pop() || 'mp4']
  };
  
  return {
    metadata: {
      id,
      createdAt: metadata.createdAt || now,
      modifiedAt: metadata.modifiedAt || now,
      size: file.size,
      owner: metadata.owner,
      customMetadata: metadata.customMetadata
    },
    mimeInfo,
    filenameInfo: {
      fullName: file.name,
      baseName: file.name.substring(0, file.name.lastIndexOf('.')),
      extension: file.name.split('.').pop() || 'mp4',
      isValidName: true
    },
    duration,
    resolution,
    sourceType: FileSourceType.LOCAL_UPLOAD,
    processing: {
      status: FileProcessingStatus.QUEUED,
      progress: 0,
      ...processing
    },
    url: URL.createObjectURL(file),
    thumbnailUrl: '',
    videoMetadata: {
      frameRate: 30,
      hasAudio: true,
      hasSubtitles: false,
      ...videoMetadata
    },
    thumbnail: ''
  };
}
