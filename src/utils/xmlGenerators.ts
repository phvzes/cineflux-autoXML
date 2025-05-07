// src/utils/xmlGenerators.ts

import { EditDecision } from '@/context/ProjectContext';

/**
 * Generates Adobe Premiere Pro XML from edit decisions
 * @param editDecisions Array of edit decisions
 * @param videoFiles Map of video files by ID
 * @param audioFile Optional audio file
 * @param settings Project settings
 * @returns XML string for Premiere Pro
 */
export function generatePremiereXML(
  editDecisions: any[],
  videoFiles: Record<string, File>,
  audioFile: File | null,
  settings: any
): string {
  try {
    // Validate inputs
    if (!editDecisions || editDecisions.length === 0) {
      throw new Error('No edit decisions provided');
    }
    
    if (Object.keys(videoFiles).length === 0) {
      throw new Error('No video files provided');
    }
    
    // Calculate sequence duration
    let sequenceDuration = 0;
    editDecisions.forEach(edit => {
      const endTime = edit.time + edit.duration;
      if (endTime > sequenceDuration) {
        sequenceDuration = endTime;
      }
    });
    
    // Generate XML header
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence>
    <name>CineFlux Auto-Generated Sequence</name>
    <duration>${Math.ceil(sequenceDuration * 30)}</duration>
    <rate>
      <timebase>30</timebase>
      <ntsc>TRUE</ntsc>
    </rate>
    <media>
      <video>
        <track>`;
    
    // Add video clips
    editDecisions.forEach((edit, index) => {
      const videoFile = videoFiles[edit.videoId];
      if (!videoFile) return;
      
      const startFrame = Math.round(edit.time * 30);
      const durationFrames = Math.round(edit.duration * 30);
      const mediaStartFrame = Math.round(edit.start * 30);
      
      xml += `
          <clipitem id="clipitem-${index + 1}">
            <name>${videoFile.name}</name>
            <duration>${durationFrames}</duration>
            <rate>
              <timebase>30</timebase>
              <ntsc>TRUE</ntsc>
            </rate>
            <start>${startFrame}</start>
            <end>${startFrame + durationFrames}</end>
            <file id="file-${index + 1}">
              <name>${videoFile.name}</name>
              <pathurl>file://${videoFile.name}</pathurl>
              <media>
                <video>
                  <samplecharacteristics>
                    <width>1920</width>
                    <height>1080</height>
                  </samplecharacteristics>
                </video>
              </media>
            </file>
            <sourcetrack>
              <mediatype>video</mediatype>
            </sourcetrack>
            <in>${mediaStartFrame}</in>
            <out>${mediaStartFrame + durationFrames}</out>
          </clipitem>`;
    });
    
    xml += `
        </track>
      </video>`;
    
    // Add audio track if available
    if (audioFile) {
      xml += `
      <audio>
        <track>
          <clipitem id="audio-1">
            <name>${audioFile.name}</name>
            <duration>${Math.ceil(sequenceDuration * 30)}</duration>
            <rate>
              <timebase>30</timebase>
              <ntsc>TRUE</ntsc>
            </rate>
            <start>0</start>
            <end>${Math.ceil(sequenceDuration * 30)}</end>
            <file id="audio-file-1">
              <name>${audioFile.name}</name>
              <pathurl>file://${audioFile.name}</pathurl>
              <media>
                <audio>
                  <samplecharacteristics>
                    <depth>16</depth>
                    <samplerate>48000</samplerate>
                  </samplecharacteristics>
                </audio>
              </media>
            </file>
          </clipitem>
        </track>
      </audio>`;
    }
    
    // Close XML
    xml += `
    </media>
  </sequence>
</xmeml>`;
    
    return xml;
  } catch (error) {
    console.error('Error generating Premiere XML:', error);
    throw error;
  }
}

/**
 * Generates Final Cut Pro XML from edit decisions
 * @param editDecisions Array of edit decisions
 * @param videoFiles Map of video files by ID
 * @param audioFile Optional audio file
 * @param settings Project settings
 * @returns XML string for Final Cut Pro
 */
export function generateFinalCutXML(
  editDecisions: any[],
  videoFiles: Record<string, File>,
  audioFile: File | null,
  settings: any
): string {
  try {
    // Validate inputs
    if (!editDecisions || editDecisions.length === 0) {
      throw new Error('No edit decisions provided');
    }
    
    if (Object.keys(videoFiles).length === 0) {
      throw new Error('No video files provided');
    }
    
    // Calculate sequence duration
    let sequenceDuration = 0;
    editDecisions.forEach(edit => {
      const endTime = edit.time + edit.duration;
      if (endTime > sequenceDuration) {
        sequenceDuration = endTime;
      }
    });
    
    // Generate XML header
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.8">
  <resources>`;
    
    // Add video resources
    Object.entries(videoFiles).forEach(([id, file], index) => {
      xml += `
    <asset id="asset-${index + 1}" name="${file.name}" src="file://${file.name}" />`;
    });
    
    // Add audio resource if available
    if (audioFile) {
      xml += `
    <asset id="audio-asset-1" name="${audioFile.name}" src="file://${audioFile.name}" />`;
    }
    
    xml += `
  </resources>
  <library>
    <event name="CineFlux Auto-Generated Event">
      <project name="CineFlux Auto-Generated Project">
        <sequence format="r1" duration="${sequenceDuration}s" tcStart="0s" tcFormat="NDF">
          <spine>`;
    
    // Add video clips
    editDecisions.forEach((edit, index) => {
      const videoFile = videoFiles[edit.videoId];
      if (!videoFile) return;
      
      xml += `
            <clip name="${videoFile.name}" offset="${edit.time}s" duration="${edit.duration}s" start="${edit.start}s" tcFormat="NDF">
              <video ref="asset-${index + 1}" />
            </clip>`;
    });
    
    // Add audio clip if available
    if (audioFile) {
      xml += `
            <audio name="${audioFile.name}" offset="0s" duration="${sequenceDuration}s" role="dialogue">
              <audio-component ref="audio-asset-1" />
            </audio>`;
    }
    
    // Close XML
    xml += `
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
    
    return xml;
  } catch (error) {
    console.error('Error generating Final Cut XML:', error);
    throw error;
  }
}

/**
 * Validates export settings and files
 * @param editDecisions Array of edit decisions
 * @param videoFiles Map of video files by ID
 * @param audioFile Optional audio file
 * @param format Export format ('premiere' or 'fcpx')
 * @returns Object with validation result and any error messages
 */
export function validateExportSettings(
  editDecisions: any[],
  videoFiles: Record<string, File>,
  audioFile: File | null,
  format: 'premiere' | 'fcpx'
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check edit decisions
  if (!editDecisions || editDecisions.length === 0) {
    errors.push('No edit decisions found. Please create some edits first.');
  }
  
  // Check video files
  if (Object.keys(videoFiles).length === 0) {
    errors.push('No video files found. Please add some video files.');
  } else {
    // Check if all video IDs in edit decisions exist in videoFiles
    editDecisions.forEach((edit, index) => {
      if (!videoFiles[edit.videoId]) {
        errors.push(`Video file for edit #${index + 1} not found.`);
      }
    });
  }
  
  // Check format
  if (format !== 'premiere' && format !== 'fcpx') {
    errors.push('Invalid export format. Please select either Premiere Pro or Final Cut Pro.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
