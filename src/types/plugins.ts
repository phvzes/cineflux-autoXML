/**
 * CineFlux-AutoXML Plugin System Types
 * Defines the core types for the plugin architecture
 */

/**
 * Plugin metadata interface
 * Contains information about a plugin
 */
export interface PluginMetadata {
  id: string;                  // Unique identifier for the plugin
  name: string;                // Display name
  version: string;             // Semantic version
  author: string;              // Author information
  description: string;         // Brief description
  isWasm: boolean;             // Whether this is a WASM-based plugin
  type: PluginType;            // Type of plugin
  supportedFormats?: string[]; // File formats supported by this plugin
  dependencies?: string[];     // Other plugin IDs this plugin depends on
}

/**
 * Enum of available plugin types
 */
export enum PluginType {
  AudioAnalysis = 'audio-analysis',
  VideoAnalysis = 'video-analysis',
  SubtitleAnalysis = 'subtitle-analysis',
  MediaTranscoder = 'media-transcoder',
  XMLGenerator = 'xml-generator',
  Utility = 'utility'
}

/**
 * Plugin initialization options
 */
export interface PluginInitOptions {
  configOptions?: Record<string, any>;
  wasmBinary?: ArrayBuffer;
  dependencies?: Record<string, any>; // References to dependency plugins
}

/**
 * Plugin processing result
 */
export interface PluginResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error | string;
  metadata?: Record<string, any>;
  timestamp: number;
}

/**
 * Plugin processing options
 */
export interface PluginProcessOptions {
  data: ArrayBuffer | string | Record<string, any>;
  format?: string;
  options?: Record<string, any>;
}

/**
 * Plugin communication message types
 */
export enum PluginMessageType {
  Initialize = 'initialize',
  Process = 'process',
  Result = 'result',
  Error = 'error',
  Status = 'status',
  Dispose = 'dispose'
}

/**
 * Plugin message interface
 */
export interface PluginMessage {
  type: PluginMessageType;
  pluginId: string;
  payload?: any;
  timestamp: number;
}

/**
 * Plugin event types
 */
export enum PluginEventType {
  Registered = 'plugin-registered',
  Loaded = 'plugin-loaded',
  Unregistered = 'plugin-unregistered',
  Error = 'plugin-error',
  ProcessStarted = 'process-started',
  ProcessCompleted = 'process-completed'
}

/**
 * Plugin event interface
 */
export interface PluginEvent {
  type: PluginEventType;
  pluginId: string;
  data?: any;
  timestamp: number;
}
