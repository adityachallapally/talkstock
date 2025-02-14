import { createClient, Videos } from 'pexels';
import { getFirstPixabayVideoUrl } from './pixabay';

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
      return mp4File?.link || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching videos from Pexels:', error);
    return null;
  }
};

export interface ProviderVideo {
  provider: string;
  videoUrl: string | null;
}

export const getAllProviderVideos = async (term: string): Promise<ProviderVideo[]> => {
  const providers = [
    { name: 'Pexels', getVideo: getFirstPexelsVideoUrl },
    { name: 'Pixabay', getVideo: getFirstPixabayVideoUrl },
    // Add more providers here
  ];

  const results = await Promise.all(
    providers.map(async (provider) => {
      const videoUrl = await provider.getVideo(term);
      return {
        provider: provider.name,
        videoUrl
      };
    })
  );

  return results.filter(result => result.videoUrl !== null);
}; 