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
        <OffthreadVideo 
          src={videoSrc} 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }} 
          muted 
        />
      )}
      {children && (
        <AbsoluteFill style={overlayStyles.content}>
          {children}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}; 