"use client";

import React, { useState, useEffect } from 'react';
import { Player } from "@remotion/player";
import {
  HorizontalStockVideo,
  calculateStockVideoMetadata,
  stockVideoSchema,
} from '@/components/remotion/HorizontalStockVideo';

const HorizontalStockVideoPage: React.FC = () => {
  const [duration, setDuration] = useState<number>(0);
  const videoUrls = [
    'https://static.videezy.com/system/resources/previews/000/000/168/original/Record.mp4',
    'https://static.videezy.com/system/resources/previews/000/000/168/original/Record.mp4',
    'https://static.videezy.com/system/resources/previews/000/000/168/original/Record.mp4',
  ];

  useEffect(() => {
    const calculateDuration = async () => {
      const metadata = await calculateStockVideoMetadata({
        props: { videos: videoUrls },
        defaultProps: {},
        frame: 0,
      });
      setDuration(metadata.durationInFrames);
    };
    calculateDuration();
  }, [videoUrls]);

  if (!duration) return null;

  return (
    <div>
      <div>
        <Player
          component={HorizontalStockVideo}
          durationInFrames={duration}
          fps={30}
          compositionWidth={1920}
          compositionHeight={1080}
          controls
          autoPlay
          loop
          inputProps={{
            videos: videoUrls
          }}
        />
      </div>
    </div>
  );
};

export default HorizontalStockVideoPage;
