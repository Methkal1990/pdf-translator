import { TextBlock } from '@/types/pdf';
import { TextPlacement } from '@/types/export';

// Arabic Unicode range
const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

// Check if text contains RTL characters
export function hasRTLCharacters(text: string): boolean {
  return ARABIC_RANGE.test(text);
}

// Detect text direction
export function detectDirection(text: string): 'ltr' | 'rtl' {
  // Check first 100 characters for RTL
  const sample = text.slice(0, 100);
  const rtlChars = (sample.match(ARABIC_RANGE) || []).length;
  return rtlChars > sample.length * 0.3 ? 'rtl' : 'ltr';
}

// Convert RTL text placement to LTR for English
export function convertRTLtoLTRPlacement(
  originalBlock: TextBlock,
  translatedText: string,
  pageWidth: number
): TextPlacement {
  const { boundingBox } = originalBlock;

  if (originalBlock.direction === 'rtl') {
    // RTL text in PDF is positioned at its END point (right side)
    // For LTR, we need to position at START (left side)

    // Estimate new width based on text length ratio
    // English text is typically shorter than Arabic
    const lengthRatio = translatedText.length / originalBlock.text.length;
    const estimatedNewWidth = Math.min(
      boundingBox.width * lengthRatio * 0.85,
      pageWidth - 72 // Leave at least 1 inch margin
    );

    // Keep text in roughly the same horizontal area
    // but left-aligned instead of right-aligned
    return {
      text: translatedText,
      x: Math.max(36, boundingBox.x - boundingBox.width + 36), // Shift left with margin
      y: boundingBox.y,
      width: estimatedNewWidth,
      height: boundingBox.height,
      fontSize: originalBlock.fontInfo.size,
      fontFamily: 'Helvetica',
      align: 'left',
    };
  }

  // LTR original - straightforward positioning
  return {
    text: translatedText,
    x: boundingBox.x,
    y: boundingBox.y,
    width: boundingBox.width,
    height: boundingBox.height,
    fontSize: originalBlock.fontInfo.size,
    fontFamily: 'Helvetica',
    align: 'left',
  };
}
