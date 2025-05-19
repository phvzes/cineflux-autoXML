# CineFlux-AutoXML User Guide

```
 ██████╗██╗███╗   ██╗███████╗███████╗██╗     ██╗   ██╗██╗  ██╗
██╔════╝██║████╗  ██║██╔════╝██╔════╝██║     ██║   ██║╚██╗██╔╝
██║     ██║██╔██╗ ██║█████╗  █████╗  ██║     ██║   ██║ ╚███╔╝ 
██║     ██║██║╚██╗██║██╔══╝  ██╔══╝  ██║     ██║   ██║ ██╔██╗ 
╚██████╗██║██║ ╚████║███████╗██║     ███████╗╚██████╔╝██╔╝ ██╗
 ╚═════╝╚═╝╚═╝  ╚═══╝╚══════╝╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝
                                                              
 █████╗ ██╗   ██╗████████╗ ██████╗ ██╗  ██╗███╗   ███╗██╗     
██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗╚██╗██╔╝████╗ ████║██║     
███████║██║   ██║   ██║   ██║   ██║ ╚███╔╝ ██╔████╔██║██║     
██╔══██║██║   ██║   ██║   ██║   ██║ ██╔██╗ ██║╚██╔╝██║██║     
██║  ██║╚██████╔╝   ██║   ╚██████╔╝██╔╝ ██╗██║ ╚═╝ ██║███████╗
╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝
```

## Table of Contents

