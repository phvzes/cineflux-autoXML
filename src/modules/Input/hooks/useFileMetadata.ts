import { useState, useCallback, useEffect } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import { MediaDuration, Resolution, formatDuration } from '../../../types/FileTypes';

interface FileMetadataResult {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  duration?: MediaDuration;
  resolution?: Resolution;
  frameRate?: number;
}

interface MetadataState {
  metadata: Record<string, FileMetadataResult>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for extracting metadata from media files
 * @returns Functions and state for file metadata extraction
 */
export const useFileMetadata = () => {
  const [state, setState] = useState<MetadataState>({
    metadata: {},
    loading: false,
    error: null,
  });
  const [ffmpeg, setFfmpeg] = useState<any>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  // Initialize FFmpeg
  useEffect(() => {
    const initFFmpeg = async () => {
      try {
        const ffmpegInstance = createFFmpeg({
          log: false,
          corePath: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/ffmpeg-core.js',
        });
        await ffmpegInstance.load();
        setFfmpeg(ffmpegInstance);
        setFfmpegLoaded(true);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: 'Failed to load FFmpeg: ' + (error instanceof Error ? error.message : String(error)),
        }));
      }
    };

    initFFmpeg();

    // Cleanup
    return () => {
      if (ffmpeg) {
        // No explicit unload method in FFmpeg.wasm v0.12.x
      }
    };
  }, []);

  /**
   * Extract metadata from video files using FFmpeg
   * @param file Video file
   * @returns Promise resolving to metadata
   */
  const extractVideoMetadata = useCallback(
    async (file: File): Promise<FileMetadataResult> => {
      if (!ffmpegLoaded || !ffmpeg) {
        throw new Error('FFmpeg not loaded');
      }

      const fileId = uuidv4();
      const fileName = `input_${fileId}`;
      
      try {
        // Write the file to FFmpeg's virtual file system
        ffmpeg.FS('writeFile', fileName, await fetchFile(file));
        
        // Run FFmpeg to get file information
        await ffmpeg.run(
          '-i', fileName,
          '-v', 'error',
          '-select_streams', 'v:0',
          '-show_entries', 'stream=width,height,r_frame_rate',
          '-show_entries', 'format=duration',
          '-of', 'json',
          'output.json'
        );
        
        // Read the output JSON
        const outputData = ffmpeg.FS('readFile', 'output.json');
        const infoJson = JSON.parse(new TextDecoder().decode(outputData));
        
        // Extract relevant information
        const stream = infoJson.streams?.[0] || {};
        const format = infoJson.format || {};
        
        const width = stream.width || 0;
        const height = stream.height || 0;
        const aspectRatio = width && height ? width / height : 0;
        
        // Parse frame rate (usually in the format "num/den")
        let frameRate = 0;
        if (stream.r_frame_rate) {
          const [num, den] = stream.r_frame_rate.split('/').map(Number);
          frameRate = num / (den || 1);
        }
        
        const durationSeconds = parseFloat(format.duration) || 0;
        
        // Clean up
        ffmpeg.FS('unlink', fileName);
        ffmpeg.FS('unlink', 'output.json');
        
        // Create object URL for the file
        const objectUrl = URL.createObjectURL(file);
        
        return {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: objectUrl,
          duration: {
            seconds: durationSeconds,
            formatted: formatDuration(durationSeconds),
            frames: durationSeconds * frameRate,
            frameRate,
          },
          resolution: {
            width,
            height,
            aspectRatio,
          },
          frameRate,
        };
      } catch (error) {
        console.error('Error extracting video metadata:', error);
        throw new Error('Failed to extract video metadata');
      }
    },
    [ffmpeg, ffmpegLoaded]
  );

  /**
   * Extract metadata from audio files using Web Audio API
   * @param file Audio file
   * @returns Promise resolving to metadata
   */
  const extractAudioMetadata = useCallback(async (file: File): Promise<FileMetadataResult> => {
    return new Promise((resolve, reject) => {
      const fileId = uuidv4();
      const objectUrl = URL.createObjectURL(file);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const audioElement = new Audio();
      audioElement.src = objectUrl;
      
      // When metadata is loaded
      audioElement.addEventListener('loadedmetadata', () => {
        const durationSeconds = audioElement.duration;
        
        resolve({
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: objectUrl,
          duration: {
            seconds: durationSeconds,
            formatted: formatDuration(durationSeconds),
          },
        });
        
        // Clean up
        audioElement.remove();
        audioContext.close();
      });
      
      // Handle errors
      audioElement.addEventListener('error', (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to load audio file: ${e.toString()}`));
      });
      
      // Start loading
      audioElement.load();
    });
  }, []);

  /**
   * Extract metadata from files based on their type
   * @param files Array of files to process
   */
  const extractMetadata = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      
      setState((prev) => ({ ...prev, loading: true, error: null }));
      
      try {
        const metadataResults: Record<string, FileMetadataResult> = { ...state.metadata };
        
        await Promise.all(
          files.map(async (file) => {
            try {
              let metadata: FileMetadataResult;
              
              if (file.type.startsWith('video/')) {
                metadata = await extractVideoMetadata(file);
              } else if (file.type.startsWith('audio/')) {
                metadata = await extractAudioMetadata(file);
              } else {
                throw new Error(`Unsupported file type: ${file.type}`);
              }
              
              metadataResults[metadata.id] = metadata;
            } catch (error) {
              console.error(`Error processing file ${file.name}:`, error);
              // Continue with other files even if one fails
            }
          })
        );
        
        setState((prev) => ({
          ...prev,
          metadata: metadataResults,
          loading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to extract metadata: ' + (error instanceof Error ? error.message : String(error)),
        }));
      }
    },
    [state.metadata, extractVideoMetadata, extractAudioMetadata]
  );

  /**
   * Clear metadata for specific file IDs
   * @param fileIds Array of file IDs to clear
   */
  const clearMetadata = useCallback((fileIds: string[]) => {
    setState((prev) => {
      const updatedMetadata = { ...prev.metadata };
      
      fileIds.forEach((id) => {
        if (updatedMetadata[id]) {
          // Revoke object URL to prevent memory leaks
          URL.revokeObjectURL(updatedMetadata[id].url);
          delete updatedMetadata[id];
        }
      });
      
      return {
        ...prev,
        metadata: updatedMetadata,
      };
    });
  }, []);

  /**
   * Clear all metadata
   */
  const clearAllMetadata = useCallback(() => {
    setState((prev) => {
      // Revoke all object URLs
      Object.values(prev.metadata).forEach((meta) => {
        URL.revokeObjectURL(meta.url);
      });
      
      return {
        ...prev,
        metadata: {},
      };
    });
  }, []);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(state.metadata).forEach((meta) => {
        URL.revokeObjectURL(meta.url);
      });
    };
  }, [state.metadata]);

  return {
    ...state,
    extractMetadata,
    clearMetadata,
    clearAllMetadata,
    isFFmpegReady: ffmpegLoaded,
  };
};
