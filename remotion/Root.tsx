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

export const RemotionRoot: React.FC = () => {
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
          src: "placeholder-src",
          overlays: [],
          transcriptionUrl: "",
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
