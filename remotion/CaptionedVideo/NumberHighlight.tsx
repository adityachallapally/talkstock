import { AbsoluteFill, OffthreadVideo } from 'remotion';
import { TypewriterText } from './index';
import { OverlayConfig } from '@/types/constants';
import { overlayStyles } from './styles';
import { BaseVideoOverlay } from './BaseVideoOverlay';

export const NumberHighlight: React.FC<OverlayConfig> = ({
  title,
  items,
  videoSrc,
}) => {
  return (
    <BaseVideoOverlay videoSrc={videoSrc}>
      <div style={overlayStyles.container}>


        <span style={{
          color: '#00875A',
          fontWeight: 'bold',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '288px',
          lineHeight: '1',
          textAlign: 'center',
          width: '100%',
          display: 'block',
        }}>
          {title}
        </span>

        <div style={{
          fontSize: '72px',
          color: 'white',
          fontWeight: 'bold',
          lineHeight: '1.2',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
          maxWidth: '900px',
        }}>
          <TypewriterText
            text={items[0].text}
            delay={items[0].delay}
          />
        </div>
      </div>
    </BaseVideoOverlay>
  );
}; 