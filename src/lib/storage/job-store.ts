import { TranslationJob, SourceLanguage, TranslatedChunk } from '@/types/translation';
import { Chunk } from '@/types/chunk';
import { ParsedDocument } from '@/types/pdf';

// In-memory job store (for production, use Redis or a database)
const jobs = new Map<string, TranslationJob>();

// Store uploaded files temporarily
const fileStore = new Map<string, ArrayBuffer>();

export function createJob(
  id: string,
  fileName: string,
  sourceLanguage: SourceLanguage
): TranslationJob {
  const job: TranslationJob = {
    id,
    fileName,
    sourceLanguage,
    status: 'uploading',
    chunks: [],
    translatedChunks: new Map(),
    progress: {
      chunksCompleted: 0,
      totalChunks: 0,
      tokensProcessed: 0,
      totalTokens: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  jobs.set(id, job);
  return job;
}

export function getJob(id: string): TranslationJob | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, updates: Partial<TranslationJob>): TranslationJob | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;

  const updatedJob = {
    ...job,
    ...updates,
    updatedAt: new Date(),
  };

  jobs.set(id, updatedJob);
  return updatedJob;
}

export function setJobChunks(id: string, chunks: Chunk[], totalTokens: number): TranslationJob | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;

  job.chunks = chunks;
  job.status = 'chunking';
  job.progress.totalChunks = chunks.length;
  job.progress.totalTokens = totalTokens;
  job.updatedAt = new Date();

  jobs.set(id, job);
  return job;
}

export function addTranslatedChunk(id: string, translatedChunk: TranslatedChunk): TranslationJob | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;

  job.translatedChunks.set(translatedChunk.chunkId, translatedChunk);
  job.progress.chunksCompleted = job.translatedChunks.size;
  job.progress.tokensProcessed += translatedChunk.tokensUsed;
  job.updatedAt = new Date();

  // Check if all chunks are translated
  if (job.translatedChunks.size === job.chunks.length) {
    job.status = 'complete';
  }

  jobs.set(id, job);
  return job;
}

export function setJobError(id: string, error: string): TranslationJob | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;

  job.status = 'error';
  job.error = error;
  job.updatedAt = new Date();

  jobs.set(id, job);
  return job;
}

export function storeFile(jobId: string, buffer: ArrayBuffer): void {
  fileStore.set(jobId, buffer);
}

export function getFile(jobId: string): ArrayBuffer | undefined {
  return fileStore.get(jobId);
}

export function deleteFile(jobId: string): void {
  fileStore.delete(jobId);
}

export function deleteJob(id: string): void {
  jobs.delete(id);
  fileStore.delete(id);
}

// Get all translations as a combined string
export function getFullTranslation(job: TranslationJob): string {
  const sortedChunks = [...job.chunks].sort((a, b) => a.index - b.index);

  return sortedChunks
    .map((chunk) => {
      const translated = job.translatedChunks.get(chunk.id);
      return translated?.translatedText || '';
    })
    .filter((text) => text.length > 0)
    .join('\n\n');
}

// Serialize job for JSON response (Map -> Object)
export function serializeJob(job: TranslationJob): Record<string, unknown> {
  return {
    ...job,
    translatedChunks: Object.fromEntries(job.translatedChunks),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}
