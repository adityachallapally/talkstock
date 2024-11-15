// src/CaptionedVideo/styles.ts

import {CSSProperties} from 'react';

export const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: 'center',
  padding: '20px',
  boxSizing: 'border-box',
  width: '100%',
  height: '100%',
};

export const overlayStyles = {
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'blur(4px) brightness(0.8)',
  } as CSSProperties,

  darkOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    position: 'absolute',
  } as CSSProperties,

  scanlines: {
    background: `repeating-linear-gradient(
      180deg,
      transparent,
      transparent 3px,
      rgba(255, 255, 255, 0.01) 4px,
      rgba(255, 255, 255, 0.03) 4.5px,
      rgba(255, 255, 255, 0.1) 5px,
      rgba(255, 255, 255, 0.1) 29px,
      rgba(255, 255, 255, 0.03) 29.5px,
      rgba(255, 255, 255, 0.01) 30px,
      transparent 30px
    )`,
    position: 'absolute',
  } as CSSProperties,

  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  } as CSSProperties,

  container: {
    border: '2px solid rgba(255, 255, 255, 0.5)',
    padding: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    maxWidth: '80%',
    margin: '0 auto',
  },

  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '24px',
    textAlign: 'center' as const,
  },

  text: {
    color: 'white',
    fontSize: '67px',
    fontFamily: 'Montserrat',
    fontWeight: 500,
    lineHeight: '1.4',
    textAlign: 'left',
    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
  } as CSSProperties,
};