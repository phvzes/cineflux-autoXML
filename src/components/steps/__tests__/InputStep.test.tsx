/**
 * InputStep.test.tsx
 * Tests for the InputStep component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { InputStep } from '../InputStep';
import { useWorkflow } from '../../../context/WorkflowContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { AudioService } from '../../../services/AudioService';
import { VideoService } from '../../../services/VideoService';
import { WorkflowStep } from '../../../types/workflow-types';

// Mock the context hooks
jest.mock('../../../context/WorkflowContext');
jest.mock('../../../contexts/NotificationContext');
jest.mock('../../../services/AudioService');
jest.mock('../../../services/VideoService');

// Helper function to create a mock file
function createMockFile(name: string, type: string, size: number = 1024 * 1024): File {
  const file = new File(['mock file content'], name, { type });
  return file;
}

describe('InputStep', () => {
  beforeEach(() => {
    // Setup common mocks
    const mockSetMediaFile = jest.fn();
    const mockSetCurrentStep = jest.fn();
    const mockShowNotification = jest.fn();
    
    // Setup WorkflowContext mock
    (useWorkflow as jest.Mock).mockReturnValue({
      currentStep: WorkflowStep.IMPORT,
      setCurrentStep: mockSetCurrentStep,
      mediaFile: null,
      setMediaFile: mockSetMediaFile,
      isProcessing: false,
      setIsProcessing: jest.fn(),
      processingProgress: 0,
      setProcessingProgress: jest.fn(),
      analysisResult: null,
      setAnalysisResult: jest.fn(),
      editDecisions: [],
      setEditDecisions: jest.fn(),
      exportFormat: 'mp4',
      setExportFormat: jest.fn(),
      exportProgress: 0,
      setExportProgress: jest.fn(),
      exportResult: null,
      setExportResult: jest.fn(),
    });
    
    // Setup NotificationContext mock
    (useNotification as jest.Mock).mockReturnValue({
      showNotification: mockShowNotification
    });
    
    // Setup AudioService mock
    (AudioService.getInstance as jest.Mock).mockReturnValue({
      loadAudio: jest.fn().mockResolvedValue({ duration: 120 }),
      extractWaveform: jest.fn().mockResolvedValue({ data: [0.1, 0.2, 0.3] })
    });
    
    // Setup VideoService mock
    (VideoService.getInstance as jest.Mock).mockReturnValue({
      loadVideoFile: jest.fn().mockImplementation(async (file) => ({
        duration: 120,
        width: 1920,
        height: 1080,
        frameRate: 30,
        blobUrl: 'mock://video-url',
        thumbnail: 'mock://thumbnail-url'
      }))
    });
  });
  
  it('renders the input step correctly', () => {
    render(<InputStep />);
    
    // Check that the component renders correctly
    expect(screen.getByText('Import Media')).toBeInTheDocument();
    expect(screen.getByText('Select a media file to import')).toBeInTheDocument();
    expect(screen.getByLabelText('Drag and drop your file here, or click to browse')).toBeInTheDocument();
  });
  
  it('handles audio file selection correctly', async () => {
    render(<InputStep />);
    
    // Create a mock audio file
    const audioFile = createMockFile('test-audio.mp3', 'audio/mp3');
    
    // Get the file input element
    const fileInput = screen.getByLabelText('Drag and drop your file here, or click to browse');
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [audioFile] } });
    
    // Wait for the component to process the file
    await waitFor(() => {
      // Check that AudioService.loadAudio was called with the mock file
      expect(AudioService.getInstance().loadAudio).toHaveBeenCalledWith(
        audioFile,
        expect.any(Function)
      );
      
      // Check that AudioService.extractWaveform was called
      expect(AudioService.getInstance().extractWaveform).toHaveBeenCalled();
      
      // Check that setMediaFile was called with the mock file
      expect(useWorkflow().setMediaFile).toHaveBeenCalledWith(audioFile);
      
      // Check that setCurrentStep was called to advance to the next step
      expect(useWorkflow().setCurrentStep).toHaveBeenCalledWith(WorkflowStep.ANALYZE);
      
      // Check that a success notification was shown
      expect(useNotification().showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('Audio file imported successfully')
        })
      );
    });
  });
  
  it('handles video file selection correctly', async () => {
    render(<InputStep />);
    
    // Create a mock video file
    const videoFile = createMockFile('test-video.mp4', 'video/mp4');
    
    // Get the file input element
    const fileInput = screen.getByLabelText('Drag and drop your file here, or click to browse');
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [videoFile] } });
    
    // Wait for the component to process the file
    await waitFor(() => {
      // Check that VideoService.loadVideoFile was called with the mock file
      expect(VideoService.getInstance().loadVideoFile).toHaveBeenCalledWith(videoFile);
      
      // Check that setMediaFile was called with the mock file
      expect(useWorkflow().setMediaFile).toHaveBeenCalledWith(videoFile);
      
      // Check that setCurrentStep was called to advance to the next step
      expect(useWorkflow().setCurrentStep).toHaveBeenCalledWith(WorkflowStep.ANALYZE);
      
      // Check that a success notification was shown
      expect(useNotification().showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('Video file imported successfully')
        })
      );
    });
  });
  
  it('displays an error for unsupported file types', async () => {
    render(<InputStep />);
    
    // Create a mock file with an unsupported type
    const unsupportedFile = createMockFile('test-document.pdf', 'application/pdf');
    
    // Get the file input element
    const fileInput = screen.getByLabelText('Drag and drop your file here, or click to browse');
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [unsupportedFile] } });
    
    // Wait for the component to process the file
    await waitFor(() => {
      // Check that an error notification was shown
      expect(useNotification().showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Unsupported file type')
        })
      );
      
      // Check that setMediaFile was not called
      expect(useWorkflow().setMediaFile).not.toHaveBeenCalled();
      
      // Check that setCurrentStep was not called
      expect(useWorkflow().setCurrentStep).not.toHaveBeenCalled();
    });
  });
  
  it('handles audio processing errors', async () => {
    // Override the AudioService mock to throw an error
    (AudioService.getInstance as jest.Mock).mockReturnValue({
      loadAudio: jest.fn().mockRejectedValue(new Error('Audio processing failed')),
      extractWaveform: jest.fn()
    });
    
    render(<InputStep />);
    
    // Create a mock audio file
    const audioFile = createMockFile('test-audio.mp3', 'audio/mp3');
    
    // Get the file input element
    const fileInput = screen.getByLabelText('Drag and drop your file here, or click to browse');
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [audioFile] } });
    
    // Wait for the component to process the file
    await waitFor(() => {
      // Check that an error notification was shown
      expect(useNotification().showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Failed to import audio file')
        })
      );
    });
  });
  
  it('handles video processing errors', async () => {
    // Override the VideoService mock to throw an error
    (VideoService.getInstance as jest.Mock).mockReturnValue({
      loadVideoFile: jest.fn().mockRejectedValue(new Error('Video processing failed'))
    });
    
    render(<InputStep />);
    
    // Create a mock video file
    const videoFile = createMockFile('test-video.mp4', 'video/mp4');
    
    // Get the file input element
    const fileInput = screen.getByLabelText('Drag and drop your file here, or click to browse');
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [videoFile] } });
    
    // Wait for the component to process the file
    await waitFor(() => {
      // Check that an error notification was shown
      expect(useNotification().showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Failed to import video file')
        })
      );
    });
  });
  
  it('should proceed to analysis step when media is already loaded', () => {
    // Override the WorkflowContext mock to include media files
    (useWorkflow as jest.Mock).mockReturnValue({
      currentStep: WorkflowStep.IMPORT,
      setCurrentStep: jest.fn(),
      mediaFile: {
        type: 'audio/mp3',
        name: 'test-audio.mp3',
        size: 1024 * 1024,
        url: 'mock://audio-url',
      },
      setMediaFile: jest.fn(),
      isProcessing: false,
      setIsProcessing: jest.fn(),
      processingProgress: 0,
      setProcessingProgress: jest.fn(),
      analysisResult: null,
      setAnalysisResult: jest.fn(),
      editDecisions: [],
      setEditDecisions: jest.fn(),
      exportFormat: 'mp4',
      setExportFormat: jest.fn(),
      exportProgress: 0,
      setExportProgress: jest.fn(),
      exportResult: null,
      setExportResult: jest.fn(),
      goToStep: jest.fn()
    });
    
    render(<InputStep />);
    
    // Check that the component shows the media file info
    expect(screen.getByText('test-audio.mp3')).toBeInTheDocument();
    
    // Click the "Proceed to Analysis" button
    fireEvent.click(screen.getByText('Proceed to Analysis'));
    
    // Check that setCurrentStep was called to advance to the next step
    expect(useWorkflow().setCurrentStep).toHaveBeenCalledWith(WorkflowStep.ANALYZE);
  });
  
  it('should allow removing media files', () => {
    // Override the WorkflowContext mock to include media files
    (useWorkflow as jest.Mock).mockReturnValue({
      currentStep: WorkflowStep.IMPORT,
      setCurrentStep: jest.fn(),
      mediaFile: {
        type: 'video/mp4',
        name: 'test-video.mp4',
        size: 1024 * 1024,
        url: 'mock://video-url',
        thumbnail: 'mock://thumbnail-url'
      },
      setMediaFile: jest.fn(),
      isProcessing: false,
      setIsProcessing: jest.fn(),
      processingProgress: 0,
      setProcessingProgress: jest.fn(),
      analysisResult: null,
      setAnalysisResult: jest.fn(),
      editDecisions: [],
      setEditDecisions: jest.fn(),
      exportFormat: 'mp4',
      setExportFormat: jest.fn(),
      exportProgress: 0,
      setExportProgress: jest.fn(),
      exportResult: null,
      setExportResult: jest.fn(),
      goToStep: jest.fn()
    });
    
    render(<InputStep />);
    
    // Check that the component shows the media file info
    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    
    // Click the "Remove" button
    fireEvent.click(screen.getByText('Remove'));
    
    // Check that setMediaFile was called with null
    expect(useWorkflow().setMediaFile).toHaveBeenCalledWith(null);
  });
  
  it('should handle drag and drop correctly', async () => {
    render(<InputStep />);
    
    // Create a mock video file
    const videoFile = createMockFile('test-video.mp4', 'video/mp4');
    
    // Get the drop zone element
    const dropZone = screen.getByLabelText('Drag and drop your file here, or click to browse');
    
    // Simulate drag events
    fireEvent.dragEnter(dropZone);
    fireEvent.dragOver(dropZone);
    
    // Simulate drop event
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [videoFile],
      },
    });
    
    // Wait for the component to process the file
    await waitFor(() => {
      // Check that VideoService.loadVideoFile was called with the mock file
      expect(VideoService.getInstance().loadVideoFile).toHaveBeenCalledWith(videoFile);
      
      // Check that setMediaFile was called with the mock file
      expect(useWorkflow().setMediaFile).toHaveBeenCalledWith(videoFile);
      
      // Check that setCurrentStep was called to advance to the next step
      expect(useWorkflow().setCurrentStep).toHaveBeenCalledWith(WorkflowStep.ANALYZE);
    });
  });
});
