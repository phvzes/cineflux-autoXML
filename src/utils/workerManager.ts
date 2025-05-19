/**
 * Worker Manager
 * Manages the creation and communication with Web Workers
 */

import { v4 as uuidv4 } from 'uuid';

// Worker types
export enum WorkerType {
  AUDIO = 'audio',
  VIDEO = 'video'
}

// Worker status
export enum WorkerStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error'
}

// Worker instance
interface WorkerInstance {
  worker: Worker;
  status: WorkerStatus;
  type: WorkerType;
  pendingTasks: Map<string, {
    resolve: (result: any) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: any) => void;
  }>;
}

/**
 * Worker Manager class
 * Singleton pattern for managing workers
 */
class WorkerManager {
  private static instance: WorkerManager;
  private workers: Map<WorkerType, WorkerInstance[]> = new Map();
  private maxWorkersPerType: number;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Determine max workers based on available cores
    // Use half of available cores, minimum 1, maximum 4
    const cores = navigator.hardwareConcurrency || 2;
    this.maxWorkersPerType = Math.max(1, Math.min(4, Math.floor(cores / 2)));
    
    console.info(`[WorkerManager] Initialized with ${this.maxWorkersPerType} workers per type`);
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }
  
  /**
   * Execute a task in a worker
   * @param type Worker type
   * @param messageType Message type to send to the worker
   * @param data Data to send to the worker
   * @param onProgress Progress callback
   * @returns Promise that resolves with the result
   */
  public async executeTask<T>(
    type: WorkerType,
    messageType: string,
    data: any,
    onProgress?: (progress: any) => void
  ): Promise<T> {
    // Get or create a worker
    const worker = await this.getAvailableWorker(type);
    
    // Generate a unique ID for this task
    const taskId = uuidv4();
    
    // Create a promise that will be resolved when the worker completes the task
    const taskPromise = new Promise<T>((resolve, reject) => {
      worker.pendingTasks.set(taskId, { resolve, reject, onProgress });
    });
    
    // Send the message to the worker
    worker.worker.postMessage({
      type: messageType,
      id: taskId,
      data
    });
    
    // Update worker status
    worker.status = WorkerStatus.BUSY;
    
    return taskPromise;
  }
  
  /**
   * Get an available worker of the specified type
   * @param type Worker type
   * @returns Worker instance
   */
  private async getAvailableWorker(type: WorkerType): Promise<WorkerInstance> {
    // Initialize workers for this type if not already done
    if (!this.workers.has(type)) {
      this.workers.set(type, []);
    }
    
    const workers = this.workers.get(type)!;
    
    // Find an idle worker
    const idleWorker = workers.find(worker => worker.status === WorkerStatus.IDLE);
    if (idleWorker) {
      return idleWorker;
    }
    
    // Create a new worker if we haven't reached the limit
    if (workers.length < this.maxWorkersPerType) {
      const newWorker = await this.createWorker(type);
      workers.push(newWorker);
      return newWorker;
    }
    
    // If all workers are busy, return the one with the fewest pending tasks
    return workers.reduce((prev, curr) => 
      prev.pendingTasks.size <= curr.pendingTasks.size ? prev : curr
    );
  }
  
  /**
   * Create a new worker of the specified type
   * @param type Worker type
   * @returns Worker instance
   */
  private async createWorker(type: WorkerType): Promise<WorkerInstance> {
    // Create the worker
    let worker: Worker;
    
    switch (type) {
      case WorkerType.AUDIO:
        worker = new Worker(new URL('../workers/audioWorker.ts', import.meta.url), { type: 'module' });
        break;
        
      case WorkerType.VIDEO:
        worker = new Worker(new URL('../workers/videoWorker.ts', import.meta.url), { type: 'module' });
        break;
        
      default:
        throw new Error(`Unknown worker type: ${type}`);
    }
    
    // Create the worker instance
    const workerInstance: WorkerInstance = {
      worker,
      status: WorkerStatus.IDLE,
      type,
      pendingTasks: new Map()
    };
    
    // Set up message handler
    worker.addEventListener('message', (event) => {
      this.handleWorkerMessage(workerInstance, event);
    });
    
    // Set up error handler
    worker.addEventListener('error', (event) => {
      console.error(`[WorkerManager] Worker error:`, event);
      workerInstance.status = WorkerStatus.ERROR;
      
      // Reject all pending tasks
      for (const [taskId, { reject }] of workerInstance.pendingTasks) {
        reject(new Error(`Worker error: ${event.message}`));
        workerInstance.pendingTasks.delete(taskId);
      }
      
      // Terminate the worker
      worker.terminate();
      
      // Remove the worker from the pool
      const workers = this.workers.get(type)!;
      const index = workers.indexOf(workerInstance);
      if (index >= 0) {
        workers.splice(index, 1);
      }
    });
    
    return workerInstance;
  }
  
  /**
   * Handle a message from a worker
   * @param workerInstance Worker instance
   * @param event Message event
   */
  private handleWorkerMessage(workerInstance: WorkerInstance, event: MessageEvent): void {
    const { type, id, result, error, progress } = event.data;
    
    // Get the task
    const task = workerInstance.pendingTasks.get(id);
    if (!task) {
      console.warn(`[WorkerManager] Received message for unknown task: ${id}`);
      return;
    }
    
    // Handle different message types
    switch (type) {
      case 'RESULT':
        // Task completed successfully
        task.resolve(result);
        workerInstance.pendingTasks.delete(id);
        
        // Update worker status if no more pending tasks
        if (workerInstance.pendingTasks.size === 0) {
          workerInstance.status = WorkerStatus.IDLE;
        }
        break;
        
      case 'ERROR':
        // Task failed
        task.reject(new Error(error));
        workerInstance.pendingTasks.delete(id);
        
        // Update worker status if no more pending tasks
        if (workerInstance.pendingTasks.size === 0) {
          workerInstance.status = WorkerStatus.IDLE;
        }
        break;
        
      case 'PROGRESS':
      case 'CHUNK_PROGRESS':
        // Progress update
        if (task.onProgress) {
          task.onProgress(progress);
        }
        break;
        
      default:
        console.warn(`[WorkerManager] Unknown message type: ${type}`);
    }
  }
  
  /**
   * Terminate all workers
   */
  public terminateAll(): void {
    for (const [type, workers] of this.workers.entries()) {
      for (const worker of workers) {
        worker.worker.terminate();
      }
      workers.length = 0;
    }
  }
}

// Export the singleton instance
export default WorkerManager.getInstance();
