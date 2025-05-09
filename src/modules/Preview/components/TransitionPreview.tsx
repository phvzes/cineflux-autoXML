
import React, { useEffect, useRef } from 'react';
import { Transition, TransitionType } from '../../../types/EditDecision';

interface TransitionPreviewProps {
  /** The transition to preview */
  transition: Transition | null;
  /** Whether the transition preview is visible */
  isVisible: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * Component for previewing transitions between clips
 */
const TransitionPreview: React.FC<TransitionPreviewProps> = ({
  transition,
  isVisible,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Render transition effect on canvas
  useEffect(() => {
    if (!canvasRef.current || !transition || !isVisible) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render different transition effects based on type
    switch (transition.type) {
      case TransitionType.DISSOLVE:
        renderDissolve(ctx, canvas.width, canvas.height);
        break;
      case TransitionType.FADE_IN:
        renderFade(ctx, canvas.width, canvas.height, 'in');
        break;
      case TransitionType.FADE_OUT:
        renderFade(ctx, canvas.width, canvas.height, 'out');
        break;
      case TransitionType.WIPE:
        renderWipe(ctx, canvas.width, canvas.height, transition.parameters?.direction || 'left');
        break;
      case TransitionType.DIP_TO_BLACK:
        renderDip(ctx, canvas.width, canvas.height, 'black');
        break;
      case TransitionType.DIP_TO_WHITE:
        renderDip(ctx, canvas.width, canvas.height, 'white');
        break;
      default:
        // For cut or custom transitions, just show a simple indicator
        renderDefault(ctx, canvas.width, canvas.height);
    }
  }, [transition, isVisible]);
  
  // Render dissolve transition
  const renderDissolve = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    
    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Dissolve Transition', width / 2, height / 2);
  };
  
  // Render fade transition
  const renderFade = (ctx: CanvasRenderingContext2D, width: number, height: number, direction: 'in' | 'out') => {
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    if (direction === 'in') {
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    } else {
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    }
    
    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Fade ${direction.toUpperCase()} Transition`, width / 2, height / 2);
  };
  
  // Render wipe transition
  const renderWipe = (ctx: CanvasRenderingContext2D, width: number, height: number, direction: string) => {
    // Determine gradient direction
    let gradient;
    switch (direction) {
      case 'right':
        gradient = ctx.createLinearGradient(0, 0, width, 0);
        break;
      case 'up':
        gradient = ctx.createLinearGradient(0, height, 0, 0);
        break;
      case 'down':
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        break;
      default: // left
        gradient = ctx.createLinearGradient(width, 0, 0, 0);
    }
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    
    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Wipe ${direction.toUpperCase()} Transition`, width / 2, height / 2);
  };
  
  // Render dip transition
  const renderDip = (ctx: CanvasRenderingContext2D, width: number, height: number, color: 'black' | 'white') => {
    // Fill with color
    ctx.fillStyle = color === 'black' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, 0, width, height);
    
    // Add text
    ctx.fillStyle = color === 'black' ? 'white' : 'black';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Dip to ${color.toUpperCase()} Transition`, width / 2, height / 2);
  };
  
  // Render default transition indicator
  const renderDefault = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw a simple indicator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Transition', width / 2, height / 2);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={`transition-preview ${className}`} style={{ display: isVisible ? 'block' : 'none' }}>
      <canvas ref={canvasRef} className="transition-canvas" />
      {transition && (
        <div className="transition-info">
          <div className="transition-type">{transition.type}</div>
          <div className="transition-duration">{Number(transition.duration).toFixed(2)}s</div>
        </div>
      )}
    </div>
  );
};

export default TransitionPreview;
