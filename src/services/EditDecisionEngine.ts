/**
 * EditDecisionEngine.ts
 * 
 * Service for generating edit decisions based on audio and video analysis
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  VideoAnalysis, 
  Scene, 
  ClipType, 
  TimelineMarker, 
  MarkerType 
} from '../types/video-types';
import { 
  Beat, 
  AudioSegment, 
  AudioAnalysis 
} from '../types/audio-types'; // You may need to create or update this file
import { 
  EditDecision, 
  EditPoint, 
  TransitionType, 
  EditStyle, 
  ProjectSettings, 
  VideoClipAssignment,
  EditDecisionEngineEvents
} from '../types/edit-types'; // You may need to create this file

// Import the services
import AudioService from './AudioService';
import VideoService from './VideoService';

/**
 * EditDecisionEngine generates automatic edits based on audio and video analysis
 */
export class EditDecisionEngine {
  private eventListeners: Map<EditDecisionEngineEvents, Function[]> = new Map();
  private editCache: Map<string, EditDecision[]> = new Map();
  private audioService: AudioService;
  private videoService: VideoService;
  
  constructor(
    audioService = new AudioService(),
    videoService = VideoService
  ) {
    // Initialize event listener collections
    Object.values(EditDecisionEngineEvents).forEach(event => {
      this.eventListeners.set(event, []);
    });

    // Store service references
    this.audioService = audioService;
    this.videoService = videoService;
  }
  
  /**
   * Generates edit decisions based on audio and video analysis
   * @param audioAnalysis Analysis results from AudioService
   * @param videoAnalyses Map of video file IDs to their analysis results
   * @param settings Project settings including edit style
   * @returns Promise resolving to array of EditDecisions
   */
  async generateEditDecisions(
    audioAnalysis: AudioAnalysis,
    videoAnalyses: Record<string, VideoAnalysis>,
    settings: ProjectSettings
  ): Promise<EditDecision[]> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(audioAnalysis, videoAnalyses, settings);
      if (this.editCache.has(cacheKey)) {
        return this.editCache.get(cacheKey)!;
      }
      
      // Emit start event
      this.emitEvent(EditDecisionEngineEvents.GENERATION_START, { 
        audioAnalysis, 
        videoAnalyses, 
        settings 
      });
      
      // Step 1: Generate cut points based on audio analysis
      this.emitEvent(EditDecisionEngineEvents.PROGRESS, { 
        message: 'Generating cut points...',
        progress: 0.1 
      });
      
      const cutPoints = this.getCutPoints(audioAnalysis, settings.editStyle);
      
      // Step 2: Assign video clips to each cut point
      this.emitEvent(EditDecisionEngineEvents.PROGRESS, { 
        message: 'Assigning video clips...',
        progress: 0.3 
      });
      
      const decisions: EditDecision[] = [];
      
      // Create video pool from all analyses
      const videoPool: { analysis: VideoAnalysis, videoId: string }[] = [];
      Object.entries(videoAnalyses).forEach(([videoId, analysis]) => {
        videoPool.push({ analysis, videoId });
      });
      
      if (videoPool.length === 0) {
        throw new Error('No video analyses available for edit decisions');
      }
      
      // Assign clips to each cut point
      for (let i = 0; i < cutPoints.length; i++) {
        const cutPoint = cutPoints[i];
        const nextCutPoint = cutPoints[i + 1] || null;
        
        // Calculate clip duration
        const duration = nextCutPoint ? nextCutPoint.time - cutPoint.time : 2.0;
        
        // Find best matching clip
        const clipAssignment = await this.findBestClip(cutPoint, videoPool, duration);
        
        // Determine transition type
        const transition = this.determineTransition(cutPoint, settings);
        
        // Create edit decision
        const decision: EditDecision = {
          id: uuidv4(),
          startTime: cutPoint.time,
          duration,
          videoId: clipAssignment.videoId,
          sceneId: clipAssignment.sceneId,
          clipStartTime: clipAssignment.clipStartTime,
          transitionType: transition,
          importance: cutPoint.importance,
          energy: cutPoint.energy,
          beat: cutPoint.onBeat,
          segment: cutPoint.inSegment
        };
        
        decisions.push(decision);
        
        // Update progress
        this.emitEvent(EditDecisionEngineEvents.PROGRESS, { 
          message: `Processing cut point ${i + 1} of ${cutPoints.length}...`,
          progress: 0.3 + (0.6 * (i / cutPoints.length)) 
        });
      }
      
