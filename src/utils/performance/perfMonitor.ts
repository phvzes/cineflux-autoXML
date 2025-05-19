
/**
 * Performance monitoring utilities for critical application paths
 */

export class PerfMonitor {
  private static instance: PerfMonitor;
  private measurements: Map<string, PerformanceMeasurement[]>;
  private criticalPaths: Set<string>;
  private isEnabled: boolean;
  
  constructor() {
    this.measurements = new Map();
    this.criticalPaths = new Set();
    this.isEnabled = process.env.NODE_ENV !== 'production' || 
                     import.meta.env.VITE_ENABLE_PERF_MONITORING === 'true';
  }
  
  /**
   * Get the singleton instance of PerfMonitor
   */
  public static getInstance(): PerfMonitor {
    if (!PerfMonitor.instance) {
      PerfMonitor.instance = new PerfMonitor();
    }
    return PerfMonitor.instance;
  }
  
  /**
   * Register a critical workflow step for performance monitoring
   * @param stepId Unique identifier for the workflow step
   * @param description Human-readable description of the step
   */
  public registerCriticalWorkflowStep(stepId: string, description: string): void {
    if (!this.isEnabled) return;
    
    this.criticalPaths.add(stepId);
    console.info(`[PerfMonitor] Registered critical workflow step: ${stepId} - ${description}`);
  }
  
  /**
   * Start measuring performance for a specific operation
   * @param operationId Unique identifier for the operation
   * @returns Measurement ID for stopping the measurement
   */
  public startMeasure(operationId: string): string {
    if (!this.isEnabled) return '';
    
    const measurementId = `${operationId}_${Date.now()}`;
    const startTime = performance.now();
    
    if (!this.measurements.has(operationId)) {
      this.measurements.set(operationId, []);
    }
    
    const measurements = this.measurements.get(operationId)!;
    measurements.push({
      id: measurementId,
      operationId,
      startTime,
      endTime: null,
      duration: null,
      isCriticalPath: this.criticalPaths.has(operationId)
    });
    
    return measurementId;
  }
  
  /**
   * Stop measuring performance for a specific operation
   * @param measurementId Measurement ID returned from startMeasure
   * @returns Duration of the operation in milliseconds
   */
  public stopMeasure(measurementId: string): number | null {
    if (!this.isEnabled || !measurementId) return null;
    
    const endTime = performance.now();
    
    for (const [operationId, measurements] of this.measurements.entries()) {
      const measurementIndex = measurements.findIndex(m => m.id === measurementId);
      
      if (measurementIndex >= 0) {
        const measurement = measurements[measurementIndex];
        measurement.endTime = endTime;
        measurement.duration = endTime - measurement.startTime;
        
        if (measurement.isCriticalPath) {
          console.info(`[PerfMonitor] Critical path "${operationId}" completed in ${measurement.duration.toFixed(2)}ms`);
        }
        
        return measurement.duration;
      }
    }
    
    console.warn(`[PerfMonitor] No measurement found with ID: ${measurementId}`);
    return null;
  }
  
  /**
   * Get performance report for all operations
   * @returns Performance report object
   */
  public getReport(): PerfReport {
    const report: PerfReport = {
      operations: {},
      criticalPaths: Array.from(this.criticalPaths),
      timestamp: new Date().toISOString()
    };
    
    for (const [operationId, measurements] of this.measurements.entries()) {
      const completedMeasurements = measurements.filter(m => m.duration !== null);
      
      if (completedMeasurements.length === 0) continue;
      
      const durations = completedMeasurements.map(m => m.duration!);
      const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
      const averageDuration = totalDuration / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      report.operations[operationId] = {
        count: completedMeasurements.length,
        totalDuration,
        averageDuration,
        minDuration,
        maxDuration,
        isCriticalPath: this.criticalPaths.has(operationId)
      };
    }
    
    return report;
  }
  
  /**
   * Clear all performance measurements
   */
  public clear(): void {
    this.measurements.clear();
  }
}

/**
 * Interface for a performance measurement
 */
interface PerformanceMeasurement {
  id: string;
  operationId: string;
  startTime: number;
  endTime: number | null;
  duration: number | null;
  isCriticalPath: boolean;
}

/**
 * Interface for operation statistics in a performance report
 */
interface OperationStats {
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  isCriticalPath: boolean;
}

/**
 * Interface for a performance report
 */
interface PerfReport {
  operations: Record<string, OperationStats>;
  criticalPaths: string[];
  timestamp: string;
}

export default PerfMonitor.getInstance();
