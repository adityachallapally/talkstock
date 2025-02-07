//make 4-5 more of them
//do the LLM logic to pick which animation to use
//make them look perfect

import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Sequence,
  OffthreadVideo,
  useVideoConfig,
  useCurrentFrame,
} from 'remotion';
import {z} from 'zod';
import {getVideoMetadata} from '@remotion/media-utils';
import {useEffect, useState} from 'react';
import {textAnimations} from './TextAnimations';

// Schema for the video props
export const stockVideoSchema = z.object({
  videos: z.array(z.string()),
});

export const calculateStockVideoMetadata: CalculateMetadataFunction<
  z.infer<typeof stockVideoSchema>
> = async ({props}) => {
  const fps = 30;
  let totalDuration = 0;

  // Calculate total duration by getting metadata for each video
  for (const videoUrl of props.videos) {
    const metadata = await getVideoMetadata(videoUrl);
    totalDuration += Math.floor(metadata.durationInSeconds * fps);
  }

  return {
    fps,
    durationInFrames: totalDuration,
  };
};

export const HorizontalStockVideo: React.FC<{
  videos: string[];
}> = ({videos}) => {
  const {fps} = useVideoConfig();
  const [videoDurations, setVideoDurations] = useState<number[]>([]);

  useEffect(() => {
    const loadDurations = async () => {
      const durations = await Promise.all(
        videos.map(async (video) => {
          const metadata = await getVideoMetadata(video);
          return Math.floor(metadata.durationInSeconds * fps);
        })
      );
      setVideoDurations(durations);
    };

    loadDurations();
  }, [videos, fps]);

  if (videoDurations.length === 0) {
    return null;
  }

  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      {videos.map((videoUrl, index) => {
        const sequenceStart = videoDurations
          .slice(0, index)
          .reduce((sum, duration) => sum + duration, 0);
        
        return (
          <Sequence
            key={`video-${index}`}
            from={sequenceStart}
            durationInFrames={videoDurations[index]}
          >
            <AbsoluteFill>
              <OffthreadVideo
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                src={videoUrl}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      
      {textAnimations.map((animation, index) => (
        <Sequence
          key={`text-animation-${index}`}
          from={animation.startFrame}
          durationInFrames={animation.duration}
        >
          {animation.component}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

