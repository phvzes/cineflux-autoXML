
/**
 * perfMonitor.ts
 * 
 * Utility for monitoring and tracking performance metrics in the application.
 * Provides a wrapper around the Performance API with additional features:
 * - Custom performance marks and measures
 * - Performance data collection and reporting
 * - Integration with analytics systems
 * - Long task detection and reporting
 * - Critical workflow performance tracking
 */

// Interface for performance data
interface PerformanceData {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
  timestamp: number;
}

// Interface for long task data
interface LongTaskData {
  startTime: number;
  duration: number;
  attribution: Array<{
    name: string;
    containerType: string;
    containerName: string;
    containerId: string;
    containerSrc: string;
  }>;
  timestamp: number;
}

// Interface for performance metrics report
interface PerformanceReport {
  metrics: PerformanceData[];
  longTasks: LongTaskData[];
  navigationTiming?: Record<string, number>;
  resourceTiming?: Record<string, any>;
  memoryInfo?: Record<string, number>;
  timestamp: number;
}

// Performance thresholds for different operations
const PERFORMANCE_THRESHOLDS = {
  // Component loading thresholds (in ms)
  COMPONENT_LOAD: {
    GOOD: 300,
    ACCEPTABLE: 1000,
  },
  // WebAssembly loading thresholds (in ms)
  WASM_LOAD: {
    GOOD: 1000,
    ACCEPTABLE: 3000,
  },
  // Route transition thresholds (in ms)
  ROUTE_TRANSITION: {
    GOOD: 100,
    ACCEPTABLE: 300,
  },
  // File processing thresholds (in ms)
  FILE_PROCESSING: {
    GOOD: 2000,
    ACCEPTABLE: 5000,
  },
  // Initial load thresholds (in ms)
  INITIAL_LOAD: {
    GOOD: 2000,
    ACCEPTABLE: 4000,
  },
  // Long task thresholds (in ms)
  LONG_TASK: {
    WARNING: 100,
    CRITICAL: 200,
  },
  // Critical workflow thresholds (in ms)
  CRITICAL_WORKFLOW: {
    GOOD: 1000,
    ACCEPTABLE: 3000,
  },
};

// Collection of performance data
const performanceData: PerformanceData[] = [];

// Collection of long task data
const longTaskData: LongTaskData[] = [];

// Maximum number of entries to keep in memory
const MAX_ENTRIES = 100;

// Maximum number of long tasks to keep in memory
const MAX_LONG_TASK_ENTRIES = 50;

// Performance observer for long tasks
let longTaskObserver: PerformanceObserver | null = null;

// Critical workflow steps being tracked
const criticalWorkflowSteps = new Set<string>();

/**
 * Create a performance mark
 * 
 * @param name - Name of the mark
 */
function mark(name: string): void {
  if (typeof performance !== 'undefined') {
    try {
      performance.mark(name);
    } catch (error) {
      console.error(`[PerfMonitor] Error creating mark "${name}":`, error);
    }
  }
}

/**
 * Create a performance measure between two marks
 * 
 * @param name - Name of the measure
 * @param startMark - Name of the start mark
 * @param endMark - Name of the end mark
 * @returns Duration of the measure in milliseconds, or undefined if measurement failed
 */
function measure(name: string, startMark: string, endMark: string): number | undefined {
  if (typeof performance !== 'undefined') {
    try {
      const measureEntry = performance.measure(name, startMark, endMark);
      
      // Store performance data
      storePerformanceData({
        name,
        startTime: measureEntry.startTime,
        duration: measureEntry.duration,
        entryType: measureEntry.entryType,
        timestamp: Date.now(),
      });
      
      // Check if this is a critical workflow step
      if (criticalWorkflowSteps.has(name)) {
        reportCriticalWorkflowStep(name, measureEntry.duration);
      }
      
      return measureEntry.duration;
    } catch (error) {
      console.error(`[PerfMonitor] Error creating measure "${name}":`, error);
    }
  }
  return undefined;
}

/**
 * Store performance data in memory
 * 
 * @param data - Performance data to store
 */
