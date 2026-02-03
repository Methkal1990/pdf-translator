import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
} from 'docx';
import { TranslationJob } from '@/types/translation';
import { Chunk } from '@/types/chunk';
import { getFullTranslatedText } from './layout-reconstructor';

export async function generateDocx(
  job: TranslationJob,
  options: {
    includeOriginal?: boolean;
    preserveFormatting?: boolean;
  } = {}
): Promise<Buffer> {
  const { includeOriginal = false, preserveFormatting = true } = options;

  const children: Paragraph[] = [];

  // Add title
  children.push(
    new Paragraph({
      text: `Translated Document: ${job.fileName}`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Add metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Source Language: ${job.sourceLanguage.charAt(0).toUpperCase() + job.sourceLanguage.slice(1)}`,
          size: 20,
          color: '666666',
        }),
      ],
      spacing: { after: 200 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Translated: ${new Date().toLocaleDateString()}`,
          size: 20,
          color: '666666',
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Add separator
  children.push(
    new Paragraph({
      text: '',
      border: {
        bottom: {
          color: 'CCCCCC',
          size: 1,
          style: 'single',
          space: 1,
        },
      },
      spacing: { after: 400 },
    })
  );

  // Add translated content
  const sortedChunks = [...job.chunks].sort((a, b) => a.index - b.index);

  for (const chunk of sortedChunks) {
    const translated = job.translatedChunks.get(chunk.id);

    if (includeOriginal) {
      // Add original text section
      children.push(
        new Paragraph({
          text: `Original (Chunk ${chunk.index + 1})`,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );

      // Split original by paragraphs
      const originalParagraphs = chunk.text.split(/\n\n+/);
      for (const para of originalParagraphs) {
        if (para.trim()) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: para.trim(),
                  size: 22,
                  color: '666666',
                }),
              ],
              spacing: { after: 120 },
            })
          );
        }
      }

      // Add translation header
      children.push(
        new Paragraph({
          text: 'Translation:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    }

    // Add translated text
    if (translated?.translatedText) {
      const translatedParagraphs = translated.translatedText.split(/\n\n+/);

      for (const para of translatedParagraphs) {
        if (para.trim()) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: para.trim(),
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            })
          );
        }
      }
    }

    // Add spacing between chunks if showing original
    if (includeOriginal) {
      children.push(
        new Paragraph({
          text: '',
          spacing: { after: 300 },
        })
      );
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  // Generate buffer
  return Packer.toBuffer(doc);
}
