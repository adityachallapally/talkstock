// Import necessary types if needed
import { OverlayConfig } from '@/types/constants';
import { createClient } from 'pexels';

// Define the async function
const generateOverlays = async (): Promise<OverlayConfig[]> => {

    return [
      {
        startFrame: 480,
        duration: 240,
        title: 'Overlay',
        videoSrc: await getFirstMp4VideoUrl('Interface'),
        items: [
          { text: 'Text for overlay 1', delay: 0 },
        ],
      },
      {
        startFrame: 16,
        duration: 8,
        title: 'Overlay',
        videoSrc: await getFirstMp4VideoUrl('Population'),
        items: [
          { text: 'Text for overlay 2', delay: 0 },
          { text: 'Text for overlay 1', delay: 5 },

        ],
      },
    ];
};

// Create client for Pexels API
const client = createClient('V4GUX2DiZafEDUKHToyAhpJM2LD18BpU3WdkCvsi4TMX8BTSOH35wQJX');

// Function to get the first .mp4 video URL for a given search term
const getFirstMp4VideoUrl = async (term: string): Promise<string | null> => {
    const query = term;
    try { 
        const response = await client.videos.search({ query, per_page: 1 });
        const video = response.videos[0];
        if (video) {
            const mp4File = video.video_files.find(file => file.file_type === 'video/mp4');
            return mp4File ? mp4File.link : null;
        }
        return null;
    } catch (error) {
        console.error('Error fetching videos:', error);
        return null;
    }
};

// Export the function for use in other modules
export default generateOverlays;

//create function for logic on what to search for in stock videos

//create function to get text for each overlay

//create function to get timing for each overlay and duration