function storePerformanceData(data: PerformanceData): void {
  // Add to collection
  performanceData.push(data);
  
  // Trim collection if it exceeds maximum size
  if (performanceData.length > MAX_ENTRIES) {
    performanceData.shift();
  }
  
  // Log performance data in development
  if (import.meta.env.DEV) {
    logPerformanceData(data);
  }
}

/**
 * Store long task data in memory
 * 
 * @param data - Long task data to store
 */
function storeLongTaskData(data: LongTaskData): void {
  // Add to collection
  longTaskData.push(data);
  
  // Trim collection if it exceeds maximum size
  if (longTaskData.length > MAX_LONG_TASK_ENTRIES) {
    longTaskData.shift();
  }
  
  // Log long task data in development
  if (import.meta.env.DEV) {
    logLongTaskData(data);
  }
}

/**
 * Log performance data with color-coded output based on thresholds
 * 
 * @param data - Performance data to log
 */
function logPerformanceData(data: PerformanceData): void {
  let thresholds = PERFORMANCE_THRESHOLDS.COMPONENT_LOAD;
  
  // Determine appropriate thresholds based on entry name
  if (data.name.includes('wasm')) {
    thresholds = PERFORMANCE_THRESHOLDS.WASM_LOAD;
  } else if (data.name.includes('route')) {
    thresholds = PERFORMANCE_THRESHOLDS.ROUTE_TRANSITION;
  } else if (data.name.includes('file') || data.name.includes('process')) {
    thresholds = PERFORMANCE_THRESHOLDS.FILE_PROCESSING;
  } else if (data.name.includes('initial') || data.name.includes('load')) {
    thresholds = PERFORMANCE_THRESHOLDS.INITIAL_LOAD;
  } else if (criticalWorkflowSteps.has(data.name)) {
    thresholds = PERFORMANCE_THRESHOLDS.CRITICAL_WORKFLOW;
  }
  
  // Determine color based on duration
  let color = 'color: green';
  let label = 'GOOD';
  
  if (data.duration > thresholds.ACCEPTABLE) {
    color = 'color: red; font-weight: bold';
    label = 'SLOW';
  } else if (data.duration > thresholds.GOOD) {
    color = 'color: orange';
    label = 'ACCEPTABLE';
  }
  
  // Log with color
  console.log(
    `[PerfMonitor] %c${label}%c ${data.name}: ${data.duration.toFixed(2)}ms`,
    color,
    'color: inherit'
  );
}

/**
 * Log long task data with color-coded output based on thresholds
 * 
 * @param data - Long task data to log
 */
function logLongTaskData(data: LongTaskData): void {
  // Determine color based on duration
  let color = 'color: orange';
  let label = 'WARNING';
  
  if (data.duration > PERFORMANCE_THRESHOLDS.LONG_TASK.CRITICAL) {
    color = 'color: red; font-weight: bold';
    label = 'CRITICAL';
  }
  
  // Log with color
  console.log(
    `[PerfMonitor] %c${label}%c Long task detected: ${data.duration.toFixed(2)}ms`,
    color,
    'color: inherit'
  );
  
  // Log attribution if available
  if (data.attribution && data.attribution.length > 0) {
    console.log('[PerfMonitor] Attribution:', data.attribution);
  }
}

/**
 * Report a critical workflow step
 * 
 * @param name - Name of the workflow step
 * @param duration - Duration of the step in milliseconds
 */
function reportCriticalWorkflowStep(name: string, duration: number): void {
  // Determine if the step is slow
  const thresholds = PERFORMANCE_THRESHOLDS.CRITICAL_WORKFLOW;
  let status = 'good';
  
  if (duration > thresholds.ACCEPTABLE) {
    status = 'slow';
  } else if (duration > thresholds.GOOD) {
    status = 'acceptable';
  }
  
  // Log the step in development
  if (import.meta.env.DEV) {
    console.log(`[PerfMonitor] Critical workflow step "${name}": ${duration.toFixed(2)}ms (${status})`);
  }
  
  // In production, you might want to send this data to an analytics service
  if (import.meta.env.PROD) {
    // Example: Send to analytics service
    // analyticsService.trackPerformance({
    //   name,
    //   duration,
    //   status,
    //   timestamp: Date.now(),
    // });
  }
}

