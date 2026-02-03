'use client';

import { useTranslationStore } from '@/store/translation-store';

export function StreamingText() {
  const { streamingText, currentChunkIndex, chunks, jobStatus } = useTranslationStore();

  if (jobStatus !== 'translating' && jobStatus !== 'complete') {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {jobStatus === 'complete' ? 'Translation Preview' : 'Live Translation'}
      </h3>

      <div className="h-96 overflow-y-auto bg-white rounded-lg border border-gray-200 p-4">
        {jobStatus === 'translating' && currentChunkIndex >= 0 ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">
              {streamingText}
              <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse" />
            </p>
          </div>
        ) : jobStatus === 'complete' ? (
          <div className="prose prose-sm max-w-none space-y-4">
            {chunks
              .filter((c) => c.translatedText)
              .map((chunk) => (
                <div key={chunk.id} className="pb-4 border-b border-gray-100 last:border-0">
                  <p className="text-xs text-gray-400 mb-2">
                    Chunk {chunk.index + 1} (Pages {chunk.pageRange[0]}-{chunk.pageRange[1]})
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap">{chunk.translatedText}</p>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-400 italic">Translation will appear here...</p>
        )}
      </div>
    </div>
  );
}
