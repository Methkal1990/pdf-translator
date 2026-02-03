'use client';

import { useTranslationStore } from '@/store/translation-store';

export function TranslationProgress() {
  const { chunks, progress, jobStatus, currentChunkIndex } = useTranslationStore();

  const percentComplete = progress.totalChunks > 0
    ? (progress.chunksCompleted / progress.totalChunks) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">
            {jobStatus === 'translating' ? 'Translating...' :
             jobStatus === 'complete' ? 'Translation Complete' :
             'Ready to translate'}
          </span>
          <span className="text-gray-500">
            {progress.chunksCompleted} / {progress.totalChunks} chunks
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              jobStatus === 'complete' ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {progress.tokensProcessed.toLocaleString()} / {progress.totalTokens.toLocaleString()} tokens processed
        </p>
      </div>

      {/* Chunk Status Grid */}
      <div className="grid grid-cols-10 gap-1">
        {chunks.map((chunk, index) => (
          <div
            key={chunk.id}
            title={`Chunk ${index + 1}: Pages ${chunk.pageRange[0]}-${chunk.pageRange[1]}`}
            className={`
              h-3 rounded-sm transition-all duration-200
              ${chunk.status === 'complete' ? 'bg-green-500' :
                chunk.status === 'translating' ? 'bg-blue-500 animate-pulse' :
                chunk.status === 'error' ? 'bg-red-500' :
                'bg-gray-200'}
            `}
          />
        ))}
      </div>

      {/* Current Chunk Info */}
      {currentChunkIndex >= 0 && currentChunkIndex < chunks.length && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-700">
            Currently translating chunk {currentChunkIndex + 1} of {chunks.length}
            <span className="ml-2 text-blue-500">
              (Pages {chunks[currentChunkIndex].pageRange[0]}-{chunks[currentChunkIndex].pageRange[1]})
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
