import { streamText } from 'ai';
import { Chunk } from '@/types/chunk';
import { TranslationEvent, SourceLanguage, TranslationOptions } from '@/types/translation';
import { getModel } from '@/lib/ai/openrouter';
import { buildTranslationContext } from '@/lib/chunking/context-builder';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export async function* translateChunk(
  chunk: Chunk,
  sourceLanguage: SourceLanguage,
  options: TranslationOptions = { preserveFormatting: true, formalTone: true }
): AsyncGenerator<TranslationEvent> {
  const model = getModel();
  const { systemPrompt, userPrompt } = buildTranslationContext(
    chunk,
    sourceLanguage,
    options
  );

  yield {
    type: 'chunk_start',
    chunkId: chunk.id,
    index: chunk.index,
  };

  let fullTranslation = '';
  let tokensUsed = 0;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const result = streamText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
      });

      for await (const textPart of result.textStream) {
        fullTranslation += textPart;
        yield {
          type: 'token',
          chunkId: chunk.id,
          token: textPart,
        };
      }

      // Get final usage info
      const usage = await result.usage;
      tokensUsed = usage?.totalTokens || 0;

      // Success - exit retry loop
      break;
    } catch (error) {
      retries++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (retries >= MAX_RETRIES) {
        yield {
          type: 'error',
          chunkId: chunk.id,
          error: `Failed after ${MAX_RETRIES} attempts: ${errorMessage}`,
        };
        throw error;
      }

      yield {
        type: 'retry',
        chunkId: chunk.id,
        attempt: retries,
        error: errorMessage,
      };

      // Exponential backoff
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      fullTranslation = ''; // Reset for retry
    }
  }

  yield {
    type: 'chunk_complete',
    chunkId: chunk.id,
    translation: fullTranslation,
    tokensUsed,
  };
}

export async function translateChunks(
  chunks: Chunk[],
  sourceLanguage: SourceLanguage,
  options: TranslationOptions,
  onEvent: (event: TranslationEvent) => void
): Promise<Map<string, string>> {
  const translations = new Map<string, string>();

  for (const chunk of chunks) {
    try {
      for await (const event of translateChunk(chunk, sourceLanguage, options)) {
        onEvent(event);

        if (event.type === 'chunk_complete' && event.translation) {
          translations.set(chunk.id, event.translation);
        }
      }
    } catch {
      // Error already yielded, continue with next chunk
      continue;
    }
  }

  onEvent({
    type: 'complete',
    totalChunks: chunks.length,
  });

  return translations;
}
