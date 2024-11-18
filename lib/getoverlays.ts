import { OverlayConfig, Caption, PromptResponse } from '@/types/constants';
import { createClient } from 'pexels';
import Anthropic from '@anthropic-ai/sdk';
import { TemplateType } from '@/types/constants';

// Initialize Anthropic client
const anthropic = new Anthropic({ apiKey: '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', dangerouslyAllowBrowser: true });

// Pexels client
const pexelsClient = createClient('V4GUX2DiZafEDUKHToyAhpJM2LD18BpU3WdkCvsi4TMX8BTSOH35wQJX');

const getOverlayStructure = async (captions: Caption[]): Promise<PromptResponse[]> => {
  const response = await fetch('/captions_wrapper_myth.json');
  const replaced_captions = await response.json();

  const promptTemplate = "You are an AI assistant specializing in creating video overlay data based on transcript analysis. Your task is to generate JSON-formatted overlay sections that highlight key points from a video transcript. These overlays will enhance the viewer's understanding and engagement with the video content.\n\nHere is the transcript you need to analyze:\n\n<transcript>\n{{captions}}\n</transcript>\n\nYour goal is to create overlay sections based on this transcript. Each overlay should emphasize important information, statistics, or key ideas presented in the video. You must adhere to the following rules and guidelines:\n\n1. Create 1-2 STOCK_VIDEO overlays per minute of video content. While not mandatory for every section, they add significant value when used appropriatel When using STOCK_VIDEO overlays, try to place them sequentially (2-3 in a row) for a dynamic effect. Each STOCK_VIDEO overlay should last 2-3 seconds.\n3. Create 1-2 other types of overlays (BULLET_LIST, WORD_SWAP, or NUMBER_HIGHLIGHT) per minute of video content.\n4. Ensure all overlays, especially STOCK_VIDEO, are directly relevant to the transcript content at that moment.\n5. No overlays should appear before 5000ms (5 seconds) into the video.\n6. Each overlay must specify a \"type\": either \"BULLET_LIST\", \"WORD_SWAP\", \"NUMBER_HIGHLIGHT\", or \"STOCK_VIDEO\".\n   - BULLET_LIST: 2-3 items of 3-4 words each, displayed as a growing list\n   - WORD_SWAP: 2 items of 1-2 words each, where each item replaces the previous\n   - NUMBER_HIGHLIGHT: 1 item only, where the title is a number/percentage/ratio (e.g. \"90%\" or \"1 in 4\") and the item continues the sentence from the title\n   - STOCK_VIDEO: No items, used for visual representation of concepts\n7. Each overlay title must be 1-2 words only (except for NUMBER_HIGHLIGHT which can be a numerical expression).\n8. Use the exact timing from the transcript for when content appears.\n9. Each overlay section should remain visible for at least 2 seconds after its last item appears.\n10. For BULLET_LIST type, each bullet point should appear at least 2 seconds after the previous one.\n11. Ensure that the person speaking is visible for at least 1/3 of the total video duration.\n12. Focus on creating punchy, insightful, and relevant points that capture the essence of the video content.\n13. Align the start time of each overlay with when the relevant information is first mentioned in the transcript.\n\nBefore generating the final JSON output, analyze the transcript and plan your overlay sections. Wrap your analysis in <overlay_planning> tags. Wrap the final result in <result> tags. In your analysis:\n\n1. Estimate the video duration based on the transcript timings. Use the last endMs value in the transcript as the total duration.\n2. Break down the transcript into 1-minute segments for easier analysis.\n3. Identify key topics, ideas, and relevant quotes for each segment.\n4. Brainstorm overlay ideas, considering different types (BULLET_LIST, WORD_SWAP, NUMBER_HIGHLIGHT, STOCK_VIDEO).\n5. List out all potential overlay ideas for each segment, including:\n   - Proposed overlay type\n   - Draft title and items (if applicable)\n   - Relevance to the content\n   - For STOCK_VIDEO, describe the visual concept\n6. Create a rough timeline for the overlays, ensuring:\n   - Even distribution throughout the video\n   - Meeting the required frequency (1-2 STOCK_VIDEO and 1-2 other types per minute)\n   - No overlays appear before 5 seconds into the video\n   - STOCK_VIDEO overlays are placed sequentially when used\n7. Finalize overlay selections, considering:\n   - Balance of overlay types\n   - Even distribution across the video duration\n   - Relevance and impact of each overlay\n8. For each selected overlay:\n   - Refine the title and items\n   - Explain why this information is crucial for viewer understanding\n   - For STOCK_VIDEO overlays, refine the visual concept description\n9. Double-check that your plan adheres to all rules and guidelines mentioned earlier.\n10. Review the distribution of overlays to ensure even coverage throughout the video.\n\nAfter your analysis, provide the overlay sections in the following JSON format:\n\n{\n  \"sections\": [\n    {\n      \"startMs\": number,\n      \"endMs\": number,\n      \"title\": \"1-2 words or numerical expression\",\n      \"type\": \"BULLET_LIST\" or \"WORD_SWAP\" or \"NUMBER_HIGHLIGHT\" or \"STOCK_VIDEO\",\n      \"videoKeyword\": \"single word\",\n      \"items\": [\n        { \"text\": \"text following type rules\", \"timestampMs\": number },\n        { \"text\": \"text following type rules\", \"timestampMs\": number }\n      ]\n    }\n  ]\n}\n\nRemember:\n- startMs and timestampMs should be the exact millisecond when the item should appear\n- endMs should be at least 2000ms after the last item's timestampMs for non-STOCK_VIDEO overlays, and between 2000ms and 3000ms for STOCK_VIDEO overlays\n- Ensure that the NUMBER_HIGHLIGHT format is correct, with the title being the numerical expression and the text completing the thought\n- For STOCK_VIDEO overlays, omit the \"items\" array\n\nNow, please analyze the transcript and generate the overlay sections. Begin with your overlay planning in <overlay_planning> tags, followed by the JSON output."

  const promptText = promptTemplate.replace('{{captions}}', JSON.stringify(replaced_captions, null, 2));
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
            "text": "<examples>\n<example>\n<captions>\n[\n  {\n    \"text\": \"Research from our course highlights\",\n    \"startMs\": 0,\n    \"endMs\": 1720,\n    \"confidence\": 1,\n    \"timestampMs\": 860\n  },\n  {\n    \"text\": \"that most organizations working on GenAI\",\n    \"startMs\": 1720,\n    \"endMs\": 4200,\n    \"confidence\": 1,\n    \"timestampMs\": 2960\n  },\n  {\n    \"text\": \"were building this incredibly complicated infrastructure\",\n    \"startMs\": 4200,\n    \"endMs\": 7320,\n    \"confidence\": 1,\n    \"timestampMs\": 5760\n  },\n  {\n    \"text\": \"setups for their GenAI workloads.\",\n    \"startMs\": 7320,\n    \"endMs\": 9440,\n    \"confidence\": 1,\n    \"timestampMs\": 8379.999999999998\n  },\n  {\n    \"text\": \"And one in four organizations were\",\n    \"startMs\": 9440,\n    \"endMs\": 11080,\n    \"confidence\": 1,\n    \"timestampMs\": 10260\n  },\n  {\n    \"text\": \"building or fine tuning their own custom GenAI models.\",\n    \"startMs\": 11080,\n    \"endMs\": 14440,\n    \"confidence\": 1,\n    \"timestampMs\": 12760\n  },\n  {\n    \"text\": \"And a small portion of organizations\",\n    \"startMs\": 14440,\n    \"endMs\": 16959,\n    \"confidence\": 1,\n    \"timestampMs\": 15699.5\n  },\n  {\n    \"text\": \"were keeping the infrastructure as is\",\n    \"startMs\": 16959,\n    \"endMs\": 19160,\n    \"confidence\": 1,\n    \"timestampMs\": 18059.5\n  },\n  {\n    \"text\": \"and simply just calling an API within their cloud data\",\n    \"startMs\": 19160,\n    \"endMs\": 22559,\n    \"confidence\": 1,\n    \"timestampMs\": 20859.5\n  },\n  {\n    \"text\": \"boundary.\",\n    \"startMs\": 22559,\n    \"endMs\": 23440,\n    \"confidence\": 1,\n    \"timestampMs\": 22999.5\n  },\n  {\n    \"text\": \"And these organizations were doing the best\",\n    \"startMs\": 23440,\n    \"endMs\": 26400,\n    \"confidence\": 1,\n    \"timestampMs\": 24920\n  },\n  {\n    \"text\": \"by shipping the fastest and thus iterating the fastest\",\n    \"startMs\": 26400,\n    \"endMs\": 30200,\n    \"confidence\": 1,\n    \"timestampMs\": 28299.999999999996\n  },\n  {\n    \"text\": \"and then getting the most user engagement for their products.\",\n    \"startMs\": 30200,\n    \"endMs\": 34520,\n    \"confidence\": 1,\n    \"timestampMs\": 32360\n  },\n  {\n    \"text\": \"Stop listening to all these influencers\",\n    \"startMs\": 34520,\n    \"endMs\": 37080,\n    \"confidence\": 1,\n    \"timestampMs\": 35800\n  },\n  {\n    \"text\": \"about all these tools and fine tuning infrastructure\",\n    \"startMs\": 37080,\n    \"endMs\": 40080,\n    \"confidence\": 1,\n    \"timestampMs\": 38580\n  },\n  {\n    \"text\": \"that you supposedly need.\",\n    \"startMs\": 40080,\n    \"endMs\": 41720,\n    \"confidence\": 1,\n    \"timestampMs\": 40900\n  },\n  {\n    \"text\": \"You don't need any of that.\",\n    \"startMs\": 41720,\n    \"endMs\": 43959,\n    \"confidence\": 1,\n    \"timestampMs\": 42839.5\n  },\n  {\n    \"text\": \"Just keep your infrastructure super simple and call an API.\",\n    \"startMs\": 43959,\n    \"endMs\": 47200,\n    \"confidence\": 1,\n    \"timestampMs\": 45579.5\n  },\n  {\n    \"text\": \"That's all you need.\",\n    \"startMs\": 47200,\n    \"endMs\": 49320,\n    \"confidence\": 1,\n    \"timestampMs\": 48260\n  }\n]\n</captions>\n<ideal_output>\n<result>\n\n      {\n        \"startMs\": 9440,\n        \"endMs\": 14440,\n        \"title\": \"1 in 4\",\n        \"type\": \"NUMBER_HIGHLIGHT\",\n        \"videoKeyword\": \"organizations\",\n        \"items\": [\n          { \"text\": \"Organizations building custom GenAI models\", \"timestampMs\": 9440 },\n        ]\n      }\n \n\n      {\n        \"startMs\": 14440,\n        \"endMs\": 23440,\n        \"title\": \"SOLUTION\",\n        \"type\": \"ITEM_LIST\",\n        \"videoKeyword\": \"office workers\",\n        \"items\": [\n          { \"text\": \"Keeping Current Infrastructure\", \"timestampMs\": 14440 },\n          { \"text\": \"Using API in Cloud Boundary\", \"timestampMs\": 19160 },\n        ]\n      }\n\n\n      {\n        \"startMs\": 26400,\n        \"endMs\": 34520,\n        \"title\": \"Top Performers\",\n        \"type\": \"ITEM_SWAP\",\n        \"videoKeyword\": \"laptop\",\n        \"items\": [\n          { \"text\": \"Release Rapidly\", \"timestampMs\": 26400 },\n          { \"text\": \"Iterate Quickly\", \"timestampMs\": 28000 },\n          { \"text\": \"Boost Engagement\", \"timestampMs\": 30200 },\n        ]\n      }\n\n      {\n        \"startMs\": 34520,\n        \"endMs\": 41720,\n        \"title\": \"\",\n        \"type\": \"STOCK_VIDEO\",\n        \"videoKeyword\": \"influencers\",\n        \"items\": [\n          { \"text\": \"\", \"timestampMs\":  },       \n        ]\n      }\n\n</result>\n</ideal_output>\n</example>\n<example>\n<captions>\n[\n  {\n    \"text\": \"Everybody thinks that wrappers, apps that take generic large-language models and put a UI on\",\n    \"startMs\": 0,\n    \"endMs\": 5120,\n    \"confidence\": 1,\n    \"timestampMs\": 2560\n  },\n  {\n    \"text\": \"top of them to customize it for specific use cases or audiences, won't make much money,\",\n    \"startMs\": 5120,\n    \"endMs\": 9680,\n    \"confidence\": 1,\n    \"timestampMs\": 7400\n  },\n  {\n    \"text\": \"like Liner for search. They think that they'll get copied by model makers or by clones and\",\n    \"startMs\": 9680,\n    \"endMs\": 16320,\n    \"confidence\": 1,\n    \"timestampMs\": 13000\n  },\n  {\n    \"text\": \"their profit margins will go away. And they're all wrong. Research from our course shows that\",\n    \"startMs\": 16320,\n    \"endMs\": 22639,\n    \"confidence\": 1,\n    \"timestampMs\": 19479.5\n  },\n  {\n    \"text\": \"these wrappers are actually quite profitable and are growing significantly, usually at least at\",\n    \"startMs\": 23360,\n    \"endMs\": 27600,\n    \"confidence\": 1,\n    \"timestampMs\": 25480\n  },\n  {\n    \"text\": \"a 20% profit margin and a two to three times year-over-year growth. And this makes sense,\",\n    \"startMs\": 27600,\n    \"endMs\": 33360,\n    \"confidence\": 1,\n    \"timestampMs\": 30480\n  },\n  {\n    \"text\": \"by the way. Over 90% of the world's population don't use ChatGPT or anything similar on even\",\n    \"startMs\": 33360,\n    \"endMs\": 40560,\n    \"confidence\": 1,\n    \"timestampMs\": 36960\n  },\n  {\n    \"text\": \"a somewhat regular basis, if they've used it at all. And so making GenAI accessible to this market\",\n    \"startMs\": 40560,\n    \"endMs\": 47680,\n    \"confidence\": 1,\n    \"timestampMs\": 44120.00000000001\n  },\n  {\n    \"text\": \"is a wide open opportunity. And the few companies who are targeting this are making a killing doing\",\n    \"startMs\": 47680,\n    \"endMs\": 53360,\n    \"confidence\": 1,\n    \"timestampMs\": 50519.99999999999\n  },\n  {\n    \"text\": \"it.\",\n    \"startMs\": 53360,\n    \"endMs\": 54080,\n    \"confidence\": 1,\n    \"timestampMs\": 53720\n  }\n]\n</captions>\n<ideal_output>\n<result>\n      {\n        \"startMs\": 16320,\n        \"endMs\": 27660,\n        \"title\": \"Profitability of Wrappers\",\n        \"type\": \"WORD_SWAP\",\n        \"videoKeyword\": \"profit\",\n        \"items\": [\n          { \"text\": \"20% profit margin\", \"timestampMs\": 23360 },\n          { \"text\": \"2-3x YoY growth\", \"timestampMs\": 33360 },\n        ]\n      }\n\n      {\n        \"startMs\": 33360,\n        \"endMs\":40560,\n        \"title\": \"90%\",\n        \"type\": \"NUMBER_HIGHLIGHT\",\n        \"videoKeyword\": \"world\",\n        \"items\": [\n          { \"text\": \"Non-ChatGPT Users \", \"timestampMs\": 3500},        \n]\n      }\n</result>\n</ideal_output>\n</example>\n<example>\n<captions>\n[\n  {\n    \"text\": \"We've already discussed how non-tech companies are the best position to win in this space\",\n    \"startMs\": 0,\n    \"endMs\": 5360,\n    \"confidence\": 1,\n    \"timestampMs\": 2680\n  },\n  {\n    \"text\": \"because they have access to a large number of users and a large amount of data which is\",\n    \"startMs\": 5360,\n    \"endMs\": 10400,\n    \"confidence\": 1,\n    \"timestampMs\": 7880.000000000001\n  },\n  {\n    \"text\": \"everything you need to succeed now. Unfortunately they're wasting this advantage. They're going out\",\n    \"startMs\": 10400,\n    \"endMs\": 16799,\n    \"confidence\": 1,\n    \"timestampMs\": 13599.499999999998\n  },\n  {\n    \"text\": \"and building internal tools and they're doing this because they think that this will help them build\",\n    \"startMs\": 16799,\n    \"endMs\": 21760,\n    \"confidence\": 1,\n    \"timestampMs\": 19279.5\n  },\n  {\n    \"text\": \"up the capabilities they need to succeed with Gen AI but they're completely wrong. The companies\",\n    \"startMs\": 21760,\n    \"endMs\": 27920,\n    \"confidence\": 1,\n    \"timestampMs\": 24840.000000000004\n  },\n  {\n    \"text\": \"that are succeeding are learning how to iterate user-facing products with a small number of users\",\n    \"startMs\": 27920,\n    \"endMs\": 33439,\n    \"confidence\": 1,\n    \"timestampMs\": 30679.5\n  },\n  {\n    \"text\": \"which is the key capability you need to learn and unfortunately it's really hard to learn\",\n    \"startMs\": 33439,\n    \"endMs\": 38400,\n    \"confidence\": 1,\n    \"timestampMs\": 35919.5\n  },\n  {\n    \"text\": \"that when you're building internal tools.\",\n    \"startMs\": 38400,\n    \"endMs\": 42799,\n    \"confidence\": 1,\n    \"timestampMs\": 40599.5\n  }\n]\n</captions>\n<ideal_output>\n<result>\n\n      {\n        \"startMs\": 5360,\n        \"endMs\": 7000,\n        \"title\": \"\",\n        \"type\": \"STOCK_VIDEO\",\n        \"videoKeyword\": \"users\",\n        \"items\": [\n        ]\n      },\n      {\n        \"startMs\": 7000,\n        \"endMs\": 10400,\n        \"title\": \"\",\n        \"type\": \"STOCK_VIDEO\",\n        \"videoKeyword\": \"data\",\n        \"items\": [\n        ]\n      },\n      {\n         \"startMs\": 16799,\n         \"endMs\": 21760,\n        \"title\": \"\",\n        \"type\": \"STOCK_VIDEO\",\n        \"videoKeyword\": \"tools\",\n        \"items\": [\n        ]\n      },\n\n      {\n    \"startMs\": 21760,\n    \"endMs\": 27920,\n        \"title\": \"\",\n        \"type\": \"STOCK_VIDEO\",\n        \"videoKeyword\": \"capabilities\",\n        \"items\": [\n        ]\n      },\n\n      {\n    \"startMs\": 27920,\n    \"endMs\": 38400,\n        \"title\": \"SOLUTION\",\n        \"type\": \"BULLET_LIST\",\n        \"videoKeyword\": \"capabilities\",\n        \"items\": [\n          { \"text\": \"Iterate User-Facing Products\", \"timestampMs\": 27920 },\n          { \"text\": \"Small User Groups\", \"timestampMs\": 3000 },\n        ]\n      },\n</result>\n</ideal_output>\n</example>\n</examples>\n\n"
          },
          {
            "type": "text",
            "text": promptText
          }
        ]
      },
      {
        "role": "assistant",
        "content": [
          {
            "type": "text",
            "text": "<overlay_planning>"
          }
        ]
      }
    ]
  });
  console.log(msg);

  // Extract JSON between <json_output> tags
  const jsonMatch = msg.content[0].text.match(/<result>([\s\S]*?)<\/result>/);
  const cleanResponse = jsonMatch ? jsonMatch[1].trim() : '[]';
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
          'BULLET_LIST': TemplateType.BULLET_LIST,
          'WORD_SWAP': TemplateType.WORD_SWAP,
          'NUMBER_HIGHLIGHT': TemplateType.NUMBER_HIGHLIGHT,
          'STOCK_VIDEO': TemplateType.STOCK_VIDEO
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