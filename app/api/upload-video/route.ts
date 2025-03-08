import { NextResponse } from 'next/server'
import { put, PutBlobResult } from '@vercel/blob'
import { db } from '@/lib/db'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

// This endpoint handles both client-side upload token generation and upload completion
export async function POST(request: Request) {
  const requestStart = Date.now();
  console.log(`🔍 [upload-video] API request received at ${new Date().toISOString()}`);
  
  try {
    // Handle client-side upload requests from @vercel/blob/client
    const body = await request.json() as HandleUploadBody;
    
    // Process the client upload request using the Vercel Blob client handler
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Generate a client token for the browser to upload the file
        console.log(`🔑 [upload-video] Generating token for ${pathname}`);
        
        return {
          allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
          tokenPayload: JSON.stringify({
            pathname
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This callback is called when the upload is complete
        // Note: This won't work on localhost, only in production or with a tunneling service
        console.log(`✅ [upload-video] Client upload completed for ${blob.pathname}`);
        
        try {
          // Extract filename from pathname
          const filename = blob.pathname.split('/').pop() || 'uploaded-video';
          
          // Create a record in the database with required fields
          const video = await db.video.create({
            data: {
              title: filename,
              videoLink: blob.url,
              script: 'Uploaded video', // Required field
              audioSrc: blob.url, // Using the same URL for audio source
              imageUrls: [blob.url], // Using the video URL as the image
              transcriptionSrc: '', // Required field
              caption: 'Uploaded video', // Required field
              durationInFrames: 0,
              postStatus: 'PROCESSING'
            }
          });
          
          console.log(`✅ [upload-video] Database record created for ${blob.url}`);
        } catch (error) {
          console.error(`❌ [upload-video] Error in onUploadCompleted:`, error);
        }
      },
    });
    
    return NextResponse.json(jsonResponse);
  } catch (error) {
    const errorDuration = (Date.now() - requestStart) / 1000;
    console.error(`❌ [upload-video] Error after ${errorDuration.toFixed(2)}s:`, error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      processingTime: errorDuration
    }, { status: 500 });
  }
}