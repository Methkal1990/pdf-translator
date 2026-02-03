'use client';

import { useTranslationStore } from '@/store/translation-store';
import { SourceLanguage } from '@/types/translation';

const languages: { value: SourceLanguage; label: string; flag: string }[] = [
  { value: 'arabic', label: 'Arabic', flag: 'AR' },
  { value: 'turkish', label: 'Turkish', flag: 'TR' },
  { value: 'german', label: 'German', flag: 'DE' },
];

export function LanguageSelector() {
  const { sourceLanguage, setSourceLanguage, documentInfo } = useTranslationStore();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Source Language
        {documentInfo?.detectedLanguage && documentInfo.detectedLanguage !== 'unknown' && (
          <span className="ml-2 text-xs text-green-600">
            (Detected: {documentInfo.detectedLanguage})
          </span>
        )}
      </label>
      <div className="flex gap-3">
        {languages.map((lang) => (
          <button
            key={lang.value}
            onClick={() => setSourceLanguage(lang.value)}
            className={`
              flex-1 py-3 px-4 rounded-lg border-2 transition-all duration-200
              flex items-center justify-center gap-2
              ${sourceLanguage === lang.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }
            `}
          >
            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
              {lang.flag}
            </span>
            <span className="font-medium">{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
