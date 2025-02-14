import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRenderProgress } from '@/lambda/api';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const video = await db.StockVideo.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // If video is in RENDERING state, check the render progress
    if (video.status === 'RENDERING') {
      try {
        const progress = await getRenderProgress(video.renderId);
        
        if (progress.done) {
          // Update video with final URL and status
          await db.StockVideo.update({
            where: { id },
            data: {
              outputVideoUrl: progress.outputUrl,
              status: 'COMPLETED'
            }
          });
          
          return NextResponse.json({
            status: 'COMPLETED',
            outputUrl: progress.outputUrl
          });
        }
        
        return NextResponse.json({
          status: 'RENDERING',
          progress: progress.progress,
          renderId: video.renderId
        });
      } catch (error) {
        console.error('Error checking render progress:', error);
        // If there's an error checking progress, mark as failed
        await db.StockVideo.update({
          where: { id },
          data: { status: 'FAILED' }
        });
        return NextResponse.json({ 
          status: 'FAILED',
          error: 'Failed to check render progress'
        });
      }
    }

    // For other states, just return the current status
    return NextResponse.json({
      status: video.status,
      outputUrl: video.outputVideoUrl
    });

  } catch (error) {
    console.error('Error checking video status:', error);
    return NextResponse.json({ 
      error: 'Failed to check video status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 