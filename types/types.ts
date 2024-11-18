export type Point = {
    text: string;
    delay: number;
    emoji?: string;
  };
  
  export type TemplateContent = {
    title: string;
    points: Point[];
  };
  
  export enum TemplateType {
    TITLE_BULLETS = 'titleBullets',
    TITLE_SWAP = 'titleSwap',
    NUMBER_HIGHLIGHT = 'numberHighlight',
    STOCK_VIDEO = "STOCK_VIDEO"
  }
  
  export type VideoSegment = {
    type: TemplateType;
    content: TemplateContent;
    startFrame: number;
    duration: number;
  };