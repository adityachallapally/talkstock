import { NextResponse } from 'next/server';
import { getFirstPixabayVideoUrl } from '@/lib/services/pixabay';

export async function GET(request: Request) {
  try {
    const testWords = ['business', 'technology', 'success', 'professional'];
    const randomWord = testWords[Math.floor(Math.random() * testWords.length)];
    
    const videoUrl = await getFirstPixabayVideoUrl(randomWord);
    
    return NextResponse.json({ 
      success: true,
      searchTerm: randomWord,
      videoUrl 
    });
  } catch (error) {
    console.error('Error testing Pixabay:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 