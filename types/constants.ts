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

export interface OverlayConfig {
  startFrame: number;
  duration: number;
  title: string;
  videoSrc: string;
  items: OverlayItem[];
}
interface OverlayItem {
  text: string;
  delay: number;
}