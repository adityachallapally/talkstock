import { AbsoluteFill, OffthreadVideo, useCurrentFrame } from 'remotion';
import { TitleAnimation, BoxReveal, TypewriterText } from './index';
import { OverlayConfig } from '@/types/constants';
import { overlayStyles } from './styles';

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
    <AbsoluteFill>
      {videoSrc && (
        <OffthreadVideo src={videoSrc} style={overlayStyles.video} />
      )}
      <AbsoluteFill style={overlayStyles.darkOverlay} />
      <AbsoluteFill style={overlayStyles.scanlines} />
      <AbsoluteFill style={overlayStyles.content}>
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
      </AbsoluteFill>
    </AbsoluteFill>
  );
}; 