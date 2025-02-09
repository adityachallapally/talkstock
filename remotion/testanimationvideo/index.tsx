import { RemotionTextAnimate } from '../HorizontalStockVideo/Tryingtomatchframeranimations';
import { BigTextReveal } from '../HorizontalStockVideo/BigTextReveal';
import { CurtainTextReveal } from '../HorizontalStockVideo/CurtainTextReveal';

export const TestAnimationComposition: React.FC = () => {
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
        height: '50vh',
      }}>
        <CurtainTextReveal
          text="EARN A"
          startFrame={0}
          dropDuration={30}
          scaleDuration={45}
          initialScale={5}
          className="text-2xlfont-bold"
        />

        <RemotionTextAnimate
          animation="clipDropIn"
          entranceStartFrame={45}
          entranceDurationInFrames={30}
          showDurationInFrames={60}
          exitDurationInFrames={15}
          by="character"
          className="text-2xl font-bold"
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: '-0.5rem',
          }}
        >
          GRADUATE
        </RemotionTextAnimate>

        <RemotionTextAnimate
          animation="clipDropIn"
          entranceStartFrame={75}
          entranceDurationInFrames={30}
          showDurationInFrames={60}
          exitDurationInFrames={15}
          by="character"
          className="text-2xl font-bold"
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: '-0.5rem',
          }}
        >
          CERTIFICATE
        </RemotionTextAnimate>
      </div>
    </div>
  );
};
