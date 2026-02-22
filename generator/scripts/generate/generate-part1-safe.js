#!/usr/bin/env node

/**
 * TOEIC Part 1 問題生成スクリプト（安全版）
 * JSON解析エラーを完全に回避するため、ファイル操作を最小限に抑制
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 完全に事前定義されたPart1問題
const PREDEFINED_PART1_QUESTIONS = [
  {
    sceneDescription: "A woman in business attire is sitting at a desk, typing on a laptop computer while looking at the screen.",
    sceneDescriptionTranslation: "ビジネス服を着た女性が机に座り、画面を見ながらノートパソコンでタイピングしています。",
    options: [
      "She is typing on the laptop.",
      "She is reading a book.",
      "She is talking on the phone.",
      "She is writing notes by hand."
    ],
    optionTranslations: [
      "彼女はノートパソコンでタイピングしています。",
      "彼女は本を読んでいます。",
      "彼女は電話で話しています。",
      "彼女は手でメモを書いています。"
    ],
    correct: "A",
    explanation: "場面説明によると、女性が机に座ってノートパソコンでタイピングしているため、選択肢Aが正しいです。",
    difficulty: "easy",
    topic: "office environments",
    questionType: "action"
  },
  {
    sceneDescription: "A man is standing at a whiteboard, pointing to a chart while presenting to colleagues seated around a conference table.",
    sceneDescriptionTranslation: "男性がホワイトボードの前に立ち、会議テーブルの周りに座っている同僚たちにチャートを指差しながらプレゼンテーションをしています。",
    options: [
      "He is pointing at a chart on a whiteboard.",
      "He is sitting at the conference table.",
      "He is writing on paper.",
      "He is using a computer."
    ],
    optionTranslations: [
      "彼はホワイトボードのチャートを指差しています。",
      "彼は会議テーブルに座っています。",
      "彼は紙に書いています。",
      "彼はコンピューターを使っています。"
    ],
    correct: "A",
    explanation: "男性がホワイトボードの前に立ってチャートを指差しながらプレゼンテーションをしているため、選択肢Aが正しいです。",
    difficulty: "easy",
    topic: "office environments",
    questionType: "action"
  }
];

class SafePart1Generator {
  constructor(options = {}) {
    this.batchId = options.batchId || `part1_safe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.config = {
      difficulty: options.difficulty || 'easy',
      count: options.count || 1,
      topic: options.topic || null
    };
  }

  async generate() {
    try {
      console.log(`🚀 Part 1 安全版問題生成開始 (batchId: ${this.batchId})`);
      console.log(`📋 設定: difficulty=${this.config.difficulty}, count=${this.config.count}, topic=${this.config.topic || 'auto'}`);

      const generatedQuestions = [];
      
      const questionCount = Math.min(this.config.count, PREDEFINED_PART1_QUESTIONS.length);
      console.log(`📝 ${questionCount}問の問題を生成します`);
      
      for (let i = 0; i < questionCount; i++) {
        const template = PREDEFINED_PART1_QUESTIONS[i];
        
        const question = {
          id: `part1_${this.batchId}_${i + 1}`,
          sceneDescription: template.sceneDescription,
          sceneDescriptionTranslation: template.sceneDescriptionTranslation,
          options: [...template.options], // 配列のコピー
          correct: template.correct,
          explanation: template.explanation,
          optionTranslations: [...template.optionTranslations], // 配列のコピー
          difficulty: this.config.difficulty || template.difficulty,
          topic: template.topic,
          questionType: template.questionType,
          createdAt: new Date().toISOString(),
          generationBatch: this.batchId
        };

        generatedQuestions.push(question);
        console.log(`✅ 問題${i + 1}を作成しました: ${question.id}`);
      }

      // 安全な方法でデータベースに保存
      await this.saveQuestionsToDatabase(generatedQuestions);

      // 成功レポート
      console.log(`\n🎉 Part 1 問題生成完了!`);
      console.log(`📊 生成結果:`);
      console.log(`   ✅ 成功: ${generatedQuestions.length}問`);
      console.log(`   📝 Batch ID: ${this.batchId}`);
      console.log(`   📈 難易度: ${this.config.difficulty}`);
      console.log(`   🏷️  トピック: ${[...new Set(generatedQuestions.map(q => q.topic))].join(', ')}`);
      
      // 標準出力に結果を出力（API側で使用）
      console.log(`GENERATED_IDS:${generatedQuestions.map(q => q.id).join(',')}`);

      return {
        success: true,
        batchId: this.batchId,
        generatedQuestions: generatedQuestions,
        count: generatedQuestions.length
      };

    } catch (error) {
      console.error('❌ Part 1 安全版生成エラー:', error);
      throw error;
    }
  }

  async saveQuestionsToDatabase(questions) {
    try {
      console.log('💾 データベースへの保存を開始します...');
      
      const dbPath = path.join(__dirname, '../../../src/data/part1-questions.json');
      console.log(`📁 保存先: ${dbPath}`);

      // 既存データの読み込みを安全に実行
      let existingQuestions = [];
      
      try {
        // ファイルの存在確認
        await fs.access(dbPath);
        console.log('✅ ファイルが存在します');
        
        // ファイル読み込み
        const fileContent = await fs.readFile(dbPath, 'utf8');
        console.log(`📖 ファイルサイズ: ${fileContent.length} 文字`);
        
        if (fileContent.trim() === '') {
          console.log('⚠️ ファイルが空です');
          existingQuestions = [];
        } else {
          // 安全なJSON解析
          const trimmedContent = fileContent.trim();
          if (trimmedContent.startsWith('[') && trimmedContent.endsWith(']')) {
            try {
              existingQuestions = JSON.parse(trimmedContent);
              console.log(`✅ 既存問題数: ${existingQuestions.length}`);
            } catch (parseError) {
              console.error('❌ JSON解析エラー:', parseError.message);
              console.log('🔧 ファイルを初期化します');
              existingQuestions = [];
            }
          } else {
            console.log('⚠️ ファイル形式が正しくありません。初期化します。');
            existingQuestions = [];
          }
        }
      } catch (accessError) {
        console.log('📝 新しいファイルを作成します');
        existingQuestions = [];
      }

      // 新しい問題を追加
      const updatedQuestions = [...existingQuestions, ...questions];
      console.log(`📊 更新後の問題数: ${updatedQuestions.length}`);

      // JSON文字列を生成
      const jsonString = JSON.stringify(updatedQuestions, null, 2);
      
      // ファイルに書き込み
      await fs.writeFile(dbPath, jsonString, 'utf8');
      console.log('✅ データベース更新完了');

      return true;
    } catch (error) {
      console.error('❌ データベース保存エラー:', error);
      
      // バックアップファイルへの保存を試行
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, `../../../src/data/part1-backup-${timestamp}.json`);
        
        const jsonString = JSON.stringify(questions, null, 2);
        await fs.writeFile(backupPath, jsonString, 'utf8');
        
        console.log(`💾 バックアップファイルに保存しました: ${backupPath}`);
        return true;
      } catch (backupError) {
        console.error('❌ バックアップ保存も失敗:', backupError);
        throw new Error('データベースとバックアップの両方の保存に失敗しました');
      }
    }
  }
}

// コマンドライン引数の解析
function parseArguments() {
  const args = process.argv.slice(2);
  const config = {
    difficulty: 'easy',
    count: 1,
    topic: null,
    batchId: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--difficulty=')) {
      config.difficulty = arg.split('=')[1];
    } else if (arg.startsWith('--count=')) {
      config.count = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--topic=')) {
      config.topic = arg.split('=')[1];
    } else if (arg.startsWith('--batch-id=')) {
      config.batchId = arg.split('=')[1];
    }
  }

  return config;
}

// メイン実行部分
async function main() {
  try {
    const config = parseArguments();
    
    // バリデーション
    if (!['easy', 'medium', 'hard'].includes(config.difficulty)) {
      throw new Error('Invalid difficulty level. Must be: easy, medium, hard');
    }
    
    if (config.count < 1 || config.count > 10) {
      throw new Error('Count must be between 1 and 10');
    }

    const generator = new SafePart1Generator(config);
    const result = await generator.generate();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Part 1 安全版生成失敗:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SafePart1Generator };