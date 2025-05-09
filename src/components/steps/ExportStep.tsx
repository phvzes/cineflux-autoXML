/**
 * ExportStep.tsx
 * 
 * This component represents the final step in the workflow where users
 * can export their project to various formats.
 */

import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useWorkflow } from '../../context/WorkflowContext';

const ExportStep: React.FC = () => {
  const { state: projectState, dispatch } = useProject();
  const { state: workflowState } = useWorkflow();
  const [exportFormat, setExportFormat] = useState('premiere');
  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeMarkers, setIncludeMarkers] = useState(true);
  
  const handleExport = () => {
    // Show the export modal
    dispatch({ type: 'SHOW_EXPORT_MODAL', payload: true });
  };
  
  return (
    <div className="flex-grow flex flex-col p-6">
      <div className="border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Export Project</h2>
        
        <div className="mb-6">
          <p className="text-gray-400 mb-4">
            Your project is ready to export. Configure your export settings below and click "Export" to generate your XML file.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Export Format</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="premiere"
                    name="format"
                    value="premiere"
                    checked={exportFormat === 'premiere'}
                    onChange={() => setExportFormat('premiere')}
                    className="mr-2"
                  />
                  <label htmlFor="premiere">Adobe Premiere Pro XML</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="fcpx"
                    name="format"
                    value="fcpx"
                    checked={exportFormat === 'fcpx'}
                    onChange={() => setExportFormat('fcpx')}
                    className="mr-2"
                  />
                  <label htmlFor="fcpx">Final Cut Pro X XML</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="resolve"
                    name="format"
                    value="resolve"
                    checked={exportFormat === 'resolve'}
                    onChange={() => setExportFormat('resolve')}
                    className="mr-2"
                  />
                  <label htmlFor="resolve">DaVinci Resolve XML</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="edl"
                    name="format"
                    value="edl"
                    checked={exportFormat === 'edl'}
                    onChange={() => setExportFormat('edl')}
                    className="mr-2"
                  />
                  <label htmlFor="edl">EDL</label>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Options</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeAudio"
                    checked={includeAudio}
                    onChange={() => setIncludeAudio(!includeAudio)}
                    className="mr-2"
                  />
                  <label htmlFor="includeAudio">Include Audio Track</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeMarkers"
                    checked={includeMarkers}
                    onChange={() => setIncludeMarkers(!includeMarkers)}
                    className="mr-2"
                  />
                  <label htmlFor="includeMarkers">Include Beat Markers</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            className="px-6 py-2 bg-purple-700 hover:bg-purple-600 rounded-md font-medium"
            onClick={handleExport}
          >
            Export
          </button>
        </div>
      </div>
      
      <div className="border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Project Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Music Track</h3>
            <p className="text-gray-400">
              {projectState.musicFile ? projectState.musicFile.name : 'No music track selected'}
            </p>
            {projectState.musicFile && (
              <p className="text-gray-500 text-sm mt-1">
                Duration: {projectState.duration.toFixed(2)}s
              </p>
            )}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Video Clips</h3>
            <p className="text-gray-400">
              {projectState.videoFiles.length} clips selected
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Edit Style</h3>
            <p className="text-gray-400">
              {projectState.settings.style}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Transitions</h3>
            <p className="text-gray-400">
              {projectState.settings.transitions}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportStep;
