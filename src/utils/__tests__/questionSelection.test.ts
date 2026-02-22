import { describe, it, expect } from 'vitest';
import { getSecureRandomIndex } from '../questionSelection';

describe('getSecureRandomIndex', () => {
  it('returns a value within [0, max)', () => {
    const max = 10;
    for (let i = 0; i < 50; i++) {
      const result = getSecureRandomIndex(max);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(max);
    }
  });

  it('returns 0 when max is 1', () => {
    expect(getSecureRandomIndex(1)).toBe(0);
  });

  it('returns an integer', () => {
    const result = getSecureRandomIndex(100);
    expect(Number.isInteger(result)).toBe(true);
  });
});
