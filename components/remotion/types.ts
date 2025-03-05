export enum TemplateType {
  BULLET_LIST = 'BULLET_LIST',
  WORD_SWAP = 'WORD_SWAP',
  NUMBER_HIGHLIGHT = 'NUMBER_HIGHLIGHT',
  STOCK_VIDEO = 'STOCK_VIDEO'
}

export interface OverlayConfig {
  startFrame: number;
  duration: number;
  type: TemplateType;
  videoSrc?: string;
  title?: string;
  provider?: string;
  searchTerm?: string;
  items?: OverlayItem[];
}

export interface OverlayItem {
  text: string;
  delay: number;
} 