// 統合版問題生成実行スクリプト（テスト出力・本番出力対応）
import { generateBatchPassages, generateBatchHardPassages, generateBatchPassagesWithCharts, generateBatchPassagesByDifficulty, generateBatchMultiDocumentPassages, addPassagesToDatabase, enableCostSavingMode } from "../../lib/passage-generator.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// コマンドライン引数を解析
const args = process.argv.slice(2);
const isTestMode = args.includes("--test") || args.includes("-t");
const generateCount = parseInt(args.find((arg) => arg.startsWith("--count="))?.split("=")[1]) || 3;
const isCostSavingMode = args.includes("--cost-saving") || args.includes("-c");
const difficulty = args.find((arg) => arg.startsWith("--difficulty="))?.split("=")[1] || "all";
const batchId = args.find((arg) => arg.startsWith("--batch-id="))?.split("=")[1] || null;
const withChart = args.includes("--with-chart");
const isMultiDocument = args.includes("--multi-document");
const partType = args.find((arg) => arg.startsWith("--part-type="))?.split("=")[1] || null;

// Debug: バッチIDをログ出力
console.log(`🔍 Debug: Received batch ID: ${batchId}`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    // コスト削減モードの設定
    if (isCostSavingMode) {
      enableCostSavingMode();
    }

    const mode = isTestMode ? "テスト出力" : "本番出力";
    const difficultyText = difficulty === "all" ? "全難易度" : `${difficulty.toUpperCase()}難易度のみ`;
    const chartText = withChart ? "図表付き" : "通常";
    const multiDocText = isMultiDocument ? "2資料問題" : "単一資料問題";
    console.log(`🚀 TOEIC Part7 問題生成を開始します... (${mode}, ${difficultyText}, ${chartText}, ${multiDocText})`);

    // ログファイル名を生成（日本時間）
    const now = new Date();
    const jstOffset = 9 * 60; // 日本時間はUTC+9
    const jstTime = new Date(now.getTime() + jstOffset * 60000);
    const timestamp = jstTime.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const logFileName = `question-generation-${difficulty}-${timestamp}.log`;
    const logPath = path.join(process.cwd(), "logs", logFileName);

    // ログディレクトリが存在しない場合は作成
    const logDir = path.dirname(logPath);
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }

    // ログファイルの開始
    let logContent = `=== TOEIC問題生成ログ ===\n`;
    logContent += `開始時刻: ${new Date().toLocaleString("ja-JP")}\n`;
    logContent += `ログファイル: ${logFileName}\n`;
    logContent += `モード: ${mode}\n`;
    logContent += `難易度: ${difficultyText}\n`;
    logContent += `問題タイプ: ${chartText}\n`;
    logContent += `資料タイプ: ${multiDocText}\n`;
    logContent += `生成問題数: ${generateCount}問\n\n`;

    // 既存のデータを読み込み（本番モードのみ）
    let existingData = null;
    let passagesPath = null;

    if (!isTestMode) {
      // プロジェクトルート基準で絶対パスを解決
      passagesPath = path.join(__dirname, "../../../src/data/passages.json");
      existingData = JSON.parse(await fs.readFile(passagesPath, "utf8"));
      console.log(`既存の問題数: ${existingData.passages.length}問`);
      logContent += `既存の問題数: ${existingData.passages.length}問\n`;
    }

    console.log(`🎯 生成する問題数: ${generateCount}問`);

    // 難易度と図表の有無、2資料問題に応じてバッチ生成を実行
    let result;
    if (isMultiDocument) {
      console.log(`⏳ 2資料問題生成中... (${difficulty}難易度)`);
      result = await generateBatchMultiDocumentPassages(generateCount, existingData?.passages || [], difficulty, batchId);
    } else if (withChart) {
      console.log(`⏳ 図表付き問題生成中... (${difficulty}難易度)`);
      const chartPassages = await generateBatchPassagesWithCharts(generateCount, existingData?.passages || [], difficulty, batchId);
      result = {
        success: chartPassages.map(passage => ({ passage, validation: { isValid: true } })),
        errors: [],
        successCount: chartPassages.length,
        errorCount: 0,
        total: generateCount,
        estimatedAPICalls: generateCount * 3
      };
    } else if (difficulty === "all") {
      console.log("⏳ 全難易度問題生成中...");
      result = await generateBatchPassages(generateCount, existingData?.passages || [], batchId);
    } else {
      console.log(`⏳ ${difficulty.toUpperCase()}問題生成中...`);
      result = await generateBatchPassagesByDifficulty(generateCount, existingData?.passages || [], difficulty, batchId);
    }

    // 結果を表示
    console.log("\n📈 生成結果:");
    console.log(`✅ 成功: ${result.successCount}問`);
    console.log(`❌ 失敗: ${result.errorCount}問`);
    console.log(`📊 成功率: ${((result.successCount / result.total) * 100).toFixed(1)}%`);

    logContent += `\n=== 生成結果 ===\n`;
    logContent += `✅ 成功: ${result.successCount}問\n`;
    logContent += `❌ 失敗: ${result.errorCount}問\n`;
    logContent += `💰 推定API呼び出し回数: ${result.estimatedAPICalls}回\n\n`;

    // 生成された問題のJSONデータをログに記録
    logContent += `=== 生成された問題のJSONデータ ===\n\n`;

    result.success.forEach((item, index) => {
      // 図表付き問題の場合、itemが直接passageオブジェクトの場合がある
      const passage = item.passage || item;
      logContent += `【問題 ${index + 1}】\n`;
      logContent += JSON.stringify(passage, null, 2);
      logContent += `\n\n---\n\n`;
    });


    // 本番モードの場合のみデータベースに追加
    if (!isTestMode && result.success.length > 0) {
      const validPassages = result.success.filter((item) => {
        // 図表付き問題の場合、itemが直接passageオブジェクトの場合がある
        return item.validation ? item.validation.isValid : true;
      }).map((item) => item.passage || item);

      if (validPassages.length > 0) {
        const updatedData = addPassagesToDatabase(existingData.passages, result.success, batchId);

        // ファイルに保存
        await fs.writeFile(passagesPath, JSON.stringify(updatedData, null, 2), "utf8");

        console.log(`\n💾 データベース更新完了: ${validPassages.length}問を追加`);
        console.log(`📊 総問題数: ${updatedData.passages.length}問`);
        
        // 生成されたIDを出力（APIが取得できるように）
        // validPassagesから実際に生成された問題のIDを取得
        const generatedIds = validPassages.map(p => p.id);
        console.log(`GENERATED_IDS:${generatedIds.join(',')}`);
        
        // プロンプト情報を収集して出力
        const allPromptData = {
          generationPrompts: [],
          qualityCheckPrompts: [],
          revisionPrompts: []
        };
        
        // 各生成結果からプロンプト情報を収集
        result.success.forEach((item) => {
          if (item.promptData) {
            allPromptData.generationPrompts.push(...item.promptData.generationPrompts);
            allPromptData.qualityCheckPrompts.push(...item.promptData.qualityCheckPrompts);
            allPromptData.revisionPrompts.push(...item.promptData.revisionPrompts);
          }
        });
        
        // プロンプト情報をJSON形式で出力（APIが取得できるように）
        console.log(`PROMPT_DATA:${JSON.stringify(allPromptData)}`);

        logContent += `=== データベース更新結果 ===\n`;
        logContent += `💾 データベース更新完了: ${validPassages.length}問を追加\n`;
        logContent += `📊 総問題数: ${updatedData.passages.length}問\n`;
        logContent += `🆔 実際に追加されたID: ${generatedIds.join(', ')}\n`;
        logContent += `📝 プロンプト情報: 生成=${allPromptData.generationPrompts.length}件, 品質チェック=${allPromptData.qualityCheckPrompts.length}件, 修正=${allPromptData.revisionPrompts.length}件\n\n`;

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

    if (result.errors.length > 0) {
      console.log("\n❌ エラー詳細:");
      logContent += `=== エラー詳細 ===\n`;
      result.errors.forEach((error) => {
        console.log(`  問題 ${error.index + 1}: ${error.error}`);
        logContent += `問題 ${error.index + 1}: ${error.error}\n`;
      });
      logContent += `\n`;
    }

    // ログファイルに保存
    logContent += `=== 実行完了 ===\n`;
    logContent += `終了時刻: ${new Date().toLocaleString("ja-JP")}\n`;
    logContent += `実行時間: ${((Date.now() - Date.now()) / 1000).toFixed(2)}秒\n`;

    await fs.writeFile(logPath, logContent, "utf8");
    console.log(`\n📝 ログファイル保存完了: ${logPath}`);

    console.log(`\n🎉 問題生成プロセスが完了しました！ (${mode}, ${difficultyText})`);
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

// 使用方法の説明
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
統合版TOEIC Part7問題生成スクリプト

使用方法:
  node generate-passages-unified.js [オプション]

オプション:
  --test, -t          テストモード（ログファイルのみ出力、データベースには追加しない）
  --count=N           生成する問題数（デフォルト: 3）
  --difficulty=TYPE   生成する難易度（all/easy/medium/hard、デフォルト: all）
  --with-chart        図表付き問題を生成（デフォルト: 通常問題）
  --multi-document    2資料問題を生成（デフォルト: 単一資料問題）
  --cost-saving, -c   コスト削減モード（リトライ回数削減、品質チェック緩和）
  --help, -h          このヘルプを表示

難易度オプション:
  all                 全難易度（Easy、Medium、Hard）をランダムに生成
  easy                Easy難易度のみを生成
  medium              Medium難易度のみを生成
  hard                Hard難易度のみを生成

例:
  node generate-passages-unified.js --test --count=3                    # テストモードで3問生成（全難易度）
  node generate-passages-unified.js --count=10                          # 本番モードで10問生成（全難易度）
  node generate-passages-unified.js --difficulty=hard --count=5         # Hard問題のみ5問生成
  node generate-passages-unified.js --difficulty=medium --count=3       # Medium問題のみ3問生成
  node generate-passages-unified.js --with-chart --count=3              # 図表付き問題3問生成
  node generate-passages-unified.js --multi-document --count=2          # 2資料問題2問生成
  node generate-passages-unified.js --cost-saving --difficulty=hard     # コスト削減モードでHard問題生成
  node generate-passages-unified.js                                      # 本番モードで3問生成（全難易度）
`);
  process.exit(0);
}

// スクリプト実行
main();
