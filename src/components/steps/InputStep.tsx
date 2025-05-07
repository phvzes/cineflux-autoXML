import { useState, useRef, ChangeEvent } from 'react';
import { Music, Video, ArrowRight } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

export const InputStep: React.FC = () => {
  const { state, dispatch } = useProject();
  const { musicFile, videoFiles } = state;
  const [dragActive, setDragActive] = useState(false);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Handle music file selection
  const handleMusicSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      dispatch({ type: 'SET_MUSIC_FILE', payload: file });
    }
  };
  
  // Handle video file selection
  const handleVideoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      dispatch({ type: 'SET_VIDEO_FILES', payload: [...videoFiles, ...newFiles] });
    }
  };
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      
      // Separate audio and video files
      const audioFiles = files.filter(file => file.type.startsWith('audio/'));
      const newVideoFiles = files.filter(file => file.type.startsWith('video/'));
      
      // Set music file (take the first audio file)
      if (audioFiles.length > 0 && !musicFile) {
        dispatch({ type: 'SET_MUSIC_FILE', payload: audioFiles[0] });
      }
      
      // Add video files
      if (newVideoFiles.length > 0) {
        dispatch({ type: 'SET_VIDEO_FILES', payload: [...videoFiles, ...newVideoFiles] });
      }
    }
  };
  
  // Remove a video file
  const removeVideoFile = (index: number) => {
    const newFiles = [...videoFiles];
    newFiles.splice(index, 1);
    dispatch({ type: 'SET_VIDEO_FILES', payload: newFiles });
  };
  
  // Remove music file
  const removeMusicFile = () => {
    dispatch({ type: 'SET_MUSIC_FILE', payload: null });
  };
  
  // Start analysis
  const startAnalysis = () => {
    if (musicFile && videoFiles.length > 0) {
      dispatch({ type: 'SET_STEP', payload: 'analyzing' });
      dispatch({ type: 'SET_ANALYZING', payload: true });
      
      // In a real app, this would trigger the analysis process
      // For now, we'll simulate it with a timeout
      setTimeout(() => {
        dispatch({ type: 'SET_ANALYZING', payload: false });
        dispatch({ type: 'SET_STEP', payload: 'editing' });
        
        // Set dummy edit decisions for demonstration
        dispatch({ 
          type: 'SET_EDIT_DECISIONS', 
          payload: [
            { time: 0, videoId: '1', sceneIndex: 0, start: 0, duration: 2.5 },
            { time: 2.5, videoId: '2', sceneIndex: 1, start: 5, duration: 3 },
            { time: 5.5, videoId: '1', sceneIndex: 2, start: 10, duration: 4 },
          ] 
        });
      }, 3000);
    }
  };
  
  return (
    <div 
      className="flex flex-col items-center justify-center h-full p-8"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <div className={`w-full max-w-3xl p-8 rounded-lg border-2 border-dashed transition-colors ${
        dragActive ? 'border-[#FF7A45] bg-[#1E1E24]' : 'border-[#2A2A30] bg-[#1E1E24]'
      }`}>
        <h1 className="text-2xl font-bold mb-6 text-center">Create a New Project</h1>
        
        {/* Music File Section */}
        <div className="mb-8">
          <h2 className="text-xl mb-4 flex items-center">
            <Music className="mr-2" size={20} />
            Music Track
          </h2>
          
          {musicFile ? (
            <div className="bg-[#2A2A30] p-4 rounded flex justify-between items-center">
              <div>
                <p className="font-medium">{musicFile.name}</p>
                <p className="text-sm text-[#B0B0B5]">
                  {(musicFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button 
                className="text-[#E53935] hover:text-red-400"
                onClick={removeMusicFile}
              >
                Remove
              </button>
            </div>
          ) : (
            <button 
              className="w-full py-6 border-2 border-dashed border-[#2A2A30] rounded-lg hover:border-[#FF7A45] transition-colors flex flex-col items-center justify-center"
              onClick={() => musicInputRef.current?.click()}
            >
              <Music size={32} className="mb-2 text-[#FF7A45]" />
              <p>Click to select a music file</p>
              <p className="text-sm text-[#B0B0B5] mt-1">MP3, WAV, or M4A</p>
              <input 
                type="file" 
                ref={musicInputRef}
                className="hidden" 
                accept="audio/*"
                onChange={handleMusicSelect}
              />
            </button>
          )}
        </div>
        
        {/* Video Files Section */}
        <div className="mb-8">
          <h2 className="text-xl mb-4 flex items-center">
            <Video className="mr-2" size={20} />
            Video Clips
          </h2>
          
          <div className="space-y-4">
            {videoFiles.map((file, index) => (
              <div key={index} className="bg-[#2A2A30] p-4 rounded flex justify-between items-center">
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-[#B0B0B5]">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button 
                  className="text-[#E53935] hover:text-red-400"
                  onClick={() => removeVideoFile(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            
            <button 
              className="w-full py-6 border-2 border-dashed border-[#2A2A30] rounded-lg hover:border-[#FF7A45] transition-colors flex flex-col items-center justify-center"
              onClick={() => videoInputRef.current?.click()}
            >
              <Video size={32} className="mb-2 text-[#FF7A45]" />
              <p>Click to add video clips</p>
              <p className="text-sm text-[#B0B0B5] mt-1">MP4, MOV, or MKV</p>
              <input 
                type="file" 
                ref={videoInputRef}
                className="hidden" 
                accept="video/*"
                multiple
                onChange={handleVideoSelect}
              />
            </button>
          </div>
        </div>
        
        {/* Start Button */}
        <button 
          className={`w-full py-3 rounded-lg flex items-center justify-center ${
            musicFile && videoFiles.length > 0
              ? 'bg-[#FF7A45] hover:bg-[#FF6A35] text-white'
              : 'bg-[#2A2A30] text-[#B0B0B5] cursor-not-allowed'
          }`}
          disabled={!musicFile || videoFiles.length === 0}
          onClick={startAnalysis}
        >
          Start Analysis
          <ArrowRight className="ml-2" size={18} />
        </button>
      </div>
    </div>
  );
};
