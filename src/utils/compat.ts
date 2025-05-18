
/**
 * compat.ts
 * 
 * Utility for browser compatibility detection and feature support.
 * Provides functions to check for browser support of various features:
 * - WebAssembly
 * - Web Audio API
 * - Modern JavaScript features
 * - Web Workers
 * - IndexedDB
 * - WebGL
 */

// Interface for browser compatibility information
export interface BrowserCompatInfo {
  browser: string;
  version: string;
  os: string;
  supportsWebAssembly: boolean;
  supportsWebAudio: boolean;
  supportsWebWorkers: boolean;
  supportsIndexedDB: boolean;
  supportsWebGL: boolean;
  supportsSharedArrayBuffer: boolean;
  supportsBigInt64Array: boolean;
  warnings: string[];
  isSupportedBrowser: boolean;
}

// Minimum supported browser versions
const MIN_BROWSER_VERSIONS = {
  chrome: 80,
  firefox: 76,
  safari: 14,
  edge: 80,
};

/**
 * Detect the current browser and version
 * 
 * @returns Object with browser name and version
 */
function detectBrowser(): { name: string; version: string; os: string } {
  const userAgent = navigator.userAgent;
  let browserName = 'unknown';
  let browserVersion = 'unknown';
  let os = 'unknown';
  
  // Detect operating system
  if (userAgent.indexOf('Windows') !== -1) os = 'Windows';
  else if (userAgent.indexOf('Mac') !== -1) os = 'MacOS';
  else if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
  else if (userAgent.indexOf('Android') !== -1) os = 'Android';
  else if (userAgent.indexOf('iOS') !== -1 || userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) os = 'iOS';
  
  // Detect browser
  if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Edg') === -1) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.indexOf('Firefox') !== -1) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.indexOf('Edg') !== -1) {
    browserName = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    if (match) browserVersion = match[1];
  }
  
  return { name: browserName, version: browserVersion, os };
}

/**
 * Check if WebAssembly is supported
 * 
 * @returns Boolean indicating WebAssembly support
 */
export function supportsWebAssembly(): boolean {
  return (
    typeof WebAssembly === 'object' &&
    typeof WebAssembly.instantiate === 'function' &&
    typeof WebAssembly.compile === 'function'
  );
}

/**
 * Check if Web Audio API is supported
 * 
 * @returns Boolean indicating Web Audio API support
 */
export function supportsWebAudio(): boolean {
  return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
}

/**
 * Check if Web Workers are supported
 * 
 * @returns Boolean indicating Web Workers support
 */
