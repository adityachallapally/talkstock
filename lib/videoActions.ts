"use server";
import { z } from 'zod';
import * as fs from 'fs';
import { db } from '@/lib/db';
import { VideoSchema } from '@/lib/schemas';
import { createScript, createAudio, adjustTimings, ScriptChunk, SubtitleTiming } from '@/lib/services/scriptGeneration';
import { generateImagesForScript, ImageSection } from '@/lib/services/imageGeneration';
import { VideoData } from '@/lib/schemas';
import { VIDEO_FPS } from '@/types/constants';

const VoiceEnum = z.enum(["Echo", "Alloy", "Onyx", "Fable"]);

const DurationEnum = z.enum(["30-60", "60-90"]);

enum VideoLength {
  Thirty = 10,
  Sixty = 20,
  Ninety = 30
}


export async function updateVideo({ id, title, caption, script, oldScript }: {
  id: number,
  title: string,
  caption: string,
  script: string,
  oldScript: string
}) {
  try {
    let updateData: any = { title, caption, script };

    // if (script !== oldScript) {
    //   const audioLink = await createAudio(script);
    //   updateData.audioLink = audioLink;

    //   const video = await db.video.findUnique({
    //     where: { id },
    //     select: { imagesLink: true }
    //   });

    //   if (!video) {
    //     throw new Error('Video not found');
    //   }

    //   const imageUrls = video.imagesLink.split(',');
    //   //const videoBuffer = await renderVideo(audioLink, imageUrls, script);

    //   // TODO: Upload videoBuffer to your storage service and get the URL
    //   // For now, we'll use a placeholder
    //   updateData.videoLink = 'placeholder_video_url';
    // }

    const updatedVideo = await db.video.update({
      where: { id },
      data: updateData,
    });

    return updatedVideo;
  } catch (error) {
    console.error('Error updating video:', error);
    throw error;
  }
}

export async function getVideo(id: number): Promise<VideoData | null> {
  try {
    const video = await db.video.findUnique({
      where: { id },
      select: {
        id: true,
        script: true,
        audioSrc: true,
        imageUrls: true,
        transcriptionSrc: true,
        title: true,
        caption: true,
        videoLink: true,
        seriesId: true,
        createdAt: true,
        postedAt: true,
        postStatus: true,
        durationInFrames: true,
      },
    });

    if (!video) {
      return null;
    }

    return video as VideoData;
  } catch (error) {
    console.error('Error fetching video:', error);
    throw error;
  }
}

// Add this function at the top of your file or in a suitable location
function splitScriptIntoSections(script: string, sectionCount: number = 10): string[] {
  const words = script.split(' ');
  const wordsPerSection = Math.ceil(words.length / sectionCount);
  const sections: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerSection) {
    sections.push(words.slice(i, i + wordsPerSection).join(' '));
  }

  return sections;
}



export async function createremotionVideo(rawData: FormData) {
  console.log("Raw data from the form:", rawData);
  const data = VideoSchema.parse({
    destination: rawData.get('destination') || undefined,
    topic: rawData.get('topic') || undefined,
    voice: rawData.get('voice') || undefined,
    language: rawData.get('language') || undefined,
    duration: rawData.get('duration') || undefined,
  });

  console.log("Processed data with defaults:", data);

  try {
    // Generate script
    const script = await createScript(data.topic);
    console.log("Script created:", script);

    // Split script into sections
    const scriptSections = splitScriptIntoSections(script);

    // Generate audio
    const { audiolink, transcriptionPath, durationInSeconds } = await createAudio(script);
    const durationInFrames = Math.ceil(durationInSeconds * VIDEO_FPS);

    console.log("Duration in frames:", durationInFrames);
    // Generate images
    const videoLength = VideoLength.Thirty; // Adjust based on your needs
    const imagesResult = await generateImagesForScript(data.topic, scriptSections);

    // Save the data to the database
    const video = await db.video.create({
      data: {
        script: script,
        audioSrc: audiolink,
        imageUrls: imagesResult,
        transcriptionSrc: transcriptionPath,
        title: data.topic,
        caption: "A video about " + data.topic,
        videoLink: null, // or "placeholder_video_url" if you prefer
        durationInFrames: durationInFrames
      }
    });

    // Return the data needed for the Remotion Player
    return {
      id: video.id,
      audioSrc: audiolink,
      imageUrls: imagesResult,
      topic: data.topic,
      transcriptionSrc: transcriptionPath,
      durationInFrames: durationInFrames
    };

  } catch (error) {
    console.error("Error in createremotionVideo:", error);
    throw error;
  }
}
