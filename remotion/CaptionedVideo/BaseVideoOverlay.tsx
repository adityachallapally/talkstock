import { AbsoluteFill, OffthreadVideo } from 'remotion';
import { overlayStyles } from './styles';

interface BaseVideoOverlayProps {
  videoSrc?: string;
  children?: React.ReactNode;
}

export const BaseVideoOverlay: React.FC<BaseVideoOverlayProps> = ({
  videoSrc,
  children,
}) => {
  return (
    <AbsoluteFill>
      {videoSrc && (
        <OffthreadVideo src={videoSrc} style={overlayStyles.video} muted />
      )}
      <AbsoluteFill style={overlayStyles.darkOverlay} />
      <AbsoluteFill style={overlayStyles.scanlines} />
      {children && (
        <AbsoluteFill style={overlayStyles.content}>
          {children}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}; 