import { generateBatchPassages, API_COST_LIMITS } from "../lib/passage-generator.js";
import fs from "fs";
import path from "path";

// タイムスタンプ付きログファイル名を生成
function generateLogFileName() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `question-generation-${timestamp}.log`;
}

// ログファイルに書き込む関数
function writeToLog(logContent, logFileName) {
  const logDir = path.join(process.cwd(), "logs");
  const logPath = path.join(logDir, logFileName);

  fs.writeFileSync(logPath, logContent, "utf8");
  console.log(`📝 ログファイルに保存しました: ${logPath}`);
}

// メイン実行関数
async function generateTestQuestions() {
  const logFileName = generateLogFileName();
  let logContent = "";

  // ログ開始
  const startTime = new Date();
  logContent += `=== TOEIC問題生成ログ ===\n`;
  logContent += `開始時刻: ${startTime.toLocaleString("ja-JP")}\n`;
  logContent += `ログファイル: ${logFileName}\n\n`;

  // コスト制限設定を表示
  logContent += `💰 コスト制限設定:\n`;
  logContent += `- 最大リトライ回数: ${API_COST_LIMITS.maxDiversityRetries}回\n`;
  logContent += `- 多様性改善: ${API_COST_LIMITS.enableDiversityImprovement ? "有効" : "無効"}\n`;
  logContent += `- TOEIC準拠度チェック: ${API_COST_LIMITS.enableTOEICCompliance ? "有効" : "無効"}\n\n`;

  console.log("🚀 10問のTOEIC問題生成を開始します...");
  console.log(`📝 ログファイル: ${logFileName}`);

  try {
    // 10問生成
    const result = await generateBatchPassages(10);

    // 結果をログに記録
    logContent += `\n=== 生成結果 ===\n`;
    logContent += `✅ 成功: ${result.successCount}問\n`;
    logContent += `❌ 失敗: ${result.errorCount}問\n`;
    logContent += `💰 推定API呼び出し回数: ${result.estimatedAPICalls}回\n\n`;

    // 成功した問題の詳細を記録
    if (result.success.length > 0) {
      logContent += `=== 生成された問題の詳細 ===\n\n`;

      result.success.forEach((passageResult, index) => {
        const passage = passageResult.passage;
        logContent += `【問題 ${index + 1}】\n`;
        logContent += `ID: ${passage.id}\n`;
        logContent += `タイプ: ${passage.type}\n`;
        logContent += `難易度: ${passage.metadata.difficulty}\n`;
        logContent += `トピック: ${passage.metadata.topic}\n`;
        logContent += `単語数: ${passage.metadata.wordCount}\n`;
        logContent += `図表付き: ${passage.hasChart ? "はい" : "いいえ"}\n\n`;

        // 文書内容
        logContent += `【文書内容】\n${passage.content}\n\n`;

        // 問題
        logContent += `【問題】\n`;
        passage.questions.forEach((question, qIndex) => {
          logContent += `${qIndex + 1}. ${question.question}\n`;
          question.options.forEach((option, oIndex) => {
            const marker = option === question.correct ? "✓" : " ";
            logContent += `   ${marker} ${String.fromCharCode(65 + oIndex)}. ${option}\n`;
          });
          logContent += `   解説: ${question.explanation}\n\n`;
        });

        logContent += `---\n\n`;
      });
    }

    // エラー情報を記録
    if (result.errors.length > 0) {
      logContent += `=== エラー情報 ===\n`;
      result.errors.forEach((error) => {
        logContent += `問題 ${error.index + 1}: ${error.error}\n`;
      });
      logContent += `\n`;
    }

    // 終了時刻と実行時間を記録
    const endTime = new Date();
    const executionTime = (endTime - startTime) / 1000;
    logContent += `=== 実行完了 ===\n`;
    logContent += `終了時刻: ${endTime.toLocaleString("ja-JP")}\n`;
    logContent += `実行時間: ${executionTime.toFixed(2)}秒\n`;

    // ログファイルに保存
    writeToLog(logContent, logFileName);

    // コンソールに結果を表示
    console.log(`\n📊 生成完了！`);
    console.log(`✅ 成功: ${result.successCount}問`);
    console.log(`❌ 失敗: ${result.errorCount}問`);
    console.log(`💰 推定API呼び出し回数: ${result.estimatedAPICalls}回`);
    console.log(`⏱️  実行時間: ${executionTime.toFixed(2)}秒`);
    console.log(`📝 詳細はログファイルをご確認ください: ${logFileName}`);
  } catch (error) {
    // エラーをログに記録
    logContent += `\n=== エラー ===\n`;
    logContent += `エラー: ${error.message}\n`;
    logContent += `スタックトレース: ${error.stack}\n`;

    writeToLog(logContent, logFileName);

    console.error("❌ 問題生成中にエラーが発生しました:", error.message);
    console.log(`📝 エラー詳細はログファイルをご確認ください: ${logFileName}`);
  }
}

// スクリプト実行
generateTestQuestions().catch(console.error);
