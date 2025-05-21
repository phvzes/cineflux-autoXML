// src/engine/EditDecisionEngine.ts
import { 
  AudioAnalysis, 
  Beat, 
  BeatAnalysis, 
  EnergyAnalysis, 
  EnergySample 
} from '../types/AudioAnalysis';
import { 
  Scene, 
  VideoAnalysisResult, 
  SceneType 
} from '../types/VideoAnalysis';
import {
  EditDecisionList,
  createEmptyEDL,
  MatchedClip,
  Transition,
  TransitionType,
  TrackType,
  TimelineCutPoint,
  MarkerType
} from '../types/EditDecision';

/**
 * Configuration options for the EditDecisionEngine
 */
export interface EditDecisionEngineConfig {
  /** Percentage of beats to use for cuts (0-100) */
  beatCutPercentage?: number;
  /** Minimum scene duration in seconds */
  minSceneDuration?: number;
  /** Maximum scene duration in seconds */
  maxSceneDuration?: number;
  /** Whether to prioritize scene boundaries over exact beat timing */
  prioritizeSceneBoundaries?: boolean;
  /** Energy threshold for determining transition types (0-1) */
  energyThreshold?: {
    low: number;
    medium: number;
    high: number;
  };
  /** Framerate for the output sequence */
  framerate?: number;
}

/**
 * Result of the edit decision generation process
 */
export interface EditDecisionResult {
  /** The generated Edit Decision List */
  edl: EditDecisionList;
  /** Timeline of cuts with beat and scene information */
  timeline: {
    time: number;
    type: 'beat' | 'scene' | 'cut';
    sourceId?: string;
    energy?: number;
  }[];
  /** Statistics about the generated edit */
  stats: {
    totalCuts: number;
    averageSceneDuration: number;
    transitionTypes: Record<TransitionType, number>;
    beatAlignmentScore: number;
  };
}

/**
 * Engine for generating intelligent edit decisions by connecting audio and video analysis
 */
export class EditDecisionEngine {
  private config: EditDecisionEngineConfig;
  private beatMap: Beat[] = [];
  private scenes: Map<string, Scene[]> = new Map();
  private energyProfile: EnergySample[] = [];
  private videoMetadata: Map<string, any> = new Map();
  private framerate: number = 30;

  /**
   * Create a new EditDecisionEngine
   * @param config Configuration options
   */
  constructor(config: EditDecisionEngineConfig = {}) {
    this.config = {
      beatCutPercentage: 50,
      minSceneDuration: 1.0,
      maxSceneDuration: 5.0,
      prioritizeSceneBoundaries: true,
      energyThreshold: {
        low: 0.3,
        medium: 0.6,
        high: 0.8
      },
      framerate: 30,
      ...config
    };
    
    this.framerate = this.config.framerate || 30;
  }

  /**
   * Set the audio analysis data
   * @param audioAnalysis The audio analysis data
   */
  setAudioAnalysis(audioAnalysis: AudioAnalysis): void {
    if (!audioAnalysis || !audioAnalysis.beats || !audioAnalysis.beats.beats) {
      throw new Error('Invalid audio analysis data');
    }
    
    this.beatMap = audioAnalysis.beats.beats;
    this.energyProfile = audioAnalysis.energy.samples;
  }

  /**
   * Add video analysis data for a specific video
   * @param videoId Identifier for the video
   * @param videoAnalysis The video analysis data
   */
  addVideoAnalysis(videoId: string, videoAnalysis: VideoAnalysisResult): void {
    if (!videoAnalysis || !videoAnalysis.sceneDetection || !videoAnalysis.sceneDetection.scenes) {
      throw new Error('Invalid video analysis data');
    }
    
    // Convert milliseconds to seconds for scene times
    const scenes = videoAnalysis.sceneDetection.scenes.map((scene: any) => ({
      ...scene,
      startTime: scene.startTime / 1000,
      endTime: scene.endTime / 1000,
      duration: scene.duration / 1000
    }));
    
    this.scenes.set(videoId, scenes);
    
    // Store video metadata
    this.videoMetadata.set(videoId, {
      duration: videoAnalysis.clipMetadata.duration / 1000, // Convert to seconds
      width: videoAnalysis.clipMetadata.width,
      height: videoAnalysis.clipMetadata.height,
      frameRate: videoAnalysis.clipMetadata.frameRate,
      name: videoAnalysis.clipMetadata.title || videoId
    });
  }

