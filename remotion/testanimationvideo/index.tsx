
import { RemotionTextAnimate } from '../HorizontalStockVideo/Tryingtomatchframeranimations';

export const TestAnimationComposition: React.FC = () => {
  const animations = [
    'clipDropIn',
    'fadeIn',
    'blurIn',
    'blurInUp',
    'blurInDown',
    'slideUp',
    'slideDown',
    'slideLeft',
    'slideRight',
    'scaleUp',
    'scaleDown',
    'dropIn',
  ] as const;

  // Calculate when all animations will end
  const lastAnimationEndFrame = 30 + (animations.length - 1) * 120 + 90; // Start + (animations * spacing) + duration

  return (

    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',            // Stack lines vertically
        flexDirection: 'column',
        alignItems: 'center',       // Center horizontally
        justifyContent: 'center',   // Center vertically
        gap: '20px',                // Spacing between lines
      }}
    >
      {/* EARN A */}
      <RemotionTextAnimate
        animation="bigClipDropIn"
        // Possibly a big entrance or different timing
        entranceStartFrame={0}
        entranceDurationInFrames={30}
        showDurationInFrames={30}
        exitDurationInFrames={15}
        className="text-6xl font-bold" // same as “GRADUATE”
      >
        EARN A
      </RemotionTextAnimate>

      <RemotionTextAnimate
        animation="clipDropIn"
        entranceStartFrame={15}
        entranceDurationInFrames={30}
        showDurationInFrames={60}
        exitDurationInFrames={15}
        className="text-6xl font-bold"
      >
        GRADUATE
      </RemotionTextAnimate>

    </div>
  );
};

    // <div style={{ flex: 1, backgroundColor: 'white', padding: 80 }}>
    //   {animations.map((animation, index) => {
    //     const startFrame = 30 + index * 120; // Space them out by 120 frames
    //     return (
    //       <div key={animation} style={{ marginBottom: 40 }}>
    //         <RemotionTextAnimate
    //           animation={animation}
    //           by="character"
    //           entranceStartFrame={startFrame}
    //           entranceDurationInFrames={8}
    //           showDurationInFrames={60}
    //           exitDurationInFrames={15}
    //           className="text-6xl font-bold tracking-wide uppercase"
    //           segmentClassName="mx-1"
    //         >
    //           {`This is the ${animation} animation`}
    //         </RemotionTextAnimate>
    //       </div>
    //     );
    //   })}
    // </div>