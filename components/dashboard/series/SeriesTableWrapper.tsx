// app/dashboard/view_series/SeriesTableWrapper.tsx
'use client'

import { useState } from 'react';
import Link from 'next/link';
import SeriesTable from '@/components/dashboard/series/SeriesTable';

function CreateSeriesButton() {
  return (
    <div className="mt-4 text-center">
      <p className="mb-2">You have no series yet</p>
      <Link href="/dashboard/create/series">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Create Series
        </button>
      </Link>
    </div>
  );
}

export default function SeriesTableWrapper({ initialSeriesData }) {
  const [seriesData, setSeriesData] = useState(initialSeriesData);

  return (
    <>
      <SeriesTable series={seriesData} />
      {seriesData.length === 0 && <CreateSeriesButton />}
    </>
  );
}