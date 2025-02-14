import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { put } from '@vercel/blob';
import { openai } from '@/lib/openai';
import { writeFile } from 'fs/promises';
import { createReadStream } from 'fs';
import * as os from 'os';
import * as path from 'path';
import generateOverlays from '@/lib/getoverlays';

// POST endpoint to start processing a video
export async function POST(request: Request) {
  let videoRecord;
  
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const audioFile = formData.get('audio') as File;
    
    if (!videoFile || !audioFile) {
      return NextResponse.json({ error: 'Video and audio files are required' }, { status: 400 });
    }

    // Upload video to blob storage
    console.log('Uploading video to blob storage...');
    const videoBlob = await put(videoFile.name, videoFile, {
      access: 'public',
    });

    console.log('Creating database record...');
    videoRecord = await db.StockVideo.create({
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
      response_format: "srt",
      language: "en"
    });

    // Parse and store transcription
    const captions = parseSrtToJson(transcription.toString());
    const transcriptionBlob = await put(
      `transcriptions/${videoRecord.id}.json`,
      JSON.stringify({ transcription: captions }, null, 2),
      {
        access: 'public',
        contentType: 'application/json'
      }
    );

    // Update database record with transcription
    await db.StockVideo.update({
      where: { id: videoRecord.id },
      data: {
        transcriptionUrl: transcriptionBlob.url,
        status: 'GENERATING_OVERLAYS',
      },
    });

    // Generate overlays
    console.log('Generating overlays...');
    const overlays = await generateOverlays(transcriptionBlob.url);
    
    if (!overlays || overlays.length === 0) {
      await db.StockVideo.update({
        where: { id: videoRecord.id },
        data: { status: 'FAILED' },
      });
      return NextResponse.json({ 
        error: 'Failed to generate overlays',
        details: 'No overlays were generated'
      }, { status: 400 });
    }

    // Update database record with completion
    await db.StockVideo.update({
      where: { id: videoRecord.id },
      data: {
        status: 'COMPLETED',
      },
    });

    // Return data for Remotion Player
    return NextResponse.json({ 
      success: true,
      videoId: videoRecord.id,
      videoUrl: videoRecord.originalVideoUrl,
      transcriptionUrl: transcriptionBlob.url,
      durationInFrames: Math.ceil(captions[captions.length - 1].endMs / (1000 / 30)), // Convert last caption end time to frames
      overlays,
      message: 'Video processed successfully'
    });

  } catch (error) {
    console.error('Error processing video:', error);
    // Update database record with error status
    if (videoRecord) {
      await db.StockVideo.update({
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

    const stockVideo = await db.StockVideo.findUnique({
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

function parseSrtToJson(srtContent: string) {
  const captions: Array<{
    text: string;
    startMs: number;
    endMs: number;
    timestampMs: number;
  }> = [];

  const blocks = srtContent.trim().split('\n\n');

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;

    const timecode = lines[1];
    const [startTime, endTime] = timecode.split(' --> ');
    
    const startMs = timeToMs(startTime);
    const endMs = timeToMs(endTime);
    const text = lines.slice(2).join(' ').trim();

    captions.push({
      text,
      startMs,
      endMs,
      timestampMs: startMs + ((endMs - startMs) / 2)
    });
  }

  return captions;
}

function timeToMs(timeStr: string): number {
  const [time, ms] = timeStr.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + Number(ms);
} 