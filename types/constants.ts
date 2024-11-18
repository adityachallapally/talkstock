import { z } from "zod";
export const COMP_NAME = "captioned-video";

export const CompositionProps = z.object({
  images: z.array(z.string()),
  audioSrc: z.string(),
  subtitlesSrc: z.string(),
  durationInFrames: z.number().optional(),
});

export const DURATION_IN_FRAMES = 900; // Default duration
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;

export enum TemplateType {
  BULLET_LIST = 'BULLET_LIST',
  WORD_SWAP = 'WORD_SWAP',
  NUMBER_HIGHLIGHT = 'NUMBER_HIGHLIGHT',
  STOCK_VIDEO = 'STOCK_VIDEO'
}

export interface OverlayConfig {
  startFrame: number;
  duration: number;
  title?: string;
  videoSrc: string;
  items?: OverlayItem[];
  type: TemplateType;
}

interface OverlayItem {
  text: string;
  delay: number;
}

export interface Caption {
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
  timestampMs: number;
}

export interface OverlaySection {
  startMs: number;
  endMs: number;
  title: string;
  type: TemplateType;
  videoKeyword: string;
  items: Array<{ text: string; timestampMs: number }>;
}

