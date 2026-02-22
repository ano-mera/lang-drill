const fs = require("fs");
const path = require("path");

// 選択肢の翻訳に記号を追加する関数
const addOptionPrefix = (translation, index) => {
  if (!translation) return translation;
  const prefix = `(${String.fromCharCode(65 + index)}) `; // A, B, C, D
  // 既に記号がある場合は追加しない
  if (translation.match(/^\([A-D]\)\s/)) {
    return translation;
  }
  return prefix + translation;
};

// ファイルパス
const inputFile = path.join(__dirname, "../../../src/data/passages.json");
const outputFile = path.join(__dirname, "../../../src/data/passages.json");

try {
  // ファイルを読み込み
  const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

  let updatedCount = 0;

  // 各パッセージの質問を処理
  data.passages.forEach((passage) => {
    passage.questions.forEach((question) => {
      // 選択肢の翻訳に記号を追加
      if (question.optionTranslations && Array.isArray(question.optionTranslations)) {
        question.optionTranslations.forEach((translation, index) => {
          if (translation) {
            const original = translation;
            question.optionTranslations[index] = addOptionPrefix(translation, index);
            if (original !== question.optionTranslations[index]) {
              updatedCount++;
              console.log(`選択肢${index + 1}翻訳に記号追加: "${original}" -> "${question.optionTranslations[index]}"`);
            }
          }
        });
      }
    });
  });

  // 修正されたデータをファイルに書き込み
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), "utf8");

  console.log(`\n✅ 完了！${updatedCount}個の翻訳に記号を追加しました。`);
  console.log(`ファイル: ${outputFile}`);
} catch (error) {
  console.error("エラーが発生しました:", error);
  process.exit(1);
}
