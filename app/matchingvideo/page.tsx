// app/page.tsx
'use client';

import { Player } from '@remotion/player';
import { MatchingVideo } from '@/remotion/matchingvideo';

export default function Page() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Player
        component={MatchingVideo}
        durationInFrames={2000}  //long enough time
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={{
          width: '100%',
          maxWidth: '1000px',
        }}
        controls
        autoPlay
      />
    </div>
  );
}

