import { OverlayConfig, Caption, PromptResponse } from '@/types/constants';
import { createClient, Videos } from 'pexels';
import Anthropic from '@anthropic-ai/sdk';
import { TemplateType } from '@/types/constants';
import { getAllProviderVideos } from './services/videoProviders';

// Initialize Anthropic client
const anthropic = new Anthropic({ apiKey: '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', dangerouslyAllowBrowser: true });

// Pexels client
const pexelsClient = createClient('V4GUX2DiZafEDUKHToyAhpJM2LD18BpU3WdkCvsi4TMX8BTSOH35wQJX');

const getOverlayStructure = async (captions: Caption[]): Promise<PromptResponse[]> => {
  const promptTemplate = "You are an AI assistant specializing in creating video overlay data based on transcript analysis. Your task is to generate JSON-formatted overlay sections that highlight key points from a video transcript. These overlays will enhance the viewer's understanding and engagement with the video content.\n\nHere is the transcript you need to analyze:\n\n<transcript>\n{{captions}}\n</transcript>\n\nYour goal is to create overlay sections based on this transcript. Each overlay should emphasize important information, statistics, or key ideas presented in the video. You must adhere to the following rules and guidelines:\n\n1. Create 1-2 STOCK_VIDEO overlays per minute of video content. While not mandatory for every section, they add significant value when used appropriatel When using STOCK_VIDEO overlays, try to place them sequentially (2-3 in a row) for a dynamic effect. Each STOCK_VIDEO overlay should last 2-3 seconds.\n3. Create 1-2 other types of overlays (BULLET_LIST, WORD_SWAP, or NUMBER_HIGHLIGHT) per minute of video content.\n4. Ensure all overlays, especially STOCK_VIDEO, are directly relevant to the transcript content at that moment.\n5. No overlays should appear before 5000ms (5 seconds) into the video.\n6. Each overlay must specify a \"type\": either \"BULLET_LIST\", \"WORD_SWAP\", \"NUMBER_HIGHLIGHT\", or \"STOCK_VIDEO\".\n   - BULLET_LIST: 2-3 items of 3-4 words each, displayed as a growing list\n   - WORD_SWAP: 2 items of 1-2 words each, where each item replaces the previous\n   - NUMBER_HIGHLIGHT: 1 item only, where the title is a number/percentage/ratio (e.g. \"90%\" or \"1 in 4\") and the item continues the sentence from the title\n   - STOCK_VIDEO: No items, used for visual representation of concepts\n7. Each overlay title must be 1-2 words only (except for NUMBER_HIGHLIGHT which can be a numerical expression).\n8. Use the exact timing from the transcript for when content appears.\n9. Each overlay section should remain visible for at least 2 seconds after its last item appears.\n10. For BULLET_LIST type, each bullet point should appear at least 2 seconds after the previous one.\n11. Ensure that the person speaking is visible for at least 1/3 of the total video duration.\n12. Focus on creating punchy, insightful, and relevant points that capture the essence of the video content.\n13. Align the start time of each overlay with when the relevant information is first mentioned in the transcript, follow this rule closely to make sure the timing matches up exactly! \n14. The videoKeyword can be 1-2 words and should be business or professional oriented and match the message of the video at that time. \n\nBefore generating the final JSON output, analyze the transcript and plan your overlay sections. Wrap your analysis in <overlay_planning> tags. Wrap the final result in <result> tags. In your analysis:\n\n1. Estimate the video duration based on the transcript timings. Use the last endMs value in the transcript as the total duration.\n2. Break down the transcript into 1-minute segments for easier analysis.\n3. Identify key topics, ideas, and relevant quotes for each segment.\n4. Brainstorm overlay ideas, considering different types (BULLET_LIST, WORD_SWAP, NUMBER_HIGHLIGHT, STOCK_VIDEO).\n5. List out all potential overlay ideas for each segment, including:\n   - Proposed overlay type\n   - Draft title and items (if applicable)\n   - Relevance to the content\n   - For STOCK_VIDEO, describe the visual concept\n6. Create a rough timeline for the overlays, ensuring:\n   - Even distribution throughout the video\n   - Meeting the required frequency (1-2 STOCK_VIDEO and 1-2 other types per minute)\n   - No overlays appear before 5 seconds into the video\n   - STOCK_VIDEO overlays are placed sequentially when used\n7. Finalize overlay selections, considering:\n   - Balance of overlay types\n   - Even distribution across the video duration\n   - Relevance and impact of each overlay\n8. For each selected overlay:\n   - Refine the title and items\n   - Explain why this information is crucial for viewer understanding\n   - For STOCK_VIDEO overlays, refine the visual concept description\n9. Double-check that your plan adheres to all rules and guidelines mentioned earlier.\n10. Review the distribution of overlays to ensure even coverage throughout the video.\n\nAfter your analysis, provide the overlay sections in the following JSON format:\n\n{\n  \"sections\": [\n    {\n      \"startMs\": number,\n      \"endMs\": number,\n      \"title\": \"1-2 words or numerical expression\",\n      \"type\": \"BULLET_LIST\" or \"WORD_SWAP\" or \"NUMBER_HIGHLIGHT\" or \"STOCK_VIDEO\",\n      \"videoKeyword\": \"single word\",\n      \"items\": [\n        { \"text\": \"text following type rules\", \"timestampMs\": number },\n        { \"text\": \"text following type rules\", \"timestampMs\": number }\n      ]\n    }\n  ]\n}\n\nRemember:\n- startMs and timestampMs should be the exact millisecond when the item should appear\n- endMs should be at least 2000ms after the last item's timestampMs for non-STOCK_VIDEO overlays, and between 2000ms and 3000ms for STOCK_VIDEO overlays\n- Ensure that the NUMBER_HIGHLIGHT format is correct, with the title being the numerical expression and the text completing the thought\n- For STOCK_VIDEO overlays, omit the \"items\" array\n\nNow, please analyze the transcript and generate the overlay sections. Begin with your overlay planning in <overlay_planning> tags, followed by the JSON output."

  const promptText = promptTemplate.replace('{{captions}}', JSON.stringify(captions, null, 2));
  // Replace placeholders like {{captions}} with real values,
  // because the SDK does not support variables.
  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4000,
    temperature: 0,
    messages: [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "<examples>\n<example>\n<captions>\n[\n  {\n    \"text\": \"Research from our course highlights\",\n    \"startMs\": 0,\n    \"endMs\": 1720,\n    \"confidence\": 1,\n    \"timestampMs\": 860\n  },\n  {\n    \"text\": \"that most organizations working on GenAI\",\n    \"startMs\": 1720,\n    \"endMs\": 4200,\n    \"confidence\": 1,\n    \"timestampMs\": 2960\n  },\n  {\n    \"text\": \"were building this incredibly complicated infrastructure\",\n    \"startMs\": 4200,\n    \"endMs\": 7320,\n    \"confidence\": 1,\n    \"timestampMs\": 5760\n  },\n  {\n    \"text\": \"setups for their GenAI workloads.\",\n    \"startMs\": 7320,\n    \"endMs\": 9440,\n    \"confidence\": 1,\n    \"timestampMs\": 8379.999999999998\n  },\n  {\n    \"text\": \"And one in four organizations were\",\n    \"startMs\": 9440,\n    \"endMs\": 11080,\n    \"confidence\": 1,\n    \"timestampMs\": 10260\n  },\n  {\n    \"text\": \"building or fine tuning their own custom GenAI models.\",\n    \"startMs\": 11080,\n    \"endMs\": 14440,\n    \"confidence\": 1,\n    \"timestampMs\": 12760\n  },\n  {\n    \"text\": \"And a small portion of organizations\",\n    \"startMs\": 14440,\n    \"endMs\": 16959,\n    \"confidence\": 1,\n    \"timestampMs\": 15699.5\n  },\n  {\n    \"text\": \"were keeping the infrastructure as is\",\n    \"startMs\": 16959,\n    \"endMs\": 19160,\n    \"confidence\": 1,\n    \"timestampMs\": 18059.5\n  },\n  {\n    \"text\": \"and simply just calling an API within their cloud data\",\n    \"startMs\": 19160,\n    \"endMs\": 22559,\n    \"confidence\": 1,\n    \"timestampMs\": 20859.5\n  },\n  {\n    \"text\": \"boundary.\",\n    \"startMs\": 22559,\n    \"endMs\": 23440,\n    \"confidence\": 1,\n    \"timestampMs\": 22999.5\n  },\n  {\n    \"text\": \"And these organizations were doing the best\",\n    \"startMs\": 23440,\n    \"endMs\": 26400,\n    \"confidence\": 1,\n    \"timestampMs\": 24920\n  },\n  {\n    \"text\": \"by shipping the fastest and thus iterating the fastest\",\n    \"startMs\": 26400,\n    \"endMs\": 30200,\n    \"confidence\": 1,\n    \"timestampMs\": 28299.999999999996\n  },\n  {\n    \"text\": \"and then getting the most user engagement for their products.\",\n    \"startMs\": 30200,\n    \"endMs\": 34520,\n    \"confidence\": 1,\n    \"timestampMs\": 32360\n  },\n  {\n    \"text\": \"Stop listening to all these influencers\",\n    \"startMs\": 34520,\n    \"endMs\": 37080,\n    \"confidence\": 1,\n    \"timestampMs\": 35800\n  },\n  {\n    \"text\": \"about all these tools and fine tuning infrastructure\",\n    \"startMs\": 37080,\n    \"endMs\": 40080,\n    \"confidence\": 1,\n    \"timestampMs\": 38580\n  },\n  {\n    \"text\": \"that you supposedly need.\",\n    \"startMs\": 40080,\n    \"endMs\": 41720,\n    \"confidence\": 1,\n    \"timestampMs\": 40900\n  },\n  {\n    \"text\": \"You don't need any of that.\",\n    \"startMs\": 41720,\n    \"endMs\": 43959,\n    \"confidence\": 1,\n    \"timestampMs\": 42839.5\n  },\n  {\n    \"text\": \"Just keep your infrastructure super simple and call an API.\",\n    \"startMs\": 43959,\n    \"endMs\": 47200,\n    \"confidence\": 1,\n    \"timestampMs\": 45579.5\n  },\n  {\n    \"text\": \"That's all you need.\",\n    \"startMs\": 47200,\n    \"endMs\": 49320,\n    \"confidence\": 1,\n    \"timestampMs\": 48260\n  }\n]\n</captions>\n<ideal_output>\n<result>\n\n      {\n        \"startMs\": 9440,\n        \"endMs\": 14440,\n        \"title\": \"1 in 4\",\n        \"type\": \"NUMBER_HIGHLIGHT\",\n        \"videoKeyword\": \"professional organizations\",\n        \"items\": [\n          { \"text\": \"Organizations building custom GenAI models\", \"timestampMs\": 9440 },\n        ]\n      }\n \n\n      {\n        \"startMs\": 14440,\n        \"endMs\": 23440,\n        \"title\": \"SOLUTION\",\n        \"type\": \"ITEM_LIST\",\n        \"videoKeyword\": \"professional infrastructure\",\n        \"items\": [\n          { \"text\": \"Keeping Current Infrastructure\", \"timestampMs\": 14440 },\n          { \"text\": \"Using API in Cloud Boundary\", \"timestampMs\": 19160 },\n        ]\n      }\n\n\n      {\n        \"startMs\": 26400,\n        \"endMs\": 34520,\n        \"title\": \"Top Performers\",\n        \"type\": \"ITEM_SWAP\",\n        \"videoKeyword\": \"user engagement\",\n        \"items\": [\n          { \"text\": \"Release Rapidly\", \"timestampMs\": 26400 },\n          { \"text\": \"Iterate Quickly\", \"timestampMs\": 28000 },\n          { \"text\": \"Boost Engagement\", \"timestampMs\": 30200 },\n        ]\n      }\n\n      {\n        \"startMs\": 34520,\n        \"endMs\": 41720,\n        \"title\": \"\",\n        \"type\": \"STOCK_VIDEO\",\n        \"videoKeyword\": \"professional influencers\",\n        \"items\": [\n          { \"text\": \"\", \"timestampMs\":  },       \n        ]\n      }\n\n</result>\n</ideal_output>\n</example>\n</examples>\n\n"
          },
          {
            "type": "text",
            "text": promptText
          }
        ]
      }
    ]
  });

  // Extract JSON between <result> tags
  const responseText = typeof msg.content[0] === 'object' && 'text' in msg.content[0] ? msg.content[0].text : '';
  const jsonMatch = responseText?.match(/<result>([\s\S]*?)<\/result>/);
  if (!jsonMatch) {
    console.error('No result found in response');
    return [];
  }
  const cleanResponse = jsonMatch[1].trim();
  console.log('Overlay Structure Response:', cleanResponse);
  try {
    const parsed = JSON.parse(cleanResponse);
    return parsed.sections || [];
  } catch (error) {
    console.error('Failed to parse response:', error);
    return [];
  }
};

