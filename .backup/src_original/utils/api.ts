/**
 * API utility for CineFlux-AutoXML
 * 
 * This module provides functions for making API requests with built-in error handling.
 */

import errorLogger from './errorLogger';

// Types
interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Make a fetch request with error handling
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  try {
    // Add query parameters if provided
    if (options.params) {
      const queryParams = new URLSearchParams(options.params).toString();
      url = `${url}${url.includes('?') ? '&' : '?'}${queryParams}`;
    }
    
    // Make the request
    const response = await fetch(url, options);
    
    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.message || `API error: ${response.status} ${response.statusText}`
      );
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }
    
    // Parse the response
    const data = await response.json();
    return data as T;
  } catch (error) {
    // Log the error
    errorLogger.logApiError(url, error, {
      method: options.method || 'GET',
      body: options.body,
      params: options.params
    });
    
    // Rethrow the error
    throw error;
  }
}

/**
 * Make a GET request
 */
export function get<T>(url: string, options: ApiOptions = {}): Promise<T> {
  return fetchWithErrorHandling<T>(url, {
    ...options,
    method: 'GET'
  });
}

/**
 * Make a POST request
 */
export function post<T>(url: string, data: any, options: ApiOptions = {}): Promise<T> {
  return fetchWithErrorHandling<T>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data)
  });
}

/**
 * Make a PUT request
 */
export function put<T>(url: string, data: any, options: ApiOptions = {}): Promise<T> {
  return fetchWithErrorHandling<T>(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data)
  });
}

/**
 * Make a DELETE request
 */
export function del<T>(url: string, options: ApiOptions = {}): Promise<T> {
  return fetchWithErrorHandling<T>(url, {
    ...options,
    method: 'DELETE'
  });
}

export default {
  get,
  post,
  put,
  delete: del,
  fetchWithErrorHandling
};
