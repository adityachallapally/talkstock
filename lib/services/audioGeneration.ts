import OpenAI from "openai";
import fs from 'fs';
import { uploadFile } from '../utils/file';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function createAudio(script: string) {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: script,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `speech_${Date.now()}.mp3`;
    const tempFilePath = `./temp/${fileName}`;
    fs.writeFileSync(tempFilePath, buffer);

    const blob = await uploadFile(tempFilePath);
    fs.unlinkSync(tempFilePath);

    return blob.url;
  } catch (error) {
    console.error('Error creating audio:', error);
    throw error;
  }
}