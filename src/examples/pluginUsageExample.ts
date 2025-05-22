import { initializePluginSystem, getPluginsByType, getPluginInfo } from '../core/pluginLoader';
import { 
  PluginType, 
  PluginProcessOptions 
} from '../types/plugins';
import { 
  AudioAnalysisPlugin, 
  VideoAnalysisPlugin, 
  SubtitleAnalysisPlugin 
} from '../plugins/pluginInterfaces';

/**
 * Example function demonstrating how to use the plugin system
 */
export async function runPluginExample(): Promise<void> {
  console.log('Starting CineFlux-AutoXML plugin example...');
  
  // Initialize the plugin system
  const initialized = await initializePluginSystem();
  if (!initialized) {
    console.error('Failed to initialize plugin system');
    return;
  }
  
  // List all registered plugins
  console.log('Registered plugins:');
  const pluginInfo = getPluginInfo();
  pluginInfo.forEach((info: any) => {
    console.log(`- ${info.name} (${info.id}): ${info.type}, v${info.version}`);
  });
  
  // Example: Using an audio analysis plugin
  console.log('\nUsing audio analysis plugin:');
  const audioPlugins = getPluginsByType(PluginType.AudioAnalysis);
  if (audioPlugins.length > 0) {
    const audioPlugin = audioPlugins[0] as AudioAnalysisPlugin;
    console.log(`Using audio plugin: ${audioPlugin.metadata.name}`);
    
    // Get supported formats
    const supportedFormats = audioPlugin.getSupportedAudioFormats();
    console.log(`Supported formats: ${supportedFormats.join(', ')}`);
    
    // Create a mock audio buffer for testing
    const mockAudioBuffer = new ArrayBuffer(1024);
    
    // Process the audio data
    const processOptions: PluginProcessOptions = {
      data: mockAudioBuffer,
      format: 'wav',
      options: {
        detectSpeech: true,
        detectBeats: true
      }
    };
    
    const result = await audioPlugin.process(processOptions);
    console.log('Audio analysis result:', result.success ? 'Success' : 'Failed');
    if (result.success && result.data) {
      console.log(`- Duration: ${result.data.duration}s`);
      console.log(`- Channels: ${result.data.channels}`);
      console.log(`- Sample rate: ${result.data.sampleRate}Hz`);
      if (result.data.speechSegments) {
        console.log(`- Speech segments: ${result.data.speechSegments.length}`);
      }
    }
  } else {
    console.log('No audio analysis plugins found');
  }
  
  // Example: Using a video analysis plugin
  console.log('\nUsing video analysis plugin:');
  const videoPlugins = getPluginsByType(PluginType.VideoAnalysis);
  if (videoPlugins.length > 0) {
    const videoPlugin = videoPlugins[0] as VideoAnalysisPlugin;
    console.log(`Using video plugin: ${videoPlugin.metadata.name}`);
    
    // Get supported formats
    const supportedFormats = videoPlugin.getSupportedVideoFormats();
    console.log(`Supported formats: ${supportedFormats.join(', ')}`);
    
    // Create a mock video buffer for testing
    const mockVideoBuffer = new ArrayBuffer(1024);
    
    // Process the video data
    const processOptions: PluginProcessOptions = {
      data: mockVideoBuffer,
      format: 'mp4',
      options: {
        detectScenes: true,
        detectObjects: true
      }
    };
    
    const result = await videoPlugin.process(processOptions);
    console.log('Video analysis result:', result.success ? 'Success' : 'Failed');
    if (result.success && result.data) {
      console.log(`- Duration: ${result.data.duration}s`);
      console.log(`- Resolution: ${result.data.width}x${result.data.height}`);
      console.log(`- Frame rate: ${result.data.frameRate}fps`);
      if (result.data.sceneChanges) {
        console.log(`- Scene changes: ${result.data.sceneChanges.length}`);
      }
    }
    
    // Extract a frame
    console.log('\nExtracting frame from video:');
    const frameResult = await videoPlugin.extractFrame(mockVideoBuffer, 10.5);
    if (frameResult.success) {
      console.log(`- Frame extracted at 10.5s (${frameResult?.data.byteLength} bytes)`);
    }
  } else {
    console.log('No video analysis plugins found');
  }
  
  // Example: Using a subtitle analysis plugin
  console.log('\nUsing subtitle analysis plugin:');
  const subtitlePlugins = getPluginsByType(PluginType.SubtitleAnalysis);
  if (subtitlePlugins.length > 0) {
    const subtitlePlugin = subtitlePlugins[0] as SubtitleAnalysisPlugin;
    console.log(`Using subtitle plugin: ${subtitlePlugin.metadata.name}`);
    
    // Get supported formats
    const supportedFormats = subtitlePlugin.getSupportedSubtitleFormats();
    console.log(`Supported formats: ${supportedFormats.join(', ')}`);
    
    // Create mock subtitle data for testing
    const mockSubtitleData = `1
00:00:05,000 --> 00:00:08,000
This is the first subtitle.

2
00:00:10,000 --> 00:00:15,000
This is the second subtitle.
It has multiple lines.`;
    
    // Parse the subtitle data
    const parseResult = await subtitlePlugin.parseSubtitles(mockSubtitleData, 'srt');
    console.log('Subtitle parsing result:', parseResult.success ? 'Success' : 'Failed');
    if (parseResult.success && parseResult.data) {
      console.log(`- Entries: ${parseResult.data.entries.length}`);
      console.log(`- First entry: "${parseResult.data.entries[0].text}" (${parseResult.data.entries[0].startTime}s - ${parseResult.data.entries[0].endTime}s)`);
      
      // Convert to a different format
      console.log('\nConverting subtitles to XML:');
      const convertResult = await subtitlePlugin.convertSubtitles(parseResult.data, 'xml');
      if (convertResult.success) {
        console.log('- Conversion successful');
        console.log('- First 200 characters of XML:');
        console.log(convertResult.data.substring(0, 200) + '...');
      }
    }
  } else {
    console.log('No subtitle analysis plugins found');
  }
  
  // Example: Loading an external plugin (this would be implemented in a real application)
  console.log('\nLoading external plugins (example):');
  console.log('- This is a demonstration of how external plugins would be loaded');
  console.log('- In a real application, these paths would point to actual plugin files');
  
  // Example paths (these don't exist in this example)
  const externalJsPluginPath = '/path/to/external/plugin.js';
  const externalWasmPluginPath = '/path/to/external/plugin.wasm';
  
  console.log(`- Would load JS plugin from: ${externalJsPluginPath}`);
  console.log(`- Would load WASM plugin from: ${externalWasmPluginPath}`);
  
  console.log('\nPlugin example completed');
}

// This function would be called from the main application
// runPluginExample();
