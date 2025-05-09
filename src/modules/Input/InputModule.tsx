import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import FileUploader from './components/FileUploader';
import ProjectSettingsForm, { ProjectSettingsFormData } from './components/ProjectSettingsForm';
import FilePreview from './components/FilePreview';
import { useFileMetadata } from './hooks/useFileMetadata';
import { ProcessingStatus } from '../../types/ApplicationState';
import { EditingMode } from '../../types/ProjectSettings';

interface InputModuleProps {
  onProjectCreate?: (projectData: {
    files: any[];
    settings: ProjectSettingsFormData;
  }) => void;
  className?: string;
}

/**
 * Input Module for the CineFlux-AutoXML project
 * Handles file uploads, validation, metadata extraction, and project settings
 */
const InputModule: React.FC<InputModuleProps> = ({ onProjectCreate, className = '' }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [projectSettings, setProjectSettings] = useState<ProjectSettingsFormData>({
    projectName: '',
    projectDescription: '',
    editingMode: EditingMode.STANDARD,
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const {
    metadata,
    loading: metadataLoading,
    error: metadataError,
    extractMetadata,
    clearMetadata,
    isFFmpegReady,
  } = useFileMetadata();

  // Handle file uploads
  const handleFilesAccepted = useCallback(
    (files: File[]) => {
      setUploadedFiles((prevFiles) => [...prevFiles, ...files]);
      extractMetadata(files);
    },
    [extractMetadata]
  );

  // Handle file removal
  const handleRemoveFile = useCallback(
    (fileId: string) => {
      // Remove from metadata
      clearMetadata([fileId]);
      
      // Remove from uploadedFiles
      setUploadedFiles((prevFiles) => {
        const metadataEntry = Object.values(metadata).find((meta) => meta.id === fileId);
        if (!metadataEntry) return prevFiles;
        
        return prevFiles.filter((file) => file.name !== metadataEntry.name);
      });
    },
    [clearMetadata, metadata]
  );

  // Handle project settings changes
  const handleSettingsChange = useCallback((settings: ProjectSettingsFormData) => {
    setProjectSettings(settings);
  }, []);

  // Handle project creation
  const handleCreateProject = useCallback(() => {
    if (!projectSettings.projectName.trim()) {
      // Show error or focus on project name field
      return;
    }

    if (Object.keys(metadata).length === 0) {
      // Show error about no files
      return;
    }

    setIsCreatingProject(true);

    // Convert metadata to the format expected by the application
    const processedFiles = Object.values(metadata).map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      url: file.url,
      uploadedAt: new Date(),
      status: ProcessingStatus.COMPLETED,
      duration: file.duration?.seconds,
      resolution: file.resolution,
      frameRate: file.frameRate,
    }));

    // Create project data
    const projectData = {
      files: processedFiles,
      settings: {
        ...projectSettings,
        projectId: uuidv4(),
        createdAt: new Date(),
      },
    };

    // Call the onProjectCreate callback if provided
    if (onProjectCreate) {
      onProjectCreate(projectData);
    }

    setIsCreatingProject(false);
  }, [metadata, projectSettings, onProjectCreate]);

  // Loading state for FFmpeg
  useEffect(() => {
    // This could be used to show a loading indicator while FFmpeg is initializing
  }, [isFFmpegReady]);

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Create New Project
        </h1>

        <div className="space-y-8">
          {/* Project Settings Form */}
          <ProjectSettingsForm
            onSettingsChange={handleSettingsChange}
            initialSettings={projectSettings}
          />

          {/* File Uploader */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Upload Media Files
            </h2>
            <FileUploader onFilesAccepted={handleFilesAccepted} />
          </div>

          {/* Loading indicator for metadata extraction */}
          {metadataLoading && (
            <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <svg
                className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400 mr-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Extracting file metadata...
              </span>
            </div>
          )}

          {/* Error message for metadata extraction */}
          {metadataError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">
                Error: {metadataError}
              </p>
            </div>
          )}

          {/* File Preview */}
          <FilePreview
            files={Object.values(metadata)}
            onRemove={handleRemoveFile}
          />

          {/* Create Project Button */}
          {Object.keys(metadata).length > 0 && (
            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={handleCreateProject}
                disabled={isCreatingProject || !projectSettings.projectName.trim()}
                className={`px-6 py-2 rounded-md text-white font-medium ${
                  isCreatingProject || !projectSettings.projectName.trim()
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                } transition-colors`}
              >
                {isCreatingProject ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Project...
                  </span>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputModule;
