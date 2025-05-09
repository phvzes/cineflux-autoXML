import { useState, useCallback } from 'react';
import { SupportedMimeType, MimeCategory, getMimeCategory } from '../../../types/FileTypes';

interface ValidationResult {
  validFiles: File[];
  invalidFiles: File[];
  errors: Record<string, string>;
}

/**
 * Hook for validating uploaded files against supported formats
 * @returns Functions and state for file validation
 */
export const useFileValidation = () => {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    validFiles: [],
    invalidFiles: [],
    errors: {},
  });

  /**
   * Supported file extensions and their corresponding MIME types
   */
  const supportedExtensions = {
    // Video formats
    mp4: SupportedMimeType.MP4,
    mov: SupportedMimeType.MOV,
    webm: SupportedMimeType.WEBM,
    
    // Audio formats
    mp3: SupportedMimeType.MP3,
    wav: SupportedMimeType.WAV,
  };

  /**
   * Validates files against supported formats
   * @param files Array of files to validate
   * @returns Validation result containing valid files, invalid files, and errors
   */
  const validateFiles = useCallback((files: File[]): ValidationResult => {
    const result: ValidationResult = {
      validFiles: [],
      invalidFiles: [],
      errors: {},
    };

    files.forEach((file) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const mimeCategory = getMimeCategory(file.type);
      
      // Check if the file type is supported
      if (
        (mimeCategory === MimeCategory.VIDEO || mimeCategory === MimeCategory.AUDIO) &&
        Object.keys(supportedExtensions).includes(fileExtension)
      ) {
        result.validFiles.push(file);
      } else {
        result.invalidFiles.push(file);
        result.errors[file.name] = `Unsupported file format: ${file.type || fileExtension}. Please upload video (.mp4, .mov, .webm) or audio (.mp3, .wav) files.`;
      }
    });

    setValidationResult(result);
    return result;
  }, []);

  return {
    validateFiles,
    ...validationResult,
  };
};