/**
 * Get all stored performance data
 * 
 * @returns Array of performance data entries
 */
function getAllPerformanceData(): PerformanceData[] {
  return [...performanceData];
}

/**
 * Get all stored long task data
 * 
 * @returns Array of long task data entries
 */
function getAllLongTaskData(): LongTaskData[] {
  return [...longTaskData];
}

/**
 * Clear all stored performance data
 */
function clearPerformanceData(): void {
  performanceData.length = 0;
  longTaskData.length = 0;
}

/**
 * Track the time it takes to execute a function
 * 
 * @param name - Name of the operation
 * @param fn - Function to execute
 * @returns Result of the function
 */
async function trackTime<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
  const startMarkName = `${name}-start`;
  const endMarkName = `${name}-end`;
  
  mark(startMarkName);
  
  try {
    const result = await fn();
    mark(endMarkName);
    measure(name, startMarkName, endMarkName);
    return result;
  } catch (error) {
    mark(endMarkName);
    measure(name, startMarkName, endMarkName);
    throw error;
  }
}

/**
 * Track the time it takes to execute a function synchronously
 * 
 * @param name - Name of the operation
 * @param fn - Function to execute
 * @returns Result of the function
 */
function trackTimeSync<T>(name: string, fn: () => T): T {
  const startMarkName = `${name}-start`;
  const endMarkName = `${name}-end`;
  
  mark(startMarkName);
  
  try {
    const result = fn();
    mark(endMarkName);
    measure(name, startMarkName, endMarkName);
    return result;
  } catch (error) {
    mark(endMarkName);
    measure(name, startMarkName, endMarkName);
    throw error;
  }
}

/**
 * Track initial page load performance
 */
function trackInitialPageLoad(): void {
  if (typeof window !== 'undefined' && typeof performance !== 'undefined') {
    // Wait for the page to be fully loaded
    window.addEventListener('load', () => {
      // Get navigation timing data
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationTiming) {
        // Calculate key metrics
        const dnsTime = navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart;
        const tcpTime = navigationTiming.connectEnd - navigationTiming.connectStart;
        const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
        const domContentLoaded = navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart;
        const domComplete = navigationTiming.domComplete - navigationTiming.domContentLoadedEventStart;
        const loadTime = navigationTiming.loadEventEnd - navigationTiming.loadEventStart;
        const totalTime = navigationTiming.loadEventEnd - navigationTiming.startTime;
        
        // Store metrics
        storePerformanceData({
          name: 'initial-dns-lookup',
          startTime: navigationTiming.domainLookupStart,
          duration: dnsTime,
          entryType: 'navigation',
          timestamp: Date.now(),
        });
        
        storePerformanceData({
          name: 'initial-tcp-connection',
          startTime: navigationTiming.connectStart,
          duration: tcpTime,
          entryType: 'navigation',
          timestamp: Date.now(),
        });
        
        storePerformanceData({
          name: 'initial-ttfb',
          startTime: navigationTiming.requestStart,
          duration: ttfb,
          entryType: 'navigation',
          timestamp: Date.now(),
        });
        
        storePerformanceData({
          name: 'initial-dom-content-loaded',
          startTime: navigationTiming.domContentLoadedEventStart,
          duration: domContentLoaded,
          entryType: 'navigation',
          timestamp: Date.now(),
        });
        
        storePerformanceData({
          name: 'initial-dom-complete',
          startTime: navigationTiming.domContentLoadedEventStart,
          duration: domComplete,
          entryType: 'navigation',
          timestamp: Date.now(),
        });
        
        storePerformanceData({
          name: 'initial-load-event',
          startTime: navigationTiming.loadEventStart,
          duration: loadTime,
          entryType: 'navigation',
          timestamp: Date.now(),
        });
        
        storePerformanceData({
          name: 'initial-total-load-time',
          startTime: navigationTiming.startTime,
          duration: totalTime,
          entryType: 'navigation',
          timestamp: Date.now(),
        });
      }
      
      // Track resource loading performance
      const resourceEntries = performance.getEntriesByType('resource');
      
      // Group resources by type
      const resourcesByType: Record<string, PerformanceResourceTiming[]> = {};
      
      resourceEntries.forEach(entry => {
        const resourceEntry = entry as PerformanceResourceTiming;
        const url = resourceEntry.name;
        let type = 'other';
        
        if (url.endsWith('.js')) type = 'script';
        else if (url.endsWith('.css')) type = 'stylesheet';
        else if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) type = 'image';
        else if (url.endsWith('.wasm')) type = 'wasm';
        else if (url.match(/\.(woff|woff2|ttf|otf|eot)$/i)) type = 'font';
        
        if (!resourcesByType[type]) {
          resourcesByType[type] = [];
        }
        
        resourcesByType[type].push(resourceEntry);
      });
      
      // Calculate and store aggregate metrics for each resource type
      Object.entries(resourcesByType).forEach(([type, resources]) => {
        const totalSize = resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);
        const totalDuration = resources.reduce((sum, resource) => sum + resource.duration, 0);
        const avgDuration = totalDuration / resources.length;
        
        storePerformanceData({
          name: `initial-resources-${type}`,
          startTime: 0,
          duration: avgDuration,
          entryType: 'resource',
          timestamp: Date.now(),
        });
        
        if (import.meta.env.DEV) {
          console.log(
            `[PerfMonitor] Resource loading (${type}): ${resources.length} files, ${(totalSize / 1024).toFixed(2)} KB, avg ${avgDuration.toFixed(2)}ms per file`
          );
        }
      });
    });
  }
}

