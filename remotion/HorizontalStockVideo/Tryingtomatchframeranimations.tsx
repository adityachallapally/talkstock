import React, {CSSProperties} from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

// Exact same "types" of segments
type AnimationType = 'text' | 'word' | 'character' | 'line';
type AnimationVariant =
  | 'fadeIn'
  | 'blurIn'
  | 'blurInUp'
  | 'blurInDown'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleUp'
  | 'scaleDown'
  | 'ml16'
  | 'dropIn'
  | 'clipDropIn'

// You had staggerTimings in seconds for Framer Motion
// We'll keep them here in "seconds" (like 0.05), then convert to frames in code:
const staggerTimings: Record<AnimationType, number> = {
  text: 0.06,
  word: 0.05,
  character: 0.03,
  line: 0.06,
};

/**
 * A small object describing each animation's hidden / show / exit styles
 * We only store the "from" & "to" for each phase. Then we'll interpolate
 * between them in the code below to mimic how Framer Motion does it.
 *
 * Each style is a CSSProperties object. We'll do linear interpolation
 * for numeric fields (like opacity, x/y translate in px, blur in px, scale).
 */
const ANIMATION_VARIANTS: Record<
  AnimationVariant,
  {
    hidden: CSSProperties;
    show: CSSProperties;
    exit: CSSProperties;
  }
> = {
  fadeIn: {
    hidden: {opacity: 0, transform: 'translateY(20px)'},
    show: {opacity: 1, transform: 'translateY(0px)'},
    exit: {opacity: 0, transform: 'translateY(20px)'},
  },
  blurIn: {
    hidden: {opacity: 0, filter: 'blur(10px)'},
    show: {opacity: 1, filter: 'blur(0px)'},
    exit: {opacity: 0, filter: 'blur(10px)'},
  },
  blurInUp: {
    hidden: {opacity: 0, filter: 'blur(10px)', transform: 'translateY(20px)'},
    show: {opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)'},
    exit: {opacity: 0, filter: 'blur(10px)', transform: 'translateY(20px)'},
  },
  blurInDown: {
    hidden: {opacity: 0, filter: 'blur(10px)', transform: 'translateY(-20px)'},
    show: {opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)'},
    exit: {opacity: 0, filter: 'blur(10px)', transform: 'translateY(-20px)'},
  },
  slideUp: {
    hidden: {opacity: 0, transform: 'translateY(20px)'},
    show: {opacity: 1, transform: 'translateY(0px)'},
    exit: {opacity: 0, transform: 'translateY(-20px)'},
  },
  slideDown: {
    hidden: {opacity: 0, transform: 'translateY(-20px)'},
    show: {opacity: 1, transform: 'translateY(0px)'},
    exit: {opacity: 0, transform: 'translateY(20px)'},
  },
  slideLeft: {
    hidden: {opacity: 0, transform: 'translateX(20px)'},
    show: {opacity: 1, transform: 'translateX(0px)'},
    exit: {opacity: 0, transform: 'translateX(-20px)'},
  },
  slideRight: {
    hidden: {opacity: 0, transform: 'translateX(-20px)'},
    show: {opacity: 1, transform: 'translateX(0px)'},
    exit: {opacity: 0, transform: 'translateX(20px)'},
  },
  scaleUp: {
    hidden: {opacity: 0, transform: 'scale(0.5)'},
    show: {opacity: 1, transform: 'scale(1)'},
    exit: {opacity: 0, transform: 'scale(0.5)'},
  },
  scaleDown: {
    hidden: {opacity: 0, transform: 'scale(1.5)'},
    show: {opacity: 1, transform: 'scale(1)'},
    exit: {opacity: 0, transform: 'scale(1.5)'},
  },
  ml16: {
    hidden: {
      // characters start "above" (translateY: -100px) and fully transparent
      opacity: 0,
      transform: 'translateY(-100px)',
    },
    show: {
      // final: fully visible, no translation
      opacity: 1,
      transform: 'translateY(0px)',
    },
    exit: {
      // fade them all out
      opacity: 0,
      transform: 'translateY(0px)',
    },
  },
  dropIn: {
    hidden: {
      opacity: 0,
      transform: 'translateY(-100px)',
      // Optional: add a slight rotation for more dynamic effect
      // transform: 'translateY(-100px) rotate(-5deg)',
    },
    show: {
      opacity: 1,
      transform: 'translateY(0px)',
      // transform: 'translateY(0px) rotate(0deg)',
    },
    exit: {
      opacity: 0,
      transform: 'translateY(20px)',
      // transform: 'translateY(20px) rotate(5deg)',
    },
  },
  clipDropIn: {
    hidden: {
      opacity: 1,
      transform: 'translateY(-100%)',
      clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)',  // Start with just the top edge
    },
    show: {
      opacity: 1,
      transform: 'translateY(0)',
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',  // Reveal full character
    },
    exit: {
      opacity: 0,
      transform: 'translateY(5px)',
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
    },
  },
};

