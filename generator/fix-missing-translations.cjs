const fs = require('fs');
const path = require('path');

// OpenAI設定
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 翻訳を生成する関数
async function generateTranslation(content, passageId) {
  try {
    const prompt = `
以下のTOEIC Part7の英語文書を自然で読みやすい日本語に翻訳してください：

【英語文書】
${content}

【翻訳の要件】
1. 自然で読みやすい日本語
2. ビジネス文書として適切な表現
3. 原文の意味を正確に反映
4. 改行や段落構造を保持

【出力形式】
翻訳された日本語文書のみを出力してください（JSONや他の形式は不要）。
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'あなたは優秀な英日翻訳者です。ビジネス文書の翻訳を専門としています。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const translation = response.choices[0].message.content.trim();
    console.log(`✅ ${passageId} の翻訳が完了しました`);
    return translation;
  } catch (error) {
    console.error(`❌ ${passageId} の翻訳中にエラーが発生:`, error.message);
    throw error;
  }
}

// メイン処理
async function main() {
  try {
    // passages.jsonを読み込み
    const passagesPath = path.join(__dirname, '..', 'src/data/passages.json');
    const data = JSON.parse(fs.readFileSync(passagesPath, 'utf8'));
    
    // バックアップを作成
    const backupPath = path.join(__dirname, '..', `src/data/passages.backup.missing-translations.${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log(`📋 バックアップを作成しました: ${backupPath}`);
    
    // passage75とpassage76を特定
    const targetPassages = data.passages.filter(p => p.id === 'passage75' || p.id === 'passage76');
    
    if (targetPassages.length === 0) {
      console.log('❌ passage75またはpassage76が見つかりません');
      return;
    }
    
    console.log(`🔄 ${targetPassages.length}個の問題の翻訳を処理します...`);
    
    // 各問題の翻訳を生成
    for (const passage of targetPassages) {
      if (!passage.contentTranslation || passage.contentTranslation === '') {
        console.log(`\n📝 ${passage.id} の翻訳を生成中...`);
        console.log(`タイトル: ${passage.title}`);
        console.log(`タイプ: ${passage.type}`);
        
        const translation = await generateTranslation(passage.content, passage.id);
        
        // 翻訳をpassageに追加
        passage.contentTranslation = translation;
        
        // API制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log(`✅ ${passage.id} は既に翻訳済みです`);
      }
    }
    
    // 更新されたデータを保存
    fs.writeFileSync(passagesPath, JSON.stringify(data, null, 2));
    console.log('\n✅ 翻訳の追加が完了しました!');
    
    // 結果を表示
    console.log('\n📊 処理結果:');
    targetPassages.forEach(passage => {
      console.log(`- ${passage.id}: ${passage.contentTranslation ? '翻訳済み' : '翻訳なし'}`);
    });
    
  } catch (error) {
    console.error('❌ 処理中にエラーが発生:', error);
  }
}

main();