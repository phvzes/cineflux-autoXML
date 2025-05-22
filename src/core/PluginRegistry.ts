/**
 * CineFlux-AutoXML Plugin Registry
 * Manages plugin registration, loading, and lifecycle
 */

import { BasePlugin } from '../plugins/pluginInterfaces';
import { 
  PluginMetadata, 
  PluginType, 
  PluginEvent, 
  PluginEventType,
  PluginInitOptions
} from '../types/plugins';

/**
 * Event listener type for plugin events
 */
type PluginEventListener = (event: PluginEvent) => void;

/**
 * Plugin Registry class
 * Singleton responsible for managing plugins
 */
export class PluginRegistry {
  private static instance: PluginRegistry;
  
  // Maps to store plugins
  private plugins: Map<string, BasePlugin> = new Map();
  private pluginsByType: Map<PluginType, Set<string>> = new Map();
  
  // Event listeners
  private eventListeners: Map<PluginEventType, Set<PluginEventListener>> = new Map();
  
  // WASM module cache
  private wasmModules: Map<string, WebAssembly.Module> = new Map();
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize plugin type maps
    Object.values(PluginType).forEach((type: any) => {
      this.pluginsByType.set(type as PluginType, new Set<string>());
    });
    
    // Initialize event listener maps
    Object.values(PluginEventType).forEach((type: any) => {
      this.eventListeners.set(type as PluginEventType, new Set<PluginEventListener>());
    });
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }
  
  /**
   * Register a plugin with the registry
   * @param plugin Plugin instance to register
   * @returns True if registration was successful
   */
  public async registerPlugin(plugin: BasePlugin): Promise<boolean> {
    try {
      const metadata = plugin.metadata;
      
      // Validate plugin metadata
      if (!this.validatePluginMetadata(metadata)) {
        this.emitEvent({
          type: PluginEventType.Error,
          pluginId: metadata.id,
          data: new Error('Invalid plugin metadata'),
          timestamp: Date.now()
        });
        return false;
      }
      
      // Check if plugin with same ID already exists
      if (this.plugins.has(metadata.id)) {
        this.emitEvent({
          type: PluginEventType.Error,
          pluginId: metadata.id,
          data: new Error(`Plugin with ID ${metadata.id} already registered`),
          timestamp: Date.now()
        });
        return false;
      }
      
      // Store the plugin
      this.plugins.set(metadata.id, plugin);
      
      // Add to type map
      const typeSet = this.pluginsByType.get(metadata.type);
      if (typeSet) {
        typeSet.add(metadata.id);
      }
      
      // Emit registration event
      this.emitEvent({
        type: PluginEventType.Registered,
        pluginId: metadata.id,
        data: metadata,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error registering plugin:', error);
      return false;
    }
  }
  
  /**
   * Unregister a plugin from the registry
   * @param pluginId ID of the plugin to unregister
   * @returns True if unregistration was successful
   */
  public async unregisterPlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.plugins.get(pluginId);
      
      if (!plugin) {
        return false;
      }
      
      // Dispose the plugin
      await plugin.dispose();
      
      // Remove from maps
      this.plugins.delete(pluginId);
      
      // Remove from type map
      const typeSet = this.pluginsByType.get(plugin.metadata.type);
      if (typeSet) {
        typeSet.delete(pluginId);
      }
      
      // Emit unregistration event
      this.emitEvent({
        type: PluginEventType.Unregistered,
        pluginId,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error unregistering plugin:', error);
      return false;
    }
  }
  
  /**
   * Get a plugin by its ID
   * @param pluginId Plugin ID
   * @returns Plugin instance or undefined if not found
   */
  public getPlugin(pluginId: string): BasePlugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  /**
   * Get all plugins of a specific type
   * @param type Plugin type
   * @returns Array of plugins of the specified type
   */
  public getPluginsByType(type: PluginType): BasePlugin[] {
    const pluginIds = this.pluginsByType.get(type);
    if (!pluginIds) {
      return [];
    }
    
    return Array.from(pluginIds)
      .map((id: any) => this.plugins.get(id))
      .filter((plugin: any): plugin is BasePlugin => plugin !== undefined);
  }
  
  /**
   * Get all registered plugins
   * @returns Array of all plugin instances
   */
  public getAllPlugins(): BasePlugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Get all plugin metadata
   * @returns Array of plugin metadata
   */
  public getAllPluginMetadata(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map((plugin: any) => plugin.metadata);
  }
  
  /**
   * Load a plugin from a JavaScript module
   * @param modulePath Path to the module
   * @param options Initialization options
   * @returns Plugin instance if loading was successful
   */
  public async loadPlugin(modulePath: string, options?: PluginInitOptions): Promise<BasePlugin | undefined> {
    try {
      // Dynamic import of the module
      const module = await import(/* @vite-ignore */ modulePath);
      
      // Check if module exports a default plugin
      if (!module.default) {
        throw new Error(`Module at ${modulePath} does not export a default plugin`);
      }
      
      // Create plugin instance
      const plugin: BasePlugin = module.default;
      
      // Initialize the plugin
      const initialized = await plugin.initialize(options);
      
      if (!initialized) {
        throw new Error(`Failed to initialize plugin from ${modulePath}`);
      }
      
      // Register the plugin
      const registered = await this.registerPlugin(plugin);
      
      if (!registered) {
        throw new Error(`Failed to register plugin from ${modulePath}`);
      }
      
      // Emit loaded event
      this.emitEvent({
        type: PluginEventType.Loaded,
        pluginId: plugin.metadata.id,
        data: plugin.metadata,
        timestamp: Date.now()
      });
      
      return plugin;
    } catch (error) {
      console.error('Error loading plugin:', error);
      this.emitEvent({
        type: PluginEventType.Error,
        pluginId: 'unknown',
        data: error,
        timestamp: Date.now()
      });
      return undefined;
    }
  }
  
  /**
   * Load a WASM-based plugin
   * @param wasmUrl URL or path to the WASM binary
   * @param options Initialization options
   * @returns Plugin instance if loading was successful
   */
  public async loadWasmPlugin(wasmUrl: string, options?: PluginInitOptions): Promise<BasePlugin | undefined> {
    try {
      // Fetch the WASM binary
      const response = await fetch(wasmUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch WASM module: ${response.statusText}`);
      }
      
      const wasmBinary = await response.arrayBuffer();
      
      // Compile the WASM module
      const module = await WebAssembly.compile(wasmBinary);
      
      // Store the module for potential reuse
      const moduleId = wasmUrl.split('/').pop() || wasmUrl;
      this.wasmModules.set(moduleId, module);
      
      // Create the WASM instance
      const instance = await WebAssembly.instantiate(module, {
        env: {
          // Environment functions that the WASM module can call
          // These would be implemented based on the specific WASM plugin requirements
          memory: new WebAssembly.Memory({ initial: 10, maximum: 100 }),
          log: (ptr: number, len: number) => {
            // Example of a logging function that WASM could call
            console.log('WASM log:', ptr, len);
          }
        }
      });
      
      // Create a wrapper plugin that implements BasePlugin
      // This is a stub implementation - actual implementation would depend on the WASM module's exports
      const wasmPlugin: BasePlugin = {
        metadata: {
          id: moduleId,
          name: moduleId,
          version: '1.0.0',
          author: 'WASM Plugin',
          description: 'WASM-based plugin',
          isWasm: true,
          type: PluginType.Utility // Default type, would be determined from WASM exports
        },
        
        initialize: async (initOptions?: PluginInitOptions) => {
          // Initialize the WASM plugin
          if (instance.exports.initialize) {
            // @ts-ignore - WASM exports are not typed
            return instance.exports.initialize() === 1;
          }
          return true;
        },
        
        process: async (processOptions: any) => {
          // Process data with the WASM plugin
          // This would need to be implemented based on the specific WASM plugin
          return {
            success: true,
            data: {},
            timestamp: Date.now()
          };
        },
        
        getStatus: async () => {
          // Get status from the WASM plugin
          return { status: 'ready' };
        },
        
        dispose: async () => {
          // Clean up WASM resources
          if (instance.exports.dispose) {
            // @ts-ignore - WASM exports are not typed
            instance.exports.dispose();
          }
        }
      };
      
      // Register the WASM plugin
      const registered = await this.registerPlugin(wasmPlugin);
      
      if (!registered) {
        throw new Error(`Failed to register WASM plugin from ${wasmUrl}`);
      }
      
      return wasmPlugin;
    } catch (error) {
      console.error('Error loading WASM plugin:', error);
      this.emitEvent({
        type: PluginEventType.Error,
        pluginId: 'wasm-plugin',
        data: error,
        timestamp: Date.now()
      });
      return undefined;
    }
  }
  
  /**
   * Add an event listener
   * @param type Event type to listen for
   * @param listener Listener function
   */
  public addEventListener(type: PluginEventType, listener: PluginEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.add(listener);
    }
  }
  
  /**
   * Remove an event listener
   * @param type Event type
   * @param listener Listener function to remove
   */
  public removeEventListener(type: PluginEventType, listener: PluginEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }
  
  /**
   * Emit a plugin event
   * @param event Event to emit
   */
  private emitEvent(event: PluginEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener: any) => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in plugin event listener:', error);
        }
      });
    }
  }
  
  /**
   * Validate plugin metadata
   * @param metadata Plugin metadata to validate
   * @returns True if metadata is valid
   */
  private validatePluginMetadata(metadata: PluginMetadata): boolean {
    // Check required fields
    if (!metadata.id || !metadata.name || !metadata.version || !metadata.author || !metadata.type) {
      return false;
    }
    
    // Check if type is valid
    if (!Object.values(PluginType).includes(metadata.type)) {
      return false;
    }
    
    return true;
  }
}

// Export singleton instance
export const pluginRegistry = PluginRegistry.getInstance();
