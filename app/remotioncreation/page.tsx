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
import { mockOverlays } from '@/lib/getoverlays';
import { OverlayConfig } from '@/types/constants';

interface VideoCreatorPageProps {
  overlays: OverlayConfig[];
}

import generateOverlays from '@/lib/getoverlays';

const VideoCreatorPage: React.FC<VideoCreatorPageProps> = () => {
  const [overlays, setOverlays] = useState<OverlayConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverlays = async () => {
      setIsLoading(true);
      const overlayer = await mockOverlays(); //generateOverlays('https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/stanford_video-lGCdCm0OcnuLhBPHM9f50eS4zyqiV0.json');
      setOverlays(overlayer);
      setIsLoading(false);
    };

    fetchOverlays();
  }, []);

  if (isLoading) {
    return <div>Loading overlays...</div>;
  }

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
            overlays: overlays
          }}
        />
      </div>
    </div>
  );
};

export default VideoCreatorPage;

