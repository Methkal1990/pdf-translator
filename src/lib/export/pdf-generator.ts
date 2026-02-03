import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ReconstructedDocument } from '@/types/export';
import { TranslationJob } from '@/types/translation';
import { getFullTranslatedText } from './layout-reconstructor';

// Map of characters that WinAnsi (standard PDF fonts) cannot encode
// to their ASCII equivalents
const charReplacements: Record<string, string> = {
  // Turkish
  '\u0130': 'I', // İ
  '\u0131': 'i', // ı
  '\u011E': 'G', // Ğ
  '\u011F': 'g', // ğ
  '\u015E': 'S', // Ş
  '\u015F': 's', // ş
  // Zero-width characters
  '\u200B': '', '\u200C': '', '\u200D': '', '\uFEFF': '',
  // Curly quotes and dashes
  '\u201C': '"', // "
  '\u201D': '"', // "
  '\u2018': "'", // '
  '\u2019': "'", // '
  '\u2013': '-', // –
  '\u2014': '-', // —
  '\u2026': '...', // …
  '\u2022': '*', // •
  '\u00B7': '*', // ·
};

// Sanitize text for PDF (WinAnsi encoding)
function sanitizeForPDF(text: string): string {
  let result = text;

  // Replace known problematic characters
  for (const [char, replacement] of Object.entries(charReplacements)) {
    result = result.split(char).join(replacement);
  }

  // Remove any remaining non-WinAnsi characters (keep basic ASCII + common extended)
  result = result.replace(/[^\x00-\xFF]/g, (char) => {
    // Try to normalize accented characters
    const normalized = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized.length > 0 && normalized.charCodeAt(0) < 256 ? normalized : '?';
  });

  return result;
}

export async function generatePDF(
  job: TranslationJob,
  options: {
    preserveLayout?: boolean;
    paperSize?: 'A4' | 'Letter';
  } = {}
): Promise<Uint8Array> {
  const { preserveLayout = false, paperSize = 'A4' } = options;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page dimensions
  const pageWidth = paperSize === 'A4' ? 595.28 : 612;
  const pageHeight = paperSize === 'A4' ? 841.89 : 792;
  const margin = 50;
  const lineHeight = 14;
  const fontSize = 11;

  // Get full translated text and sanitize for PDF encoding
  const rawText = getFullTranslatedText(job.chunks, job.translatedChunks);
  const fullText = sanitizeForPDF(rawText);

  if (!fullText) {
    // Return empty PDF if no translations
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawText('No translations available', {
      x: margin,
      y: pageHeight - margin,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    return pdfDoc.save();
  }

  // Split text into paragraphs
  const paragraphs = fullText.split(/\n\n+/).filter((p) => p.trim());

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  const maxWidth = pageWidth - margin * 2;

  for (const paragraph of paragraphs) {
    // Check if we need a new page
    if (y < margin + lineHeight * 2) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    // Word wrap the paragraph
    const words = paragraph.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (textWidth > maxWidth && currentLine) {
        // Draw current line
        currentPage.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
        currentLine = word;

        // Check for new page
        if (y < margin) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
      } else {
        currentLine = testLine;
      }
    }

    // Draw remaining text in line
    if (currentLine) {
      currentPage.drawText(currentLine, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    }

    // Add paragraph spacing
    y -= lineHeight * 0.5;
  }

  return pdfDoc.save();
}

export async function generatePDFWithLayout(
  document: ReconstructedDocument
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const pageData of document.pages) {
    const page = pdfDoc.addPage([pageData.width, pageData.height]);

    for (const element of pageData.elements) {
      // Convert y coordinate (PDF uses bottom-left origin)
      const pdfY = pageData.height - element.y - element.height;

      // Sanitize and truncate text if it's too long for the available width
      let text = sanitizeForPDF(element.text);
      const textWidth = font.widthOfTextAtSize(text, element.fontSize);

      if (textWidth > element.width) {
        // Truncate with ellipsis
        while (font.widthOfTextAtSize(text + '...', element.fontSize) > element.width && text.length > 0) {
          text = text.slice(0, -1);
        }
        text += '...';
      }

      try {
        page.drawText(text, {
          x: element.x,
          y: pdfY,
          size: Math.min(element.fontSize, 24), // Cap font size
          font,
          color: rgb(0, 0, 0),
          maxWidth: element.width,
        });
      } catch {
        // Skip problematic text
        console.warn('Could not draw text:', text.substring(0, 50));
      }
    }
  }

  return pdfDoc.save();
}
