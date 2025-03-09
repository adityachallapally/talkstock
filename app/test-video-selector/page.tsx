'use client';

import { useState } from 'react';
import { VideoSelector, VideoUploadResult } from '@/components/VideoSelector';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function TestVideoSelectorPage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoUploadResult | null>(null);
  const router = useRouter();

  const handleVideoSelected = (result: VideoUploadResult) => {
    console.log('Video selected:', result);
    setSelectedVideo(result);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Video Selector Test Page</h1>
      
      {!selectedVideo ? (
        <Card className="p-6 shadow-lg">
          <VideoSelector onVideoSelected={handleVideoSelected} />
        </Card>
      ) : (
        <div className="mt-8">
          <Card className="p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Selected Video Details</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Video Preview</h3>
                <video 
                  src={selectedVideo.url} 
                  controls 
                  className="w-full mt-2 rounded-md"
                  style={{ maxHeight: '400px' }}
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Video URL</h3>
                <p className="text-sm mt-1 break-all">{selectedVideo.url}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Duration (in frames)</h3>
                <p className="text-sm mt-1">{selectedVideo.durationInFrames} frames</p>
              </div>
              
              {selectedVideo.transcriptionUrl && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Transcription URL</h3>
                  <p className="text-sm mt-1 break-all">{selectedVideo.transcriptionUrl}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setSelectedVideo(null)}
              className="mt-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition-colors"
            >
              Select Another Video
            </button>
            
            <Button
              variant="secondary"
              onClick={() => router.push(`/stock-videos?videoId=${selectedVideo.id}`)}
              className="mt-4 w-full"
            >
              Edit with Stock Videos
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
} 