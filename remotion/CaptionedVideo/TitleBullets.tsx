import { AbsoluteFill, OffthreadVideo } from 'remotion';
import { TitleAnimation, TypewriterText, BoxReveal } from './index';
import { OverlayConfig } from '@/types/constants';
import { overlayStyles } from './styles';
import { BaseVideoOverlay } from './BaseVideoOverlay';

export const TitleBullets: React.FC<OverlayConfig> = ({
  title,
  items,
  videoSrc,
}) => {
  return (
    <BaseVideoOverlay videoSrc={videoSrc}>
      <BoxReveal>
        <TitleAnimation title={title} />
        <div style={overlayStyles.text}>
          {items.map((item, index) => (
            <div key={index} style={{ marginBottom: '24px' }}>
              <TypewriterText text={item.text} delay={item.delay} />
            </div>
          ))}
        </div>
      </BoxReveal>
    </BaseVideoOverlay>
  );
};