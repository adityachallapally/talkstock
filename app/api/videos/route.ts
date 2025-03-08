import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.videoUrl || !body.durationInFrames) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new video record in database
    const video = await prisma.video.create({
      data: {
        videoUrl: body.videoUrl,
        audioUrl: body.audioUrl || null,
        durationInFrames: body.durationInFrames,
        transcriptionUrl: body.transcriptionUrl || null,
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      // Get a specific video by ID
      const video = await prisma.video.findUnique({
        where: { id },
      });
      
      if (!video) {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(video);
    } else {
      // Get all videos (with pagination)
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const skip = (page - 1) * limit;
      
      const videos = await prisma.video.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      
      const total = await prisma.video.count();
      
      return NextResponse.json({
        videos,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    }
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
} 