export function supportsWebWorkers(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * Check if IndexedDB is supported
 * 
 * @returns Boolean indicating IndexedDB support
 */
export function supportsIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Check if WebGL is supported
 * 
 * @returns Boolean indicating WebGL support
 */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      (window as any).WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

/**
 * Check if SharedArrayBuffer is supported
 * 
 * @returns Boolean indicating SharedArrayBuffer support
 */
export function supportsSharedArrayBuffer(): boolean {
  return typeof SharedArrayBuffer !== 'undefined';
}

/**
 * Check if BigInt64Array is supported
 * 
 * @returns Boolean indicating BigInt64Array support
 */
export function supportsBigInt64Array(): boolean {
  return typeof BigInt64Array !== 'undefined';
}

/**
 * Check if the current browser version is supported
 * 
 * @param browserName - Name of the browser
 * @param browserVersion - Version of the browser
 * @returns Boolean indicating if the browser version is supported
 */
function isSupportedBrowserVersion(browserName: string, browserVersion: string): boolean {
  const lowerCaseName = browserName.toLowerCase();
  const version = parseInt(browserVersion, 10);
  
  if (isNaN(version)) return false;
  
  if (lowerCaseName in MIN_BROWSER_VERSIONS) {
    const minVersion = MIN_BROWSER_VERSIONS[lowerCaseName as keyof typeof MIN_BROWSER_VERSIONS];
    return version >= minVersion;
  }
  
  return false;
}

/**
 * Get comprehensive browser compatibility information
 * 
 * @returns Object with browser compatibility information
 */
export function getBrowserCompatInfo(): BrowserCompatInfo {
  const { name, version, os } = detectBrowser();
  const warnings: string[] = [];
  
  // Check WebAssembly support
  const hasWebAssembly = supportsWebAssembly();
  if (!hasWebAssembly) {
    warnings.push('WebAssembly is not supported. This is required for video and audio processing.');
  }
  
  // Check Web Audio API support
  const hasWebAudio = supportsWebAudio();
  if (!hasWebAudio) {
    warnings.push('Web Audio API is not supported. This is required for audio analysis.');
  }
  
  // Check Web Workers support
  const hasWebWorkers = supportsWebWorkers();
  if (!hasWebWorkers) {
    warnings.push('Web Workers are not supported. This may affect performance during processing.');
  }
  
  // Check IndexedDB support
  const hasIndexedDB = supportsIndexedDB();
  if (!hasIndexedDB) {
    warnings.push('IndexedDB is not supported. This may affect caching capabilities.');
  }
  
  // Check WebGL support
  const hasWebGL = supportsWebGL();
  if (!hasWebGL) {
    warnings.push('WebGL is not supported. This may affect video preview quality.');
  }
  
  // Check SharedArrayBuffer support
  const hasSharedArrayBuffer = supportsSharedArrayBuffer();
  if (!hasSharedArrayBuffer) {
    warnings.push('SharedArrayBuffer is not supported. This may affect performance during processing.');
  }
  
  // Check BigInt64Array support
  const hasBigInt64Array = supportsBigInt64Array();
  if (!hasBigInt64Array) {
    warnings.push('BigInt64Array is not supported. This may affect processing of large files.');
  }
  
  // Check browser version
  const isSupportedVersion = isSupportedBrowserVersion(name, version);
  if (!isSupportedVersion) {
    warnings.push(`Your browser (${name} ${version}) may not be fully supported. We recommend using Chrome 80+, Firefox 76+, Safari 14+, or Edge 80+.`);
  }
  
  // Determine if browser is supported overall
  const isSupportedBrowser = hasWebAssembly && hasWebAudio && isSupportedVersion;
  
  return {
    browser: name,
    version,
    os,
    supportsWebAssembly: hasWebAssembly,
    supportsWebAudio: hasWebAudio,
    supportsWebWorkers: hasWebWorkers,
    supportsIndexedDB: hasIndexedDB,
    supportsWebGL: hasWebGL,
    supportsSharedArrayBuffer: hasSharedArrayBuffer,
    supportsBigInt64Array: hasBigInt64Array,
    warnings,
    isSupportedBrowser,
  };
}

/**
 * Display browser compatibility warnings if needed
 * 
 * @param targetElement - DOM element to append warnings to, defaults to document.body
 * @returns The created warning element if warnings were displayed, null otherwise
 */
export function showBrowserCompatWarnings(targetElement?: HTMLElement): HTMLElement | null {
  const compat = getBrowserCompatInfo();
  
  if (compat.warnings.length === 0) {
    return null;
  }
  
  const warningElement = document.createElement('div');
  warningElement.className = 'browser-compat-warning';
  warningElement.style.position = 'fixed';
  warningElement.style.top = '0';
  warningElement.style.left = '0';
  warningElement.style.right = '0';
  warningElement.style.backgroundColor = '#FEF3C7';
  warningElement.style.color = '#92400E';
  warningElement.style.padding = '12px';
  warningElement.style.zIndex = '9999';
  warningElement.style.fontSize = '14px';
  warningElement.style.textAlign = 'center';
  
  // Create warning header
  const header = document.createElement('div');
  header.style.fontWeight = 'bold';
  header.style.marginBottom = '8px';
  header.textContent = 'Browser Compatibility Warning';
  warningElement.appendChild(header);
  
  // Create warning list
  const list = document.createElement('ul');
  list.style.listStyleType = 'none';
  list.style.margin = '0';
  list.style.padding = '0';
  
  compat.warnings.forEach(warning => {
    const item = document.createElement('li');
    item.style.margin = '4px 0';
    item.textContent = warning;
    list.appendChild(item);
  });
  
  warningElement.appendChild(list);
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Dismiss';
  closeButton.style.marginTop = '8px';
  closeButton.style.padding = '4px 12px';
  closeButton.style.backgroundColor = '#92400E';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '4px';
  closeButton.style.cursor = 'pointer';
  
  closeButton.addEventListener('click', () => {
    warningElement.remove();
    
    // Store in session storage to prevent showing again in this session
    try {
      sessionStorage.setItem('browser-compat-warning-dismissed', 'true');
    } catch (e) {
      // Ignore storage errors
    }
  });
  
  warningElement.appendChild(closeButton);
  
  // Check if warning was already dismissed
  try {
    if (sessionStorage.getItem('browser-compat-warning-dismissed') === 'true') {
      return null;
    }
  } catch (e) {
    // Ignore storage errors
  }
  
  // Append to target element or body
  const target = targetElement || document.body;
  target.appendChild(warningElement);
  
  return warningElement;
}

/**
 * Initialize browser compatibility checks and show warnings if needed
 */
export function initBrowserCompat(): void {
  if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        showBrowserCompatWarnings();
      });
    } else {
      showBrowserCompatWarnings();
    }
  }
}

export default {
  supportsWebAssembly,
  supportsWebAudio,
  supportsWebWorkers,
  supportsIndexedDB,
  supportsWebGL,
  supportsSharedArrayBuffer,
  supportsBigInt64Array,
  getBrowserCompatInfo,
  showBrowserCompatWarnings,
  initBrowserCompat,
};