/**
 * Track time to interactive
 * 
 * @param callback - Optional callback to execute when TTI is measured
 */
function trackTimeToInteractive(callback?: (tti: number) => void): void {
  if (typeof window !== 'undefined' && typeof performance !== 'undefined') {
    let ttiMeasured = false;
    
    // Function to measure TTI
    const measureTTI = () => {
      if (ttiMeasured) return;
      
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationTiming && navigationTiming.domInteractive > 0) {
        const tti = navigationTiming.domInteractive - navigationTiming.startTime;
        
        storePerformanceData({
          name: 'time-to-interactive',
          startTime: navigationTiming.startTime,
          duration: tti,
          entryType: 'navigation',
          timestamp: Date.now(),
        });
        
        ttiMeasured = true;
        
        if (callback) {
          callback(tti);
        }
      }
    };
    
    // Try to measure TTI after DOM content loaded
    window.addEventListener('DOMContentLoaded', () => {
      // Wait a short time to ensure interactivity
      setTimeout(measureTTI, 100);
    });
    
    // Fallback: measure TTI after load event
    window.addEventListener('load', () => {
      setTimeout(measureTTI, 500);
    });
  }
}

/**
 * Initialize long task observer to track tasks that block the main thread
 */
function initLongTaskObserver(): void {
  if (typeof window !== 'undefined' && typeof PerformanceObserver !== 'undefined') {
    try {
      // Create a new PerformanceObserver to track long tasks
      longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const longTaskEntry = entry as PerformanceLongTaskTiming;
          
          // Create attribution data
          const attribution = longTaskEntry.attribution.map((attr) => ({
            name: attr.name,
            containerType: attr.containerType,
            containerName: attr.containerName,
            containerId: attr.containerId,
            containerSrc: attr.containerSrc,
          }));
          
          // Store long task data
          storeLongTaskData({
            startTime: longTaskEntry.startTime,
            duration: longTaskEntry.duration,
            attribution,
            timestamp: Date.now(),
          });
        });
      });
      
      // Start observing long tasks
      longTaskObserver.observe({ type: 'longtask', buffered: true });
      
      if (import.meta.env.DEV) {
        console.log('[PerfMonitor] Long task observer initialized');
      }
    } catch (error) {
      console.warn('[PerfMonitor] Failed to initialize long task observer:', error);
    }
  }
}

/**
 * Disconnect long task observer
 */
function disconnectLongTaskObserver(): void {
  if (longTaskObserver) {
    longTaskObserver.disconnect();
    longTaskObserver = null;
    
    if (import.meta.env.DEV) {
      console.log('[PerfMonitor] Long task observer disconnected');
    }
  }
}

/**
 * Register a critical workflow step for tracking
 * 
 * @param stepName - Name of the workflow step
 */
