# VideoService Documentation

## Overview

The VideoService is a core component of the CineFlux-AutoXML application that handles all video processing operations. It works alongside the AudioService to provide the foundation for the automatic video editing functionality. The VideoService is responsible for:

1. Loading and validating video files
2. Extracting metadata and frames
3. Analyzing content and motion
4. Detecting scene boundaries
5. Classifying clip types
6. Generating thumbnails for the UI

## Architecture

The VideoService is implemented as a singleton class that provides access to video processing capabilities throughout the application. It follows the same architectural pattern as the AudioService:

```
VideoService
├── Core Functions (loading, analysis)
├── Frame Extraction
├── Scene Detection
├── Content Analysis
├── Motion Analysis
└── Event System
```

## Technology Stack

The VideoService leverages the following technologies:

- **FFmpeg.wasm**: For video decoding, frame extraction, and metadata access
- **OpenCV.js**: For computer vision operations like scene detection and content analysis
- **Web Workers**: For handling CPU-intensive operations without blocking the UI
- **HTML Canvas**: For thumbnail generation and frame manipulation

## API Documentation

### Core Methods

#### `loadVideoFile(file: File): Promise<VideoFile>`

Loads a video file and extracts its metadata.

- **Parameters:**
  - `file`: The video File object to load
- **Returns:** Promise resolving to a VideoFile object with metadata
- **Example:**
  ```typescript
  const videoFile = await videoService.loadVideoFile(file);
  console.log(`Loaded video: ${videoFile.name}, duration: ${videoFile.duration}s`);
  ```

#### `analyzeVideo(file: File): Promise<VideoAnalysis>`

Performs a comprehensive analysis of the video, including frame extraction, scene detection, content analysis, and motion analysis.

- **Parameters:**
  - `file`: The video File object to analyze
- **Returns:** Promise resolving to a VideoAnalysis object
- **Example:**
  ```typescript
  const analysis = await videoService.analyzeVideo(file);
  console.log(`Found ${analysis.scenes.length} scenes in the video`);
  ```

#### `extractFrames(file: File, options?: FrameExtractionOptions): Promise<VideoFrame[]>`

Extracts frames from the video at specified intervals.

- **Parameters:**
  - `file`: The video File object
  - `options`: Optional extraction parameters (fps, maxFrames)
- **Returns:** Promise resolving to an array of VideoFrame objects
- **Example:**
  ```typescript
  const frames = await videoService.extractFrames(file, { fps: 1, maxFrames: 300 });
  console.log(`Extracted ${frames.length} frames from the video`);
  ```

#### `generateThumbnail(file: File, time?: number): Promise<string>`

Generates a thumbnail image from the video at a specific time.

- **Parameters:**
  - `file`: The video File object
  - `time`: Optional time in seconds (default: 1s from the start)
- **Returns:** Promise resolving to a base64-encoded image string
- **Example:**
  ```typescript
  const thumbnail = await videoService.generateThumbnail(file, 30);
  imageElement.src = thumbnail;
  ```

### Analysis Methods

#### `detectScenes(frames: VideoFrame[], options?: SceneDetectionOptions): Promise<Scene[]>`

Detects scene boundaries within the video based on visual changes.

- **Parameters:**
  - `frames`: Array of previously extracted VideoFrame objects
  - `options`: Optional detection parameters (threshold, minSceneDuration)
- **Returns:** Promise resolving to an array of Scene objects
- **Example:**
  ```typescript
  const scenes = await videoService.detectScenes(frames, { threshold: 30 });
  ```

#### `analyzeContent(frame: VideoFrame): Promise<ContentData>`

Analyzes a single frame for content features like faces, colors, and brightness.

- **Parameters:**
  - `frame`: The VideoFrame object to analyze
- **Returns:** Promise resolving to a ContentData object
- **Example:**
  ```typescript
  const contentData = await videoService.analyzeContent(frames[0]);
  if (contentData.hasFaces) {
    console.log(`Found ${contentData.faceCount} faces in the frame`);
  }
  ```