      // Step 3: Optimize the edit decisions
      this.emitEvent(EditDecisionEngineEvents.PROGRESS, { 
        message: 'Optimizing edit decisions...',
        progress: 0.9 
      });
      
      const optimizedDecisions = this.optimizeEditDecisions(decisions);
      
      // Cache the result
      this.editCache.set(cacheKey, optimizedDecisions);
      
      // Emit complete event
      this.emitEvent(EditDecisionEngineEvents.GENERATION_COMPLETE, { 
        decisions: optimizedDecisions 
      });
      
      return optimizedDecisions;
    } catch (error) {
      console.error('Error generating edit decisions:', error);
      
      // Emit error event
      this.emitEvent(EditDecisionEngineEvents.ERROR, { 
        message: `Failed to generate edit decisions: ${error.message}`,
        error 
      });
      
      throw new Error(`Failed to generate edit decisions: ${error.message}`);
    }
  }

  /**
   * Analyze audio file and generate edit decisions
   * @param audioFile The audio file to analyze
   * @param videoFiles Array of video files to analyze
   * @param settings Project settings
   * @returns Promise resolving to array of EditDecisions
   */
  async analyzeAndGenerateDecisions(
    audioFile: File,
    videoFiles: File[],
    settings: ProjectSettings
  ): Promise<EditDecision[]> {
    try {
      // Step 1: Analyze audio using AudioService
      this.emitEvent(EditDecisionEngineEvents.PROGRESS, { 
        message: 'Analyzing audio...',
        progress: 0.1 
      });

      const audioAnalysis = await this.audioService.analyzeAudio(
        audioFile,
        (progress, step) => {
          // Map audio analysis progress to 10-40% of total progress
          this.emitEvent(EditDecisionEngineEvents.PROGRESS, { 
            message: step,
            progress: 0.1 + (progress * 0.3 / 100)
          });
        }
      );

      // Step 2: Analyze videos using VideoService
      this.emitEvent(EditDecisionEngineEvents.PROGRESS, { 
        message: 'Analyzing videos...',
        progress: 0.4 
      });

      const videoAnalyses: Record<string, VideoAnalysis> = {};
      
      for (let i = 0; i < videoFiles.length; i++) {
        const videoFile = videoFiles[i];
        
        this.emitEvent(EditDecisionEngineEvents.PROGRESS, { 
          message: `Analyzing video ${i + 1} of ${videoFiles.length}...`,
          progress: 0.4 + (0.3 * (i / videoFiles.length))
        });

        const videoAnalysis = await this.videoService.analyzeVideo(videoFile);
        videoAnalyses[videoAnalysis.videoId] = videoAnalysis;
      }

      // Step 3: Generate edit decisions
      this.emitEvent(EditDecisionEngineEvents.PROGRESS, { 
        message: 'Generating edit decisions...',
        progress: 0.7
      });

      return this.generateEditDecisions(audioAnalysis, videoAnalyses, settings);
    } catch (error) {
      console.error('Error analyzing and generating decisions:', error);
      
      // Emit error event
      this.emitEvent(EditDecisionEngineEvents.ERROR, { 
        message: `Failed to analyze and generate decisions: ${error.message}`,
        error 
      });
      
      throw new Error(`Failed to analyze and generate decisions: ${error.message}`);
    }
  }
  
  /**
   * Creates a cache key from analysis objects and settings
   */
  private getCacheKey(
    audioAnalysis: AudioAnalysis,
    videoAnalyses: Record<string, VideoAnalysis>,
    settings: ProjectSettings
  ): string {
    const audioKey = audioAnalysis.id;
    const videoKeys = Object.keys(videoAnalyses).sort().join(',');
    const settingsKey = `${settings.editStyle}:${settings.clipDuration}:${settings.transitionLength}`;
    
    return `${audioKey}|${videoKeys}|${settingsKey}`;
  }
  
  /**
   * Generates cut points based on audio analysis and edit style
   * @param audioAnalysis Audio analysis results
   * @param style Edit style to apply
   * @returns Array of cut points
   */
  getCutPoints(audioAnalysis: AudioAnalysis, style: EditStyle): EditPoint[] {
    const cutPoints: EditPoint[] = [];
    
    // Always start with a cut at the beginning
    cutPoints.push({
      time: 0,
      onBeat: false,
      inSegment: null,
      importance: 1,
      energy: 0.5
    });
    
    // Different strategies based on edit style
    switch (style) {
      case EditStyle.RHYTHM_MATCH:
        this.generateRhythmBasedCuts(audioAnalysis, cutPoints);
        break;
        
      case EditStyle.SEGMENT_BASED:
        this.generateSegmentBasedCuts(audioAnalysis, cutPoints);
        break;
        
      case EditStyle.ENERGY_BASED:
        this.generateEnergyBasedCuts(audioAnalysis, cutPoints);
        break;
        
      case EditStyle.CINEMATIC:
        this.generateCinematicCuts(audioAnalysis, cutPoints);
        break;
        
      default:
        // Default to rhythm-based
        this.generateRhythmBasedCuts(audioAnalysis, cutPoints);
    }
    
    // Sort cut points by time
    return cutPoints.sort((a, b) => a.time - b.time);
  }
  
  /**
   * Generate cuts based on beat patterns for rhythm matching
   */
  private generateRhythmBasedCuts(audioAnalysis: AudioAnalysis, cutPoints: EditPoint[]) {
    if (!audioAnalysis.beats || audioAnalysis.beats.length === 0) {
      // Fallback to regular intervals if no beats detected
      this.generateRegularIntervalCuts(audioAnalysis, cutPoints);
      return;
    }
    
    const beats = audioAnalysis.beats;
    const beatGroupSize = this.determineBeatGroupSize(audioAnalysis.tempo);
    
    // Start with higher importance on strong beats (typically first beat in a measure)
    for (let i = 0; i < beats.length; i++) {
      if (i % beatGroupSize === 0) { // Every X beats (based on time signature)
        const beat = beats[i];
        
        // Skip if too close to an existing cut point
        if (this.isTooCloseToExistingCut(beat.time, cutPoints)) {
          continue;
        }
        
        // Find segment at this time
        const segment = this.findSegmentAtTime(audioAnalysis.segments, beat.time);
        
        cutPoints.push({
          time: beat.time,
          onBeat: true,
          inSegment: segment,
          importance: 0.8, // High importance for strong beats
          energy: beat.energy
        });
      }
    }
    
    // Add some cuts on interesting energy changes
    this.addEnergyChangeCuts(audioAnalysis, cutPoints, 0.3);
  }
  
  /**
   * Generate cuts based on music segments (verse, chorus, etc.)
   */
  private generateSegmentBasedCuts(audioAnalysis: AudioAnalysis, cutPoints: EditPoint[]) {
    if (!audioAnalysis.segments || audioAnalysis.segments.length === 0) {
      // Fallback to rhythm-based if no segments detected
      this.generateRhythmBasedCuts(audioAnalysis, cutPoints);
      return;
    }
    
    const segments = audioAnalysis.segments;
    
    // Add cuts at segment boundaries
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Skip if too close to an existing cut point
      if (this.isTooCloseToExistingCut(segment.startTime, cutPoints)) {
        continue;
      }
      
      // Higher importance for chorus segments
      const importance = segment.type === 'chorus' ? 0.9 : 0.7;
      
      cutPoints.push({
        time: segment.startTime,
        onBeat: false,
        inSegment: segment,
        importance,
        energy: 0.6 // Default energy level
      });
      
      // Also add some cuts within segments on beats
      this.addBeatsWithinSegment(audioAnalysis, segment, cutPoints);
    }
  }
  
  /**
   * Generate cuts based on energy levels in the audio
   */
  private generateEnergyBasedCuts(audioAnalysis: AudioAnalysis, cutPoints: EditPoint[]) {
    if (!audioAnalysis.energyPoints || audioAnalysis.energyPoints.length === 0) {
      // Fallback to rhythm-based if no energy points
      this.generateRhythmBasedCuts(audioAnalysis, cutPoints);
      return;
    }
    
    // Find significant energy changes
    const energyPoints = audioAnalysis.energyPoints;
    const threshold = 0.2; // Minimum energy change to trigger a cut
    
    for (let i = 1; i < energyPoints.length; i++) {
      const prevPoint = energyPoints[i - 1];
      const currentPoint = energyPoints[i];
      
      const energyChange = Math.abs(currentPoint.energy - prevPoint.energy);
      
      if (energyChange >= threshold) {
        // Skip if too close to an existing cut point
        if (this.isTooCloseToExistingCut(currentPoint.time, cutPoints)) {
          continue;
        }
        
        // Find segment at this time
        const segment = this.findSegmentAtTime(audioAnalysis.segments, currentPoint.time);
        
        // Find nearby beat (if any)
        const nearbyBeat = this.findNearbyBeat(audioAnalysis.beats, currentPoint.time, 0.1);
        
        cutPoints.push({
          time: nearbyBeat ? nearbyBeat.time : currentPoint.time, // Snap to nearby beat if possible
          onBeat: !!nearbyBeat,
          inSegment: segment,
          importance: Math.min(0.5 + energyChange, 1.0), // Higher importance for bigger changes
          energy: currentPoint.energy
        });
      }
    }
    
    // Add some cuts on beats to ensure enough variety
    this.addSomeBeatCuts(audioAnalysis, cutPoints, 0.5);
  }
  
  /**
   * Generate cuts suitable for cinematic-style editing
   */
  private generateCinematicCuts(audioAnalysis: AudioAnalysis, cutPoints: EditPoint[]) {
    // Cinematic style uses longer clips with cuts at significant musical moments
    
    // Add cuts at segment boundaries
    if (audioAnalysis.segments && audioAnalysis.segments.length > 0) {
      for (const segment of audioAnalysis.segments) {
        // Skip if too close to an existing cut point
        if (this.isTooCloseToExistingCut(segment.startTime, cutPoints)) {
          continue;
        }
        
        cutPoints.push({
          time: segment.startTime,
          onBeat: false,
          inSegment: segment,
          importance: 0.9,
          energy: 0.7
        });
      }
    }
    
    // Add cuts at major energy points
    if (audioAnalysis.energyPoints && audioAnalysis.energyPoints.length > 0) {
      const energyPoints = audioAnalysis.energyPoints;
      const threshold = 0.3; // Higher threshold for cinematic style
      
      for (let i = 1; i < energyPoints.length; i++) {
        const prevPoint = energyPoints[i - 1];
        const currentPoint = energyPoints[i];
        
        const energyChange = Math.abs(currentPoint.energy - prevPoint.energy);
        
        if (energyChange >= threshold) {
          // Skip if too close to an existing cut point
          if (this.isTooCloseToExistingCut(currentPoint.time, cutPoints)) {
            continue;
          }
          
          // Find segment at this time
          const segment = this.findSegmentAtTime(audioAnalysis.segments, currentPoint.time);
          
          cutPoints.push({
            time: currentPoint.time,
            onBeat: false,
            inSegment: segment,
            importance: Math.min(0.6 + energyChange, 1.0),
            energy: currentPoint.energy
          });
        }
      }
    }
    
    // Add some cuts on strong beats
    if (audioAnalysis.beats && audioAnalysis.beats.length > 0) {
      const beats = audioAnalysis.beats;
      const beatGroupSize = this.determineBeatGroupSize(audioAnalysis.tempo);
      
      for (let i = 0; i < beats.length; i++) {
        if (i % (beatGroupSize * 2) === 0) { // Every two measures for cinematic style
          const beat = beats[i];
          
          // Skip if too close to an existing cut point
          if (this.isTooCloseToExistingCut(beat.time, cutPoints)) {
            continue;
          }
          
          // Find segment at this time
          const segment = this.findSegmentAtTime(audioAnalysis.segments, beat.time);
          
          cutPoints.push({
            time: beat.time,
            onBeat: true,
            inSegment: segment,
            importance: 0.7,
            energy: beat.energy
          });
        }
      }
    }
    
    // If we still don't have enough cut points, add some at regular intervals
    if (cutPoints.length < 5) {
      this.generateRegularIntervalCuts(audioAnalysis, cutPoints);
    }
  }
  
  /**
   * Generate cuts at regular intervals (fallback method)
   */
  private generateRegularIntervalCuts(audioAnalysis: AudioAnalysis, cutPoints: EditPoint[]) {
    const duration = audioAnalysis.duration;
    const interval = 3.0; // 3 seconds between cuts
    
    for (let time = interval; time < duration; time += interval) {
      // Skip if too close to an existing cut point
      if (this.isTooCloseToExistingCut(time, cutPoints)) {
        continue;
      }
      
      // Find segment at this time
      const segment = this.findSegmentAtTime(audioAnalysis.segments, time);
      
      cutPoints.push({
        time,
        onBeat: false,
        inSegment: segment,
        importance: 0.5, // Medium importance
        energy: 0.5 // Medium energy
      });
    }
  }
  
  /**
   * Add cuts at energy change points
   */
  private addEnergyChangeCuts(
    audioAnalysis: AudioAnalysis, 
    cutPoints: EditPoint[], 
    threshold: number
  ) {
    if (!audioAnalysis.energyPoints || audioAnalysis.energyPoints.length === 0) {
      return;
    }
    
    const energyPoints = audioAnalysis.energyPoints;
    
    for (let i = 1; i < energyPoints.length; i++) {
      const prevPoint = energyPoints[i - 1];
      const currentPoint = energyPoints[i];
      
      const energyChange = Math.abs(currentPoint.energy - prevPoint.energy);
      
      if (energyChange >= threshold) {
        // Skip if too close to an existing cut point
        if (this.isTooCloseToExistingCut(currentPoint.time, cutPoints)) {
          continue;
        }
        
        // Find segment at this time
        const segment = this.findSegmentAtTime(audioAnalysis.segments, currentPoint.time);
        
        // Find nearby beat (if any)
        const nearbyBeat = this.findNearbyBeat(audioAnalysis.beats, currentPoint.time, 0.1);
        
        cutPoints.push({
          time: nearbyBeat ? nearbyBeat.time : currentPoint.time,
          onBeat: !!nearbyBeat,
          inSegment: segment,
          importance: 0.6,
          energy: currentPoint.energy
        });
      }
    }
  }
  
  /**
   * Add cuts on beats within a segment
   */
  private addBeatsWithinSegment(
    audioAnalysis: AudioAnalysis, 
    segment: AudioSegment, 
    cutPoints: EditPoint[]
  ) {
    if (!audioAnalysis.beats || audioAnalysis.beats.length === 0) {
      return;
    }
    
    const beats = audioAnalysis.beats;
    const beatGroupSize = this.determineBeatGroupSize(audioAnalysis.tempo);
    
    // Find beats within this segment
    const segmentBeats = beats.filter(beat => 
      beat.time >= segment.startTime && beat.time < segment.endTime
    );
    
    // Add cuts on some beats (not all, to avoid too many cuts)
    for (let i = 0; i < segmentBeats.length; i++) {
      if (i % (beatGroupSize * 2) === 0) { // Every two measures
        const beat = segmentBeats[i];
        
        // Skip if too close to an existing cut point
        if (this.isTooCloseToExistingCut(beat.time, cutPoints)) {
          continue;
        }
        
        cutPoints.push({
          time: beat.time,
          onBeat: true,
          inSegment: segment,
          importance: 0.6,
          energy: beat.energy
        });
      }
    }
  }
  
  /**
   * Add some cuts on beats
   */
  private addSomeBeatCuts(
    audioAnalysis: AudioAnalysis, 
    cutPoints: EditPoint[], 
    probability: number
  ) {
    if (!audioAnalysis.beats || audioAnalysis.beats.length === 0) {
      return;
    }
    
    const beats = audioAnalysis.beats;
    const beatGroupSize = this.determineBeatGroupSize(audioAnalysis.tempo);
    
    for (let i = 0; i < beats.length; i++) {
      if (i % beatGroupSize === 0 && Math.random() < probability) {
        const beat = beats[i];
        
        // Skip if too close to an existing cut point
        if (this.isTooCloseToExistingCut(beat.time, cutPoints)) {
          continue;
        }
        
        // Find segment at this time
        const segment = this.findSegmentAtTime(audioAnalysis.segments, beat.time);
        
        cutPoints.push({
          time: beat.time,
          onBeat: true,
          inSegment: segment,
          importance: 0.7,
          energy: beat.energy
        });
      }
    }
  }
  
  /**
   * Determine beat group size based on tempo (time signature estimation)
   */
  private determineBeatGroupSize(tempo: number): number {
    // Simple heuristic for beat grouping based on tempo
    // Typically 4 beats per measure (4/4 time), but could adjust for other time signatures
    if (tempo <= 90) return 3; // Might be 3/4 time for slower tempos
    return 4; // 4/4 time (most common)
  }
  
  /**
   * Check if a time is too close to any existing cut point
   */
  private isTooCloseToExistingCut(time: number, cutPoints: EditPoint[]): boolean {
    const minDistance = 0.5; // Minimum distance in seconds between cuts
    
    return cutPoints.some(cut => Math.abs(cut.time - time) < minDistance);
  }
  
  /**
   * Find the segment at a specific time
   */
  private findSegmentAtTime(segments: AudioSegment[] | undefined, time: number): AudioSegment | null {
    if (!segments || segments.length === 0) {
      return null;
    }
    
    return segments.find(segment => 
      time >= segment.startTime && time < segment.endTime
    ) || null;
  }
  
  /**
   * Find a beat near a specific time
   */
  private findNearbyBeat(beats: Beat[] | undefined, time: number, tolerance: number): Beat | null {
    if (!beats || beats.length === 0) {
      return null;
    }
    
    return beats.find(beat => Math.abs(beat.time - time) < tolerance) || null;
  }
  
  /**
   * Find the best clip for a cut point
   * @param cutPoint The cut point to assign a clip to
   * @param videoPool Available video analyses
   * @param duration Desired clip duration
   * @returns Promise resolving to a video clip assignment
   */
  async findBestClip(
    cutPoint: EditPoint,
    videoPool: { analysis: VideoAnalysis, videoId: string }[],
    duration: number
  ): Promise<VideoClipAssignment> {
    // No videos available
    if (!videoPool.length) {
      throw new Error('No videos available to assign to cut point');
    }
    
    // Calculate scores for each possible clip
    const candidates: Array<VideoClipAssignment & { score: number }> = [];
    
    for (const { analysis, videoId } of videoPool) {
      // Check each scene in this video
      for (const scene of analysis.scenes) {
        // Skip scenes that are too short
        if (scene.duration < duration) {
          continue;
        }
        
        // Calculate a score for this scene
        let score = 0;
        
        // Factors that affect the score:
        
        // 1. Matching energy level
        const sceneIndex = analysis.scenes.indexOf(scene);
        const contentAnalysis = analysis.contentAnalysis[sceneIndex];
        const sceneEnergy = analysis.motionData.motionByFrame.find(
          mf => mf.time >= scene.startTime && mf.time < scene.endTime
        )?.motionAmount || 0;
        
        // Normalize scene energy to 0-1 range
        const normalizedSceneEnergy = Math.min(sceneEnergy / 10, 1);
        
        // Energy match score - closer values get higher scores
        const energyMatchScore = 1 - Math.abs(cutPoint.energy - normalizedSceneEnergy);
        score += energyMatchScore * 2; // Energy is important, so double weight
        
        // 2. Content type matching
        if (cutPoint.inSegment) {
          // Different content types work better for different segment types
          if (cutPoint.inSegment.type === 'chorus' && analysis.clipType === ClipType.PERFORMANCE) {
            score += 2; // Performance clips work well for chorus sections
          } else if (cutPoint.inSegment.type === 'verse' && analysis.clipType === ClipType.B_ROLL_STATIC) {
            score += 1.5; // Static b-roll works well for verses
          } else if (cutPoint.inSegment.type === 'bridge' && analysis.clipType === ClipType.B_ROLL_DYNAMIC) {
            score += 1.5; // Dynamic b-roll works well for bridges
          }
        }
        
        // 3. Bonus for action content on high-energy points
        if (cutPoint.energy > 0.7 && analysis.clipType === ClipType.ACTION) {
          score += 1.5;
        }
        
        // 4. Scene length bonus - slightly prefer scenes that are closer to desired duration
        const durationRatio = Math.min(scene.duration / duration, 2);
        score += (1 - Math.abs(1 - durationRatio)) * 0.5;
        
        // 5. Faces presence - prefer faces for important cuts
        if (contentAnalysis.hasFaces && cutPoint.importance > 0.7) {
          score += 1;
        }
        
        // Store candidate with score
        candidates.push({
          videoId,
          sceneId: scene.id,
          clipStartTime: scene.startTime,
          score
        });
      }
    }
    
    // Sort candidates by score (descending)
    candidates.sort((a, b) => b.score - a.score);
    
    // Return the best match, or a random one if no good matches
    if (candidates.length > 0) {
      // Add some randomness to prevent always choosing the same clips
      const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
      const selectedIndex = Math.floor(Math.random() * topCandidates.length);
      
      const { videoId, sceneId, clipStartTime } = topCandidates[selectedIndex];
      return { videoId, sceneId, clipStartTime };
    } else {
      // Fallback: use a random scene from a random video
      const randomVideoIndex = Math.floor(Math.random() * videoPool.length);
      const { analysis, videoId } = videoPool[randomVideoIndex];
      
      // Find any scene that's long enough
      const validScenes = analysis.scenes.filter(scene => scene.duration >= duration);
      
      if (validScenes.length > 0) {
        const randomSceneIndex = Math.floor(Math.random() * validScenes.length);
        const scene = validScenes[randomSceneIndex];
        
        return {
          videoId,
          sceneId: scene.id,
          clipStartTime: scene.startTime
        };
      } else {
        // Last resort: use the longest scene from the random video
        const longestScene = analysis.scenes.reduce(
          (longest, current) => current.duration > longest.duration ? current : longest,
          analysis.scenes[0]
        );
        
        return {
          videoId,
          sceneId: longestScene.id,
          clipStartTime: longestScene.startTime
        };
      }
    }
  }
  
  /**
   * Determine transition type based on cut point and settings
   * @param cutPoint The cut point
   * @param settings Project settings
   * @returns Appropriate transition type
   */
  determineTransition(cutPoint: EditPoint, settings: ProjectSettings): TransitionType {
    // Default to cut for most transitions
    let transition = TransitionType.CUT;
    
    // Different transitions based on edit style
    switch (settings.editStyle) {
      case EditStyle.RHYTHM_MATCH:
        // For rhythm match, use cuts on beats and dissolves elsewhere
        transition = cutPoint.onBeat ? TransitionType.CUT : TransitionType.DISSOLVE;
        break;
        
      case EditStyle.SEGMENT_BASED:
        // For segment-based, use more interesting transitions at segment boundaries
        if (cutPoint.inSegment?.type === 'chorus') {
          transition = cutPoint.importance > 0.8 ? 
            TransitionType.WIPE : TransitionType.DISSOLVE;
        } else if (cutPoint.inSegment?.type === 'bridge') {
          transition = TransitionType.FADE;
        }
        break;
        
      case EditStyle.ENERGY_BASED:
        // For energy-based, use more dramatic transitions for high energy changes
        if (cutPoint.energy > 0.8) {
          transition = Math.random() > 0.5 ? TransitionType.WIPE : TransitionType.ZOOM;
        } else if (cutPoint.energy > 0.6) {
          transition = TransitionType.DISSOLVE;
        }
        break;
        
      case EditStyle.CINEMATIC:
        // For cinematic, use more sophisticated transitions
        if (cutPoint.importance > 0.8) {
          transition = TransitionType.FADE;
        } else if (cutPoint.onBeat && cutPoint.energy > 0.7) {
          transition = TransitionType.WIPE;
        } else if (cutPoint.inSegment?.type === 'chorus') {
          transition = TransitionType.DISSOLVE;
        }
        break;
        
      default:
        // Default style
        if (cutPoint.importance > 0.8) {
          transition = Math.random() > 0.7 ? TransitionType.WIPE : TransitionType.CUT;
        } else if (cutPoint.importance > 0.6) {
          transition = cutPoint.onBeat ? TransitionType.CUT : TransitionType.DISSOLVE;
        }
    }
    
    return transition;
  }
  
  /**
   * Optimize edit decisions for better flow and pacing
   * @param decisions Initial edit decisions
   * @returns Optimized edit decisions
   */
  optimizeEditDecisions(decisions: EditDecision[]): EditDecision[] {
    if (decisions.length <= 1) {
      return [...decisions];
    }
    
    const optimized = [...decisions];
    
    // TODO: Implement more sophisticated optimization logic
    
    // 1. Avoid using the same scene back-to-back
    for (let i = 1; i < optimized.length; i++) {
      const prev = optimized[i - 1];
      const current = optimized[i];
      
      if (current.videoId === prev.videoId && current.sceneId === prev.sceneId) {
        // If we have the same scene twice in a row, try to find an alternative
        // For now, just log this issue
        console.warn('Same scene used back-to-back in edit decisions');
      }
    }
    
    // 2. Balance transition types
    let cutCount = 0;
    let dissolveCount = 0;
    let otherCount = 0;
    
    for (const decision of optimized) {
      if (decision.transitionType === TransitionType.CUT) {
        cutCount++;
      } else if (decision.transitionType === TransitionType.DISSOLVE) {
        dissolveCount++;
      } else {
        otherCount++;
      }
    }
    
    // If there are too many dissolves, convert some to cuts
    if (dissolveCount > optimized.length * 0.5) {
      for (let i = 0; i < optimized.length; i++) {
        if (optimized[i].transitionType === TransitionType.DISSOLVE && optimized[i].onBeat) {
          optimized[i].transitionType = TransitionType.CUT;
          dissolveCount--;
          cutCount++;
          
          if (dissolveCount <= optimized.length * 0.3) {
            break;
          }
        }
      }
    }
    
    // 3. Ensure consistent pacing
    // Calculate average clip duration
    const totalDuration = optimized.reduce((sum, decision) => sum + decision.duration, 0);
    const avgDuration = totalDuration / optimized.length;
    
    // Adjust clip durations that are very different from the average
    for (let i = 0; i < optimized.length - 1; i++) {
      const current = optimized[i];
      
      // Skip very high importance clips (these can be longer or shorter)
      if (current.importance > 0.8) {
        continue;
      }
      
      // If this clip is much longer than average, adjust the next clip's start time
      if (current.duration > avgDuration * 1.5) {
        const originalDuration = current.duration;
        const newDuration = avgDuration * 1.2; // Still longer than average
        
        // Update this clip's duration
        optimized[i].duration = newDuration;
        
        // Update next clip's start time
        if (i + 1 < optimized.length) {
          const durationDiff = originalDuration - newDuration;
          optimized[i + 1].startTime -= durationDiff;
          
          // Ensure it doesn't go before the current clip's start
          optimized[i + 1].startTime = Math.max(
            optimized[i + 1].startTime,
            optimized[i].startTime + 0.5 // Minimum 0.5s duration
          );
        }
      }
    }
    
    return optimized;
  }
  
  /**
   * Regenerates edit decisions with a new style
   * @param decisions Original edit decisions
   * @param newStyle New edit style to apply
   * @returns Updated edit decisions
   */
  regenerateWithStyle(decisions: EditDecision[], newStyle: EditStyle): EditDecision[] {
    // Create a copy of the decisions
    const updated = [...decisions];
    
    // Update transitions based on the new style
    for (const decision of updated) {
      // Create a simple cut point from the decision
      const cutPoint: EditPoint = {
        time: decision.startTime,
        onBeat: decision.beat,
        inSegment: decision.segment ? {
          id: 'temp-id',
          type: decision.segment,
          startTime: decision.startTime - 1,
          endTime: decision.startTime + decision.duration + 1
        } : null,
        importance: decision.importance,
        energy: decision.energy
      };
      
      // Determine new transition based on the style
      decision.transitionType = this.determineTransition(cutPoint, { editStyle: newStyle } as ProjectSettings);
    }
    
    // Optimize the updated decisions
    return this.optimizeEditDecisions(updated);
  }
  
  /**
   * Applies a manual edit to a decision
   * @param decisions Original edit decisions
   * @param editIndex Index of the decision to edit
   * @param newSettings New settings for the decision
   * @returns Updated edit decisions
   */
  applyManualEdit(
    decisions: EditDecision[],
    editIndex: number,
    newSettings: Partial<EditDecision>
  ): EditDecision[] {
    if (editIndex < 0 || editIndex >= decisions.length) {
      throw new Error('Invalid edit index');
    }
    
    // Create a copy of the decisions
    const updated = [...decisions];
    
    // Apply the changes to the specified decision
    updated[editIndex] = {
      ...updated[editIndex],
      ...newSettings
    };
    
    // If duration changed, update the next decision's start time
    if (
      newSettings.duration !== undefined && 
      editIndex < updated.length - 1 &&
      updated[editIndex].startTime + updated[editIndex].duration !== updated[editIndex + 1].startTime
    ) {
      updated[editIndex + 1].startTime = updated[editIndex].startTime + updated[editIndex].duration;
    }
    
    return updated;
  }
  
  /**
   * Generates timeline markers from edit decisions
   * @param decisions Edit decisions to convert to markers
   * @returns Array of timeline markers
   */
  generateTimelineMarkers(decisions: EditDecision[]): TimelineMarker[] {
    const markers: TimelineMarker[] = [];
    
    decisions.forEach((decision, index) => {
      // Cut point marker
      markers.push({
        id: `cut-${decision.id}`,
        type: MarkerType.EDIT_POINT,
        time: decision.startTime,
        label: `Cut ${index + 1}`,
        color: decision.onBeat ? '#f1c0e8' : '#ffbe0b',
        data: { decision, index }
      });
      
      // Transition marker (if not a simple cut)
      if (decision.transitionType !== TransitionType.CUT) {
        markers.push({
          id: `transition-${decision.id}`,
          type: MarkerType.TRANSITION,
          time: decision.startTime,
          label: decision.transitionType,
          color: '#1982c4',
          data: { decision, index }
        });
      }
    });
    
    return markers;
  }
  
  /**
   * Disposes of resources and clears caches
   */
  dispose(): void {
    this.editCache.clear();
    this.eventListeners.clear();
  }
  
  /**
   * Adds an event listener for EditDecisionEngine events
   * @param event The event to listen for
   * @param callback Callback function to execute when event occurs
   */
  addEventListener(event: EditDecisionEngineEvents, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }
  
  /**
   * Removes an event listener
   * @param event The event the listener was registered for
   * @param callback The callback function to remove
   */
  removeEventListener(event: EditDecisionEngineEvents, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    const filteredListeners = listeners.filter(listener => listener !== callback);
    this.eventListeners.set(event, filteredListeners);
  }
  
  /**
   * Emits an event to all registered listeners
   * @param event The event to emit
   * @param data Data to pass to listeners
   */
  private emitEvent(event: EditDecisionEngineEvents, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

// Export singleton instance
const editDecisionEngine = new EditDecisionEngine();
export default editDecisionEngine;
