'use client'

import { useState, useEffect } from 'react';

export default function VideoCounter() {
  const [count, setCount] = useState(94506);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prevCount => prevCount + 1);
    }, Math.floor(Math.random() * 30000) + 3000); // Random interval between 5 to 10 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-block bg-black bg-opacity-50 text-white text-xs py-1 px-3 rounded-full">
      <span className="font-semibold">{count.toLocaleString()}</span> videos created
    </div>
  );
}