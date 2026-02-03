import { Chunk } from './chunk';

export type SourceLanguage = 'arabic' | 'turkish' | 'german';
export type JobStatus = 'idle' | 'uploading' | 'parsing' | 'chunking' | 'translating' | 'complete' | 'error';
export type ChunkStatus = 'pending' | 'translating' | 'complete' | 'error';

export interface TranslationOptions {
  preserveFormatting: boolean;
  formalTone: boolean;
}

export interface TranslatedChunk {
  chunkId: string;
  originalText: string;
  translatedText: string;
  tokensUsed: number;
  blockMappings: BlockMapping[];
}

export interface BlockMapping {
  blockId: string;
  originalText: string;
  translatedText: string;
}

export interface TranslationJob {
  id: string;
  fileName: string;
  sourceLanguage: SourceLanguage;
  status: JobStatus;
  chunks: Chunk[];
  translatedChunks: Map<string, TranslatedChunk>;
  progress: {
    chunksCompleted: number;
    totalChunks: number;
    tokensProcessed: number;
    totalTokens: number;
  };
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

export interface TranslationEvent {
  type: 'chunk_start' | 'token' | 'chunk_complete' | 'error' | 'retry' | 'complete';
  chunkId?: string;
  index?: number;
  token?: string;
  translation?: string;
  tokensUsed?: number;
  error?: string;
  attempt?: number;
  jobId?: string;
  totalChunks?: number;
}
