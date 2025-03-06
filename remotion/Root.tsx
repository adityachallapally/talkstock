import { Composition } from "remotion";
import {
  COMP_NAME,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./config";
import { CaptionedVideo, calculateCaptionedVideoMetadata } from "./CaptionedVideo/index";
import { parseMedia } from "@remotion/media-parser";

export enum TemplateType {
  BULLET_LIST = 'BULLET_LIST',
  WORD_SWAP = 'WORD_SWAP',
  NUMBER_HIGHLIGHT = 'NUMBER_HIGHLIGHT',
  STOCK_VIDEO = 'STOCK_VIDEO'
}


export const RemotionRoot: React.FC = () => {

  const mockOverlays = [
    {
      startFrame: Math.round((8540 / 1000) * 30),
      duration: Math.round((2000 / 1000) * 30),
      type: TemplateType.STOCK_VIDEO,
      videoSrc: 'https://videos.pexels.com/video-files/5532765/5532765-sd_506_960_25fps.mp4',
      title: '',
      provider: 'Pexels'
    },
    {
      startFrame: Math.round((11800 / 1000) * 30),
      duration: Math.round((2000 / 1000) * 30),
      type: TemplateType.STOCK_VIDEO,
      videoSrc: 'https://videos.pexels.com/video-files/5532765/5532765-sd_506_960_25fps.mp4',
      title: '',
      provider: 'Pexels'
    },
    {
      startFrame: Math.round((14560 / 1000) * 30),
      duration: Math.round((2000 / 1000) * 30),
      type: TemplateType.STOCK_VIDEO,
      videoSrc: 'https://videos.pexels.com/video-files/5532765/5532765-sd_506_960_25fps.mp4',
      title: '',
      provider: 'Pexels'
    }
  ];

  return (
    <>
      <Composition
        id="captioned-video"
        component={CaptionedVideo}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{
          src: 'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/IMG_6062-ustELCsT8kuxTiuEmUhR0NTEefvx6P.MP4',
          overlays: mockOverlays,
          transcriptionUrl: 'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/transcript-YxnHCXJcmH4JJqN5LH4M7r79CprrIa.json',
          showCaptions: true
        }}
        calculateMetadata={async ({ props }) => {
          const { src } = props;
          
          if (!src) {
            console.log("No src provided");
            return {
              fps: VIDEO_FPS,
              durationInFrames: DURATION_IN_FRAMES,
              width: VIDEO_WIDTH,
              height: VIDEO_HEIGHT
            };
          }
          
          try {
            console.log("Parsing media for:", src);
            const { fps, slowDurationInSeconds } = await parseMedia({
              src: src,
              fields: {
                fps: true,
                slowDurationInSeconds: true,
              },
              acknowledgeRemotionLicense: true
            });
            
            console.log("Media metadata:", { fps, slowDurationInSeconds });
             
            // Calculate duration in frames based on the video duration
            const actualFps = fps || VIDEO_FPS;
            const durationInFrames = Math.floor(slowDurationInSeconds * actualFps);
            
            return {
              durationInFrames,
              width: VIDEO_WIDTH,
              height: VIDEO_HEIGHT,
              fps: actualFps,
            };
          } catch (error) {
            console.error("Error parsing media:", error);
            return {
              fps: VIDEO_FPS,
              durationInFrames: DURATION_IN_FRAMES,
              width: VIDEO_WIDTH,
              height: VIDEO_HEIGHT
            };
          }
        }}
      />
      
    </>
  );
};
