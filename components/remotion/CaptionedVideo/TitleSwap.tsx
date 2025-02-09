import { AbsoluteFill, OffthreadVideo, useCurrentFrame, interpolate } from 'remotion';
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

  const currentItem = items[currentItemIndex];
  const nextDelay = items[currentItemIndex + 1]?.delay ?? Infinity;
  const finalFrame = nextDelay === Infinity ? 999999 : nextDelay;

  const translateX = currentItem ? interpolate(
    frame,
    [currentItem.delay, currentItem.delay + 15, finalFrame - 15, finalFrame],
    [-100, 0, 0, 100],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  ) : 0;
  
  return (
    <BaseVideoOverlay videoSrc={videoSrc}>
      <div style={{
        fontSize: '144px',
        fontWeight: 'bold',
        color: 'white',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        marginBottom: '40px',
        fontStyle: 'italic',
        textAlign: 'center',
        width: '100%'
      }}>
        {title}
      </div>

      {currentItemIndex >= 0 && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backgroundClip: 'padding-box',
          padding: '20px 40px',
          borderRadius: '8px',
          width: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '160px',
          border: '10px solid rgba(0,0,0, 0.3)',
          maxWidth: '80%',
          margin: '0 auto',
          transform: `translateX(${translateX}%)`,
        }}>
          <div style={{ 
            fontSize: '120px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginTop: '20px',
            color: 'white',
          }}>
            {currentItem.text}
          </div>
        </div>
      )}
    </BaseVideoOverlay>
  );
}; 