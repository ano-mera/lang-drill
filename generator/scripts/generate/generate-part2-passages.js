#!/usr/bin/env node

/**
 * TOEIC Part 2 問題生成スクリプト
 * 質問-応答形式のリスニング問題を生成
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import openai from '../../lib/openai-config.js';
import { PART2_GENERATION_CONFIG } from '../../lib/openai-config.js';
import { logPromptToFile } from '../../lib/prompt-logger.js';
import ElevenLabsAudio from '../../lib/elevenlabs-audio.js';
import { PROMPT_TEMPLATES, selectQuestionTypeByWeight, selectTopicByWeight } from '../../lib/prompt-templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Part 2問題データ構造
class Part2Question {
  constructor(data) {
    this.id = data.id;
    this.question = data.question;
    this.questionTranslation = data.questionTranslation;
    this.options = data.options; // [string, string, string]
    this.optionTranslations = data.optionTranslations; // [string, string, string]
    this.correct = data.correct; // 'A' | 'B' | 'C'
    this.explanation = data.explanation;
    this.questionType = data.questionType;
    this.difficulty = data.difficulty;
    this.topic = data.topic;
    this.createdAt = data.createdAt;
    this.generationBatch = data.generationBatch;
    this.partType = data.partType || 'part2';
    this.voiceProfile = data.voiceProfile; // 音声プロファイル情報
    this.audioFiles = data.audioFiles;
  }
}

class Part2Generator {
  constructor(options = {}) {
    this.batchId = options.batchId || `part2_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.config = {
      difficulty: options.difficulty || 'medium',
      count: options.count || 1,
      questionType: options.questionType || null,
      topic: options.topic || null
    };
    this.startingId = null;
    
    // プロンプト情報を収集する配列
    this.promptData = {
      generationPrompts: [],
      qualityCheckPrompts: [],
      revisionPrompts: []
    };
    
    // 質問タイプとトピックは重み付き選択関数で決定される
    
    // ElevenLabs音声生成の初期化（R2アップロード機能付き）
    try {
      this.audioGenerator = new ElevenLabsAudio({ useR2Upload: true });
      console.log('✅ ElevenLabs audio generator initialized with R2 upload');
    } catch (error) {
      console.warn('⚠️ ElevenLabs not available:', error.message);
      this.audioGenerator = null;
    }
  }

  // 質問タイプを選択（指定があれば指定を使用、なければ重み付きランダム）
  getQuestionType() {
    if (this.config.questionType) {
      console.log(`🎯 Using specified question type: ${this.config.questionType}`);
      return this.config.questionType;
    }
    const selectedTypeInfo = selectQuestionTypeByWeight();
    console.log(`🎯 Selected random question type: ${selectedTypeInfo.type} (weight: ${selectedTypeInfo.weight})`);
    return selectedTypeInfo.type;
  }

  // トピックを選択（指定があれば指定を使用、なければ重み付きランダム）
  getTopic() {
    if (this.config.topic) {
      console.log(`📝 Using specified topic: ${this.config.topic}`);
      return this.config.topic;
    }
    const selectedTopicInfo = selectTopicByWeight();
    console.log(`📝 Selected random topic: ${selectedTopicInfo.topic} (weight: ${selectedTopicInfo.weight})`);
    return selectedTopicInfo.topic;
  }

  // ランダムに正解位置を選択
  getRandomCorrectPosition() {
    const positions = ['A', 'B', 'C'];
    const randomIndex = Math.floor(Math.random() * positions.length);
    const selectedPosition = positions[randomIndex];
    console.log(`🎲 Random correct position: ${selectedPosition}`);
    return selectedPosition;
  }

  async generateWithAI(systemPrompt, userPrompt, promptType) {
    try {
      console.log(`🤖 Calling OpenAI GPT-4o for ${promptType}...`);
      
      // プロンプト情報を収集
      const fullPrompt = systemPrompt + '\n\n' + userPrompt;
      this.promptData.generationPrompts.push({
        prompt: fullPrompt,
        promptType: promptType,
        metadata: { 
          difficulty: this.config.difficulty, 
          questionType: this.config.questionType,
          topic: this.config.topic,
          step: promptType
        }
      });
      
      // プロンプトをログに記録
      await logPromptToFile({
        batchId: this.batchId,
        functionName: 'generateWithAI',
        promptType: promptType,
        prompt: fullPrompt,
        metadata: {
          difficulty: this.config.difficulty,
          questionType: this.config.questionType,
          topic: this.config.topic
        }
      });
      
      const response = await openai.chat.completions.create({
        model: PART2_GENERATION_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: PART2_GENERATION_CONFIG.max_completion_tokens,
        temperature: PART2_GENERATION_CONFIG.temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      console.log(`📝 Raw response for ${promptType}:`, JSON.stringify(content, null, 2));

      // レスポンスをログに記録
      await logPromptToFile({
        batchId: this.batchId,
        functionName: 'generateWithAI',
        promptType: `${promptType}_response`,
        prompt: content,
        metadata: {
          difficulty: this.config.difficulty,
          questionType: this.config.questionType,
          topic: this.config.topic
        }
      });
      
      console.log(`✅ OpenAI response received successfully for ${promptType}`);
      return content;
    } catch (error) {
      console.error(`❌ OpenAI API error for ${promptType}:`, error);
      throw new Error(`OpenAI API failed for ${promptType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateQuestion() {
    try {
      // 質問タイプ、トピック、正解位置を決定
      const questionType = this.getQuestionType();
      const topic = this.getTopic();
      const correctPosition = this.getRandomCorrectPosition();
      
      // この問題用の音声を選択（問題全体で統一）
      const selectedVoice = this.audioGenerator ? this.audioGenerator.selectVoiceByWeight() : null;
      
      const config = {
        difficulty: this.config.difficulty,
        questionType: questionType,
        correctPosition: correctPosition,
        topic: topic
      };
      
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part2.questionGeneration.systemPrompt,
        PROMPT_TEMPLATES.part2.questionGeneration.userPrompt(config),
        'part2_question_generation'
      );
      
      console.log('🔍 Raw AI response:', response);
      
      // マークダウンコードブロックを除去
      let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // レスポンスが空でないことを確認
      if (!cleanResponse) {
        throw new Error('Empty response after cleaning');
      }
      
      console.log('🔍 Cleaned response:', cleanResponse);
      
      let parsed;
      try {
        parsed = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Problematic response:', cleanResponse);
        
        // JSONの修復を試行
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
            console.log('✅ JSON recovered using regex match');
          } catch (secondParseError) {
            throw new Error(`JSON parse failed even after regex extraction: ${secondParseError.message}`);
          }
        } else {
          throw new Error(`No valid JSON found in response: ${cleanResponse}`);
        }
      }
      
      // レスポンス形式の検証
      if (parsed && parsed.question && parsed.options && Array.isArray(parsed.options)) {
        // 必要なフィールドの検証
        if (!parsed.correct || !parsed.explanation || !parsed.difficulty) {
          throw new Error('Missing required fields in response');
        }
        
        // 選択肢が3つあることを確認
        if (parsed.options.length !== 3) {
          throw new Error(`Expected 3 options, got ${parsed.options.length}`);
        }
        
        return { questionData: parsed, selectedVoice };
      } else {
        throw new Error('Invalid question generation response format: missing or invalid fields');
      }
    } catch (error) {
      console.error('❌ Question generation failed:', error);
      throw error; // フォールバック処理を削除し、エラーをそのまま投げる
    }
  }

  async translateToJapanese(text) {
    try {
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part2.translation.systemPrompt,
        PROMPT_TEMPLATES.part2.translation.userPrompt(text),
        'part2_translation'
      );

      // 翻訳レスポンスの簡単なクリーニング
      let translation = response.trim();
      
      // 余分な引用符や説明文を除去
      translation = translation.replace(/^["']|["']$/g, '');
      translation = translation.replace(/^翻訳[:：]\s*/, '');
      
      if (translation && translation.length > 0) {
        return translation;
      } else {
        throw new Error('Empty translation response');
      }
    } catch (error) {
      console.error('❌ Translation failed:', error);
      throw error; // フォールバック処理を削除し、エラーをそのまま投げる
    }
  }

  async getNextQuestionId() {
    try {
      // データベースファイルのパス
      const dbPath = path.join(__dirname, '../../../src/data/part2-questions.json');
      
      // 既存データを読み込み
      let existingQuestions = [];
      try {
        const existingData = await fs.readFile(dbPath, 'utf8');
        if (existingData.trim().length > 0) {
          existingQuestions = JSON.parse(existingData);
        }
      } catch (readError) {
        console.log('⚠️ 既存ファイルの読み込みに失敗、新しいファイルを作成します');
        existingQuestions = [];
      }

      // 最大IDを見つけて+1する
      let maxId = 0;
      existingQuestions.forEach(question => {
        const match = question.id.match(/^part2_(\d+)$/);
        if (match) {
          const idNum = parseInt(match[1]);
          if (idNum > maxId) {
            maxId = idNum;
          }
        }
      });

      this.startingId = maxId + 1;
      console.log(`📝 次の問題IDは part2_${this.startingId} から開始します`);
      return this.startingId;
    } catch (error) {
      console.error('❌ ID取得エラー:', error);
      throw error; // フォールバック処理を削除し、エラーをそのまま投げる
    }
  }

  async saveToDatabase(questions) {
    try {
      // データベースファイルのパス
      const dbPath = path.join(__dirname, '../../../src/data/part2-questions.json');
      
      console.log(`📁 データベースパス: ${dbPath}`);
      
      // 既存データを読み込み
      let existingQuestions = [];
      try {
        console.log('📖 既存データを読み込み中...');
        const existingData = await fs.readFile(dbPath, 'utf8');
        
        if (existingData.trim().length === 0) {
          console.log('⚠️ ファイルが空です。新しい配列を作成します。');
          existingQuestions = [];
        } else {
          existingQuestions = JSON.parse(existingData);
          console.log(`✅ 既存の問題数: ${existingQuestions.length}`);
        }
      } catch (readError) {
        console.log('⚠️ 既存ファイルの読み込みに失敗:', readError.message);
        console.log('🔄 新しいファイルを作成します...');
        existingQuestions = [];
      }

      // 新しい問題を追加
      const updatedQuestions = [...existingQuestions, ...questions];
      
      console.log(`💾 保存予定の問題数: ${updatedQuestions.length} (既存: ${existingQuestions.length}, 新規: ${questions.length})`);
      
      // データベースに保存
      const jsonContent = JSON.stringify(updatedQuestions, null, 2);
      await fs.writeFile(dbPath, jsonContent, 'utf8');
      
      console.log(`✅ データベース更新完了: ${questions.length}問をpart2-questions.jsonに追加`);
      return true;
    } catch (error) {
      console.error('❌ Database save failed:', error);
      console.error('❌ Error details:', error.stack);
      
      // バックアップとして新しいファイルに保存を試行
      try {
        const backupPath = path.join(__dirname, `../../../src/data/part2-questions-backup-${Date.now()}.json`);
        await fs.writeFile(backupPath, JSON.stringify(questions, null, 2), 'utf8');
        console.log(`💾 バックアップファイルに保存しました: ${backupPath}`);
        return true;
      } catch (backupError) {
        console.error('❌ Backup save also failed:', backupError);
        throw new Error('Failed to save questions to database and backup');
      }
    }
  }

  async generate() {
    try {
      console.log(`🚀 Part 2 問題生成開始 (batchId: ${this.batchId})`);
      console.log(`📋 設定: difficulty=${this.config.difficulty}, count=${this.config.count}, questionType=${this.config.questionType || 'auto'}, topic=${this.config.topic || 'auto'}`);

      // Step 0: 次のIDを取得
      await this.getNextQuestionId();

      const generatedQuestions = [];
      
      // Step 1: 各問題を個別に生成
      console.log('Step 1: 問題を生成中...');
      for (let i = 0; i < this.config.count; i++) {
        try {
          console.log(`  問題 ${i + 1}/${this.config.count} を生成中...`);
          
          // Step 1a: 問題を生成（統一音声も含む）
          const { questionData, selectedVoice } = await this.generateQuestion();
          
          // Step 1b: 質問文の日本語翻訳を生成
          console.log(`    質問文の翻訳を生成中...`);
          const questionTranslation = await this.translateToJapanese(questionData.question);
          
          // Step 1c: 選択肢の日本語翻訳を生成
          console.log(`    選択肢の翻訳を生成中...`);
          const optionTranslations = await Promise.all(
            questionData.options.map(option => this.translateToJapanese(option))
          );
          
          // Step 1d: 音声ファイルを生成
          let audioFiles = {
            question: { text: questionData.question, audioPath: null },
            options: questionData.options.map((option, index) => ({
              option: String.fromCharCode(65 + index), // A, B, C
              text: option,
              audioPath: null,
              labelAudioPath: `/audio/labels/option_${String.fromCharCode(97 + index)}.mp3` // a, b, c
            }))
          };
          
          const questionId = `part2_${this.startingId + i}`;
          if (this.audioGenerator) {
            try {
              console.log(`    音声ファイル生成中...`);
              
              // Part 2専用の統合音声生成メソッドを使用（同じ音声で統一）
              const generatedAudio = await this.audioGenerator.generatePart2Audio(
                questionId,
                questionData.question,
                questionData.options,
                '/home/ki/projects/eng/public/audio/part2',
                selectedVoice
              );
              
              // 質問音声を設定
              if (generatedAudio.question && generatedAudio.question.audioPath) {
                audioFiles.question.audioPath = generatedAudio.question.audioPath;
              }
              
              // 選択肢音声を設定
              if (generatedAudio.options && generatedAudio.options.length > 0) {
                generatedAudio.options.forEach((audio, index) => {
                  if (index < audioFiles.options.length) {
                    audioFiles.options[index].audioPath = audio.audioPath;
                  }
                });
              }
              
              console.log(`    ✅ 音声ファイル生成完了`);
            } catch (audioError) {
              console.warn(`    ⚠️ 音声生成失敗: ${audioError.message}`);
              // 音声生成に失敗しても問題生成は継続
            }
          } else {
            console.log(`    ⚠️ ElevenLabs利用不可のため音声生成スキップ`);
          }

          // Step 1e: Part2Questionオブジェクトを作成
          const part2Question = new Part2Question({
            id: questionId,
            question: questionData.question,
            questionTranslation: questionTranslation,
            options: questionData.options,
            optionTranslations: optionTranslations,
            correct: questionData.correct,
            explanation: questionData.explanation,
            questionType: questionData.questionType,
            difficulty: questionData.difficulty,
            topic: questionData.topic,
            createdAt: new Date().toISOString(),
            generationBatch: this.batchId,
            partType: 'part2',
            voiceProfile: selectedVoice ? {
              voiceId: selectedVoice.voiceId,
              gender: selectedVoice.gender,
              accent: selectedVoice.accent,
              country: selectedVoice.country,
              age: selectedVoice.age,
              tone: selectedVoice.tone
            } : null,
            audioFiles: audioFiles
          });

          generatedQuestions.push(part2Question);
          console.log(`  ✅ 問題 ${i + 1} 完了 (タイプ: ${questionData.questionType}, 正解: ${questionData.correct})`);
        } catch (questionError) {
          console.error(`❌ 問題 ${i + 1} の生成に失敗:`, questionError.message);
          // 1つの問題生成に失敗しても続行
        }
      }

      // Step 2: データベースに保存
      console.log('Step 2: データベースに保存中...');
      await this.saveToDatabase(generatedQuestions);

      // 成功レポート
      console.log(`\n🎉 Part 2 問題生成完了!`);
      console.log(`📊 生成結果:`);
      console.log(`   ✅ 成功: ${generatedQuestions.length}問`);
      console.log(`   📝 Batch ID: ${this.batchId}`);
      console.log(`   📈 難易度: ${this.config.difficulty}`);
      console.log(`   🎯 質問タイプ: ${[...new Set(generatedQuestions.map(q => q.questionType))].join(', ')}`);
      console.log(`   🏷️  トピック: ${[...new Set(generatedQuestions.map(q => q.topic))].join(', ')}`);
      console.log(`   🎲 解答位置: ${[...new Set(generatedQuestions.map(q => q.correct))].join(', ')} (ランダム分布)`);
      
      // 標準出力に結果を出力（API側で使用）
      console.log(`GENERATED_IDS:${generatedQuestions.map(q => q.id).join(',')}`);
      
      // プロンプト情報をJSON形式で出力（APIが取得できるように）
      console.log(`PROMPT_DATA:${JSON.stringify(this.promptData)}`);

      return {
        success: true,
        batchId: this.batchId,
        generatedQuestions: generatedQuestions,
        count: generatedQuestions.length
      };

    } catch (error) {
      console.error('❌ Part 2 generation error:', error);
      throw error;
    }
  }
}

// コマンドライン引数の解析
function parseArguments() {
  const args = process.argv.slice(2);
  const config = {
    difficulty: 'medium',
    count: 1,
    questionType: null,
    topic: null,
    batchId: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--difficulty=')) {
      config.difficulty = arg.split('=')[1];
    } else if (arg.startsWith('--count=')) {
      config.count = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--question-type=')) {
      config.questionType = arg.split('=')[1];
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

    const generator = new Part2Generator(config);
    const result = await generator.generate();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Part 2 generation failed:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { Part2Generator, Part2Question };