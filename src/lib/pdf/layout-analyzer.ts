import { TextBlock, PageData } from '@/types/pdf';

interface LineGroup {
  y: number;
  blocks: TextBlock[];
  averageFontSize: number;
}

// Analyze page layout and refine block types
export function analyzePageLayout(page: PageData): PageData {
  const blocks = [...page.blocks];

  // Group blocks by approximate Y position (same line)
  const lines = groupBlocksIntoLines(blocks, page.height);

  // Identify headers, paragraphs, etc.
  const analyzedBlocks = lines.flatMap((line) => analyzeLineBlocks(line, page));

  return {
    ...page,
    blocks: analyzedBlocks,
  };
}

function groupBlocksIntoLines(blocks: TextBlock[], pageHeight: number): LineGroup[] {
  const lineThreshold = 5; // Pixels tolerance for same line
  const groups: LineGroup[] = [];

  // Sort blocks by Y position
  const sortedBlocks = [...blocks].sort((a, b) => a.boundingBox.y - b.boundingBox.y);

  for (const block of sortedBlocks) {
    // Find existing line group within threshold
    const existingGroup = groups.find(
      (g) => Math.abs(g.y - block.boundingBox.y) < lineThreshold
    );

    if (existingGroup) {
      existingGroup.blocks.push(block);
      // Update average font size
      const totalSize = existingGroup.blocks.reduce((sum, b) => sum + b.fontInfo.size, 0);
      existingGroup.averageFontSize = totalSize / existingGroup.blocks.length;
    } else {
      groups.push({
        y: block.boundingBox.y,
        blocks: [block],
        averageFontSize: block.fontInfo.size,
      });
    }
  }

  // Sort blocks within each line by X position
  for (const group of groups) {
    group.blocks.sort((a, b) => a.boundingBox.x - b.boundingBox.x);
  }

  return groups;
}

function analyzeLineBlocks(line: LineGroup, page: PageData): TextBlock[] {
  const pageWidth = page.width;
  const allBlocks = page.blocks;

  // Calculate average font size for the page
  const pageFontSizes = allBlocks.map((b) => b.fontInfo.size);
  const avgPageFontSize = pageFontSizes.reduce((a, b) => a + b, 0) / pageFontSizes.length;

  // Check if this line is likely a header
  const isLargerFont = line.averageFontSize > avgPageFontSize * 1.2;
  const isAtTop = line.y < page.height * 0.15;
  const isCentered = line.blocks.every((b) => {
    const blockCenter = b.boundingBox.x + b.boundingBox.width / 2;
    return Math.abs(blockCenter - pageWidth / 2) < pageWidth * 0.2;
  });

  // Check if this is a footer
  const isAtBottom = line.y > page.height * 0.9;
  const isSmallFont = line.averageFontSize < avgPageFontSize * 0.8;

  // Determine block types
  return line.blocks.map((block) => {
    let type: TextBlock['type'] = 'paragraph';

    if (isAtBottom && isSmallFont) {
      type = 'footer';
    } else if (isLargerFont || (isAtTop && isCentered)) {
      type = 'header';
    } else if (isListItem(block.text)) {
      type = 'list-item';
    }

    return { ...block, type };
  });
}

function isListItem(text: string): boolean {
  // Check for common list patterns
  const listPatterns = [
    /^[\d]+[.)]\s/, // 1. or 1)
    /^[•●○◦▪▫]\s/, // Bullet points
    /^[-–—]\s/, // Dashes
    /^[a-zA-Z][.)]\s/, // a. or a)
    /^[ivxIVX]+[.)]\s/, // Roman numerals
  ];

  return listPatterns.some((pattern) => pattern.test(text.trim()));
}

// Merge adjacent blocks into paragraphs
export function mergeBlocksIntoParagraphs(blocks: TextBlock[]): TextBlock[] {
  if (blocks.length === 0) return [];

  const merged: TextBlock[] = [];
  let currentParagraph: TextBlock | null = null;

  const sortedBlocks = [...blocks].sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
    if (Math.abs(a.boundingBox.y - b.boundingBox.y) > 15) {
      return a.boundingBox.y - b.boundingBox.y;
    }
    return a.boundingBox.x - b.boundingBox.x;
  });

  for (const block of sortedBlocks) {
    if (!currentParagraph) {
      currentParagraph = { ...block };
      continue;
    }

    // Check if block should be merged with current paragraph
    const verticalGap = block.boundingBox.y -
      (currentParagraph.boundingBox.y + currentParagraph.boundingBox.height);
    const samePage = block.pageNumber === currentParagraph.pageNumber;
    const sameFont = Math.abs(block.fontInfo.size - currentParagraph.fontInfo.size) < 1;
    const sameType = block.type === currentParagraph.type;

    const shouldMerge = samePage && sameFont && sameType &&
      verticalGap < block.fontInfo.size * 2;

    if (shouldMerge) {
      // Merge blocks
      currentParagraph.text += ' ' + block.text;
      currentParagraph.boundingBox.width = Math.max(
        currentParagraph.boundingBox.width,
        block.boundingBox.x + block.boundingBox.width - currentParagraph.boundingBox.x
      );
      currentParagraph.boundingBox.height =
        block.boundingBox.y + block.boundingBox.height - currentParagraph.boundingBox.y;
    } else {
      // Start new paragraph
      merged.push(currentParagraph);
      currentParagraph = { ...block };
    }
  }

  if (currentParagraph) {
    merged.push(currentParagraph);
  }

  return merged;
}

// Get text from all blocks as a single string with paragraph breaks
export function getDocumentText(pages: PageData[]): string {
  return pages
    .flatMap((page) =>
      page.blocks
        .sort((a, b) => a.boundingBox.y - b.boundingBox.y)
        .map((block) => block.text)
    )
    .join('\n\n');
}
