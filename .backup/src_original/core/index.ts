/**
 * CineFlux-AutoXML Core Index
 * Exports all core functionality
 */

// Export PluginRegistry
export { PluginRegistry, pluginRegistry } from './PluginRegistry';

// Export plugin loader utilities
export {
  initializePluginSystem,
  loadPluginFromModule,
  loadWasmPlugin,
  getPluginsByType,
  getPluginById,
  unloadPlugin,
  getPluginInfo
} from './pluginLoader';
