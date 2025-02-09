import React, { CSSProperties } from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';

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
  | 'bigClipDropIn';

const staggerTimings: Record<AnimationType, number> = {
  text: 0.06,
  word: 0.05,
  character: 0.03,
  line: 0.06,
};

const ANIMATION_VARIANTS: Record<
  AnimationVariant,
  {
    hidden: CSSProperties;
    show: CSSProperties;
    exit: CSSProperties;
  }
> = {
  fadeIn: {
    hidden: { opacity: 0, transform: 'translateY(20px)' },
    show: { opacity: 1, transform: 'translateY(0px)' },
    exit: { opacity: 0, transform: 'translateY(20px)' },
  },
  blurIn: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    show: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' },
  },
  blurInUp: {
    hidden: { opacity: 0, filter: 'blur(10px)', transform: 'translateY(20px)' },
    show: { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' },
    exit: { opacity: 0, filter: 'blur(10px)', transform: 'translateY(20px)' },
  },
  blurInDown: {
    hidden: { opacity: 0, filter: 'blur(10px)', transform: 'translateY(-20px)' },
    show: { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' },
    exit: { opacity: 0, filter: 'blur(10px)', transform: 'translateY(-20px)' },
  },
  slideUp: {
    hidden: { opacity: 0, transform: 'translateY(20px)' },
    show: { opacity: 1, transform: 'translateY(0px)' },
    exit: { opacity: 0, transform: 'translateY(-20px)' },
  },
  slideDown: {
    hidden: { opacity: 0, transform: 'translateY(-20px)' },
    show: { opacity: 1, transform: 'translateY(0px)' },
    exit: { opacity: 0, transform: 'translateY(20px)' },
  },
  slideLeft: {
    hidden: { opacity: 0, transform: 'translateX(20px)' },
    show: { opacity: 1, transform: 'translateX(0px)' },
    exit: { opacity: 0, transform: 'translateX(-20px)' },
  },
  slideRight: {
    hidden: { opacity: 0, transform: 'translateX(-20px)' },
    show: { opacity: 1, transform: 'translateX(0px)' },
    exit: { opacity: 0, transform: 'translateX(20px)' },
  },
  scaleUp: {
    hidden: { opacity: 0, transform: 'scale(0.5)' },
    show: { opacity: 1, transform: 'scale(1)' },
    exit: { opacity: 0, transform: 'scale(0.5)' },
  },
  scaleDown: {
    hidden: { opacity: 0, transform: 'scale(1.5)' },
    show: { opacity: 1, transform: 'scale(1)' },
    exit: { opacity: 0, transform: 'scale(1.5)' },
  },
  ml16: {
    hidden: {
      opacity: 0,
      transform: 'translateY(-100px)',
    },
    show: {
      opacity: 1,
      transform: 'translateY(0px)',
    },
    exit: {
      opacity: 0,
      transform: 'translateY(0px)',
    },
  },
  dropIn: {
    hidden: {
      opacity: 0,
      transform: 'translateY(-100px)',
    },
    show: {
      opacity: 1,
      transform: 'translateY(0px)',
    },
    exit: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
  },
  // "Slot drop" with fade + an ease-out curve
  clipDropIn: {
    hidden: {
      opacity: 0,
      transform: 'translateY(-100%)',
    },
    show: {
      opacity: 1,
      transform: 'translateY(0%)',
    },
    exit: {
      opacity: 1,
      transform: 'translateY(0%)',
    },
  },
  // In your ANIMATION_VARIANTS:
  bigClipDropIn: {
    hidden: {
      opacity: 0,
      transform: 'translateY(-100%) scale(2)', // Start off-screen, scaled up
    },
    show: {
      opacity: 1,
      transform: 'translateY(0%) scale(2)',    // Animate in, still large
    },
    exit: {
      opacity: 1,
      transform: 'translateY(0%) scale(1)',    // End at normal scale
    },
  },

};

interface RemotionTextAnimateProps {
  children: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  segmentClassName?: string;
  by?: AnimationType;
  animation?: AnimationVariant;
  entranceStartFrame: number;
  entranceDurationInFrames: number;
  showDurationInFrames: number;
  exitDurationInFrames: number;
}

/**
 * RemotionTextAnimate
 * - Adds an EASE-OUT curve during the entrance to give a more natural
 *   "drop" feel (letters start quickly, slow as they arrive).
 */
export const RemotionTextAnimate: React.FC<RemotionTextAnimateProps> = ({
  children,
  as = 'p',
  className,
  segmentClassName,
  by = 'word',
  animation = 'clipDropIn',
  entranceStartFrame,
  entranceDurationInFrames,
  showDurationInFrames,
  exitDurationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const staggerFrames = staggerTimings[by] * fps;

  // Split text
  let segments: string[] = [];
  switch (by) {
    case 'word':
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

  const { hidden, show, exit } = ANIMATION_VARIANTS[animation];

  // Helper: Interpolate between from/to style objects
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
      const fromBlurMatch = /blur\(([\d.]+)px\)/.exec(from.filter as string);
      const toBlurMatch = /blur\(([\d.]+)px\)/.exec(to.filter as string);

      if (fromBlurMatch && toBlurMatch) {
        const fromBlur = parseFloat(fromBlurMatch[1]);
        const toBlur = parseFloat(toBlurMatch[1]);
        const current = interpolate(progress, [0, 1], [fromBlur, toBlur]);
        style.filter = `blur(${current}px)`;
      } else {
        style.filter = progress < 1 ? from.filter : to.filter;
      }
    } else if (to.filter) {
      style.filter = progress === 1 ? to.filter : undefined;
    }

    // transform
    const parseTransform = (transformStr?: string) => {
      const result: Record<string, number> = {
        translateX: 0,
        translateY: 0,
        scale: 1,
      };
      if (!transformStr) return result;

      const translateXMatch = /translateX\(([-\d.]+)px\)/.exec(transformStr);
      const translateYMatch = /translateY\(([-\d.]+)(px|%)\)/.exec(
        transformStr
      );
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

    const transformPieces: string[] = [];
    if (currentTranslateX !== 0) {
      transformPieces.push(`translateX(${currentTranslateX}px)`);
    }
    if (currentTranslateY !== 0) {
      // Keep px or % if originally used
      const suffix =
        (from.transform?.includes('%') || to.transform?.includes('%'))
          ? '%'
          : 'px';
      transformPieces.push(`translateY(${currentTranslateY}${suffix})`);
    }
    if (currentScale !== 1) {
      transformPieces.push(`scale(${currentScale})`);
    }

    style.transform = transformPieces.length
      ? transformPieces.join(' ')
      : undefined;

    return style;
  };

  // Determine style for each segment based on timeline
  const getSegmentStyle = (i: number): CSSProperties => {
    const segmentEntranceStart = entranceStartFrame + i * staggerFrames;
    const segmentEntranceEnd = segmentEntranceStart + entranceDurationInFrames;
    const segmentExitStart = segmentEntranceEnd + showDurationInFrames;
    const segmentExitEnd = segmentExitStart + exitDurationInFrames;

    if (frame < segmentEntranceStart) {
      // not yet started => hidden
      return hidden;
    }

    // during entrance
    if (frame < segmentEntranceEnd) {
      // Calculate a progress in [0..1]
      const rawProgress = (frame - segmentEntranceStart) / entranceDurationInFrames;
      // Ease out: the letter starts quickly and slows near the end
      const easedProgress = Easing.out(Easing.quad)(rawProgress);
      return interpolateStyle(hidden, show, easedProgress);
    }

    // fully shown
    if (frame < segmentExitStart) {
      return show;
    }

    // exit
    if (frame < segmentExitEnd) {
      const rawExitProgress = (frame - segmentExitStart) / exitDurationInFrames;
      // You could also ease here if you want a fade-out that isn't purely linear
      return interpolateStyle(show, exit, rawExitProgress);
    }

    // after exit => exit style
    return exit;
  };

  const Container = as;

  return (
    <Container className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {segments.map((segment, i) => {
        const style = getSegmentStyle(i);

        // Overflow hidden ensures the letter doesn't appear above the "slot"
        const wrapperStyle: React.CSSProperties = {
          display: by === 'line' ? 'block' : 'inline-block',
          overflow: 'hidden',
          verticalAlign: 'bottom',
          whiteSpace: 'pre',
        };

        return (
          <span key={`${by}-${i}-${segment}`} style={wrapperStyle}>
            <span
              className={segmentClassName}
              style={{
                display: 'inline-block',
                ...style,
              }}
            >
              {segment}
            </span>
          </span>
        );
      })}
    </Container>
  );
};
