/**
 * Text processing utilities for TOEIC question display
 */

/**
 * Remove "A.", "B.", "C.", "D." prefixes from option text
 */
export const cleanText = (text: string): string => {
  return text.replace(/^[A-D]\.\s*/, "");
};

/**
 * Remove "A.", "B.", "C.", "D." prefixes from translation text
 * (Backward-compatible wrapper around cleanText)
 */
export const cleanTranslationText = (translation: string): string => {
  return cleanText(translation);
};