  /**
   * Generate a cut timeline based on audio beats and video scenes
   * @returns Array of cut points with timestamps
   */
  generateCutTimeline(): { time: number; type: string; sourceId?: string }[] {
    if (this.beatMap.length === 0 || this.scenes.size === 0) {
      throw new Error('Audio beats and video scenes must be set before generating cuts');
    }
    
    const timeline: { time: number; type: string; sourceId?: string }[] = [];
    
    // Add all beats to the timeline
    this.beatMap.forEach((beat: any) => {
      timeline.push({
        time: beat.time,
        type: 'beat'
      });
    });
    
    // Add all scene boundaries to the timeline
    this.scenes.forEach((scenes: any, videoId: any) => {
      scenes.forEach((scene: any) => {
        timeline.push({
          time: scene.startTime,
          type: 'scene',
          sourceId: videoId
        });
        
        timeline.push({
          time: scene.endTime,
          type: 'scene',
          sourceId: videoId
        });
      });
    });
    
    // Sort the timeline by time
    timeline.sort((a: any, b: any) => a.time - b.time);
    
    return timeline;
  }

  /**
   * Find the nearest scene boundary to a given time
   * @param time The time to find the nearest scene boundary for
   * @param videoId The video ID to search in
   * @param maxDistance Maximum allowed distance in seconds
   * @returns The nearest scene boundary time or null if none found within maxDistance
   */
  private findNearestSceneBoundary(
    time: number, 
    videoId: string, 
    maxDistance: number = 1.0
  ): { time: number; type: 'start' | 'end' } | null {
    const scenes = this.scenes.get(videoId);
    if (!scenes) return null;
    
    let nearestBoundary: { time: number; type: 'start' | 'end'; distance: number } | null = null;
    
    for (const scene of scenes) {
      // Check start boundary
      const startDistance = Math.abs(scene.startTime - time);
      if (startDistance <= maxDistance && (!nearestBoundary || startDistance < nearestBoundary.distance)) {
        nearestBoundary = {
          time: scene.startTime,
          type: 'start',
          distance: startDistance
        };
      }
      
      // Check end boundary
      const endDistance = Math.abs(scene.endTime - time);
      if (endDistance <= maxDistance && (!nearestBoundary || endDistance < nearestBoundary.distance)) {
        nearestBoundary = {
          time: scene.endTime,
          type: 'end',
          distance: endDistance
        };
      }
    }
    
    return nearestBoundary ? { time: nearestBoundary.time, type: nearestBoundary.type } : null;
  }

  /**
   * Find the energy level at a specific time
   * @param time The time to find the energy level for
   * @returns Energy level (0-1) or 0.5 if not found
   */
  private getEnergyAtTime(time: number): number {
    if (this.energyProfile.length === 0) return 0.5;
    
    // Find the nearest energy sample
    let nearestSample: EnergySample | null = null;
    let minDistance = Infinity;
    
    for (const sample of this.energyProfile) {
      const distance = Math.abs(sample.time - time);
      if (distance < minDistance) {
        minDistance = distance;
        nearestSample = sample;
      }
    }
    
    return nearestSample ? nearestSample.level : 0.5;
  }

