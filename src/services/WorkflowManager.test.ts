import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkflowStep, WorkflowState, WorkflowOptions } from '../types/workflow-types';
import { 
  createMockWorkflowState,
  createMockWorkflowOptions,
  createMockFile,
  createMockAudioAnalysis,
  createMockVideoAnalysis,
  createMockEditDecisionList,
  isWorkflowState
} from '../utils/test-utils';

// Mock WorkflowManager class for testing
class WorkflowManager {
  private state: WorkflowState;
  private options: WorkflowOptions;
  private mediaFile: File | null;
  private audioAnalysis: any;
  private videoAnalysis: any;
  private editDecisionList: any;
  
  constructor(options?: WorkflowOptions) {
    this.state = {
      currentStep: WorkflowStep.WELCOME,
      inProgress: false,
      isComplete: false,
    };
    this.options = options || {};
    this.mediaFile = null;
    this.audioAnalysis = null;
    this.videoAnalysis = null;
    this.editDecisionList = null;
  }
  
  getState(): WorkflowState {
    return { ...this.state };
  }
  
  setMediaFile(file: File): void {
    this.mediaFile = file;
    this.state.currentStep = WorkflowStep.INPUT;
  }
  
  startAnalysis(): void {
    if (!this.mediaFile) {
      throw new Error('Media file must be set before starting analysis');
    }
    
    this.state.previousStep = this.state.currentStep;
    this.state.currentStep = WorkflowStep.ANALYSIS;
    this.state.inProgress = true;
  }
  
  completeAnalysis(audioAnalysis: any, videoAnalysis: any): void {
    this.audioAnalysis = audioAnalysis;
    this.videoAnalysis = videoAnalysis;
    
    this.state.previousStep = this.state.currentStep;
    this.state.currentStep = WorkflowStep.EDITING;
    this.state.inProgress = false;
  }
  
  startEditing(): void {
    if (!this.audioAnalysis || !this.videoAnalysis) {
      throw new Error('Analysis results must be available before starting editing');
    }
    
    this.state.previousStep = this.state.currentStep;
    this.state.currentStep = WorkflowStep.EDITING;
    this.state.inProgress = true;
  }
  
  completeEditing(editDecisionList: any): void {
    this.editDecisionList = editDecisionList;
    
    this.state.previousStep = this.state.currentStep;
    this.state.currentStep = WorkflowStep.PREVIEW;
    this.state.inProgress = false;
  }
  
  startExport(): void {
    if (!this.editDecisionList) {
      throw new Error('Edit decision list must be available before starting export');
    }
    
    this.state.previousStep = this.state.currentStep;
    this.state.currentStep = WorkflowStep.EXPORT;
    this.state.inProgress = true;
  }
  
  completeExport(): void {
    this.state.previousStep = this.state.currentStep;
    this.state.inProgress = false;
    this.state.isComplete = true;
  }
  
  reset(): void {
    this.state = {
      currentStep: WorkflowStep.WELCOME,
      inProgress: false,
      isComplete: false,
    };
    this.mediaFile = null;
    this.audioAnalysis = null;
    this.videoAnalysis = null;
    this.editDecisionList = null;
  }
}