interface VideoFile {
  file_type: string;
  link: string;
}

interface PexelsVideo {
  video_files: VideoFile[];
}

const getFirstMp4VideoUrl = async (term: string): Promise<string | null> => {
  try {
    const response = await pexelsClient.videos.search({ query: term, per_page: 1, orientation: 'portrait' }) as Videos;
    const video = response.videos?.[0] as PexelsVideo | undefined;
    if (video?.video_files) {
      const mp4File = video.video_files.find(file => file.file_type === 'video/mp4');
      console.log(term, mp4File);
      return mp4File?.link || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching videos:', error);
    return null;
  }
};

export const VIDEO_FPS = 30;

const generateOverlays = async (transcriptPath: string): Promise<OverlayConfig[]> => {
  try {
    console.log('Starting overlay generation with transcript:', transcriptPath);
    
    // Read the transcription file
    const response = await fetch(transcriptPath);
    console.log('Transcription fetch response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transcription: ${response.status} ${response.statusText}`);
    }
    
    const transcriptionData = await response.json();
    console.log('Transcription data structure:', {
      hasTranscription: !!transcriptionData.transcription,
      transcriptionType: typeof transcriptionData.transcription,
      isArray: Array.isArray(transcriptionData.transcription)
    });

    const captions = transcriptionData.transcription;
    
    if (!Array.isArray(captions)) {
      throw new Error(`Invalid transcription format: expected array of captions, got ${typeof captions}`);
    }

    if (captions.length === 0) {
      throw new Error('No captions found in transcription');
    }

    console.log('Processing captions:', {
      count: captions.length,
      firstCaption: captions[0],
      lastCaption: captions[captions.length - 1]
    });

    const overlayStructure = await getOverlayStructure(captions);
    console.log('Generated overlay structure:', {
      count: overlayStructure.length,
      types: overlayStructure.map(o => o.type)
    });

    if (!overlayStructure || overlayStructure.length === 0) {
      throw new Error('No overlay structure generated from captions');
    }

    // Transform into final overlay config with frame conversion
    const overlays: OverlayConfig[] = await Promise.all(
      overlayStructure.map(async (section) => {
        const videoSrc = await getFirstMp4VideoUrl(section.videoKeyword);
        console.log('Found video for keyword:', {
          keyword: section.videoKeyword,
          found: !!videoSrc
        });

        return {
          startFrame: Math.round((section.startMs / 1000) * VIDEO_FPS),
          duration: Math.round(((section.endMs - section.startMs) / 1000) * VIDEO_FPS),
          title: section.title,
          videoSrc,
          type: {
            'BULLET_LIST': TemplateType.BULLET_LIST,
            'WORD_SWAP': TemplateType.WORD_SWAP,
            'NUMBER_HIGHLIGHT': TemplateType.NUMBER_HIGHLIGHT,
            'STOCK_VIDEO': TemplateType.STOCK_VIDEO
          }[section.type],
          items: section.items?.map(item => ({
            text: item.text,
            delay: Math.round((item.timestampMs / 1000) * VIDEO_FPS) - Math.round((section.startMs / 1000) * VIDEO_FPS)
          })) || []
        };
      })
    );

    console.log('Final overlays generated:', {
      count: overlays.length,
      hasVideoSources: overlays.every(o => !!o.videoSrc)
    });

    return overlays;

  } catch (error) {
    console.error('Error generating overlays:', error);
    throw error; // Re-throw to be handled by the API route
  }
};

export const mockOverlays = async (): Promise<OverlayConfig[]> => {
  return [
    {
      startFrame: 154,
      duration: 90,
      title: "",
      type: TemplateType.STOCK_VIDEO,
      videoSrc: "https://videos.pexels.com/video-files/6278948/6278948-hd_1080_1920_30fps.mp4",
      items: []
    },
    {
      startFrame: 701,
      duration: 300,
      title: "Growth Metrics",
      type: TemplateType.WORD_SWAP,
      videoSrc: "https://videos.pexels.com/video-files/8348725/8348725-hd_720_1280_25fps.mp4",
      items: [
        { text: "20% Margin", delay: 127 },
        { text: "2-3x Growth", delay: 213 }
      ]
    },
    {
      startFrame: 1001,
      duration: 216,
      title: "90%",
      type: TemplateType.NUMBER_HIGHLIGHT,
      videoSrc: "https://videos.pexels.com/video-files/8348725/8348725-hd_720_1280_25fps.mp4",
      items: [
        { text: "Don't Use ChatGPT Regularly", delay: 0 }
      ]
    },
    {
      startFrame: 1217,
      duration: 90,
      title: "",
      type: TemplateType.STOCK_VIDEO,
      videoSrc: "https://videos.pexels.com/video-files/8816986/8816986-sd_240_426_25fps.mp4",
      items: []
    }
  ];
};

const getStockVideoOverlayStructure = async (captions: Caption[]): Promise<PromptResponse[]> => {
  const promptTemplate = "You are an AI assistant specializing in creating video overlay data based on transcript analysis. Your task is to generate JSON-formatted overlay sections that add dynamic stock video overlays to enhance the video content.\n\nHere is the transcript you need to analyze:\n\n<transcript>\n{{captions}}\n</transcript>\n\nYour goal is to create STOCK_VIDEO overlay sections based on this transcript. Each overlay should provide relevant visual context to the content being discussed. You must adhere to the following rules and guidelines:\n\n1. Create 2-3 STOCK_VIDEO overlays per minute of video content.\n2. Each STOCK_VIDEO overlay should last 2-3 seconds.\n3. Place STOCK_VIDEO overlays sequentially (2-3 in a row) for a dynamic visual effect.\n4. Ensure all STOCK_VIDEO overlays are directly relevant to the transcript content at that moment.\n5. No overlays should appear before 5000ms (5 seconds) into the video.\n6. Each overlay must specify a \"type\": \"STOCK_VIDEO\".\n7. The title field should be empty for STOCK_VIDEO overlays.\n8. Use the exact timing from the transcript for when content appears.\n9. Ensure that the person speaking is visible for at least 1/3 of the total video duration.\n10. The videoKeyword can be 1-2 words and should be business or professional oriented and match the message of the video at that time.\n\nBefore generating the final JSON output, analyze the transcript and plan your overlay sections. Wrap your analysis in <overlay_planning> tags. Wrap the final result in <result> tags. In your analysis:\n\n1. Estimate the video duration based on the transcript timings.\n2. Break down the transcript into 1-minute segments.\n3. Identify key visual concepts that could be represented by stock footage.\n4. For each segment:\n   - List potential stock video concepts\n   - Describe the visual concept\n   - Explain relevance to the content\n5. Create a timeline ensuring:\n   - Even distribution throughout the video\n   - Sequential placement of overlays\n   - No overlays before 5 seconds\n6. Double-check that your plan adheres to all rules.\n\nAfter your analysis, provide the overlay sections in the following JSON format:\n\n{\n  \"sections\": [\n    {\n      \"startMs\": number,\n      \"endMs\": number,\n      \"title\": \"\",\n      \"type\": \"STOCK_VIDEO\",\n      \"videoKeyword\": \"1-2 words\"\n    }\n  ]\n}\n\nRemember:\n- startMs should be the exact millisecond when the overlay should appear\n- endMs should be between 2000ms and 3000ms after startMs\n- videoKeyword should be professional and business-oriented\n\nNow, please analyze the transcript and generate the overlay sections. Begin with your overlay planning in <overlay_planning> tags, followed by the JSON output."

  const promptText = promptTemplate.replace('{{captions}}', JSON.stringify(captions, null, 2));
  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4000,
    temperature: 0,
    messages: [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": promptText
          }
        ]
      }
    ]
  });

  // Extract JSON between <result> tags
  const responseText = typeof msg.content[0] === 'object' && 'text' in msg.content[0] ? msg.content[0].text : '';
  const jsonMatch = responseText?.match(/<result>([\s\S]*?)<\/result>/);
  if (!jsonMatch) {
    console.error('No result found in response');
    return [];
  }
  const cleanResponse = jsonMatch[1].trim();
  console.log('Stock Video Overlay Structure Response:', cleanResponse);
  try {
    const parsed = JSON.parse(cleanResponse);
    return parsed.sections || [];
  } catch (error) {
    console.error('Failed to parse response:', error);
    return [];
  }
};

