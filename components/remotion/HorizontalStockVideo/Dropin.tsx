import React, {CSSProperties} from 'react';
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * Very similar to your original DropInText component,
 * but tweaked for a quick “fall from the top” effect.
 */

// How many seconds to stagger each character (at 30fps, 0.02s = ~0.6 frames)
const STAGGER_PER_CHARACTER_SECONDS = 0.02;

interface DropInTextProps {
  text: string;
  entranceStartFrame: number;
  entranceDurationInFrames: number;
  holdDurationInFrames: number;
  exitDurationInFrames: number;
  dropOffset?: number;    // how many px above to start
  animateExit?: boolean;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  segmentClassName?: string;
}

export const DropInText: React.FC<DropInTextProps> = ({
  text,
  entranceStartFrame,
  entranceDurationInFrames,
  holdDurationInFrames,
  exitDurationInFrames,
  dropOffset = 200,
  animateExit = false,
  as = 'p',
  className,
  segmentClassName,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Stagger (in frames) for each character
  const staggerInFrames = STAGGER_PER_CHARACTER_SECONDS * fps;

  // We'll split by character so each letter animates in
  const segments = text.split('');

  const Container = as;

  // Figure out each character’s transform/opacity at the current frame
  const getStyleForIndex = (index: number): CSSProperties => {
    const start = entranceStartFrame + index * staggerInFrames; // each char starts a bit later
    const end = start + entranceDurationInFrames;               // entrance finishes here
    const holdEnd = end + holdDurationInFrames;                 // fully visible until here
    const exitEnd = holdEnd + exitDurationInFrames;             // exit finishes here

    // If we haven't reached the entrance yet, keep it hidden above
    if (frame < start) {
      return {
        opacity: 0,
        transform: `translateY(${-dropOffset}px)`,
      };
    }

    // Entrance in progress
    if (frame >= start && frame < end) {
      const entranceProgress = spring({
        frame: frame - start,
        fps,
        config: {
          mass: 0.5,
          damping: 10,
        },
        durationInFrames: entranceDurationInFrames,
      });
      const translateY = interpolate(entranceProgress, [0, 1], [-dropOffset, 0]);
      const opacity = interpolate(entranceProgress, [0, 1], [0, 1]);
      return {
        opacity,
        transform: `translateY(${translateY}px)`,
      };
    }

    // Fully on-screen, waiting to exit
    if (frame >= end && frame < holdEnd) {
      return {
        opacity: 1,
        transform: 'translateY(0)',
      };
    }

    // If we don't animate the exit, just stay in place
    if (!animateExit) {
      return {
        opacity: 1,
        transform: 'translateY(0)',
      };
    }

    // Exit in progress
    if (frame >= holdEnd && frame < exitEnd) {
      const exitProgress = spring({
        frame: frame - holdEnd,
        fps,
        config: {
          mass: 0.5,
          damping: 10,
        },
        durationInFrames: exitDurationInFrames,
      });
      const translateY = interpolate(exitProgress, [0, 1], [0, -dropOffset]);
      const opacity = interpolate(exitProgress, [0, 1], [1, 0]);
      return {
        opacity,
        transform: `translateY(${translateY}px)`,
      };
    }

    // Past the exit end => hidden above
    return {
      opacity: 0,
      transform: `translateY(${-dropOffset}px)`,
    };
  };

  return (
    <Container className={className} style={{whiteSpace: 'pre'}}>
      {segments.map((letter, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            ...getStyleForIndex(i),
          }}
          className={segmentClassName}
        >
          {letter}
        </span>
      ))}
    </Container>
  );
};

// Example usage in a Remotion composition
export const MyComposition: React.FC = () => {
  const {fps} = useVideoConfig();

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#000',
        color: '#fff',
        fontSize: 100,
        fontWeight: 700,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <DropInText
        text="CERTIFICATE"
        entranceStartFrame={0}
        entranceDurationInFrames={6}   // fast entrance
        holdDurationInFrames={20}     // how long to hold
        exitDurationInFrames={0}      // 0 => no exit
        dropOffset={250}             // start 250px above
      />
    </div>
  );
};
