export interface TextBlock {
  id: string;
  text: string;
  pageNumber: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fontInfo: {
    name: string;
    size: number;
    weight?: string;
  };
  type: 'header' | 'paragraph' | 'list-item' | 'footer' | 'caption';
  direction: 'ltr' | 'rtl';
}

export interface PageData {
  pageNumber: number;
  width: number;
  height: number;
  blocks: TextBlock[];
}

export interface ParsedDocument {
  fileName: string;
  pageCount: number;
  pages: PageData[];
  detectedLanguage: 'arabic' | 'turkish' | 'german' | 'unknown';
  hasRTL: boolean;
  totalBlocks: number;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  pageCount: number;
}
