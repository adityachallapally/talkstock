import { AbsoluteFill, OffthreadVideo, useCurrentFrame } from 'remotion';
import { TitleAnimation, BoxReveal, TypewriterText } from './index';
import { OverlayConfig } from '@/types/constants';
import { overlayStyles } from './styles';
import { BaseVideoOverlay } from './BaseVideoOverlay';

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
            <TypewriterText 
              text={items[currentItemIndex].text} 
              delay={items[currentItemIndex].delay}
            />
          )}
        </div>
      </BoxReveal>
    </BaseVideoOverlay>
  );
}; 