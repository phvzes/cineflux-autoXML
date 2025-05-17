// src/components/steps/__tests__/InputStep.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InputStep from '../InputStep';
import { useWorkflow } from '../../../context/WorkflowContext';
import { useNotification } from '../../../contexts/NotificationContext';
import AudioService from '../../../services/AudioService';
import VideoService from '../../../services/VideoService';

// Mock the dependencies
jest.mock('../../../context/WorkflowContext');
jest.mock('../../../contexts/NotificationContext');
jest.mock('../../../services/AudioService');
jest.mock('../../../services/VideoService');

// Mock file creation helper
const createMockFile = (name: string, type: string, size: number = 1024): File => {
  const file = new File(['mock file content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('InputStep Component', () => {
  // Setup common mocks
  const mockSetData = jest.fn();
  const mockAddVideoFile = jest.fn();
  const mockRemoveVideoFile = jest.fn();
  const mockAddRawVideoFile = jest.fn();
  const mockRemoveRawVideoFile = jest.fn();
  const mockGoToStep = jest.fn();
  const mockShowNotification = jest.fn();
  
  // Mock AudioService
  const mockAudioService = {
    getInstance: jest.fn().mockReturnValue({
      loadAudio: jest.fn().mockResolvedValue({ duration: 120 }),
      extractWaveform: jest.fn().mockResolvedValue({ data: [0.1, 0.2, 0.3] })
    })
  };
  
  // Mock VideoService
  const mockVideoService = {
    getInstance: jest.fn().mockReturnValue({
      loadVideoFile: jest.fn().mockImplementation(async (file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        duration: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        blobUrl: 'mock://video-url',
        thumbnail: 'mock://thumbnail-url'
      }))
    })
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup WorkflowContext mock
    (useWorkflow as jest.Mock).mockReturnValue({
      state: {
        project: {
          musicFile: null,
          videoFiles: [],
          rawVideoFiles: [],
          settings: {
            genre: 'Hip-Hop/Rap',
            style: 'Dynamic',
            transitions: 'Auto (Based on Music)',
            exportFormat: 'Premiere Pro XML'
          }
        },
        ui: {
          audioProgress: null,
          videoProgress: null,
          rawVideoProgress: null,
          errors: {
            audioUpload: null,
            videoUpload: null,
            rawVideoUpload: null
          }
        }
      },
      navigation: {
        goToStep: mockGoToStep
      },
      actions: {
        setData: mockSetData,
        addVideoFile: mockAddVideoFile,
        removeVideoFile: mockRemoveVideoFile,
        addRawVideoFile: mockAddRawVideoFile,
        removeRawVideoFile: mockRemoveRawVideoFile
      }
    });
    
    // Setup NotificationContext mock
    (useNotification as jest.Mock).mockReturnValue({
      showNotification: mockShowNotification
    });
    
    // Setup AudioService mock
    (AudioService.getInstance as jest.Mock).mockImplementation(mockAudioService.getInstance);
    
    // Setup VideoService mock
    (VideoService.getInstance as jest.Mock).mockImplementation(mockVideoService.getInstance);
  });
  
  // Test 1: Basic rendering
  it('renders the component correctly', () => {
    render(<InputStep />);
    
    // Check for main sections
    expect(screen.getByText('Input Files')).toBeInTheDocument();
    expect(screen.getByText('Music Track:')).toBeInTheDocument();
    expect(screen.getByText('Video Clips:')).toBeInTheDocument();
    expect(screen.getByText('Raw Video Files:')).toBeInTheDocument();
    
    // Check for dropzone instructions
    expect(screen.getByText(/Drag & drop your music file here/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop your video clips here/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop your raw video files here/i)).toBeInTheDocument();
    
    // Check for getting started section
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
  });
  
  // Test 2: Audio file upload handling
  it('handles audio file upload correctly', async () => {
    render(<InputStep />);
    
    // Create a mock audio file
    const audioFile = createMockFile('test-audio.mp3', 'audio/mp3');
    
    // Get the audio dropzone
    const audioDropzone = screen.getByText(/Drag & drop your music file here/i).closest('div');
    expect(audioDropzone).toBeInTheDocument();
    
    // Simulate file drop
    if (audioDropzone) {
      fireEvent.drop(audioDropzone, {
        dataTransfer: {
          files: [audioFile]
        }
      });
    }
    
    // Verify AudioService methods were called
    await waitFor(() => {
      expect(AudioService.getInstance).toHaveBeenCalled();
      expect(mockAudioService.getInstance().loadAudio).toHaveBeenCalledWith(
        audioFile,
        expect.any(Function)
      );
      expect(mockAudioService.getInstance().extractWaveform).toHaveBeenCalled();
    });
    
    // Verify state was updated
    await waitFor(() => {
      expect(mockSetData).toHaveBeenCalledWith(expect.objectContaining({
        project: expect.objectContaining({
          musicFile: expect.objectContaining({
            file: audioFile,
            name: 'test-audio.mp3',
            type: 'audio/mp3'
          })
        })
      }));
    });
    
    // Verify notification was shown
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'success',
        'Audio processing completed successfully!'
      );
    });
  });
  
  // Test 3: Video file upload handling
  it('handles video file upload correctly', async () => {
    render(<InputStep />);
    
    // Create a mock video file
    const videoFile = createMockFile('test-video.mp4', 'video/mp4');
    
    // Get the video dropzone
    const videoDropzone = screen.getByText(/Drag & drop your video clips here/i).closest('div');
    expect(videoDropzone).toBeInTheDocument();
    
    // Simulate file drop
    if (videoDropzone) {
      fireEvent.drop(videoDropzone, {
        dataTransfer: {
          files: [videoFile]
        }
      });
    }
    
    // Verify VideoService methods were called
    await waitFor(() => {
      expect(VideoService.getInstance).toHaveBeenCalled();
      expect(mockVideoService.getInstance().loadVideoFile).toHaveBeenCalledWith(videoFile);
    });
    
    // Verify state was updated
    await waitFor(() => {
      expect(mockSetData).toHaveBeenCalledWith(expect.objectContaining({
        ui: expect.objectContaining({
          videoProgress: expect.objectContaining({
            percentage: 0,
            currentStep: 'Loading video...'
          })
        })
      }));
    });
    
    // Verify addVideoFile was called with the processed video
    await waitFor(() => {
      expect(mockAddVideoFile).toHaveBeenCalledWith(expect.objectContaining({
        file: videoFile,
        name: 'test-video.mp4',
        type: 'video/mp4',
        duration: 60,
        width: 1920,
        height: 1080
      }));
    });
    
    // Verify notification was shown
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'success',
        'Video "test-video.mp4" processed successfully!'
      );
    });
  });
  
  // Test 4: Raw video file upload handling
  it('handles raw video file upload correctly', async () => {
    render(<InputStep />);
    
    // Create a mock raw video file
    const rawVideoFile = createMockFile('test-raw-video.mp4', 'video/mp4');
    
    // Get the raw video dropzone
    const rawVideoDropzone = screen.getByText(/Drag & drop your raw video files here/i).closest('div');
    expect(rawVideoDropzone).toBeInTheDocument();
    
    // Simulate file drop
    if (rawVideoDropzone) {
      fireEvent.drop(rawVideoDropzone, {
        dataTransfer: {
          files: [rawVideoFile]
        }
      });
    }
    
    // Verify VideoService methods were called
    await waitFor(() => {
      expect(VideoService.getInstance).toHaveBeenCalled();
      expect(mockVideoService.getInstance().loadVideoFile).toHaveBeenCalledWith(rawVideoFile);
    });
    
    // Verify state was updated
    await waitFor(() => {
      expect(mockSetData).toHaveBeenCalledWith(expect.objectContaining({
        ui: expect.objectContaining({
          rawVideoProgress: expect.objectContaining({
            percentage: 0,
            currentStep: 'Loading raw video...'
          })
        })
      }));
    });
    
    // Verify addRawVideoFile was called with the processed video
    await waitFor(() => {
      expect(mockAddRawVideoFile).toHaveBeenCalledWith(expect.objectContaining({
        file: rawVideoFile,
        name: 'test-raw-video.mp4',
        type: 'video/mp4',
        duration: 60,
        width: 1920,
        height: 1080
      }));
    });
    
    // Verify notification was shown
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'success',
        'Raw video "test-raw-video.mp4" processed successfully!'
      );
    });
  });
  
  // Test 5: Error handling for audio upload
  it('handles audio upload errors correctly', async () => {
    // Mock AudioService to throw an error
    (AudioService.getInstance as jest.Mock).mockReturnValue({
      loadAudio: jest.fn().mockRejectedValue(new Error('Audio processing failed')),
      extractWaveform: jest.fn()
    });
    
    render(<InputStep />);
    
    // Create a mock audio file
    const audioFile = createMockFile('test-audio.mp3', 'audio/mp3');
    
    // Get the audio dropzone
    const audioDropzone = screen.getByText(/Drag & drop your music file here/i).closest('div');
    
    // Simulate file drop
    if (audioDropzone) {
      fireEvent.drop(audioDropzone, {
        dataTransfer: {
          files: [audioFile]
        }
      });
    }
    
    // Verify error state was updated
    await waitFor(() => {
      expect(mockSetData).toHaveBeenCalledWith(expect.objectContaining({
        ui: expect.objectContaining({
          errors: expect.objectContaining({
            audioUpload: 'Error processing audio file: Audio processing failed'
          })
        })
      }));
    });
    
    // Verify error notification was shown
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'error',
        'Error processing audio file: Audio processing failed',
        expect.objectContaining({
          actionLabel: 'Retry'
        })
      );
    });
  });
  
  // Test 6: Error handling for video upload
  it('handles video upload errors correctly', async () => {
    // Mock VideoService to throw an error
    (VideoService.getInstance as jest.Mock).mockReturnValue({
      loadVideoFile: jest.fn().mockRejectedValue(new Error('Video processing failed'))
    });
    
    render(<InputStep />);
    
    // Create a mock video file
    const videoFile = createMockFile('test-video.mp4', 'video/mp4');
    
    // Get the video dropzone
    const videoDropzone = screen.getByText(/Drag & drop your video clips here/i).closest('div');
    
    // Simulate file drop
    if (videoDropzone) {
      fireEvent.drop(videoDropzone, {
        dataTransfer: {
          files: [videoFile]
        }
      });
    }
    
    // Verify error state was updated
    await waitFor(() => {
      expect(mockSetData).toHaveBeenCalledWith(expect.objectContaining({
        ui: expect.objectContaining({
          errors: expect.objectContaining({
            videoUpload: `Error processing video file test-video.mp4: Video processing failed`
          })
        })
      }));
    });
    
    // Verify error notification was shown
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'error',
        'Error processing video file test-video.mp4: Video processing failed',
        expect.objectContaining({
          actionLabel: 'Retry'
        })
      );
    });
  });
  
  // Test 7: Analyze button functionality
  it('enables and handles the analyze button when files are loaded', async () => {
    // Setup WorkflowContext with files loaded
    (useWorkflow as jest.Mock).mockReturnValue({
      state: {
        project: {
          musicFile: {
            file: createMockFile('test-audio.mp3', 'audio/mp3'),
            name: 'test-audio.mp3',
            size: 1024,
            type: 'audio/mp3',
            duration: 120,
            url: 'mock://audio-url',
            waveform: [0.1, 0.2, 0.3]
          },
          videoFiles: [{
            file: createMockFile('test-video.mp4', 'video/mp4'),
            name: 'test-video.mp4',
            size: 1024,
            type: 'video/mp4',
            duration: 60,
            width: 1920,
            height: 1080,
            fps: 30,
            url: 'mock://video-url',
            thumbnail: 'mock://thumbnail-url'
          }],
          rawVideoFiles: [],
          settings: {
            genre: 'Hip-Hop/Rap',
            style: 'Dynamic',
            transitions: 'Auto (Based on Music)',
            exportFormat: 'Premiere Pro XML'
          }
        },
        ui: {
          audioProgress: null,
          videoProgress: null,
          rawVideoProgress: null,
          errors: {
            audioUpload: null,
            videoUpload: null,
            rawVideoUpload: null
          }
        }
      },
      navigation: {
        goToStep: mockGoToStep
      },
      actions: {
        setData: mockSetData,
        addVideoFile: mockAddVideoFile,
        removeVideoFile: mockRemoveVideoFile,
        addRawVideoFile: mockAddRawVideoFile,
        removeRawVideoFile: mockRemoveRawVideoFile
      }
    });
    
    render(<InputStep />);
    
    // Check that the analyze button is enabled
    const analyzeButton = screen.getByText('Analyze & Create Edit');
    expect(analyzeButton).not.toBeDisabled();
    
    // Click the analyze button
    fireEvent.click(analyzeButton);
    
    // Verify state was updated
    expect(mockSetData).toHaveBeenCalledWith(expect.objectContaining({
      workflow: expect.objectContaining({
        analysisProgress: expect.objectContaining({
          percentage: 0,
          currentStep: "Starting analysis..."
        })
      }),
      analysis: expect.objectContaining({
        isAnalyzing: true
      })
    }));
    
    // Verify navigation to analysis step
    expect(mockGoToStep).toHaveBeenCalledWith('analysis');
  });
  
  // Test 8: Project settings changes
  it('handles project settings changes correctly', async () => {
    // Setup WorkflowContext with files loaded
    (useWorkflow as jest.Mock).mockReturnValue({
      state: {
        project: {
          musicFile: {
            file: createMockFile('test-audio.mp3', 'audio/mp3'),
            name: 'test-audio.mp3',
            size: 1024,
            type: 'audio/mp3',
            duration: 120,
            url: 'mock://audio-url',
            waveform: [0.1, 0.2, 0.3]
          },
          videoFiles: [{
            file: createMockFile('test-video.mp4', 'video/mp4'),
            name: 'test-video.mp4',
            size: 1024,
            type: 'video/mp4',
            duration: 60,
            width: 1920,
            height: 1080,
            fps: 30,
            url: 'mock://video-url',
            thumbnail: 'mock://thumbnail-url'
          }],
          rawVideoFiles: [],
          settings: {
            genre: 'Hip-Hop/Rap',
            style: 'Dynamic',
            transitions: 'Auto (Based on Music)',
            exportFormat: 'Premiere Pro XML'
          }
        },
        ui: {
          audioProgress: null,
          videoProgress: null,
          rawVideoProgress: null,
          errors: {
            audioUpload: null,
            videoUpload: null,
            rawVideoUpload: null
          }
        }
      },
      navigation: {
        goToStep: mockGoToStep
      },
      actions: {
        setData: mockSetData,
        addVideoFile: mockAddVideoFile,
        removeVideoFile: mockRemoveVideoFile,
        addRawVideoFile: mockAddRawVideoFile,
        removeRawVideoFile: mockRemoveRawVideoFile
      }
    });
    
    render(<InputStep />);
    
    // Find the genre select dropdown
    const genreSelect = screen.getByLabelText('Music Genre:');
    expect(genreSelect).toBeInTheDocument();
    
    // Change the genre
    fireEvent.change(genreSelect, { target: { value: 'Rock' } });
    
    // Verify state was updated
    expect(mockSetData).toHaveBeenCalledWith(expect.objectContaining({
      project: expect.objectContaining({
        settings: expect.objectContaining({
          genre: 'Rock'
        })
      })
    }));
    
    // Find the edit style select dropdown
    const styleSelect = screen.getByLabelText('Edit Style:');
    expect(styleSelect).toBeInTheDocument();
    
    // Change the edit style
    fireEvent.change(styleSelect, { target: { value: 'Minimal' } });
    
    // Verify state was updated
    expect(mockSetData).toHaveBeenCalledWith(expect.objectContaining({
      project: expect.objectContaining({
        settings: expect.objectContaining({
          style: 'Minimal'
        })
      })
    }));
  });
  
  // Test 9: File removal functionality
  it('handles file removal correctly', async () => {
    // Setup WorkflowContext with files loaded
    (useWorkflow as jest.Mock).mockReturnValue({
      state: {
        project: {
          musicFile: {
            file: createMockFile('test-audio.mp3', 'audio/mp3'),
            name: 'test-audio.mp3',
            size: 1024,
            type: 'audio/mp3',
            duration: 120,
            url: 'mock://audio-url',
            waveform: [0.1, 0.2, 0.3]
          },
          videoFiles: [{
            file: createMockFile('test-video.mp4', 'video/mp4'),
            name: 'test-video.mp4',
            size: 1024,
            type: 'video/mp4',
            duration: 60,
            width: 1920,
            height: 1080,
            fps: 30,
            url: 'mock://video-url',
            thumbnail: 'mock://thumbnail-url'
          }],
          rawVideoFiles: [{
            file: createMockFile('test-raw-video.mp4', 'video/mp4'),
            name: 'test-raw-video.mp4',
            size: 1024,
            type: 'video/mp4',
            duration: 60,
            width: 1920,
            height: 1080,
            fps: 30,
            url: 'mock://raw-video-url',
            thumbnail: 'mock://raw-thumbnail-url'
          }],
          settings: {
            genre: 'Hip-Hop/Rap',
            style: 'Dynamic',
            transitions: 'Auto (Based on Music)',
            exportFormat: 'Premiere Pro XML'
          }
        },
        ui: {
          audioProgress: null,
          videoProgress: null,
          rawVideoProgress: null,
          errors: {
            audioUpload: null,
            videoUpload: null,
            rawVideoUpload: null
          }
        }
      },
      navigation: {
        goToStep: mockGoToStep
      },
      actions: {
        setData: mockSetData,
        addVideoFile: mockAddVideoFile,
        removeVideoFile: mockRemoveVideoFile,
        addRawVideoFile: mockAddRawVideoFile,
        removeRawVideoFile: mockRemoveRawVideoFile
      }
    });
    
    render(<InputStep />);
    
    // Find and click the remove button for the audio file
    const audioRemoveButton = screen.getAllByRole('button')[0]; // First button should be audio remove
    fireEvent.click(audioRemoveButton);
    
    // Verify state was updated
    expect(mockSetData).toHaveBeenCalledWith(expect.objectContaining({
      project: expect.objectContaining({
        musicFile: null
      })
    }));
    
    // Find and click the remove button for the video file
    const videoRemoveButton = screen.getAllByRole('button')[1]; // Second button should be video remove
    fireEvent.click(videoRemoveButton);
    
    // Verify removeVideoFile was called
    expect(mockRemoveVideoFile).toHaveBeenCalledWith(0);
    
    // Find and click the remove button for the raw video file
    const rawVideoRemoveButton = screen.getAllByRole('button')[2]; // Third button should be raw video remove
    fireEvent.click(rawVideoRemoveButton);
    
    // Verify removeRawVideoFile was called
    expect(mockRemoveRawVideoFile).toHaveBeenCalledWith(0);
  });
  
  // TODO: Test for verifying proper service calls when files are uploaded
  // This would involve more detailed mocking of the service methods and verifying
  // that they are called with the correct parameters
  
  // TODO: Test for error state handling in the UI
  // This would involve setting up error states in the context and verifying
  // that the UI displays error messages correctly
  
  // TODO: Test for file upload event handling with different file types
  // This would involve testing with different file types and verifying
  // that the component handles them correctly
});
