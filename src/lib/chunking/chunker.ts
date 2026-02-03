import { TextBlock, PageData, ParsedDocument } from '@/types/pdf';
import { Chunk, ChunkingResult, ChunkingOptions, DEFAULT_CHUNKING_OPTIONS } from '@/types/chunk';
import { countTokens, getFirstNTokens, getLastNTokens } from '@/lib/utils/token-counter';
import { mergeBlocksIntoParagraphs } from '@/lib/pdf/layout-analyzer';
import { v4 as uuidv4 } from 'uuid';

export function chunkDocument(
  document: ParsedDocument,
  options: Partial<ChunkingOptions> = {}
): ChunkingResult {
  const opts: ChunkingOptions = { ...DEFAULT_CHUNKING_OPTIONS, ...options };

  // Merge blocks into logical paragraphs
  const allBlocks = document.pages.flatMap((page) => page.blocks);
  const mergedBlocks = mergeBlocksIntoParagraphs(allBlocks);

  // Create chunks from merged blocks
  const chunks = createChunks(mergedBlocks, opts);

  // Add overlap and context
  addOverlapAndContext(chunks, opts);

  // Calculate total tokens
  const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);

  return {
    chunks,
    totalTokens,
    documentMetadata: {
      pageCount: document.pageCount,
      detectedLanguage: document.detectedLanguage,
      hasRTL: document.hasRTL,
    },
  };
}

function createChunks(blocks: TextBlock[], options: ChunkingOptions): Chunk[] {
  const chunks: Chunk[] = [];
  let currentBlocks: TextBlock[] = [];
  let currentTokenCount = 0;
  let chunkIndex = 0;

  for (const block of blocks) {
    const blockTokens = countTokens(block.text);

    // Check if adding this block would exceed limit
    if (currentTokenCount + blockTokens > options.maxTokensPerChunk && currentBlocks.length > 0) {
      // Finalize current chunk
      chunks.push(createChunk(currentBlocks, chunkIndex));
      chunkIndex++;
      currentBlocks = [];
      currentTokenCount = 0;
    }

    // Handle blocks that exceed max tokens by themselves
    if (blockTokens > options.maxTokensPerChunk) {
      // Split large block into sentences
      const sentences = splitIntoSentences(block.text);
      let sentenceGroup: string[] = [];
      let groupTokens = 0;

      for (const sentence of sentences) {
        const sentenceTokens = countTokens(sentence);

        if (groupTokens + sentenceTokens > options.maxTokensPerChunk && sentenceGroup.length > 0) {
          // Create a chunk from sentence group
          const syntheticBlock: TextBlock = {
            ...block,
            id: uuidv4(),
            text: sentenceGroup.join(' '),
          };
          chunks.push(createChunk([syntheticBlock], chunkIndex));
          chunkIndex++;
          sentenceGroup = [];
          groupTokens = 0;
        }

        sentenceGroup.push(sentence);
        groupTokens += sentenceTokens;
      }

      // Add remaining sentences
      if (sentenceGroup.length > 0) {
        const syntheticBlock: TextBlock = {
          ...block,
          id: uuidv4(),
          text: sentenceGroup.join(' '),
        };
        currentBlocks.push(syntheticBlock);
        currentTokenCount += groupTokens;
      }
    } else {
      currentBlocks.push(block);
      currentTokenCount += blockTokens;
    }
  }

  // Finalize last chunk
  if (currentBlocks.length > 0) {
    chunks.push(createChunk(currentBlocks, chunkIndex));
  }

  return chunks;
}

function createChunk(blocks: TextBlock[], index: number): Chunk {
  const text = blocks.map((b) => b.text).join('\n\n');
  const pageNumbers = [...new Set(blocks.map((b) => b.pageNumber))];

  return {
    id: uuidv4(),
    index,
    blocks,
    text,
    tokenCount: countTokens(text),
    pageRange: [Math.min(...pageNumbers), Math.max(...pageNumbers)],
    metadata: {
      isFirstChunk: false, // Will be set later
      isLastChunk: false,
      hasOverlapWithPrevious: false,
      hasOverlapWithNext: false,
      overlapBlockIds: [],
    },
  };
}

function addOverlapAndContext(chunks: Chunk[], options: ChunkingOptions): void {
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Set first/last flags
    chunk.metadata.isFirstChunk = i === 0;
    chunk.metadata.isLastChunk = i === chunks.length - 1;

    // Add context from previous chunk
    if (i > 0) {
      const prevChunk = chunks[i - 1];
      chunk.previousContext = getLastNTokens(prevChunk.text, options.contextTokens);
      chunk.metadata.hasOverlapWithPrevious = true;
    }

    // Add context from next chunk
    if (i < chunks.length - 1) {
      const nextChunk = chunks[i + 1];
      chunk.nextContext = getFirstNTokens(nextChunk.text, options.contextTokens);
      chunk.metadata.hasOverlapWithNext = true;
    }
  }
}

function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space and capital letter
  // Also handles Arabic question mark (؟) and other punctuation
  const sentencePattern = /([.!?؟]+)\s+(?=[A-Z\u0600-\u06FF])/g;

  const sentences: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = sentencePattern.exec(text)) !== null) {
    sentences.push(text.slice(lastIndex, match.index + match[1].length).trim());
    lastIndex = match.index + match[0].length - 1;
  }

  // Add remaining text
  const remaining = text.slice(lastIndex).trim();
  if (remaining) {
    sentences.push(remaining);
  }

  // If no sentences found, return the whole text
  if (sentences.length === 0) {
    return [text];
  }

  return sentences.filter((s) => s.length > 0);
}

// Get a preview of chunks for display
export function getChunkPreviews(chunks: Chunk[]): Array<{
  id: string;
  index: number;
  pageRange: [number, number];
  tokenCount: number;
  preview: string;
}> {
  return chunks.map((chunk) => ({
    id: chunk.id,
    index: chunk.index,
    pageRange: chunk.pageRange,
    tokenCount: chunk.tokenCount,
    preview: chunk.text.slice(0, 150) + (chunk.text.length > 150 ? '...' : ''),
  }));
}
