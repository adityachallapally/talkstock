interface PixabayVideo {
  videos: {
    large: {
      url: string;
      width: number;
      height: number;
      size: number;
      thumbnail: string;
    };
    medium: {
      url: string;
      width: number;
      height: number;
      size: number;
      thumbnail: string;
    };
    small: {
      url: string;
      width: number;
      height: number;
      size: number;
      thumbnail: string;
    };
    tiny: {
      url: string;
      width: number;
      height: number;
      size: number;
      thumbnail: string;
    };
  };
}

interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: Array<PixabayVideo>;
}

const PIXABAY_API_KEY = '48835560-4f5000e4ba7f076501e1b0357';

export const getFirstPixabayVideoUrl = async (term: string): Promise<string | null> => {
  try {
    const apiUrl = `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(term)}&orientation=vertical&safesearch=true`;
    console.log('Fetching from Pixabay:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pixabay API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Pixabay API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as PixabayResponse;
    console.log('Pixabay response:', {
      total: data.total,
      totalHits: data.totalHits,
      hasHits: data.hits.length > 0
    });
    
    if (data.hits.length === 0) {
      console.log('No videos found for term:', term);
      return null;
    }

    // Try to get the large version first, fall back to medium if not available
    const video = data.hits[0];
    let videoUrl = null;
    
    if (video.videos.large && video.videos.large.url) {
      videoUrl = video.videos.large.url;
      console.log('Using large video:', videoUrl);
    } else if (video.videos.medium && video.videos.medium.url) {
      videoUrl = video.videos.medium.url;
      console.log('Using medium video:', videoUrl);
    }

    return videoUrl;
  } catch (error) {
    console.error('Error fetching from Pixabay:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      term
    });
    throw error; // Re-throw to let the API handle the error
  }
}; 