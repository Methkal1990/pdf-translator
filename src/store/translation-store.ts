import { create } from 'zustand';
import { JobStatus, SourceLanguage, TranslatedChunk } from '@/types/translation';
import { Chunk } from '@/types/chunk';

interface DocumentInfo {
  fileName: string;
  pageCount: number;
  totalBlocks: number;
  detectedLanguage: SourceLanguage | 'unknown';
  hasRTL: boolean;
}

interface ChunkPreview {
  id: string;
  index: number;
  pageRange: [number, number];
  tokenCount: number;
  preview: string;
  status: 'pending' | 'translating' | 'complete' | 'error';
  translatedText?: string;
}

interface TranslationProgress {
  chunksCompleted: number;
  totalChunks: number;
  tokensProcessed: number;
  totalTokens: number;
}

interface TranslationStore {
  // Job state
  jobId: string | null;
  jobStatus: JobStatus;
  sourceLanguage: SourceLanguage;

  // Document data
  documentInfo: DocumentInfo | null;

  // File state
  selectedFile: File | null;

  // Chunks
  chunks: ChunkPreview[];
  currentChunkIndex: number;
  streamingText: string;

  // Progress
  progress: TranslationProgress;

  // Error
  error: string | null;

  // Actions
  setSelectedFile: (file: File | null) => void;
  setSourceLanguage: (lang: SourceLanguage) => void;
  setJobId: (id: string) => void;
  setJobStatus: (status: JobStatus) => void;
  setDocumentInfo: (info: DocumentInfo) => void;
  setChunks: (chunks: ChunkPreview[]) => void;
  updateChunkStatus: (chunkId: string, status: ChunkPreview['status'], translatedText?: string) => void;
  setCurrentChunkIndex: (index: number) => void;
  appendStreamingText: (text: string) => void;
  clearStreamingText: () => void;
  updateProgress: (progress: Partial<TranslationProgress>) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  jobId: null,
  jobStatus: 'idle' as JobStatus,
  sourceLanguage: 'arabic' as SourceLanguage,
  documentInfo: null,
  selectedFile: null,
  chunks: [],
  currentChunkIndex: -1,
  streamingText: '',
  progress: {
    chunksCompleted: 0,
    totalChunks: 0,
    tokensProcessed: 0,
    totalTokens: 0,
  },
  error: null,
};

export const useTranslationStore = create<TranslationStore>((set) => ({
  ...initialState,

  setSelectedFile: (file) => set({ selectedFile: file }),

  setSourceLanguage: (lang) => set({ sourceLanguage: lang }),

  setJobId: (id) => set({ jobId: id }),

  setJobStatus: (status) => set({ jobStatus: status }),

  setDocumentInfo: (info) => set({ documentInfo: info }),

  setChunks: (chunks) =>
    set({
      chunks,
      progress: {
        chunksCompleted: 0,
        totalChunks: chunks.length,
        tokensProcessed: 0,
        totalTokens: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
      },
    }),

  updateChunkStatus: (chunkId, status, translatedText) =>
    set((state) => ({
      chunks: state.chunks.map((c) =>
        c.id === chunkId ? { ...c, status, translatedText: translatedText || c.translatedText } : c
      ),
      progress: {
        ...state.progress,
        chunksCompleted: state.chunks.filter(
          (c) => c.id === chunkId ? status === 'complete' : c.status === 'complete'
        ).length,
      },
    })),

  setCurrentChunkIndex: (index) => set({ currentChunkIndex: index }),

  appendStreamingText: (text) =>
    set((state) => ({ streamingText: state.streamingText + text })),

  clearStreamingText: () => set({ streamingText: '' }),

  updateProgress: (progress) =>
    set((state) => ({ progress: { ...state.progress, ...progress } })),

  setError: (error) => set({ error, jobStatus: error ? 'error' : 'idle' }),

  reset: () => set(initialState),
}));
