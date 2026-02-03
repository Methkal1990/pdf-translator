export interface TextPlacement {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  align: 'left' | 'right' | 'center';
}

export interface ReconstructedPage {
  pageNumber: number;
  width: number;
  height: number;
  elements: TextPlacement[];
}

export interface ReconstructedDocument {
  pages: ReconstructedPage[];
}

export interface ExportOptions {
  preserveLayout: boolean;
  includeOriginal: boolean;
  paperSize: 'A4' | 'Letter';
}

export interface PDFExportOptions extends ExportOptions {
  fontFamily?: string;
}

export interface DocxExportOptions extends ExportOptions {
  preserveFormatting: boolean;
}
