import React from 'react';
import { notFound } from 'next/navigation';
import VideoCard from '@/components/dashboard/VideoCard';
import SeriesToggle from '@/components/dashboard/videos/SeriesToggle';
import { getVideo } from '@/lib/videoActions';

export default async function ViewVideoPage({ params }: { params: { id: string } }) {
    let video;
    try {
        video = await getVideo(parseInt(params.id, 10));
    } catch (error) {
        console.error('Error fetching video:', error);
        notFound();
    }

    if (!video) {
        notFound();
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <VideoCard video={video} />
            <SeriesToggle videoId={params.id} />
        </div>
    );
}
