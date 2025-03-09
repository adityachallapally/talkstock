import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { put } from '@vercel/blob';
import { openai } from '@/lib/openai';
import { writeFile } from 'fs/promises';
import { createReadStream } from 'fs';
import * as os from 'os';
import * as path from 'path';

export async function POST(request: Request) {
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
    
    // Save audio to temp file for processing
    const tempDir = os.tmpdir();
    const audioPath = path.join(tempDir, `${videoId}.wav`);
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

    // Upload transcript to Vercel Blob
    const transcriptionBlob = await put(
      `transcriptions/${videoId}.json`,
      JSON.stringify({ transcription: captions }, null, 2),
      {
        access: 'public',
        contentType: 'application/json'
      }
    );

    // Update database record with transcription URL
    await db.video.update({
      where: { id: videoId },
      data: {
        transcriptionUrl: transcriptionBlob.url,
      },
    });

    return NextResponse.json({ 
      success: true,
      transcriptionUrl: transcriptionBlob.url,
      message: 'Transcript generated successfully'
    });

  } catch (error) {
    console.error('Error generating transcript:', error);
    return NextResponse.json({ 
      error: 'Failed to generate transcript',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 