describe('WorkflowManager', () => {
  let workflowManager: WorkflowManager;
  let mockOptions: WorkflowOptions;
  let mockFile: ReturnType<typeof createMockFile>;
  let mockAudioAnalysis: ReturnType<typeof createMockAudioAnalysis>;
  let mockVideoAnalysis: ReturnType<typeof createMockVideoAnalysis>;
  let mockEditDecisionList: ReturnType<typeof createMockEditDecisionList>;

  beforeEach(() => {
    // Create mock data
    mockOptions = createMockWorkflowOptions(true, [WorkflowStep.WELCOME]);
    mockFile = createMockFile('test-media.mp4', 'video/mp4');
    mockAudioAnalysis = createMockAudioAnalysis();
    mockVideoAnalysis = createMockVideoAnalysis();
    mockEditDecisionList = createMockEditDecisionList('test-edl', 'Test EDL');
    
    // Create a new instance of WorkflowManager
    workflowManager = new WorkflowManager(mockOptions);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with the correct state', () => {
    // Verify the initial state
    const state = workflowManager.getState();
    expect(state.currentStep).toBe(WorkflowStep.WELCOME);
    expect(state.inProgress).toBe(false);
    expect(state.isComplete).toBe(false);
  });

  it('should update state when setting media file', () => {
    // Set the media file
    workflowManager.setMediaFile(mockFile);
    
    // Verify the state
    const state = workflowManager.getState();
    expect(state.currentStep).toBe(WorkflowStep.INPUT);
  });

  it('should update state when starting analysis', () => {
    // Set the media file
    workflowManager.setMediaFile(mockFile);
    
    // Start analysis
    workflowManager.startAnalysis();
    
    // Verify the state
    const state = workflowManager.getState();
    expect(state.previousStep).toBe(WorkflowStep.INPUT);
    expect(state.currentStep).toBe(WorkflowStep.ANALYSIS);
    expect(state.inProgress).toBe(true);
  });

  it('should update state when completing analysis', () => {
    // Set the media file and start analysis
    workflowManager.setMediaFile(mockFile);
    workflowManager.startAnalysis();
    
    // Complete analysis
    workflowManager.completeAnalysis(mockAudioAnalysis, mockVideoAnalysis);
    
    // Verify the state
    const state = workflowManager.getState();
    expect(state.previousStep).toBe(WorkflowStep.ANALYSIS);
    expect(state.currentStep).toBe(WorkflowStep.EDITING);
    expect(state.inProgress).toBe(false);
  });

  it('should update state when starting editing', () => {
    // Set the media file, start and complete analysis
    workflowManager.setMediaFile(mockFile);
    workflowManager.startAnalysis();
    workflowManager.completeAnalysis(mockAudioAnalysis, mockVideoAnalysis);
    
    // Start editing
    workflowManager.startEditing();
    
    // Verify the state
    const state = workflowManager.getState();
    expect(state.previousStep).toBe(WorkflowStep.EDITING);
    expect(state.currentStep).toBe(WorkflowStep.EDITING);
    expect(state.inProgress).toBe(true);
  });

  it('should update state when completing editing', () => {
    // Set the media file, start and complete analysis, start editing
    workflowManager.setMediaFile(mockFile);
    workflowManager.startAnalysis();
    workflowManager.completeAnalysis(mockAudioAnalysis, mockVideoAnalysis);
    workflowManager.startEditing();
    
    // Complete editing
    workflowManager.completeEditing(mockEditDecisionList);
    
    // Verify the state
    const state = workflowManager.getState();
    expect(state.previousStep).toBe(WorkflowStep.EDITING);
    expect(state.currentStep).toBe(WorkflowStep.PREVIEW);
    expect(state.inProgress).toBe(false);
  });

  it('should update state when starting export', () => {
    // Set the media file, start and complete analysis, start and complete editing
    workflowManager.setMediaFile(mockFile);
    workflowManager.startAnalysis();
    workflowManager.completeAnalysis(mockAudioAnalysis, mockVideoAnalysis);
    workflowManager.startEditing();
    workflowManager.completeEditing(mockEditDecisionList);
    
    // Start export
    workflowManager.startExport();
    
    // Verify the state
    const state = workflowManager.getState();
    expect(state.previousStep).toBe(WorkflowStep.PREVIEW);
    expect(state.currentStep).toBe(WorkflowStep.EXPORT);
    expect(state.inProgress).toBe(true);
  });

  it('should update state when completing export', () => {
    // Set the media file, start and complete analysis, start and complete editing, start export
    workflowManager.setMediaFile(mockFile);
    workflowManager.startAnalysis();
    workflowManager.completeAnalysis(mockAudioAnalysis, mockVideoAnalysis);
    workflowManager.startEditing();
    workflowManager.completeEditing(mockEditDecisionList);
    workflowManager.startExport();
    
    // Complete export
    workflowManager.completeExport();
    
    // Verify the state
    const state = workflowManager.getState();
    expect(state.previousStep).toBe(WorkflowStep.EXPORT);
    expect(state.inProgress).toBe(false);
    expect(state.isComplete).toBe(true);
  });

  it('should reset the state', () => {
    // Set the media file, start and complete analysis, start and complete editing, start and complete export
    workflowManager.setMediaFile(mockFile);
    workflowManager.startAnalysis();
    workflowManager.completeAnalysis(mockAudioAnalysis, mockVideoAnalysis);
    workflowManager.startEditing();
    workflowManager.completeEditing(mockEditDecisionList);
    workflowManager.startExport();
    workflowManager.completeExport();
    
    // Reset the state
    workflowManager.reset();
    
    // Verify the state
    const state = workflowManager.getState();
    expect(state.currentStep).toBe(WorkflowStep.WELCOME);
    expect(state.inProgress).toBe(false);
    expect(state.isComplete).toBe(false);
  });

  it('should throw an error when starting analysis without a media file', () => {
    // Try to start analysis without setting a media file
    expect(() => workflowManager.startAnalysis()).toThrow(
      'Media file must be set before starting analysis'
    );
  });

  it('should throw an error when starting editing without analysis results', () => {
    // Set the media file
    workflowManager.setMediaFile(mockFile);
    
    // Try to start editing without completing analysis
    expect(() => workflowManager.startEditing()).toThrow(
      'Analysis results must be available before starting editing'
    );
  });

  it('should throw an error when starting export without an edit decision list', () => {
    // Set the media file, start and complete analysis
    workflowManager.setMediaFile(mockFile);
    workflowManager.startAnalysis();
    workflowManager.completeAnalysis(mockAudioAnalysis, mockVideoAnalysis);
    
    // Try to start export without completing editing
    expect(() => workflowManager.startExport()).toThrow(
      'Edit decision list must be available before starting export'
    );
  });

  it('should create valid mock workflow states', () => {
    // Create mock workflow states
    const welcomeState = createMockWorkflowState(WorkflowStep.WELCOME, false, false);
    const analysisState = createMockWorkflowState(WorkflowStep.ANALYSIS, true, false, WorkflowStep.INPUT);
    const completeState = createMockWorkflowState(WorkflowStep.EXPORT, false, true, WorkflowStep.PREVIEW);
    const errorState = createMockWorkflowState(WorkflowStep.ANALYSIS, false, false, WorkflowStep.INPUT, 'Analysis failed');
    
    // Verify the welcome state
    expect(isWorkflowState(welcomeState)).toBe(true);
    expect(welcomeState.currentStep).toBe(WorkflowStep.WELCOME);
    expect(welcomeState.inProgress).toBe(false);
    expect(welcomeState.isComplete).toBe(false);
    expect(welcomeState.previousStep).toBeUndefined();
    expect(welcomeState.error).toBeUndefined();
    
    // Verify the analysis state
    expect(isWorkflowState(analysisState)).toBe(true);
    expect(analysisState.currentStep).toBe(WorkflowStep.ANALYSIS);
    expect(analysisState.inProgress).toBe(true);
    expect(analysisState.isComplete).toBe(false);
    expect(analysisState.previousStep).toBe(WorkflowStep.INPUT);
    expect(analysisState.error).toBeUndefined();
    
    // Verify the complete state
    expect(isWorkflowState(completeState)).toBe(true);
    expect(completeState.currentStep).toBe(WorkflowStep.EXPORT);
    expect(completeState.inProgress).toBe(false);
    expect(completeState.isComplete).toBe(true);
    expect(completeState.previousStep).toBe(WorkflowStep.PREVIEW);
    expect(completeState.error).toBeUndefined();
    
    // Verify the error state
    expect(isWorkflowState(errorState)).toBe(true);
    expect(errorState.currentStep).toBe(WorkflowStep.ANALYSIS);
    expect(errorState.inProgress).toBe(false);
    expect(errorState.isComplete).toBe(false);
    expect(errorState.previousStep).toBe(WorkflowStep.INPUT);
    expect(errorState.error).toBe('Analysis failed');
  });

  it('should create valid mock workflow options', () => {
    // Create mock workflow options
    const defaultOptions = createMockWorkflowOptions();
    const customOptions = createMockWorkflowOptions(
      true,
      [WorkflowStep.WELCOME, WorkflowStep.PREVIEW],
      { theme: 'dark', autoSave: true }
    );
    
    // Verify the default options
    expect(defaultOptions).toBeDefined();
    expect(defaultOptions.autoProceed).toBe(false);
    expect(defaultOptions.skipSteps).toEqual([]);
    expect(defaultOptions.customParams).toEqual({});
    
    // Verify the custom options
    expect(customOptions).toBeDefined();
    expect(customOptions.autoProceed).toBe(true);
    expect(customOptions.skipSteps).toEqual([WorkflowStep.WELCOME, WorkflowStep.PREVIEW]);
    expect(customOptions.customParams).toEqual({ theme: 'dark', autoSave: true });
  });
});
