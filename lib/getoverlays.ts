import { OverlayConfig } from '@/types/constants';
import { createClient } from 'pexels';
import OpenAI from 'openai';

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

// Initialize OpenAI client
const openai = new OpenAI({apiKey: 'sk-proj-Sy6rgxlHbMxObrHvOG3AT3BlbkFJbPOHqYpFQwCqR9vvCCOI', dangerouslyAllowBrowser: true});

// Pexels client
const pexelsClient = createClient('V4GUX2DiZafEDUKHToyAhpJM2LD18BpU3WdkCvsi4TMX8BTSOH35wQJX');

const getContentStructure = async (captions: any[]): Promise<ContentSection[]> => {
  const prompt = `Analyze these timestamped captions and return only a JSON object with a "sections" array. 
  Use the timing information (startMs, endMs) to create natural segments. Each section should have: 
  transcriptSegment (including startTime, endTime, text), title, items (array of key points), 
  and videoKeyword (for visual representation). Return raw JSON with no markdown formatting:

${JSON.stringify(captions)}`;
  
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4-turbo-preview",
  });

  // Clean up the response by removing markdown code block syntax
  const cleanResponse = completion.choices[0].message.content?.replace(/```json\n?|\n?```/g, '') || '[]';
  console.log('Content Structure Response:', cleanResponse);
  return JSON.parse(cleanResponse).sections;
};

const getTimingStructure = async (contentSections: ContentSection[]): Promise<TimingSection[]> => {
  const prompt = `Convert this content structure to frame-based timing. Return only a JSON object with a "sections" array. Each section needs: startFrame, duration, title, videoKeyword, and items (array of {text, frame}). Use 30fps. No explanations:

${JSON.stringify(contentSections)}`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4-turbo-preview",
  });

  // Clean up the response by removing markdown code block syntax
  const cleanResponse = completion.choices[0].message.content?.replace(/```json\n?|\n?```/g, '') || '[]';
  console.log('Timing Structure Response:', cleanResponse);
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

const generateOverlays = async (transcriptUrl: string): Promise<OverlayConfig[]> => {
  try {
    // Fetch the transcript content as JSON
    const response = await fetch(transcriptUrl);
    const captions = await response.json();
    console.log('Fetched Captions:', captions);
    
    // Step 1: Get content structure
    const contentSections = await getContentStructure(captions);
    console.log('Processed Content Sections:', contentSections);
    
    // Step 2: Get timing structure
    const timingSections = await getTimingStructure(contentSections);
    console.log('Processed Timing Sections:', timingSections);
    
    // Step 3: Transform into final overlay config
    const overlays: OverlayConfig[] = await Promise.all(
      timingSections.map(async (section) => ({
        startFrame: section.startFrame,
        duration: section.duration,
        title: section.title,
        videoSrc: await getFirstMp4VideoUrl(section.videoKeyword),
        items: section.items.map(item => ({
          text: item.text,
          delay: item.frame - section.startFrame // Convert absolute frames to relative delay
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