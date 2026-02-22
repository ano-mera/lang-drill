const fs = require('fs');
const OpenAI = require('openai');

// OpenAI クライアントを初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// OpenAI APIを使用する翻訳関数
async function translateQuestion(questionText, options) {
  try {
    const prompt = `以下の英語の問題文を自然で正確な日本語に翻訳してください。TOEIC Part7の問題として適切な日本語になるように翻訳してください。

英語問題文:
${questionText}

選択肢:
${options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}

問題文の日本語翻訳のみを出力してください:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('翻訳エラー:', error);
    return null;
  }
}

// 選択肢翻訳関数
async function translateOptions(options) {
  try {
    const prompt = `以下の英語の選択肢を自然で正確な日本語に翻訳してください。TOEIC Part7の選択肢として適切な日本語になるように翻訳してください。

英語選択肢:
${options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}

各選択肢の日本語翻訳を順番に、以下の形式で出力してください:
A. [翻訳]
B. [翻訳]
C. [翻訳]
D. [翻訳]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 400
    });
    
    const result = response.choices[0].message.content.trim();
    // A. B. C. D. の形式から配列に変換
    const lines = result.split('\n').filter(line => line.match(/^[A-D]\./));
    return lines.map(line => line.replace(/^[A-D]\.\s*/, ''));
  } catch (error) {
    console.error('選択肢翻訳エラー:', error);
    return null;
  }
}

// 遅延処理
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fixQuestionTranslations() {
  console.log('問題文翻訳の修正を開始します...');
  
  // passages.jsonを読み込み
  const jsonData = JSON.parse(fs.readFileSync('../src/data/passages.json', 'utf8'));
  const passages = jsonData.passages;
  
  let fixedCount = 0;
  
  // passage61-71を対象に処理
  for (let i = 0; i < passages.length; i++) {
    const passage = passages[i];
    
    // passage61-71の範囲をチェック
    const passageNum = parseInt(passage.id.replace('passage', ''));
    if (passageNum < 61 || passageNum > 71) {
      continue;
    }
    
    console.log(`\n処理中: ${passage.id}`);
    
    if (passage.questions && Array.isArray(passage.questions)) {
      for (let j = 0; j < passage.questions.length; j++) {
        const question = passage.questions[j];
        
        console.log(`- 質問 ${j + 1} の翻訳中...`);
        
        // 問題文翻訳
        if (question.question) {
          const questionTranslation = await translateQuestion(question.question, question.options);
          if (questionTranslation) {
            question.questionTranslation = questionTranslation;
          }
          await delay(2000); // 2秒待機
        }
        
        // 選択肢翻訳
        if (question.options && Array.isArray(question.options)) {
          console.log(`- 質問 ${j + 1} の選択肢を翻訳中...`);
          const optionTranslations = await translateOptions(question.options);
          if (optionTranslations && optionTranslations.length === 4) {
            question.optionTranslations = optionTranslations;
          }
          await delay(2000); // 2秒待機
        }
      }
    }
    
    fixedCount++;
    console.log(`✓ ${passage.id} の翻訳が完了しました`);
    
    // 5エントリごとに中間保存
    if (fixedCount % 5 === 0) {
      console.log(`\n中間保存中... (${fixedCount}件完了)`);
      fs.writeFileSync('../src/data/passages.json', JSON.stringify(jsonData, null, 2));
    }
  }
  
  // 最終保存
  fs.writeFileSync('../src/data/passages.json', JSON.stringify(jsonData, null, 2));
  
  console.log(`\n翻訳修正が完了しました！`);
  console.log(`- 修正したパッセージ: ${fixedCount}件`);
  
  // バックアップも作成
  const backupPath = `../src/data/passages.backup.questions.${Date.now()}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(jsonData, null, 2));
  console.log(`バックアップを作成しました: ${backupPath}`);
}

// 実行
if (require.main === module) {
  fixQuestionTranslations().catch(console.error);
}