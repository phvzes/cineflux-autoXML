/**
 * Types for timeline-related functionality
 */

/**
 * Enum for different marker types on the timeline
 */
export enum MarkerType {
  BEAT = 'beat',
  SEGMENT = 'segment',
  SCENE = 'scene',
  SCENE_BOUNDARY = 'sceneBoundary',
  KEYFRAME = 'keyframe',
  TRANSITION = 'transition',
  EDIT_POINT = 'editPoint',
  CUSTOM = 'custom',
  COMMENT = 'comment',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Interface for a marker on the timeline
 */
export interface TimelineMarker {
  /**
   * Unique identifier for the marker
   */
  id: string;
  
  /**
   * Time in seconds where the marker is placed
   */
  time: number;
  
  /**
   * Type of marker
   */
  type: MarkerType;
  
  /**
   * Label for the marker
   */
  label: string;
  
  /**
   * Color of the marker
   */
  color: string;
  
  /**
   * Whether the marker is visible
   */
  visible: boolean;
  
  /**
   * Associated data for the marker
   */
  data?: any;
  
  /**
   * Additional metadata for the marker
   */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for a timeline track
 */
export interface TimelineTrack {
  /**
   * Unique identifier for the track
   */
  id: string;
  
  /**
   * Name of the track
   */
  name: string;
  
  /**
   * Type of track
   */
  type: 'video' | 'audio' | 'subtitle' | 'marker';
  
  /**
   * Height of the track in pixels
   */
  height: number;
  
  /**
   * Whether the track is visible
   */
  visible: boolean;
  
  /**
   * Whether the track is locked
   */
  locked: boolean;
  
  /**
   * Whether the track is muted (for audio tracks)
   */
  muted?: boolean;
  
  /**
   * Whether the track is soloed (for audio tracks)
   */
  solo?: boolean;
  
  /**
   * Color of the track
   */
  color?: string;
}

/**
 * Interface for a timeline clip
 */
export interface TimelineClip {
  /**
   * Unique identifier for the clip
   */
  id: string;
  
  /**
   * Track ID that the clip belongs to
   */
  trackId: string;
  
  /**
   * Start time of the clip in the timeline (seconds)
   */
  startTime: number;
  
  /**
   * End time of the clip in the timeline (seconds)
   */
  endTime: number;
  
  /**
   * Duration of the clip (seconds)
   */
  duration: number;
  
  /**
   * Start time in the source media (seconds)
   */
  sourceStartTime: number;
  
  /**
   * End time in the source media (seconds)
   */
  sourceEndTime: number;
  
  /**
   * Source media ID
   */
  sourceId: string;
  
  /**
   * Type of clip
   */
  type: 'video' | 'audio' | 'subtitle' | 'image' | 'graphic';
  
  /**
   * Name of the clip
   */
  name: string;
  
  /**
   * Color of the clip
   */
  color?: string;
  
  /**
   * Whether the clip is enabled
   */
  enabled: boolean;
  
  /**
   * Whether the clip is locked
   */
  locked: boolean;
  
  /**
   * Additional metadata for the clip
   */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for timeline state
 */
export interface TimelineState {
  /**
   * Current time position in the timeline (seconds)
   */
  currentTime: number;
  
  /**
   * Total duration of the timeline (seconds)
   */
  duration: number;
  
  /**
   * Zoom level of the timeline (pixels per second)
   */
  zoomLevel: number;
  
  /**
   * Scroll position of the timeline (seconds)
   */
  scrollPosition: number;
  
  /**
   * Whether the timeline is playing
   */
  isPlaying: boolean;
  
  /**
   * Whether the timeline is looping
   */
  isLooping: boolean;
  
  /**
   * Loop start time (seconds)
   */
  loopStart?: number;
  
  /**
   * Loop end time (seconds)
   */
  loopEnd?: number;
  
  /**
   * Timeline tracks
   */
  tracks: TimelineTrack[];
  
  /**
   * Timeline clips
   */
  clips: TimelineClip[];
  
  /**
   * Timeline markers
   */
  markers: TimelineMarker[];
  
  /**
   * Selected clip IDs
   */
  selectedClipIds: string[];
  
  /**
   * Selected marker IDs
   */
  selectedMarkerIds: string[];
  
  /**
   * Selected track IDs
   */
  selectedTrackIds: string[];
}
