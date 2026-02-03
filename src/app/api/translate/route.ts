import { NextRequest } from 'next/server';
import { getJob, updateJob, addTranslatedChunk } from '@/lib/storage/job-store';
import { translateChunk } from '@/lib/translation/translator';
import { TranslationEvent, TranslatedChunk } from '@/types/translation';

export async function POST(request: NextRequest) {
  try {
    const { jobId, chunkId, options = {} } = await request.json();

    if (!jobId) {
      return new Response(JSON.stringify({ error: 'Job ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const job = getJob(jobId);
    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get chunks to translate
    const chunksToTranslate = chunkId
      ? job.chunks.filter((c) => c.id === chunkId)
      : job.chunks.filter((c) => !job.translatedChunks.has(c.id));

    if (chunksToTranslate.length === 0) {
      return new Response(JSON.stringify({ error: 'No chunks to translate' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update job status
    updateJob(jobId, { status: 'translating' });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: TranslationEvent) => {
          const sseMessage = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));
        };

        for (const chunk of chunksToTranslate) {
          let fullTranslation = '';
          let tokensUsed = 0;

          try {
            for await (const event of translateChunk(
              chunk,
              job.sourceLanguage,
              {
                preserveFormatting: options.preserveFormatting ?? true,
                formalTone: options.formalTone ?? true,
              }
            )) {
              sendEvent(event);

              // Accumulate translation
              if (event.type === 'token' && event.token) {
                fullTranslation += event.token;
              }

              if (event.type === 'chunk_complete') {
                tokensUsed = event.tokensUsed || 0;

                // Store translated chunk
                const translatedChunk: TranslatedChunk = {
                  chunkId: chunk.id,
                  originalText: chunk.text,
                  translatedText: event.translation || fullTranslation,
                  tokensUsed,
                  blockMappings: [], // Would need more sophisticated mapping
                };

                addTranslatedChunk(jobId, translatedChunk);
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            sendEvent({
              type: 'error',
              chunkId: chunk.id,
              error: errorMessage,
            });
          }
        }

        // Send completion event
        const updatedJob = getJob(jobId);
        sendEvent({
          type: 'complete',
          jobId,
          totalChunks: job.chunks.length,
        });

        // Update job status if all chunks are translated
        if (updatedJob && updatedJob.translatedChunks.size === updatedJob.chunks.length) {
          updateJob(jobId, { status: 'complete' });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to start translation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
