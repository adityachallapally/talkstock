import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { put } from '@vercel/blob';
import { openai } from '@/lib/openai';
import { writeFile } from 'fs/promises';
import { createReadStream } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { generateStockVideoOverlays } from '@/lib/getoverlays';
import { getVideoMetadata } from '@remotion/media-utils';

// POST endpoint to start processing a video
export async function POST(request: Request) {
  let videoRecord;
  
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const audioFile = formData.get('audio') as File;
    const durationInFrames = parseInt(formData.get('durationInFrames') as string);
    
    if (!videoFile || !audioFile || !durationInFrames) {
      return NextResponse.json({ error: 'Video, audio, and duration are required' }, { status: 400 });
    }

    // Upload video to blob storage
    console.log('Uploading video to blob storage...');
    const videoBlob = await put(videoFile.name, videoFile, {
      access: 'public',
    });

    console.log('Video duration:', {
      durationInFrames,
      durationInSeconds: durationInFrames / 30
    });

    console.log('Creating database record...');
    videoRecord = await db.stockVideo.create({
      data: {
        originalVideoUrl: videoBlob.url,
        status: 'PENDING',
      },
    });
    console.log('Database record created:', videoRecord);

    // Save audio to temp file for processing
    const tempDir = os.tmpdir();
    const audioPath = path.join(tempDir, `${videoRecord.id}.wav`);
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    await writeFile(audioPath, audioBuffer);

    // Generate transcription
    console.log('Generating transcription...');
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
      language: "en"
    });

    // Convert word-level timestamps to captions
    const captions = transcription.words.map(word => ({
      text: word.word,
      startMs: Math.round(word.start * 1000),
      endMs: Math.round(word.end * 1000),
      timestampMs: Math.round((word.start + ((word.end - word.start) / 2)) * 1000)
    }));

    console.log('Last caption timing:', {
      lastCaption: captions[captions.length - 1],
      totalCaptions: captions.length,
    });

    const transcriptionBlob = await put(
      `transcriptions/${videoRecord.id}.json`,
      JSON.stringify({ transcription: captions }, null, 2),
      {
        access: 'public',
        contentType: 'application/json'
      }
    );

    // Update database record with transcription
    await db.stockVideo.update({
      where: { id: videoRecord.id },
      data: {
        transcriptionUrl: transcriptionBlob.url,
        status: 'GENERATING_OVERLAYS',
      },
    });

    // Generate overlays
    console.log('Generating overlays...');
    const overlaysByProvider = await generateStockVideoOverlays(transcriptionBlob.url);
    
    if (!overlaysByProvider || overlaysByProvider.length === 0) {
      await db.stockVideo.update({
        where: { id: videoRecord.id },
        data: { status: 'FAILED' },
      });
      return NextResponse.json({ 
        error: 'Failed to generate overlays',
        details: 'No stock video overlays were generated'
      }, { status: 400 });
    }

    // Update database record with completion
    await db.stockVideo.update({
      where: { id: videoRecord.id },
      data: {
        status: 'COMPLETED',
      },
    });

    // Return data for Remotion Player
    return NextResponse.json({ 
      success: true,
      videoId: videoRecord.id,
      src: videoRecord.originalVideoUrl,
      transcriptionUrl: transcriptionBlob.url,
      durationInFrames,
      overlaysByProvider,
      message: 'Video processed successfully'
    });

  } catch (error) {
    console.error('Error processing video:', error);
    // Update database record with error status
    if (videoRecord) {
      await db.stockVideo.update({
        where: { id: videoRecord.id },
        data: { status: 'FAILED' },
      });
    }
    return NextResponse.json({ 
      error: 'Failed to process video',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'No video ID provided' }, { status: 400 });
    }

    const stockVideo = await db.stockVideo.findUnique({
      where: { id: parseInt(id) },
    });

    if (!stockVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json(stockVideo);
  } catch (error) {
    console.error('Error fetching video status:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch video status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 