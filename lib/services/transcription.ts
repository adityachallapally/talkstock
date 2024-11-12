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


export const processVideo = async (fullPath, entry, directory) => {
    let shouldRemoveTempDirectory = false;
    if (!existsSync(path.join(process.cwd(), 'temp'))) {
        mkdirSync(`temp`);
        shouldRemoveTempDirectory = true;
    }
    console.log('Extracting audio from file', entry);

    const tempWavFileName = entry.split('.')[0] + '.wav';
    const tempOutFilePath = path.join(process.cwd(), `temp/${tempWavFileName}`);

    extractToTempAudioFile(fullPath, tempOutFilePath);
    const transcriptionPath = await subFile(
        tempOutFilePath,
        tempWavFileName,
        path.relative('public', directory),
    );
    if (shouldRemoveTempDirectory) {
        rmSync(path.join(process.cwd(), 'temp'), {recursive: true});
    }
    return transcriptionPath;
};

export const initializeWhisper = async () => {
    await installWhisperCpp({to: WHISPER_PATH, version: WHISPER_VERSION});
    await downloadWhisperModel({folder: WHISPER_PATH, model: WHISPER_MODEL});
};