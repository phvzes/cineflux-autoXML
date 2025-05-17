import React from 'react';
import { BeatDetectionDemo } from '../components/audio';

/**
 * Test page for beat detection functionality
 */
const BeatDetectionTest: React.FC = () => {
  return (
    <div className="beat-detection-test-page" style={{ padding: '20px' }}>
      <h1>Beat Detection Test</h1>
      <p>
        This page demonstrates the beat detection functionality using the Web Audio API.
        You can upload your own audio file or use the sample provided below.
      </p>
      
      <BeatDetectionDemo 
        initialAudioUrl="/samples/sample-beat.mp3"
        width={800}
        height={200}
      />
      
      <div style={{ marginTop: '40px' }}>
        <h2>How It Works</h2>
        <p>
          The beat detection algorithm analyzes the audio file in several steps:
        </p>
        <ol>
          <li>The audio file is loaded and decoded using the Web Audio API</li>
          <li>The waveform is extracted for visualization</li>
          <li>
            Energy levels are calculated in small time windows (typically 50ms)
            to detect significant changes in amplitude
          </li>
          <li>
            Beats are identified as peaks in energy that exceed the local average
            by a certain threshold
          </li>
          <li>
            The tempo (BPM) is estimated by analyzing the intervals between detected beats
          </li>
        </ol>
        
        <h2>Features</h2>
        <ul>
          <li>Real-time waveform visualization</li>
          <li>Beat markers displayed on the waveform</li>
          <li>BPM (beats per minute) detection</li>
          <li>Interactive playback with position tracking</li>
          <li>Detailed analysis results</li>
        </ul>
      </div>
    </div>
  );
};

export default BeatDetectionTest;
