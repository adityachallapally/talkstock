import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  const requestStart = Date.now();
  console.log(`🔍 [upload-video] API request received at ${new Date().toISOString()}`);
  
  try {
    console.log(`🔍 [upload-video] Parsing form data...`);
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.error(`❌ [upload-video] No file provided in request`);
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    console.log(`📊 [upload-video] Received file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);

    // Start measuring Vercel Blob upload time
    console.log(`🚀 [upload-video] Starting Vercel Blob upload at ${new Date().toISOString()}`);
    const blobUploadStart = Date.now();
    
    try {
      // Upload to Vercel Blob
      const blob = await put(file.name, file, {
        access: 'public',
      });
      
      const blobUploadDuration = (Date.now() - blobUploadStart) / 1000;
      console.log(`✅ [upload-video] Vercel Blob upload completed in ${blobUploadDuration.toFixed(2)}s`);
      console.log(`🔗 [upload-video] File URL: ${blob.url}`);

      // Start measuring database operation time
      console.log(`💾 [upload-video] Creating database record at ${new Date().toISOString()}`);
      const dbOperationStart = Date.now();
      
      // Create a record in the database with required fields
      const video = await db.video.create({
        data: {
          title: file.name,
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
      
      const dbOperationDuration = (Date.now() - dbOperationStart) / 1000;
      console.log(`✅ [upload-video] Database record created in ${dbOperationDuration.toFixed(2)}s`);
      
      const totalDuration = (Date.now() - requestStart) / 1000;
      console.log(`🏁 [upload-video] Total request processed in ${totalDuration.toFixed(2)}s`);
      
      return NextResponse.json({ 
        id: video.id, 
        url: blob.url,
        processingTime: {
          total: totalDuration,
          blobUpload: blobUploadDuration,
          dbOperation: dbOperationDuration
        }
      });
      
    } catch (blobError) {
      console.error(`❌ [upload-video] Vercel Blob upload failed after ${((Date.now() - blobUploadStart) / 1000).toFixed(2)}s:`, blobError);
      throw blobError; // Re-throw to be caught by the outer catch block
    }
    
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