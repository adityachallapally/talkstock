import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { put } from '@vercel/blob';
import { openai } from '@/lib/openai';
import { writeFile } from 'fs/promises';
import { createReadStream } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { generateStockVideoOverlays } from '@/lib/getoverlays';

export async function POST(request: Request) {
  console.log('Received request to generate transcript');

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }
    
    // Extract video ID from the filename
    const filenameMatch = audioFile.name.match(/audio-(\d+)\.wav/);
    if (!filenameMatch) {
      return NextResponse.json({ error: 'Invalid audio filename format' }, { status: 400 });
    }
    
    const videoId = parseInt(filenameMatch[1]);
    console.log(`Processing transcript for video ID: ${videoId}`);
    
    // Save audio to temp file for processing
    const tempDir = os.tmpdir();
    const audioPath = path.join(tempDir, `${videoId}.wav`);
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    await writeFile(audioPath, audioBuffer);
    console.log(`Audio saved to temporary file: ${audioPath}`);

    // Generate transcription
    console.log('Calling OpenAI API for transcription...');
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
      language: "en"
    });
    console.log('OpenAI transcription received successfully');

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

    // Upload transcript to Vercel Blob
    console.log('Uploading transcript to Vercel Blob...');
    const transcriptionBlob = await put(
      `transcriptions/${videoId}.json`,
      JSON.stringify({ transcription: captions }, null, 2),
      {
        access: 'public',
        contentType: 'application/json'
      }
    );
    console.log(`Transcript uploaded to: ${transcriptionBlob.url}`);

    // Check if the video exists in the database
    console.log('Checking if video exists in database...');
    const existingVideo = await db.video.findUnique({
      where: { id: videoId },
    });

    if (!existingVideo) {
      console.error(`Video with ID ${videoId} not found in database`);
      return NextResponse.json({ 
        error: 'Video not found in database',
        videoId
      }, { status: 404 });
    }

    // Generate stock video overlays based on the transcript
    console.log('Generating stock video overlays...');
    try {
      const overlayGroups = await generateStockVideoOverlays(transcriptionBlob.url);
      
      // Take the first overlay group (typically Pexels provider)
      const overlays = overlayGroups.length > 0 ? overlayGroups[0] : [];
      
      console.log(`Generated ${overlays.length} stock video overlays`);

      // Update database record with transcription URL and overlays
      console.log('Updating database record with transcription URL and overlays...');
      await db.video.update({
        where: { id: videoId },
        data: {
          transcriptionSrc: transcriptionBlob.url,
          overlays: overlays,
        },
      });
      console.log('Database updated successfully');

      return NextResponse.json({ 
        success: true,
        transcriptionUrl: transcriptionBlob.url,
        overlays: overlays,
        message: 'Transcript and overlays generated successfully'
      });
      
    } catch (overlaysError) {
      console.error('Error generating overlays:', overlaysError);
      
      // Update database record with just the transcription URL if overlays fail
      await db.video.update({
        where: { id: videoId },
        data: {
          transcriptionSrc: transcriptionBlob.url,
        },
      });
      
      return NextResponse.json({ 
        success: true,
        transcriptionUrl: transcriptionBlob.url,
        error: 'Overlays generation failed',
        message: 'Transcript generated successfully but overlays failed'
      });
    }

  } catch (error) {
    console.error('Error generating transcript:', error);
    // Return more detailed error information
    return NextResponse.json({ 
      error: 'Failed to generate transcript',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 