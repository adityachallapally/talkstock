import React from 'react';
import {useEffect, useState} from 'react';
import {AbsoluteFill} from 'remotion';

// Enhanced staggered text with scaling and dynamic entrance
export const StaggeredText: React.FC<{
  text: string;
  frame: number;
  duration: number;
  isLarge?: boolean;
}> = ({text, frame, duration, isLarge = false}) => {
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
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        justifyContent: 'center',
        padding: '0 2rem',
      }}>
        {words.map((word, wordIndex) => (
          <div key={wordIndex} style={{
            display: 'flex',
            transform: isLarge ? 'scale(1.5)' : 'scale(1)',
            transition: 'transform 0.5s ease-out',
          }}>
            {word.letters.map((letter, letterIndex) => (
              <span
                key={`${wordIndex}-${letterIndex}`}
                style={{
                  fontSize: '4rem',
                  fontWeight: 'bold',
                  color: 'white',
                  transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: fadeOut ? 0 : (show ? 1 : 0),
                  transform: fadeOut 
                    ? 'translateY(100px) scale(0.8)'
                    : (show 
                      ? 'translateY(0) scale(1)' 
                      : 'translateY(-100px) scale(1.2)'),
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

// Multi-part text animation component
export const MultiPartText: React.FC<{
  parts: {text: string; style?: 'large' | 'normal'}[];
  frame: number;
  duration: number;
}> = ({parts, frame, duration}) => {
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}>
        {parts.map((part, index) => (
          <div
            key={index}
            style={{
              fontSize: part.style === 'large' ? '6rem' : '4rem',
              fontWeight: 'bold',
              color: 'white',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: fadeOut ? 0 : (show ? 1 : 0),
              transform: fadeOut
                ? 'translateY(50px) scale(0.8)'
                : (show 
                  ? 'translateY(0) scale(1)' 
                  : `translateY(-50px) scale(${part.style === 'large' ? 1.5 : 1})`),
              transitionDelay: `${index * 200}ms`,
              textAlign: 'center',
              padding: '0 2rem',
            }}
          >
            {part.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Slide animation with enhanced timing
export const SlideText: React.FC<{
  text: string;
  frame: number;
  duration: number;
  direction?: 'left' | 'right';
}> = ({text, frame, duration, direction = 'left'}) => {
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
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: fadeOut ? 0 : (show ? 1 : 0),
          transform: fadeOut
            ? `translateX(${direction === 'left' ? '100vw' : '-100vw'})`
            : (show 
              ? 'translateX(0)' 
              : `translateX(${direction === 'left' ? '-100vw' : '100vw'})`),
          textAlign: 'center',
          padding: '0 2rem',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// Scale Letter Animation using AnimeJS
export const ScaleLetterText: React.FC<{
  text: string;
  frame: number;
  duration: number;
}> = ({text, frame, duration}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Split text into individual letter spans
    const letters = text.split('').map((letter, i) => (
      `<span class="scale-letter" key="${i}">${letter}</span>`
    )).join('');
    
    if (containerRef.current) {
      containerRef.current.innerHTML = letters;
    }

    import('animejs').then((anime) => {
      anime.default.timeline({loop: false})
        .add({
          targets: '.scale-letter',
          scale: [4, 1],
          opacity: [0, 1],
          translateZ: 0,
          easing: "easeOutExpo",
          duration: 950,
          delay: (el, i) => 70 * i
        });
    });
  }, [text]);

  const fadeOut = frame > duration - 30;

  return (
    <AbsoluteFill style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div
        ref={containerRef}
        style={{
          fontSize: '4rem',
          fontWeight: 900,
          color: 'white',
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 0.5s ease-out',
        }}
      />
    </AbsoluteFill>
  );
};

// Define animation types with enhanced options
const animationTypes = [
  {
    component: MultiPartText,
    name: 'multipart'
  },
  {
    component: StaggeredText,
    name: 'stagger'
  },
  {
    component: SlideText,
    name: 'slide'
  },
  {
    component: ScaleLetterText,
    name: 'scale-letter'
  }
];

// Your text content with specific animations
const textContent = [
  {
    type: 'multipart',
    content: {
      parts: [
        { text: "EARN A", style: 'large' },
        { text: "GRADUATE", style: 'normal' },
        { text: "CERTIFICATE", style: 'normal' }
      ]
    }
  },
  {
    type: 'stagger',
    content: { text: "OR A" }
  },
  {
    type: 'multipart',
    content: {
      parts: [
        { text: "MASTER'S", style: 'large' },
        { text: "DEGREE", style: 'normal' }
      ]
    }
  },
  {
    type: 'slide',
    content: { text: "Apply now and get started", direction: 'right' }
  },
  {
    type: 'scale-letter',
    content: { text: "Welcome to the Future" }
  }
];

// Generate animations with specific types
export const textAnimations = textContent.map((content, index) => {
  const frameDuration = 90; // 3 seconds at 30fps
  const spacing = 30; // 1 second gap between animations
  const startFrame = index * (frameDuration + spacing);

  const animationType = animationTypes.find(type => type.name === content.type);
  if (!animationType) return null;

  return {
    component: React.createElement(animationType.component as any, {
      ...content.content,
      frame: 0,
      duration: frameDuration
    }),
    startFrame,
    duration: frameDuration,
  };
}).filter(Boolean);