export const generateStockVideoOverlays = async (transcriptPath: string): Promise<OverlayConfig[][]> => {
  try {
    console.log('Starting stock video overlay generation with transcript:', transcriptPath);
    
    // Read the transcription file
    const response = await fetch(transcriptPath);
    console.log('Transcription fetch response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transcription: ${response.status} ${response.statusText}`);
    }
    
    const transcriptionData = await response.json();
    console.log('Transcription data structure:', {
      hasTranscription: !!transcriptionData.transcription,
      transcriptionType: typeof transcriptionData.transcription,
      isArray: Array.isArray(transcriptionData.transcription)
    });

    const captions = transcriptionData.transcription;
    
    if (!Array.isArray(captions)) {
      throw new Error(`Invalid transcription format: expected array of captions, got ${typeof captions}`);
    }

    if (captions.length === 0) {
      throw new Error('No captions found in transcription');
    }

    console.log('Processing captions:', {
      count: captions.length,
      firstCaption: captions[0],
      lastCaption: captions[captions.length - 1]
    });

    const overlayStructure = await getStockVideoOverlayStructure(captions);
    console.log('Generated stock video overlay structure:', {
      count: overlayStructure.length
    });

    if (!overlayStructure || overlayStructure.length === 0) {
      throw new Error('No overlay structure generated from captions');
    }

    // Transform into final overlay config with frame conversion for each provider
    const providerOverlays = await Promise.all(
      overlayStructure.map(async (section) => {
        const providerVideos = await getAllProviderVideos(section.videoKeyword);
        
        return providerVideos.map(provider => ({
          startFrame: Math.round((section.startMs / 1000) * VIDEO_FPS),
          duration: Math.round(((section.endMs - section.startMs) / 1000) * VIDEO_FPS),
          title: section.title,
          videoSrc: provider.videoUrl || '',
          type: TemplateType.STOCK_VIDEO,
          items: [],
          provider: provider.provider
        }));
      })
    );

    // Flatten and group by provider
    const groupedOverlays = providerOverlays.reduce<OverlayConfig[][]>((acc, overlayGroup) => {
      overlayGroup.forEach((overlay, index) => {
        if (!acc[index]) acc[index] = [];
        acc[index].push(overlay);
      });
      return acc;
    }, []);

    console.log('Final stock video overlays generated:', {
      providerCount: groupedOverlays.length,
      overlaysPerProvider: groupedOverlays.map(group => group.length)
    });

    return groupedOverlays;

  } catch (error) {
    console.error('Error generating stock video overlays:', error);
    throw error;
  }
};

export default generateOverlays;