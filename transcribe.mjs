import path from "path";
import fs from "fs/promises";
import { exec } from "child_process";
import { transcribe, convertToCaptions } from "@remotion/install-whisper-cpp";

console.log("Starting transcription process...");

const mp3FilePath = "/home/avasanthc/video-creation/createvideov5/speech_1727309599380.wav";

// Transcribe the WAV file
console.log("Starting transcription...");
const { transcription } = await transcribe({
  inputPath: mp3FilePath,
  whisperPath: path.join(process.cwd(), "whisper.cpp"),
  model: "medium.en",
  tokenLevelTimestamps: true,
});
console.log("Transcription completed.");

// Convert transcription to captions
console.log("Converting transcription to captions...");
const { captions } = convertToCaptions({
  transcription,
  combineTokensWithinMilliseconds: 200,
});
console.log("Captions conversion completed.");

// Create transcript object
console.log("Creating transcript object...");
const transcript = captions.map(line => ({
  text: line.text,
  startInSeconds: line.startInSeconds
}));

// Save transcript to JSON file
const jsonFilePath = mp3FilePath.replace('.wav', '_transcript.json');
console.log(`Saving transcript to JSON file: ${jsonFilePath}`);
await fs.writeFile(jsonFilePath, JSON.stringify(transcript, null, 2));
console.log("Transcript saved to JSON file.");

// Log captions (optional)
console.log("Logging captions:");
for (const line of captions) {
  console.log(`${line.startInSeconds}: ${line.text}`);
}

console.log(`Transcription process completed. JSON file saved at: ${jsonFilePath}`);