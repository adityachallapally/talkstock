import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import generateOverlays from '@/lib/getoverlays';
import { renderVideo } from '@/lambda/api';
import { COMP_NAME } from '@/types/constants';
import { transcribeVideo } from '@/lib/services/videoTranscription';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

export async function POST(request: Request) {
  try {
    console.log('Starting add-stock-videos endpoint...');
    const { videoId } = await request.json();
    console.log('Received videoId:', videoId);

    // Get the existing video
    const video = await db.video.findUnique({
      where: { id: Number(videoId) },
      select: {
        id: true,
        videoLink: true,
        imageUrls: true,
        durationInFrames: true,
        transcriptionSrc: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    console.log('Found video:', {
      id: video.id,
      hasVideo: !!video.videoLink,
      hasImages: !!video.imageUrls,
      hasTranscription: !!video.transcriptionSrc
    });

    // Validate required fields
    if (!video.videoLink) {
      return NextResponse.json({ 
        error: 'Video link is missing',
        details: { hasVideo: false }
      }, { status: 400 });
    }

    if (!video.imageUrls || video.imageUrls.length === 0) {
      return NextResponse.json({ 
        error: 'Video is missing image data',
        details: { hasImages: false }
      }, { status: 400 });
    }

    // Create temp directory for processing
    const tempDir = path.join(process.cwd(), 'temp');
    await mkdir(tempDir, { recursive: true });

    // Download video file
    console.log('Downloading video file...');
    const videoResponse = await fetch(video.videoLink);
    if (!videoResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to download video file',
        details: { status: videoResponse.status, statusText: videoResponse.statusText }
      }, { status: 400 });
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const videoPath = path.join(tempDir, `${video.id}.mp4`);
    await writeFile(videoPath, Buffer.from(videoBuffer));

    // Generate transcription
    console.log('Generating transcription...');
    const { transcriptionUrl, captions } = await transcribeVideo(videoPath);
    console.log('Transcription generated:', { url: transcriptionUrl, captionCount: captions.length });

    // Update video with transcription URL
    await db.video.update({
      where: { id: video.id },
      data: {
        transcriptionSrc: transcriptionUrl,
      },
    });

    // Generate overlays using the captions directly
    console.log('Generating overlays...');
    const overlays = await generateOverlays(transcriptionUrl);
    console.log('Generated overlays:', overlays);

    if (!overlays || overlays.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to generate overlays', 
        details: 'No overlays were generated from the transcription'
      }, { status: 400 });
    }

    // Start video render
    console.log('Starting video render...');
    const { renderId, bucketName } = await renderVideo({
      id: COMP_NAME,
      inputProps: {
        audioSrc: video.videoLink,
        images: video.imageUrls,
        subtitlesSrc: transcriptionUrl,
        durationInFrames: video.durationInFrames || 300,
        overlays
      }
    });

    // Update video status
    await db.video.update({
      where: { id: video.id },
      data: {
        postStatus: 'PROCESSING',
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Stock video addition process started',
      renderId,
      bucketName
    });

  } catch (error) {
    console.error('Error in add-stock-videos:', error);
    return NextResponse.json({ 
      error: 'Failed to add stock videos',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 