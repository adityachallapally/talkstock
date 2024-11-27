import { AbsoluteFill, OffthreadVideo, useCurrentFrame, interpolate } from 'remotion';
import { TitleAnimation, BoxReveal } from './index';
import { OverlayConfig } from '@/types/constants';
import { overlayStyles } from './styles';
import { BaseVideoOverlay } from './BaseVideoOverlay';

const FadeText: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const FADE_DURATION = 15; // Adjust these values to control fade speed
  const HOLD_DURATION = 45; // How long the text stays fully visible
  
  const relativeFrame = frame - delay;
  const opacity = interpolate(
    relativeFrame,
    [0, FADE_DURATION, HOLD_DURATION, HOLD_DURATION + FADE_DURATION], // keyframes
    [0, 1, 1, 0], // opacity values
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return <div style={{ opacity }}>{text}</div>;
};

export const TitleSwap: React.FC<OverlayConfig> = ({
  title,
  items,
  videoSrc,
}) => {
  const frame = useCurrentFrame();

  const currentItemIndex = items.findIndex((item, index) => {
    const nextDelay = items[index + 1]?.delay ?? Infinity;
    return frame >= item.delay && frame < nextDelay;
  });
  
  return (
    <BaseVideoOverlay videoSrc={videoSrc}>
      <BoxReveal>
        <TitleAnimation title={title} />
        <div style={{ ...overlayStyles.text, minHeight: '100px' }}>
          {currentItemIndex >= 0 && (
            <FadeText 
              text={items[currentItemIndex].text} 
              delay={items[currentItemIndex].delay}
            />
          )}
        </div>
      </BoxReveal>
    </BaseVideoOverlay>
  );
}; 