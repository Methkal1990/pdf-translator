// Use legacy build for Node.js environment
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { TextBlock, PageData, ParsedDocument } from '@/types/pdf';
import { detectLanguage } from '@/lib/utils/language-detector';
import { detectDirection } from '@/lib/utils/rtl-handler';
import { v4 as uuidv4 } from 'uuid';

interface TextItem {
  str: string;
  dir: 'ltr' | 'rtl' | 'ttb' | 'btt';
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

export async function parsePDF(fileBuffer: ArrayBuffer, fileName: string): Promise<ParsedDocument> {
  const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
  const pdf = await loadingTask.promise;

  const pages: PageData[] = [];
  let allText = '';
  let hasRTL = false;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const blocks: TextBlock[] = [];

    for (const item of textContent.items) {
      const textItem = item as TextItem;

      if (!textItem.str || textItem.str.trim() === '') continue;

      // Extract position from transform matrix
      // transform = [scaleX, skewX, skewY, scaleY, translateX, translateY]
      const [scaleX, , , scaleY, x, y] = textItem.transform;
      const fontSize = Math.abs(scaleY);

      // Convert PDF coordinates (origin at bottom-left) to standard coordinates
      const adjustedY = viewport.height - y;

      const direction = textItem.dir === 'rtl' ? 'rtl' : detectDirection(textItem.str);
      if (direction === 'rtl') hasRTL = true;

      const block: TextBlock = {
        id: uuidv4(),
        text: textItem.str,
        pageNumber: pageNum,
        boundingBox: {
          x: x,
          y: adjustedY,
          width: textItem.width || fontSize * textItem.str.length * 0.6,
          height: fontSize,
        },
        fontInfo: {
          name: textItem.fontName,
          size: fontSize,
        },
        type: 'paragraph', // Will be refined by layout analyzer
        direction,
      };

      blocks.push(block);
      allText += textItem.str + ' ';
    }

    pages.push({
      pageNumber: pageNum,
      width: viewport.width,
      height: viewport.height,
      blocks,
    });
  }

  const detectedLanguage = detectLanguage(allText);

  return {
    fileName,
    pageCount: pdf.numPages,
    pages,
    detectedLanguage,
    hasRTL,
    totalBlocks: pages.reduce((sum, page) => sum + page.blocks.length, 0),
  };
}

export async function parsePDFFromFile(file: File): Promise<ParsedDocument> {
  const buffer = await file.arrayBuffer();
  return parsePDF(buffer, file.name);
}
