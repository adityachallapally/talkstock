"use client";

import React from 'react';
import VideoCreator from '@/components/VideoCreator';
import { Player } from "@remotion/player";
import {Composition, staticFile} from 'remotion';
import {
	CaptionedVideo,
	calculateCaptionedVideoMetadata,
	captionedVideoSchema,
} from '@/remotion/CaptionedVideo';

const videoUrls = [
  'https://videos.pexels.com/video-files/4065630/4065630-hd_720_1366_50fps.mp4',
  'https://videos.pexels.com/video-files/4065630/4065630-hd_720_1366_50fps.mp4',
]

interface VideoCreatorPageProps {
  videoUrls: string[];
}

const VideoCreatorPage: React.FC<VideoCreatorPageProps> = ({ videoUrls }) => {
  const msToFrames = (ms: number) => Math.round((ms / 1000) * 30);

  return (
    <div>
        <div>
          <Player
            component={CaptionedVideo}
            durationInFrames={900}
            fps={30}
            compositionWidth={1080}
            compositionHeight={1920}
            controls
            autoPlay
            loop
            inputProps={{
              src: staticFile('stanford_video.mp4'),
              overlays: videoUrls.map((videoSrc, index) => ({
                startFrame: index * 300, // Example start frame logic
                duration: 150,           // Example duration
                title: `Overlay ${index + 1}`,
                videoSrc,
                items: [
                  { text: `• Example text ${index + 1}`, delay: msToFrames(5500) - index * 300 },
                  { text: `• Example text ${index + 1}`, delay: msToFrames(5500) - index * 300 },
                  { text: `• Example text ${index + 1}`, delay: msToFrames(5500) - index * 300 },
                ]
              }))
            }}
          />
        </div>
    </div>
  );
};

export default VideoCreatorPage;