// We'll define the props for our Remotion version:
interface RemotionTextAnimateProps {
  /**
   * The text content to animate
   */
  children: string;
  /**
   * The element type to render, e.g. "p", "h1", etc.
   */
  as?: keyof JSX.IntrinsicElements;
  /**
   * Class name for the container
   */
  className?: string;
  /**
   * Class name for each segment
   */
  segmentClassName?: string;
  /**
   * How we split the text
   */
  by?: AnimationType;
  /**
   * Which preset animation to use
   */
  animation?: AnimationVariant;
  /**
   * In frames, the EXACT frame to begin the entrance animation
   */
  entranceStartFrame: number;
  /**
   * In frames, how long the entrance animation lasts (e.g. 9 frames = 0.3s @ 30fps)
   */
  entranceDurationInFrames: number;
  /**
   * In frames, how long it remains fully visible before exit starts
   */
  showDurationInFrames: number;
  /**
   * In frames, how long the exit animation lasts
   */
  exitDurationInFrames: number;
}

/**
 * The main Remotion "TextAnimate" replacement
 *
 * Usage example in your <Composition>:
 * 
 * <RemotionTextAnimate
 *    entranceStartFrame={30}
 *    entranceDurationInFrames={9}
 *    showDurationInFrames={120}
 *    exitDurationInFrames={9}
 *    animation="blurInUp"
 *    by="word"
 *    className="text-4xl font-bold"
 * >
 *   This is my animated text!
 * </RemotionTextAnimate>
 */
