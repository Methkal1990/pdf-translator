'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TranslationProgress } from '@/components/translation/TranslationProgress';
import { StreamingText } from '@/components/translation/StreamingText';
import { ExportOptions } from '@/components/export/ExportOptions';
import { useTranslation } from '@/hooks/useTranslation';
import { useTranslationStore } from '@/store/translation-store';

export default function TranslatePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const {
    jobStatus,
    documentInfo,
    error,
    chunks,
    sourceLanguage,
    setJobId,
    reset,
  } = useTranslationStore();

  const { startTranslation, cancelTranslation } = useTranslation();

  // Set job ID from URL if navigated directly
  useEffect(() => {
    if (jobId) {
      setJobId(jobId);
    }
  }, [jobId, setJobId]);

  const handleStartTranslation = async () => {
    await startTranslation();
  };

  const handleGoBack = () => {
    reset();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Translation</h1>
            {documentInfo && (
              <p className="text-gray-600 mt-1">
                {documentInfo.fileName} ({documentInfo.pageCount} pages)
              </p>
            )}
          </div>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          {/* Document Info */}
          {documentInfo && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Pages</p>
                  <p className="text-xl font-semibold text-gray-900">{documentInfo.pageCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Chunks</p>
                  <p className="text-xl font-semibold text-gray-900">{chunks.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="text-xl font-semibold text-gray-900 capitalize">{sourceLanguage}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target</p>
                  <p className="text-xl font-semibold text-gray-900">English</p>
                </div>
              </div>
            </section>
          )}

          {/* Progress Section */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <TranslationProgress />
          </section>

          {/* Translation Controls */}
          {jobStatus !== 'translating' && jobStatus !== 'complete' && (
            <button
              onClick={handleStartTranslation}
              disabled={!jobId || chunks.length === 0}
              className={`
                w-full py-4 px-6 rounded-xl text-lg font-semibold
                transition-all duration-200 flex items-center justify-center gap-3
                ${jobId && chunks.length > 0
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Translation
            </button>
          )}

          {jobStatus === 'translating' && (
            <button
              onClick={cancelTranslation}
              className="w-full py-4 px-6 rounded-xl text-lg font-semibold bg-red-100 hover:bg-red-200 text-red-700 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel Translation
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Streaming Text Preview */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <StreamingText />
          </section>

          {/* Export Options */}
          {jobStatus === 'complete' && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <ExportOptions />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
