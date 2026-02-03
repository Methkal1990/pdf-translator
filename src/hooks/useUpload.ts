'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslationStore } from '@/store/translation-store';

export function useUpload() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const {
    selectedFile,
    sourceLanguage,
    setJobId,
    setJobStatus,
    setDocumentInfo,
    setChunks,
    setError,
  } = useTranslationStore();

  const uploadAndParse = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setJobStatus('uploading');

    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sourceLanguage', sourceLanguage);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.error || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      setJobId(uploadData.jobId);

      // Parse PDF
      setJobStatus('parsing');

      const parseResponse = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: uploadData.jobId }),
      });

      if (!parseResponse.ok) {
        const data = await parseResponse.json();
        throw new Error(data.error || 'Parsing failed');
      }

      const parseData = await parseResponse.json();

      // Update store with document info
      setDocumentInfo({
        fileName: selectedFile.name,
        pageCount: parseData.parsing.pageCount,
        totalBlocks: parseData.parsing.blockCount,
        detectedLanguage: parseData.parsing.detectedLanguage,
        hasRTL: parseData.parsing.hasRTL,
      });

      // Update chunks with preview data
      setChunks(
        parseData.chunks.map((chunk: { id: string; index: number; pageRange: [number, number]; tokenCount: number; preview: string }) => ({
          ...chunk,
          status: 'pending' as const,
        }))
      );

      setJobStatus('chunking');

      // Navigate to translation page
      router.push(`/translate/${uploadData.jobId}`);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      setJobStatus('error');
    } finally {
      setIsUploading(false);
    }
  }, [
    selectedFile,
    sourceLanguage,
    setJobId,
    setJobStatus,
    setDocumentInfo,
    setChunks,
    setError,
    router,
  ]);

  return {
    uploadAndParse,
    isUploading,
  };
}
