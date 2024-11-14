import { OverlayConfig } from '@/types/constants';
import { createClient } from 'pexels';
import Anthropic from '@anthropic-ai/sdk';
import { TemplateType } from '@/types/types';

// Types for our content structure
interface ContentSection {
  transcriptSegment: {
    startTime: number;
    endTime: number;
    text: string;
  };
  title: string;
  items: string[];
  videoKeyword: string;
}

interface TimingSection {
  startFrame: number;
  duration: number;
  title: string;
  videoKeyword: string;
  items: Array<{ text: string; frame: number }>;
}

interface Caption {
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
  timestampMs: number;
}

interface OverlaySection {
  startMs: number;
  endMs: number;
  title: string;
  videoKeyword: string;
  items: Array<{ text: string; timestampMs: number }>;
}

// Initialize Anthropic client
const anthropic = new Anthropic({apiKey: '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', dangerouslyAllowBrowser: true });

// Pexels client
const pexelsClient = createClient('V4GUX2DiZafEDUKHToyAhpJM2LD18BpU3WdkCvsi4TMX8BTSOH35wQJX');

const getOverlayStructure = async (captions: Caption[]): Promise<OverlaySection[]> => {
  const prompt = `
  You are a JSON generator. Only output valid JSON without any additional text, markdown, or explanations. Do not include any notes or commentary.
  Analyze these timestamped captions and return a JSON object with 2-3 overlay sections.
  Rules:
  - No overlays should appear before 10000ms (10 seconds)
  - Each overlay title must be 1-2 words only
  - Each overlay must have 2-3 items (bullet points)
  - Each item must be 3-4 words only
  - Use the exact timing from the transcript
  - Each item should appear at a specific timestamp based on when that content appears in the transcript
  - Each overlay section should remain visible for at least 2 seconds after its last item appears
  - IMPORTANT: Leave at least 20 seconds between overlay sections to show the speaker
  - IMPORTANT: Each bullet point should appear at least 3 seconds after the previous one
  
  Return a JSON object in this exact format:
  {
    "sections": [
      {
        "startMs": number,
        "endMs": number,
        "title": "1-2 words",
        "videoKeyword": "single word",
        "items": [
          { "text": "3-4 words only", "timestampMs": number },
          { "text": "3-4 words only", "timestampMs": number }
        ]
      }
    ]
  }

  Note: 
  - timestampMs should be the exact millisecond when the item should appear
  - endMs should be at least 5000ms after the last item's timestampMs to allow reading time
  - Ensure at least 3000ms between each item's timestampMs within a section
  - Ensure at least 20000ms between each section's endMs and the next section's startMs
  
  Input captions:
  ${JSON.stringify(captions)}`;
  
  const message = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      }
    ],
  });

  const cleanResponse = message.content[0].text.replace(/```json\n?|\n?```/g, '') || '[]';
  console.log('Overlay Structure Response:', cleanResponse);
  return JSON.parse(cleanResponse).sections;
};

const getFirstMp4VideoUrl = async (term: string): Promise<string | null> => {
  try { 
    const response = await pexelsClient.videos.search({ query: term, per_page: 1 });
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

export const VIDEO_FPS = 30;

const generateOverlays = async (transcriptUrl: string): Promise<OverlayConfig[]> => {
  try {
    const response = await fetch(transcriptUrl);
    const captions = await response.json();
    console.log('Fetched Captions:', captions);
    
    const overlayStructure = await getOverlayStructure(captions);
    console.log('Processed Overlay Structure:', overlayStructure);
    
    // Transform into final overlay config with frame conversion
    const overlays: OverlayConfig[] = await Promise.all(
      overlayStructure.map(async (section) => ({
        startFrame: Math.round((section.startMs / 1000) * VIDEO_FPS),
        duration: Math.round(((section.endMs - section.startMs) / 1000) * VIDEO_FPS),
        title: section.title,
        videoSrc: await getFirstMp4VideoUrl(section.videoKeyword),
        type: TemplateType.TITLE_BULLETS,
        items: section.items.map(item => ({
          text: item.text,
          delay: Math.round((item.timestampMs / 1000) * VIDEO_FPS) - Math.round((section.startMs / 1000) * VIDEO_FPS)
        }))
      }))
    );
    
    console.log('Final Overlays:', overlays);
    return overlays;

  } catch (error) {
    console.error('Error generating overlays:', error);
    return [];
  }
};

export default generateOverlays;