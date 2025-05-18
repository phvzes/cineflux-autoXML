/**
 * Error handling utilities for the application
 */
import { AppError, ErrorCode } from '../types/errors';

/**
 * Safely executes a function and returns a result or error
 */
export function tryCatch<T>(fn: () => T): [T | null, Error | null] {
  try {
    const result = fn();
    return [result, null];
  } catch (error) {
    return [null, AppError.fromUnknown(error)];
  }
}

/**
 * Safely executes an async function and returns a result or error
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>
): Promise<[T | null, Error | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    return [null, AppError.fromUnknown(error)];
  }
}

/**
 * Wraps a function to catch errors and return a default value
 */
export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => T,
  defaultValue: T,
  errorHandler?: (error: Error) => void
): (...args: Args) => T {
  return (...args: Args) => {
    try {
      return fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(AppError.fromUnknown(error));
      }
      return defaultValue;
    }
  };
}

/**
 * Wraps an async function to catch errors and return a default value
 */
export function withAsyncErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  defaultValue: T,
  errorHandler?: (error: Error) => void
): (...args: Args) => Promise<T> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(AppError.fromUnknown(error));
      }
      return defaultValue;
    }
  };
}

/**
 * Handles an error by logging it and optionally showing a user message
 */
export function handleError(
  error: unknown,
  options: {
    silent?: boolean;
    defaultMessage?: string;
    context?: Record<string, unknown>;
  } = {}
): AppError {
  const appError = AppError.fromUnknown(error);
  
  // Add additional context if provided
  if (options.context) {
    appError.context = {
      ...appError.context,
      ...options.context
    };
  }
  
  // Log the error (in a real app, this might send to a logging service)
  console.error('[ERROR]', appError.code, appError.message, appError);
  
  return appError;
}

/**
 * Type guard to check if an error is a specific error code
 */
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return AppError.isAppError(error) && error.code === code;
}
