import { cronRender } from '@/lib/cronRender';
import { NextRequest, NextResponse } from 'next/server';
import { CompositionProps } from '@/types/constants';
import { z } from "zod";
import { createremotionVideo } from '@/lib/videoActions';
import { db } from '@/lib/db';
import { uploadVideo } from '@/lib/youtube';
import { refreshYoutubeToken } from '@/lib/utils/refreshYoutubeToken';

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
  console.log("Cron job handler started");

  try {
    const now = new Date();
    // Fetch series that need videos created based on nextPostDate
    const seriesToProcess = await db.series.findMany({
      where: {
        nextPostDate: {
          lte: now, // Process series where nextPostDate is today or in the past
        },
      },
    });

    console.log(`Found ${seriesToProcess.length} series to process`);

    for (const series of seriesToProcess) {
      const formData = new FormData();
      formData.append('topic', series.topic);
      const videoData = await createremotionVideo(formData);

      const inputProps: z.infer<typeof CompositionProps> = {
        audioSrc: videoData.audioSrc,
        images: videoData.imageUrls,
        subtitlesSrc: videoData.transcriptionSrc,
        durationInFrames: videoData.durationInFrames,
      };

      const videoUrl = await cronRender(inputProps);
      console.log("Video rendered successfully. URL:", videoUrl);

      // Refresh the YouTube access token
      console.log('Updated account:', series.accountId);
      await refreshYoutubeToken(series.accountId);

      // Fetch the updated account information
      const updatedAccount = await db.account.findUnique({
        where: { id: series.accountId }
      });


      if (!updatedAccount) {
        throw new Error(`No account found for series ${series.id}`);
      }

      // Upload video to YouTube using the updated access token
      const uploadResult = await uploadVideo({
        accountId: updatedAccount.id,
        title: `${series.topic} - ${new Date().toLocaleDateString()}`,
        description: `Auto-generated video for ${series.topic}`,
        s3Url: videoUrl, //'https://s3.us-east-1.amazonaws.com/remotionlambda-useast1-gwr1cy06ki/renders/t6hfx1c2s3/out.mp4',
        privacyStatus: 'private' // You can change this as needed
      });

      console.log("Video uploaded to YouTube. Video ID:", uploadResult.id);

      // Update series dates
      await db.series.update({
        where: { id: series.id },
        data: {
          lastPostedDate: now,
          nextPostDate: calculateNextPostDate(series.frequency, now),
        },
      });
    }

    // Add a success response
    return NextResponse.json({ message: 'Cron job completed successfully' }, { status: 200 });
  }
  catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: 'Cron job failed', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function calculateNextPostDate(frequency: string, fromDate: Date): Date {
  const nextDate = new Date(fromDate);
  switch (frequency.toLowerCase()) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
  return nextDate;
}