export const RemotionTextAnimate: React.FC<RemotionTextAnimateProps> = ({
  children,
  as = 'p',
  className,
  segmentClassName,
  by = 'word',
  animation = 'fadeIn',
  entranceStartFrame,
  entranceDurationInFrames,
  showDurationInFrames,
  exitDurationInFrames,
}) => {
  // Current Remotion frame and fps
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Convert your "staggerTimings" (e.g. 0.05s) into frames
  const staggerFrames = staggerTimings[by] * fps;

  // We'll figure out the segments of the text
  let segments: string[] = [];
  switch (by) {
    case 'word':
      // Keep spaces as separate segments so spacing doesn't vanish
      segments = children.split(/(\s+)/);
      break;
    case 'character':
      segments = children.split('');
      break;
    case 'line':
      segments = children.split('\n');
      break;
    case 'text':
    default:
      segments = [children];
      break;
  }

  // For convenience, store your chosen variant's from/to styles
  const {hidden, show, exit} = ANIMATION_VARIANTS[animation];

  // A helper to blend numeric or certain transform fields
  // between two style objects based on `progress` in [0..1].
  // This is a simplified version: we handle opacity, transform (translateX/Y/scale),
  // and filter (blur) exactly as in your code. 
  const interpolateStyle = (
    from: CSSProperties,
    to: CSSProperties,
    progress: number
  ): CSSProperties => {
    const style: CSSProperties = {};

    // Opacity
    if (typeof from.opacity === 'number' && typeof to.opacity === 'number') {
      style.opacity = interpolate(progress, [0, 1], [from.opacity, to.opacity]);
    }

    // filter: blur(...)
    if (from.filter && to.filter) {
      // from "blur(10px)" to "blur(0px)", for example
      const fromBlurMatch = /blur\(([\d.]+)px\)/.exec(from.filter as string);
      const toBlurMatch = /blur\(([\d.]+)px\)/.exec(to.filter as string);

      if (fromBlurMatch && toBlurMatch) {
        const fromBlur = parseFloat(fromBlurMatch[1]);
        const toBlur = parseFloat(toBlurMatch[1]);
        const current = interpolate(progress, [0, 1], [fromBlur, toBlur]);
        style.filter = `blur(${current}px)`;
      } else {
        // If either doesn't match, just pick to.filter at 1
        style.filter = progress < 1 ? from.filter : to.filter;
      }
    } else if (to.filter) {
      // If we only have a "to.filter," maybe fade from none to that
      style.filter = progress === 1 ? to.filter : undefined;
    }

    // transform (translate / scale)
    // We'll parse out numeric values from possible "translateX()", "translateY()", "scale()"
    const parseTransform = (transformStr?: string) => {
      // Return an object like {translateX: 20, translateY: -10, scale: 1.5}
      const result: Record<string, number> = {
        translateX: 0,
        translateY: 0,
        scale: 1,
      };
      if (!transformStr) return result;

      // E.g. "translateY(20px) translateX(-10px) scale(1.5)"
      const translateXMatch = /translateX\(([-\d.]+)px\)/.exec(transformStr);
      const translateYMatch = /translateY\(([-\d.]+)px\)/.exec(transformStr);
      const scaleMatch = /scale\(([\d.]+)\)/.exec(transformStr);

      if (translateXMatch) {
        result.translateX = parseFloat(translateXMatch[1]);
      }
      if (translateYMatch) {
        result.translateY = parseFloat(translateYMatch[1]);
      }
      if (scaleMatch) {
        result.scale = parseFloat(scaleMatch[1]);
      }
      return result;
    };

    const fromT = parseTransform(from.transform as string);
    const toT = parseTransform(to.transform as string);

    const currentTranslateX = interpolate(
      progress,
      [0, 1],
      [fromT.translateX, toT.translateX]
    );
    const currentTranslateY = interpolate(
      progress,
      [0, 1],
      [fromT.translateY, toT.translateY]
    );
    const currentScale = interpolate(progress, [0, 1], [fromT.scale, toT.scale]);

    // Rebuild the transform string
    let transformPieces: string[] = [];
    if (currentTranslateX !== 0) {
      transformPieces.push(`translateX(${currentTranslateX}px)`);
    }
    if (currentTranslateY !== 0) {
      transformPieces.push(`translateY(${currentTranslateY}px)`);
    }
    if (currentScale !== 1) {
      transformPieces.push(`scale(${currentScale})`);
    }

    style.transform = transformPieces.length
      ? transformPieces.join(' ')
      : undefined;

    return style;
  };

  // Now the main logic: 
  // For each segment, we figure out how far along the timeline we are in
  // the "enter → show → exit" process.

  // Entrance overall starts at `entranceStartFrame`.
  // The segment i is further delayed by i * staggerFrames.
  // So each segment's entrance begins at `segmentEntranceStart = entranceStartFrame + i*staggerFrames`.
  // Entrance ends at `segmentEntranceEnd = segmentEntranceStart + entranceDurationInFrames`.
  // Then it stays fully visible until `segmentExitStart = segmentEntranceEnd + showDurationInFrames`.
  // Exit ends at `segmentExitEnd = segmentExitStart + exitDurationInFrames`.

  // We'll define a helper that returns the style for a given index (segment).
  const getSegmentStyle = (i: number): CSSProperties => {
    const segmentEntranceStart = entranceStartFrame + i * staggerFrames;
    const segmentEntranceEnd = segmentEntranceStart + entranceDurationInFrames;
    const segmentExitStart = segmentEntranceEnd + showDurationInFrames;
    const segmentExitEnd = segmentExitStart + exitDurationInFrames;

    // (1) If frame < segmentEntranceStart: style = hidden
    if (frame < segmentEntranceStart) {
      return hidden;
    }
    // (2) If segmentEntranceStart <= frame < segmentEntranceEnd,
    // we are in the "entering" range: 0..1 progress
    if (frame < segmentEntranceEnd) {
      const enterProgress = (frame - segmentEntranceStart) / entranceDurationInFrames;
      // Interpolate from hidden => show
      return interpolateStyle(hidden, show, enterProgress);
    }
    // (3) If segmentEntranceEnd <= frame < segmentExitStart, we are fully shown
    if (frame < segmentExitStart) {
      return show;
    }
    // (4) If segmentExitStart <= frame < segmentExitEnd,
    // we are in the "exiting" range: 0..1 progress
    if (frame < segmentExitEnd) {
      const exitProgress = (frame - segmentExitStart) / exitDurationInFrames;
      // Interpolate from show => exit
      return interpolateStyle(show, exit, exitProgress);
    }
    // (5) If frame >= segmentExitEnd, we're fully hidden again
    return exit;
  };

  // Render container as the "as" prop
  const Container = as;

  return (
    <Container className={className} style={{whiteSpace: 'pre-wrap'}}>
      {segments.map((segment, i) => {
        const style = getSegmentStyle(i);
        return (
          <span
            key={`${by}-${i}-${segment}`}
            className={segmentClassName}
            style={{
              display: by === 'line' ? 'block' : 'inline-block',
              whiteSpace: 'pre',
              ...style,
            }}
          >
            {segment}
          </span>
        );
      })}
    </Container>
  );
};
