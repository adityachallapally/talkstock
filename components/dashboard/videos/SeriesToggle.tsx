'use client';

import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import SeriesSettings from '@/components/dashboard/series/SeriesSettings';

interface SeriesToggleProps {
  videoId: string;
}

export default function SeriesToggle({ videoId }: SeriesToggleProps) {
  const [isSeries, setIsSeries] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="isSeries" 
          checked={isSeries} 
          onCheckedChange={(checked) => setIsSeries(checked as boolean)}
        />
        <label htmlFor="isSeries">Make this video part of a series</label>
      </div>
      {isSeries && <SeriesSettings videoId={videoId} />}
    </div>
  );
}