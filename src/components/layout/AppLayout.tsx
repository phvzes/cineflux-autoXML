import { ReactNode } from 'react';
import { FileText, Save, FolderOpen, FileUp } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

interface AppLayoutProps {
  children: ReactNode;
  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onExport: () => void;
  onHelpClick?: () => void;
  renderWorkflowStepper?: () => ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onExport,
  _onHelpClick,
  _renderWorkflowStepper
}: any) => {
  const { state } = useProject();
  const { currentStep, isAnalyzing: _isAnalyzing, editDecisions, videoFiles: _videoFiles } = state;
  
  // Determine if export should be enabled
  const exportEnabled = currentStep !== 'input' && !_isAnalyzing && editDecisions.length > 0;
  
  // Check if we're on the welcome page
  const isWelcomePage = currentStep === 'welcome';
  
  return (
    <div className="flex flex-col h-screen bg-primary text-primary">
      {/* Toolbar - Only show when not on welcome page */}
      {!isWelcomePage && (
        <div className="bg-secondary p-md flex items-center gap-md shadow-md">
          <button 
            className="toolbar-button"
            onClick={onNewProject}
            disabled={_isAnalyzing}
            aria-label="New Project"
          >
            <FileText size={24} className={_isAnalyzing ? 'text-secondary' : ''} />
          </button>
          <button 
            className="toolbar-button"
            onClick={onOpenProject}
            disabled={_isAnalyzing}
            aria-label="Open Project"
          >
            <FolderOpen size={24} className={_isAnalyzing ? 'text-secondary' : ''} />
          </button>
          <button 
            className="toolbar-button"
            onClick={onSaveProject}
            disabled={_isAnalyzing || currentStep === 'input'}
            aria-label="Save Project"
          >
            <Save size={24} className={_isAnalyzing || currentStep === 'input' ? 'text-secondary' : ''} />
          </button>
          <div className="ml-md text-xl font-semibold">Auto-Editor</div>
          <div className="flex-grow"></div>
          <button 
            className={`export-button ${!exportEnabled ? 'disabled' : ''}`}
            onClick={onExport}
            disabled={!exportEnabled}
            aria-label="Export to Premiere"
          >
            <FileUp className="inline mr-sm" size={16} />
            Export to Premiere
          </button>
        </div>
      )}
      
      {/* Main Content */}
      <div className={`flex-grow overflow-auto ${isWelcomePage ? 'bg-[#121218]' : 'bg-primary'}`}>
        {children}
      </div>
      
      {/* Footer - Only show when not on welcome page */}
      {!isWelcomePage && (
        <div className="bg-secondary p-sm flex items-center">
          <div className="text-secondary text-sm">
            {renderStatusText(state)}
          </div>
          
          {/* Progress bar for analysis */}
          {currentStep === 'analyzing' && (
            <div className="ml-auto">
              <div className="progress-bar-container w-32">
                <div 
                  className="progress-bar"
                  style={{width: `${state.analysisProgress.progress}%`}}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to render status text
function renderStatusText(state: any) {
  const { currentStep, isAnalyzing: _isAnalyzing, editDecisions, videoFiles: _videoFiles, currentTime } = state;
  
  switch (currentStep) {
    case 'welcome':
      return "Welcome to CineFlux-AutoXML";
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
