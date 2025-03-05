import { AbsoluteFill, OffthreadVideo, useCurrentFrame, interpolate } from 'remotion';
import { TypewriterText } from './index';
import { OverlayConfig } from '../types';
import { overlayStyles } from './styles';
import { BaseVideoOverlay } from './BaseVideoOverlay';

export const NumberHighlight: React.FC<OverlayConfig> = ({
  title,
  items,
  videoSrc,
}) => {
  const frame = useCurrentFrame();
  const animationDuration = 30; // Duration in frames (adjust as needed)
  
  const hasPercentage = title.toString().includes('%');
  const targetNumber = parseInt(title.toString().replace('%', '')) || 0;
  
  const currentNumber = interpolate(
    frame,
    [0, animationDuration],
    [0, targetNumber],
    {
      extrapolateRight: 'clamp',
      extrapolateLeft: 'clamp'
    }
  );

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
          {Math.round(currentNumber)}{hasPercentage ? '%' : ''}
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