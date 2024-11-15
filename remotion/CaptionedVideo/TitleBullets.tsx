import { AbsoluteFill, OffthreadVideo } from 'remotion';
import { TitleAnimation, TypewriterText, BoxReveal } from './index';
import { OverlayConfig } from '@/types/constants';
import { overlayStyles } from './styles';

export const TitleBullets: React.FC<OverlayConfig> = ({
  title,
  items,
  videoSrc,
}) => {
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
          <div style={overlayStyles.text}>
            {items.map((item, index) => (
              <div key={index} style={{ marginBottom: '24px' }}>
                <TypewriterText text={item.text} delay={item.delay} />
              </div>
            ))}
          </div>
        </BoxReveal>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};