function registerCriticalWorkflowStep(stepName: string): void {
  criticalWorkflowSteps.add(stepName);
  
  if (import.meta.env.DEV) {
    console.log(`[PerfMonitor] Registered critical workflow step: ${stepName}`);
  }
}

/**
 * Unregister a critical workflow step
 * 
 * @param stepName - Name of the workflow step
 */
function unregisterCriticalWorkflowStep(stepName: string): void {
  criticalWorkflowSteps.delete(stepName);
  
  if (import.meta.env.DEV) {
    console.log(`[PerfMonitor] Unregistered critical workflow step: ${stepName}`);
  }
}

/**
 * Track a critical workflow step
 * 
 * @param stepName - Name of the workflow step
 * @param fn - Function to execute
 * @returns Result of the function
 */
async function trackCriticalWorkflowStep<T>(stepName: string, fn: () => Promise<T> | T): Promise<T> {
  // Register the step as critical
  registerCriticalWorkflowStep(stepName);
  
  // Track the time
  return trackTime(stepName, fn);
}

/**
 * Generate a performance report
 * 
 * @returns Performance report object
 */
function generatePerformanceReport(): PerformanceReport {
  const report: PerformanceReport = {
    metrics: getAllPerformanceData(),
    longTasks: getAllLongTaskData(),
    timestamp: Date.now(),
  };
  
  // Add navigation timing data if available
  if (typeof performance !== 'undefined') {
    const navigationEntries = performance.getEntriesByType('navigation');
    
    if (navigationEntries.length > 0) {
      const navigationTiming = navigationEntries[0] as PerformanceNavigationTiming;
      
      report.navigationTiming = {
        domComplete: navigationTiming.domComplete,
        domContentLoadedEventEnd: navigationTiming.domContentLoadedEventEnd,
        domContentLoadedEventStart: navigationTiming.domContentLoadedEventStart,
        domInteractive: navigationTiming.domInteractive,
        loadEventEnd: navigationTiming.loadEventEnd,
        loadEventStart: navigationTiming.loadEventStart,
        redirectCount: navigationTiming.redirectCount,
        requestStart: navigationTiming.requestStart,
        responseEnd: navigationTiming.responseEnd,
        responseStart: navigationTiming.responseStart,
        startTime: navigationTiming.startTime,
        unloadEventEnd: navigationTiming.unloadEventEnd,
        unloadEventStart: navigationTiming.unloadEventStart,
      };
    }
    
    // Add memory info if available
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      
      report.memoryInfo = {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
      };
    }
  }
  
  return report;
}

/**
 * Send performance report to a server or analytics service
 * 
 * @param endpoint - URL of the endpoint to send the report to
 * @returns Promise that resolves when the report is sent
 */
async function sendPerformanceReport(endpoint: string): Promise<void> {
  try {
    const report = generatePerformanceReport();
    
    // Send the report to the server
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });
    
    if (import.meta.env.DEV) {
      console.log('[PerfMonitor] Performance report sent successfully');
    }
  } catch (error) {
    console.error('[PerfMonitor] Failed to send performance report:', error);
  }
}

// Export the performance monitoring API
export const perfMonitor = {
  mark,
  measure,
  trackTime,
  trackTimeSync,
  getAllPerformanceData,
  getAllLongTaskData,
  clearPerformanceData,
  trackInitialPageLoad,
  trackTimeToInteractive,
  initLongTaskObserver,
  disconnectLongTaskObserver,
  registerCriticalWorkflowStep,
  unregisterCriticalWorkflowStep,
  trackCriticalWorkflowStep,
  generatePerformanceReport,
  sendPerformanceReport,
  PERFORMANCE_THRESHOLDS,
};

// Initialize performance tracking
if (typeof window !== 'undefined') {
  perfMonitor.trackInitialPageLoad();
  perfMonitor.trackTimeToInteractive();
  perfMonitor.initLongTaskObserver();
  
  // Register critical workflow steps
  perfMonitor.registerCriticalWorkflowStep('app-initialization');
  perfMonitor.registerCriticalWorkflowStep('wasm-load-ffmpeg-core.wasm');
  perfMonitor.registerCriticalWorkflowStep('wasm-load-opencv.wasm');
}

export default perfMonitor;
