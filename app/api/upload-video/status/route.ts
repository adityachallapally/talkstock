import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const requestStart = Date.now();
  console.log(`🔍 [upload-video/status] Request received at ${new Date().toISOString()}`);
  
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      console.error(`❌ [upload-video/status] No URL provided`);
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }
    
    console.log(`🔍 [upload-video/status] Checking for video with URL: ${url}`);
    
    // Find the video in the database by URL
    const video = await db.video.findFirst({
      where: {
        videoLink: url
      }
    });
    
    if (video) {
      console.log(`✅ [upload-video/status] Found video record with ID: ${video.id}`);
      return NextResponse.json({ 
        id: video.id,
        found: true,
        processingTime: (Date.now() - requestStart) / 1000
      });
    } else {
      console.log(`⚠️ [upload-video/status] No video record found for URL: ${url}`);
      return NextResponse.json({ 
        found: false,
        processingTime: (Date.now() - requestStart) / 1000
      });
    }
    
  } catch (error) {
    const errorDuration = (Date.now() - requestStart) / 1000;
    console.error(`❌ [upload-video/status] Error after ${errorDuration.toFixed(2)}s:`, error);
    return NextResponse.json({ 
      error: 'Status check failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      processingTime: errorDuration
    }, { status: 500 });
  }
}