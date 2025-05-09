
import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-markers';
import { TimelineCutPoint, MarkerType } from '../../types/EditDecision';
import useFrameAccurate from '../../hooks/useFrameAccurate';

// Import CSS
import '../../styles/preview-player.css';

// Define marker styles in the component
const markerStyles = `
.vjs-marker {
  position: absolute;
  background-color: red;
  width: 5px;
  height: 100%;
  z-index: 30;
  margin-left: -3px;
}

.vjs-marker.edit-point {
  background-color: #ff0000;
}

.vjs-marker.transition-start {
  background-color: #00ff00;
}

.vjs-marker.transition-end {
  background-color: #0000ff;
}

.vjs-marker-tooltip {
  position: absolute;
  bottom: 15px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 12px;
  white-space: nowrap;
}
`;

interface PreviewPlayerProps {
  /** Source URL for the video */
  src: string;
  /** Width of the player */
  width?: number;
  /** Height of the player */
  height?: number;
  /** Framerate of the video */
  fps?: number;
  /** Whether to autoplay the video */
  autoplay?: boolean;
  /** Whether to loop the video */
  loop?: boolean;
  /** Whether to mute the video */
  muted?: boolean;
  /** Whether to show controls */
  controls?: boolean;
  /** Array of markers to display on the timeline */
  markers?: TimelineCutPoint[];
  /** Callback when the current time changes */
  onTimeUpdate?: (time: number) => void;
  /** Callback when the player is ready */
  onReady?: (player: any) => void;
  /** Callback when the video ends */
  onEnded?: () => void;
  /** Callback when a marker is clicked */
  onMarkerClick?: (marker: TimelineCutPoint) => void;
}

/**
 * Video player component with frame-accurate controls using video.js
 */
const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  src,
  width = 640,
  height = 360,
  fps = 30,
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  markers = [],
  onTimeUpdate,
  onReady,
  onEnded,
  onMarkerClick
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [duration, setDuration] = useState(0);
  
  // Add marker styles to the document
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = markerStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Initialize frame-accurate controls
  const {
    currentTime,
    currentFrame,
    totalFrames,
    seekToFrame,
    stepForward,
    stepBackward,
    handleTimeUpdate,
    formatTimecode,
    setPlayerRef
  } = useFrameAccurate({
    fps,
    duration,
    onFrameChange: (frame, time) => {
      if (onTimeUpdate) {
        onTimeUpdate(time);
      }
    }
  });
  
  // Convert markers to video.js marker format
  const convertMarkersToVideoJsFormat = useCallback(() => {
    return markers.map(marker => {
      let markerClass = 'edit-point';
      
      if (marker.type === MarkerType.IN) {
        markerClass = 'transition-start';
      } else if (marker.type === MarkerType.OUT) {
        markerClass = 'transition-end';
      }
      
      return {
        time: typeof marker.position === 'number' ? marker.position : 0,
        text: marker.label || `Marker at ${formatTimecode(typeof marker.position === 'number' ? marker.position : 0)}`,
        class: markerClass,
        id: marker.id,
        marker: marker
      };
    });
  }, [markers, formatTimecode]);
  
  // Initialize video.js player
  useEffect(() => {
    if (!videoRef.current) return;
    
    // Initialize player
    const videoElement = videoRef.current;
    const player = videojs(videoElement, {
      controls,
      autoplay,
      loop,
      muted,
      fluid: true,
      preload: 'auto',
      html5: {
        vhs: {
          overrideNative: true
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false
      },
      controlBar: {
        pictureInPictureToggle: false,
        fullscreenToggle: true,
        volumePanel: {
          inline: false
        }
      }
    });
    
    // Add custom buttons for frame stepping
    const controlBar = player.controlBar;
    
    // Add frame step backward button
    const frameBackButton = controlBar.addChild('button', {}, 1);
    frameBackButton.el().innerHTML = '&lt;';
    frameBackButton.addClass('vjs-frame-button');
    frameBackButton.on('click', () => {
      stepBackward();
    });
    
    // Add frame step forward button
    const frameForwardButton = controlBar.addChild('button', {}, 2);
    frameForwardButton.el().innerHTML = '&gt;';
    frameForwardButton.addClass('vjs-frame-button');
    frameForwardButton.on('click', () => {
      stepForward();
    });
    
    // Add timecode display
    const timecodeDisplay = controlBar.addChild('component', {}, 3);
    timecodeDisplay.addClass('vjs-timecode-display');
    timecodeDisplay.el().innerHTML = formatTimecode(0);
    
    // Update timecode display on time update
    player.on('timeupdate', () => {
      const time = player.currentTime();
      timecodeDisplay.el().innerHTML = formatTimecode(time);
      handleTimeUpdate(time);
    });
    
    // Set player reference
    playerRef.current = player;
    setPlayerRef(player);
    
    // Initialize markers plugin
    if (markers.length > 0) {
      player.markers({
        markerStyle: {
          width: '5px',
          'background-color': 'red'
        },
        markerTip: {
          display: true,
          text: (marker: any) => marker.text
        },
        breakOverlay: {
          display: false
        },
        onMarkerClick: (marker: any) => {
          if (onMarkerClick && marker.marker) {
            onMarkerClick(marker.marker);
          }
        },
        markers: convertMarkersToVideoJsFormat()
      });
    }
    
    // Set up event listeners
    player.on('ready', () => {
      if (onReady) {
        onReady(player);
      }
    });
    
    player.on('ended', () => {
      if (onEnded) {
        onEnded();
      }
    });
    
    player.on('loadedmetadata', () => {
      setDuration(player.duration());
    });
    
    // Clean up on unmount
    return () => {
      if (player) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);
  
  // Update markers when they change
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !player.markers) return;
    
    player.markers.removeAll();
    player.markers.add(convertMarkersToVideoJsFormat());
  }, [markers, convertMarkersToVideoJsFormat]);
  
  // Update source when it changes
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    
    player.src({ src, type: 'video/mp4' });
  }, [src]);
  
  return (
    <div className="preview-player" style={{ width, height }}>
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin vjs-big-play-centered"
          playsInline
        >
          <source src={src} type="video/mp4" />
        </video>
      </div>
      <div className="frame-controls">
        <button onClick={stepBackward} className="frame-control-button">
          &lt;
        </button>
        <span className="frame-display">
          Frame: {currentFrame} / {totalFrames}
        </span>
        <button onClick={stepForward} className="frame-control-button">
          &gt;
        </button>
      </div>
    </div>
  );
};

export default PreviewPlayer;
