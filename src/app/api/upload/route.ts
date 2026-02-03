import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createJob, storeFile } from '@/lib/storage/job-store';
import { SourceLanguage } from '@/types/translation';

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '50') || 50) * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sourceLanguage = formData.get('sourceLanguage') as SourceLanguage | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are accepted.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // Validate source language
    const validLanguages: SourceLanguage[] = ['arabic', 'turkish', 'german'];
    if (sourceLanguage && !validLanguages.includes(sourceLanguage)) {
      return NextResponse.json(
        { error: 'Invalid source language. Must be arabic, turkish, or german.' },
        { status: 400 }
      );
    }

    // Generate job ID
    const jobId = uuidv4();

    // Store file buffer
    const buffer = await file.arrayBuffer();
    storeFile(jobId, buffer);

    // Create job
    const job = createJob(jobId, file.name, sourceLanguage || 'arabic');

    return NextResponse.json({
      jobId,
      fileName: file.name,
      fileSize: file.size,
      status: 'uploaded',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
