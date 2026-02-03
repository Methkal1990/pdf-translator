import { NextRequest, NextResponse } from 'next/server';
import { getJob, getFile, updateJob, setJobChunks } from '@/lib/storage/job-store';
import { parsePDF } from '@/lib/pdf/parser';
import { analyzePageLayout } from '@/lib/pdf/layout-analyzer';
import { chunkDocument, getChunkPreviews } from '@/lib/chunking/chunker';

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const job = getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const fileBuffer = getFile(jobId);
    if (!fileBuffer) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Update job status
    updateJob(jobId, { status: 'parsing' });

    // Parse PDF
    const parsedDoc = await parsePDF(fileBuffer, job.fileName);

    // Analyze layout for each page
    const analyzedPages = parsedDoc.pages.map(analyzePageLayout);
    parsedDoc.pages = analyzedPages;

    // Update source language if detected and not already set
    if (parsedDoc.detectedLanguage !== 'unknown') {
      updateJob(jobId, { sourceLanguage: parsedDoc.detectedLanguage });
    }

    // Chunk the document
    const chunkingResult = chunkDocument(parsedDoc);

    // Store chunks in job
    setJobChunks(jobId, chunkingResult.chunks, chunkingResult.totalTokens);

    // Get chunk previews for response
    const chunkPreviews = getChunkPreviews(chunkingResult.chunks);

    return NextResponse.json({
      jobId,
      parsing: {
        status: 'complete',
        pageCount: parsedDoc.pageCount,
        blockCount: parsedDoc.totalBlocks,
        estimatedTokens: chunkingResult.totalTokens,
        detectedLanguage: parsedDoc.detectedLanguage,
        hasRTL: parsedDoc.hasRTL,
      },
      chunks: chunkPreviews,
    });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
