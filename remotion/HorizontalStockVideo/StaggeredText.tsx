import React from 'react';
import {useEffect, useState} from 'react';
import {AbsoluteFill} from 'remotion';

export const StaggeredText: React.FC<{
  text?: string;
}> = ({text = "MASTER'S DEGREE"}) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

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
        gap: '1rem'
      }}>
        {words.map((word, wordIndex) => (
          <div key={wordIndex} style={{display: 'flex'}}>
            {word.letters.map((letter, letterIndex) => (
              <span
                key={`${wordIndex}-${letterIndex}`}
                style={{
                  fontSize: '6rem',
                  fontWeight: 'bold',
                  color: 'white',
                  transition: 'all 1s ease-out',
                  opacity: show ? 1 : 0,
                  transform: show 
                    ? 'translateY(0) scale(1)' 
                    : 'translateY(-200%) scale(0.8)',
                  transitionDelay: `${wordIndex * 200 + letterIndex * 100}ms`
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