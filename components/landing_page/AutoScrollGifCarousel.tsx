import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';

interface GifItem {
  id: string;
  src: string;
}

interface AutoScrollGifCarouselProps {
  gifs: GifItem[];
  autoScrollDuration?: number;
}

export function AutoScrollGifCarousel({ gifs, autoScrollDuration = 30000 }: AutoScrollGifCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [hoveredGif, setHoveredGif] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (hoveredGif) return;

    const totalWidth = carouselRef.current ? carouselRef.current.scrollWidth / 2 : 0;

    const animate = () => {
      const elapsedTime = Date.now() - startTimeRef.current;
      let newPosition = (elapsedTime / autoScrollDuration) * totalWidth;

      if (newPosition >= totalWidth) {
        startTimeRef.current = Date.now();
        newPosition = 0;
      }

      setScrollPosition(newPosition);
      requestAnimationFrame(animate);
    };

    const animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [hoveredGif, autoScrollDuration]);

  const handleMouseEnter = (gifId: string) => setHoveredGif(gifId);
  const handleMouseLeave = () => {
    setHoveredGif(null);
    startTimeRef.current = Date.now();
  };

  const duplicatedGifs = [...gifs, ...gifs]; // Duplicate gifs for infinite loop

  return (
    <div 
      className="w-full max-w-7xl overflow-hidden"
      ref={carouselRef}
    >
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{
          transform: `translateX(-${scrollPosition}px)`,
          width: `${(duplicatedGifs.length / 5) * 130}%`, // Increased to 130% for extra spacing
        }}
      >
        {duplicatedGifs.map((gif, index) => (
          <div
            key={`${gif.id}-${index}`}
            className="w-1/5 p-6 flex-shrink-0" // Increased padding for more space between cards
            onMouseEnter={() => handleMouseEnter(gif.id)}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={`aspect-[9/16] overflow-hidden transition-all duration-300 ease-in-out rounded-lg ${
                hoveredGif === gif.id ? 'scale-110 z-10 shadow-lg' : 'scale-25'
              }`}
            >
              <img
                src={gif.src}
                alt={`GIF ${gif.id}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}