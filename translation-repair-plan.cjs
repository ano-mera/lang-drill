const fs = require('fs');

function analyzeTranslationGaps() {
  console.log('翻訳ギャップの詳細分析を開始します...\n');
  
  const jsonData = JSON.parse(fs.readFileSync('src/data/passages.json', 'utf8'));
  const passages = jsonData.passages;
  
  let analysisReport = {
    totalPassages: passages.length,
    summary: {
      contentTranslation: { missing: 0, present: 0 },
      questionTranslation: { missing: 0, present: 0 },
      optionTranslations: { missing: 0, present: 0 },
      explanation: { missing: 0, present: 0 }
    },
    detailedBreakdown: {
      byType: {},
      byDifficulty: {},
      missingPatterns: []
    },
    repairPlan: {
      priority1: [], // 完全に翻訳が欠けているエントリ
      priority2: [], // 部分的に翻訳が欠けているエントリ
      priority3: []  // 翻訳は完了しているが改善が必要なエントリ
    }
  };
  
  passages.forEach((passage, index) => {
    const type = passage.type || 'unknown';
    const difficulty = passage.metadata?.difficulty || 'unknown';
    
    // Type別の統計を初期化
    if (!analysisReport.detailedBreakdown.byType[type]) {
      analysisReport.detailedBreakdown.byType[type] = {
        total: 0,
        contentTranslation: { missing: 0, present: 0 },
        questionTranslation: { missing: 0, present: 0 },
        optionTranslations: { missing: 0, present: 0 },
        explanation: { missing: 0, present: 0 }
      };
    }
    
    // Difficulty別の統計を初期化
    if (!analysisReport.detailedBreakdown.byDifficulty[difficulty]) {
      analysisReport.detailedBreakdown.byDifficulty[difficulty] = {
        total: 0,
        contentTranslation: { missing: 0, present: 0 },
        questionTranslation: { missing: 0, present: 0 },
        optionTranslations: { missing: 0, present: 0 },
        explanation: { missing: 0, present: 0 }
      };
    }
    
    analysisReport.detailedBreakdown.byType[type].total++;
    analysisReport.detailedBreakdown.byDifficulty[difficulty].total++;
    
    let missingFields = [];
    let questionStats = { total: 0, missingQuestionTranslation: 0, missingOptionTranslations: 0, missingExplanation: 0 };
    
    // Content Translation チェック
    if (!passage.contentTranslation) {
      missingFields.push('contentTranslation');
      analysisReport.summary.contentTranslation.missing++;
      analysisReport.detailedBreakdown.byType[type].contentTranslation.missing++;
      analysisReport.detailedBreakdown.byDifficulty[difficulty].contentTranslation.missing++;
    } else {
      analysisReport.summary.contentTranslation.present++;
      analysisReport.detailedBreakdown.byType[type].contentTranslation.present++;
      analysisReport.detailedBreakdown.byDifficulty[difficulty].contentTranslation.present++;
    }
    
    // Questions の翻訳チェック
    if (passage.questions && Array.isArray(passage.questions)) {
      passage.questions.forEach((question, qIndex) => {
        questionStats.total++;
        
        // Question Translation
        if (!question.questionTranslation) {
          questionStats.missingQuestionTranslation++;
          analysisReport.summary.questionTranslation.missing++;
          analysisReport.detailedBreakdown.byType[type].questionTranslation.missing++;
          analysisReport.detailedBreakdown.byDifficulty[difficulty].questionTranslation.missing++;
        } else {
          analysisReport.summary.questionTranslation.present++;
          analysisReport.detailedBreakdown.byType[type].questionTranslation.present++;
          analysisReport.detailedBreakdown.byDifficulty[difficulty].questionTranslation.present++;
        }
        
        // Option Translations
        if (!question.optionTranslations || question.optionTranslations.length === 0) {
          questionStats.missingOptionTranslations++;
          analysisReport.summary.optionTranslations.missing++;
          analysisReport.detailedBreakdown.byType[type].optionTranslations.missing++;
          analysisReport.detailedBreakdown.byDifficulty[difficulty].optionTranslations.missing++;
        } else {
          analysisReport.summary.optionTranslations.present++;
          analysisReport.detailedBreakdown.byType[type].optionTranslations.present++;
          analysisReport.detailedBreakdown.byDifficulty[difficulty].optionTranslations.present++;
        }
        
        // Explanation
        if (!question.explanation) {
          questionStats.missingExplanation++;
          analysisReport.summary.explanation.missing++;
          analysisReport.detailedBreakdown.byType[type].explanation.missing++;
          analysisReport.detailedBreakdown.byDifficulty[difficulty].explanation.missing++;
        } else {
          analysisReport.summary.explanation.present++;
          analysisReport.detailedBreakdown.byType[type].explanation.present++;
          analysisReport.detailedBreakdown.byDifficulty[difficulty].explanation.present++;
        }
      });
    }
    
    // Priority分類
    let priority = 3; // デフォルト
    if (missingFields.length > 0 || questionStats.missingQuestionTranslation > 0 || 
        questionStats.missingOptionTranslations > 0 || questionStats.missingExplanation > 0) {
      
      const totalMissing = missingFields.length + questionStats.missingQuestionTranslation + 
                          questionStats.missingOptionTranslations + questionStats.missingExplanation;
      
      if (totalMissing >= questionStats.total * 3) { // 全質問の3倍以上のフィールドが欠けている場合
        priority = 1;
      } else if (totalMissing > 0) {
        priority = 2;
      }
    }
    
    const passageAnalysis = {
      id: passage.id,
      type: type,
      difficulty: difficulty,
      index: index,
      missingFields: missingFields,
      questionStats: questionStats,
      priority: priority,
      estimatedTranslationTime: (missingFields.length * 30) + (questionStats.total * 45) // 秒単位
    };
    
    if (priority === 1) {
      analysisReport.repairPlan.priority1.push(passageAnalysis);
    } else if (priority === 2) {
      analysisReport.repairPlan.priority2.push(passageAnalysis);
    } else {
      analysisReport.repairPlan.priority3.push(passageAnalysis);
    }
    
    analysisReport.detailedBreakdown.missingPatterns.push(passageAnalysis);
  });
  
  // レポートを保存
  fs.writeFileSync('translation-analysis-detailed.json', JSON.stringify(analysisReport, null, 2));
  
  // コンソールに結果を表示
  console.log('=== 翻訳ギャップ分析レポート ===\n');
  
  console.log('全体統計:');
  console.log(`- 総パッセージ数: ${analysisReport.totalPassages}`);
  console.log(`- contentTranslation欠け: ${analysisReport.summary.contentTranslation.missing}/${analysisReport.totalPassages}`);
  console.log(`- questionTranslation欠け: ${analysisReport.summary.questionTranslation.missing}/${analysisReport.summary.questionTranslation.missing + analysisReport.summary.questionTranslation.present}`);
  console.log(`- optionTranslations欠け: ${analysisReport.summary.optionTranslations.missing}/${analysisReport.summary.optionTranslations.missing + analysisReport.summary.optionTranslations.present}`);
  console.log(`- explanation欠け: ${analysisReport.summary.explanation.missing}/${analysisReport.summary.explanation.missing + analysisReport.summary.explanation.present}\n`);
  
  console.log('パッセージタイプ別統計:');
  Object.entries(analysisReport.detailedBreakdown.byType).forEach(([type, stats]) => {
    console.log(`- ${type}: ${stats.total}件`);
    console.log(`  - contentTranslation欠け: ${stats.contentTranslation.missing}/${stats.total}`);
    console.log(`  - questionTranslation欠け: ${stats.questionTranslation.missing}/${stats.questionTranslation.missing + stats.questionTranslation.present}`);
    console.log(`  - optionTranslations欠け: ${stats.optionTranslations.missing}/${stats.optionTranslations.missing + stats.optionTranslations.present}`);
    console.log(`  - explanation欠け: ${stats.explanation.missing}/${stats.explanation.missing + stats.explanation.present}`);
  });
  
  console.log('\n修復プラン:');
  console.log(`- 優先度1 (緊急): ${analysisReport.repairPlan.priority1.length}件`);
  console.log(`- 優先度2 (重要): ${analysisReport.repairPlan.priority2.length}件`);
  console.log(`- 優先度3 (通常): ${analysisReport.repairPlan.priority3.length}件`);
  
  // 推定作業時間を計算
  const totalTime = analysisReport.detailedBreakdown.missingPatterns.reduce((sum, item) => sum + item.estimatedTranslationTime, 0);
  console.log(`\n推定翻訳作業時間: ${Math.round(totalTime / 60)}分 (${Math.round(totalTime / 3600)}時間)`);
  
  console.log('\n詳細レポートが保存されました: translation-analysis-detailed.json');
  
  return analysisReport;
}

// 実行
if (require.main === module) {
  analyzeTranslationGaps();
}

module.exports = { analyzeTranslationGaps };