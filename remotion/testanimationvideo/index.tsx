import { RemotionTextAnimate } from '../HorizontalStockVideo/Tryingtomatchframeranimations';
import { BigTextReveal } from '../HorizontalStockVideo/BigTextReveal';
import { CurtainTextReveal } from '../HorizontalStockVideo/CurtainTextReveal';

export const TestAnimationComposition: React.FC = () => {
  const commonExitStartFrame = 90;  // Define a common exit start frame
  const commonExitDuration = 15;    // Define a common exit duration

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '0',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        justifyContent: 'center',
      }}>
        <CurtainTextReveal
          text="EARN A"
          startFrame={0}
          dropDuration={30}
          scaleDuration={45}
          initialScale={3}
          className="text-9xl font-bold"
          exitStartFrame={commonExitStartFrame+30}
          exitDuration={commonExitDuration}
          exitAnimation="fadeDown"
        />

        <RemotionTextAnimate
          entranceAnimation="clipDropIn"
          exitAnimation="fadeDown"
          entranceStartFrame={45}
          entranceDurationInFrames={30}
          showDurationInFrames={commonExitStartFrame - 45}
          exitDurationInFrames={commonExitDuration}
          by="character"
          className="text-9xl font-bold"
          style={{
            position: 'relative',
            zIndex: 1,
          }}
        >
          GRADUATE
        </RemotionTextAnimate>

        <RemotionTextAnimate
          entranceAnimation="clipDropIn"
          exitAnimation="fadeDown"
          entranceStartFrame={75}
          entranceDurationInFrames={30}
          showDurationInFrames={commonExitStartFrame - 75}
          exitDurationInFrames={commonExitDuration}
          by="character"
          className="text-9xl font-bold"
          style={{
            position: 'relative',
            zIndex: 1,
          }}
        >
          CERTIFICATE
        </RemotionTextAnimate>
      </div>
    </div>
  );
};