  /**
   * Select the best scene for a given time range
   * @param startTime Start time in seconds
   * @param endTime End time in seconds
   * @returns The best matching scene and video ID
   */
  selectBestScene(
    startTime: number, 
    endTime: number
  ): { scene: Scene; videoId: string } | null {
    if (this.scenes.size === 0) return null;
    
    const duration = endTime - startTime;
    const candidates: { scene: Scene; videoId: string; score: number }[] = [];
    
    // Find candidate scenes from all videos
    this.scenes.forEach((scenes: any, videoId: any) => {
      for (const scene of scenes) {
        // Check if scene duration is appropriate
        if (scene.duration / 1000 < duration * 0.8) continue; // Scene is too short
        
        // Calculate a score for this scene
        let score = 1.0;
        
        // Prefer scenes that are not much longer than needed
        const durationRatio = scene.duration / 1000 / duration;
        if (durationRatio > 1.5) {
          score *= 0.8; // Penalize scenes that are much longer
        }
        
        // Prefer scenes with higher confidence
        score *= scene.boundaryConfidence;
        
        // Prefer certain scene types based on energy
        const energyAtTime = this.getEnergyAtTime(startTime);
        if (energyAtTime > 0.7 && scene.sceneTypes.includes(SceneType.ACTION)) {
          score *= 1.5; // Boost action scenes for high energy
        } else if (energyAtTime < 0.3 && scene.sceneTypes.includes(SceneType.INTERIOR)) {
          score *= 1.3; // Boost interior scenes for low energy
        }
        
        candidates.push({ scene, videoId, score });
      }
    });
    
    // Sort candidates by score
    candidates.sort((a: any, b: any) => b.score - a.score);
    
    // Return the best candidate
    return candidates.length > 0 ? { scene: candidates[0].scene, videoId: candidates[0].videoId } : null;
  }

  /**
   * Determine the appropriate transition type based on energy level
   * @param energy Energy level (0-1)
   * @returns The selected transition type
   */
  selectTransitionType(energy: number): TransitionType {
    const { energyThreshold } = this.config;
    
    if (energy >= energyThreshold!.high) {
      // High energy transitions
      const highEnergyTransitions = [
        TransitionType.CUT,
        TransitionType.WIPE
      ];
      return highEnergyTransitions[Math.floor(Math.random() * highEnergyTransitions.length)];
    } else if (energy >= energyThreshold!.medium) {
      // Medium energy transitions
      const mediumEnergyTransitions = [
        TransitionType.CUT,
        TransitionType.DISSOLVE
      ];
      return mediumEnergyTransitions[Math.floor(Math.random() * mediumEnergyTransitions.length)];
    } else {
      // Low energy transitions
      const lowEnergyTransitions = [
        TransitionType.DISSOLVE,
        TransitionType.FADE_IN,
        TransitionType.FADE_OUT
      ];
      return lowEnergyTransitions[Math.floor(Math.random() * lowEnergyTransitions.length)];
    }
  }

