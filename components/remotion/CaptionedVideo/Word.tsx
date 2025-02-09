// src/CaptionedVideo/Word.tsx

import React from 'react';
import {interpolate} from 'remotion';
import {TheBoldFont} from '../load-font';
import {makeTransform, scale, translateY} from '@remotion/animation-utils';

const fontFamily = TheBoldFont;

export const Word: React.FC<{
  enterProgress: number;
  text: string;
  stroke: boolean;
}> = ({enterProgress, text, stroke}) => {
  const minFontSize = 40;
  const maxFontSize = 80;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        fontSize: `clamp(${minFontSize}px, 5vw, ${maxFontSize}px)`,
        color: 'white',
        WebkitTextStroke: stroke ? '4px black' : undefined,
        transform: makeTransform([
          scale(interpolate(enterProgress, [0, 1], [0.8, 1])),
          translateY(interpolate(enterProgress, [0, 1], [50, 0])),
        ]),
        fontFamily,
        textTransform: 'uppercase',
        textAlign: 'center',
        lineHeight: 1.2,
      }}
    >
      {text}
    </div>
  );
};