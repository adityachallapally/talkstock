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
    const response = await fetch(
      `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(term)}&per_page=1&orientation=vertical`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Pixabay');
    }

    const data = await response.json() as PixabayResponse;
    
    if (data.hits.length === 0) {
      return null;
    }

    // Try to get the large version first, fall back to medium if not available
    const video = data.hits[0];
    if (video.videos.large && video.videos.large.url) {
      return video.videos.large.url;
    } else if (video.videos.medium && video.videos.medium.url) {
      return video.videos.medium.url;
    }

    return null;
  } catch (error) {
    console.error('Error fetching from Pixabay:', error);
    return null;
  }
}; 