
/**
 * Utility for handling chunked file processing
 */

// Default chunk size: 2MB
const DEFAULT_CHUNK_SIZE = 2 * 1024 * 1024;

export interface ChunkProgress {
  chunkIndex: number;
  chunksTotal: number;
  bytesLoaded: number;
  bytesTotal: number;
  percentage: number;
}

export type ChunkProgressCallback = (progress: ChunkProgress) => void;

/**
 * Splits a file into chunks for processing
 */
export function createFileChunks(file: File, chunkSize: number = DEFAULT_CHUNK_SIZE): Blob[] {
  const chunks: Blob[] = [];
  const chunksTotal = Math.ceil(file.size / chunkSize);
  
  for (let i = 0; i < chunksTotal; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    chunks.push(file.slice(start, end));
  }
  
  return chunks;
}

/**
 * Processes a file in chunks
 */
export async function processFileInChunks<T>(
  file: File,
  processChunk: (chunk: Blob, chunkIndex: number, chunksTotal: number) => Promise<T>,
  onProgress?: ChunkProgressCallback,
  chunkSize: number = DEFAULT_CHUNK_SIZE
): Promise<T[]> {
  const chunks = createFileChunks(file, chunkSize);
  const results: T[] = [];
  const chunksTotal = chunks.length;
  
  for (let i = 0; i < chunksTotal; i++) {
    const chunk = chunks[i];
    
    // Report progress before processing
    if (onProgress) {
      onProgress({
        chunkIndex: i,
        chunksTotal,
        bytesLoaded: i * chunkSize,
        bytesTotal: file.size,
        percentage: Math.round((i / chunksTotal) * 100)
      });
    }
    
    // Process the chunk
    const result = await processChunk(chunk, i, chunksTotal);
    results.push(result);
    
    // Report progress after processing
    if (onProgress) {
      onProgress({
        chunkIndex: i + 1,
        chunksTotal,
        bytesLoaded: Math.min((i + 1) * chunkSize, file.size),
        bytesTotal: file.size,
        percentage: Math.round(((i + 1) / chunksTotal) * 100)
      });
    }
  }
  
  return results;
}

/**
 * Reads a file chunk as ArrayBuffer
 */
export function readChunkAsArrayBuffer(chunk: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(chunk);
  });
}

/**
 * Combines multiple ArrayBuffers into one
 */
export function combineArrayBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((total, buffer) => total + buffer.byteLength, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  
  return result.buffer;
}

/**
 * Determines if a file should be processed in chunks based on size
 */
export function shouldUseChunkedProcessing(file: File, threshold: number = 50 * 1024 * 1024): boolean {
  return file.size > threshold;
}
