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

    // Create a record in the database with required fields
    const video = await db.video.create({
      data: {
        title: file.name,
        videoLink: blob.url,
        script: '', // Required field - empty for uploaded videos
        audioSrc: '', // Required field - empty for uploaded videos
        imageUrls: [], // Required field - empty array for uploaded videos
        transcriptionSrc: '', // Required field - empty for uploaded videos
        caption: '', // Required field - empty for uploaded videos
        postStatus: 'PROCESSING'
      }
    })

    return NextResponse.json({ id: video.id, url: blob.url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}