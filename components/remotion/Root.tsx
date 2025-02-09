import { Composition } from "remotion";
import {
  COMP_NAME,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../types/constants";
import { CaptionedVideo } from "./CaptionedVideo/index";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMP_NAME}
        component={CaptionedVideo}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{
          images: [],
          audioSrc: "",
          subtitlesSrc: "",
          durationInFrames: DURATION_IN_FRAMES
        }}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: props.durationInFrames || DURATION_IN_FRAMES,
          };
        }}
      />
    </>
  );
};
