import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Video, Upload, Loader } from 'lucide-react';
import VideoService, { VideoProcessingResult } from '../services/VideoService';
import VideoAnalysisVisualizer from '../components/video/VideoAnalysisVisualizer';

/**
 * Test page for video processing functionality
 */
const VideoProcessingTest: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [processingResult, setProcessingResult] = useState<VideoProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  
  // Handle file drop
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'video/*': ['.mp4', '.webm', '.mov', '.avi']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setVideoFile(file);
        
        // Create object URL for the video
        if (videoUrlRef.current) {
          URL.revokeObjectURL(videoUrlRef.current);
        }
        videoUrlRef.current = URL.createObjectURL(file);
        
        // Reset state
        setProcessingResult(null);
        setError(null);
        setIsProcessing(false);
        setProcessingProgress(0);
        setProcessingStep('');
        setCurrentTime(0);
        setIsPlaying(false);
      }
    }
  });
  
  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
    };
  }, []);
  
  // Handle video processing
  const processVideo = async () => {
    if (!videoFile) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStep('Initializing...');
    setError(null);
    
    try {
      const result = await VideoService.processVideo(videoFile, {
        framesPerSecond: 1,
        sceneThreshold: 0.4,
        maxFrames: 300,
        thumbnailWidth: 320,
        thumbnailHeight: 180,
        onProgress: (progress, step) => {
          setProcessingProgress(progress);
          setProcessingStep(step);
        }
      });
      
      setProcessingResult(result);
    } catch (error) {
      console.error('Error processing video:', error);
      setError(`Failed to process video: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle play/pause toggle
  const handlePlayPauseToggle = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => {
        console.error('Playback failed:', error);
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle seeking
  const handleSeek = (timeInSeconds: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = timeInSeconds;
    setCurrentTime(timeInSeconds);
  };
  
  // Update current time during playback
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    setCurrentTime(videoRef.current.currentTime);
  };
  
  // Handle video ended
  const handleEnded = () => {
    setIsPlaying(false);
  };
  
  return (
    <div className="video-processing-test p-6">
      <h1 className="text-2xl font-bold mb-6">Video Processing Test</h1>
      
      <p className="mb-6">
        This page demonstrates the video processing functionality using FFmpeg.wasm.
        You can upload a video file to extract frames, detect scenes, and generate thumbnails.
      </p>
      
      {/* Video upload area */}
      {!videoFile && (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 mb-6 ${
            isDragActive ? 'border-[#FF7A45] bg-[#FF7A45]/10' : 'border-[#3A3A40] hover:border-[#FF7A45]/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-4 text-[#FF7A45]" size={48} />
          <p className="text-lg mb-2">Drag & drop a video file here, or click to select</p>
          <p className="text-sm text-[#B0B0B5]">
            Supported formats: MP4, WebM, MOV, AVI
          </p>
        </div>
      )}
      
      {/* Video preview */}
      {videoFile && videoUrlRef.current && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Video Preview</h2>
            
            {!isProcessing && !processingResult && (
              <button
                className="px-4 py-2 bg-[#FF7A45] hover:bg-[#FF8C5A] text-white rounded-md flex items-center"
                onClick={processVideo}
              >
                <Video className="mr-2" size={16} />
                Process Video
              </button>
            )}
          </div>
          
          <div className="bg-[#1E1E24] p-4 rounded-lg">
            <video
              ref={videoRef}
              src={videoUrlRef.current}
              className="w-full max-h-[400px] rounded-md"
              controls={!processingResult} // Hide controls when using our custom UI
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
            />
            
            <div className="mt-4">
              <p className="font-medium">{videoFile.name}</p>
              <p className="text-sm text-[#B0B0B5]">
                {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Processing progress */}
      {isProcessing && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Processing Video</h2>
          
          <div className="bg-[#1E1E24] p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Loader className="mr-2 text-[#FF7A45] animate-spin" size={20} />
              <p className="text-[#F5F5F7]">{processingStep}</p>
            </div>
            
            <div className="w-full bg-[#2A2A30] rounded-full h-4 mb-2">
              <div 
                className="bg-[#FF7A45] h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            
            <p className="text-right text-sm text-[#B0B0B5]">
              {processingProgress.toFixed(0)}%
            </p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      
      {/* Processing results */}
      {processingResult && videoFile && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Video Analysis Results</h2>
          
          <VideoAnalysisVisualizer
            videoFile={videoFile}
            thumbnails={processingResult.thumbnails}
            sceneBoundaries={processingResult.scenes.map(scene => scene.startTime)}
            duration={processingResult.metadata.duration}
            onSeek={handleSeek}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onPlayPauseToggle={handlePlayPauseToggle}
          />
        </div>
      )}
      
      {/* How it works section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        
        <div className="bg-[#1E1E24] p-6 rounded-lg">
          <p className="mb-4">
            The video processing functionality is implemented using FFmpeg.wasm, which brings the power of FFmpeg to the browser through WebAssembly.
          </p>
          
          <h3 className="text-lg font-medium mb-2">Processing Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 mb-6">
            <li>The video file is loaded and processed using FFmpeg.wasm</li>
            <li>Frames are extracted at regular intervals (1 frame per second by default)</li>
            <li>Scene changes are detected using FFmpeg's scene detection filter</li>
            <li>Thumbnails are generated from the extracted frames</li>
            <li>The results are displayed in the visualization component</li>
          </ol>
          
          <h3 className="text-lg font-medium mb-2">Features:</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Frame extraction at customizable intervals</li>
            <li>Scene detection with adjustable threshold</li>
            <li>Thumbnail generation for visual preview</li>
            <li>Interactive timeline with scene markers</li>
            <li>Progress tracking during processing</li>
            <li>Error handling for robust operation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VideoProcessingTest;
