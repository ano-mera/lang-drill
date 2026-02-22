import { describe, it, expect } from 'vitest';
import { cleanText, cleanTranslationText } from '../textUtils';

describe('cleanText', () => {
  it('removes "A. " prefix', () => {
    expect(cleanText('A. Hello')).toBe('Hello');
  });

  it('removes "B. " prefix', () => {
    expect(cleanText('B. World')).toBe('World');
  });

  it('removes "C." prefix without space', () => {
    expect(cleanText('C.Test')).toBe('Test');
  });

  it('removes "D.  " prefix with extra space', () => {
    expect(cleanText('D.  Extra')).toBe('Extra');
  });

  it('does not remove non-ABCD prefixes', () => {
    expect(cleanText('E. Not removed')).toBe('E. Not removed');
  });

  it('returns text unchanged when no prefix', () => {
    expect(cleanText('No prefix here')).toBe('No prefix here');
  });

  it('handles empty string', () => {
    expect(cleanText('')).toBe('');
  });
});

describe('cleanTranslationText', () => {
  it('removes prefix from translation text', () => {
    expect(cleanTranslationText('A. こんにちは')).toBe('こんにちは');
  });

  it('returns unchanged text without prefix', () => {
    expect(cleanTranslationText('翻訳テキスト')).toBe('翻訳テキスト');
  });
});
