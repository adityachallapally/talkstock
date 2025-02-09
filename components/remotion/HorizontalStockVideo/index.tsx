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
import { RemotionTextAnimate } from './Tryingtomatchframeranimations';
import {ScaleLetterText, StaggeredText} from './MyTextAnimations';

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
  const frame = useCurrentFrame();
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

  const testText = "Testing This Animation";

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
      
      {/* <Sequence from={0} durationInFrames={120}>
        <StaggeredText
          text={testText}
          frame={0}
          duration={120}
          isLarge={true}
        />
      </Sequence> */}

      <Sequence from={60} durationInFrames={58}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <RemotionTextAnimate
            animation="blurInUp"
            by="word"
            entranceStartFrame={60}
            entranceDurationInFrames={9}
            showDurationInFrames={40}
            exitDurationInFrames={9}
            className="text-4xl font-bold"
            segmentClassName="mx-1"
          >
            This text will animate exactly like Framer Motion!
          </RemotionTextAnimate>
        </AbsoluteFill>
      </Sequence>
      
    </AbsoluteFill>
  );
};

