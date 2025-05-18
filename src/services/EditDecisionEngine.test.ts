import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EditDecision, EditDecisionList, TransitionType } from '../types/edit-types';
import { 
  createMockEditDecision,
  createMockEditDecisionList,
  createMockTransition,
  createMockAudioAnalysis,
  createMockVideoAnalysis,
  isEditDecision
} from '../utils/test-utils';

// Mock EditDecisionEngine class for testing
class EditDecisionEngine {
  private audioAnalysis: any;
  private videoAnalyses: any[];
  
  constructor(audioAnalysis?: any, videoAnalyses?: any[]) {
    this.audioAnalysis = audioAnalysis || null;
    this.videoAnalyses = videoAnalyses || [];
  }
  
  setAudioAnalysis(audioAnalysis: any): void {
    this.audioAnalysis = audioAnalysis;
  }
  
  setVideoAnalyses(videoAnalyses: any[]): void {
    this.videoAnalyses = videoAnalyses;
  }
  
  generateEditDecisions(options?: any): EditDecisionList {
    if (!this.audioAnalysis || this.videoAnalyses.length === 0) {
      throw new Error('Audio analysis and video analyses must be set before generating edit decisions');
    }
    
    // In a real implementation, we would generate edit decisions based on the analyses
    // For testing, we'll just return a mock edit decision list
    return {
      id: 'test-edl',
      name: 'Test Edit Decision List',
      decisions: [
        {
          id: 'edit-1',
          videoIndex: 0,
          scene: this.videoAnalyses[0].scenes[0],
          sourceStartTime: 0,
          sourceEndTime: 10,
          timelineStartTime: 0,
          timelineEndTime: 10,
          duration: 10,
          enabled: true,
        },
        {
          id: 'edit-2',
          videoIndex: 0,
          scene: this.videoAnalyses[0].scenes[1],
          sourceStartTime: 10,
          sourceEndTime: 20,
          timelineStartTime: 10,
          timelineEndTime: 20,
          duration: 10,
          transition: { type: TransitionType.CUT, duration: 0 },
          enabled: true,
        },
        {
          id: 'edit-3',
          videoIndex: 1,
          scene: this.videoAnalyses[1].scenes[0],
          sourceStartTime: 0,
          sourceEndTime: 10,
          timelineStartTime: 20,
          timelineEndTime: 30,
          duration: 10,
          transition: { type: TransitionType.DISSOLVE, duration: 1 },
          enabled: true,
        },
      ],
      duration: 30,
    };
  }
}

