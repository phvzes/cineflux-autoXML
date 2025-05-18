/**
 * Utilities for handling asynchronous operations with proper typing
 */
import { AppError, ErrorCode } from '../types/errors';

/**
 * Result type for async operations
 */
export type AsyncResult<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: AppError };

/**
 * Wraps an async function to return a properly typed result
 */
export async function asyncHandler<T>(
  fn: () => Promise<T>,
  errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR
): Promise<AsyncResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const appError = error instanceof AppError
      ? error
      : new AppError({
          code: errorCode,
          message: error instanceof Error ? error.message : 'An unknown error occurred',
          originalError: error
        });
    
    return { success: false, error: appError };
  }
}

/**
 * Wraps a sync function to return a properly typed result
 */
export function syncHandler<T>(
  fn: () => T,
  errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR
): AsyncResult<T> {
  try {
    const data = fn();
    return { success: true, data };
  } catch (error) {
    const appError = error instanceof AppError
      ? error
      : new AppError({
          code: errorCode,
          message: error instanceof Error ? error.message : 'An unknown error occurred',
          originalError: error
        });
    
    return { success: false, error: appError };
  }
}

/**
 * Creates a promise that resolves after a specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a promise that resolves after a specified delay with a value
 */
export function delayValue<T>(ms: number, value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

/**
 * Creates a promise that rejects after a specified delay
 */
export function delayReject(ms: number, error: Error): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(error), ms));
}

/**
 * Creates a promise that times out after a specified delay
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new AppError({
        code: ErrorCode.TIMEOUT_ERROR,
        message: errorMessage
      }));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retries an async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
    retryableErrors?: ErrorCode[];
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 300,
    maxDelayMs = 5000,
    backoffFactor = 2,
    retryableErrors
  } = options;
  
  let lastError: Error | undefined;
  let delayMs = initialDelayMs;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry this error
      if (retryableErrors && 
          error instanceof AppError && 
          !retryableErrors.includes(error.code)) {
        throw error;
      }
      
      // If we've used all retries, throw the last error
      if (attempt >= maxRetries) {
        throw lastError;
      }
      
      // Wait before the next retry with exponential backoff
      await delay(Math.min(delayMs, maxDelayMs));
      delayMs *= backoffFactor;
    }
  }
  
  // This should never happen due to the throw in the loop
  throw lastError || new Error('Retry failed');
}

/**
 * Runs multiple promises in parallel with a concurrency limit
 */
export async function parallelLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrencyLimit: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];
  
  for (const [index, task] of tasks.entries()) {
    const p = task().then(result => {
      results[index] = result;
      executing.splice(executing.indexOf(p), 1);
    });
    
    executing.push(p);
    
    if (executing.length >= concurrencyLimit) {
      await Promise.race(executing);
    }
  }
  
  await Promise.all(executing);
  return results;
}

/**
 * Abortable promise that can be cancelled
 */
export function createAbortablePromise<T>(
  fn: (signal: AbortSignal) => Promise<T>
): { promise: Promise<T>; abort: () => void } {
  const controller = new AbortController();
  const { signal } = controller;
  
  const promise = fn(signal).catch(error => {
    if (signal.aborted) {
      throw new AppError({
        code: ErrorCode.CANCELLED,
        message: 'Operation was cancelled',
        originalError: error
      });
    }
    throw error;
  });
  
  return {
    promise,
    abort: () => controller.abort()
  };
}
