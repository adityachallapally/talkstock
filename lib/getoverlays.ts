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
  type: 'BULLET_LIST' | 'WORD_SWAP' | 'NUMBER_HIGHLIGHT';
  videoKeyword: string;
  items: Array<{ text: string; timestampMs: number }>;
}

// Initialize Anthropic client
const anthropic = new Anthropic({ apiKey: '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', dangerouslyAllowBrowser: true });

// Pexels client
const pexelsClient = createClient('V4GUX2DiZafEDUKHToyAhpJM2LD18BpU3WdkCvsi4TMX8BTSOH35wQJX');

const getOverlayStructure = async (captions: Caption[]): Promise<OverlaySection[]> => {
  const prompt = `
  <role>You are a JSON generator. Only output valid JSON without any additional text, markdown, or explanations. Do not include any notes or commentary.</role>

  <task>Analyze these timestamped captions and return a JSON object with 2-3 overlay sections.</task>

  <rules>
  - No overlays should appear before 10000ms (10 seconds)
  - Each overlay must specify a "type": either "BULLET_LIST", "WORD_SWAP", or "NUMBER_HIGHLIGHT"
    * BULLET_LIST: 2-3 items of 3-4 words each, displayed as a growing list
    * WORD_SWAP: 2 items of 1-2 words each, where each item replaces the previous
    * NUMBER_HIGHLIGHT: 1 item only, where the title is a number/percentage/ratio (e.g. "90%" or "1 in 4") and the item continues the sentence from the title
  - Each overlay title must be 1-2 words only (except for NUMBER_HIGHLIGHT which can be a numerical expression)
  - Each item must follow the word count rules based on its type
  - Use the exact timing from the transcript
  - Each item must appear at a specific timestamp based on when that content appears in the transcript
  - Each overlay section should remain visible for at least 2 seconds after its last item appears
  - Each overlay should last a maximum of 20 seconds
  - IMPORTANT: Each bullet point should appear at least 2 seconds after the previous one
  </rules>

  <output_format>
  Return a JSON object in this exact format:
  {
    "sections": [
      {
        "startMs": number,
        "endMs": number,
        "title": "1-2 words or numerical expression",
        "type": "BULLET_LIST" or "WORD_SWAP" or "NUMBER_HIGHLIGHT",
        "videoKeyword": "single word",
        "items": [
          { "text": "text following type rules", "timestampMs": number },
          { "text": "text following type rules", "timestampMs": number }
        ]
      }
    ]
  }
  </output_format>

  <notes>
  - timestampMs should be the exact millisecond when the item should appear
  - endMs should be at least 5000ms after the last item's timestampMs
  </notes>

  <examples>
  NUMBER_HIGHLIGHT example:
  {
    "sections": [
      {
        "startMs": 12000,
        "endMs": 17000,
        "title": "73%",
        "type": "NUMBER_HIGHLIGHT",
        "videoKeyword": "business",
        "items": [
          { "text": "of companies increased AI spending in 2023", "timestampMs": 12000 }
        ]
      }
    ]
  }

  BULLET_LIST example:
  {
    "sections": [
      {
        "startMs": 14440,
        "endMs": 23440,
        "title": "Key Steps",
        "type": "BULLET_LIST",
        "videoKeyword": "office",
        "items": [
          { "text": "Analyze Current Market Trends", "timestampMs": 14440 },
          { "text": "Develop Strategic Action Plan", "timestampMs": 16440 },
          { "text": "Implement New Technologies Fast", "timestampMs": 18440 }
        ]
      }
    ]
  }

  WORD_SWAP example:
  {
    "sections": [
      {
        "startMs": 35400,
        "endMs": 41520,
        "title": "We Build",
        "type": "WORD_SWAP",
        "videoKeyword": "construction",
        "items": [
          { "text": "Better Systems", "timestampMs": 35400 },
          { "text": "Strong Teams", "timestampMs": 37400 }
        ]
      }
    ]
  }
  </examples>

  <learning_example>
  Here's an example of a transcript and its ideal overlays to learn from, specifically learn what types of overlays to use where and for what points:
  
  <transcript>
  ${JSON.stringify(await fetch('captions_AI_infra.json').then(r => r.json()))}
  </transcript>

  <corresponding_overlays>
  {
    "sections": [
      {
        "startMs": 9440,
        "endMs": 14440,
        "title": "1 in 4",
        "type": "NUMBER_HIGHLIGHT",
        "videoKeyword": "organizations",
        "items": [
          { "text": "Organizations building custom GenAI models", "timestampMs": 9440 }
        ]
      }
    ]
  }
  </corresponding_overlays>
  </learning_example>

  <input_transcript>
  Now analyze this new transcript and generate overlay sections following both the example and the rules above:
  ${JSON.stringify(captions)}
  </input_transcript>`;

  const message = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    system: "You are a JSON generator. Only output valid JSON without any additional text, markdown, or explanations. Do not include any notes or commentary.",
    messages: [
      {
        role: 'user',
        content: prompt,
      },
      {
        role: "assistant", 
      content: "Here's the JSON object with the overlay sections: {",
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
        type: {
          'BULLET_LIST': TemplateType.TITLE_BULLETS,
          'WORD_SWAP': TemplateType.TITLE_SWAP,
          'NUMBER_HIGHLIGHT': TemplateType.NUMBER_HIGHLIGHT
        }[section.type],
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