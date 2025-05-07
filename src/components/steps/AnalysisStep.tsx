import { useEffect } from 'react';
import { Music, Video, Waveform } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

export const AnalysisStep: React.FC = () => {
  const { state, dispatch } = useProject();
  const { musicFile, videoFiles, analysisProgress } = state;
  
  // Simulate analysis progress
  useEffect(() => {
    let progress = 0;
    const steps = [
      'Analyzing audio waveform...',
      'Detecting beats and segments...',
      'Analyzing video content...',
      'Detecting scenes and transitions...',
      'Generating edit suggestions...'
    ];
    
    const interval = setInterval(() => {
      progress += 2;
      const stepIndex = Math.min(Math.floor(progress / 20), steps.length - 1);
      
      dispatch({
        type: 'SET_ANALYSIS_PROGRESS',
        payload: {
          progress,
          step: steps[stepIndex]
        }
      });
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Set dummy analysis data
        dispatch({
          type: 'SET_AUDIO_ANALYSIS',
          payload: {
            beats: [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0],
            segments: [
              { start: 0, duration: 1.5, energy: 0.7 },
              { start: 1.5, duration: 1.5, energy: 0.9 }
            ]
          }
        });
        
        // Set dummy video analyses
        const analyses: Record<string, any> = {};
        videoFiles.forEach((file, index) => {
          analyses[`video_${index}`] = {
            clip: {
              name: file.name,
              duration: 30
            },
            scenes: [
              { start: 0, end: 5, energy: 0.5 },
              { start: 5, end: 10, energy: 0.8 },
              { start: 10, end: 15, energy: 0.3 }
            ]
          };
        });
        
        dispatch({ type: 'SET_VIDEO_ANALYSES', payload: analyses });
        
        // Set dummy edit decisions
        dispatch({
          type: 'SET_EDIT_DECISIONS',
          payload: [
            { time: 0, videoId: 'video_0', sceneIndex: 0, start: 0, duration: 2.5 },
            { time: 2.5, videoId: 'video_1', sceneIndex: 1, start: 5, duration: 3 },
            { time: 5.5, videoId: 'video_0', sceneIndex: 2, start: 10, duration: 4 }
          ]
        });
        
        // Move to editing step
        setTimeout(() => {
          dispatch({ type: 'SET_ANALYZING', payload: false });
          dispatch({ type: 'SET_STEP', payload: 'editing' });
        }, 500);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [dispatch, videoFiles]);
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-8 text-center">Analyzing Media</h1>
        
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Waveform className="mr-2 text-[#FF7A45]" size={20} />
            <p className="text-[#F5F5F7]">{analysisProgress.step}</p>
          </div>
          
          <div className="w-full bg-[#2A2A30] rounded-full h-4 mb-6">
            <div 
              className="bg-[#FF7A45] h-4 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${analysisProgress.progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Music file info */}
          {musicFile && (
            <div className="bg-[#1E1E24] p-4 rounded-lg flex items-center">
              <div className="bg-[#2A2A30] p-3 rounded-lg mr-4">
                <Music className="text-[#FF7A45]" size={24} />
              </div>
              <div>
                <p className="font-medium">{musicFile.name}</p>
                <p className="text-sm text-[#B0B0B5]">
                  {(musicFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
          
          {/* Video files info */}
          {videoFiles.map((file, index) => (
            <div key={index} className="bg-[#1E1E24] p-4 rounded-lg flex items-center">
              <div className="bg-[#2A2A30] p-3 rounded-lg mr-4">
                <Video className="text-[#FF7A45]" size={24} />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-[#B0B0B5]">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-center mt-8 text-[#B0B0B5]">
          This may take a few minutes depending on the size of your files
        </p>
      </div>
    </div>
  );
};
