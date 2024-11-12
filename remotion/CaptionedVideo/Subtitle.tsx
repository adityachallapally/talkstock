type SubtitleProps = {
  text: string;
  startTime: number;
  duration: number;
};

import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Word } from "./Word";

const Subtitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
    durationInFrames: 5,
  });

  // Style to position the subtitle 2/3 down the screen
  const subtitleStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    height: '66.67%', // This positions it 2/3 down the screen
    width: '100%',
    alignItems: 'center',
    paddingBottom: '20px', // Add some padding at the bottom
  };

  // Overlay stroked text with normal text to create an effect where the stroke is outside
  return (
    <AbsoluteFill style={subtitleStyle}>
      <AbsoluteFill style={subtitleStyle}>
        <Word stroke enterProgress={enter} text={text} />
      </AbsoluteFill>
      <AbsoluteFill style={subtitleStyle}>
        <Word enterProgress={enter} text={text} stroke={false} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Subtitle;
