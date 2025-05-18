/**
 * UITypes.ts
 * 
 * This file defines TypeScript interfaces for UI-related state management in the CineFlux application.
 * It includes types for application workflow, modals, playback controls, theming, tool visibility,
 * notifications, and user interaction tracking.
 */

/**
 * Represents the main workflow steps/stages of the application
 */
/**
 * Enum for different application UI steps
 * Note: This should be aligned with WorkflowStep enum where applicable
 */
export enum ApplicationStep {
  WELCOME = 'welcome',
  FILE_UPLOAD = 'file_upload',
  MEDIA_ANALYSIS = 'media_analysis',
  EDIT = 'edit',
  PREVIEW = 'preview',
  EXPORT = 'export',
  SETTINGS = 'settings'
}

/**
 * Represents the current sub-step within a main application step
 */
export interface WorkflowState {
  /** The current main step in the application workflow */
  currentStep: ApplicationStep;
  /** The current sub-step within the main step (if applicable) */
  subStep?: string;
  /** Whether the current step is in a loading/processing state */
  isProcessing: boolean;
  /** Percentage completion of the current step (0-100) */
  progressPercentage: number;
  /** Optional message describing the current operation */
  statusMessage?: string;
  /** History of previously visited steps for navigation purposes */
  stepHistory: ApplicationStep[];
}

/**
 * Types of modal dialogs available in the application
 */
export enum ModalType {
  NONE = 'none',
  CONFIRM = 'confirm',
  ALERT = 'alert',
  FILE_PICKER = 'file_picker',
  SETTINGS = 'settings',
  EXPORT_OPTIONS = 'export_options',
  HELP = 'help',
  KEYBOARD_SHORTCUTS = 'keyboard_shortcuts',
  EDIT_METADATA = 'edit_metadata',
  CUSTOM = 'custom'
}

/**
 * Configuration for a modal dialog
 */
export interface ModalConfig {
  /** The type of modal to display */
  type: ModalType;
  /** Whether the modal is currently visible */
  isVisible: boolean;
  /** The title of the modal */
  title: string;
  /** The main content/message of the modal */
  content?: string;
  /** Custom component name to render (for CUSTOM type) */
  componentName?: string;
  /** Data to pass to the modal */
  data?: Record<string, any>;
  /** Callback function name for confirm action */
  onConfirm?: string;
  /** Callback function name for cancel/dismiss action */
  onCancel?: string;
  /** Whether the modal can be closed by clicking outside or pressing ESC */
  isDismissible: boolean;
  /** Size of the modal (small, medium, large, fullscreen) */
  size: 'sm' | 'md' | 'lg' | 'fullscreen';
}

/**
 * State for media playback controls
 */
export interface PlaybackState {
  /** Whether media is currently playing */
  isPlaying: boolean;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration of the media in seconds */
  duration: number;
  /** Playback speed multiplier (1.0 = normal speed) */
  playbackRate: number;
  /** Whether playback is currently muted */
  isMuted: boolean;
  /** Volume level (0.0 to 1.0) */
  volume: number;
  /** Whether the media is currently loading */
  isBuffering: boolean;
  /** Whether to loop playback when reaching the end */
  isLooping: boolean;
  /** In/out points for playback region selection */
  inPoint?: number;
  outPoint?: number;
  /** Whether frame-by-frame navigation is enabled */
  frameStepEnabled: boolean;
  /** Current frame number when frame stepping is enabled */
  currentFrame?: number;
  /** Total number of frames in the media */
  totalFrames?: number;
  /** Frame rate of the current media (frames per second) */
  fps?: number;
}

/**
 * Available application themes
 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

/**
 * Theme configuration settings
 */
export interface ThemeConfig {
  /** The current theme mode */
  mode: ThemeMode;
  /** Whether to use high contrast mode for accessibility */
  highContrast: boolean;
  /** Primary color accent for the UI */
  accentColor: string;
  /** Font size adjustment (percentage from default) */
  fontSizeAdjustment: number;
  /** Whether animations are enabled */
  animationsEnabled: boolean;
  /** Custom theme name if using a preset theme */
  customThemeName?: string;
  /** Whether to use rounded or sharp corners for UI elements */
  cornerStyle: 'rounded' | 'sharp';
}

/**
 * Visibility state for various tools and panels
 */
