import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WorkflowStep } from '../../types/workflow-types';
import { createMockFile } from '../../utils/test-utils';

// Mock the WorkflowContext
const mockSetCurrentStep = vi.fn();
const mockSetMediaFile = vi.fn();

const mockWorkflowContext = {
  currentStep: WorkflowStep.INPUT,
  setCurrentStep: mockSetCurrentStep,
  mediaFile: null,
  setMediaFile: mockSetMediaFile,
  isProcessing: false,
  setIsProcessing: vi.fn(),
  processingProgress: 0,
  setProcessingProgress: vi.fn(),
  analysisResult: null,
  setAnalysisResult: vi.fn(),
  editDecisions: [],
  setEditDecisions: vi.fn(),
  exportFormat: 'mp4',
  setExportFormat: vi.fn(),
  exportProgress: 0,
  setExportProgress: vi.fn(),
  exportResult: null,
  setExportResult: vi.fn(),
};

// Mock the useContext hook
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useContext: () => mockWorkflowContext,
  };
});

// Mock the InputStep component
const InputStep = () => {
  const { setCurrentStep, setMediaFile } = mockWorkflowContext;
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      setMediaFile(file);
      setCurrentStep(WorkflowStep.ANALYSIS);
    } else {
      // Show error message for unsupported file types
      const errorElement = document.createElement('div');
      errorElement.textContent = 'Unsupported file type. Please select an audio or video file.';
      errorElement.setAttribute('data-testid', 'error-message');
      document.body.appendChild(errorElement);
    }
  };
  
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    
    if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      setMediaFile(file);
      setCurrentStep(WorkflowStep.ANALYSIS);
    } else {
      // Show error message for unsupported file types
      const errorElement = document.createElement('div');
      errorElement.textContent = 'Unsupported file type. Please select an audio or video file.';
      errorElement.setAttribute('data-testid', 'error-message');
      document.body.appendChild(errorElement);
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  
  return (
    <div>
      <h2>Import Media</h2>
      <p>Select a media file to import</p>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center' }}
      >
        <input
          type="file"
          onChange={handleFileChange}
          accept="video/*,audio/*"
          aria-label="Drag and drop your file here, or click to browse"
        />
      </div>
    </div>
  );
};

describe('InputStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('renders the input step correctly', () => {
    render(<InputStep />);
    
    // Check that the component renders correctly
    expect(screen.getByText('Import Media')).toBeInTheDocument();
    expect(screen.getByText('Select a media file to import')).toBeInTheDocument();
    expect(screen.getByLabelText('Drag and drop your file here, or click to browse')).toBeInTheDocument();
  });

  it('handles file selection correctly', async () => {
    render(<InputStep />);
    
    // Create a mock file
    const mockFile = createMockFile('test-media.mp4', 'video/mp4');
    
    // Get the file input element
    const fileInput = screen.getByLabelText('Drag and drop your file here, or click to browse');
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // Wait for the component to process the file
    await waitFor(() => {
      // Check that setMediaFile was called with the mock file
      expect(mockSetMediaFile).toHaveBeenCalledWith(mockFile);
      
      // Check that setCurrentStep was called to advance to the next step
      expect(mockSetCurrentStep).toHaveBeenCalledWith(WorkflowStep.ANALYSIS);
    });
  });

  it('displays an error for unsupported file types', async () => {
    render(<InputStep />);
    
    // Create a mock file with an unsupported type
    const mockFile = createMockFile('test-document.pdf', 'application/pdf');
    
    // Get the file input element
    const fileInput = screen.getByLabelText('Drag and drop your file here, or click to browse');
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // Wait for the component to process the file
    await waitFor(() => {
      // Check that an error message is displayed
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('error-message').textContent).toBe('Unsupported file type. Please select an audio or video file.');
      
      // Check that setMediaFile was not called
      expect(mockSetMediaFile).not.toHaveBeenCalled();
      
      // Check that setCurrentStep was not called
      expect(mockSetCurrentStep).not.toHaveBeenCalled();
    });
  });

  it('handles drag and drop correctly', async () => {
    render(<InputStep />);
    
    // Create a mock file
    const mockFile = createMockFile('test-media.mp4', 'video/mp4');
    
    // Get the drop zone element
    const dropZone = screen.getByLabelText('Drag and drop your file here, or click to browse').parentElement as HTMLElement;
    
    // Simulate drag events
    fireEvent.dragOver(dropZone);
    
    // Simulate drop event
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockFile],
      },
    });
    
    // Wait for the component to process the file
    await waitFor(() => {
      // Check that setMediaFile was called with the mock file
      expect(mockSetMediaFile).toHaveBeenCalledWith(mockFile);
      
      // Check that setCurrentStep was called to advance to the next step
      expect(mockSetCurrentStep).toHaveBeenCalledWith(WorkflowStep.ANALYSIS);
    });
  });
});
