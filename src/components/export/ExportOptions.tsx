'use client';

import { useState } from 'react';
import { useTranslationStore } from '@/store/translation-store';

export function ExportOptions() {
  const { jobId, jobStatus, chunks } = useTranslationStore();
  const [isExporting, setIsExporting] = useState<'pdf' | 'docx' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canExport = jobStatus === 'complete' && chunks.every((c) => c.status === 'complete');

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!jobId || !canExport) return;

    setIsExporting(format);
    setError(null);

    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          options: {
            preserveLayout: true,
            includeOriginal: false,
            paperSize: 'A4',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `translated-document.${format}`;

      // Create blob and download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(null);
    }
  };

  if (!canExport && jobStatus !== 'complete') {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Export Translation</h3>

      <div className="flex gap-4">
        <button
          onClick={() => handleExport('pdf')}
          disabled={!canExport || isExporting !== null}
          className={`
            flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200
            flex items-center justify-center gap-2
            ${canExport && !isExporting
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isExporting === 'pdf' ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9v6H8v-6h2zm4 0v6h-2v-6h2zm4 0v6h-2v-6h2z" />
              </svg>
              Download PDF
            </>
          )}
        </button>

        <button
          onClick={() => handleExport('docx')}
          disabled={!canExport || isExporting !== null}
          className={`
            flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200
            flex items-center justify-center gap-2
            ${canExport && !isExporting
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isExporting === 'docx' ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM9 13v2h6v-2H9zm0 4v2h4v-2H9z" />
              </svg>
              Download Word
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
