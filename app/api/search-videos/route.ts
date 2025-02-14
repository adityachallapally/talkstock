import { NextResponse } from 'next/server';
import { createClient, Videos } from 'pexels';

const pexelsClient = createClient('V4GUX2DiZafEDUKHToyAhpJM2LD18BpU3WdkCvsi4TMX8BTSOH35wQJX');

interface VideoFile {
  file_type: string;
  link: string;
}

interface PexelsVideo {
  video_files: VideoFile[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    console.log('Received search request for term:', term);

    if (!term) {
      console.log('No search term provided');
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
    }

    console.log('Searching Pexels for:', term);
    const response = await pexelsClient.videos.search({ 
      query: term, 
      per_page: 9, 
      orientation: 'portrait' 
    }) as Videos;
    console.log('Pexels response received:', {
      totalResults: response.total_results,
      videosFound: response.videos?.length || 0
    });

    const videos = response.videos?.map((video: PexelsVideo) => {
      const mp4File = video.video_files.find(file => file.file_type === 'video/mp4');
      return {
        videoSrc: mp4File?.link || ''
      };
    }).filter(video => video.videoSrc) || [];

    console.log('Processed videos:', {
      totalVideos: videos.length,
      hasVideoUrls: videos.every(v => v.videoSrc)
    });

    return NextResponse.json({ videos });

  } catch (error) {
    console.error('Error searching videos:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json({ 
      error: 'Failed to search videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 