export interface ToolVisibility {
  /** Whether the timeline panel is visible */
  timeline: boolean;
  /** Whether the media browser panel is visible */
  mediaBrowser: boolean;
  /** Whether the properties panel is visible */
  properties: boolean;
  /** Whether the audio waveform display is visible */
  audioWaveform: boolean;
  /** Whether the effects panel is visible */
  effects: boolean;
  /** Whether the metadata panel is visible */
  metadata: boolean;
  /** Whether the console/log panel is visible */
  console: boolean;
  /** Whether the toolbar is visible */
  toolbar: boolean;
  /** Whether the inspector panel is visible */
  inspector: boolean;
  /** Custom tool visibility states */
  custom: Record<string, boolean>;
}

/**
 * Notification severity levels
 */
export enum NotificationSeverity {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

/**
 * Notification message configuration
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;
  /** The title/header of the notification */
  title: string;
  /** The main message content */
  message: string;
  /** Severity level of the notification */
  severity: NotificationSeverity;
  /** When the notification was created */
  timestamp: number;
  /** Whether the notification has been read/acknowledged */
  isRead: boolean;
  /** Whether the notification is dismissible */
  isDismissible: boolean;
  /** How long to show the notification (in ms, 0 for persistent) */
  duration: number;
  /** Optional action button text */
  actionText?: string;
  /** Optional action callback function name */
  actionCallback?: string;
  /** Optional grouping category */
  category?: string;
}

/**
 * User interaction event types
 */
export enum InteractionType {
  CLICK = 'click',
  HOVER = 'hover',
  DRAG = 'drag',
  DROP = 'drop',
  KEY_PRESS = 'key_press',
  SCROLL = 'scroll',
  ZOOM = 'zoom',
  SELECTION = 'selection',
  CONTEXT_MENU = 'context_menu'
}

/**
 * User interaction event tracking
 */
export interface InteractionEvent {
  /** Type of interaction */
  type: InteractionType;
  /** Timestamp when the interaction occurred */
  timestamp: number;
  /** Element/component that was interacted with */
  target: string;
  /** Additional data about the interaction */
  data?: Record<string, any>;
  /** Duration of the interaction (for drag, hover, etc.) */
  duration?: number;
  /** Position data for spatial interactions */
  position?: {
    x: number;
    y: number;
  };
  /** The current application step when the interaction occurred */
  applicationStep?: ApplicationStep;
}

/**
 * Layout configuration for the UI
 */
export interface LayoutConfig {
  /** Current layout preset name */
  preset: 'default' | 'compact' | 'editing' | 'analysis' | 'custom';
  /** Whether panels can be resized */
  resizable: boolean;
  /** Whether panels can be rearranged */
  rearrangeable: boolean;
  /** Panel size configurations */
  panelSizes: Record<string, { width?: number; height?: number }>;
  /** Panel position configurations */
  panelPositions: Record<string, { x?: number; y?: number }>;
  /** Whether to use a single-panel focused mode */
  focusedMode: boolean;
  /** The currently focused panel in focused mode */
  focusedPanel?: string;
}

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Human-readable name of the shortcut */
  name: string;
  /** Key combination (e.g., "Ctrl+S") */
  keyCombination: string;
  /** Action to perform when triggered */
  action: string;
  /** Context in which this shortcut is active */
  context: 'global' | 'timeline' | 'playback' | string;
  /** Whether the shortcut is currently enabled */
  enabled: boolean;
  /** Whether this is a custom user-defined shortcut */
  isCustom: boolean;
}

/**
 * Main UI state interface that combines all UI-related state
 */
export interface UIState {
  /** Current workflow state */
  workflow: WorkflowState;
  /** Current modal configuration */
  modal: ModalConfig;
  /** Playback control state */
  playback: PlaybackState;
  /** Theme configuration */
  theme: ThemeConfig;
  /** Tool and panel visibility settings */
  toolVisibility: ToolVisibility;
  /** Active notifications */
  notifications: Notification[];
  /** Recent user interactions */
  recentInteractions: InteractionEvent[];
  /** UI layout configuration */
  layout: LayoutConfig;
  /** Keyboard shortcuts configuration */
  keyboardShortcuts: KeyboardShortcut[];
  /** Whether the UI is in a loading state */
  isLoading: boolean;
  /** Whether the UI is in fullscreen mode */
  isFullscreen: boolean;
  /** Whether the UI is in presentation mode (minimal controls) */
  isPresentationMode: boolean;
  /** Whether the UI is in touch/mobile mode */
  isTouchMode: boolean;
  /** Current UI scale factor */
  uiScale: number;
}
