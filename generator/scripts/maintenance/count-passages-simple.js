const fs = require("fs");
const path = require("path");

// ファイルパス
const dataPath = path.join(__dirname, "../../../src/data/passages.json");

try {
  // ファイルを読み込み
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  // 問題数を正確に数える
  const totalPassages = data.passages.length;
  let totalQuestions = 0;

  // 各パッセージの問題数を数える
  data.passages.forEach((passage) => {
    const questionCount = passage.questions ? passage.questions.length : 0;
    totalQuestions += questionCount;
  });

  console.log("=== 正確な問題数 ===");
  console.log(`総パッセージ数: ${totalPassages}個`);
  console.log(`総問題数: ${totalQuestions}問`);

  // 文書タイプ別統計
  const typeStats = {};
  data.passages.forEach((passage) => {
    const type = passage.type || "unknown";
    typeStats[type] = (typeStats[type] || 0) + 1;
  });

  console.log("\n=== 文書タイプ別 ===");
  Object.entries(typeStats).forEach(([type, count]) => {
    console.log(`${type}: ${count}個`);
  });

  // 難易度別統計
  const difficultyStats = {};
  data.passages.forEach((passage) => {
    const difficulty = passage.metadata?.difficulty || "unknown";
    difficultyStats[difficulty] = (difficultyStats[difficulty] || 0) + 1;
  });

  console.log("\n=== 難易度別 ===");
  Object.entries(difficultyStats).forEach(([difficulty, count]) => {
    console.log(`${difficulty}: ${count}個`);
  });
} catch (error) {
  console.error("エラーが発生しました:", error);
  process.exit(1);
}
