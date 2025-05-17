/**
 * CineFlux-AutoXML Plugins Index
 * Exports all plugin interfaces and implementations
 */

// Export plugin interfaces
export * from './pluginInterfaces';

// Export audio plugins
import BasicAudioAnalyzer from './audio/BasicAudioAnalyzer';
export { BasicAudioAnalyzer };

// Export video plugins
import BasicVideoAnalyzer from './video/BasicVideoAnalyzer';
export { BasicVideoAnalyzer };

// Export subtitle plugins
import BasicSubtitleAnalyzer from './subtitle/BasicSubtitleAnalyzer';
export { BasicSubtitleAnalyzer };

// Export a list of all available plugins
export const availablePlugins = [
  BasicAudioAnalyzer,
  BasicVideoAnalyzer,
  BasicSubtitleAnalyzer
];
