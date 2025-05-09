import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileValidation } from '../hooks/useFileValidation';

interface FileUploaderProps {
  onFilesAccepted: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  className?: string;
}

/**
 * Component for uploading files with drag-and-drop functionality
 */
const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesAccepted,
  maxFiles = 10,
  maxSize = 1024 * 1024 * 500, // 500MB default
  className = '',
}) => {
  const { validateFiles, errors } = useFileValidation();
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const { validFiles, invalidFiles } = validateFiles(acceptedFiles);
      
      if (validFiles.length > 0) {
        onFilesAccepted(validFiles);
      }
    },
    [validateFiles, onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/webm': ['.webm'],
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
    },
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps({
          className: `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'
          } ${isDragReject ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''} ${className}`,
        })}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-5xl text-gray-400 dark:text-gray-600">
            {/* Upload icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Drag & drop files here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              or click to browse
            </p>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Supported formats: MP4, MOV, WEBM, MP3, WAV
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Max {maxFiles} files, up to {Math.round(maxSize / (1024 * 1024))}MB each
          </div>
        </div>
      </div>

      {/* Error messages */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
            The following files couldn't be uploaded:
          </h4>
          <ul className="text-xs text-red-700 dark:text-red-400 list-disc list-inside">
            {Object.entries(errors).map(([fileName, error]) => (
              <li key={fileName} className="mb-1">
                <span className="font-medium">{fileName}</span>: {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
