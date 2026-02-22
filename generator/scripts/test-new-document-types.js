import { generateCompletePassage, API_COST_LIMITS } from "../lib/passage-generator.js";
import fs from "fs";
import path from "path";

// タイムスタンプ付きログファイル名を生成
function generateLogFileName() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `new-document-types-test-${timestamp}.log`;
}

// ログファイルに書き込む関数
function writeToLog(logContent, logFileName) {
  const logDir = path.join(process.cwd(), "logs");
  const logPath = path.join(logDir, logFileName);

  fs.writeFileSync(logPath, logContent, "utf8");
  console.log(`📝 ログファイルに保存しました: ${logPath}`);
}

// メイン実行関数
async function testNewDocumentTypes() {
  const logFileName = generateLogFileName();
  let logContent = "";

  // ログ開始
  const startTime = new Date();
  logContent += `=== 新しい文書タイプテストログ ===\n`;
  logContent += `開始時刻: ${startTime.toLocaleString("ja-JP")}\n`;
  logContent += `ログファイル: ${logFileName}\n\n`;

  console.log("🚀 新しい文書タイプ（カスタマー対応・社内チャット）のテストを開始します...");
  console.log(`📝 ログファイル: ${logFileName}`);

  // テストする文書タイプとトピック
  const testCases = [
    { type: "customer_support", topic: "customer_inquiries", difficulty: "easy" },
    { type: "customer_support", topic: "customer_complaints", difficulty: "medium" },
    { type: "internal_chat", topic: "team_coordination", difficulty: "easy" },
    { type: "internal_chat", topic: "project_collaboration", difficulty: "medium" },
  ];

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const passageId = `test_${testCase.type}_${i + 1}`;

    console.log(`\n📊 テスト ${i + 1}/${testCases.length}: ${testCase.type} (${testCase.topic})`);

    try {
      const result = await generateCompletePassage(passageId, testCase.type, testCase.difficulty, testCase.topic);

      results.push({ testCase, result, success: true });
      console.log(`✅ ${passageId} 生成完了`);

      // 結果をログに記録
      const passage = result.passage;
      logContent += `【テスト ${i + 1}】\n`;
      logContent += `文書タイプ: ${passage.type}\n`;
      logContent += `トピック: ${passage.metadata.topic}\n`;
      logContent += `難易度: ${passage.metadata.difficulty}\n`;
      logContent += `単語数: ${passage.metadata.wordCount}\n`;
      logContent += `品質チェック: ${result.validation.isValid ? "合格" : "不合格"}\n\n`;

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
    } catch (error) {
      results.push({ testCase, error: error.message, success: false });
      console.error(`❌ ${passageId} 生成失敗:`, error.message);

      logContent += `【テスト ${i + 1}】\n`;
      logContent += `文書タイプ: ${testCase.type}\n`;
      logContent += `トピック: ${testCase.topic}\n`;
      logContent += `難易度: ${testCase.difficulty}\n`;
      logContent += `エラー: ${error.message}\n\n`;
    }

    // API制限を避けるため少し待機
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // 結果サマリー
  const successCount = results.filter((r) => r.success).length;
  const errorCount = results.filter((r) => !r.success).length;

  logContent += `=== テスト結果サマリー ===\n`;
  logContent += `✅ 成功: ${successCount}件\n`;
  logContent += `❌ 失敗: ${errorCount}件\n`;
  logContent += `📊 成功率: ${((successCount / results.length) * 100).toFixed(1)}%\n\n`;

  // 終了時刻と実行時間を記録
  const endTime = new Date();
  const executionTime = (endTime - startTime) / 1000;
  logContent += `=== 実行完了 ===\n`;
  logContent += `終了時刻: ${endTime.toLocaleString("ja-JP")}\n`;
  logContent += `実行時間: ${executionTime.toFixed(2)}秒\n`;

  // ログファイルに保存
  writeToLog(logContent, logFileName);

  // コンソールに結果を表示
  console.log(`\n📊 テスト完了！`);
  console.log(`✅ 成功: ${successCount}件`);
  console.log(`❌ 失敗: ${errorCount}件`);
  console.log(`📊 成功率: ${((successCount / results.length) * 100).toFixed(1)}%`);
  console.log(`⏱️  実行時間: ${executionTime.toFixed(2)}秒`);
  console.log(`📝 詳細はログファイルをご確認ください: ${logFileName}`);
}

// スクリプト実行
testNewDocumentTypes().catch(console.error);
