import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface BigTextRevealProps {
  text: string;
  startFrame: number;
  dropDuration: number;
  scaleDuration: number;
  initialScale?: number;
  className?: string;  // Just a simple string
}

export const BigTextReveal: React.FC<BigTextRevealProps> = ({
  text,
  startFrame,
  dropDuration,
  scaleDuration,
  initialScale = 5,
  className = 'text-6xl font-bold',  // Default classes as a string
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Phase 1: Drop In Animation
  const dropProgress = spring({
    frame: frame - startFrame,
    fps,
    config: {
      damping: 12,
      mass: 0.5,
      stiffness: 100,
    },
    durationInFrames: dropDuration,
  });

  // Phase 2: Scale Down Animation
  const scaleProgress = interpolate(
    frame - (startFrame + dropDuration),
    [0, scaleDuration],
    [initialScale, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Calculate current scale
  const currentScale = frame < startFrame + dropDuration ? initialScale : scaleProgress;

  // Calculate letter spacing based on scale
  const letterSpacing = interpolate(
    currentScale,
    [1, initialScale],
    [0.1, 0.5],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        perspective: '1000px',
        overflow: 'visible',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: `${letterSpacing}em`,
          transform: `scale(${currentScale})`,
          transformOrigin: 'center center',
          position: 'absolute',
        }}
      >
        {text.split('').map((char, index) => {
          const delay = index * 3;
          const charDropProgress = spring({
            frame: frame - (startFrame + delay),
            fps,
            config: {
              damping: 12,
              mass: 0.5,
              stiffness: 100,
            },
            durationInFrames: dropDuration,
          });

          const yOffset = interpolate(
            charDropProgress,
            [0, 1],
            [-150, 0],
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
                transform: `translateY(${yOffset}vh)`,
                display: 'inline-block',
                position: 'relative',
                whiteSpace: 'nowrap',
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