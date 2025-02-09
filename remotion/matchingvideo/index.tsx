// remotion/matchingvideo.tsx
import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { RemotionTextAnimate, ScaleDown, GlitchText, HighlightBox, MultiInstanceText } from '../HorizontalStockVideo/Tryingtomatchframeranimations'; // adjust path as needed

export const MatchingVideo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: 'white' }}>
        {/* "Set yourself apart." */}
        {frame >= 50 && frame < 200 && (
            <RemotionTextAnimate
                children="Set yourself apart."
                animation="clipDropIn"
                entranceStartFrame={50}
                entranceDurationInFrames={25}
                showDurationInFrames={125}
                exitDurationInFrames={0}
                style={{
                    fontSize: '80px',
                    textAlign: 'center',
                    color: 'black',
                }}
                by="word"
            />
        )}

        {/* "EARN A GRADUATE CERTIFICATE" */}
        {frame >= 240 && frame < 400 && (
            <RemotionTextAnimate
                children="EARN A GRADUATE CERTIFICATE"
                animation="clipDropIn"
                entranceStartFrame={240}
                entranceDurationInFrames={25}
                showDurationInFrames={135}
                exitDurationInFrames={0}
                style={{
                    fontSize: '60px',
                    textAlign: 'center',
                    color: 'white',
                }}
                by="word"
            />
        )}

       {/* "OR A MASTER'S DEGREE" */}
        {frame >= 400 && frame < 550 && (
            <RemotionTextAnimate
                children="OR A MASTER'S DEGREE"
                animation="clipDropIn"
                entranceStartFrame={400}
                entranceDurationInFrames={25}
                showDurationInFrames={125}
                exitDurationInFrames={0}
                style={{
                    fontSize: '60px',
                    textAlign: 'center',
                    color: 'white',
                }}
                by="word"
            />
        )}

        {/* "IN ELECTRICAL ENGINEERING" - Multi-instance example */}
        {frame >= 550 && frame < 650 && (
            <MultiInstanceText
                instances={[
                    { text: "IN ELECTRICAL ENGINEERING", startFrame: 550, endFrame: 650, xOffset: 0, yOffset: -60, id: 1 },
                    { text: "IN ELECTRICAL ENGINEERING", startFrame: 550, endFrame: 650, xOffset: 0, yOffset: 0, id: 2 },
                    { text: "IN ELECTRICAL ENGINEERING", startFrame: 550, endFrame: 650, xOffset: 0, yOffset: 60, id: 3 },
                ]}
                />
        )}

        {/* "FROM Stanford University" */}
        {frame >= 680 && frame < 830 && (
            <RemotionTextAnimate
                children="FROM Stanford University"
                animation="clipDropIn"
                entranceStartFrame={680}
                entranceDurationInFrames={25}
                showDurationInFrames={125}
                exitDurationInFrames={0}
                style={{
                    fontSize: '60px',
                    textAlign: 'center',
                    color: 'white',
                }}
                by="word"
            />
        )}

        {/* "ADVANCE YOUR CAREER" */}
        {frame >= 860 && frame < 1010 && (
            <RemotionTextAnimate
                children="ADVANCE YOUR CAREER"
                animation="clipDropIn"
                entranceStartFrame={860}
                entranceDurationInFrames={25}
                showDurationInFrames={125}
                exitDurationInFrames={0}
                style={{
                    fontSize: '70px',
                    textAlign: 'center',
                    color: 'white',
                }}
                by="word"
            />
        )}

        {/* "BUILD YOUR KNOWLEDGE" */}
        {frame >= 1040 && frame < 1190 && (
            <RemotionTextAnimate
                children="BUILD YOUR KNOWLEDGE"
                animation="clipDropIn"
                entranceStartFrame={1040}
                entranceDurationInFrames={25}
                showDurationInFrames={125}
                exitDurationInFrames={0}
                style={{
                    fontSize: '70px',
                    textAlign: 'center',
                    color: 'white',
                }}
                by="word"
            />
        )}

        {/* "LEARN THE IN-DEMAND SKILLS YOU NEED." */}
        {frame >= 1220 && frame < 1370 && (
            <RemotionTextAnimate
                children="LEARN THE IN-DEMAND SKILLS YOU NEED."
                animation="clipDropIn"
                entranceStartFrame={1220}
                entranceDurationInFrames={25}
                showDurationInFrames={125}
                exitDurationInFrames={0}
                style={{
                    fontSize: '60px',
                    textAlign: 'center',
                    color: 'white',
                }}
                by="word"
            />
        )}

        {/* "APPLY NOW" */}
        {frame >= 1400 && frame < 1550 && (
            <RemotionTextAnimate
                children="APPLY NOW"
                animation="clipDropIn"
                entranceStartFrame={1400}
                entranceDurationInFrames={25}
                showDurationInFrames={125}
                exitDurationInFrames={0}
                style={{
                    fontSize: '80px',
                    textAlign: 'center',
                    color: 'white',
                }}
                by="word"
            />
        )}

        {/* "GET STARTED." */}
        {frame >= 1580 && frame < 1730 && (
            <RemotionTextAnimate
                children="GET STARTED."
                animation="clipDropIn"
                entranceStartFrame={1580}
                entranceDurationInFrames={25}
                showDurationInFrames={125}
                exitDurationInFrames={0}
                style={{
                    fontSize: '80px',
                    textAlign: 'center',
                    color: 'white',
                }}
                by="word"
            />
        )}

        {/* "Stanford | ONLINE" */}
        {frame >= 1760 && frame < 1910 && (
            <RemotionTextAnimate
                children="Stanford | ONLINE"
                animation="clipDropIn"
                entranceStartFrame={1760}
                entranceDurationInFrames={25}
                showDurationInFrames={125}
                exitDurationInFrames={0}
                style={{
                    fontSize: '80px',
                    textAlign: 'center',
                    color: 'white',
                }}
                by="word"
            />
        )}
    </AbsoluteFill>
  );
};