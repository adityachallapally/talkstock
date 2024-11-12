import React, { useState, useEffect } from 'react';
import { Player } from "@remotion/player";
import { CaptionedVideo } from '@/remotion/CaptionedVideo';
import { createremotionVideo } from '@/lib/videoActions';
import { getAudioDurationInSeconds } from '@remotion/media-utils';

type SubtitleTiming = {
  text: string;
  startTime: number;
  imageUrl: string;
};

type VideoData = {
  audioSrc: string;
  imageUrls: string[],
  transcriptionSrc: any;
};

const VideoCreator: React.FC = () => {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);

    try {
      console.log("Requested video");
      const result = await createremotionVideo(formData);
      console.log("Video creation result:", result);
      setVideoData({
        imageUrls: result.imageUrls,
        audioSrc: result.audioSrc,
        transcriptionSrc: result.transcriptionSrc,
      });
    } catch (error) {
      console.error('Error creating video:', error);
    }
  };

  useEffect(() => {
    const calculateDuration = async () => {
      if (videoData && videoData.audioSrc) {
        try {
          const durationInSeconds = await getAudioDurationInSeconds(videoData.audioSrc);
          console.log("Audio duration in seconds:", durationInSeconds);
          const fps = 30;
          const calculatedDuration = Math.ceil(durationInSeconds * fps);
          console.log("Calculated duration in frames:", calculatedDuration);
          
          if (calculatedDuration > 0 && calculatedDuration < 100000) {
            setVideoDuration(calculatedDuration);
          } else {
            console.error('Invalid calculated duration:', calculatedDuration);
            setVideoDuration(null);
          }
        } catch (error) {
          console.error('Error calculating audio duration:', error);
          setVideoDuration(null);
        }
      }
    };

    calculateDuration();
  }, [videoData]);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <button type="submit">Create Video</button>
      </form>

      {videoData && videoDuration && videoDuration > 0 && (
        <div>
          <h2>Video Preview</h2>
          {(() => {
            console.log("Rendering Player with:", { videoData, videoDuration });
            return null;
          })()}
          {/* <Player
            component={CaptionedVideo}
            inputProps={{
              audioSrc: videoData.audioSrc,
              images: videoData.imageUrls,
              subtitlesSrc: videoData.transcriptionSrc,
            }}
            durationInFrames={videoDuration}
            fps={30}
            compositionHeight={1920}
            compositionWidth={1080}
            style={{
              width: '100%',
              maxWidth: '640px',
            }}
            controls
          /> */}
        </div>
      )}
    </div>
  );
};

export default VideoCreator;