import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface CurtainTextRevealProps {
  text: string;
  startFrame: number;
  dropDuration: number;
  scaleDuration: number;
  initialScale?: number;
  className?: string;
}

export const CurtainTextReveal: React.FC<CurtainTextRevealProps> = ({
  text,
  startFrame,
  dropDuration,
  scaleDuration,
  initialScale = 5,
  className = 'text-6xl font-bold',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Replace linear scale with spring-based scale
  const scaleProgress = spring({
    frame: frame - (startFrame + dropDuration),
    fps,
    config: {
      damping: 20,     // Smooth damping for natural deceleration
      mass: 0.8,       // Gives it some weight
      stiffness: 100,  // Controls the speed of the scale
    },
    durationInFrames: scaleDuration,
  });

  // Calculate current scale with spring animation
  const currentScale = frame < startFrame + dropDuration 
    ? initialScale 
    : interpolate(
        scaleProgress,
        [0, 1],
        [initialScale, 1],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );

  // Calculate letter spacing with eased interpolation for smoother transition
  const letterSpacing = interpolate(
    currentScale,
    [1, initialScale],
    [0.1, 0.5],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => {
        // Add subtle easing to letter spacing
        return 1 - Math.pow(1 - t, 3);
      }
    }
  );

  // Calculate the total width of the text to position the curtain
  const measureDiv = React.useRef<HTMLDivElement>(null);
  
  // Add a subtle fade for the curtain
  const curtainOpacity = interpolate(
    frame - startFrame,
    [0, 5, dropDuration, dropDuration + 10],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        perspective: '1000px',
        overflow: 'visible',
        position: 'relative',
      }}
    >
      {/* Hidden div to measure text width */}
      <div
        ref={measureDiv}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          display: 'flex',
          gap: `${letterSpacing}em`,
        }}
      >
        {text.split('').map((char, index) => (
          <div key={index} className={className}>{char}</div>
        ))}
      </div>

      {/* Enhanced curtain with gradient and animation */}
      <div
        style={{
          position: 'absolute',
          height: '3px',
          background: 'linear-gradient(90deg, transparent 0%, white 20%, white 80%, transparent 100%)',
          width: measureDiv.current?.offsetWidth || 'auto',
          transform: `scale(${currentScale}) translateY(-0.6em)`,
          transformOrigin: 'center center',
          opacity: curtainOpacity,
          boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: `${letterSpacing}em`,
          transform: `scale(${currentScale})`,
          transformOrigin: 'center center',
        }}
      >
        {text.split('').map((char, index) => {
          const delay = index * 2; // Slightly faster sequence
          const charDropProgress = spring({
            frame: frame - (startFrame + delay),
            fps,
            config: {
              damping: 15,    // Increased damping for smoother landing
              mass: 0.4,      // Reduced mass for lighter feel
              stiffness: 120, // Increased stiffness for snappier movement
            },
            durationInFrames: dropDuration,
          });

          const isTimeToShow = frame >= startFrame + delay;

          // Enhanced drop animation with subtle rotation
          const yOffset = interpolate(
            charDropProgress,
            [0, 1],
            [-0.6, 0],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          // Add subtle rotation during drop
          const rotation = interpolate(
            charDropProgress,
            [0, 0.5, 1],
            [2, -1, 0],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          // Fade in as letters drop
          const opacity = interpolate(
            charDropProgress,
            [0, 0.2],
            [0, 1],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          return (
            <div
              key={index}
              className={className}
              style={{
                fontWeight: 'bold',
                lineHeight: 1,
                transform: `translateY(${yOffset}em) rotate(${rotation}deg)`,
                display: 'inline-block',
                position: 'relative',
                whiteSpace: 'nowrap',
                opacity: isTimeToShow ? opacity : 0,
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
              }}
            >
              {char}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 