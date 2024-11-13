"use client";

import React, { useEffect, useState } from 'react';
import VideoCreator from '@/components/VideoCreator';
import { Player } from "@remotion/player";
import { Composition, staticFile } from 'remotion';
import {
	CaptionedVideo,
	calculateCaptionedVideoMetadata,
	captionedVideoSchema,
} from '@/remotion/CaptionedVideo';

import { OverlayConfig } from '@/types/constants';

interface VideoCreatorPageProps {
  overlays: OverlayConfig[];
}

import generateOverlays from '@/lib/getoverlays';

const VideoCreatorPage: React.FC<VideoCreatorPageProps> = () => {
  const [overlays, setOverlays] = useState<OverlayConfig[]>([]);

  useEffect(() => {
    const fetchOverlays = async () => {
      const overlayer = await generateOverlays();
      setOverlays(overlayer);
    };

    fetchOverlays();
  }, []);

  return (
    <div>
      <div>
        <Player
          component={CaptionedVideo}
          durationInFrames={1620}
          fps={30}
          compositionWidth={1080}
          compositionHeight={1920}
          controls
          autoPlay
          loop
          inputProps={{
            src: staticFile('stanford_video.mp4'),
            overlays: overlays // Use the state variable
          }}
        />
      </div>
    </div>
  );
};

export default VideoCreatorPage;

