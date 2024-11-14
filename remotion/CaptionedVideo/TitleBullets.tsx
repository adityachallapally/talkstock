import { AbsoluteFill } from 'remotion';
import { BaseTemplate } from '@/remotion/CaptionedVideo/BaseTemplate';
import { OverlayConfig } from '@/types/constants';

export const TitleBullets: React.FC<OverlayConfig> = (props) => {
  return (
    <AbsoluteFill>
      <BaseTemplate {...props} />
    </AbsoluteFill>
  );
};