'use client';

import { useCallback, useState } from 'react';
import { useTranslationStore } from '@/store/translation-store';

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const { selectedFile, setSelectedFile, setError } = useTranslationStore();

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }

      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        setError('File size exceeds 100MB limit');
        return;
      }

      setError(null);
      setSelectedFile(file);
    },
    [setSelectedFile, setError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-all duration-200
        ${isDragging
          ? 'border-blue-500 bg-blue-50'
          : selectedFile
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
        }
      `}
    >
      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <div className="flex flex-col items-center gap-4">
        {selectedFile ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove file
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse (max 100MB)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
