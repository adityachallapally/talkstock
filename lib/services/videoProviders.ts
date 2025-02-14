import { createClient, Videos } from 'pexels';

const pexelsClient = createClient('V4GUX2DiZafEDUKHToyAhpJM2LD18BpU3WdkCvsi4TMX8BTSOH35wQJX');

interface VideoFile {
  file_type: string;
  link: string;
}

interface PexelsVideo {
  video_files: VideoFile[];
}

export const getFirstPexelsVideoUrl = async (term: string): Promise<string | null> => {
  try {
    const response = await pexelsClient.videos.search({ query: term, per_page: 1, orientation: 'portrait' }) as Videos;
    const video = response.videos?.[0] as PexelsVideo | undefined;
    if (video?.video_files) {
      const mp4File = video.video_files.find(file => file.file_type === 'video/mp4');
      console.log('Pexels result for term:', term, mp4File?.link || 'No video found');
      return mp4File?.link || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching videos from Pexels:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      term
    });
    // Don't throw, just return null to allow other providers to work
    return null;
  }
};

export interface ProviderVideo {
  provider: string;
  videoUrl: string | null;
}

export const getAllProviderVideos = async (term: string): Promise<ProviderVideo[]> => {
  console.log('Fetching videos for term:', term);
  
  // Only use Pexels provider
  const providers = [
    { name: 'Pexels', getVideo: getFirstPexelsVideoUrl },
  ];

  try {
    const results = await Promise.all(
      providers.map(async (provider) => {
        try {
          const videoUrl = await provider.getVideo(term);
          console.log(`${provider.name} result:`, videoUrl ? 'Found video' : 'No video found');
          return {
            provider: provider.name,
            videoUrl
          };
        } catch (error) {
          console.error(`Error with ${provider.name}:`, error);
          return {
            provider: provider.name,
            videoUrl: null
          };
        }
      })
    );

    // Filter out providers that didn't return a video
    const validResults = results.filter(result => result.videoUrl !== null);
    console.log('Valid provider results:', validResults.length);
    
    return validResults;
  } catch (error) {
    console.error('Error fetching from all providers:', error);
    return []; // Return empty array rather than throwing
  }
}; 