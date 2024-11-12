'use client';

import { useState } from 'react';

export default function YouTubeLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleYouTubeLogin = async () => {
    setIsLoading(true);
    window.location.href = '/api/auth/youtube';
  };

  return (
    <button
      onClick={handleYouTubeLogin}
      disabled={isLoading}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      {isLoading ? 'Connecting...' : 'Connect YouTube Account'}
    </button>
  );
}