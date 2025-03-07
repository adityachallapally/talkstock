// transcription.ts

import {execSync} from 'node:child_process';
import {
    existsSync,
    rmSync,
    writeFileSync,
    mkdirSync,
} from 'node:fs';
import path from 'path';
import {
    WHISPER_LANG,
    WHISPER_MODEL,
    WHISPER_PATH,
    WHISPER_VERSION,
} from './whisper-config.mjs';
import {
    convertToCaptions,
    downloadWhisperModel,
    installWhisperCpp,
    transcribe,
} from '@remotion/install-whisper-cpp';
import { openai } from '@/lib/openai';
import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';

const extractToTempAudioFile = (fileToTranscribe, tempOutFile) => {
    execSync(
        `npx remotion ffmpeg -i ${fileToTranscribe} -ar 16000 ${tempOutFile} -y`,
        {stdio: ['ignore', 'inherit']},
    );
};

import { promises as fs } from 'fs';

const subFile = async (filePath, fileName, folder) => {
    const outPath = path.join(
        process.cwd(),
        'public',
        folder,
        fileName.replace('.wav', '.json')
    );

    try {
        console.log('Starting transcription with Whisper');
        const result = await transcribe({
            inputPath: filePath,
            model: WHISPER_MODEL,
            tokenLevelTimestamps: true,
            whisperPath: WHISPER_PATH,
            whisperCppVersion: WHISPER_VERSION,
            printOutput: true, // Set this to true to see more output
            translateToEnglish: false,
            language: WHISPER_LANG,
        });
        console.log('Transcription completed successfully');

        console.log('Converting transcription to captions');
        const { captions } = convertToCaptions({
            transcription: result.transcription,
            combineTokensWithinMilliseconds: 200,
        });

        const outputData = JSON.stringify({
            ...result,
            transcription: captions,
        }, null, 2);

        console.log('Ensuring output directory exists');
        const outputDir = path.dirname(outPath.replace('webcam', 'subs'));
        await fs.mkdir(outputDir, { recursive: true });

        console.log('Writing transcription to file');
        await fs.writeFile(outPath.replace('webcam', 'subs'), outputData, 'utf8');
        console.log('Transcription file written successfully');

        return outPath.replace('webcam', 'subs');
    } catch (error) {
        console.error('Error in subFile function:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        if ('stdout' in error) {
            console.error('Stdout:', error.stdout);
        }
        if ('stderr' in error) {
            console.error('Stderr:', error.stderr);
        }
        throw error;
    }
};

export async function processVideo(
  filePath: string,
  fileName: string,
  outputDir: string
): Promise<string> {
  try {
    console.log('Reading file:', filePath);
    const fileBuffer = await readFile(filePath);
    
    console.log('Generating transcription...');
    const transcription = await openai.audio.transcriptions.create({
      file: new File([fileBuffer], fileName, { type: 'video/mp4' }),
      model: "whisper-1",
      response_format: "srt",
      language: "en"
    });

    const transcriptionString = String(transcription);
    console.log("Raw transcription:", transcriptionString);

    const { captions } = parseSrt({ input: transcriptionString });

    console.log('Uploading captions file');
    const captionsBuffer = Buffer.from(JSON.stringify({ transcription: captions }, null, 2));
    const captionsBlob = await put(`${outputDir}/captions_${Date.now()}.json`, captionsBuffer, {
      access: 'public',
      contentType: 'application/json'
    });

    console.log(`Captions file uploaded to: ${captionsBlob.url}`);
    return captionsBlob.url;

  } catch (error) {
    console.error('Error in processVideo:', error);
    throw error;
  }
}

interface SrtCaption {
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
  timestampMs: number;
}

interface SrtParseResult {
  captions: SrtCaption[];
}

function parseSrt({ input }: { input: string }): SrtParseResult {
  const captions: SrtCaption[] = [];
  const blocks = input.trim().split('\n\n');

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;

    // Parse timecode
    const timecode = lines[1];
    const [start, end] = timecode.split(' --> ').map(timeToMs);
    
    // Join remaining lines as text
    const text = lines.slice(2).join(' ');

    if (start !== null && end !== null) {
      captions.push({
        text,
        startMs: start,
        endMs: end,
        confidence: 1, // Whisper doesn't provide confidence scores
        timestampMs: start + ((end - start) / 2) // Calculate middle point
      });
    }
  }

  return { captions };
}

function timeToMs(timeStr: string): number {
  const [time, ms] = timeStr.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + Number(ms);
}

export const initializeWhisper = async () => {
    await installWhisperCpp({to: WHISPER_PATH, version: WHISPER_VERSION});
    await downloadWhisperModel({folder: WHISPER_PATH, model: WHISPER_MODEL});
};