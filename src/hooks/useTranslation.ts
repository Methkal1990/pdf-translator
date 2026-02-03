'use client';

import { useCallback, useRef } from 'react';
import { useTranslationStore } from '@/store/translation-store';

export function useTranslation() {
  const {
    jobId,
    sourceLanguage,
    setJobStatus,
    updateChunkStatus,
    setCurrentChunkIndex,
    appendStreamingText,
    clearStreamingText,
    chunks,
    setError,
  } = useTranslationStore();

  const abortControllerRef = useRef<AbortController | null>(null);

  const startTranslation = useCallback(async () => {
    if (!jobId) return;

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    setJobStatus('translating');
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          options: {
            preserveFormatting: true,
            formalTone: true,
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to start translation');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            continue; // Event type line
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'chunk_start':
                  setCurrentChunkIndex(data.index);
                  clearStreamingText();
                  updateChunkStatus(data.chunkId, 'translating');
                  break;

                case 'token':
                  appendStreamingText(data.token);
                  break;

                case 'chunk_complete':
                  updateChunkStatus(data.chunkId, 'complete', data.translation);
                  break;

                case 'error':
                  updateChunkStatus(data.chunkId, 'error');
                  console.error('Translation error:', data.error);
                  break;

                case 'complete':
                  setJobStatus('complete');
                  setCurrentChunkIndex(-1);
                  break;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Translation cancelled');
        return;
      }

      console.error('Translation error:', error);
      setError(error instanceof Error ? error.message : 'Translation failed');
      setJobStatus('error');
    }
  }, [
    jobId,
    setJobStatus,
    updateChunkStatus,
    setCurrentChunkIndex,
    appendStreamingText,
    clearStreamingText,
    setError,
  ]);

  const cancelTranslation = useCallback(() => {
    abortControllerRef.current?.abort();
    setJobStatus('idle');
  }, [setJobStatus]);

  return {
    startTranslation,
    cancelTranslation,
  };
}
