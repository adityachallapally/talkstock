'use client';

import { StockVideoUploader } from '@/components/StockVideoUploader';
import { PixabayTester } from '@/components/PixabayTester';

export default function StockVideosPage() {
  return (
    <main className="container mx-auto p-4 space-y-8">
      <h1 className="text-4xl font-bold mb-8">Stock Video Generator</h1>
      <div className="space-y-8">
        <PixabayTester />
        <StockVideoUploader />
      </div>
    </main>
  );
} 