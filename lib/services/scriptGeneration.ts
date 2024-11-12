import OpenAI from "openai";
import fs from 'fs';
import path from 'path';
import { uploadFile } from '../utils/file';
import { transcribe, convertToCaptions } from "@remotion/install-whisper-cpp";
import { uploadBuffer } from '../utils/file';
import { parseSrt } from '@remotion/captions';
import * as wavFileInfo from 'wav-file-info';
import * as mm from 'music-metadata';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type ScriptChunk = {
  text: string;
  estimatedDuration: number;
};

export type SubtitleTiming = {
  text: string;
  startTime: number;
  duration: number;
  imageUrl: string;
};

export async function createScript(topic: string): Promise<string> {
  try {
    const prompt = `Create an engaging 20-second script for a ${topic} video that will capture viewers' attention. Your script should:

    1. Open with an intriguing fact or statement related to ${topic}
    2. Provide some concise, accurate facts that highlight the importance or uniqueness of ${topic}
    3. Use clear, concise language that's easy to understand
    4. Include a brief explanation that simplifies a key concept related to ${topic}
    5. Conclude with a thought-provoking question or call-to-action
    
    Aim for 50-70 words of informative, engaging content. Ensure all facts and statements are accurate and directly related to the topic. Maintain a respectful and informative tone appropriate for the historical subject matter. Do not include sound effects or directorial instructions in the script. Remember, we're competing for viewers' attention. Make every word count and stay focused on the topic.`;
    
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You're an expert in creating concise, informative scripts about historical and cultural topics. Your specialty is distilling complex subjects into clear, engaging content that educates and intrigues viewers." },
        { role: "user", content: prompt }
      ],
      model: "gpt-4",
    });

    return completion.choices[0].message.content || '';

  } catch (error) {
    console.error('Error in createScript:', error);
    throw error;
  }
}

export function splitScriptIntoSections(script: string, sectionCount: number = 10): string[] {
  const words = script.split(' ');
  const wordsPerSection = Math.ceil(words.length / sectionCount);
  const sections: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerSection) {
    sections.push(words.slice(i, i + wordsPerSection).join(' '));
  }

  return sections;
}

function getWavDuration(buffer: Buffer): Promise<number> {
  return new Promise((resolve, reject) => {
    wavFileInfo.infoByBuffer(buffer, (err, info) => {
      if (err) {
        reject(err);
      } else {
        resolve(info.duration);
      }
    });
  });
}

async function getAudioDuration(buffer: Buffer): Promise<number> {
  const metadata = await mm.parseBuffer(buffer);
  return metadata.format.duration || 0;
}

export async function createAudio(script: string): Promise<{ 
  audiolink: string; 
  transcriptionPath: string;
  durationInSeconds: number;
}> {
  console.log('Starting audio creation process');
  try {
    console.log('Sending request to OpenAI for speech generation');
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: script,
      response_format: "mp3",
    });
    console.log('Received response from OpenAI');

    console.log('Converting response to buffer');
    const buffer = Buffer.from(await response.arrayBuffer());
    console.log(`Buffer created, size: ${buffer.length} bytes`);

    // Calculate duration from the buffer
    const durationInSeconds = await getAudioDuration(buffer);

    console.log('Uploading audio file');
    const audioFileName = `speech_${Date.now()}.mp3`;
    const audioBlob = await uploadBuffer(buffer, audioFileName, 'audio/mpeg');
    console.log(`Audio file uploaded, URL: ${audioBlob.url}`);
    console.log('Generating transcription');
    const transcription = await openai.audio.transcriptions.create({
      file: await fetch(audioBlob.url),
      model: "whisper-1",
      response_format: "srt",
      language: "en"
    });

    const transcriptionString = String(transcription);
    console.log("Raw transcription:", transcriptionString);

    const {captions} = parseSrt({input: transcriptionString});

    console.log('Uploading captions file');
    const captionsBuffer = Buffer.from(JSON.stringify(captions, null, 2));
    const captionsBlob = await uploadBuffer(captionsBuffer, `captions_${Date.now()}.json`, 'application/json');
    console.log(`Captions file uploaded, URL: ${captionsBlob.url}`);

    return { 
      audiolink: audioBlob.url, 
      transcriptionPath: captionsBlob.url,
      durationInSeconds
    };
  } catch (error) {
    console.error('Error in createAudio function:', error);
    throw error;
  }
}

// Helper function to convert a ReadableStream to a Buffer
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export function adjustTimings(chunks: ScriptChunk[], totalAudioDuration: number, imageUrls: string[]): SubtitleTiming[] {
  const totalEstimatedDuration = chunks.reduce((sum, chunk) => sum + chunk.estimatedDuration, 0);
  const scalingFactor = totalAudioDuration / totalEstimatedDuration;

  let currentTime = 0;
  return chunks.map((chunk, index) => {
    const adjustedDuration = chunk.estimatedDuration * scalingFactor;
    const timing: SubtitleTiming = {
      text: chunk.text,
      startTime: currentTime,
      duration: adjustedDuration,
      imageUrl: imageUrls[index % imageUrls.length],
    };
    currentTime += adjustedDuration;
    return timing;
  });
}