1. [Introduction](#introduction)
2. [Installation Instructions](#installation-instructions)
   - [For Developers](#for-developers)
   - [For End-Users](#for-end-users)
   - [System Requirements](#system-requirements)
3. [Usage Workflow](#usage-workflow)
   - [Step 1: Input](#step-1-input)
   - [Step 2: Analysis](#step-2-analysis)
   - [Step 3: Editing](#step-3-editing)
   - [Step 4: Preview](#step-4-preview)
   - [Step 5: Export](#step-5-export)
4. [Feature Explanations](#feature-explanations)
   - [Input Module](#input-module)
   - [Audio Analysis Module](#audio-analysis-module)
   - [Video Analysis Module](#video-analysis-module)
   - [Edit Decision Engine](#edit-decision-engine)
   - [Export Module](#export-module)
5. [Browser Compatibility](#browser-compatibility)
   - [Supported Browsers](#supported-browsers)
   - [Required Browser Settings](#required-browser-settings)
   - [Performance Considerations](#performance-considerations)
6. [Troubleshooting](#troubleshooting)
   - [Common Issues](#common-issues)
   - [Performance Optimization](#performance-optimization)
   - [Error Messages](#error-messages)
7. [FAQ](#faq)

## Introduction

CineFlux-AutoXML is a powerful browser-based application that automatically creates professional music videos by intelligently synchronizing video clips with music tracks. Using advanced audio analysis and visual content recognition, it identifies musical beats, energy levels, and video scene changes to create perfectly timed edits. The system exports industry-standard XML files compatible with professional editing software like Final Cut Pro, Adobe Premiere Pro, and DaVinci Resolve.

The application is designed to run entirely in the browser, leveraging WebAssembly technologies for high-performance audio and video processing without requiring server-side processing. This ensures user privacy and eliminates the need for server uploads.

## Installation Instructions

### For Developers

#### Prerequisites

- Node.js 16.x or higher
- npm or pnpm package manager
- Git
- Modern browser with WebAssembly support (Chrome 74+, Firefox 78+, Safari 14.1+, Edge 79+)

#### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/cineflux-autoxml.git
   cd cineflux-autoxml
   ```

2. **Install dependencies**:
   ```bash
   # Using npm
   npm install
   
   # Using pnpm (recommended for faster installation)
   pnpm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.development.local
   ```
   Edit the `.env.development.local` file to adjust any settings as needed.

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   Open your browser and navigate to `http://localhost:5173`

#### Docker Development Setup

If you prefer using Docker for development:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/cineflux-autoxml.git
   cd cineflux-autoxml
   ```

2. **Start the development environment**:
   ```bash
   docker-compose up app-dev
   ```

3. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

### For End-Users

As an end-user, you have two options to access CineFlux-AutoXML:

#### Option 1: Access the Deployed Application

1. Open your browser (Chrome 74+, Firefox 78+, Safari 14.1+, or Edge 79+ recommended)
2. Navigate to the application URL provided by your organization or the public deployment
3. Ensure your browser has the required settings enabled (see [Browser Compatibility](#browser-compatibility))

#### Option 2: Run the Application Locally

If you need to run the application locally:

1. **Download the latest release**:
   - Visit the releases page on GitHub
   - Download the latest release package

2. **Extract the files** to a local directory

3. **Serve the files** using a local web server:
   - Option A: Use a simple HTTP server like Python's built-in server:
     ```bash
     cd /path/to/extracted/files
     python -m http.server 8080
     ```
   - Option B: Use a Node.js-based server:
     ```bash
     cd /path/to/extracted/files
     npx serve -s
     ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:8080` (or the port specified by your server)

### System Requirements

#### Minimum Requirements

- **Processor**: Dual-core CPU, 2.0 GHz or higher
- **Memory**: 4 GB RAM (8 GB recommended)
- **Storage**: 500 MB available space for the application
- **Internet**: Broadband connection for initial loading
- **Display**: 1280x720 resolution or higher

#### Recommended Requirements

- **Processor**: Quad-core CPU, 2.5 GHz or higher
- **Memory**: 16 GB RAM
- **Storage**: 2 GB available space for the application and temporary files
- **Internet**: High-speed broadband connection
- **Display**: 1920x1080 resolution or higher

## Usage Workflow

CineFlux-AutoXML guides you through a step-by-step workflow to create professional music videos:

### Step 1: Input

![Input Step](docs/img/input_step.png)

1. **Upload Music Track**:
   - Click the "Upload Music" button or drag and drop your audio file
   - Supported formats: MP3, WAV, AAC, FLAC, OGG
   - Maximum file size: 50 MB

2. **Upload Video Clips**:
   - Click the "Upload Videos" button or drag and drop your video files
   - You can upload multiple video clips at once
   - Supported formats: MP4, MOV, WebM, AVI
   - Maximum file size per clip: 500 MB
   - Maximum total size: 2 GB

3. **Configure Project Settings**:
   - **Project Name**: Enter a name for your project
   - **Edit Style**: Choose from Rhythm-based, Energy-based, Segment-based, or Cinematic
   - **Transition Type**: Select default transition types (Cut, Dissolve, Fade, etc.)
   - **Output Format**: Select the target editing software (Final Cut Pro, Premiere Pro, DaVinci Resolve)

4. **Proceed to Analysis**:
   - Click the "Start Analysis" button to proceed to the next step

### Step 2: Analysis

![Analysis Step](docs/img/analysis_step.png)

During this step, the application automatically analyzes your audio and video files:

1. **Audio Analysis**:
   - Beat detection and tempo estimation
   - Energy level analysis
   - Music segment identification (verse, chorus, bridge)
   - Waveform visualization
   - Progress is displayed in real-time

2. **Video Analysis**:
   - Scene detection and segmentation
   - Content analysis and categorization
   - Motion tracking and energy estimation
   - Frame extraction for thumbnails
   - Progress is displayed in real-time

3. **Analysis Results**:
   - Once analysis is complete, you'll see a summary of the results
   - Audio waveform with detected beats and segments
   - Video thumbnails with scene boundaries
   - Estimated edit points based on the selected style

4. **Proceed to Editing**:
   - Click the "Continue to Editing" button to proceed to the next step

### Step 3: Editing

![Editing Step](docs/img/editing_step.png)

In this step, you can review and adjust the automatically generated edit decisions:

1. **Timeline View**:
   - Audio waveform with beat markers
   - Video thumbnails arranged according to the edit decisions
   - Edit points and transitions visualized on the timeline

2. **Edit Adjustment**:
   - Click on an edit point to adjust its timing
   - Drag video clips to reorder them
   - Change transition types for specific edit points
   - Add or remove edit points manually

3. **Style Adjustment**:
   - Fine-tune the editing style parameters
   - Adjust beat sensitivity
   - Modify energy threshold for cuts
   - Change segment-based editing rules

4. **Proceed to Preview**:
   - Click the "Generate Preview" button to proceed to the next step

### Step 4: Preview

![Preview Step](docs/img/preview_step.png)

This step allows you to preview the edited video before exporting:

1. **Preview Player**:
   - Watch a real-time preview of your edited video
   - Audio and video are synchronized according to your edit decisions
   - Timeline shows current playback position

2. **Comparison View**:
   - Toggle between the edited version and original clips
   - Side-by-side comparison option

3. **Final Adjustments**:
   - Return to the Editing step if needed
   - Make final adjustments to edit points or transitions

4. **Proceed to Export**:
   - Click the "Prepare for Export" button to proceed to the final step

### Step 5: Export

![Export Step](docs/img/export_step.png)

In this final step, you can export your project for use in professional editing software:

1. **Export Format Selection**:
   - Choose the export format:
     - Final Cut Pro X XML (FCPXML)
     - Adobe Premiere Pro XML
     - DaVinci Resolve XML
     - EDL (Edit Decision List)

2. **Export Options**:
   - **Include Audio Track**: Include the music track in the export
   - **Include Beat Markers**: Add markers at beat positions
   - **Include Segment Markers**: Add markers for music segments
   - **Include Original Media**: Reference original media files or optimized versions

3. **Export Process**:
   - Click the "Export" button to generate the XML file
   - The export process runs entirely in your browser
   - Progress is displayed in real-time

4. **Download and Next Steps**:
   - Once export is complete, download the XML file
   - Instructions for importing into your chosen editing software are provided
   - Option to start a new project or modify the current one

## Feature Explanations

### Input Module

The Input Module handles the uploading and initial processing of audio and video files:

#### File Formats and Limitations

- **Audio Formats**:
  - MP3: Up to 320 kbps, 50 MB maximum
  - WAV: 16/24-bit, 44.1/48 kHz, 50 MB maximum
  - AAC: Up to 320 kbps, 50 MB maximum
  - FLAC: 16/24-bit, 44.1/48 kHz, 50 MB maximum
  - OGG: Up to 500 kbps, 50 MB maximum

- **Video Formats**:
  - MP4 (H.264/H.265): Up to 4K resolution, 500 MB maximum per file
  - MOV (ProRes/H.264): Up to 4K resolution, 500 MB maximum per file
  - WebM (VP8/VP9): Up to 4K resolution, 500 MB maximum per file
  - AVI (various codecs): Up to 1080p resolution, 500 MB maximum per file

- **Total Project Limitations**:
  - Maximum combined video size: 2 GB
  - Maximum number of video clips: 50
  - Maximum audio duration: 15 minutes
  - Maximum video duration: 60 minutes (combined)

#### Upload Process

The upload process uses a multi-threaded approach to handle files efficiently:

1. **File Validation**: Files are validated for format, size, and integrity
2. **Chunked Upload**: Large files are processed in chunks to prevent browser memory issues
3. **Initial Metadata Extraction**: Basic metadata is extracted for display
4. **Thumbnail Generation**: Initial thumbnails are generated for video files
5. **Waveform Generation**: A visual waveform is generated for audio files

#### Project Settings

Project settings control how the application processes your media:

- **Edit Styles**:
  - **Rhythm-based**: Cuts are synchronized precisely to beats
  - **Energy-based**: Cuts are based on energy levels in both audio and video
  - **Segment-based**: Cuts are aligned with music segments (verse, chorus, etc.)
  - **Cinematic**: Prioritizes visual flow and composition over strict beat matching

- **Transition Types**:
  - **Cut**: Immediate transition between clips
  - **Dissolve**: Gradual fade between clips
  - **Fade to Black**: Fade to black between clips
  - **Wipe**: Various wipe patterns between clips
  - **Custom**: User-defined transition patterns

### Audio Analysis Module

The Audio Analysis Module processes audio files to extract musical information:

#### Beat Detection

The beat detection algorithm identifies the rhythmic elements in your music:

- **Tempo Estimation**: Calculates the beats per minute (BPM)
- **Beat Grid**: Creates a grid of beat positions throughout the track
- **Beat Strength**: Analyzes the strength of each beat for importance ranking
- **Sub-beat Detection**: Identifies subdivisions of beats for finer synchronization

#### Energy Analysis

Energy analysis measures the intensity of the audio over time:

- **RMS Energy**: Root Mean Square energy calculation
- **Spectral Flux**: Measures changes in the frequency spectrum
- **Percussive Energy**: Isolates and measures percussive elements
- **Tonal Energy**: Measures harmonic content and changes

#### Segment Identification

Segment identification divides the music into structural sections:

- **Verse/Chorus Detection**: Identifies repeating patterns and structural elements
- **Intro/Outro Detection**: Identifies beginning and ending sections
- **Bridge Detection**: Identifies transitional sections
- **Build-up/Drop Detection**: Identifies intensity changes in electronic music

#### Waveform Visualization

The waveform visualization provides a visual representation of the audio:

- **Amplitude Display**: Shows volume changes over time
- **Beat Markers**: Visual indicators for detected beats
- **Segment Markers**: Visual indicators for detected segments
- **Energy Heatmap**: Color coding to show energy levels

### Video Analysis Module

The Video Analysis Module processes video files to extract visual information:

#### Scene Detection

Scene detection identifies natural boundaries in your video clips:

- **Shot Boundary Detection**: Identifies cuts between shots
- **Gradual Transition Detection**: Identifies dissolves, fades, and wipes
- **Content Change Detection**: Identifies significant changes in content
- **Camera Motion Detection**: Identifies camera movements like pans and zooms

#### Content Analysis

Content analysis categorizes the visual elements in your videos:

- **Face Detection**: Identifies and tracks faces
- **Object Recognition**: Identifies common objects
- **Color Analysis**: Analyzes color palettes and changes
- **Brightness/Contrast Analysis**: Measures lighting characteristics
- **Composition Analysis**: Analyzes framing and visual balance

#### Motion Tracking

Motion tracking analyzes movement within your videos:

- **Global Motion**: Tracks overall camera movement
- **Local Motion**: Tracks movement of objects within the frame
- **Motion Energy**: Measures the intensity of movement
- **Motion Direction**: Analyzes the direction of movement

#### Frame Extraction

Frame extraction creates visual references for the editing process:

- **Keyframe Selection**: Identifies representative frames for each scene
- **Thumbnail Generation**: Creates thumbnails for the user interface
- **Visual Feature Extraction**: Extracts features for matching with audio
- **Quality Assessment**: Evaluates frame quality for selection

### Edit Decision Engine

The Edit Decision Engine combines audio and video analysis to create synchronized edits:

#### Synchronization Algorithms

The synchronization algorithms match video content to audio characteristics:

- **Beat-Sync Algorithm**: Aligns cuts with musical beats
- **Energy-Matching Algorithm**: Matches video energy with audio energy
- **Segment-Based Algorithm**: Structures edits according to music segments
- **Content-Aware Algorithm**: Considers both audio and video content for decisions

#### Edit Point Generation

Edit point generation creates a timeline of cuts and transitions:

- **Primary Cut Points**: Placed at strong beats or segment boundaries
- **Secondary Cut Points**: Placed at less prominent musical events
- **Transition Selection**: Automatically selects appropriate transition types
- **Duration Calculation**: Determines optimal clip durations

#### Style Templates

Style templates provide predefined editing patterns:

- **Music Video**: Fast-paced editing synchronized to beats
- **Documentary**: More relaxed pacing with emphasis on content
- **Cinematic**: Film-like editing with attention to composition
- **Action**: Dynamic editing with emphasis on motion
- **Custom**: User-defined editing patterns

#### Manual Adjustment

Manual adjustment allows fine-tuning of the automatic decisions:

- **Edit Point Adjustment**: Move edit points in time
- **Clip Reordering**: Change the sequence of video clips
- **Transition Modification**: Change transition types and durations
- **Style Parameter Adjustment**: Fine-tune algorithm parameters

### Export Module

The Export Module generates industry-standard files for professional editing software:

#### Export Formats

The export module supports multiple industry-standard formats:

- **Final Cut Pro X XML (FCPXML)**:
  - Compatible with Final Cut Pro X 10.4 and later
  - Includes timing, transitions, and markers
  - Supports compound clips and nested sequences

- **Adobe Premiere Pro XML**:
  - Compatible with Premiere Pro CC 2019 and later
  - Includes edit points, transitions, and markers
  - Supports nested sequences

- **DaVinci Resolve XML**:
  - Compatible with DaVinci Resolve 16 and later
  - Includes edit decisions and color metadata
  - Supports compound clips

- **EDL (Edit Decision List)**:
  - Standard CMX3600 format
  - Basic edit point information
  - Compatible with most editing software

#### Export Options

Export options allow customization of the output:

- **Media Handling**:
  - **Reference Original**: Links to original media files
  - **Optimize Media**: Creates optimized versions of media files
  - **Proxy Generation**: Creates lower-resolution proxy files

- **Metadata Options**:
  - **Include Beat Markers**: Adds markers at beat positions
  - **Include Segment Markers**: Adds markers for music segments
  - **Include Notes**: Adds editing notes and suggestions
  - **Include Clip Names**: Uses descriptive names for clips

- **Advanced Options**:
  - **Frame Rate Conversion**: Handles mixed frame rate sources
  - **Audio Sync Options**: Controls how audio is synchronized
  - **Transition Rendering**: Controls how transitions are represented

#### Import Instructions

The export module provides instructions for importing into different software:

- **Final Cut Pro X Import Guide**:
  - Step-by-step instructions for importing FCPXML
  - Troubleshooting tips for common issues

- **Adobe Premiere Pro Import Guide**:
  - Step-by-step instructions for importing XML
  - Media reconnection guidance

- **DaVinci Resolve Import Guide**:
  - Step-by-step instructions for importing XML
  - Media management recommendations

## Browser Compatibility

### Supported Browsers

CineFlux-AutoXML is compatible with modern browsers that support WebAssembly:

| Browser | Minimum Version | Recommended Version | Notes |
|---------|----------------|---------------------|-------|
| Chrome  | 74+            | 90+                 | Best performance and compatibility |
| Firefox | 78+            | 86+                 | Good performance, some WebAssembly optimizations may be limited |
| Safari  | 14.1+          | 15+                 | Acceptable performance, some WebAssembly features may be limited |
| Edge    | 79+            | 90+                 | Based on Chromium, similar performance to Chrome |

### Required Browser Settings

Some browsers require specific settings to enable all features:

#### Cross-Origin Isolation

CineFlux-AutoXML uses SharedArrayBuffer for efficient memory management, which requires cross-origin isolation:

1. **Chrome/Edge**:
   - No user action required when accessing via HTTPS with proper headers
   - For local development, use the `--enable-features=SharedArrayBuffer` flag

2. **Firefox**:
   - Enable `javascript.options.shared_memory` in about:config
   - No user action required when accessing via HTTPS with proper headers

3. **Safari**:
   - No specific settings required for Safari 15.2+
   - Earlier versions may have limited functionality

#### WebAssembly SIMD

For optimal performance, WebAssembly SIMD should be enabled:

1. **Chrome/Edge**:
   - Enabled by default in version 91+
   - For earlier versions, use the `--enable-features=WebAssemblySIMD` flag

2. **Firefox**:
   - Enabled by default in version 89+
   - For earlier versions, enable `javascript.options.wasm_simd` in about:config

3. **Safari**:
   - Limited support, performance may be reduced

### Performance Considerations

Browser performance can vary significantly:

#### Memory Usage

- **Recommended**: At least 4GB of available system memory
- **Large Projects**: 8GB+ recommended for projects with multiple high-resolution videos
- **Browser Settings**: Close unnecessary tabs to free up memory

#### CPU Usage

- **Processing Phases**: CPU usage is highest during analysis and preview generation
- **Background Processing**: The application uses Web Workers to prevent UI freezing
- **Cooling**: Ensure adequate cooling for laptops during intensive processing

#### GPU Acceleration

- **WebGL**: Used for video processing and preview rendering
- **Hardware Acceleration**: Enable browser hardware acceleration for best performance
- **Drivers**: Ensure graphics drivers are up to date

## Troubleshooting

### Common Issues

#### Upload Issues

**Problem**: Files fail to upload or are rejected.

**Solutions**:
- Ensure files are in supported formats (MP3, WAV, AAC, FLAC, OGG for audio; MP4, MOV, WebM, AVI for video)
- Check file size limits (50 MB for audio, 500 MB per video)
- Try a different browser if the issue persists
- Convert files to a more compatible format (e.g., MP4 with H.264 encoding)

#### Analysis Fails

**Problem**: Audio or video analysis fails to complete.

**Solutions**:
- Ensure your browser is up to date
- Check that you have sufficient memory available (close other tabs/applications)
- Try with a smaller or shorter media file to test
- Check browser console for specific error messages
- Ensure browser settings allow SharedArrayBuffer (see Browser Compatibility)

#### Preview Not Working

**Problem**: Video preview doesn't play or is out of sync.

**Solutions**:
- Wait for preview generation to complete fully
- Check if your browser supports the video codec
- Try a different browser
- Reduce the project complexity (fewer clips, shorter duration)
- Check browser console for specific error messages

#### Export Fails

**Problem**: XML export fails or produces invalid files.

**Solutions**:
- Check browser console for specific error messages
- Ensure you have sufficient memory available
- Try exporting a smaller project first
- Try a different export format
- Check if your browser's download settings are blocking the file

### Performance Optimization

#### Slow Analysis

**Problem**: Audio or video analysis is very slow.

**Solutions**:
- Close other browser tabs and applications
- Use Chrome or Edge for best performance
- Reduce video resolution before uploading
- Split the project into smaller parts
- Enable hardware acceleration in your browser
- Use a computer with a faster CPU and more RAM

#### Browser Crashes

**Problem**: Browser crashes during processing.

**Solutions**:
- Reduce the number and size of media files
- Close other tabs and applications
- Update your browser to the latest version
- Check for browser extensions that might interfere
- Increase virtual memory/swap space on your system
- Use a computer with more RAM

#### High Memory Usage

**Problem**: Application uses excessive memory.

**Solutions**:
- Process fewer videos at once
- Use lower resolution videos
- Close other browser tabs and applications
- Restart the browser before starting a large project
- Use Chrome or Edge, which typically have better memory management

### Error Messages

#### "SharedArrayBuffer is not defined"

**Problem**: Your browser doesn't have SharedArrayBuffer enabled.

**Solutions**:
- Ensure you're using a supported browser version
- Access the application via HTTPS
- For local development, use the browser flags mentioned in Browser Compatibility
- In Firefox, enable `javascript.options.shared_memory` in about:config

#### "WebAssembly compilation failed"

**Problem**: Your browser couldn't compile the WebAssembly modules.

**Solutions**:
- Update your browser to the latest version
- Try a different browser (Chrome or Edge recommended)
- Check if your browser has WebAssembly enabled
- Ensure you have sufficient memory available

#### "Not enough memory"

**Problem**: The application ran out of memory during processing.

**Solutions**:
- Close other browser tabs and applications
- Process smaller or fewer media files
- Use a computer with more RAM
- Restart your browser before starting a large project

#### "Codec not supported"

**Problem**: Your browser doesn't support the media codec.

**Solutions**:
- Convert your media to a more widely supported format (H.264 MP4 for video, MP3 for audio)
- Try a different browser
- Install the required codec if possible (system-dependent)
- Check browser media support in the developer tools

## FAQ

### General Questions

**Q: Is my media uploaded to any server?**

A: No. CineFlux-AutoXML processes everything locally in your browser using WebAssembly technology. Your media files never leave your computer, ensuring complete privacy.

**Q: How large can my project be?**

A: The application supports up to 50 video clips with a combined size of 2 GB, and audio tracks up to 15 minutes long. However, browser limitations may reduce these maximums on some systems.

**Q: Can I save my project and continue later?**

A: Yes. The application includes a project saving feature that stores your project data in your browser's local storage. You can also export project files to your computer for backup or sharing.

**Q: Which editing software works best with the exported XML?**

A: Final Cut Pro X, Adobe Premiere Pro, and DaVinci Resolve all work well with the exported XML files. Each has specific export options optimized for that software.

### Technical Questions

**Q: Why does the application require specific browser settings?**

A: CineFlux-AutoXML uses advanced web technologies like WebAssembly and SharedArrayBuffer to provide near-native performance for media processing. These technologies require specific security settings in browsers.

**Q: Can I use CineFlux-AutoXML offline?**

A: Once the application has loaded completely, it can function offline. However, the initial load requires an internet connection to download the necessary resources.

**Q: Why is Chrome/Edge recommended over other browsers?**

A: Chrome and Edge (Chromium-based) currently have the most optimized implementations of WebAssembly and related technologies, resulting in better performance for CPU-intensive tasks like media processing.

**Q: How accurate is the beat detection?**

A: The beat detection algorithm is highly accurate for most music genres with clear rhythmic elements. It may be less accurate for classical music, ambient music, or tracks with complex time signatures or tempo changes.

### Usage Questions

**Q: Can I manually adjust the automatic edits?**

A: Yes. While the application generates edit decisions automatically, you can manually adjust every aspect of the edit in the Editing step, including timing, clip order, and transitions.

**Q: What video resolutions are supported?**

A: The application supports videos up to 4K resolution (3840x2160). However, higher resolutions require more processing power and memory. For optimal performance, 1080p (1920x1080) is recommended.

**Q: Can I use multiple audio tracks?**

A: Currently, the application supports one primary audio track per project. However, you can create multiple projects and combine them in your editing software.

**Q: How do I import the XML into my editing software?**

A: Each editing software has a slightly different import process. The Export step provides specific instructions for Final Cut Pro, Premiere Pro, and DaVinci Resolve after you generate the XML file.
