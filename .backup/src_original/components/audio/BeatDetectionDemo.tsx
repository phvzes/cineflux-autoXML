import React, { useState, useRef, useEffect } from 'react';
import AudioService from '../../services/AudioService';
import WaveformVisualizer from './WaveformVisualizer';
import AudioProcessingProgress from './AudioProcessingProgress';
import { Beat, AudioAnalysis } from '../../types/AudioAnalysis';
import { safeStringify } from '../../utils/safeStringify';

interface BeatDetectionDemoProps {
  /**
   * Initial audio file URL (optional)
   */
  initialAudioUrl?: string;
  
  /**
   * Width of the visualization
   */
  width?: number;
  
  /**
   * Height of the visualization
   */
  height?: number;
  
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Demo component for audio beat detection and visualization
 */
const BeatDetectionDemo: React.FC<BeatDetectionDemoProps> = ({
  initialAudioUrl,
  width = 800,
  height = 200,
  className = '',
}) => {
  // State for audio file
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  // State for audio buffer
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  
  // State for beats
  const [beats, setBeats] = useState<Beat[]>([]);
  
  // State for BPM
  const [bpm, setBpm] = useState<number | null>(null);
  
  // State for waveform data
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  
  // State for processing progress
  const [progress, setProgress] = useState<number>(0);
  
  // State for processing step
  const [processingStep, setProcessingStep] = useState<string>('');
  
  // State for processing error
  const [error, setError] = useState<string | null>(null);
  
  // State for processing completion
  const [isProcessingComplete, setIsProcessingComplete] = useState<boolean>(false);
  
  // State for full analysis results
  const [analysisResults, setAnalysisResults] = useState<AudioAnalysis | null>(null);
  
  // State for playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  
  // References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Load initial audio if provided
  useEffect(() => {
    if (initialAudioUrl) {
      loadAudioFromUrl(initialAudioUrl);
    }
  }, [initialAudioUrl]);
  
  // Update current time during playback
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      const updateTime = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          animationFrameRef.current = requestAnimationFrame(updateTime);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(updateTime);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isPlaying]);
  
  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setAudioFile(file);
      processAudioFile(file);
      
      // Create object URL for playback
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      
      audioUrlRef.current = URL.createObjectURL(file);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrlRef.current;
      }
    }
  };
  
  // Load audio from URL
  const loadAudioFromUrl = async (url: string) => {
    try {
      setProgress(0);
      setProcessingStep('Fetching audio file...');
      setError(null);
      setIsProcessingComplete(false);
      
      // Fetch the audio file
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.statusText}`);
      }
      
      // Convert to blob
      const blob = await response.blob();
      
      // Create a File object
      const file = new File([blob], 'audio.mp3', { type: blob.type });
      
      // Set the audio file
      setAudioFile(file);
      
      // Process the audio file
      processAudioFile(file);
      
      // Set the audio URL for playback
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      
      audioUrlRef.current = URL.createObjectURL(file);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrlRef.current;
      }
    } catch (error) {
      console.error('Error loading audio from URL:', error);
      setError(`Error loading audio: ${error instanceof Error ? error.message : String(error)}`);
      setIsProcessingComplete(true);
    }
  };
  
  // Process audio file
  const processAudioFile = async (file: File) => {
    try {
      setProgress(0);
      setProcessingStep('Initializing audio processing...');
      setError(null);
      setIsProcessingComplete(false);
      
      // Analyze the audio file
      const analysis = await AudioService.analyzeAudio(file, (progress, step) => {
        setProgress(progress);
        setProcessingStep(step);
      });
      
      // Set the analysis results
      setAnalysisResults(analysis);
      
      // Set the beats
      setBeats(analysis.beats.beats);
      
      // Set the BPM
      setBpm(analysis.tempo.bpm);
      
      // Set the waveform data
      setWaveformData(analysis.waveform.data);
      
      // Load the audio buffer for visualization
      const buffer = await AudioService.loadAudio(file);
      setAudioBuffer(buffer);
      
      setIsProcessingComplete(true);
    } catch (error) {
      console.error('Error processing audio file:', error);
      setError(`Error processing audio: ${error instanceof Error ? error.message : String(error)}`);
      setIsProcessingComplete(true);
    }
  };
  
  // Handle play/pause
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      
      setIsPlaying(!isPlaying);
    }
  };
  
  // Handle position click
  const handlePositionClick = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  // Handle audio ended
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };
  
  return (
    <div className={`beat-detection-demo ${className}`}>
      <h2>Audio Beat Detection Demo</h2>
      
      <div className="audio-input-section" style={{ marginBottom: '20px' }}>
        <input 
          type="file" 
          accept="audio/*" 
          onChange={handleFileSelect} 
          style={{ marginBottom: '10px' }}
        />
        
        {audioUrlRef.current && (
          <div className="audio-player" style={{ marginTop: '10px' }}>
            <audio 
              ref={audioRef} 
              controls={false} 
              onEnded={handleAudioEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            <button 
              onClick={handlePlayPause}
              style={{
                padding: '8px 16px',
                backgroundColor: isPlaying ? '#f44336' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <span>
              {formatTime(currentTime)} / {audioBuffer ? formatTime(audioBuffer.duration) : '0:00'}
            </span>
          </div>
        )}
      </div>
      
      <div className="processing-section" style={{ marginBottom: '20px' }}>
        <AudioProcessingProgress
          progress={progress}
          step={processingStep}
          isComplete={isProcessingComplete}
          error={error || undefined}
        />
      </div>
      
      {bpm !== null && (
        <div className="bpm-display" style={{ marginBottom: '20px' }}>
          <h3>Detected BPM: {bpm}</h3>
        </div>
      )}
      
      <div className="waveform-section">
        <WaveformVisualizer
          audioBuffer={audioBuffer || undefined}
          waveformData={waveformData || undefined}
          beats={beats}
          currentTime={currentTime}
          width={width}
          height={height}
          showBeats={true}
          showPosition={true}
          onPositionClick={handlePositionClick}
        />
      </div>
      
      {analysisResults && (
        <div className="analysis-results" style={{ marginTop: '20px' }}>
          <h3>Analysis Results</h3>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
            <pre>{safeStringify(analysisResults, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Format time in seconds to MM:SS format
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default BeatDetectionDemo;
