
/**
 * Browser compatibility detection utilities
 */

/**
 * Check if WebAssembly is supported in the current browser
 * @returns Boolean indicating WebAssembly support
 */
export function isWebAssemblySupported(): boolean {
  return typeof WebAssembly === 'object' && 
         typeof WebAssembly.compile === 'function' &&
         typeof WebAssembly.instantiate === 'function';
}

/**
 * Check if SharedArrayBuffer is supported in the current browser
 * @returns Boolean indicating SharedArrayBuffer support
 */
export function isSharedArrayBufferSupported(): boolean {
  return typeof SharedArrayBuffer === 'function';
}

/**
 * Check if Web Audio API is supported in the current browser
 * @returns Boolean indicating Web Audio API support
 */
export function isWebAudioSupported(): boolean {
  return typeof AudioContext !== 'undefined' || 
         typeof (window as any).webkitAudioContext !== 'undefined';
}

/**
 * Check if the browser has proper CORS headers for SharedArrayBuffer
 * @returns Boolean indicating if CORS headers are properly set
 */
export function hasProperCorsHeaders(): boolean {
  try {
    // Check Cross-Origin-Embedder-Policy header
    const coep = document.querySelector('meta[http-equiv="Cross-Origin-Embedder-Policy"]');
    const coepValue = coep ? coep.getAttribute('content') : null;
    
    // Check Cross-Origin-Opener-Policy header
    const coop = document.querySelector('meta[http-equiv="Cross-Origin-Opener-Policy"]');
    const coopValue = coop ? coop.getAttribute('content') : null;
    
    return coepValue === 'require-corp' && coopValue === 'same-origin';
  } catch (e) {
    console.error('Error checking CORS headers:', e);
    return false;
  }
}

/**
 * Get a compatibility report for the current browser
 * @returns Object with compatibility information
 */
export function getCompatibilityReport() {
  return {
    webAssembly: isWebAssemblySupported(),
    sharedArrayBuffer: isSharedArrayBufferSupported(),
    webAudio: isWebAudioSupported(),
    properCorsHeaders: hasProperCorsHeaders(),
    userAgent: navigator.userAgent,
  };
}

export default {
  isWebAssemblySupported,
  isSharedArrayBufferSupported,
  isWebAudioSupported,
  hasProperCorsHeaders,
  getCompatibilityReport
};
