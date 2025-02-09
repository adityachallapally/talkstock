import { AbsoluteFill, OffthreadVideo } from 'remotion';
import { OverlayConfig } from '@/types/constants';
import { overlayStyles } from './styles';
import { BaseVideoOverlay } from './BaseVideoOverlay';

export const StockVideo: React.FC<OverlayConfig> = ({
  videoSrc,
}) => {
  return <BaseVideoOverlay videoSrc={videoSrc} />;
};