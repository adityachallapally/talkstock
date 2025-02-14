import OpenAI from 'openai';
import { put } from '@vercel/blob';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptionResult {
  transcriptionUrl: string;
  captions: Array<{
    text: string;
    startMs: number;
    endMs: number;
    timestampMs: number;
  }>;
}

export async function transcribeVideo(videoPath: string): Promise<TranscriptionResult> {
  try {
    console.log('Starting video transcription...');
    
    // Create a readable stream from the video file
    const videoStream = createReadStream(videoPath);
    
    // Get transcription from OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: videoStream,
      model: "whisper-1",
      response_format: "srt",
      language: "en"
    });

    // Parse SRT format into our caption format
    const captions = parseSrtToJson(transcription.toString());

    // Save transcription to blob storage
    const transcriptionData = {
      transcription: captions,
      format: "json",
      created_at: new Date().toISOString()
    };

    const transcriptionBlob = await put(
      `transcriptions/video_${Date.now()}.json`,
      JSON.stringify(transcriptionData, null, 2),
      {
        access: 'public',
        contentType: 'application/json'
      }
    );

    return {
      transcriptionUrl: transcriptionBlob.url,
      captions
    };
  } catch (error) {
    console.error('Error in transcribeVideo:', error);
    throw error;
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