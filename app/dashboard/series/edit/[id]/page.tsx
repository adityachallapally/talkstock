import React from 'react';
import { notFound } from 'next/navigation';
import VideoCard from '@/components/dashboard/VideoCard';
import SeriesSettings from '@/components/dashboard/series/SeriesSettings';
import { getSeries } from '@/lib/seriesActions';

export default async function ViewSeriesPage({ params }: { params: { id: string } }) {
    const series = await getSeries(params.id);

    return (
        // <div className="container mx-auto p-6 space-y-8">
        //     <VideoCard video={video} />
        //     <SeriesSettings videoId={params.id} />
        // </div>
        <></>
    );
}