import { useEffect } from 'react';
import { Music, Video, Waveform, AlertCircle } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { useAnalysis } from '@/context/AnalysisContext';
import editDecisionEngine from '@/engine/EditDecisionEngine';

export const AnalysisStep: React.FC = () => {
  const { state, dispatch } = useProject();
  const { musicFile, videoFiles } = state;
  const { state: analysisState, dispatch: analysisDispatch } = useAnalysis();
  
  // Generate edit decisions when audio and video analyses are complete
  useEffect(() => {
    const { audioAnalysis, videoAnalyses, isProcessing, error } = analysisState;
    
    // Skip if there's an error or we're still processing
    if (error || isProcessing) return;
    
    // Skip if we don't have both audio and video analyses
    if (!audioAnalysis || Object.keys(videoAnalyses).length === 0) return;
    
    // Skip if we already have edit decisions
    if (analysisState.editDecisionResult) return;
    
    // Start generating edit decisions
    try {
      analysisDispatch({
        type: 'START_PROCESSING',
        payload: { step: 'Generating edit decisions...' }
      });
      
      // Configure the edit decision engine
      editDecisionEngine.setAudioAnalysis(audioAnalysis);
      
      // Add each video analysis
      Object.entries(videoAnalyses).forEach(([id, analysis]) => {
        editDecisionEngine.addVideoAnalysis(id, analysis);
      });
      
      // Generate edit decisions
      const editDecisionResult = editDecisionEngine.generateEditDecisions();
      
      // Store the result
      analysisDispatch({
        type: 'SET_EDIT_DECISION_RESULT',
        payload: editDecisionResult
      });
      
      // Update project state with edit decisions
      const editDecisions = editDecisionResult.edl.clips.map((clip, index) => ({
        time: clip.timelineInPoint,
        videoId: clip.sourceId,
        sceneIndex: index,
        start: clip.sourceInPoint,
        duration: clip.timelineOutPoint - clip.timelineInPoint
      }));
      
      dispatch({
        type: 'SET_EDIT_DECISIONS',
        payload: editDecisions
      });
      
      // Finish processing
      analysisDispatch({ type: 'FINISH_PROCESSING' });
      
      // Move to editing step
      setTimeout(() => {
        dispatch({ type: 'SET_ANALYZING', payload: false });
        dispatch({ type: 'SET_STEP', payload: 'editing' });
      }, 500);
    } catch (error) {
      console.error('Error generating edit decisions:', error);
      
      analysisDispatch({
        type: 'SET_ERROR',
        payload: `Error generating edit decisions: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }, [analysisState, dispatch, analysisDispatch]);
  
  // Render error state if there's an error
  if (analysisState.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="w-full max-w-2xl">
          <div className="bg-[#3A1A1A] border border-[#E53935] p-6 rounded-lg mb-8">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-[#E53935] mr-3" size={24} />
              <h2 className="text-xl font-bold text-[#F5F5F7]">Analysis Error</h2>
            </div>
            <p className="text-[#F5F5F7] mb-4">{analysisState.error}</p>
            <button
              className="bg-[#2A2A30] hover:bg-[#3A3A40] text-[#F5F5F7] py-2 px-4 rounded"
              onClick={() => {
                analysisDispatch({ type: 'CLEAR_ERROR' });
                dispatch({ type: 'SET_ANALYZING', payload: false });
                dispatch({ type: 'SET_STEP', payload: 'input' });
              }}
            >
              Return to Input Step
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-8 text-center">Analyzing Media</h1>
        
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Waveform className="mr-2 text-[#FF7A45]" size={20} />
            <p className="text-[#F5F5F7]">{analysisState.processingStep}</p>
          </div>
          
          <div className="w-full bg-[#2A2A30] rounded-full h-4 mb-6">
            <div 
              className="bg-[#FF7A45] h-4 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${analysisState.progress}%` }}
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
              {analysisState.audioAnalysis && (
                <div className="ml-auto bg-[#2A2A30] px-3 py-1 rounded text-sm">
                  <span className="text-[#FF7A45]">✓</span> Analyzed
                </div>
              )}
            </div>
          )}
          
          {/* Video files info */}
          {videoFiles.map((file, index) => {
            const videoId = `video_${index}`;
            const isAnalyzed = analysisState.videoAnalyses[videoId] !== undefined;
            
            return (
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
                {isAnalyzed && (
                  <div className="ml-auto bg-[#2A2A30] px-3 py-1 rounded text-sm">
                    <span className="text-[#FF7A45]">✓</span> Analyzed
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Analysis details */}
        {analysisState.audioAnalysis && (
          <div className="mt-8 bg-[#1E1E24] p-4 rounded-lg">
            <h2 className="text-lg font-medium mb-2">Audio Analysis Results</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#B0B0B5]">Detected Beats</p>
                <p className="font-medium">{analysisState.audioAnalysis.beats.beats.length}</p>
              </div>
              <div>
                <p className="text-sm text-[#B0B0B5]">Tempo</p>
                <p className="font-medium">{analysisState.audioAnalysis.tempo.bpm} BPM</p>
              </div>
            </div>
          </div>
        )}
        
        {Object.keys(analysisState.videoAnalyses).length > 0 && (
          <div className="mt-4 bg-[#1E1E24] p-4 rounded-lg">
            <h2 className="text-lg font-medium mb-2">Video Analysis Results</h2>
            <div>
              <p className="text-sm text-[#B0B0B5]">Detected Scenes</p>
              <p className="font-medium">
                {Object.values(analysisState.videoAnalyses).reduce(
                  (total, analysis) => total + analysis.scenes.length, 
                  0
                )}
              </p>
            </div>
          </div>
        )}
        
        <p className="text-center mt-8 text-[#B0B0B5]">
          {analysisState.isProcessing 
            ? "This may take a few minutes depending on the size of your files"
            : "Analysis complete. Generating edit decisions..."}
        </p>
      </div>
    </div>
  );
};
