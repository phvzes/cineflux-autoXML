import React from 'react';
import { Scissors } from 'lucide-react';

interface ThumbnailGridProps {
  /**
   * Array of thumbnails with timestamps
   */
  thumbnails: { timestamp: number; dataUrl: string }[];
  /**
   * Array of scene boundaries in milliseconds
   */
  sceneBoundaries: number[];
  /**
   * Function to handle thumbnail click
   */
  onThumbnailClick?: (timestamp: number) => void;
  /**
   * Width of each thumbnail
   */
  thumbnailWidth?: number;
  /**
   * Height of each thumbnail
   */
  thumbnailHeight?: number;
  /**
   * Number of columns in the grid
   */
  columns?: number;
  /**
   * Whether to show timestamps
   */
  showTimestamps?: boolean;
  /**
   * Whether to show scene markers
   */
  showSceneMarkers?: boolean;
  /**
   * Current playback time in milliseconds
   */
  currentTime?: number;
}

/**
 * A grid component for displaying video thumbnails with scene markers
 */
const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  thumbnails,
  sceneBoundaries,
  onThumbnailClick,
  thumbnailWidth = 160,
  thumbnailHeight = 90,
  columns = 4,
  showTimestamps = true,
  showSceneMarkers = true,
  currentTime = 0,
}: any) => {
  // Convert current time to milliseconds if it's in seconds
  const currentTimeMs = currentTime < 1000 ? currentTime * 1000 : currentTime;

  // Format timestamp as MM:SS.ms
  const formatTimestamp = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Check if a thumbnail is at a scene boundary
  const isSceneBoundary = (timestamp: number): boolean => {
    return sceneBoundaries.some((boundary: any) => 
      Math.abs(timestamp - boundary) < 500 // Within 500ms
    );
  };

  // Check if a thumbnail is at the current playback position
  const isCurrentPosition = (timestamp: number): boolean => {
    return Math.abs(timestamp - currentTimeMs) < 500; // Within 500ms
  };

  return (
    <div className="thumbnail-grid">
      <div 
        className="grid gap-4" 
        style={{ 
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {thumbnails.map((thumbnail: any, index: any) => (
          <div 
            key={index} 
            className="thumbnail-container relative"
            onClick={() => onThumbnailClick?.(thumbnail.timestamp)}
          >
            {/* Scene boundary marker */}
            {showSceneMarkers && isSceneBoundary(thumbnail.timestamp) && (
              <div className="absolute -top-2 left-0 right-0 flex justify-center">
                <div className="bg-[#FF7A45] text-white px-2 py-1 rounded-md flex items-center text-xs z-10">
                  <Scissors size={12} className="mr-1" />
                  <span>Scene {sceneBoundaries.findIndex((b: any) => Math.abs(b - thumbnail.timestamp) < 500) + 1}</span>
                </div>
              </div>
            )}
            
            {/* Thumbnail image */}
            <div 
              className={`thumbnail relative overflow-hidden rounded-md cursor-pointer transition-all duration-200 ${
                isCurrentPosition(thumbnail.timestamp) ? 'ring-2 ring-[#FF7A45]' : ''
              }`}
              style={{ 
                width: `${thumbnailWidth}px`, 
                height: `${thumbnailHeight}px`,
                margin: '0 auto',
              }}
            >
              <img 
                src={thumbnail.dataUrl} 
                alt={`Frame at ${formatTimestamp(thumbnail.timestamp)}`}
                className="w-full h-full object-cover"
                style={{ 
                  filter: isCurrentPosition(thumbnail.timestamp) ? 'brightness(1.2)' : 'none' 
                }}
              />
              
              {/* Current position indicator */}
              {isCurrentPosition(thumbnail.timestamp) && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF7A45]"></div>
              )}
            </div>
            
            {/* Timestamp */}
            {showTimestamps && (
              <div className="text-center text-xs text-[#B0B0B5] mt-1">
                {formatTimestamp(thumbnail.timestamp)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThumbnailGrid;
