import { SourceLanguage } from '@/types/translation';

// Character ranges for language detection
const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
const TURKISH_CHARS = /[çÇğĞıİöÖşŞüÜ]/g;
const GERMAN_CHARS = /[äÄöÖüÜß]/g;

export function detectLanguage(text: string): SourceLanguage | 'unknown' {
  const sample = text.slice(0, 1000); // Use first 1000 characters

  // Count Arabic characters
  const arabicMatches = sample.match(ARABIC_RANGE);
  const arabicCount = arabicMatches ? arabicMatches.length : 0;

  // If more than 20% Arabic characters, it's Arabic
  if (arabicCount > sample.length * 0.2) {
    return 'arabic';
  }

  // Count Turkish-specific characters
  const turkishMatches = sample.match(TURKISH_CHARS);
  const turkishCount = turkishMatches ? turkishMatches.length : 0;

  // Count German-specific characters
  const germanMatches = sample.match(GERMAN_CHARS);
  const germanCount = germanMatches ? germanMatches.length : 0;

  // Check for Turkish-specific patterns
  const hasTurkishPatterns = /\b(ve|bir|bu|için|ile|olan|olarak)\b/i.test(sample);

  // Check for German-specific patterns
  const hasGermanPatterns = /\b(und|der|die|das|ist|ein|eine|auf|mit|für)\b/i.test(sample);

  if (turkishCount > germanCount || (hasTurkishPatterns && turkishCount >= germanCount)) {
    return 'turkish';
  }

  if (germanCount > 0 || hasGermanPatterns) {
    return 'german';
  }

  // If no clear indicators, check for Turkish word patterns more aggressively
  if (hasTurkishPatterns) {
    return 'turkish';
  }

  if (hasGermanPatterns) {
    return 'german';
  }

  return 'unknown';
}

export function getLanguageDisplayName(lang: SourceLanguage | 'unknown'): string {
  const names: Record<SourceLanguage | 'unknown', string> = {
    arabic: 'Arabic',
    turkish: 'Turkish',
    german: 'German',
    unknown: 'Unknown',
  };
  return names[lang];
}
