'use client'
import React, { useEffect, useRef } from 'react';
import Splide from '@splidejs/splide';
import { AutoScroll } from '@splidejs/splide-extension-auto-scroll';
import '@splidejs/splide/dist/css/splide.min.css';
import Image from 'next/image';

const InfiniteCarousel = ({ gifs }) => {
  const splideRef = useRef(null);

  useEffect(() => {
    if (splideRef.current) {
      const splide = new Splide(splideRef.current, {
        type: 'loop',
        drag: 'free',
        focus: 'center',
        perPage: 3,
        autoScroll: {
          speed: 1,
        },
        gap: '1rem',
        pagination: false,
        arrows: false,
      });

      splide.mount({ AutoScroll });

      return () => {
        splide.destroy();
      };
    }
  }, []);

  return (
    <div ref={splideRef} className="splide" style={{ height: '60vh' }}>
      <div className="splide__track" style={{ height: '100%' }}>
        <ul className="splide__list" style={{ height: '100%' }}>
          {gifs.map((gif) => (
            <li key={gif.id} className="splide__slide" style={{ height: '100%' }}>
              <div className="gif-container" style={{
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Image
                  src={gif.src}
                  alt={`GIF ${gif.id}`}
                  width={300}
                  height={533}
                  className="rounded-lg"
                  style={{
                    maxHeight: '100%',
                    width: 'auto',
                    objectFit: 'contain',
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InfiniteCarousel;
