const fs = require("fs");
const path = require("path");

// passages.jsonファイルを読み込み
const passagesPath = path.join(__dirname, "../src/data/passages.json");
const passagesData = JSON.parse(fs.readFileSync(passagesPath, "utf8"));

console.log("正解フィールドの正規化を開始します...");

let totalQuestions = 0;
let convertedQuestions = 0;
let errors = [];

// 各passageのquestionsを処理
passagesData.passages.forEach((passage, passageIndex) => {
  if (passage.questions && Array.isArray(passage.questions)) {
    passage.questions.forEach((question, questionIndex) => {
      totalQuestions++;

      // 正解が記号（A、B、C、D）でない場合のみ処理
      if (!["A", "B", "C", "D"].includes(question.correct)) {
        // 選択肢の中から正解を探す
        const correctIndex = question.options.findIndex((option) => option === question.correct);

        if (correctIndex !== -1) {
          // 正解が見つかった場合、記号に変換
          const correctLetter = String.fromCharCode(65 + correctIndex); // A=0, B=1, C=2, D=3
          const oldCorrect = question.correct;
          question.correct = correctLetter;
          convertedQuestions++;

          console.log(`変換: ${passage.id} - ${question.id}: "${oldCorrect}" → "${correctLetter}"`);
        } else {
          // 正解が見つからない場合
          errors.push({
            passageId: passage.id,
            questionId: question.id,
            correct: question.correct,
            options: question.options,
          });
          console.log(`エラー: ${passage.id} - ${question.id}: 正解 "${question.correct}" が選択肢に見つかりません`);
        }
      }
    });
  }
});

// 結果を表示
console.log("\n=== 正規化結果 ===");
console.log(`総問題数: ${totalQuestions}`);
console.log(`変換された問題数: ${convertedQuestions}`);
console.log(`エラー数: ${errors.length}`);

if (errors.length > 0) {
  console.log("\n=== エラー詳細 ===");
  errors.forEach((error) => {
    console.log(`Passage: ${error.passageId}, Question: ${error.questionId}`);
    console.log(`  正解: "${error.correct}"`);
    console.log(`  選択肢: [${error.options.map((opt) => `"${opt}"`).join(", ")}]`);
    console.log("");
  });
}

// ファイルに保存
fs.writeFileSync(passagesPath, JSON.stringify(passagesData, null, 2), "utf8");
console.log(`\n修正されたデータを ${passagesPath} に保存しました。`);

if (errors.length === 0) {
  console.log("✅ すべての正解フィールドが記号に正規化されました！");
} else {
  console.log(`⚠️  ${errors.length}個の問題でエラーが発生しました。手動で確認してください。`);
}
