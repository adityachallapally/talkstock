import { getVideoMetadata as getFFmpegMetadata } from '@remotion/media-utils'

export async function getVideoMetadata(buffer: Buffer) {
  try {
    const blob = new Blob([buffer], { type: 'video/mp4' })
    const url = URL.createObjectURL(blob)
    const metadata = await getFFmpegMetadata(url)
    URL.revokeObjectURL(url)
    return metadata
  } catch (error) {
    console.error('Error getting video metadata:', error)
    throw error
  }
} 