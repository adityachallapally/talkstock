import React, { useState, useEffect, useRef } from 'react';

interface Video {
  id: string;
  src: string;
}

interface AutoScrollVideoCarouselProps {
  videos: Video[];
  autoScrollInterval?: number;
}

export function AutoScrollVideoCarousel({ videos, autoScrollInterval = 5000 }: AutoScrollVideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovering) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % videos.length);
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [videos.length, autoScrollInterval, isHovering]);

  const handleMouseEnter = (videoId: string) => {
    setIsHovering(true);
    setHoveredVideo(videoId);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setHoveredVideo(null);
  };

  return (
    <div className="w-full max-w-7xl overflow-hidden" ref={carouselRef}>
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * (100 / 5)}%)`,
          width: `${(videos.length / 5) * 100}%`,
        }}
      >
        {videos.map((video) => (
          <div
            key={video.id}
            className="w-1/5 p-2 flex-shrink-0"
            onMouseEnter={() => handleMouseEnter(video.id)}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={`aspect-[9/16] overflow-hidden transition-all duration-300 ease-in-out ${
                hoveredVideo === video.id ? 'scale-110 z-10 shadow-lg' : ''
              }`}
            >
              <video
                src={video.src}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                controls={hoveredVideo === video.id}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}