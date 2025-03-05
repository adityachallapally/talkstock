import { AbsoluteFill, OffthreadVideo } from 'remotion';
import { BoxReveal, TypewriterText, TitleAnimation } from './index';
import { OverlayConfig } from '../types';

export const BaseTemplate: React.FC<OverlayConfig> = ({
  title,
  items,
  videoSrc
}) => {
  return (
    <AbsoluteFill>
      {videoSrc && (
        <OffthreadVideo
          src={videoSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(4px) brightness(0.8)',
          }}
        />
      )}
      
      <AbsoluteFill
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          position: 'absolute',
        }}
      />

      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.1) 5px,
            rgba(255, 255, 255, 0.03) 5.5px,
            rgba(255, 255, 255, 0.01) 6px,
            transparent 6px,
            transparent 30px
          )`,
          position: 'absolute',
        }}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
        }}
      >
        <BoxReveal>
          <TitleAnimation title={title} />
          <div style={{
            color: 'white',
            fontSize: '67px',
            fontFamily: 'Montserrat',
            fontWeight: 500,
            lineHeight: '1.4',
            textAlign: 'left',
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
          }}>
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