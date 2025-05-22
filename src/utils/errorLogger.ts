
/**
 * Error logging utility for CineFlux-AutoXML
 * 
 * This module provides functions for logging errors to the console
 * and potentially to an external error tracking service.
 */

// Types
interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  context?: Record<string, any>;
  timestamp: string;
  url: string;
  userAgent: string;
}

/**
 * Log an error to the console and potentially to an external service
 */
export function logError(error: Error, componentStack?: string, context?: Record<string, any>): void {
  const errorDetails: ErrorDetails = {
    message: error.message,
    stack: error.stack,
    componentStack,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  };
  
  // Log to console
  console.error('Application Error:', errorDetails);
  
  // In a production environment, you would send this to your error tracking service
  // Example: sendToErrorTrackingService(errorDetails);
}

/**
 * Log an API error
 */
export function logApiError(endpoint: string, error: any, requestData?: any): void {
  const errorDetails = {
    endpoint,
    message: error.message || 'Unknown API error',
    status: error.status || error.statusCode,
    requestData,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
  
  console.error('API Error:', errorDetails);
  
  // In a production environment, you would send this to your error tracking service
  // Example: sendToErrorTrackingService(errorDetails);
}

/**
 * Create a global error handler for unhandled errors
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  window.addEventListener('error', (event: any) => {
    logError(event.error || new Error(event.message), undefined, {
      type: 'window.onerror',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
    
    // Don't prevent the default handling
    return false;
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: any) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    logError(error, undefined, {
      type: 'unhandledrejection'
    });
  });
}

export default {
  logError,
  logApiError,
  setupGlobalErrorHandlers
};
