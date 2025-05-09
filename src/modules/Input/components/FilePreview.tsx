import React from 'react';
import { MimeCategory, getMimeCategory } from '../../../types/FileTypes';

interface FilePreviewProps {
  files: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    duration?: {
      seconds: number;
      formatted: string;
    };
    resolution?: {
      width: number;
      height: number;
    };
    frameRate?: number;
  }>;
  onRemove: (id: string) => void;
}

/**
 * Component for displaying previews of uploaded files with metadata
 */
const FilePreview: React.FC<FilePreviewProps> = ({ files, onRemove }) => {
  if (files.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
        Uploaded Files ({files.length})
      </h3>
      <div className="space-y-3">
        {files.map((file) => {
          const mimeCategory = getMimeCategory(file.type);
          const isVideo = mimeCategory === MimeCategory.VIDEO;
          const isAudio = mimeCategory === MimeCategory.AUDIO;

          return (
            <div
              key={file.id}
              className="flex items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            >
              {/* File type icon */}
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-4">
                {isVideo ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                ) : isAudio ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>

              {/* File info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={file.name}>
                    {file.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onRemove(file.id)}
                    className="ml-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                    aria-label="Remove file"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatFileSize(file.size)}</span>
                  
                  {file.duration && (
                    <span>Duration: {file.duration.formatted.split('.')[0]}</span>
                  )}
                  
                  {isVideo && file.resolution && (
                    <span>
                      Resolution: {file.resolution.width}×{file.resolution.height}
                    </span>
                  )}
                  
                  {isVideo && file.frameRate && (
                    <span>Frame Rate: {Math.round(file.frameRate)} fps</span>
                  )}
                  
                  <span className="capitalize">
                    Type: {mimeCategory}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FilePreview;
