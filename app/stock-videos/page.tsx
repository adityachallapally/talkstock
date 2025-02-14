'use client';

import { StockVideoUploader } from '@/components/StockVideoUploader';

export default function StockVideosPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Stock Video Processing</h1>
          <p className="text-muted-foreground">
            Upload a video to generate AI-powered overlays and stock video additions.
          </p>
        </div>
        <StockVideoUploader />
      </div>
    </div>
  );
} 