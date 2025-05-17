// src/services/AudioService.ts
import { 
  AudioAnalysis, 
  Beat, 
  BeatAnalysis, 
  Tempo, 
  Waveform, 
  EnergyAnalysis, 
  EnergySample 
} from '../types/AudioAnalysis';

/**
 * Error class for audio processing errors
 */
export class AudioProcessingError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'AudioProcessingError';
  }
}

/**
 * Service for audio analysis and processing
 */
class AudioService {
  /**
   * Load an audio file and return an AudioBuffer
   * @param source Audio file or URL to load
   * @param progressCallback Optional callback for loading progress
   * @returns Promise resolving to an AudioBuffer
   */
  static async loadAudio(
    source: File | string,
    progressCallback?: (progress: number, step: string) => void
  ): Promise<AudioBuffer> {
    try {
      // Report initial progress
      progressCallback?.(0, 'Initializing audio context...');
      
      // Create an audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      let arrayBuffer: ArrayBuffer;
      
      // Handle different source types
      if (typeof source === 'string') {
        // Load from URL
        progressCallback?.(10, 'Fetching audio file...');
        
        const response = await fetch(source);
        
        if (!response.ok) {
          throw new AudioProcessingError(
            `Failed to fetch audio file: ${response.statusText}`,
            'FETCH_ERROR'
          );
        }
        
        // Setup progress reporting for fetch
        const contentLength = Number(response.headers.get('Content-Length') || '0');
        const reader = response.body?.getReader();
        
        if (!reader) {
          throw new AudioProcessingError('Response body is not readable', 'STREAM_ERROR');
        }
        
        // Read the response body with progress tracking
        let receivedLength = 0;
        const chunks: Uint8Array[] = [];
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          chunks.push(value);
          receivedLength += value.length;
          
          if (contentLength > 0) {
            const progress = Math.min(80, 10 + Math.round((receivedLength / contentLength) * 70));
            progressCallback?.(progress, 'Downloading audio file...');
          }
        }
        
        // Concatenate chunks into a single Uint8Array
        const allChunks = new Uint8Array(receivedLength);
        let position = 0;
        
        for (const chunk of chunks) {
          allChunks.set(chunk, position);
          position += chunk.length;
        }
        
        arrayBuffer = allChunks.buffer;
      } else {
        // Load from File object
        progressCallback?.(10, 'Reading audio file...');
        arrayBuffer = await source.arrayBuffer();
        progressCallback?.(40, 'Audio file loaded, decoding...');
      }
      
      // Decode the audio data
      progressCallback?.(80, 'Decoding audio data...');
      
      // Use a promise to handle the decodeAudioData callback
      const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        audioContext.decodeAudioData(
          arrayBuffer,
          (buffer) => resolve(buffer),
          (error) => reject(new AudioProcessingError(`Failed to decode audio: ${error}`, 'DECODE_ERROR'))
        );
      });
      
      progressCallback?.(100, 'Audio loaded successfully');
      
      // Close the audio context
      if (audioContext.state !== 'closed') {
        await audioContext.close();
      }
      
      return audioBuffer;
    } catch (error) {
      if (error instanceof AudioProcessingError) {
        throw error;
      }
      
      throw new AudioProcessingError(
        `Error loading audio: ${error instanceof Error ? error.message : String(error)}`,
        'LOAD_ERROR'
      );
    }
  }
  
  /**
   * Analyze an audio file to detect beats, segments, and energy levels
   * @param audioFile The audio file to analyze
   * @param progressCallback Callback function to report progress
   * @returns Promise resolving to the analysis results
   */
  static async analyzeAudio(
    audioFile: File,
    progressCallback: (progress: number, step: string) => void
  ): Promise<AudioAnalysis> {
    try {
      // Load the audio file
      progressCallback(0, 'Loading audio file...');
      const audioBuffer = await this.loadAudio(audioFile, (progress, step) => {
        // Map the loading progress to 0-30% of the total progress
        progressCallback(Math.floor(progress * 0.3), step);
      });
      
      progressCallback(30, 'Analyzing audio...');
      
      // Extract waveform data
      const waveform = await this.extractWaveform(audioBuffer, (progress) => {
        // Map waveform extraction to 30-40% of total progress
        progressCallback(30 + Math.floor(progress * 0.1), 'Extracting waveform...');
      });
      
      // Detect beats
      progressCallback(40, 'Detecting beats...');
      const beatAnalysis = await this.detectBeats(audioBuffer, (progress) => {
        // Map beat detection to 40-60% of total progress
        progressCallback(40 + Math.floor(progress * 0.2), 'Detecting beats...');
      });
      
      // Analyze energy levels
      progressCallback(60, 'Analyzing energy levels...');
      const energyAnalysis = await this.analyzeEnergy(audioBuffer, (progress) => {
        // Map energy analysis to 60-80% of total progress
        progressCallback(60 + Math.floor(progress * 0.2), 'Analyzing energy levels...');
      });
      
      // Estimate tempo
      progressCallback(80, 'Estimating tempo...');
      const tempo = await this.estimateTempo(beatAnalysis.beats, audioBuffer.duration);
      
      // Detect sections
      progressCallback(90, 'Detecting sections...');
      const sections = await this.detectSections(energyAnalysis, beatAnalysis, audioBuffer.duration);
      
      progressCallback(100, 'Analysis complete');
      
      // Return the complete analysis
      return {
        metadata: {
          title: audioFile.name,
          duration: audioBuffer.duration,
          format: audioFile.type.split('/')[1] || 'unknown',
          analyzedAt: new Date()
        },
        waveform,
        beats: beatAnalysis,
        tempo,
        energy: energyAnalysis,
        sections
      };
    } catch (error) {
      console.error('Error analyzing audio:', error);
      
      throw new AudioProcessingError(
        `Error analyzing audio: ${error instanceof Error ? error.message : String(error)}`,
        'ANALYSIS_ERROR'
      );
    }
  }
  
  /**
   * Extract waveform data from an audio buffer
   * @param audioBuffer The audio buffer to analyze
   * @param progressCallback Optional callback for progress updates
   * @returns Promise resolving to waveform data
   */
  static async extractWaveform(
    audioBuffer: AudioBuffer,
    progressCallback?: (progress: number) => void
  ): Promise<Waveform> {
    // Get the number of channels and sample rate
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    
    // Determine how many samples to include in the waveform
    // We'll aim for about 1000 samples per minute of audio, with a minimum of 1000
    const targetSamples = Math.max(1000, Math.round(duration * 1000 / 60));
    
    // Calculate the step size to achieve the target number of samples
    const stepSize = Math.floor(audioBuffer.length / targetSamples);
    
    // Initialize the waveform data array
    const data: number[] = new Array(targetSamples).fill(0);
    
    // Initialize min/max amplitude
    let maxAmplitude = 0;
    let minAmplitude = 0;
    
    // Process each channel
    for (let channel = 0; channel < channels; channel++) {
      // Get the channel data
      const channelData = audioBuffer.getChannelData(channel);
      
      // Extract samples at regular intervals
      for (let i = 0; i < targetSamples; i++) {
        // Report progress every 10% of samples
        if (progressCallback && i % Math.floor(targetSamples / 10) === 0) {
          progressCallback((i / targetSamples) * 100);
        }
        
        // Calculate the start index for this sample
        const startIndex = i * stepSize;
        
        // Calculate the average amplitude for this window
        let sum = 0;
        let max = 0;
        
        for (let j = 0; j < stepSize && startIndex + j < channelData.length; j++) {
          const amplitude = channelData[startIndex + j];
          sum += Math.abs(amplitude);
          max = Math.max(max, Math.abs(amplitude));
        }
        
        // Use the maximum amplitude for this window
        // For multi-channel audio, we'll take the average across channels
        data[i] += max / channels;
        
        // Update min/max amplitude
        maxAmplitude = Math.max(maxAmplitude, data[i]);
        minAmplitude = Math.min(minAmplitude, data[i]);
      }
    }
    
    // Final progress update
    progressCallback?.(100);
    
    return {
      duration,
      sampleRate,
      channels,
      data,
      maxAmplitude,
      minAmplitude
    };
  }
  
  /**
   * Detect beats in an audio buffer
   * @param audioBuffer The audio buffer to analyze
   * @param progressCallback Optional callback for progress updates
   * @returns Promise resolving to beat analysis data
   */
  static async detectBeats(
    audioBuffer: AudioBuffer,
    progressCallback?: (progress: number) => void
  ): Promise<BeatAnalysis> {
    // Get the audio data from the first channel
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Calculate the window size (50ms)
    const windowSize = Math.floor(sampleRate * 0.05);
    
    // Calculate the number of windows
    const numWindows = Math.floor(channelData.length / windowSize);
    
    // Initialize arrays for energy and beat detection
    const energyHistory: number[] = [];
    const beats: Beat[] = [];
    
    // Calculate the energy threshold multiplier (adjust sensitivity)
    const energyThreshold = 1.5;
    const minEnergyThreshold = 0.01;
    
    // Initialize variables for beat detection
    let recentEnergy: number[] = [];
    const recentEnergyMax = 30; // Number of recent energy values to consider
    
    // Process each window
    for (let i = 0; i < numWindows; i++) {
      // Report progress every 5% of windows
      if (progressCallback && i % Math.floor(numWindows / 20) === 0) {
        progressCallback((i / numWindows) * 100);
      }
      
      // Calculate the energy for this window
      let energy = 0;
      for (let j = 0; j < windowSize && i * windowSize + j < channelData.length; j++) {
        energy += Math.pow(channelData[i * windowSize + j], 2);
      }
      energy = Math.sqrt(energy / windowSize);
      
      // Add to energy history
      energyHistory.push(energy);
      
      // Add to recent energy array
      recentEnergy.push(energy);
      if (recentEnergy.length > recentEnergyMax) {
        recentEnergy.shift();
      }
      
      // Calculate the average energy of recent windows
      const averageEnergy = recentEnergy.reduce((sum, e) => sum + e, 0) / recentEnergy.length;
      
      // Check if this window contains a beat
      if (
        energy > averageEnergy * energyThreshold &&
        energy > minEnergyThreshold &&
        i > recentEnergyMax // Skip the first few windows
      ) {
        // Calculate the time of the beat
        const time = (i * windowSize) / sampleRate;
        
        // Calculate confidence based on how much the energy exceeds the threshold
        const confidence = Math.min(1.0, (energy / (averageEnergy * energyThreshold)));
        
        // Add to beats array
        beats.push({ time, confidence });
      }
    }
    
    // Calculate average confidence
    const averageConfidence = beats.length > 0
      ? beats.reduce((sum, beat) => sum + beat.confidence, 0) / beats.length
      : 0;
    
    // Final progress update
    progressCallback?.(100);
    
    return {
      beats,
      averageConfidence
    };
  }
  
  /**
   * Analyze energy levels in an audio buffer
   * @param audioBuffer The audio buffer to analyze
   * @param progressCallback Optional callback for progress updates
   * @returns Promise resolving to energy analysis data
   */
  static async analyzeEnergy(
    audioBuffer: AudioBuffer,
    progressCallback?: (progress: number) => void
  ): Promise<EnergyAnalysis> {
    // Get the audio data from all channels
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    
    // Calculate the window size (100ms)
    const windowSize = Math.floor(sampleRate * 0.1);
    
    // Calculate the number of windows
    const numWindows = Math.floor(audioBuffer.length / windowSize);
    
    // Initialize arrays for energy samples
    const samples: EnergySample[] = [];
    
    let totalEnergy = 0;
    let peakEnergy = 0;
    let peakEnergyTime = 0;
    
    // Process each window
    for (let i = 0; i < numWindows; i++) {
      // Report progress every 5% of windows
      if (progressCallback && i % Math.floor(numWindows / 20) === 0) {
        progressCallback((i / numWindows) * 100);
      }
      
      // Calculate the energy for this window across all channels
      let windowEnergy = 0;
      
      for (let channel = 0; channel < channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        
        let channelEnergy = 0;
        for (let j = 0; j < windowSize && i * windowSize + j < channelData.length; j++) {
          channelEnergy += Math.pow(channelData[i * windowSize + j], 2);
        }
        
        // Average the energy for this channel
        channelEnergy = Math.sqrt(channelEnergy / windowSize);
        
        // Add to the window energy (average across channels)
        windowEnergy += channelEnergy / channels;
      }
      
      // Calculate the time of this sample
      const time = (i * windowSize) / sampleRate;
      
      // Add to samples array
      samples.push({ time, level: windowEnergy });
      
      // Update total energy
      totalEnergy += windowEnergy;
      
      // Update peak energy
      if (windowEnergy > peakEnergy) {
        peakEnergy = windowEnergy;
        peakEnergyTime = time;
      }
    }
    
    // Calculate average energy
    const averageEnergy = totalEnergy / numWindows;
    
    // Normalize energy levels to 0-1 range
    if (peakEnergy > 0) {
      for (const sample of samples) {
        sample.level = sample.level / peakEnergy;
      }
      
      // Also normalize average energy
      averageEnergy / peakEnergy;
    }
    
    // Final progress update
    progressCallback?.(100);
    
    return {
      samples,
      averageEnergy,
      peakEnergy,
      peakEnergyTime
    };
  }
  
  /**
   * Estimate tempo from beat data
   * @param beats Array of detected beats
   * @param duration Duration of the audio in seconds
   * @returns Promise resolving to tempo information
   */
  static async estimateTempo(beats: Beat[], duration: number): Promise<Tempo> {
    // If we don't have enough beats, return a default tempo
    if (beats.length < 4) {
      return {
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        confidence: 0.5,
        isStable: true
      };
    }
    
    // Calculate intervals between beats
    const intervals: number[] = [];
    for (let i = 1; i < beats.length; i++) {
      intervals.push(beats[i].time - beats[i - 1].time);
    }
    
    // Filter out outliers (intervals that are too short or too long)
    const filteredIntervals = intervals.filter(interval => 
      interval >= 0.2 && interval <= 2.0 // Between 30 BPM and 300 BPM
    );
    
    // If we don't have enough intervals after filtering, return a default tempo
    if (filteredIntervals.length < 3) {
      return {
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        confidence: 0.5,
        isStable: true
      };
    }
    
    // Calculate the median interval
    filteredIntervals.sort((a, b) => a - b);
    const medianInterval = filteredIntervals[Math.floor(filteredIntervals.length / 2)];
    
    // Convert to BPM
    const bpm = 60 / medianInterval;
    
    // Round to nearest integer and ensure it's in a reasonable range
    const roundedBpm = Math.max(60, Math.min(200, Math.round(bpm)));
    
    // Calculate the standard deviation of intervals to determine stability
    const mean = filteredIntervals.reduce((sum, interval) => sum + interval, 0) / filteredIntervals.length;
    const variance = filteredIntervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / filteredIntervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate coefficient of variation (CV) to determine stability
    const cv = stdDev / mean;
    const isStable = cv < 0.2; // If CV is less than 20%, consider the tempo stable
    
    // Calculate confidence based on the number of beats and their consistency
    const beatCoverage = beats.length / (duration / (60 / roundedBpm));
    const consistency = 1 - Math.min(1, cv);
    const confidence = Math.min(1.0, (beatCoverage * 0.5) + (consistency * 0.5));
    
    // Determine tempo variations if not stable
    let variations = undefined;
    if (!isStable) {
      // Divide the audio into segments and calculate BPM for each segment
      const segmentDuration = 15; // 15 seconds per segment
      const numSegments = Math.ceil(duration / segmentDuration);
      
      variations = [];
      
      for (let i = 0; i < numSegments; i++) {
        const startTime = i * segmentDuration;
        const endTime = Math.min((i + 1) * segmentDuration, duration);
        
        // Get beats in this segment
        const segmentBeats = beats.filter(beat => beat.time >= startTime && beat.time < endTime);
        
        if (segmentBeats.length >= 4) {
          // Calculate intervals for this segment
          const segmentIntervals: number[] = [];
          for (let j = 1; j < segmentBeats.length; j++) {
            segmentIntervals.push(segmentBeats[j].time - segmentBeats[j - 1].time);
          }
          
          // Filter out outliers
          const filteredSegmentIntervals = segmentIntervals.filter(interval => 
            interval >= 0.2 && interval <= 2.0
          );
          
          if (filteredSegmentIntervals.length >= 3) {
            // Calculate the median interval for this segment
            filteredSegmentIntervals.sort((a, b) => a - b);
            const segmentMedianInterval = filteredSegmentIntervals[Math.floor(filteredSegmentIntervals.length / 2)];
            
            // Convert to BPM
            const segmentBpm = 60 / segmentMedianInterval;
            
            // Round to nearest integer and ensure it's in a reasonable range
            const roundedSegmentBpm = Math.max(60, Math.min(200, Math.round(segmentBpm)));
            
            variations.push({
              startTime,
              bpm: roundedSegmentBpm
            });
          }
        }
      }
    }
    
    // For simplicity, assume 4/4 time signature
    // In a real app, you would analyze beat patterns to determine the time signature
    return {
      bpm: roundedBpm,
      timeSignature: { numerator: 4, denominator: 4 },
      confidence,
      isStable,
      variations
    };
  }
  
  /**
   * Detect sections in the audio based on energy and beat analysis
   * @param energyAnalysis Energy analysis data
   * @param beatAnalysis Beat analysis data
   * @param duration Duration of the audio in seconds
   * @returns Promise resolving to section analysis data
   */
  static async detectSections(
    energyAnalysis: EnergyAnalysis,
    beatAnalysis: BeatAnalysis,
    duration: number
  ): Promise<any> {
    // This is a simplified section detection algorithm
    // In a real app, you would use more sophisticated algorithms
    
    // Initialize sections array
    const sections = [];
    
    // If we don't have enough energy samples, return a single section
    if (energyAnalysis.samples.length < 10) {
      return {
        sections: [
          {
            start: 0,
            duration,
            label: 'Section 1',
            confidence: 0.5
          }
        ]
      };
    }
    
    // Calculate energy changes to detect section boundaries
    const energyChanges = [];
    const windowSize = 5; // Number of samples to average
    
    for (let i = windowSize; i < energyAnalysis.samples.length - windowSize; i++) {
      // Calculate average energy before this point
      let beforeEnergy = 0;
      for (let j = i - windowSize; j < i; j++) {
        beforeEnergy += energyAnalysis.samples[j].level;
      }
      beforeEnergy /= windowSize;
      
      // Calculate average energy after this point
      let afterEnergy = 0;
      for (let j = i; j < i + windowSize; j++) {
        afterEnergy += energyAnalysis.samples[j].level;
      }
      afterEnergy /= windowSize;
      
      // Calculate the change in energy
      const change = Math.abs(afterEnergy - beforeEnergy);
      
      energyChanges.push({
        time: energyAnalysis.samples[i].time,
        change
      });
    }
    
    // Sort energy changes by magnitude
    energyChanges.sort((a, b) => b.change - a.change);
    
    // Take the top changes as section boundaries
    // The number of sections depends on the duration of the audio
    const numSections = Math.min(
      10, // Maximum number of sections
      Math.max(2, Math.floor(duration / 30)) // At least 2 sections, roughly one per 30 seconds
    );
    
    // Get the top changes
    const topChanges = energyChanges.slice(0, numSections - 1);
    
    // Sort by time
    topChanges.sort((a, b) => a.time - b.time);
    
    // Create sections
    let sectionStart = 0;
    
    for (let i = 0; i < topChanges.length; i++) {
      const sectionEnd = topChanges[i].time;
      const sectionDuration = sectionEnd - sectionStart;
      
      // Only add sections that are at least 5 seconds long
      if (sectionDuration >= 5) {
        sections.push({
          start: sectionStart,
          duration: sectionDuration,
          label: `Section ${sections.length + 1}`,
          confidence: 0.5 + (topChanges[i].change * 0.5) // Higher change = higher confidence
        });
        
        sectionStart = sectionEnd;
      }
    }
    
    // Add the final section
    const finalDuration = duration - sectionStart;
    if (finalDuration >= 5) {
      sections.push({
        start: sectionStart,
        duration: finalDuration,
        label: `Section ${sections.length + 1}`,
        confidence: 0.5
      });
    }
    
    return { sections };
  }
  
  /**
   * Extract the BPM (beats per minute) from an audio file
   * @param audioFile The audio file to analyze
   * @returns Promise resolving to the BPM and beat times
   */
  static async extractBPM(audioFile: File): Promise<{ bpm: number; beats: number[] }> {
    try {
      // Load the audio file
      const audioBuffer = await this.loadAudio(audioFile);
      
      // Detect beats
      const beatAnalysis = await this.detectBeats(audioBuffer);
      
      // Estimate tempo
      const tempo = await this.estimateTempo(beatAnalysis.beats, audioBuffer.duration);
      
      // Extract beat times
      const beatTimes = beatAnalysis.beats.map(beat => beat.time);
      
      return {
        bpm: tempo.bpm,
        beats: beatTimes
      };
    } catch (error) {
      console.error('Error extracting BPM:', error);
      
      // Fallback to a default value
      return {
        bpm: 120,
        beats: Array.from({ length: 100 }, (_, i) => i * (60 / 120)) // Generate beats at 120 BPM
      };
    }
  }
  
  /**
   * Create a waveform visualization for an audio file
   * @param audioFile The audio file to visualize
   * @param width The width of the visualization in pixels
   * @param height The height of the visualization in pixels
   * @returns Promise resolving to an array of amplitude values
   */
  static async createWaveform(audioFile: File, width: number, height: number): Promise<number[]> {
    try {
      // Load the audio file
      const audioBuffer = await this.loadAudio(audioFile);
      
      // Extract waveform data
      const waveform = await this.extractWaveform(audioBuffer);
      
      // Resample the waveform data to match the requested width
      const resampled = this.resampleWaveform(waveform.data, width);
      
      // Scale the waveform to the requested height
      const scaled = this.scaleWaveform(resampled, height);
      
      return scaled;
    } catch (error) {
      console.error('Error creating waveform:', error);
      
      // Return a fallback waveform
      return Array.from({ length: width }, () => Math.random() * height);
    }
  }
  
  /**
   * Resample a waveform to a new length
   * @param waveform The original waveform data
   * @param newLength The new length
   * @returns Resampled waveform data
   */
  private static resampleWaveform(waveform: number[], newLength: number): number[] {
    const result = new Array(newLength).fill(0);
    
    // If the waveform is empty, return the empty result
    if (waveform.length === 0) {
      return result;
    }
    
    // If the waveform is shorter than the new length, stretch it
    if (waveform.length < newLength) {
      for (let i = 0; i < newLength; i++) {
        const originalIndex = Math.floor(i * waveform.length / newLength);
        result[i] = waveform[originalIndex];
      }
    } 
    // If the waveform is longer than the new length, compress it
    else {
      const samplesPerPoint = waveform.length / newLength;
      
      for (let i = 0; i < newLength; i++) {
        const startIndex = Math.floor(i * samplesPerPoint);
        const endIndex = Math.floor((i + 1) * samplesPerPoint);
        
        let sum = 0;
        let count = 0;
        
        for (let j = startIndex; j < endIndex && j < waveform.length; j++) {
          sum += waveform[j];
          count++;
        }
        
        result[i] = count > 0 ? sum / count : 0;
      }
    }
    
    return result;
  }
  
  /**
   * Scale a waveform to a new height
   * @param waveform The original waveform data
   * @param height The new height
   * @returns Scaled waveform data
   */
  private static scaleWaveform(waveform: number[], height: number): number[] {
    // Find the maximum amplitude
    const maxAmplitude = Math.max(...waveform.map(Math.abs));
    
    // If the maximum amplitude is 0, return a flat line
    if (maxAmplitude === 0) {
      return new Array(waveform.length).fill(height / 2);
    }
    
    // Scale the waveform to the new height
    return waveform.map(amplitude => {
      // Scale to -1 to 1
      const normalized = amplitude / maxAmplitude;
      
      // Scale to 0 to height
      return ((normalized + 1) / 2) * height;
    });
  }
}

export default AudioService;
