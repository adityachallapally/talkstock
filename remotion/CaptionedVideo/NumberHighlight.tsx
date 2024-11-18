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
        <div style={{ ...overlayStyles.title, color: '#ff4444' }}>
          {title}
        </div>
        <div style={overlayStyles.text}>
          {items.map((item, index) => (
            <div key={index} style={{ marginBottom: '24px' }}>
              <TypewriterText 
                text={`${index + 1}. ${item.text}`} 
                delay={item.delay} 
              />
            </div>
          ))}
        </div>
      </div>
    </BaseVideoOverlay>
  );
}; 