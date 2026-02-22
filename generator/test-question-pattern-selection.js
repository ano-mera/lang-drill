// 問題パターン選択のテストスクリプト
import { QUESTION_TYPES, calculateQuestionTypeScores, getScoreBasedRandomSortedQuestionTypes } from './lib/prompt-templates.js';

function testQuestionPatternSelection(iterations = 100) {
  console.log(`=== 問題パターン選択テスト (${iterations}回) ===\n`);
  
  // スコア計算結果を表示
  const typesWithScores = calculateQuestionTypeScores();
  console.log("=== スコア計算結果 ===");
  typesWithScores.forEach(type => {
    console.log(`${type.label}: 重み${type.weight} × (1/${type.matchRate}) = ${type.score.toFixed(2)}`);
  });
  
  // 各パターンの1位出現回数をカウント
  const firstPositionCounts = new Map();
  const allPositionCounts = new Map();
  
  // 初期化
  QUESTION_TYPES.forEach(type => {
    firstPositionCounts.set(type.label, 0);
    allPositionCounts.set(type.label, 0);
  });
  
  // シミュレーション実行
  console.log("\nシミュレーション実行中...\n");
  for (let i = 0; i < iterations; i++) {
    const sortedTypes = getScoreBasedRandomSortedQuestionTypes();
    
    // 1位のパターンをカウント
    if (sortedTypes.length > 0) {
      const firstType = sortedTypes[0];
      firstPositionCounts.set(firstType.label, firstPositionCounts.get(firstType.label) + 1);
    }
    
    // 全体の出現回数をカウント
    sortedTypes.forEach(type => {
      allPositionCounts.set(type.label, allPositionCounts.get(type.label) + 1);
    });
  }
  
  // 1位出現率の分析
  console.log("=== 1位出現率の分析 ===");
  const totalScore = typesWithScores.reduce((sum, type) => sum + type.score, 0);
  
  typesWithScores
    .sort((a, b) => b.score - a.score)
    .forEach(type => {
      const expectedRate = ((type.score / totalScore) * 100).toFixed(1);
      const actualCount = firstPositionCounts.get(type.label);
      const actualRate = ((actualCount / iterations) * 100).toFixed(1);
      const deviation = (actualRate - expectedRate).toFixed(1);
      
      console.log(`${type.label.padEnd(20)} | スコア${type.score.toFixed(2)} | 期待${expectedRate}% | 実際${actualRate}% | 偏差${deviation >= 0 ? '+' : ''}${deviation}%`);
    });
  
  // 上位3位の出現パターン分析
  console.log("\n=== 上位3位の出現パターン分析 ===");
  const top3Patterns = new Map();
  
  for (let i = 0; i < 50; i++) {
    const sortedTypes = getScoreBasedRandomSortedQuestionTypes();
    const top3 = sortedTypes.slice(0, 3).map(type => type.label).join(' → ');
    top3Patterns.set(top3, (top3Patterns.get(top3) || 0) + 1);
  }
  
  const sortedTop3 = Array.from(top3Patterns.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  sortedTop3.forEach(([pattern, count], index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${pattern} | ${count}回`);
  });
  
  // 実際の出現確率の補正効果検証
  console.log("\n=== 補正効果の検証 ===");
  console.log("元の重み付けのみの場合 vs 適合率補正後の予想出現率:");
  
  const totalWeight = QUESTION_TYPES.reduce((sum, type) => sum + type.weight, 0);
  
  QUESTION_TYPES.forEach(type => {
    const originalExpected = ((type.weight / totalWeight) * 100).toFixed(1);
    const correctedExpected = ((type.score / totalScore) * 100).toFixed(1);
    const actualExpected = (type.weight * type.matchRate * 100 / 
      QUESTION_TYPES.reduce((sum, t) => sum + t.weight * t.matchRate, 0)).toFixed(1);
    
    console.log(`${type.label.padEnd(20)} | 元重み${originalExpected}% | 補正後${correctedExpected}% | 実際期待${actualExpected}%`);
  });
}

// テスト実行
testQuestionPatternSelection(1000);