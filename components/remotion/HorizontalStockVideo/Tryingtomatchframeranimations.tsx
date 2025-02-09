// HorizontalStockVideo/Tryingtomatchframeranimations.tsx
import React, { CSSProperties, ReactNode } from 'react';
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
  bigClipDropIn: {
    hidden: {
      opacity: 1,
      transform: 'translateY(-150%) scale(3)',
    },
    show: {
      opacity: 1,
      transform: 'translateY(0%) scale(3)',
    },
    exit: {
      opacity: 1,
      transform: 'translateY(0%) scale(1)',
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
  xOffset?: number; // Added for multi-instance positioning
  yOffset?: number; // Added for multi-instance positioning
  style?: CSSProperties; //for the text styling,
}

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
  xOffset = 0, // Default offset to 0
  yOffset = 0, // Default offset to 0
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const staggerFrames = staggerTimings[by] * fps;

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

  const interpolateStyle = (
    from: CSSProperties,
    to: CSSProperties,
    progress: number
  ): CSSProperties => {
    const style: CSSProperties = {};

    if (typeof from.opacity === 'number' && typeof to.opacity === 'number') {
      style.opacity = interpolate(progress, [0, 1], [from.opacity, to.opacity]);
    }

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
      [fromT.translateX + xOffset, toT.translateX + xOffset] // Add xOffset
    );
    const currentTranslateY = interpolate(
      progress,
      [0, 1],
      [fromT.translateY + yOffset, toT.translateY + yOffset] // Add yOffset
    );
    const currentScale = interpolate(progress, [0, 1], [fromT.scale, toT.scale]);

    const transformPieces: string[] = [];
    if (currentTranslateX !== 0) {
      transformPieces.push(`translateX(${currentTranslateX}px)`);
    }
    if (currentTranslateY !== 0) {
      const suffix =
        from.transform?.includes('%') || to.transform?.includes('%')
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

  const getSegmentStyle = (i: number): CSSProperties => {
    const segmentEntranceStart = entranceStartFrame + i * staggerFrames;
    const segmentEntranceEnd = segmentEntranceStart + entranceDurationInFrames;
    const segmentExitStart = segmentEntranceEnd + showDurationInFrames;
    const segmentExitEnd = segmentExitStart + exitDurationInFrames;

    if (frame < segmentEntranceStart) {
      return hidden;
    }

    if (frame < segmentEntranceEnd) {
      const rawProgress = (frame - segmentEntranceStart) / entranceDurationInFrames;
      const easedProgress = Easing.out(Easing.quad)(rawProgress);
      return interpolateStyle(hidden, show, easedProgress);
    }

    if (frame < segmentExitStart) {
      return show;
    }

    if (frame < segmentExitEnd) {
      const rawExitProgress = (frame - segmentExitStart) / exitDurationInFrames;
      return interpolateStyle(show, exit, rawExitProgress);
    }

    return exit;
  };

  const Container = as;

  return (
    <Container className={className} style={{ whiteSpace: 'pre-wrap', ...style }}>
      {segments.map((segment, i) => {
        const style = getSegmentStyle(i);
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


interface ScaleDownProps {
    children: ReactNode;
    startFrame: number;
    duration: number;
}

// Component for scaling down after bigClipDropIn
export const ScaleDown: React.FC<ScaleDownProps> = ({ children, startFrame, duration }) => {
    const frame = useCurrentFrame();

    const scale = interpolate(
        frame,
        [startFrame, startFrame + duration],
        [2, 1],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );

    return (
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
            {children}
        </div>
    );
};


interface GlitchTextProps {
  words: string[];
  startFrame: number;
  duration: number;
}

//very basic glitch component.
export const GlitchText: React.FC<GlitchTextProps> = ({ words, startFrame, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < startFrame || frame >= startFrame + duration) {
    return null; // Don't render anything outside the specified range
  }

  const glitchIndex = Math.floor(interpolate(frame, [startFrame, startFrame+duration], [0, words.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  }))

  return (
    <RemotionTextAnimate
        children={words[glitchIndex]}
        animation="clipDropIn"
        entranceStartFrame={startFrame}
        entranceDurationInFrames={duration}
        showDurationInFrames={0}
        exitDurationInFrames={0}
        by="word"
    />
  );
};


interface HighlightBoxProps {
  children: ReactNode;
  startFrame: number;
  endFrame: number;
  color: string;
}

//simple highlight component.
export const HighlightBox: React.FC<HighlightBoxProps> = ({ children, startFrame, endFrame, color }) => {
  const frame = useCurrentFrame();

  if (frame < startFrame || frame >= endFrame) {
    return <>{children}</>; // Render children directly if outside the highlight range
  }

    const opacity = interpolate(
        frame,
        [startFrame, endFrame],
        [0, 1],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: color,
          opacity: opacity, // Control opacity for fade-in/out if needed
          zIndex: 1, // Ensure the highlight is behind the text.  Adjust as needed.
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
};

//MultiInstanceText component to handle repetition.
interface MultiInstanceTextProps {
    instances: {
        text: string;
        startFrame: number;
        endFrame: number;
        xOffset: number;
        yOffset: number;
        id: number;
    }[];
}
export const MultiInstanceText: React.FC<MultiInstanceTextProps> = ({ instances }) => {
    const frame = useCurrentFrame();

    const filteredInstances = instances.filter(
        (instance) => frame >= instance.startFrame && frame < instance.endFrame
    );

    return (
        <>
            {filteredInstances.map((instance) => (
                <RemotionTextAnimate
                    key={instance.id}
                    children={instance.text}
                    animation="clipDropIn"
                    entranceStartFrame={instance.startFrame}
                    entranceDurationInFrames={15}
                    showDurationInFrames={instance.endFrame - instance.startFrame}
                    exitDurationInFrames={0}
                    xOffset={instance.xOffset}
                    yOffset={instance.yOffset}
                    by="word"
                />
            ))}
        </>
    );
};