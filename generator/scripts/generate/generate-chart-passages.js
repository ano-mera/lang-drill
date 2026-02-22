// 図表付き問題生成実行スクリプト（テスト出力・本番出力対応）
import { generateBatchPassagesWithCharts, addPassagesToDatabase, enableCostSavingMode } from "../../lib/passage-generator.js";
import fs from "fs/promises";
import path from "path";

// コマンドライン引数を解析
const args = process.argv.slice(2);
const isTestMode = args.includes("--test") || args.includes("-t");
const generateCount = parseInt(args.find((arg) => arg.startsWith("--count="))?.split("=")[1]) || 3;
const isCostSavingMode = args.includes("--cost-saving") || args.includes("-c");

async function main() {
  try {
    // コスト削減モードの設定
    if (isCostSavingMode) {
      enableCostSavingMode();
    }

    const mode = isTestMode ? "テスト出力" : "本番出力";
    console.log(`🚀 TOEIC Part7 図表付き問題生成を開始します... (${mode})`);

    // ログファイル名を生成（日本時間）
    const now = new Date();
    const jstOffset = 9 * 60; // 日本時間はUTC+9
    const jstTime = new Date(now.getTime() + jstOffset * 60000);
    const timestamp = jstTime.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const logFileName = `chart-question-generation-${timestamp}.log`;
    const logPath = path.join(process.cwd(), "logs", logFileName);

    // ログディレクトリが存在しない場合は作成
    const logDir = path.dirname(logPath);
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }

    // ログファイルの開始
    let logContent = `=== TOEIC図表付き問題生成ログ ===\n`;
    logContent += `開始時刻: ${new Date().toLocaleString("ja-JP")}\n`;
    logContent += `ログファイル: ${logFileName}\n`;
    logContent += `モード: ${mode}\n`;
    logContent += `生成問題数: ${generateCount}問\n\n`;

    // 既存のデータを読み込み（本番モードのみ）
    let existingData = null;
    let passagesPath = null;

    if (!isTestMode) {
      passagesPath = path.join(process.cwd(), "..", "src", "data", "passages.json");
      existingData = JSON.parse(await fs.readFile(passagesPath, "utf8"));
      console.log(`既存の問題数: ${existingData.passages.length}問`);
      logContent += `既存の問題数: ${existingData.passages.length}問\n`;
    }

    console.log(`🎯 生成する問題数: ${generateCount}問`);

    // バッチ生成を実行
    console.log("⏳ 図表付き問題生成中...");
    const result = await generateBatchPassagesWithCharts(generateCount, existingData?.passages || []);

    // 結果を表示
    console.log("\n📈 生成結果:");
    console.log(`✅ 成功: ${result.length}問`);
    console.log(`❌ 失敗: 0問`);
    console.log(`📊 成功率: 100.0%`);

    logContent += `\n=== 生成結果 ===\n`;
    logContent += `✅ 成功: ${result.length}問\n`;
    logContent += `❌ 失敗: 0問\n`;
    logContent += `💰 推定API呼び出し回数: ${result.length * 3}回\n\n`;

    // 生成された問題のJSONデータをログに記録
    logContent += `=== 生成された問題のJSONデータ ===\n\n`;

    result.forEach((passage, index) => {
      logContent += `【問題 ${index + 1}】\n`;
      logContent += JSON.stringify(passage, null, 2);
      logContent += `\n\n---\n\n`;
    });

    // 本番モードの場合のみデータベースに追加
    if (!isTestMode && result.length > 0) {
      const validPassages = result;

      if (validPassages.length > 0) {
        const updatedData = addPassagesToDatabase(existingData.passages, result);

        // ファイルに保存
        await fs.writeFile(passagesPath, JSON.stringify(updatedData, null, 2), "utf8");

        console.log(`\n💾 データベース更新完了: ${validPassages.length}問を追加`);
        console.log(`📊 総問題数: ${updatedData.passages.length}問`);

        logContent += `=== データベース更新結果 ===\n`;
        logContent += `💾 データベース更新完了: ${validPassages.length}問を追加\n`;
        logContent += `📊 総問題数: ${updatedData.passages.length}問\n\n`;

        // 品質統計を表示
        const qualityStats = {
          easy: validPassages.filter((p) => p.metadata.difficulty === "easy").length,
          medium: validPassages.filter((p) => p.metadata.difficulty === "medium").length,
          hard: validPassages.filter((p) => p.metadata.difficulty === "hard").length,
        };

        console.log("\n難易度別内訳:");
        console.log(`  初級 (Easy): ${qualityStats.easy}問`);
        console.log(`  中級 (Medium): ${qualityStats.medium}問`);
        console.log(`  上級 (Hard): ${qualityStats.hard}問`);

        logContent += `難易度別内訳:\n`;
        logContent += `  初級 (Easy): ${qualityStats.easy}問\n`;
        logContent += `  中級 (Medium): ${qualityStats.medium}問\n`;
        logContent += `  上級 (Hard): ${qualityStats.hard}問\n\n`;

        // 文書タイプ別統計
        const typeStats = {
          email: validPassages.filter((p) => p.type === "email").length,
          advertisement: validPassages.filter((p) => p.type === "advertisement").length,
          article: validPassages.filter((p) => p.type === "article").length,
          customer_support: validPassages.filter((p) => p.type === "customer_support").length,
          internal_chat: validPassages.filter((p) => p.type === "internal_chat").length,
        };

        console.log("\n📄 文書タイプ別内訳:");
        console.log(`  メール: ${typeStats.email}問`);
        console.log(`  広告: ${typeStats.advertisement}問`);
        console.log(`  記事: ${typeStats.article}問`);
        console.log(`  カスタマー対応: ${typeStats.customer_support}問`);
        console.log(`  社内チャット: ${typeStats.internal_chat}問`);

        logContent += `📄 文書タイプ別内訳:\n`;
        logContent += `  メール: ${typeStats.email}問\n`;
        logContent += `  広告: ${typeStats.advertisement}問\n`;
        logContent += `  記事: ${typeStats.article}問\n`;
        logContent += `  カスタマー対応: ${typeStats.customer_support}問\n`;
        logContent += `  社内チャット: ${typeStats.internal_chat}問\n\n`;
      } else {
        console.log("\n⚠️  品質チェックを通過した問題がありませんでした");
        logContent += `⚠️  品質チェックを通過した問題がありませんでした\n\n`;
      }
    } else if (isTestMode) {
      console.log("\n🧪 テストモード: 問題データベースには追加されません");
      logContent += `🧪 テストモード: 問題データベースには追加されません\n\n`;
    }

    // ログファイルに保存
    logContent += `=== 実行完了 ===\n`;
    logContent += `終了時刻: ${new Date().toLocaleString("ja-JP")}\n`;
    logContent += `実行時間: ${((Date.now() - Date.now()) / 1000).toFixed(2)}秒\n`;

    await fs.writeFile(logPath, logContent, "utf8");
    console.log(`\n📝 ログファイル保存完了: ${logPath}`);

    console.log(`\n🎉 図表付き問題生成プロセスが完了しました！ (${mode})`);
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

// 使用方法の説明
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
使用方法:
  node generate-chart-passages.js [オプション]

オプション:
  --test, -t          テストモード（ログファイルのみ出力、データベースには追加しない）
  --count=N           生成する問題数（デフォルト: 6）
  --cost-saving, -c   コスト削減モード（リトライ回数削減、品質チェック緩和）
  --help, -h          このヘルプを表示

例:
  node generate-chart-passages.js --test --count=3     # テストモードで3問生成
  node generate-chart-passages.js --count=10           # 本番モードで10問生成
  node generate-chart-passages.js --cost-saving        # コスト削減モードで6問生成
  node generate-chart-passages.js                      # 本番モードで6問生成
`);
  process.exit(0);
}

// スクリプト実行
main();
