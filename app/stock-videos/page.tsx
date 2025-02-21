'use client';

import { StockVideoUploader } from '@/components/StockVideoUploader';
import { PixabayTester } from '@/components/PixabayTester';

export default function StockVideosPage() {
  return (
    <main className="w-full h-screen p-0">
      <div className="space-y-8">
        <StockVideoUploader />
      </div>
    </main>
  );
} 