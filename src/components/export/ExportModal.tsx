import { useState } from 'react';
import { X, FileUp, Check, Folder } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  editDecisions: any[];
  videoFiles: Record<string, File>;
  audioFile: File | null;
  settings: any;
  duration: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  editDecisions,
  videoFiles,
  audioFile,
  settings,
  duration
}) => {
  const [exportFormat, setExportFormat] = useState('premiere');
  const [includeAudio, setIncludeAudio] = useState(true);
  const [outputPath, setOutputPath] = useState('/User/username/Documents/Projects/My Music Video');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  
  if (!isOpen) return null;
  
  // Handle export
  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate export progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setExportProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setExportComplete(true);
      }
    }, 100);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E1E24] rounded-lg w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A30]">
          <h2 className="text-xl font-bold">Export Project</h2>
          <button 
            className="p-2 rounded-full hover:bg-[#2A2A30]"
            onClick={onClose}
            disabled={isExporting && !exportComplete}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {!isExporting ? (
            <>
              <div className="mb-6">
                <label className="block text-sm text-[#B0B0B5] mb-2">Export Format</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    className={`p-4 rounded-lg flex flex-col items-center ${
                      exportFormat === 'premiere' ? 'bg-[#2A2A30] border border-[#FF7A45]' : 'bg-[#2A2A30] border border-transparent'
                    }`}
                    onClick={() => setExportFormat('premiere')}
                  >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Adobe_Premiere_Pro_CC_icon.svg/512px-Adobe_Premiere_Pro_CC_icon.svg.png" 
                      alt="Premiere Pro"
                      className="w-12 h-12 mb-2"
                    />
                    <span>Premiere Pro XML</span>
                  </button>
                  
                  <button 
                    className={`p-4 rounded-lg flex flex-col items-center ${
                      exportFormat === 'fcpx' ? 'bg-[#2A2A30] border border-[#FF7A45]' : 'bg-[#2A2A30] border border-transparent'
                    }`}
                    onClick={() => setExportFormat('fcpx')}
                  >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/2015_Final_Cut_Pro_Logo.png/240px-2015_Final_Cut_Pro_Logo.png" 
                      alt="Final Cut Pro"
                      className="w-12 h-12 mb-2"
                    />
                    <span>Final Cut Pro XML</span>
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm text-[#B0B0B5] mb-2">Options</label>
                <div className="bg-[#2A2A30] p-4 rounded-lg">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={includeAudio}
                      onChange={() => setIncludeAudio(!includeAudio)}
                      className="mr-2"
                    />
                    Include music track in export
                  </label>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm text-[#B0B0B5] mb-2">Output Location</label>
                <div className="flex">
                  <input 
                    type="text"
                    value={outputPath}
                    onChange={(e) => setOutputPath(e.target.value)}
                    className="flex-grow bg-[#2A2A30] p-2 rounded-l-lg"
                  />
                  <button className="bg-[#2A2A30] p-2 rounded-r-lg border-l border-[#121218]">
                    <Folder size={20} />
                  </button>
                </div>
              </div>
              
              <div className="bg-[#2A2A30] p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-2">Export Summary</h3>
                <p className="text-sm mb-1">
                  <span className="text-[#B0B0B5]">Total clips: </span>
                  {editDecisions.length}
                </p>
                <p className="text-sm mb-1">
                  <span className="text-[#B0B0B5]">Duration: </span>
                  {formatTime(duration)}
                </p>
                <p className="text-sm">
                  <span className="text-[#B0B0B5]">Format: </span>
                  {exportFormat === 'premiere' ? 'Adobe Premiere Pro XML' : 'Final Cut Pro XML'}
                </p>
              </div>
            </>
          ) : (
            <div className="py-4">
              {!exportComplete ? (
                <>
                  <div className="mb-4 text-center">
                    <p className="mb-2">Exporting project...</p>
                    <p className="text-sm text-[#B0B0B5]">
                      {exportFormat === 'premiere' ? 'Creating Adobe Premiere Pro XML' : 'Creating Final Cut Pro XML'}
                    </p>
                  </div>
                  
                  <div className="w-full bg-[#2A2A30] rounded-full h-4 mb-2">
                    <div 
                      className="bg-[#FF7A45] h-4 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${exportProgress}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-sm text-center text-[#B0B0B5]">
                    {exportProgress}% complete
                  </p>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4CAF50] mb-4">
                    <Check size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Export Complete!</h3>
                  <p className="text-[#B0B0B5] mb-4">
                    Your project has been exported successfully.
                  </p>
                  <p className="text-sm mb-6">
                    {exportFormat === 'premiere' ? 'Adobe Premiere Pro XML' : 'Final Cut Pro XML'} file saved to:
                    <br />
                    <span className="font-mono bg-[#2A2A30] px-2 py-1 rounded mt-1 inline-block">
                      {outputPath}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-[#2A2A30]">
          {!isExporting ? (
            <>
              <button 
                className="px-4 py-2 rounded-lg text-[#F5F5F7] hover:bg-[#2A2A30] mr-2"
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-[#FF7A45] hover:bg-[#FF6A35] rounded-lg flex items-center"
                onClick={handleExport}
              >
                <FileUp size={18} className="mr-2" />
                Export
              </button>
            </>
          ) : (
            exportComplete && (
              <button 
                className="px-4 py-2 bg-[#2A2A30] hover:bg-[#3A3A40] rounded-lg"
                onClick={onClose}
              >
                Close
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
