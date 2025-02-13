import { interpolate } from 'remotion';

export interface ExitAnimationProps {
  frame: number;
  startFrame: number;
  duration: number;
  children: React.ReactNode;
}

export const FadeDown: React.FC<ExitAnimationProps> = ({
  frame,
  startFrame,
  duration,
  children,
}) => {
  const progress = interpolate(
    frame - startFrame,
    [0, duration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const opacity = interpolate(progress, [0, 1], [1, 0]);
  const translateY = interpolate(progress, [0, 1], [0, 20]);

  return (
    <div style={{
      opacity,
      transform: `translateY(${translateY}px)`,
      display: 'inline-block',
    }}>
      {children}
    </div>
  );
};