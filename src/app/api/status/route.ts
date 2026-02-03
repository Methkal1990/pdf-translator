import { NextRequest, NextResponse } from 'next/server';
import { getJob, serializeJob } from '@/lib/storage/job-store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('jobId');

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

  const percentComplete = job.progress.totalChunks > 0
    ? (job.progress.chunksCompleted / job.progress.totalChunks) * 100
    : 0;

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    progress: {
      ...job.progress,
      percentComplete: Math.round(percentComplete * 10) / 10,
    },
    chunks: job.chunks.map((chunk) => ({
      id: chunk.id,
      status: job.translatedChunks.has(chunk.id) ? 'complete' :
        job.status === 'translating' &&
        job.translatedChunks.size === chunk.index ? 'translating' : 'pending',
    })),
  });
}
