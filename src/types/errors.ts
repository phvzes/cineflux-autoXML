/**
 * Error types for the CineFlux application
 */

export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  CANCELLED = 'CANCELLED',
  
  // File errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  
  // Audio processing errors
  AUDIO_DECODE_ERROR = 'AUDIO_DECODE_ERROR',
  AUDIO_CONTEXT_ERROR = 'AUDIO_CONTEXT_ERROR',
  AUDIO_ANALYSIS_ERROR = 'AUDIO_ANALYSIS_ERROR',
  BEAT_DETECTION_ERROR = 'BEAT_DETECTION_ERROR',
  
  // Video processing errors
  VIDEO_DECODE_ERROR = 'VIDEO_DECODE_ERROR',
  VIDEO_ANALYSIS_ERROR = 'VIDEO_ANALYSIS_ERROR',
  SCENE_DETECTION_ERROR = 'SCENE_DETECTION_ERROR',
  FRAME_EXTRACTION_ERROR = 'FRAME_EXTRACTION_ERROR',
  
  // Edit decision errors
  EDIT_DECISION_ERROR = 'EDIT_DECISION_ERROR',
  TIMELINE_ERROR = 'TIMELINE_ERROR',
  
  // Export errors
  EXPORT_ERROR = 'EXPORT_ERROR',
  XML_GENERATION_ERROR = 'XML_GENERATION_ERROR',
  
  // API errors
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Plugin errors
  PLUGIN_LOAD_ERROR = 'PLUGIN_LOAD_ERROR',
  PLUGIN_EXECUTION_ERROR = 'PLUGIN_EXECUTION_ERROR',
  WASM_ERROR = 'WASM_ERROR'
}

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  originalError?: Error | unknown;
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  code: ErrorCode;
  originalError?: Error | unknown;
  context?: Record<string, unknown>;
  
  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.originalError = options.originalError;
    this.context = options.context;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  /**
   * Helper to determine if an unknown error is an AppError
   */
  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
  
  /**
   * Convert an unknown error to an AppError
   */
  static fromUnknown(error: unknown, defaultCode = ErrorCode.UNKNOWN_ERROR): AppError {
    if (AppError.isAppError(error)) {
      return error;
    }
    
    let message = 'An unknown error occurred';
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error !== null && error !== undefined) {
      try {
        message = JSON.stringify(error);
      } catch {
        // If we can't stringify, use the default message
      }
    }
    
    return new AppError({
      code: defaultCode,
      message,
      originalError: error
    });
  }
}

// Specific error types
export class AudioProcessingError extends AppError {
  constructor(options: Omit<AppErrorOptions, 'code'> & { code?: ErrorCode }) {
    super({
      ...options,
      code: options.code || ErrorCode.AUDIO_ANALYSIS_ERROR
    });
    this.name = 'AudioProcessingError';
  }
}

export class VideoProcessingError extends AppError {
  constructor(options: Omit<AppErrorOptions, 'code'> & { code?: ErrorCode }) {
    super({
      ...options,
      code: options.code || ErrorCode.VIDEO_ANALYSIS_ERROR
    });
    this.name = 'VideoProcessingError';
  }
}

export class EditDecisionError extends AppError {
  constructor(options: Omit<AppErrorOptions, 'code'> & { code?: ErrorCode }) {
    super({
      ...options,
      code: options.code || ErrorCode.EDIT_DECISION_ERROR
    });
    this.name = 'EditDecisionError';
  }
}

export class PluginError extends AppError {
  constructor(options: Omit<AppErrorOptions, 'code'> & { code?: ErrorCode }) {
    super({
      ...options,
      code: options.code || ErrorCode.PLUGIN_EXECUTION_ERROR
    });
    this.name = 'PluginError';
  }
}

export class ApiError extends AppError {
  status?: number;
  
  constructor(options: Omit<AppErrorOptions, 'code'> & { code?: ErrorCode, status?: number }) {
    super({
      ...options,
      code: options.code || ErrorCode.API_ERROR
    });
    this.name = 'ApiError';
    this.status = options.status;
  }
}
