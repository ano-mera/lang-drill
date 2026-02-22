const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// OpenAI クライアントを初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// OpenAI APIを使用する翻訳関数
async function translateText(text, targetLang = 'ja') {
  try {
    const prompt = `以下の英語文書を自然で正確な日本語に翻訳してください。件名、本文、署名まで、文書の全内容を一語一句漏らさずに翻訳してください。改行や構造も保持してください。

英語文書:
${text}

日本語翻訳:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('翻訳エラー:', error);
    return null;
  }
}

// 遅延処理（APIレート制限対策）
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translatePassages() {
  console.log('翻訳プロセスを開始します...');
  
  // passages.jsonを読み込み
  const jsonData = JSON.parse(fs.readFileSync('../src/data/passages.json', 'utf8'));
  const passages = jsonData.passages;
  
  let translatedCount = 0;
  let skipCount = 0;
  
  for (let i = 0; i < passages.length; i++) {
    const passage = passages[i];
    console.log(`\n処理中: ${passage.id} (${i + 1}/${passages.length})`);
    
    let needsTranslation = false;
    
    // contentTranslationが不足している場合、または短すぎる場合
    if (passage.content && (!passage.contentTranslation || passage.contentTranslation.length < passage.content.length * 0.5)) {
      console.log('- contentTranslationを翻訳中...');
      const translation = await translateText(passage.content);
      if (translation) {
        passage.contentTranslation = translation;
        needsTranslation = true;
      }
      await delay(2000); // 2秒待機（OpenAI APIのため）
    }
    
    // 質問の翻訳
    if (passage.questions && Array.isArray(passage.questions)) {
      for (let j = 0; j < passage.questions.length; j++) {
        const question = passage.questions[j];
        
        // questionTranslationが不足している場合
        if (!question.questionTranslation && question.question) {
          console.log(`- 質問 ${j + 1} の翻訳中...`);
          const translation = await translateText(question.question);
          if (translation) {
            question.questionTranslation = translation;
            needsTranslation = true;
          }
          await delay(1000); // 1秒待機
        }
        
        // optionTranslationsが不足している場合
        if ((!question.optionTranslations || question.optionTranslations.length === 0) && question.options && Array.isArray(question.options)) {
          console.log(`- 質問 ${j + 1} の選択肢を翻訳中...`);
          question.optionTranslations = [];
          
          for (let k = 0; k < question.options.length; k++) {
            const optionTranslation = await translateText(question.options[k]);
            if (optionTranslation) {
              question.optionTranslations.push(optionTranslation);
            }
            await delay(1000); // 1秒待機
          }
          needsTranslation = true;
        }
        
        // explanationが不足している場合
        if (!question.explanation && question.questionTranslation) {
          console.log(`- 質問 ${j + 1} の解説を生成中...`);
          const explanationText = `正解は${question.correct}です。${question.questionTranslation}に対する適切な回答を選択する必要があります。`;
          question.explanation = explanationText;
          needsTranslation = true;
        }
      }
    }
    
    if (needsTranslation) {
      translatedCount++;
      console.log(`✓ ${passage.id} の翻訳が完了しました`);
    } else {
      skipCount++;
      console.log(`- ${passage.id} はすでに翻訳済みです`);
    }
    
    // 10エントリごとに中間保存
    if ((i + 1) % 10 === 0) {
      console.log(`\n中間保存中... (${i + 1}/${passages.length})`);
      fs.writeFileSync('../src/data/passages.json', JSON.stringify(jsonData, null, 2));
    }
  }
  
  // 最終保存
  fs.writeFileSync('../src/data/passages.json', JSON.stringify(jsonData, null, 2));
  
  console.log(`\n翻訳プロセスが完了しました！`);
  console.log(`- 翻訳したエントリ: ${translatedCount}`);
  console.log(`- スキップしたエントリ: ${skipCount}`);
  console.log(`- 合計エントリ: ${passages.length}`);
  
  // バックアップも作成
  const backupPath = `../src/data/passages.backup.${Date.now()}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(jsonData, null, 2));
  console.log(`バックアップを作成しました: ${backupPath}`);
}

// 実行
if (require.main === module) {
  translatePassages().catch(console.error);
}

module.exports = { translatePassages, translateText };