  /**
   * Generate an Edit Decision List based on the current audio and video analyses
   * @returns The generated Edit Decision List and related information
   */
  generateEditDecisions(): EditDecisionResult {
    if (this.beatMap.length === 0 || this.scenes.size === 0) {
      throw new Error('Audio beats and video scenes must be set before generating edit decisions');
    }
    
    // Create an empty EDL
    const edl = createEmptyEDL('Auto-Generated Edit', this.framerate);
    
    // Generate a timeline of potential cut points
    const rawTimeline = this.generateCutTimeline();
    
    // Filter beats based on beatCutPercentage
    const beatsToUse = Math.ceil(this.beatMap.length * (this.config.beatCutPercentage! / 100));
    const selectedBeats = this.beatMap
      .sort((a: any, b: any) => b.confidence - a.confidence) // Sort by confidence
      .slice(0, beatsToUse); // Take the top beats
    
    // Create a set of selected beat times for quick lookup
    const selectedBeatTimes = new Set(selectedBeats.map((beat: any) => beat.time));
    
    // Filter the timeline to include only selected beats and scene boundaries
    const filteredTimeline = rawTimeline.filter((point: any) => {
      if (point.type === 'beat') {
        return selectedBeatTimes.has(point.time);
      }
      return point.type === 'scene';
    });
    
    // Generate cuts by aligning beats with scene boundaries
    const cuts: { 
      time: number; 
      type: 'cut'; 
      sourceId?: string; 
      sceneStart?: number;
      energy: number;
    }[] = [];
    
    let _currentTime = 0;
    let lastCutTime = 0;
    
    // Process each potential cut point
    for (let i = 0; i < filteredTimeline.length; i++) {
      const point = filteredTimeline[i];
      
      // Skip points that are too close to the last cut
      if (point.time - lastCutTime < this.config.minSceneDuration!) {
        continue;
      }
      
      // Skip points that are beyond the maximum scene duration
      if (point.time - lastCutTime > this.config.maxSceneDuration!) {
        // Force a cut at the maximum duration
        const forcedCutTime = lastCutTime + this.config.maxSceneDuration!;
        
        // Find the best video and scene for this cut
        const bestScene = this.selectBestScene(lastCutTime, forcedCutTime);
        
        if (bestScene) {
          cuts.push({
            time: forcedCutTime,
            type: 'cut',
            sourceId: bestScene.videoId,
            sceneStart: bestScene.scene.startTime,
            energy: this.getEnergyAtTime(forcedCutTime)
          });
          
          lastCutTime = forcedCutTime;
          continue;
        }
      }
      
      // If this is a beat, check if we should cut here
      if (point.type === 'beat') {
        // If prioritizing scene boundaries, look for a nearby scene boundary
        if (this.config.prioritizeSceneBoundaries) {
          let foundSceneBoundary = false;
          
          // Check each video for a nearby scene boundary
          for (const [videoId, _] of this.scenes) {
            const nearestBoundary = this.findNearestSceneBoundary(
              point.time, 
              videoId, 
              0.5 // Look within 0.5 seconds
            );
            
            if (nearestBoundary) {
              // Use the scene boundary instead of the exact beat time
              const bestScene = this.selectBestScene(lastCutTime, nearestBoundary.time);
              
              if (bestScene) {
                cuts.push({
                  time: nearestBoundary.time,
                  type: 'cut',
                  sourceId: bestScene.videoId,
                  sceneStart: bestScene.scene.startTime,
                  energy: this.getEnergyAtTime(nearestBoundary.time)
                });
                
                lastCutTime = nearestBoundary.time;
                foundSceneBoundary = true;
                break;
              }
            }
          }
          
          if (foundSceneBoundary) {
            continue;
          }
        }
        
        // If we didn't find a scene boundary or aren't prioritizing them,
        // use the beat time directly
        const bestScene = this.selectBestScene(lastCutTime, point.time);
        
        if (bestScene) {
          cuts.push({
            time: point.time,
            type: 'cut',
            sourceId: bestScene.videoId,
            sceneStart: bestScene.scene.startTime,
            energy: this.getEnergyAtTime(point.time)
          });
          
          lastCutTime = point.time;
        }
      }
    }
    
    // Create matched clips for each cut
    const clips: MatchedClip[] = [];
    const transitions: Transition[] = [];
    
    for (let i = 0; i < cuts.length; i++) {
      const cut = cuts[i];
      const nextCut = cuts[i + 1];
      
      if (!cut.sourceId || !cut.sceneStart) continue;
      
      // Calculate clip duration
      const clipDuration = nextCut ? nextCut.time - cut.time : 5.0; // Default to 5 seconds for the last clip
      
      // Create a matched clip
      const clipId = `clip_${i}`;
      clips.push({
        id: clipId,
        sourceId: cut.sourceId,
        trackType: TrackType.VIDEO,
        trackNumber: 1,
        timelineInPoint: cut.time,
        timelineOutPoint: cut.time + clipDuration,
        sourceInPoint: cut.sceneStart,
        sourceOutPoint: cut.sceneStart + clipDuration,
        enabled: true,
        rating: 1.0
      });
      
      // Add a transition if this isn't the first clip
      if (i > 0) {
        const energy = cut.energy;
        const transitionType = this.selectTransitionType(energy);
        
        // Only add non-cut transitions
        if (transitionType !== TransitionType.CUT) {
          const prevClipId = `clip_${i - 1}`;
          
          transitions.push({
            id: `transition_${i}`,
            type: transitionType,
            duration: transitionType === TransitionType.DISSOLVE ? 0.5 : 0.25, // Longer dissolves
            outgoingClipId: prevClipId,
            incomingClipId: clipId,
            centerPoint: cut.time
          });
        }
      }
    }
    
    // Add clips and transitions to the EDL
    edl.clips = clips;
    edl.transitions = transitions;
    
    // Add cut points to the EDL
    const cutPoints: TimelineCutPoint[] = [];
    
    cuts.forEach((cut: any, index: any) => {
      cutPoints.push({
        id: `cut_${index}`,
        type: MarkerType.MARKER,
        position: cut.time,
        label: `Cut ${index + 1}`,
        confidence: 0.8
      });
    });
    
    edl.cutPoints = cutPoints;
    
    // Calculate statistics
    const stats = {
      totalCuts: cuts.length,
      averageSceneDuration: cuts.length > 1 
        ? (cuts[cuts.length - 1].time - cuts[0].time) / (cuts.length - 1) 
        : 0,
      transitionTypes: transitions.reduce((acc: any, transition: any) => {
        acc[transition.type] = (acc[transition.type] || 0) + 1;
        return acc;
      }, {} as Record<TransitionType, number>),
      beatAlignmentScore: this.calculateBeatAlignmentScore(cuts)
    };
    
    // Create the final timeline for visualization
    const timeline = [
      ...this.beatMap.map((beat: any) => ({ time: beat.time, type: 'beat' as const })),
      ...cuts.map((cut: any) => ({ 
        time: cut.time, 
        type: 'cut' as const, 
        sourceId: cut.sourceId,
        energy: cut.energy
      }))
    ].sort((a: any, b: any) => a.time - b.time);
    
    return {
      edl,
      timeline,
      stats
    };
  }

