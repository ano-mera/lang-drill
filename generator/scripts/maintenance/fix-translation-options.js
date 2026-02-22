const fs = require("fs");
const path = require("path");

// テキストから余計な文字を削除する関数
const cleanText = (text) => {
  if (!text) return text;
  return text.replace(/^[A-D]\.\s*/, "");
};

// ファイルパス
const inputFile = path.join(__dirname, "../../../src/data/passages.json");
const outputFile = path.join(__dirname, "../../../src/data/passages.json");

try {
  // ファイルを読み込み
  const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

  let cleanedCount = 0;

  // 各パッセージの質問を処理
  data.passages.forEach((passage) => {
    passage.questions.forEach((question) => {
      // 問題文の翻訳をクリーンアップ
      if (question.questionTranslation) {
        const original = question.questionTranslation;
        question.questionTranslation = cleanText(question.questionTranslation);
        if (original !== question.questionTranslation) {
          cleanedCount++;
          console.log(`問題文翻訳をクリーンアップ: "${original}" -> "${question.questionTranslation}"`);
        }
      }

      // 英語の選択肢をクリーンアップ
      if (question.options && Array.isArray(question.options)) {
        question.options.forEach((option, index) => {
          if (option) {
            const original = option;
            question.options[index] = cleanText(option);
            if (original !== question.options[index]) {
              cleanedCount++;
              console.log(`英語選択肢${index + 1}をクリーンアップ: "${original}" -> "${question.options[index]}"`);
            }
          }
        });
      }

      // 選択肢の翻訳をクリーンアップ
      if (question.optionTranslations && Array.isArray(question.optionTranslations)) {
        question.optionTranslations.forEach((translation, index) => {
          if (translation) {
            const original = translation;
            question.optionTranslations[index] = cleanText(translation);
            if (original !== question.optionTranslations[index]) {
              cleanedCount++;
              console.log(`選択肢${index + 1}翻訳をクリーンアップ: "${original}" -> "${question.optionTranslations[index]}"`);
            }
          }
        });
      }
    });
  });

  // 修正されたデータをファイルに書き込み
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), "utf8");

  console.log(`\n✅ 完了！${cleanedCount}個のテキストをクリーンアップしました。`);
  console.log(`ファイル: ${outputFile}`);
} catch (error) {
  console.error("エラーが発生しました:", error);
  process.exit(1);
}
