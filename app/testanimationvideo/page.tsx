'use client';

import {Player} from '@remotion/player';
import {TestAnimationComposition} from '@/components/remotion/testanimationvideo';

export default function Page() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Player
        component={TestAnimationComposition}
        durationInFrames={1600}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={{
          width: '100%',
          maxWidth: '1000px',
        }}
        controls // Add controls to help with debugging
        autoPlay // Optional: automatically start playing
      />
    </div>
  );
}