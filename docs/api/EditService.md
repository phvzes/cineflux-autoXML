# EditService API Documentation

## Overview
The EditService provides functionality for managing and manipulating edit decision lists (EDLs) and performing video editing operations within the CineFlux-AutoXML system. It serves as the core component for timeline manipulation, clip management, and edit decision making.

## Methods

### initialize(options)
Initializes the EditService with the provided configuration options.

**Parameters:**
- `options` (Object): Configuration options for the EditService
  - `projectId` (string): ID of the current project
  - `storagePath` (string): Path for storing temporary files
  - `maxConcurrentOperations` (number, optional): Maximum number of concurrent operations

**Returns:**
- Promise<boolean>: Resolves to true when initialization is complete

### createTimeline(name, settings)
Creates a new timeline with the specified name and settings.

**Parameters:**
- `name` (string): Name of the timeline
- `settings` (TimelineSettings): Settings for the timeline
  - `frameRate` (number): Frame rate of the timeline
  - `resolution` (Resolution): Resolution of the timeline
  - `audioChannels` (number): Number of audio channels

**Returns:**
- Promise<Timeline>: The created timeline object

### importMedia(sources, options)
Imports media files into the project.

**Parameters:**
- `sources` (string[]): Array of paths to media files
- `options` (ImportOptions): Import options
  - `copyToProject` (boolean): Whether to copy files to the project folder
  - `generateProxies` (boolean): Whether to generate proxy files

**Returns:**
- Promise<MediaItem[]>: Array of imported media items

### addClipToTimeline(timelineId, clipData, position)
Adds a clip to the specified timeline at the given position.

**Parameters:**
- `timelineId` (string): ID of the timeline
- `clipData` (ClipData): Data for the clip to add
- `position` (number): Position on the timeline (in frames)

**Returns:**
- Promise<Clip>: The added clip object

### generateEDL(timelineId, options)
Generates an Edit Decision List (EDL) from the specified timeline.

**Parameters:**
- `timelineId` (string): ID of the timeline
- `options` (EDLOptions): Options for EDL generation
  - `format` (string): Format of the EDL ('cmx3600', 'xml', etc.)
  - `frameRate` (number): Frame rate for the EDL

**Returns:**
- Promise<string>: The generated EDL content

### applyEffect(clipId, effect, parameters)
Applies an effect to the specified clip.

**Parameters:**
- `clipId` (string): ID of the clip
- `effect` (string): Type of effect to apply
- `parameters` (EffectParameters): Parameters for the effect

**Returns:**
- Promise<Clip>: The updated clip with the applied effect

## Events

The EditService emits the following events:

- `timelineChanged`: Emitted when a timeline is modified
- `clipAdded`: Emitted when a clip is added to a timeline
- `clipRemoved`: Emitted when a clip is removed from a timeline
- `effectApplied`: Emitted when an effect is applied to a clip

## Usage Example

```typescript
import { EditService } from '../services/EditService';

async function createSimpleEdit(videoPath) {
  const editService = new EditService();
  
  await editService.initialize({
    projectId: 'my-project',
    storagePath: './project-files'
  });
  
  const timeline = await editService.createTimeline('Main Sequence', {
    frameRate: 24,
    resolution: { width: 1920, height: 1080 },
    audioChannels: 2
  });
  
  const [mediaItem] = await editService.importMedia([videoPath], {
    copyToProject: true,
    generateProxies: true
  });
  
  const clip = await editService.addClipToTimeline(
    timeline.id,
    {
      mediaId: mediaItem.id,
      inPoint: 0,
      outPoint: 300, // 10 seconds at 30fps
      name: 'Opening Shot'
    },
    0 // Position at start of timeline
  );
  
  const edl = await editService.generateEDL(timeline.id, {
    format: 'xml',
    frameRate: 24
  });
  
  console.log('Generated EDL:', edl);
}
```

## Dependencies

- EditDecisionEngine
- Timeline management system
- Media import/export subsystem