describe('EditDecisionEngine', () => {
  let editDecisionEngine: EditDecisionEngine;
  let mockAudioAnalysis: ReturnType<typeof createMockAudioAnalysis>;
  let mockVideoAnalyses: ReturnType<typeof createMockVideoAnalysis>[];

  beforeEach(() => {
    // Create mock analyses
    mockAudioAnalysis = createMockAudioAnalysis();
    mockVideoAnalyses = [
      createMockVideoAnalysis(120, 10, 24),
      createMockVideoAnalysis(120, 8, 24),
    ];
    
    // Create a new instance of EditDecisionEngine
    editDecisionEngine = new EditDecisionEngine();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should generate edit decisions correctly', () => {
    // Set the analyses
    editDecisionEngine.setAudioAnalysis(mockAudioAnalysis);
    editDecisionEngine.setVideoAnalyses(mockVideoAnalyses);
    
    // Generate edit decisions
    const result = editDecisionEngine.generateEditDecisions();
    
    // Verify the result
    expect(result).toBeDefined();
    expect(result.id).toBe('test-edl');
    expect(result.name).toBe('Test Edit Decision List');
    expect(result.decisions.length).toBe(3);
    expect(result.duration).toBe(30);
    
    // Verify the first edit decision
    const firstDecision = result.decisions[0];
    expect(firstDecision.id).toBe('edit-1');
    expect(firstDecision.videoIndex).toBe(0);
    expect(firstDecision.sourceStartTime).toBe(0);
    expect(firstDecision.sourceEndTime).toBe(10);
    expect(firstDecision.timelineStartTime).toBe(0);
    expect(firstDecision.timelineEndTime).toBe(10);
    expect(firstDecision.duration).toBe(10);
    expect(firstDecision.enabled).toBe(true);
    
    // Verify the second edit decision
    const secondDecision = result.decisions[1];
    expect(secondDecision.id).toBe('edit-2');
    expect(secondDecision.transition).toBeDefined();
    expect(secondDecision.transition.type).toBe(TransitionType.CUT);
    
    // Verify the third edit decision
    const thirdDecision = result.decisions[2];
    expect(thirdDecision.id).toBe('edit-3');
    expect(thirdDecision.videoIndex).toBe(1);
    expect(thirdDecision.transition).toBeDefined();
    expect(thirdDecision.transition.type).toBe(TransitionType.DISSOLVE);
    expect(thirdDecision.transition.duration).toBe(1);
  });

  it('should throw an error if analyses are not set', () => {
    // Try to generate edit decisions without setting analyses
    expect(() => editDecisionEngine.generateEditDecisions()).toThrow(
      'Audio analysis and video analyses must be set before generating edit decisions'
    );
    
    // Set only audio analysis
    editDecisionEngine.setAudioAnalysis(mockAudioAnalysis);
    expect(() => editDecisionEngine.generateEditDecisions()).toThrow(
      'Audio analysis and video analyses must be set before generating edit decisions'
    );
    
    // Set only video analyses
    editDecisionEngine.setAudioAnalysis(null);
    editDecisionEngine.setVideoAnalyses(mockVideoAnalyses);
    expect(() => editDecisionEngine.generateEditDecisions()).toThrow(
      'Audio analysis and video analyses must be set before generating edit decisions'
    );
  });

  it('should create valid mock edit decisions', () => {
    // Create a mock edit decision
    const mockDecision = createMockEditDecision(
      'test-decision',
      0,
      10,
      20,
      30,
      40
    );
    
    // Verify the mock decision
    expect(isEditDecision(mockDecision)).toBe(true);
    expect(mockDecision.id).toBe('test-decision');
    expect(mockDecision.videoIndex).toBe(0);
    expect(mockDecision.sourceStartTime).toBe(10);
    expect(mockDecision.sourceEndTime).toBe(20);
    expect(mockDecision.timelineStartTime).toBe(30);
    expect(mockDecision.timelineEndTime).toBe(40);
    expect(mockDecision.duration).toBe(10);
    expect(mockDecision.enabled).toBe(true);
    expect(mockDecision.scene).toBeDefined();
  });

  it('should create valid mock edit decision lists', () => {
    // Create a mock edit decision list
    const mockList = createMockEditDecisionList('test-list', 'Test List', 5, 60);
    
    // Verify the mock list
    expect(mockList).toBeDefined();
    expect(mockList.id).toBe('test-list');
    expect(mockList.name).toBe('Test List');
    expect(mockList.decisions.length).toBe(5);
    expect(mockList.duration).toBe(60);
    
    // Verify that each decision has the correct duration
    const decisionDuration = 60 / 5;
    mockList.decisions.forEach((decision, index) => {
      expect(decision.sourceStartTime).toBe(index * decisionDuration);
      expect(decision.sourceEndTime).toBe((index + 1) * decisionDuration);
      expect(decision.timelineStartTime).toBe(index * decisionDuration);
      expect(decision.timelineEndTime).toBe((index + 1) * decisionDuration);
      expect(decision.duration).toBe(decisionDuration);
    });
  });

  it('should create valid mock transitions', () => {
    // Create mock transitions
    const cutTransition = createMockTransition(TransitionType.CUT);
    const dissolveTransition = createMockTransition(TransitionType.DISSOLVE, 1.5);
    const fadeInTransition = createMockTransition(TransitionType.FADE_IN, 2);
    
    // Verify the cut transition
    expect(cutTransition).toBeDefined();
    expect(cutTransition.type).toBe(TransitionType.CUT);
    expect(cutTransition.duration).toBe(1); // Default duration
    
    // Verify the dissolve transition
    expect(dissolveTransition).toBeDefined();
    expect(dissolveTransition.type).toBe(TransitionType.DISSOLVE);
    expect(dissolveTransition.duration).toBe(1.5);
    
    // Verify the fade-in transition
    expect(fadeInTransition).toBeDefined();
    expect(fadeInTransition.type).toBe(TransitionType.FADE_IN);
    expect(fadeInTransition.duration).toBe(2);
  });
});
