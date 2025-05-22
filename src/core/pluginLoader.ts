/**
 * CineFlux-AutoXML Plugin Loader
 * Utility functions for loading and registering plugins
 */

import { pluginRegistry } from './PluginRegistry';
import { BasePlugin } from '../plugins/pluginInterfaces';
import { PluginType, PluginInitOptions, PluginEventType } from '../types/plugins';
import { availablePlugins } from '../plugins';

/**
 * Initialize the plugin system and register built-in plugins
 */
export async function initializePluginSystem(): Promise<boolean> {
  try {
    console.log('Initializing plugin system...');
    
    // Register event listeners
    pluginRegistry.addEventListener(PluginEventType.Registered, (event: any) => {
      console.log(`Plugin registered: ${event.pluginId}`);
    });
    
    pluginRegistry.addEventListener(PluginEventType.Error, (event: any) => {
      console.error(`Plugin error: ${event.pluginId}`, event.data);
    });
    
    // Register built-in plugins
    for (const plugin of availablePlugins) {
      await plugin.initialize();
      await pluginRegistry.registerPlugin(plugin);
    }
    
    console.log('Plugin system initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize plugin system:', error);
    return false;
  }
}

/**
 * Load a plugin from a JavaScript/TypeScript module
 * @param modulePath Path to the module
 * @param options Initialization options
 */
export async function loadPluginFromModule(
  modulePath: string, 
  options?: PluginInitOptions
): Promise<BasePlugin | undefined> {
  try {
    console.log(`Loading plugin from module: ${modulePath}`);
    return await pluginRegistry.loadPlugin(modulePath, options);
  } catch (error) {
    console.error(`Failed to load plugin from ${modulePath}:`, error);
    return undefined;
  }
}

/**
 * Load a WASM-based plugin
 * @param wasmUrl URL or path to the WASM binary
 * @param options Initialization options
 */
export async function loadWasmPlugin(
  wasmUrl: string, 
  options?: PluginInitOptions
): Promise<BasePlugin | undefined> {
  try {
    console.log(`Loading WASM plugin from: ${wasmUrl}`);
    return await pluginRegistry.loadWasmPlugin(wasmUrl, options);
  } catch (error) {
    console.error(`Failed to load WASM plugin from ${wasmUrl}:`, error);
    return undefined;
  }
}

/**
 * Get all plugins of a specific type
 * @param type Plugin type
 */
export function getPluginsByType(type: PluginType): BasePlugin[] {
  return pluginRegistry.getPluginsByType(type);
}

/**
 * Get a plugin by its ID
 * @param pluginId Plugin ID
 */
export function getPluginById(pluginId: string): BasePlugin | undefined {
  return pluginRegistry.getPlugin(pluginId);
}

/**
 * Unload and dispose a plugin
 * @param pluginId Plugin ID
 */
export async function unloadPlugin(pluginId: string): Promise<boolean> {
  return await pluginRegistry.unregisterPlugin(pluginId);
}

/**
 * Get information about all registered plugins
 */
export function getPluginInfo(): any[] {
  return pluginRegistry.getAllPluginMetadata().map((metadata: any) => ({
    id: metadata.id,
    name: metadata.name,
    version: metadata.version,
    author: metadata.author,
    type: metadata.type,
    isWasm: metadata.isWasm,
    supportedFormats: metadata.supportedFormats || []
  }));
}
