import { TextBlock } from '@/types/pdf';
import { TranslatedChunk } from '@/types/translation';
import { TextPlacement, ReconstructedPage, ReconstructedDocument } from '@/types/export';
import { Chunk } from '@/types/chunk';

export function reconstructDocument(
  chunks: Chunk[],
  translatedChunks: Map<string, TranslatedChunk>,
  pageWidth: number = 612,
  pageHeight: number = 792
): ReconstructedDocument {
  const pages: Map<number, TextPlacement[]> = new Map();

  for (const chunk of chunks) {
    const translated = translatedChunks.get(chunk.id);
    if (!translated) continue;

    // Map translated text back to blocks proportionally
    const blockMappings = mapTranslationsToBlocks(chunk, translated.translatedText);

    for (const mapping of blockMappings) {
      const block = chunk.blocks.find((b) => b.id === mapping.blockId);
      if (!block) continue;

      const placement = createTextPlacement(block, mapping.translatedText, pageWidth);

      if (!pages.has(block.pageNumber)) {
        pages.set(block.pageNumber, []);
      }
      pages.get(block.pageNumber)!.push(placement);
    }
  }

  // Convert to array sorted by page number
  const reconstructedPages: ReconstructedPage[] = [];
  const sortedPageNumbers = [...pages.keys()].sort((a, b) => a - b);

  for (const pageNum of sortedPageNumbers) {
    reconstructedPages.push({
      pageNumber: pageNum,
      width: pageWidth,
      height: pageHeight,
      elements: pages.get(pageNum)!.sort((a, b) => a.y - b.y),
    });
  }

  return { pages: reconstructedPages };
}

function mapTranslationsToBlocks(
  chunk: Chunk,
  translatedText: string
): Array<{ blockId: string; originalText: string; translatedText: string }> {
  const blocks = chunk.blocks;

  // Try to match by paragraph breaks
  const originalParagraphs = chunk.text.split(/\n\n+/);
  const translatedParagraphs = translatedText.split(/\n\n+/);

  // Group blocks by paragraph
  const paragraphBlocks: TextBlock[][] = [];
  let currentParagraph: TextBlock[] = [];
  let textAccumulator = '';

  for (const block of blocks) {
    currentParagraph.push(block);
    textAccumulator += block.text;

    // Check if we've completed a paragraph
    if (textAccumulator.trim().length >= originalParagraphs[paragraphBlocks.length]?.trim().length * 0.9) {
      paragraphBlocks.push(currentParagraph);
      currentParagraph = [];
      textAccumulator = '';
    }
  }

  if (currentParagraph.length > 0) {
    paragraphBlocks.push(currentParagraph);
  }

  // Map translations to block groups
  const mappings: Array<{ blockId: string; originalText: string; translatedText: string }> = [];

  for (let i = 0; i < paragraphBlocks.length; i++) {
    const blockGroup = paragraphBlocks[i];
    const translatedPara = translatedParagraphs[i] || '';

    // Distribute translated text proportionally across blocks in the group
    const totalOriginalLength = blockGroup.reduce((sum, b) => sum + b.text.length, 0);
    let translatedOffset = 0;

    for (const block of blockGroup) {
      const proportion = block.text.length / totalOriginalLength;
      const translatedLength = Math.ceil(translatedPara.length * proportion);
      const blockTranslation = translatedPara
        .slice(translatedOffset, translatedOffset + translatedLength)
        .trim();

      mappings.push({
        blockId: block.id,
        originalText: block.text,
        translatedText: blockTranslation || block.text, // Fallback to original if no translation
      });

      translatedOffset += translatedLength;
    }
  }

  // Handle any unmapped blocks
  for (const block of blocks) {
    if (!mappings.find((m) => m.blockId === block.id)) {
      mappings.push({
        blockId: block.id,
        originalText: block.text,
        translatedText: block.text, // Keep original
      });
    }
  }

  return mappings;
}

function createTextPlacement(
  block: TextBlock,
  translatedText: string,
  pageWidth: number
): TextPlacement {
  // Handle RTL to LTR conversion
  if (block.direction === 'rtl') {
    // Adjust x position for LTR text
    const estimatedWidth = translatedText.length * (block.fontInfo.size * 0.5);
    const newX = Math.max(36, block.boundingBox.x - block.boundingBox.width + 36);

    return {
      text: translatedText,
      x: newX,
      y: block.boundingBox.y,
      width: Math.min(estimatedWidth, pageWidth - 72),
      height: block.fontInfo.size * 1.2,
      fontSize: block.fontInfo.size,
      fontFamily: 'Helvetica',
      align: 'left',
    };
  }

  return {
    text: translatedText,
    x: block.boundingBox.x,
    y: block.boundingBox.y,
    width: block.boundingBox.width,
    height: block.fontInfo.size * 1.2,
    fontSize: block.fontInfo.size,
    fontFamily: 'Helvetica',
    align: 'left',
  };
}

// Get full translated text in reading order
export function getFullTranslatedText(
  chunks: Chunk[],
  translatedChunks: Map<string, TranslatedChunk>
): string {
  return chunks
    .sort((a, b) => a.index - b.index)
    .map((chunk) => {
      const translated = translatedChunks.get(chunk.id);
      return translated?.translatedText || '';
    })
    .filter((text) => text.length > 0)
    .join('\n\n');
}
