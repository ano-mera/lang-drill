import { describe, it, expect } from 'vitest';
import {
  initializeStats,
  generateSettingsKey,
  updateStats,
  calculateAccuracy,
  getStatsForSettings,
  updateStatsForSettings,
  MAX_RECENT_ANSWERS,
} from '../gameStats';
import type { GameStats, GameSettings, GameStatsMap } from '../gameStats';

describe('initializeStats', () => {
  it('returns a fresh stats object with all zeros', () => {
    const stats = initializeStats();
    expect(stats).toEqual({
      totalQuestions: 0,
      recentAnswers: [],
      maxConsecutiveCorrect: 0,
      currentConsecutiveCorrect: 0,
      bestAccuracy: 0,
      totalCorrect: 0,
      averageScore: 0,
    });
  });
});

describe('generateSettingsKey', () => {
  it('generates key from answerTime and targetConsecutive', () => {
    const settings: GameSettings = { answerTime: 30, targetConsecutive: 10 };
    expect(generateSettingsKey(settings)).toBe('30-10');
  });

  it('handles zero values', () => {
    const settings: GameSettings = { answerTime: 0, targetConsecutive: 20 };
    expect(generateSettingsKey(settings)).toBe('0-20');
  });
});

describe('updateStats', () => {
  it('increments totalQuestions on correct answer', () => {
    const stats = initializeStats();
    const updated = updateStats(stats, true);
    expect(updated.totalQuestions).toBe(1);
    expect(updated.totalCorrect).toBe(1);
    expect(updated.currentConsecutiveCorrect).toBe(1);
  });

  it('resets consecutive on incorrect answer', () => {
    let stats = initializeStats();
    stats = updateStats(stats, true);
    stats = updateStats(stats, true);
    stats = updateStats(stats, false);
    expect(stats.currentConsecutiveCorrect).toBe(0);
    expect(stats.maxConsecutiveCorrect).toBe(2);
  });

  it('tracks max consecutive correctly', () => {
    let stats = initializeStats();
    // 3 correct, 1 wrong, 2 correct
    for (let i = 0; i < 3; i++) stats = updateStats(stats, true);
    stats = updateStats(stats, false);
    for (let i = 0; i < 2; i++) stats = updateStats(stats, true);
    expect(stats.maxConsecutiveCorrect).toBe(3);
    expect(stats.currentConsecutiveCorrect).toBe(2);
  });

  it('caps recentAnswers at MAX_RECENT_ANSWERS', () => {
    let stats = initializeStats();
    for (let i = 0; i < MAX_RECENT_ANSWERS + 5; i++) {
      stats = updateStats(stats, true);
    }
    expect(stats.recentAnswers.length).toBe(MAX_RECENT_ANSWERS);
  });

  it('calculates averageScore correctly', () => {
    let stats = initializeStats();
    stats = updateStats(stats, true);
    stats = updateStats(stats, false);
    // 1 correct out of 2 = 50%
    expect(stats.averageScore).toBe(50);
  });
});

describe('calculateAccuracy', () => {
  it('returns 0 for empty recentAnswers', () => {
    const stats = initializeStats();
    expect(calculateAccuracy(stats)).toBe(0);
  });

  it('returns 100 for all correct', () => {
    const stats: GameStats = {
      ...initializeStats(),
      recentAnswers: [true, true, true],
    };
    expect(calculateAccuracy(stats)).toBe(100);
  });

  it('returns 0 for all incorrect', () => {
    const stats: GameStats = {
      ...initializeStats(),
      recentAnswers: [false, false, false],
    };
    expect(calculateAccuracy(stats)).toBe(0);
  });

  it('calculates mixed results correctly', () => {
    const stats: GameStats = {
      ...initializeStats(),
      recentAnswers: [true, false, true, false],
    };
    expect(calculateAccuracy(stats)).toBe(50);
  });
});

describe('getStatsForSettings', () => {
  it('returns initialized stats for missing key', () => {
    const statsMap: GameStatsMap = {};
    const settings: GameSettings = { answerTime: 30, targetConsecutive: 10 };
    const result = getStatsForSettings(statsMap, settings);
    expect(result).toEqual(initializeStats());
  });

  it('returns existing stats for known key', () => {
    const existing: GameStats = { ...initializeStats(), totalQuestions: 5 };
    const statsMap: GameStatsMap = { '30-10': existing };
    const settings: GameSettings = { answerTime: 30, targetConsecutive: 10 };
    expect(getStatsForSettings(statsMap, settings).totalQuestions).toBe(5);
  });
});

describe('updateStatsForSettings', () => {
  it('creates new entry for unknown settings', () => {
    const statsMap: GameStatsMap = {};
    const settings: GameSettings = { answerTime: 0, targetConsecutive: 20 };
    const updated = updateStatsForSettings(statsMap, settings, true);
    expect(updated['0-20'].totalQuestions).toBe(1);
    expect(updated['0-20'].totalCorrect).toBe(1);
  });

  it('updates existing entry', () => {
    const existing: GameStats = { ...initializeStats(), totalQuestions: 3, totalCorrect: 2 };
    const statsMap: GameStatsMap = { '30-10': existing };
    const settings: GameSettings = { answerTime: 30, targetConsecutive: 10 };
    const updated = updateStatsForSettings(statsMap, settings, false);
    expect(updated['30-10'].totalQuestions).toBe(4);
    expect(updated['30-10'].totalCorrect).toBe(2);
  });
});
