"use client";

import React from 'react';
import VideoCreator from '@/components/VideoCreator';

const VideoCreatorPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create Your Video</h1>
      <VideoCreator />
    </div>
  );
};

export default VideoCreatorPage;