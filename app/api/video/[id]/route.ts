import { NextRequest, NextResponse } from 'next/server';
import { getNatsConnection } from '@/lib/utils/nats';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const video = await db.video.findUnique({
      where: { id: Number(id) },
    });

    if (!video || !video.videoLink) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Extract the filename from the videoLink
    const filename = video.videoLink.split('/').pop();

    if (!filename) {
      return NextResponse.json({ error: 'Invalid video link' }, { status: 400 });
    }

    const nc = await getNatsConnection();
    const js = nc.jetstream();

    // Access the object store
    const os = await js.views.os('VIDEO_OBJECTS');

    // Get the video data
    const result = await os.get(filename);

    if (!result) {
      return NextResponse.json({ error: 'Video not found in NATS' }, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'video/mp4');
    headers.set('Content-Disposition', `inline; filename="${filename}"`);

    // result.data should be a Uint8Array containing the video data
    return new NextResponse(result.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error retrieving video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}