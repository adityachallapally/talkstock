'use client';

import { StockVideoUploader } from '@/components/StockVideoUploader';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Create a client component that uses useSearchParams
function StockVideoContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('videoId');
  
  return (
    <StockVideoUploader initialVideoId={videoId ? parseInt(videoId) : undefined} />
  );
}

// Main page component with Suspense boundary
export default function StockVideosPage() {
  return (
    <main className="w-full h-screen p-0">
      <div className="space-y-8">
        <Suspense fallback={<div>Loading...</div>}>
          <StockVideoContent />
        </Suspense>
      </div>
    </main>
  );
} 