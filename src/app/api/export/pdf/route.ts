import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/storage/job-store';
import { generatePDF } from '@/lib/export/pdf-generator';

export async function POST(request: NextRequest) {
  try {
    const { jobId, options = {} } = await request.json();

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

    if (job.status !== 'complete') {
      return NextResponse.json(
        { error: 'Translation not complete' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBytes = await generatePDF(job, {
      preserveLayout: options.preserveLayout ?? true,
      paperSize: options.paperSize ?? 'A4',
    });

    // Create filename
    const baseName = job.fileName.replace(/\.pdf$/i, '');
    const filename = `${baseName}-translated.pdf`;

    // Return PDF
    return new Response(pdfBytes as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
