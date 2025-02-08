import { Composition } from 'remotion';
import { RemotionTextAnimate } from '../HorizontalStockVideo/Tryingtomatchframeranimations';
import { DropInText } from '../HorizontalStockVideo/Dropin';

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
    <div style={{ flex: 1, backgroundColor: 'white', padding: 80 }}>
      {animations.map((animation, index) => {
        const startFrame = 30 + index * 120; // Space them out by 120 frames
        return (
          <div key={animation} style={{ marginBottom: 40 }}>
            <RemotionTextAnimate
              animation={animation}
              by="character"
              entranceStartFrame={startFrame}
              entranceDurationInFrames={15}
              showDurationInFrames={60}
              exitDurationInFrames={15}
              className="text-4xl font-bold"
              segmentClassName="mx-1"
            >
              {`This is the ${animation} animation`}
            </RemotionTextAnimate>
          </div>
        );
      })}
    </div>
  );
};

// Root composition component
export const TestAnimationVideo: React.FC = () => {
  return (
    <Composition
      id="TestAnimation"
      component={TestAnimationComposition}
      durationInFrames={1600} // Increased duration to fit all animations
      fps={30}
      width={1920}
      height={1080}
    />
  );
};