import { TemplateType } from '../components/remotion/types';
import type { OverlayConfig, OverlayItem } from '../components/remotion/types';
import { z } from 'zod';

// Export both the enum and its type
export { TemplateType };
export type { OverlayConfig, OverlayItem };

export const COMP_NAME = "captioned-video";
export const DURATION_IN_FRAMES = 900; // Default duration
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;

export interface Caption {
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
  timestampMs: number;
}

export interface PromptResponse {
  startMs: number;
  endMs: number;
  title: string;
  type: typeof TemplateType;
  videoKeyword: string;
  items: Array<{ text: string; timestampMs: number }>;
}

export const CompositionProps = z.object({
  src: z.string(),
  overlays: z.array(z.any()).optional(),
  transcriptionUrl: z.string().optional(),
  showCaptions: z.boolean().optional(),
});

