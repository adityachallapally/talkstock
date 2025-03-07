import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    })

    // // Get video duration and convert to frames (assuming 30fps)
    // const arrayBuffer = await file.arrayBuffer()
    // const buffer = Buffer.from(arrayBuffer)
    // const metadata = await getVideoMetadata(buffer)
    
    // // Safely access duration or use a default value
    // const durationInSeconds = (metadata as any).duration || 0
    // const durationInFrames = Math.ceil(durationInSeconds * 30) // 30 fps

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
    })

    return NextResponse.json({ id: video.id, url: blob.url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}