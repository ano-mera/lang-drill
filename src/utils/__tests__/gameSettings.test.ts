import { describe, it, expect } from 'vitest';
import { validateSettings, DEFAULT_SETTINGS } from '../gameSettings';

describe('validateSettings', () => {
  it('returns defaults for empty input', () => {
    const result = validateSettings({});
    expect(result.answerTime).toBe(DEFAULT_SETTINGS.answerTime);
    expect(result.targetConsecutive).toBe(DEFAULT_SETTINGS.targetConsecutive);
    expect(result.toeicPart).toBe('part0');
    expect(result.hasChart).toBe('all');
    expect(result.difficulty).toBe('all');
    expect(result.nextButtonBehavior).toBe('random');
    expect(result.audioVolume).toBe(DEFAULT_SETTINGS.audioVolume);
    expect(result.language).toBe('ja');
  });

  it('passes through valid settings', () => {
    const input = {
      answerTime: 5000,
      targetConsecutive: 50,
      toeicPart: 'part3' as const,
      hasChart: 'with_chart' as const,
      difficulty: 'hard' as const,
      nextButtonBehavior: 'sequential' as const,
      audioVolume: 80,
      language: 'en' as const,
    };
    const result = validateSettings(input);
    expect(result.answerTime).toBe(5000);
    expect(result.targetConsecutive).toBe(50);
    expect(result.toeicPart).toBe('part3');
    expect(result.hasChart).toBe('with_chart');
    expect(result.difficulty).toBe('hard');
    expect(result.nextButtonBehavior).toBe('sequential');
    expect(result.audioVolume).toBe(80);
    expect(result.language).toBe('en');
  });

  it('clamps answerTime to valid range', () => {
    expect(validateSettings({ answerTime: -100 }).answerTime).toBe(0);
    expect(validateSettings({ answerTime: 999999 }).answerTime).toBe(300000);
  });

  it('clamps targetConsecutive to valid range', () => {
    expect(validateSettings({ targetConsecutive: 0 }).targetConsecutive).toBe(DEFAULT_SETTINGS.targetConsecutive);
    expect(validateSettings({ targetConsecutive: 200 }).targetConsecutive).toBe(100);
  });

  it('clamps audioVolume to valid range', () => {
    expect(validateSettings({ audioVolume: -10 }).audioVolume).toBe(0);
    expect(validateSettings({ audioVolume: 150 }).audioVolume).toBe(100);
  });

  it('falls back to default for invalid toeicPart', () => {
    expect(validateSettings({ toeicPart: 'invalid' as never }).toeicPart).toBe('part0');
  });

  it('falls back to default for invalid difficulty', () => {
    expect(validateSettings({ difficulty: 'extreme' as never }).difficulty).toBe('all');
  });
});
