import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }
    
    // Try to find the video in the database
    const video = await db.video.findUnique({
      where: { id },
      select: {
        id: true,
        videoLink: true,
        transcriptionSrc: true,
        durationInFrames: true,
      },
    });
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    // Return the video data
    return NextResponse.json({
      id: video.id,
      url: video.videoLink,
      transcriptionUrl: video.transcriptionSrc,
      durationInFrames: video.durationInFrames,
    });
    
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
} 