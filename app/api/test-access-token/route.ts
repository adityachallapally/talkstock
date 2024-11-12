import { NextResponse } from 'next/server';
import { refreshYoutubeToken } from '@/lib/utils/refreshYoutubeToken';

export async function GET() {
  const userId = 'cm2gpykby0000r4rupbut8ud2';

  try {
    const newAccessToken = await refreshYoutubeToken(userId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'YouTube token refreshed successfully',
      accessToken: newAccessToken 
    }, { status: 200 });

  } catch (error) {
    console.error('Error in test-access-token route:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
}