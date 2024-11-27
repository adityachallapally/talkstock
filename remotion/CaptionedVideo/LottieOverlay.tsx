import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Lottie } from "@remotion/lottie";
import textAnimation from './textAnimation.json';
import animationData from "./animation.json";

interface LottieOverlayProps {
  text: string;
}

const LottieOverlay: React.FC<LottieOverlayProps> = ({ text }) => {
//   // Create animation data with the correct text
// //   const animationData = React.useMemo(() => {
// //     const newAnimationData = JSON.parse(JSON.stringify(textAnimation));
// //     if (newAnimationData?.layers?.[0]?.t?.d?.k?.[0]?.s) {
// //       newAnimationData.layers[0].t.d.k[0].s.t = text;
// //     }
// //     return newAnimationData;
// //   }, [text]);

//     const animationData = JSON.parse(JSON.stringify(animationData));

//   return (
//     <AbsoluteFill style={{
//       opacity: 0.2,
//       zIndex: 1,
//     }}>
//       <Lottie 
//         animationData={animationData}
//         playbackRate={1}
//         style={{
//           width: '100%',
//           height: '100%',
//         }}
//       />
//     </AbsoluteFill>
//   );

    return (
        <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.2, // 80% transparent
        zIndex: 1,
        }}>
        <Lottie animationData={textAnimation} />
        </div>
    );
};

export default LottieOverlay;