  /**
   * Calculate a score representing how well cuts align with beats
   * @param cuts Array of cut points
   * @returns Alignment score (0-1)
   */
  private calculateBeatAlignmentScore(cuts: { time: number }[]): number {
    if (cuts.length === 0 || this.beatMap.length === 0) return 0;
    
    let totalAlignment = 0;
    
    for (const cut of cuts) {
      // Find the nearest beat
      let minDistance = Infinity;
      
      for (const beat of this.beatMap) {
        // Ensure both values are numbers before arithmetic operations
        const beatTime = typeof beat.time === 'number' ? beat.time : 0;
        const cutTime = typeof cut.time === 'number' ? cut.time : 0;
        
        const distance = Math.abs(beatTime - cutTime);
        minDistance = Math.min(minDistance, distance);
      }
      
      // Convert distance to a score (closer = higher score)
      // Maximum distance we care about is 1 second
      const alignmentScore = Math.max(0, 1 - minDistance);
      totalAlignment += alignmentScore;
    }
    
    // Average the alignment scores
    return totalAlignment / cuts.length;
  }

  /**
   * Generate a preview of the edit decisions
   * @returns HTML string with the preview
   */
  generatePreview(): string {
    const result = this.generateEditDecisions();
    const { edl, timeline, stats } = result;
    
    // Generate a simple HTML preview
    let html = `
      <div class="edit-preview">
        <h2>Edit Preview</h2>
        <div class="stats">
          <p>Total Cuts: ${stats.totalCuts}</p>
          <p>Average Scene Duration: ${stats.averageSceneDuration.toFixed(2)}s</p>
          <p>Beat Alignment Score: ${(stats.beatAlignmentScore * 100).toFixed(1)}%</p>
        </div>
        <div class="timeline">
    `;
    
    // Add timeline visualization
    const timelineWidth = 800;
    const duration = timeline.length > 0 ? timeline[timeline.length - 1].time : 60;
    
    timeline.forEach((point: any) => {
      const position = (point.time / duration) * timelineWidth;
      const type = point.type;
      
      html += `
        <div class="timeline-point ${type}" style="left: ${position}px">
          <div class="marker"></div>
          <div class="tooltip">${type} at ${point.time.toFixed(2)}s</div>
        </div>
      `;
    });
    
    html += `
        </div>
        <div class="clips">
    `;
    
    // Add clip visualization
    edl.clips.forEach((clip: any, index: any) => {
      const width = ((clip.timelineOutPoint - clip.timelineInPoint) / duration) * timelineWidth;
      const position = (clip.timelineInPoint / duration) * timelineWidth;
      
      html += `
        <div class="clip" style="left: ${position}px; width: ${width}px">
          <div class="clip-label">Clip ${index + 1}</div>
          <div class="clip-source">${clip.sourceId}</div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  }
}

// Export a singleton instance
export const editDecisionEngine = new EditDecisionEngine();

export default editDecisionEngine;
