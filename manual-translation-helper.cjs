const fs = require('fs');
const readline = require('readline');

// コンソール入力のためのインターフェース
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class ManualTranslationHelper {
  constructor() {
    this.jsonData = null;
    this.currentPassageIndex = 0;
    this.currentQuestionIndex = 0;
    this.changes = [];
  }

  async loadData() {
    try {
      this.jsonData = JSON.parse(fs.readFileSync('src/data/passages.json', 'utf8'));
      console.log(`${this.jsonData.passages.length}件のパッセージが読み込まれました。`);
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
      process.exit(1);
    }
  }

  async question(prompt) {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  async showMissingTranslations() {
    console.log('\n=== 翻訳が欠けているエントリを表示 ===');
    
    for (let i = 0; i < this.jsonData.passages.length; i++) {
      const passage = this.jsonData.passages[i];
      let hasMissing = false;
      
      console.log(`\n📄 パッセージ ${i + 1}/${this.jsonData.passages.length}: ${passage.id} (${passage.type})`);
      
      // Content Translation チェック
      if (!passage.contentTranslation) {
        console.log('❌ contentTranslation が欠けています');
        console.log('原文:', passage.content.substring(0, 100) + '...');
        hasMissing = true;
      }
      
      // Questions チェック
      if (passage.questions && Array.isArray(passage.questions)) {
        passage.questions.forEach((question, qIndex) => {
          if (!question.questionTranslation) {
            console.log(`❌ 質問 ${qIndex + 1} の翻訳が欠けています`);
            console.log(`原文: ${question.question}`);
            hasMissing = true;
          }
          
          if (!question.optionTranslations || question.optionTranslations.length === 0) {
            console.log(`❌ 質問 ${qIndex + 1} の選択肢翻訳が欠けています`);
            console.log('選択肢:', question.options);
            hasMissing = true;
          }
        });
      }
      
      if (!hasMissing) {
        console.log('✅ すべての翻訳が完了しています');
      }
    }
  }

  async interactiveTranslation() {
    console.log('\n=== 対話的翻訳モード ===');
    console.log('コマンド: next=次へ, skip=スキップ, save=保存, quit=終了');
    
    for (let i = 0; i < this.jsonData.passages.length; i++) {
      const passage = this.jsonData.passages[i];
      
      console.log(`\n📄 パッセージ ${i + 1}/${this.jsonData.passages.length}: ${passage.id} (${passage.type})`);
      
      // Content Translation
      if (!passage.contentTranslation) {
        console.log('\n--- Content Translation ---');
        console.log('原文:', passage.content);
        const translation = await this.question('翻訳を入力してください (または skip): ');
        
        if (translation.toLowerCase() !== 'skip' && translation.trim()) {
          passage.contentTranslation = translation;
          this.changes.push({
            type: 'contentTranslation',
            passageId: passage.id,
            content: translation
          });
          console.log('✅ 翻訳が追加されました');
        }
      }
      
      // Questions
      if (passage.questions && Array.isArray(passage.questions)) {
        for (let j = 0; j < passage.questions.length; j++) {
          const question = passage.questions[j];
          
          console.log(`\n--- 質問 ${j + 1}/${passage.questions.length} ---`);
          console.log('原文:', question.question);
          
          // Question Translation
          if (!question.questionTranslation) {
            const qTranslation = await this.question('質問の翻訳を入力してください (または skip): ');
            
            if (qTranslation.toLowerCase() !== 'skip' && qTranslation.trim()) {
              question.questionTranslation = qTranslation;
              this.changes.push({
                type: 'questionTranslation',
                passageId: passage.id,
                questionId: question.id,
                content: qTranslation
              });
              console.log('✅ 質問の翻訳が追加されました');
            }
          }
          
          // Option Translations
          if (!question.optionTranslations || question.optionTranslations.length === 0) {
            console.log('選択肢:', question.options);
            const optionsTranslation = await this.question('選択肢の翻訳を入力してください (カンマ区切り、または skip): ');
            
            if (optionsTranslation.toLowerCase() !== 'skip' && optionsTranslation.trim()) {
              question.optionTranslations = optionsTranslation.split(',').map(s => s.trim());
              this.changes.push({
                type: 'optionTranslations',
                passageId: passage.id,
                questionId: question.id,
                content: question.optionTranslations
              });
              console.log('✅ 選択肢の翻訳が追加されました');
            }
          }
        }
      }
      
      // 進行状況を表示
      console.log(`\n📊 進行状況: ${i + 1}/${this.jsonData.passages.length} (${Math.round((i + 1) / this.jsonData.passages.length * 100)}%)`);
      console.log(`変更数: ${this.changes.length}`);
      
      const action = await this.question('次の操作を選択してください (next/save/quit): ');
      
      if (action.toLowerCase() === 'save') {
        await this.saveChanges();
        console.log('💾 変更が保存されました');
      } else if (action.toLowerCase() === 'quit') {
        console.log('操作を終了します');
        break;
      }
    }
  }

  async saveChanges() {
    const backupPath = `src/data/passages.backup.${Date.now()}.json`;
    
    // バックアップを作成
    fs.writeFileSync(backupPath, JSON.stringify(this.jsonData, null, 2));
    console.log(`バックアップが作成されました: ${backupPath}`);
    
    // 変更を保存
    fs.writeFileSync('src/data/passages.json', JSON.stringify(this.jsonData, null, 2));
    
    // 変更ログを保存
    const changeLogPath = `translation-changes-${Date.now()}.json`;
    fs.writeFileSync(changeLogPath, JSON.stringify(this.changes, null, 2));
    console.log(`変更ログが保存されました: ${changeLogPath}`);
  }

  async generateTranslationTemplate() {
    console.log('\n=== 翻訳テンプレート生成 ===');
    
    let template = '';
    
    for (let i = 0; i < this.jsonData.passages.length; i++) {
      const passage = this.jsonData.passages[i];
      
      template += `\n=== パッセージ ${i + 1}: ${passage.id} (${passage.type}) ===\n`;
      
      if (!passage.contentTranslation) {
        template += '\n【Content Translation】\n';
        template += `原文: ${passage.content}\n`;
        template += '翻訳: [ここに翻訳を入力]\n';
      }
      
      if (passage.questions && Array.isArray(passage.questions)) {
        passage.questions.forEach((question, qIndex) => {
          if (!question.questionTranslation || !question.optionTranslations || question.optionTranslations.length === 0) {
            template += `\n【質問 ${qIndex + 1}】\n`;
            
            if (!question.questionTranslation) {
              template += `原文: ${question.question}\n`;
              template += '翻訳: [ここに翻訳を入力]\n';
            }
            
            if (!question.optionTranslations || question.optionTranslations.length === 0) {
              template += '選択肢原文:\n';
              question.options.forEach((option, oIndex) => {
                template += `  ${String.fromCharCode(65 + oIndex)}. ${option}\n`;
              });
              template += '選択肢翻訳:\n';
              question.options.forEach((option, oIndex) => {
                template += `  ${String.fromCharCode(65 + oIndex)}. [ここに翻訳を入力]\n`;
              });
            }
          }
        });
      }
    }
    
    const templatePath = `translation-template-${Date.now()}.txt`;
    fs.writeFileSync(templatePath, template);
    console.log(`翻訳テンプレートが生成されました: ${templatePath}`);
  }

  async showMenu() {
    console.log('\n=== 手動翻訳ヘルパー ===');
    console.log('1. 翻訳が欠けているエントリを表示');
    console.log('2. 対話的翻訳モード');
    console.log('3. 翻訳テンプレート生成');
    console.log('4. 終了');
    
    const choice = await this.question('選択してください (1-4): ');
    
    switch (choice) {
      case '1':
        await this.showMissingTranslations();
        break;
      case '2':
        await this.interactiveTranslation();
        break;
      case '3':
        await this.generateTranslationTemplate();
        break;
      case '4':
        console.log('終了します');
        rl.close();
        return;
      default:
        console.log('無効な選択です');
    }
    
    // メニューを再表示
    setTimeout(() => this.showMenu(), 1000);
  }
}

// 実行
async function main() {
  const helper = new ManualTranslationHelper();
  await helper.loadData();
  await helper.showMenu();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ManualTranslationHelper;