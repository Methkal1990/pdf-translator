import { Chunk } from '@/types/chunk';
import { SourceLanguage } from '@/types/translation';

export interface TranslationContext {
  systemPrompt: string;
  userPrompt: string;
}

export function buildTranslationContext(
  chunk: Chunk,
  sourceLanguage: SourceLanguage,
  options: {
    formalTone?: boolean;
    preserveFormatting?: boolean;
  } = {}
): TranslationContext {
  const { formalTone = true, preserveFormatting = true } = options;

  const languageNames: Record<SourceLanguage, string> = {
    arabic: 'Arabic',
    turkish: 'Turkish',
    german: 'German',
  };

  const systemPrompt = `You are an expert translator specializing in ${languageNames[sourceLanguage]} to English translation.

Your task is to translate the provided text while:
1. Preserving the exact meaning and nuance of the original
2. ${preserveFormatting ? 'Maintaining paragraph structure (keep paragraph breaks as double newlines)' : 'Creating fluent, readable English prose'}
3. ${preserveFormatting ? 'Preserving any formatting indicators (headers, lists, bullet points)' : 'Using natural English formatting'}
4. Using ${formalTone ? 'formal, professional' : 'natural, conversational'} English tone
5. Handling technical terms and proper nouns appropriately (transliterate when no standard translation exists)

CRITICAL RULES:
- Output ONLY the translation, no explanations, notes, or commentary
- Do NOT add any text that wasn't in the original
- Do NOT include phrases like "Here is the translation:" or similar
- Preserve any numbers, dates, and special characters exactly as they appear
- If you encounter text that cannot be translated, leave it as-is`;

  let userPrompt = '';

  // Add context from previous chunk for continuity
  if (chunk.previousContext) {
    userPrompt += `[CONTEXT - Previous text for continuity, already translated - DO NOT translate this again]:
"${chunk.previousContext}"

---

`;
  }

  userPrompt += `[TEXT TO TRANSLATE]:
${chunk.text}`;

  // Add hint about what comes next
  if (chunk.nextContext) {
    userPrompt += `

---

[CONTEXT - Following text for reference only - DO NOT translate this]:
"${chunk.nextContext}"`;
  }

  // Add metadata hints
  if (chunk.metadata.isFirstChunk) {
    userPrompt = `[NOTE: This is the beginning of the document]\n\n` + userPrompt;
  }

  if (chunk.metadata.isLastChunk) {
    userPrompt += `\n\n[NOTE: This is the end of the document]`;
  }

  return { systemPrompt, userPrompt };
}

// Build a shorter prompt for quick translation checks
export function buildQuickTranslationPrompt(
  text: string,
  sourceLanguage: SourceLanguage
): TranslationContext {
  const languageNames: Record<SourceLanguage, string> = {
    arabic: 'Arabic',
    turkish: 'Turkish',
    german: 'German',
  };

  return {
    systemPrompt: `Translate the following ${languageNames[sourceLanguage]} text to English. Output only the translation, nothing else.`,
    userPrompt: text,
  };
}
