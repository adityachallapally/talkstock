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
        overlays: true,
      },
    });
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Fetch transcript data if available
    let transcript = null;
    if (video.transcriptionSrc) {
      try {
        const response = await fetch(video.transcriptionSrc);
        if (response.ok) {
          const data = await response.json();
          transcript = data.transcription;
        }
      } catch (transcriptError) {
        console.error('Error fetching transcript:', transcriptError);
      }
    }
    
    // Return the video data with overlays and transcript
    return NextResponse.json({
      id: video.id,
      url: video.videoLink,
      videoLink: video.videoLink,
      transcriptionUrl: video.transcriptionSrc,
      durationInFrames: video.durationInFrames,
      overlays: video.overlays,
      transcript: transcript,
    });
    
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}

// Add PUT endpoint to update overlays
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }
    
    const data = await request.json();
    
    if (!data.overlays) {
      return NextResponse.json({ error: 'Overlays data is required' }, { status: 400 });
    }
    
    // Update the overlays in the database
    await db.video.update({
      where: { id },
      data: {
        overlays: data.overlays,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Overlays updated successfully',
    });
    
  } catch (error) {
    console.error('Error updating overlays:', error);
    return NextResponse.json(
      { error: 'Failed to update overlays' },
      { status: 500 }
    );
  }
}