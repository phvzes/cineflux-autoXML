/**
 * BaseService
 * 
 * Abstract base class that provides common functionality for all services
 * in the CineFlux-AutoXML system. Handles initialization, event management,
 * error handling, and resource lifecycle.
 * 
 * @abstract
 * @class
 */

import { EventEmitter } from 'events';

/**
 * Configuration options for service initialization
 */
export interface ServiceOptions {
  /** Enable debug mode for additional logging */
  debug?: boolean;
  /** Service-specific configuration parameters */
  [key: string]: any;
}

/**
 * Service initialization status
 */
export enum ServiceStatus {
  /** Service has not been initialized */
  UNINITIALIZED = 'uninitialized',
  /** Service is currently initializing */
  INITIALIZING = 'initializing',
  /** Service has been successfully initialized */
  INITIALIZED = 'initialized',
  /** Service initialization failed */
  FAILED = 'failed',
  /** Service has been destroyed */
  DESTROYED = 'destroyed'
}

/**
 * Base service error class
 */
export class ServiceError extends Error {
  /** Error code for categorization */
  code: string;
  
  /**
   * Creates a new ServiceError
   * 
   * @param message - Error message
   * @param code - Error code
   */
  constructor(message: string, code: string = 'SERVICE_ERROR') {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}

/**
 * Abstract base class for all services in the system
 * 
 * Provides common functionality including:
 * - Initialization and configuration
 * - Event handling and propagation
 * - Error management
 * - Resource allocation and cleanup
 * - Worker thread communication
 */
export abstract class BaseService extends EventEmitter {
  /** Current status of the service */
  protected status: ServiceStatus = ServiceStatus.UNINITIALIZED;
  
  /** Service configuration options */
  protected options: ServiceOptions = {};
  
  /** Service identifier */
  protected id: string;
  
  /** Debug mode flag */
  protected debug: boolean = false;
  
  /**
   * Creates a new service instance
   * 
   * @param id - Unique identifier for this service instance
   */
  constructor(id: string = '') {
    super();
    this.id = id || `service-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  
  /**
   * Initializes the service with the provided options
   * 
   * @param options - Service configuration options
   * @returns Promise that resolves when initialization is complete
   * @throws {ServiceError} If initialization fails
   */
  public async initialize(options: ServiceOptions = {}): Promise<boolean> {
    if (this.status === ServiceStatus.INITIALIZING) {
      throw new ServiceError('Service is already initializing', 'ALREADY_INITIALIZING');
    }
    
    if (this.status === ServiceStatus.INITIALIZED) {
      throw new ServiceError('Service is already initialized', 'ALREADY_INITIALIZED');
    }
    
    this.status = ServiceStatus.INITIALIZING;
    this.options = { ...this.options, ...options };
    this.debug = !!this.options.debug;
    
    try {
      // Call the implementation-specific initialization
      const result = await this.initializeImpl(this.options);
      
      this.status = ServiceStatus.INITIALIZED;
      this.emit('initialized', { id: this.id });
      
      return result;
    } catch (error) {
      this.status = ServiceStatus.FAILED;
      
      const serviceError = error instanceof ServiceError 
        ? error 
        : new ServiceError(`Initialization failed: ${error.message}`, 'INIT_FAILED');
      
      this.emit('error', serviceError);
      throw serviceError;
    }
  }
  
  /**
   * Implementation-specific initialization logic
   * 
   * @param options - Service configuration options
   * @returns Promise that resolves when initialization is complete
   * @protected
   * @abstract
   */
  protected abstract initializeImpl(options: ServiceOptions): Promise<boolean>;
  
  /**
   * Checks if the service is initialized
   * 
   * @returns True if the service is initialized
   */
  public isInitialized(): boolean {
    return this.status === ServiceStatus.INITIALIZED;
  }
  
  /**
   * Gets the current status of the service
   * 
   * @returns Current service status
   */
  public getStatus(): ServiceStatus {
    return this.status;
  }
  
  /**
   * Gets the service identifier
   * 
   * @returns Service identifier
   */
  public getId(): string {
    return this.id;
  }
  
  /**
   * Destroys the service and releases all resources
   * 
   * @returns Promise that resolves when destruction is complete
   */
  public async destroy(): Promise<void> {
    if (this.status === ServiceStatus.DESTROYED) {
      return;
    }
    
    try {
      // Call the implementation-specific destruction
      await this.destroyImpl();
      
      this.status = ServiceStatus.DESTROYED;
      this.emit('destroyed', { id: this.id });
      
      // Remove all listeners
      this.removeAllListeners();
    } catch (error) {
      const serviceError = error instanceof ServiceError 
        ? error 
        : new ServiceError(`Destruction failed: ${error.message}`, 'DESTROY_FAILED');
      
      this.emit('error', serviceError);
      throw serviceError;
    }
  }
  
  /**
   * Implementation-specific destruction logic
   * 
   * @returns Promise that resolves when destruction is complete
   * @protected
   */
  protected async destroyImpl(): Promise<void> {
    // Default implementation does nothing
    return Promise.resolve();
  }
  
  /**
   * Logs a message if debug mode is enabled
   * 
   * @param message - Message to log
   * @param data - Additional data to log
   * @protected
   */
  protected log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[${this.id}] ${message}`, data !== undefined ? data : '');
    }
  }
  
  /**
   * Logs an error message
   * 
   * @param message - Error message
   * @param error - Error object or additional error data
   * @protected
   */
  protected logError(message: string, error?: any): void {
    console.error(`[${this.id}] ERROR: ${message}`, error !== undefined ? error : '');
  }
  
  /**
   * Creates a ServiceError with the given message and code
   * 
   * @param message - Error message
   * @param code - Error code
   * @returns ServiceError instance
   * @protected
   */
  protected createError(message: string, code: string = 'SERVICE_ERROR'): ServiceError {
    return new ServiceError(message, code);
  }
}
