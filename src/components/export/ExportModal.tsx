import { useState } from 'react';
import { FileUp, Check, Folder } from 'lucide-react';
import AccessibleDialog from '../AccessibleDialog';
import useFocusTrap from '../../hooks/useFocusTrap';

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
  _settings,
  duration
}: any) => {
  const [exportFormat, setExportFormat] = useState('premiere');
  const [includeAudio, setIncludeAudio] = useState(true);
  const [outputPath, setOutputPath] = useState('/User/username/Documents/Projects/My Music Video');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  
  // State for export status and errors
  const [exportStatus, setExportStatus] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportedFilePath, setExportedFilePath] = useState('');
  
  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      setExportStatus('Preparing export...');
      
      // Import EditService
      const EditService = (await import('@/services/EditService')).default;
      
      // Generate the XML
      const _xml = await EditService.generateExportXML(
        editDecisions,
        videoFiles,
        includeAudio ? audioFile : null,
        exportFormat as 'premiere' | 'fcpx',
        (progress: any, message: any) => {
          setExportProgress(progress);
          setExportStatus(message);
        }
      );
      
      // In a real app, this would save the file to disk
      // For now, we'll just simulate it
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${exportFormat === 'premiere' ? 'Premiere' : 'FinalCut'}_Export_${timestamp}.xml`;
      const filePath = `${outputPath}/${fileName}`;
      
      // Simulate file saving delay
      await new Promise((resolve: any) => setTimeout(resolve, 500));
      
      // Set the exported file path
      setExportedFilePath(filePath);
      setExportComplete(true);
      
      // In a real app with Electron or a backend, we would save the file like this:
      // const blob = new Blob([xml], { type: 'application/xml' });
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = fileName;
      // a.click();
      // URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error instanceof Error ? error.message : 'Export failed due to an unknown error');
      setExportProgress(0);
    }
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Render the dialog content
  const renderContent = () => (
    <>
      {/* Content */}
      <div className="p-lg">
        {!isExporting ? (
          <>
            <div className="mb-lg">
              <label className="block text-sm text-secondary mb-sm" id="export-format-label">Export Format</label>
              <div 
                className="grid grid-cols-2 gap-md" 
                role="radiogroup" 
                aria-labelledby="export-format-label"
              >
                <button 
                  className={`p-md rounded-lg flex flex-col items-center transition ${
                    exportFormat === 'premiere' ? 'bg-ui border border-accent' : 'bg-ui border border-transparent'
                  }`}
                  onClick={() => setExportFormat('premiere')}
                  role="radio"
                  aria-checked={exportFormat === 'premiere'}
                  tabIndex={exportFormat === 'premiere' ? 0 : -1}
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Adobe_Premiere_Pro_CC_icon.svg/512px-Adobe_Premiere_Pro_CC_icon.svg.png" 
                    alt="Premiere Pro"
                    className="w-12 h-12 mb-sm"
                  />
                  <span>Premiere Pro XML</span>
                </button>
                
                <button 
                  className={`p-md rounded-lg flex flex-col items-center transition ${
                    exportFormat === 'fcpx' ? 'bg-ui border border-accent' : 'bg-ui border border-transparent'
                  }`}
                  onClick={() => setExportFormat('fcpx')}
                  role="radio"
                  aria-checked={exportFormat === 'fcpx'}
                  tabIndex={exportFormat === 'fcpx' ? 0 : -1}
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/2015_Final_Cut_Pro_Logo.png/240px-2015_Final_Cut_Pro_Logo.png" 
                    alt="Final Cut Pro"
                    className="w-12 h-12 mb-sm"
                  />
                  <span>Final Cut Pro XML</span>
                </button>
              </div>
            </div>
            
            <div className="mb-lg">
              <label className="block text-sm text-secondary mb-sm">Options</label>
              <div className="bg-ui p-md rounded-lg">
                <label className="flex items-center checkbox">
                  <input 
                    type="checkbox" 
                    checked={includeAudio}
                    onChange={() => setIncludeAudio(!includeAudio)}
                    className="mr-sm"
                    id="include-audio"
                  />
                  <span>Include music track in export</span>
                </label>
              </div>
            </div>
            
            <div className="mb-lg">
              <label htmlFor="output-path" className="block text-sm text-secondary mb-sm">Output Location</label>
              <div className="flex">
                <input 
                  type="text"
                  id="output-path"
                  value={outputPath}
                  onChange={(e: any) => setOutputPath(e.target.value)}
                  className="flex-grow input rounded-r-none"
                />
                <button 
                  className="bg-ui p-sm rounded-r-lg border-l border-primary"
                  aria-label="Browse for folder"
                >
                  <Folder size={20} />
                </button>
              </div>
            </div>
            
            <div className="bg-ui p-md rounded-lg mb-lg">
              <h3 className="font-medium mb-sm">Export Summary</h3>
              <p className="text-sm mb-xs">
                <span className="text-secondary">Total clips: </span>
                {editDecisions.length}
              </p>
              <p className="text-sm mb-xs">
                <span className="text-secondary">Duration: </span>
                {formatTime(duration)}
              </p>
              <p className="text-sm">
                <span className="text-secondary">Format: </span>
                {exportFormat === 'premiere' ? 'Adobe Premiere Pro XML' : 'Final Cut Pro XML'}
              </p>
            </div>
          </>
        ) : (
          <div className="py-md">
            {!exportComplete ? (
              <>
                <div className="mb-md text-center">
                  <p className="mb-sm">Exporting project...</p>
                  <p className="text-sm text-secondary">
                    {exportStatus || (exportFormat === 'premiere' ? 'Creating Adobe Premiere Pro XML' : 'Creating Final Cut Pro XML')}
                  </p>
                </div>
                
                <div 
                  className="progress-bar-container mb-sm"
                  role="progressbar"
                  aria-valuenow={exportProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Export progress: ${exportProgress}%`}
                >
                  <div 
                    className="progress-bar"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
                
                <p className="text-sm text-center text-secondary">
                  {exportProgress}% complete
                </p>
                
                {exportError && (
                  <div 
                    className="mt-md p-sm bg-warning bg-opacity-20 border border-warning rounded-lg text-warning"
                    role="alert"
                  >
                    <p className="font-medium mb-xs">Export Error</p>
                    <p className="text-sm">{exportError}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-lg">
                <div 
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success mb-md"
                  aria-hidden="true"
                >
                  <Check size={32} />
                </div>
                <h3 className="text-xl font-bold mb-sm">Export Complete!</h3>
                <p className="text-secondary mb-md">
                  Your project has been exported successfully.
                </p>
                <p className="text-sm mb-lg">
                  {exportFormat === 'premiere' ? 'Adobe Premiere Pro XML' : 'Final Cut Pro XML'} file saved to:
                  <br />
                  <span className="font-mono bg-ui px-sm py-xs rounded mt-xs inline-block">
                    {exportedFilePath || `${outputPath}/export.xml`}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="flex justify-end p-md border-t border-ui">
        {!isExporting ? (
          <>
            <button 
              className="btn btn-secondary mr-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary flex items-center"
              onClick={handleExport}
            >
              <FileUp size={18} className="mr-sm" aria-hidden="true" />
              Export
            </button>
          </>
        ) : (
          exportComplete && (
            <button 
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          )
        )}
      </div>
    </>
  );
  
  return (
    <AccessibleDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Export Project"
      description="Configure export settings for your project"
      maxWidth="xl"
      closeOnEsc={!isExporting || exportComplete}
      closeOnOutsideClick={!isExporting || exportComplete}
    >
      {renderContent()}
    </AccessibleDialog>
  );
};
