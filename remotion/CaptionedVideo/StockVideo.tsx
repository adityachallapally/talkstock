import { AbsoluteFill, OffthreadVideo } from 'remotion';
import { OverlayConfig } from '@/types/constants';
import { overlayStyles } from './styles';

export const StockVideo: React.FC<OverlayConfig> = ({
  videoSrc,
}) => {
  return (
    <AbsoluteFill>
      {videoSrc && (
        <OffthreadVideo
          src={videoSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      )}
    </AbsoluteFill>
  );
};