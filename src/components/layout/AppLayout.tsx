import { ReactNode } from 'react';
import { FileText, Save, FolderOpen, FileUp } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

interface AppLayoutProps {
  children: ReactNode;
  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onExport: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onExport
}) => {
  const { state } = useProject();
  const { currentStep, isAnalyzing, editDecisions } = state;
  
  // Determine if export should be enabled
  const exportEnabled = currentStep !== 'input' && !isAnalyzing && editDecisions.length > 0;
  
  return (
    <div className="flex flex-col h-screen bg-[#121218] text-[#F5F5F7]">
      {/* Toolbar */}
      <div className="bg-[#1E1E24] p-4 flex items-center gap-4 shadow-md">
        <button 
          className="p-2 hover:bg-[#2A2A30] rounded" 
          onClick={onNewProject}
          disabled={isAnalyzing}
        >
          <FileText size={24} className={isAnalyzing ? 'text-[#B0B0B5]' : ''} />
        </button>
        <button 
          className="p-2 hover:bg-[#2A2A30] rounded" 
          onClick={onOpenProject}
          disabled={isAnalyzing}
        >
          <FolderOpen size={24} className={isAnalyzing ? 'text-[#B0B0B5]' : ''} />
        </button>
        <button 
          className="p-2 hover:bg-[#2A2A30] rounded" 
          onClick={onSaveProject}
          disabled={isAnalyzing || currentStep === 'input'}
        >
          <Save size={24} className={isAnalyzing || currentStep === 'input' ? 'text-[#B0B0B5]' : ''} />
        </button>
        <div className="ml-4 text-xl font-semibold">Auto-Editor</div>
        <div className="flex-grow"></div>
        <button 
          className={`px-4 py-2 rounded flex items-center ${
            exportEnabled ? 'bg-[#FF7A45] hover:bg-[#FF6A35]' : 'bg-[#2A2A30] text-[#B0B0B5] cursor-not-allowed'
          }`}
          onClick={onExport}
          disabled={!exportEnabled}
        >
          <FileUp className="inline mr-2" size={16} />
          Export to Premiere
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow overflow-auto bg-[#121218]">
        {children}
      </div>
      
      {/* Footer */}
      <div className="bg-[#1E1E24] p-2 flex items-center">
        <div className="text-[#B0B0B5] text-sm">
          {renderStatusText(state)}
        </div>
        
        {/* Progress bar for analysis */}
        {currentStep === 'analyzing' && (
          <div className="ml-auto">
            <div className="w-32 bg-[#2A2A30] rounded-full h-2">
              <div 
                className="bg-[#FF7A45] h-2 rounded-full" 
                style={{width: `${state.analysisProgress.progress}%`}}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to render status text
function renderStatusText(state: any) {
  const { currentStep, isAnalyzing, editDecisions, videoFiles, currentTime } = state;
  
  switch (currentStep) {
    case 'input':
      return "Ready";
    case 'analyzing':
      return "Analyzing media files...";
    case 'editing':
      return `Edit ready - ${editDecisions.length} cuts created`;
    case 'preview':
      // Find current edit index
      let currentIndex = 0;
      for (let i = editDecisions.length - 1; i >= 0; i--) {
        if (currentTime >= editDecisions[i].time) {
          currentIndex = i;
          break;
        }
      }
      return `Preview - Clip ${currentIndex + 1} of ${editDecisions.length}`;
    default:
      return "Ready";
  }
}
