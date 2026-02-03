'use client';

import { DropZone } from '@/components/upload/DropZone';
import { LanguageSelector } from '@/components/upload/LanguageSelector';
import { useUpload } from '@/hooks/useUpload';
import { useTranslationStore } from '@/store/translation-store';

export default function Home() {
  const { selectedFile, error } = useTranslationStore();
  const { uploadAndParse, isUploading } = useUpload();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PDF Translator
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Translate PDF documents from Arabic, Turkish, or German to English
            using AI. Preserves layout and formatting.
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-8">
          {/* Upload Section */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              1. Upload your PDF
            </h2>
            <DropZone />
          </section>

          {/* Language Selection */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              2. Select source language
            </h2>
            <LanguageSelector />
          </section>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Translate Button */}
          <button
            onClick={uploadAndParse}
            disabled={!selectedFile || isUploading}
            className={`
              w-full py-4 px-6 rounded-xl text-lg font-semibold
              transition-all duration-200 flex items-center justify-center gap-3
              ${selectedFile && !isUploading
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isUploading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                Start Translation
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
            <ul className="text-blue-800 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">1.</span>
                <span>Upload your PDF document (up to 100MB)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">2.</span>
                <span>The document is analyzed and split into manageable chunks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">3.</span>
                <span>AI translates each chunk while maintaining context</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">4.</span>
                <span>Download your translated document as PDF or Word</span>
              </li>
            </ul>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>Powered by AI translation. Layout preservation may vary.</p>
        </footer>
      </div>
    </div>
  );
}
