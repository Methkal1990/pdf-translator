import { TextBlock } from './pdf';

export interface Chunk {
  id: string;
  index: number;
  blocks: TextBlock[];
  text: string;
  tokenCount: number;
  pageRange: [number, number];

  // Context for coherent translation
  previousContext?: string;
  nextContext?: string;

  // Metadata for reconstruction
  metadata: {
    isFirstChunk: boolean;
    isLastChunk: boolean;
    hasOverlapWithPrevious: boolean;
    hasOverlapWithNext: boolean;
    overlapBlockIds: string[];
  };
}

export interface ChunkingResult {
  chunks: Chunk[];
  totalTokens: number;
  documentMetadata: {
    pageCount: number;
    detectedLanguage: string;
    hasRTL: boolean;
  };
}

export interface ChunkingOptions {
  maxTokensPerChunk: number;
  overlapTokens: number;
  contextTokens: number;
}

export const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  maxTokensPerChunk: 3000,
  overlapTokens: 150,
  contextTokens: 100,
};
