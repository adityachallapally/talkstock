import { AbsoluteFill, OffthreadVideo } from 'remotion';
import { TitleAnimation, TypewriterText, BoxReveal } from './index';
import { OverlayConfig } from '../types';
import { overlayStyles } from './styles';
import { BaseVideoOverlay } from './BaseVideoOverlay';

export const TitleBullets: React.FC<OverlayConfig> = ({
  title,
  items,
  videoSrc,
}) => {
  return (
    <BaseVideoOverlay videoSrc={videoSrc}>
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1.5, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '16px' }}>
          <div style={{ textAlign: 'center', width: '80%', maxWidth: '800px' }}>
            <TitleAnimation title={title} />
          </div>
        </div>
        <div style={{ flex: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <BoxReveal>
            <div style={overlayStyles.text}>
              {items.map((item, index) => (
                <div key={index} style={{ marginBottom: '24px' }}>
                  <TypewriterText text={item.text} delay={item.delay} />
                </div>
              ))}
            </div>
          </BoxReveal>
        </div>
      </AbsoluteFill>
    </BaseVideoOverlay>
  );
};