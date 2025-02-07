import React from 'react';
import {useEffect, useState} from 'react';
import {AbsoluteFill} from 'remotion';

export const StaggeredText: React.FC<{
  text: string;
  frame: number;
  duration: number;
}> = ({text, frame, duration}) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const fadeOut = frame > duration - 30;

  const words = text.split(' ').map(word => ({
    text: word,
    letters: word.split('')
  }));
  
  return (
    <AbsoluteFill style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        justifyContent: 'center',
        padding: '0 2rem',
      }}>
        {words.map((word, wordIndex) => (
          <div key={wordIndex} style={{display: 'flex'}}>
            {word.letters.map((letter, letterIndex) => (
              <span
                key={`${wordIndex}-${letterIndex}`}
                style={{
                  fontSize: '4rem',
                  fontWeight: 'bold',
                  color: 'white',
                  transition: 'all 1s ease-out',
                  opacity: fadeOut ? 0 : (show ? 1 : 0),
                  transform: fadeOut 
                    ? 'translateY(200%) scale(0.8)'
                    : (show 
                      ? 'translateY(0) scale(1)' 
                      : 'translateY(-200%) scale(0.8)'),
                  transitionDelay: fadeOut
                    ? `${(words.length - wordIndex) * 200 + (word.letters.length - letterIndex) * 100}ms`
                    : `${wordIndex * 200 + letterIndex * 100}ms`
                }}
              >
                {letter}
              </span>
            ))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const FadeInText: React.FC<{
  text: string;
  frame: number;
  duration: number;
}> = ({text, frame, duration}) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const fadeOut = frame > duration - 30;

  return (
    <AbsoluteFill style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div
        style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          color: 'white',
          transition: 'all 1s ease-out',
          opacity: fadeOut ? 0 : (show ? 1 : 0),
          transform: show 
            ? 'translateY(0)' 
            : 'translateY(20px)',
          textAlign: 'center',
          padding: '0 2rem',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export const SlideText: React.FC<{
  text: string;
  frame: number;
  duration: number;
}> = ({text, frame, duration}) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const fadeOut = frame > duration - 30;

  return (
    <AbsoluteFill style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div
        style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          color: 'white',
          transition: 'all 1s ease-out',
          opacity: fadeOut ? 0 : (show ? 1 : 0),
          transform: fadeOut
            ? 'translateX(100vw)'
            : (show 
              ? 'translateX(0)' 
              : 'translateX(-100vw)'),
          textAlign: 'center',
          padding: '0 2rem',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// Define animation types
const animationTypes = [
  {
    component: FadeInText,
    name: 'fade'
  },
  {
    component: StaggeredText,
    name: 'stagger'
  },
  {
    component: SlideText,
    name: 'slide'
  }
];

// Your text content
const textContent = [
  "Set yourself apart.",
  "Become an expert in Epidemiology.",
  "Advance your career and learn the in-demand skills you need.",
  "Earn a graduate certificate.",
  "Or a master's degree.",
  "Apply now and get started."
];

// Generate animations with random types
export const textAnimations = textContent.map((text, index) => {
  const randomAnimation = animationTypes[Math.floor(Math.random() * animationTypes.length)];
  const frameDuration = 90; // 3 seconds at 30fps
  const spacing = 30; // 1 second gap between animations
  const startFrame = index * (frameDuration + spacing);

  return {
    component: React.createElement(randomAnimation.component, {
      text,
      frame: 0,
      duration: frameDuration
    }),
    startFrame,
    duration: frameDuration,
  };
}); 