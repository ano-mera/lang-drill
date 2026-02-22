// 重み付け選択のテストスクリプト
import { TOEIC_COMBINATIONS, selectWeightedRandomCombination } from './lib/prompt-templates.js';

function testWeightedSelection(iterations = 100) {
  console.log(`=== 重み付けランダム選択テスト (${iterations}回) ===\n`);
  
  // 組み合わせ出現回数をカウント
  const combinationCounts = new Map();
  const weightGroups = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  // 全組み合わせを初期化
  TOEIC_COMBINATIONS.forEach(combo => {
    const key = `${combo.topic}|${combo.document_type}`;
    combinationCounts.set(key, { count: 0, weight: combo.weight });
  });
  
  // シミュレーション実行
  console.log("シミュレーション実行中...\n");
  for (let i = 0; i < iterations; i++) {
    const selected = selectWeightedRandomCombination();
    const key = `${selected.topic}|${selected.document_type}`;
    
    const current = combinationCounts.get(key);
    combinationCounts.set(key, { 
      count: current.count + 1, 
      weight: current.weight 
    });
    
    weightGroups[selected.weight]++;
  }
  
  // 結果分析
  console.log("=== 重み別出現回数 ===");
  const totalWeight = TOEIC_COMBINATIONS.reduce((sum, item) => sum + item.weight, 0);
  
  for (const weight of [5, 4, 3, 2, 1]) {
    const weightItems = TOEIC_COMBINATIONS.filter(item => item.weight === weight);
    const expectedTotal = (weightItems.reduce((sum, item) => sum + item.weight, 0) / totalWeight) * iterations;
    const actualTotal = weightGroups[weight];
    const percentage = ((actualTotal / iterations) * 100).toFixed(1);
    
    console.log(`重み${weight}: ${actualTotal}回 (${percentage}%) - 期待値: ${expectedTotal.toFixed(1)}回 - 組み合わせ数: ${weightItems.length}`);
  }
  
  console.log("\n=== 出現回数上位20位 ===");
  const sortedResults = Array.from(combinationCounts.entries())
    .filter(([key, data]) => data.count > 0)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20);
  
  sortedResults.forEach(([key, data], index) => {
    const [topic, documentType] = key.split('|');
    console.log(`${(index + 1).toString().padStart(2)}. ${topic.padEnd(30)} | ${documentType.padEnd(15)} | 重み${data.weight} | ${data.count}回`);
  });
  
  console.log("\n=== 出現しなかった組み合わせ ===");
  const notSelected = Array.from(combinationCounts.entries())
    .filter(([key, data]) => data.count === 0);
  
  if (notSelected.length > 0) {
    notSelected.forEach(([key, data]) => {
      const [topic, documentType] = key.split('|');
      console.log(`- ${topic} | ${documentType} | 重み${data.weight}`);
    });
  } else {
    console.log("すべての組み合わせが選択されました。");
  }
  
  console.log("\n=== 統計情報 ===");
  console.log(`総組み合わせ数: ${TOEIC_COMBINATIONS.length}`);
  console.log(`総重みの合計: ${totalWeight}`);
  console.log(`選択された組み合わせ数: ${Array.from(combinationCounts.values()).filter(data => data.count > 0).length}`);
  console.log(`選択されなかった組み合わせ数: ${notSelected.length}`);
  
  // 重み分布の期待値と実際の比較
  console.log("\n=== 重み分布の詳細比較 ===");
  for (const weight of [5, 4, 3, 2, 1]) {
    const weightItems = TOEIC_COMBINATIONS.filter(item => item.weight === weight);
    const totalWeightForThisGroup = weightItems.reduce((sum, item) => sum + item.weight, 0);
    const expectedPercentage = ((totalWeightForThisGroup / totalWeight) * 100).toFixed(1);
    const actualPercentage = ((weightGroups[weight] / iterations) * 100).toFixed(1);
    const deviation = (actualPercentage - expectedPercentage).toFixed(1);
    
    console.log(`重み${weight}: 期待${expectedPercentage}% vs 実際${actualPercentage}% (偏差${deviation >= 0 ? '+' : ''}${deviation}%)`);
  }
}

// テスト実行
testWeightedSelection(100);