#### `analyzeMotion(frames: VideoFrame[]): Promise<MotionData>`

Analyzes motion between frames to detect camera movement and action.

- **Parameters:**
  - `frames`: Array of VideoFrame objects
- **Returns:** Promise resolving to a MotionData object
- **Example:**
  ```typescript
  const motionData = await videoService.analyzeMotion(frames);
  console.log(`Average motion: ${motionData.averageMotion}`);
  ```

#### `classifyClipType(analysis: Partial<VideoAnalysis>): Promise<ClipType>`

Classifies the type of video clip based on content and motion analysis.

- **Parameters:**
  - `analysis`: Partial VideoAnalysis object containing contentAnalysis and motionData
- **Returns:** Promise resolving to a ClipType enum value
- **Example:**
  ```typescript
  const clipType = await videoService.classifyClipType({
    contentAnalysis,
    motionData
  });
  console.log(`Clip classified as: ${clipType}`);
  ```

### Event System

The VideoService implements an event system to communicate progress and results to the UI.

#### `addEventListener(event: VideoServiceEvents, callback: Function): void`

Registers an event listener for a specific event type.

- **Parameters:**
  - `event`: The event type to listen for
  - `callback`: Function to call when the event occurs
- **Example:**
  ```typescript
  videoService.addEventListener(VideoServiceEvents.PROGRESS, ({ progress, message }) => {
    progressBar.value = progress * 100;
    statusText.textContent = message;
  });
  ```

#### `removeEventListener(event: VideoServiceEvents, callback: Function): void`

Removes a previously registered event listener.

- **Parameters:**
  - `event`: The event type
  - `callback`: The callback function to remove
- **Example:**
  ```typescript
  videoService.removeEventListener(VideoServiceEvents.PROGRESS, progressCallback);
  ```

## Event Types

- `ANALYSIS_START`: Emitted when video analysis begins
- `ANALYSIS_COMPLETE`: Emitted when video analysis completes
- `PROGRESS`: Emitted during long-running operations with progress information
- `ERROR`: Emitted when an error occurs
- `FRAME_EXTRACTED`: Emitted when frames are extracted
- `SCENE_DETECTED`: Emitted when scenes are detected

## Integration with Workflow

The VideoService integrates with the application workflow in the following ways:

1. **InputStep**: Validates video files and extracts basic metadata
2. **AnalysisStep**: Performs comprehensive analysis in parallel with audio analysis
3. **EditingStep**: Provides scene information for the editing timeline
4. **PreviewStep**: Supplies frames for preview generation
5. **ExportStep**: Provides metadata for the export process

## Performance Considerations

- Frame extraction is CPU-intensive and should be performed with a reasonable FPS (e.g., 1 frame per second for analysis)
- Analysis results are cached to avoid redundant processing
- Web Workers should be used for CPU-intensive operations when possible
- Consider using the `useVideoService` hook for React components to easily access VideoService functionality

## Error Handling

The VideoService implements robust error handling:

- All public methods catch and report errors
- Error events are emitted with descriptive messages
- Default values are returned when operations fail partially
- Input validation prevents invalid parameters

## Example Usage with React Hook

The `useVideoService` hook provides a convenient way to use the VideoService in React components:

```typescript
import { useVideoService } from '../hooks/useVideoService';

function VideoAnalysisComponent({ videoFile }) {
  const {
    videoAnalysis,
    isAnalyzing,
    error,
    progress,
    analyzeVideo
  } = useVideoService();

  useEffect(() => {
    if (videoFile) {
      analyzeVideo(videoFile);
    }
  }, [videoFile, analyzeVideo]);

  return (
    <div>
      {isAnalyzing && (
        <ProgressBar value={progress.progress * 100} label={progress.message} />
      )}
      
      {error && (
        <ErrorMessage message={error} />
      )}
      
      {videoAnalysis && (
        <AnalysisResults analysis={videoAnalysis} />
      )}
    </div>
  );
}
```