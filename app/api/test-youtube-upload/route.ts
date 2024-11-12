import { NextResponse } from 'next/server'
import { uploadVideo } from '@/lib/youtube'
import { refreshYoutubeToken } from '@/lib/utils/refreshYoutubeToken'
import { db } from '@/lib/db'

const SPECIFIC_CHANNEL_ID = 'UCTKjVoWrJ8HW-9c95a9FARw'

export async function POST() {
  try {
    // Find the first series and its associated account
    const series = await db.series.findFirst({
      include: {
        account: {
          include: {
            channels: true
          }
        }
      }
    })

    if (!series || !series.account) {
      return NextResponse.json({ error: 'No series or account found' }, { status: 404 })
    }

    const account = series.account
    console.log('Found account:', account)

    refreshYoutubeToken(account.id)

    // Test video details
    const testVideoDetails = {
      accountId: account.id,
      title: 'Test Upload Video',
      description: 'This is a test upload for debugging purposes',
      s3Url: 'https://remotionlambda-useast1-gwr1cy06ki.s3.amazonaws.com/renders/0xqqkakv2r/out.mp4',
      privacyStatus: 'private',
    }

    const result = await uploadVideo(testVideoDetails)
    console.log('Video upload result:', result)

    return NextResponse.json({ message: 'Video uploaded successfully', result })
  } catch (error) {
    console.error('Error in testYoutubeUpload:', error)
    return NextResponse.json({ error: 'Error uploading video', message: error.message }, { status: 500 })
  }
}
