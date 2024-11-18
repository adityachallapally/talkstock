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
  type: 'BULLET_LIST' | 'WORD_SWAP' | 'NUMBER_HIGHLIGHT' | 'STOCK_VIDEO';
  videoKeyword: string;
  items: Array<{ text: string; timestampMs: number }>;
}

// Initialize Anthropic client
const anthropic = new Anthropic({ apiKey: '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', dangerouslyAllowBrowser: true });

// Pexels client
const pexelsClient = createClient('V4GUX2DiZafEDUKHToyAhpJM2LD18BpU3WdkCvsi4TMX8BTSOH35wQJX');

const getOverlayStructure = async (captions: Caption[]): Promise<OverlaySection[]> => {
  const response = await fetch('/captions_wrapper_myth.json');
  const replaced_captions = await response.json();

  // Replace placeholders like {{captions}} with real values,
  // because the SDK does not support variables.

  const promptTemplate = "You are an AI assistant specializing in creating video overlay data based on transcript analysis. Your task is to generate JSON-formatted overlay sections that highlight key points from a video transcript. These overlays will enhance the viewer's understanding and engagement with the video content.\n\nHere is the transcript you need to analyze:\n\n<transcript>\n{{captions}}\n</transcript>\n\nYour goal is to create overlay sections based on this transcript. Each overlay should emphasize important information, statistics, or key ideas presented in the video. You must adhere to the following rules and guidelines:\n\n1. Create at least 2-3 STOCK_VIDEO overlays per minute of video content.\n2. Create 1-2 other types of overlays (BULLET_LIST, WORD_SWAP, or NUMBER_HIGHLIGHT) per minute of video content.\n3. No overlays should appear before 5000ms (5 seconds) into the video.\n4. Each overlay must specify a \"type\": either \"BULLET_LIST\", \"WORD_SWAP\", \"NUMBER_HIGHLIGHT\", or \"STOCK_VIDEO\".\n   - BULLET_LIST: 2-3 items of 3-4 words each, displayed as a growing list\n   - WORD_SWAP: 2 items of 1-2 words each, where each item replaces the previous\n   - NUMBER_HIGHLIGHT: 1 item only, where the title is a number/percentage/ratio (e.g. \"90%\" or \"1 in 4\") and the item continues the sentence from the title\n   - STOCK_VIDEO: No items, used for visual representation of concepts\n5. Each overlay title must be 1-2 words only (except for NUMBER_HIGHLIGHT which can be a numerical expression).\n6. Use the exact timing from the transcript for when content appears.\n7. Each overlay section should remain visible for at least 2 seconds after its last item appears.\n8. For BULLET_LIST type, each bullet point should appear at least 2 seconds after the previous one.\n9. STOCK_VIDEO overlays should last at least 1 second but less than 3 seconds.\n10. Ensure that the person speaking is visible for at least 1/3 of the total video duration.\n11. Focus on creating punchy, insightful, and relevant points that capture the essence of the video content.\n12. Align the start time of each overlay with when the relevant information is first mentioned in the transcript.\n\nBefore generating the final JSON output, analyze the transcript and plan your overlay sections. Wrap your overlay planning in <overlay_planning> tags. In your analysis:\n\n1. Estimate the video duration based on the transcript timings. Use the last endMs value in the transcript as the total duration.\n2. Break down the transcript into 1-minute segments for easier analysis.\n3. Create a table summarizing key points for each 1-minute segment with the following columns:\n   - Segment (e.g., 0:00-1:00)\n   - Key Topics/Ideas\n   - Relevant Quotes\n   - Potential Overlay Types\n4. For each key point in the table:\n   - Brainstorm at least 2 overlay ideas, considering different types (BULLET_LIST, WORD_SWAP, NUMBER_HIGHLIGHT, STOCK_VIDEO).\n   - Evaluate each idea by listing its pros and cons.\n   - Choose the best overlay type based on your evaluation.\n5. Create a rough timeline for the overlays, ensuring:\n   - Even distribution throughout the video\n   - Meeting the required frequency (2-3 STOCK_VIDEO and 1-2 other types per minute)\n   - No overlays appear before 5 seconds into the video\n6. For each proposed overlay:\n   - Draft the title and items that would appear in the overlay.\n   - Explain why this information is crucial for viewer understanding.\n   - For STOCK_VIDEO overlays, describe the visual concept you envision.\n7. Double-check that your plan adheres to all rules and guidelines mentioned earlier.\n\nAfter your analysis, provide the overlay sections in the following JSON format:\n\n{\n  \"sections\": [\n    {\n      \"startMs\": number,\n      \"endMs\": number,\n      \"title\": \"1-2 words or numerical expression\",\n      \"type\": \"BULLET_LIST\" or \"WORD_SWAP\" or \"NUMBER_HIGHLIGHT\" or \"STOCK_VIDEO\",\n      \"videoKeyword\": \"single word\",\n      \"items\": [\n        { \"text\": \"text following type rules\", \"timestampMs\": number },\n        { \"text\": \"text following type rules\", \"timestampMs\": number }\n      ]\n    }\n  ]\n}\n\nRemember:\n- startMs and timestampMs should be the exact millisecond when the item should appear\n- endMs should be at least 2000ms after the last item's timestampMs for non-STOCK_VIDEO overlays, and between 1000ms and 3000ms for STOCK_VIDEO overlays\n- Ensure that the NUMBER_HIGHLIGHT format is correct, with the title being the numerical expression and the text completing the thought\n- For STOCK_VIDEO overlays, omit the \"items\" array\n\nNow, please analyze the transcript and generate the overlay sections. Begin with your overlay planning in <overlay_planning> tags, followed by the JSON output wrapped in <result> tags."
  const promptText = promptTemplate.replace('{{captions}}', JSON.stringify(replaced_captions, null, 2));

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
            "text": "<examples>\n<example>\n<captions>\n[\n  {\n    \"text\": \"Research from our course highlights\",\n    \"startMs\": 0,\n    \"endMs\": 1720,\n    \"confidence\": 1,\n    \"timestampMs\": 860\n  },\n  {\n    \"text\": \"that most organizations working on GenAI\",\n    \"startMs\": 1720,\n    \"endMs\": 4200,\n    \"confidence\": 1,\n    \"timestampMs\": 2960\n  },\n  {\n    \"text\": \"were building this incredibly complicated infrastructure\",\n    \"startMs\": 4200,\n    \"endMs\": 7320,\n    \"confidence\": 1,\n    \"timestampMs\": 5760\n  },\n  {\n    \"text\": \"setups for their GenAI workloads.\",\n    \"startMs\": 7320,\n    \"endMs\": 9440,\n    \"confidence\": 1,\n    \"timestampMs\": 8379.999999999998\n  },\n  {\n    \"text\": \"And one in four organizations were\",\n    \"startMs\": 9440,\n    \"endMs\": 11080,\n    \"confidence\": 1,\n    \"timestampMs\": 10260\n  },\n  {\n    \"text\": \"building or fine tuning their own custom GenAI models.\",\n    \"startMs\": 11080,\n    \"endMs\": 14440,\n    \"confidence\": 1,\n    \"timestampMs\": 12760\n  },\n  {\n    \"text\": \"And a small portion of organizations\",\n    \"startMs\": 14440,\n    \"endMs\": 16959,\n    \"confidence\": 1,\n    \"timestampMs\": 15699.5\n  },\n  {\n    \"text\": \"were keeping the infrastructure as is\",\n    \"startMs\": 16959,\n    \"endMs\": 19160,\n    \"confidence\": 1,\n    \"timestampMs\": 18059.5\n  },\n  {\n    \"text\": \"and simply just calling an API within their cloud data\",\n    \"startMs\": 19160,\n    \"endMs\": 22559,\n    \"confidence\": 1,\n    \"timestampMs\": 20859.5\n  },\n  {\n    \"text\": \"boundary.\",\n    \"startMs\": 22559,\n    \"endMs\": 23440,\n    \"confidence\": 1,\n    \"timestampMs\": 22999.5\n  },\n  {\n    \"text\": \"And these organizations were doing the best\",\n    \"startMs\": 23440,\n    \"endMs\": 26400,\n    \"confidence\": 1,\n    \"timestampMs\": 24920\n  },\n  {\n    \"text\": \"by shipping the fastest and thus iterating the fastest\",\n    \"startMs\": 26400,\n    \"endMs\": 30200,\n    \"confidence\": 1,\n    \"timestampMs\": 28299.999999999996\n  },\n  {\n    \"text\": \"and then getting the most user engagement for their products.\",\n    \"startMs\": 30200,\n    \"endMs\": 34520,\n    \"confidence\": 1,\n    \"timestampMs\": 32360\n  },\n  {\n    \"text\": \"Stop listening to all these influencers\",\n    \"startMs\": 34520,\n    \"endMs\": 37080,\n    \"confidence\": 1,\n    \"timestampMs\": 35800\n  },\n  {\n    \"text\": \"about all these tools and fine tuning infrastructure\",\n    \"startMs\": 37080,\n    \"endMs\": 40080,\n    \"confidence\": 1,\n    \"timestampMs\": 38580\n  },\n  {\n    \"text\": \"that you supposedly need.\",\n    \"startMs\": 40080,\n    \"endMs\": 41720,\n    \"confidence\": 1,\n    \"timestampMs\": 40900\n  },\n  {\n    \"text\": \"You don't need any of that.\",\n    \"startMs\": 41720,\n    \"endMs\": 43959,\n    \"confidence\": 1,\n    \"timestampMs\": 42839.5\n  },\n  {\n    \"text\": \"Just keep your infrastructure super simple and call an API.\",\n    \"startMs\": 43959,\n    \"endMs\": 47200,\n    \"confidence\": 1,\n    \"timestampMs\": 45579.5\n  },\n  {\n    \"text\": \"That's all you need.\",\n    \"startMs\": 47200,\n    \"endMs\": 49320,\n    \"confidence\": 1,\n    \"timestampMs\": 48260\n  }\n]\n</captions>\n<ideal_output>\n<overlay_planning>\n1. Estimate video duration: 49320ms (based on last endMs in transcript)\n\n2. Break down into 1-minute segments:\n   Segment 1: 0-49320ms\n\n3. Key topics and overlay suggestions:\n\nSegment 1 (0-49320ms):\na. Organizations building complicated GenAI infrastructure\n   Quote: \"most organizations working on GenAI were building this incredibly complicated infrastructure\"\n   Suggested overlay: STOCK_VIDEO (visualizing complex infrastructure)\n\nb. Custom GenAI model adoption rate\n   Quote: \"one in four organizations were building or fine tuning their own custom GenAI models\"\n   Suggested overlay: NUMBER_HIGHLIGHT (emphasizing \"1 in 4\" statistic)\n\nc. API-based approach\n   Quote: \"simply just calling an API within their cloud data boundary\"\n   Suggested overlay: STOCK_VIDEO (visualizing API call)\n\nd. Benefits of simple approach\n   Quote: \"these organizations were doing the best by shipping the fastest and thus iterating the fastest\"\n   Suggested overlay: BULLET_LIST (listing benefits)\n\ne. Advice against complex tools\n   Quote: \"Stop listening to all these influencers about all these tools and fine tuning infrastructure\"\n   Suggested overlay: STOCK_VIDEO (visualizing influencers or complex tools)\n\nf. Simplicity recommendation\n   Quote: \"Just keep your infrastructure super simple and call an API\"\n   Suggested overlay: WORD_SWAP (contrasting complex vs. simple approaches)\n\n4. Rough timeline for overlays:\n   0-3000ms: STOCK_VIDEO (complex infrastructure)\n   5000-8000ms: STOCK_VIDEO (custom models)\n   11080-14440ms: NUMBER_HIGHLIGHT (\"1 in 4\")\n   17000-20000ms: STOCK_VIDEO (API call)\n   26400-34520ms: BULLET_LIST (benefits)\n   35000-38000ms: STOCK_VIDEO (influencers)\n   43959-47200ms: WORD_SWAP (complex vs. simple)\n\n5. Proposed overlays:\na. STOCK_VIDEO (0-3000ms)\n   Keyword: \"infrastructure\"\n   Represents complex GenAI infrastructure\n\nb. STOCK_VIDEO (5000-8000ms)\n   Keyword: \"models\"\n   Visualizes custom GenAI models\n\nc. NUMBER_HIGHLIGHT (11080-14440ms)\n   Title: \"1 in 4\"\n   Item: \"organizations build custom GenAI models\"\n   Emphasizes adoption rate of custom models\n\nd. STOCK_VIDEO (17000-20000ms)\n   Keyword: \"API\"\n   Represents simple API-based approach\n\ne. BULLET_LIST (26400-34520ms)\n   Title: \"Best Results\"\n   Items: \n   - \"ship products faster\"\n   - \"iterate more quickly\"\n   - \"increase user engagement\"\n   Highlights benefits of simple approach\n\nf. STOCK_VIDEO (35000-38000ms)\n   Keyword: \"influencers\"\n   Visualizes concept of influencers promoting complex tools\n\ng. WORD_SWAP (43959-47200ms)\n   Title: \"Approach\"\n   Items:\n   - \"Complex infrastructure\"\n   - \"Simple API call\"\n   Contrasts complex and simple approaches\n\nThis plan adheres to the rules by including 4 STOCK_VIDEO overlays and 3 other types of overlays for the ~49-second video, meeting the required frequency.\n</overlay_planning>\n\n<result>\n{\n  \"sections\": [\n    {\n      \"startMs\": 0,\n      \"endMs\": 3000,\n      \"title\": \"\",\n      \"type\": \"STOCK_VIDEO\",\n      \"videoKeyword\": \"infrastructure\",\n      \"items\": []\n    },\n    {\n      \"startMs\": 5000,\n      \"endMs\": 8000,\n      \"title\": \"\",\n      \"type\": \"STOCK_VIDEO\",\n      \"videoKeyword\": \"models\",\n      \"items\": []\n    },\n    {\n      \"startMs\": 11080,\n      \"endMs\": 14440,\n      \"title\": \"1 in 4\",\n      \"type\": \"NUMBER_HIGHLIGHT\",\n      \"videoKeyword\": \"organizations\",\n      \"items\": [\n        {\n          \"text\": \"organizations build custom GenAI models\",\n          \"timestampMs\": 11080\n        }\n      ]\n    },\n    {\n      \"startMs\": 17000,\n      \"endMs\": 20000,\n      \"title\": \"\",\n      \"type\": \"STOCK_VIDEO\",\n      \"videoKeyword\": \"API\",\n      \"items\": []\n    },\n    {\n      \"startMs\": 26400,\n      \"endMs\": 34520,\n      \"title\": \"Best Results\",\n      \"type\": \"BULLET_LIST\",\n      \"videoKeyword\": \"fastest\",\n      \"items\": [\n        {\n          \"text\": \"ship products faster\",\n          \"timestampMs\": 26400\n        },\n        {\n          \"text\": \"iterate more quickly\",\n          \"timestampMs\": 28300\n        },\n        {\n          \"text\": \"increase user engagement\",\n          \"timestampMs\": 30200\n        }\n      ]\n    },\n    {\n      \"startMs\": 35000,\n      \"endMs\": 38000,\n      \"title\": \"\",\n      \"type\": \"STOCK_VIDEO\",\n      \"videoKeyword\": \"influencers\",\n      \"items\": []\n    },\n    {\n      \"startMs\": 43959,\n      \"endMs\": 47200,\n      \"title\": \"Approach\",\n      \"type\": \"WORD_SWAP\",\n      \"videoKeyword\": \"infrastructure\",\n      \"items\": [\n        {\n          \"text\": \"Complex infrastructure\",\n          \"timestampMs\": 43959\n        },\n        {\n          \"text\": \"Simple API call\",\n          \"timestampMs\": 45579\n        }\n      ]\n    }\n  ]\n}\n</result>\n</ideal_output>\n</example>\n<example>\n<captions>\n[\n  {\n    \"text\": \"Everybody thinks that wrappers, apps that take generic large-language models and put a UI on\",\n    \"startMs\": 0,\n    \"endMs\": 5120,\n    \"confidence\": 1,\n    \"timestampMs\": 2560\n  },\n  {\n    \"text\": \"top of them to customize it for specific use cases or audiences, won't make much money,\",\n    \"startMs\": 5120,\n    \"endMs\": 9680,\n    \"confidence\": 1,\n    \"timestampMs\": 7400\n  },\n  {\n    \"text\": \"like Liner for search. They think that they'll get copied by model makers or by clones and\",\n    \"startMs\": 9680,\n    \"endMs\": 16320,\n    \"confidence\": 1,\n    \"timestampMs\": 13000\n  },\n  {\n    \"text\": \"their profit margins will go away. And they're all wrong. Research from our course shows that\",\n    \"startMs\": 16320,\n    \"endMs\": 22639,\n    \"confidence\": 1,\n    \"timestampMs\": 19479.5\n  },\n  {\n    \"text\": \"these wrappers are actually quite profitable and are growing significantly, usually at least at\",\n    \"startMs\": 23360,\n    \"endMs\": 27600,\n    \"confidence\": 1,\n    \"timestampMs\": 25480\n  },\n  {\n    \"text\": \"a 20% profit margin and a two to three times year-over-year growth. And this makes sense,\",\n    \"startMs\": 27600,\n    \"endMs\": 33360,\n    \"confidence\": 1,\n    \"timestampMs\": 30480\n  },\n  {\n    \"text\": \"by the way. Over 90% of the world's population don't use ChatGPT or anything similar on even\",\n    \"startMs\": 33360,\n    \"endMs\": 40560,\n    \"confidence\": 1,\n    \"timestampMs\": 36960\n  },\n  {\n    \"text\": \"a somewhat regular basis, if they've used it at all. And so making GenAI accessible to this market\",\n    \"startMs\": 40560,\n    \"endMs\": 47680,\n    \"confidence\": 1,\n    \"timestampMs\": 44120.00000000001\n  },\n  {\n    \"text\": \"is a wide open opportunity. And the few companies who are targeting this are making a killing doing\",\n    \"startMs\": 47680,\n    \"endMs\": 53360,\n    \"confidence\": 1,\n    \"timestampMs\": 50519.99999999999\n  },\n  {\n    \"text\": \"it.\",\n    \"startMs\": 53360,\n    \"endMs\": 54080,\n    \"confidence\": 1,\n    \"timestampMs\": 53720\n  }\n]\n</captions>\n<ideal_output>\n<overlay_planning>\n1. Estimate video duration: 54080ms (based on last endMs in transcript)\n\n2. Break down into 1-minute segments:\n   Segment 1: 0-54080ms\n\n3. Key topics and overlay suggestions:\n\nSegment 1 (0-54080ms):\na. Misconception about wrappers' profitability\n   Quote: \"Everybody thinks that wrappers... won't make much money\"\n   Suggested overlay: STOCK_VIDEO (visualizing wrappers or UI)\n\nb. Fear of being copied\n   Quote: \"They think that they'll get copied by model makers or by clones\"\n   Suggested overlay: STOCK_VIDEO (visualizing copying or cloning)\n\nc. Research findings on profitability\n   Quote: \"these wrappers are actually quite profitable and are growing significantly, usually at least at a 20% profit margin and a two to three times year-over-year growth\"\n   Suggested overlay: NUMBER_HIGHLIGHT (emphasizing \"20%\" statistic)\n\nd. Untapped market potential\n   Quote: \"Over 90% of the world's population don't use ChatGPT or anything similar\"\n   Suggested overlay: NUMBER_HIGHLIGHT (emphasizing \"90%\" statistic)\n\ne. Market opportunity\n   Quote: \"making GenAI accessible to this market is a wide open opportunity\"\n   Suggested overlay: STOCK_VIDEO (visualizing market opportunity)\n\n4. Rough timeline for overlays:\n   0-3000ms: STOCK_VIDEO (wrappers/UI)\n   5120-8120ms: STOCK_VIDEO (copying/cloning)\n   27600-33360ms: NUMBER_HIGHLIGHT (\"20%\")\n   33360-40560ms: NUMBER_HIGHLIGHT (\"90%\")\n   47680-50680ms: STOCK_VIDEO (market opportunity)\n\n5. Proposed overlays:\na. STOCK_VIDEO (0-3000ms)\n   Keyword: \"wrappers\"\n   Represents concept of wrapper applications\n\nb. STOCK_VIDEO (5120-8120ms)\n   Keyword: \"copied\"\n   Visualizes fear of being copied or cloned\n\nc. NUMBER_HIGHLIGHT (27600-33360ms)\n   Title: \"20%\"\n   Item: \"profit margin for wrappers\"\n   Emphasizes profitability of wrappers\n\nd. NUMBER_HIGHLIGHT (33360-40560ms)\n   Title: \"90%\"\n   Item: \"don't use ChatGPT regularly\"\n   Highlights untapped market potential\n\ne. STOCK_VIDEO (47680-50680ms)\n   Keyword: \"opportunity\"\n   Represents the market opportunity for GenAI accessibility\n\nThis plan adheres to the rules by including 3 STOCK_VIDEO overlays and 2 other types of overlays for the ~54-second video, meeting the required frequency.\n</overlay_planning>\n\n<result>\n{\n  \"sections\": [\n    {\n      \"startMs\": 0,\n      \"endMs\": 3000,\n      \"title\": \"\",\n      \"type\": \"STOCK_VIDEO\",\n      \"videoKeyword\": \"wrappers\",\n      \"items\": []\n    },\n    {\n      \"startMs\": 5120,\n      \"endMs\": 8120,\n      \"title\": \"\",\n      \"type\": \"STOCK_VIDEO\",\n      \"videoKeyword\": \"copied\",\n      \"items\": []\n    },\n    {\n      \"startMs\": 27600,\n      \"endMs\": 33360,\n      \"title\": \"20%\",\n      \"type\": \"NUMBER_HIGHLIGHT\",\n      \"videoKeyword\": \"profit\",\n      \"items\": [\n        {\n          \"text\": \"profit margin for wrappers\",\n          \"timestampMs\": 27600\n        }\n      ]\n    },\n    {\n      \"startMs\": 33360,\n      \"endMs\": 40560,\n      \"title\": \"90%\",\n      \"type\": \"NUMBER_HIGHLIGHT\",\n      \"videoKeyword\": \"population\",\n      \"items\": [\n        {\n          \"text\": \"don't use ChatGPT regularly\",\n          \"timestampMs\": 33360\n        }\n      ]\n    },\n    {\n      \"startMs\": 47680,\n      \"endMs\": 50680,\n      \"title\": \"\",\n      \"type\": \"STOCK_VIDEO\",\n      \"videoKeyword\": \"opportunity\",\n      \"items\": []\n    }\n  ]\n}\n</result>\n</ideal_output>\n</example>\n<example>\n<captions>\n[\n  {\n    \"text\": \"We've already discussed how non-tech companies are the best position to win in this space\",\n    \"startMs\": 0,\n    \"endMs\": 5360,\n    \"confidence\": 1,\n    \"timestampMs\": 2680\n  },\n  {\n    \"text\": \"because they have access to a large number of users and a large amount of data which is\",\n    \"startMs\": 5360,\n    \"endMs\": 10400,\n    \"confidence\": 1,\n    \"timestampMs\": 7880.000000000001\n  },\n  {\n    \"text\": \"everything you need to succeed now. Unfortunately they're wasting this advantage. They're going out\",\n    \"startMs\": 10400,\n    \"endMs\": 16799,\n    \"confidence\": 1,\n    \"timestampMs\": 13599.499999999998\n  },\n  {\n    \"text\": \"and building internal tools and they're doing this because they think that this will help them build\",\n    \"startMs\": 16799,\n    \"endMs\": 21760,\n    \"confidence\": 1,\n    \"timestampMs\": 19279.5\n  },\n  {\n    \"text\": \"up the capabilities they need to succeed with Gen AI but they're completely wrong. The companies\",\n    \"startMs\": 21760,\n    \"endMs\": 27920,\n    \"confidence\": 1,\n    \"timestampMs\": 24840.000000000004\n  },\n  {\n    \"text\": \"that are succeeding are learning how to iterate user-facing products with a small number of users\",\n    \"startMs\": 27920,\n    \"endMs\": 33439,\n    \"confidence\": 1,\n    \"timestampMs\": 30679.5\n  },\n  {\n    \"text\": \"which is the key capability you need to learn and unfortunately it's really hard to learn\",\n    \"startMs\": 33439,\n    \"endMs\": 38400,\n    \"confidence\": 1,\n    \"timestampMs\": 35919.5\n  },\n  {\n    \"text\": \"that when you're building internal tools.\",\n    \"startMs\": 38400,\n    \"endMs\": 42799,\n    \"confidence\": 1,\n    \"timestampMs\": 40599.5\n  }\n]\n</captions>\n<ideal_output>\n<overlay_planning>\n1. Estimate video duration: 42799ms (based on last endMs in transcript)\n\n2. Break down into 1-minute segments:\n   Segment 1: 0-42799ms\n\n3. Key topics and overlay suggestions:\n\nSegment 1 (0-42799ms):\na. Non-tech companies' advantages\n   Quote: \"non-tech companies are the best position to win in this space because they have access to a large number of users and a large amount of data\"\n   Suggested overlay: BULLET_LIST (listing advantages)\n\nb. Wasting advantage on internal tools\n   Quote: \"Unfortunately they're wasting this advantage. They're going out and building internal tools\"\n   Suggested overlay: STOCK_VIDEO (visualizing internal tools)\n\nc. Misconception about building capabilities\n   Quote: \"they think that this will help them build up the capabilities they need to succeed with Gen AI but they're completely wrong\"\n   Suggested overlay: STOCK_VIDEO (visualizing misconception)\n\nd. Key to success: iterating user-facing products\n   Quote: \"The companies that are succeeding are learning how to iterate user-facing products with a small number of users\"\n   Suggested overlay: WORD_SWAP (contrasting internal tools vs. user-facing products)\n\ne. Difficulty of learning from internal tools\n   Quote: \"unfortunately it's really hard to learn that when you're building internal tools\"\n   Suggested overlay: STOCK_VIDEO (visualizing learning difficulties)\n\n4. Rough timeline for overlays:\n   0-3000ms: STOCK_VIDEO (non-tech companies)\n   5360-10400ms: BULLET_LIST (advantages)\n   16799-19799ms: STOCK_VIDEO (internal tools)\n   21760-24760ms: STOCK_VIDEO (misconception)\n   27920-38400ms: WORD_SWAP (internal vs. user-facing)\n   38400-41400ms: STOCK_VIDEO (learning difficulties)\n\n5. Proposed overlays:\na. STOCK_VIDEO (0-3000ms)\n   Keyword: \"non-tech\"\n   Represents non-tech companies in the GenAI space\n\nb. BULLET_LIST (5360-10400ms)\n   Title: \"Advantages\"\n   Items:\n   - \"Large user base\"\n   - \"Extensive data\"\n   Highlights non-tech companies' advantages\n\nc. STOCK_VIDEO (16799-19799ms)\n   Keyword: \"internal\"\n   Visualizes concept of internal tools\n\nd. STOCK_VIDEO (21760-24760ms)\n   Keyword: \"misconception\"\n   Represents misconception about building capabilities\n\ne. WORD_SWAP (27920-38400ms)\n   Title: \"Focus\"\n   Items:\n   - \"Internal tools\"\n   - \"User-facing products\"\n   Contrasts the misguided approach with the successful one\n\nf. STOCK_VIDEO (38400-41400ms)\n   Keyword: \"learning\"\n   Visualizes difficulty of learning from internal tools\n\nThis plan adheres to the rules by including 4 STOCK_VIDEO overlays and 2 other types of overlays for the ~43-second video, meeting the required frequency.\n</overlay_planning>\n\n<result>\n{\n  \"sections\": [\n    {\n      \"startMs\": 0,\n      \"endMs\": 3000,\n      \"title\": \"\",\n      \"type\": \"STOCK_VIDEO\",\n      \"videoKeyword\": \"non-tech\",\n      \"items\": []\n    },\n    {\n      \"startMs\": 5360,\n      \"endMs\": 10400,\n      \"title\": \"Advantages\",\n      \"type\": \"BULLET_LIST\",\n      \"videoKeyword\": \"users\",\n      \"items\": [\n        {\n          \"text\": \"Large user base\",\n          \"timestampMs\": 5360\n        },\n        {\n          \"text\": \"Extensive data\",\n          \"timestampMs\": 7880\n        }\n      ]\n    },\n    {\n      \"startMs\": 16799,\n      \"endMs\": 19799,\n      \"title\": \"\",\n      \"type\": \"STOCK_VIDEO\",\n      \"videoKeyword\": \"internal\",\n      \"items\": []\n    },\n    {\n      \"startMs\": 21760,\n      \"endMs\": 24760,\n      \"title\": \"\",\n      \"type\": \"STOCK_VIDEO\",\n      \"videoKeyword\": \"misconception\",\n      \"items\": []\n    },\n    {\n      \"startMs\": 27920,\n      \"endMs\": 38400,\n      \"title\": \"Focus\",\n      \"type\": \"WORD_SWAP\",\n      \"videoKeyword\": \"products\",\n      \"items\": [\n        {\n          \"text\": \"Internal tools\",\n          \"timestampMs\": 27920\n        },\n        {\n          \"text\": \"User-facing products\",\n          \"timestampMs\": 30679\n        }\n      ]\n    },\n    {\n      \"startMs\": 38400,\n      \"endMs\": 41400,\n      \"title\": \"\",\n      \"type\": \"STOCK_VIDEO\",\n      \"videoKeyword\": \"learning\",\n      \"items\": []\n    }\n  ]\n}\n</result>\n</ideal_output>\n</example>\n</examples>\n\n"
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
          'BULLET_LIST': TemplateType.TITLE_BULLETS,
          'WORD_SWAP': TemplateType.TITLE_SWAP,
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