#!/usr/bin/env node

/**
 * TOEIC Part 5 問題生成スクリプト
 * 短文穴埋め問題を生成
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import openai from '../../lib/openai-config.js';
import { PART5_GENERATION_CONFIG } from '../../lib/openai-config.js';
import { logPromptToFile } from '../../lib/prompt-logger.js';
import { PROMPT_TEMPLATES, TEMPLATE_UTILS } from '../../lib/prompt-templates.js';

// デバッグ用ログ
console.log('🔍 PROMPT_TEMPLATES keys:', Object.keys(PROMPT_TEMPLATES || {}));
console.log('🔍 part5 exists:', !!PROMPT_TEMPLATES?.part5);
if (PROMPT_TEMPLATES?.part5) {
  console.log('🔍 part5 categories length:', PROMPT_TEMPLATES.part5.categories?.length);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Part 5問題データ構造
class Part5Question {
  constructor(data) {
    this.id = data.id;
    this.sentence = data.sentence;
    this.question = data.question;
    this.questionTranslation = data.questionTranslation;
    this.options = data.options; // [string, string, string, string]
    this.optionTranslations = data.optionTranslations; // [string, string, string, string]
    this.correct = data.correct; // 'A' | 'B' | 'C' | 'D'
    this.explanation = data.explanation;
    this.category = data.category;
    this.intent = data.intent;
    this.length = data.length;
    this.vocabLevel = data.vocabLevel;
    this.optionsType = data.optionsType;
    this.difficulty = data.difficulty;
    this.topic = data.topic;
    this.createdAt = data.createdAt;
    this.generationBatch = data.generationBatch;
    this.partType = data.partType || 'part5';
  }
}

class Part5Generator {
  constructor(options = {}) {
    this.batchId = options.batchId || `part5_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.config = {
      difficulty: options.difficulty || 'medium',
      count: options.count || 1,
      category: options.category || null,
      intent: options.intent || null,
      length: options.length || null,
      vocabLevel: options.vocabLevel || null,
      optionsType: options.optionsType || null,
      answerIndex: options.answerIndex || null
    };
    this.startingId = null;
    
    // プロンプト情報を収集する配列
    this.promptData = {
      generationPrompts: [],
      qualityCheckPrompts: [],
      revisionPrompts: []
    };
  }

  // カテゴリを選択（指定があれば指定を使用、なければ重み付きランダム）
  getCategory() {
    if (this.config.category) {
      console.log(`📚 Using specified category: ${this.config.category}`);
      return this.config.category;
    }
    
    const selected = TEMPLATE_UTILS.selectWeightedCategory();
    console.log(`📚 Selected weighted category: ${selected}`);
    return selected;
  }

  // 出題意図を取得
  getIntent(category) {
    if (this.config.intent) {
      console.log(`🎯 Using specified intent: ${this.config.intent}`);
      return this.config.intent;
    }
    
    const selected = TEMPLATE_UTILS.selectWeightedIntent(category);
    console.log(`🎯 Selected weighted intent for category '${category}': ${selected}`);
    return selected;
  }

  // 文の長さを取得
  getLength() {
    if (this.config.length) {
      console.log(`📏 Using specified length: ${this.config.length}`);
      return this.config.length;
    }
    const selected = TEMPLATE_UTILS.randomSelect(PROMPT_TEMPLATES.part5.lengths);
    console.log(`📏 Selected random length: ${selected}`);
    return selected;
  }

  // 語彙レベルを取得
  getVocabLevel() {
    if (this.config.vocabLevel) {
      console.log(`📖 Using specified vocab level: ${this.config.vocabLevel}`);
      return this.config.vocabLevel;
    }
    // 難易度に基づいて語彙レベルを設定
    const vocabLevel = this.config.difficulty || 'medium';
    console.log(`📖 Using vocab level based on difficulty: ${vocabLevel}`);
    return vocabLevel;
  }

  // 選択肢タイプを取得
  getOptionsType() {
    if (this.config.optionsType) {
      console.log(`🔤 Using specified options type: ${this.config.optionsType}`);
      return this.config.optionsType;
    }
    const selected = TEMPLATE_UTILS.randomSelect(PROMPT_TEMPLATES.part5.optionsTypes);
    console.log(`🔤 Selected random options type: ${selected}`);
    return selected;
  }

  // 正解位置を取得
  getAnswerIndex() {
    if (this.config.answerIndex) {
      console.log(`✅ Using specified answer index: ${this.config.answerIndex}`);
      return this.config.answerIndex;
    }
    const positions = PROMPT_TEMPLATES.part5.answerPositions;
    const selected = positions[Math.floor(Math.random() * positions.length)];
    console.log(`✅ Selected random answer index: ${selected}`);
    return selected;
  }

  // AIでコンテンツを生成
  async generateWithAI(systemPrompt, userPrompt, promptType) {
    try {
      console.log(`🔄 Generating ${promptType}...`);
      
      const response = await openai.chat.completions.create({
        model: PART5_GENERATION_CONFIG.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: PART5_GENERATION_CONFIG.temperature,
        max_completion_tokens: PART5_GENERATION_CONFIG.max_completion_tokens
      });

      const content = response.choices[0].message.content;
      
      // プロンプトをログに記録
      await logPromptToFile(promptType, userPrompt, content);
      
      // プロンプトデータを保存
      this.promptData.generationPrompts.push({
        type: promptType,
        systemPrompt,
        userPrompt,
        response: content,
        timestamp: new Date().toISOString()
      });
      
      return content;
    } catch (error) {
      console.error(`❌ AI generation error (${promptType}):`, error);
      throw error;
    }
  }

  // Part 5問題を生成
  async generateQuestion() {
    try {
      const category = this.getCategory();
      const intent = this.getIntent(category);
      const length = this.getLength();
      const vocabLevel = this.getVocabLevel();
      const optionsType = this.getOptionsType();
      const answerIndex = this.getAnswerIndex();
      
      const systemPrompt = PROMPT_TEMPLATES.part5.generation.systemPrompt;

      const userPrompt = PROMPT_TEMPLATES.part5.generation.userPrompt({
        difficulty: this.config.difficulty,
        category: category,
        intent: intent,
        length: length,
        vocabLevel: vocabLevel,
        optionsType: optionsType,
        answerIndex: answerIndex
      });

      const response = await this.generateWithAI(systemPrompt, userPrompt, 'part5_generation');
      
      // レスポンスをクリーニング
      let cleanResponse = response.trim();
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      cleanResponse = cleanResponse.trim();
      
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
      if (parsed && parsed.sentence && parsed.options && Array.isArray(parsed.options)) {
        // 必要なフィールドの検証
        if (!parsed.correct || !parsed.explanation || !parsed.difficulty) {
          throw new Error('Missing required fields in response');
        }
        
        // 選択肢が4つあることを確認
        if (parsed.options.length !== 4) {
          throw new Error(`Expected 4 options, got ${parsed.options.length}`);
        }
        
        return parsed;
      } else {
        throw new Error('Invalid question generation response format: missing or invalid fields');
      }
    } catch (error) {
      console.error('❌ Question generation failed:', error);
      throw error;
    }
  }

  async translateToJapanese(text) {
    try {
      const systemPrompt = PROMPT_TEMPLATES.part5.translation.question.systemPrompt;
      const userPrompt = PROMPT_TEMPLATES.part5.translation.question.userPrompt(text);
      
      const response = await this.generateWithAI(systemPrompt, userPrompt, 'part5_translation');

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
      throw error;
    }
  }

  async translateOptions(options, sentence) {
    try {
      const systemPrompt = PROMPT_TEMPLATES.part5.translation.options.systemPrompt;
      const optionsList = options.map((option, index) => `${index + 1}. ${option}`).join('\n');
      const userPrompt = PROMPT_TEMPLATES.part5.translation.options.userPrompt(sentence, optionsList);
      
      const response = await this.generateWithAI(systemPrompt, userPrompt, 'part5_options_translation');

      // レスポンスをパースして配列に変換
      const lines = response.trim().split('\n');
      const translations = [];
      
      for (let line of lines) {
        line = line.trim();
        // 行番号を除去 (例: "1. ～に/～で" → "～に/～で")
        line = line.replace(/^\d+\.\s*/, '');
        // 引用符を除去
        line = line.replace(/^["']|["']$/g, '');
        
        if (line && line.length > 0) {
          // 50文字以上の場合は警告
          if (line.length > 50) {
            console.warn(`⚠️ 翻訳が長すぎます (${line.length}文字): ${line}`);
          }
          translations.push(line);
        }
      }
      
      // 選択肢数と翻訳数が一致することを確認
      if (translations.length !== options.length) {
        throw new Error(`翻訳数が一致しません: 期待値${options.length}, 実際${translations.length}`);
      }
      
      return translations;
    } catch (error) {
      console.error('❌ Options translation failed:', error);
      throw error;
    }
  }

  // 統合翻訳メソッド（問題文と選択肢を一度に翻訳）
  async translateCombined(completeSentence, options) {
    try {
      const systemPrompt = PROMPT_TEMPLATES.part5.translation.combined.systemPrompt;
      const userPrompt = PROMPT_TEMPLATES.part5.translation.combined.userPrompt(completeSentence, options);
      
      const response = await this.generateWithAI(systemPrompt, userPrompt, 'part5_combined_translation');

      // レスポンスをクリーニング
      let cleanResponse = response.trim();
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      cleanResponse = cleanResponse.trim();
      
      if (!cleanResponse) {
        throw new Error('Empty response after cleaning');
      }
      
      // JSONパース
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
      if (!parsed.questionTranslation || !Array.isArray(parsed.optionTranslations)) {
        throw new Error('Invalid translation response format: missing required fields');
      }
      
      if (parsed.optionTranslations.length !== options.length) {
        throw new Error(`翻訳数が一致しません: 期待値${options.length}, 実際${parsed.optionTranslations.length}`);
      }
      
      return {
        questionTranslation: parsed.questionTranslation,
        optionTranslations: parsed.optionTranslations
      };
    } catch (error) {
      console.error('❌ Combined translation failed:', error);
      throw error;
    }
  }

  async getNextQuestionId() {
    try {
      // データベースファイルのパス
      const dbPath = path.join(__dirname, '../../../src/data/part5-questions.json');
      
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
        const match = question.id.match(/^part5_(\d+)$/);
        if (match) {
          const idNum = parseInt(match[1]);
          if (idNum > maxId) {
            maxId = idNum;
          }
        }
      });

      this.startingId = maxId + 1;
      console.log(`📝 次の問題IDは part5_${this.startingId} から開始します`);
      return this.startingId;
    } catch (error) {
      console.error('❌ ID取得エラー:', error);
      throw error;
    }
  }

  async saveToDatabase(questions) {
    try {
      // データベースファイルのパス
      const dbPath = path.join(__dirname, '../../../src/data/part5-questions.json');
      
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
      
      console.log(`✅ データベース更新完了: ${questions.length}問をpart5-questions.jsonに追加`);
      return true;
    } catch (error) {
      console.error('❌ データベース保存エラー:', error);
      throw error;
    }
  }

  async generateBatch() {
    console.log('🚀 Part 5問題生成を開始します...');
    console.log(`📋 設定: ${JSON.stringify(this.config, null, 2)}`);
    
    const questions = [];
    const generatedIds = [];
    
    try {
      // 最初のIDを取得
      await this.getNextQuestionId();
      
      // 指定された数の問題を生成
      for (let i = 0; i < this.config.count; i++) {
        console.log(`\n🔄 問題 ${i + 1}/${this.config.count} を生成中...`);
        
        try {
          // 問題を生成
          const questionData = await this.generateQuestion();
          
          // IDを生成
          const questionId = `part5_${this.startingId + i}`;
          console.log(`📝 問題ID: ${questionId}`);
          
          // 統合翻訳を生成（正解を埋めた完全な文で翻訳）
          console.log('🔄 統合翻訳を生成中（問題文＋選択肢）...');
          const correctIndex = questionData.correct.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
          const correctAnswer = questionData.options[correctIndex];
          const completeSentence = questionData.sentence.replace(/_+/g, correctAnswer);
          
          // 統合翻訳メソッドを使用
          const translations = await this.translateCombined(completeSentence, questionData.options);
          
          // Part5Questionオブジェクトを作成
          const part5Question = new Part5Question({
            id: questionId,
            sentence: questionData.sentence,
            question: questionData.question,
            questionTranslation: translations.questionTranslation,
            options: questionData.options,
            optionTranslations: translations.optionTranslations,
            correct: questionData.correct,
            explanation: questionData.explanation,
            category: questionData.category,
            intent: questionData.intent,
            length: questionData.length,
            vocabLevel: questionData.vocabLevel,
            optionsType: questionData.optionsType,
            difficulty: questionData.difficulty,
            topic: questionData.topic,
            createdAt: new Date().toISOString(),
            generationBatch: this.batchId,
            partType: 'part5'
          });
          
          questions.push(part5Question);
          generatedIds.push(questionId);
          
          console.log(`✅ 問題 ${i + 1}/${this.config.count} の生成が完了しました`);
          
        } catch (error) {
          console.error(`❌ 問題 ${i + 1} の生成に失敗:`, error);
          throw error;
        }
      }
      
      // データベースに保存
      if (questions.length > 0) {
        await this.saveToDatabase(questions);
        console.log(`\n🎉 ${questions.length}問のPart 5問題生成が完了しました！`);
        
        // 生成されたIDを出力（APIが取得するため）
        console.log(`GENERATED_IDS:${generatedIds.join(',')}`);
        
        // プロンプトデータを出力
        console.log(`PROMPT_DATA:${JSON.stringify(this.promptData)}`);
      } else {
        console.log('⚠️ 生成された問題がありません');
      }
      
    } catch (error) {
      console.error('❌ バッチ生成エラー:', error);
      process.exit(1);
    }
  }
}

// コマンドライン引数の処理
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      options[key] = value;
    }
  }
  
  // 数値の変換
  if (options.count) {
    options.count = parseInt(options.count);
  }
  
  return options;
}

// メイン処理
async function main() {
  try {
    const options = parseArgs();
    console.log('🎯 Part 5問題生成オプション:', options);
    
    const generator = new Part5Generator(options);
    await generator.generateBatch();
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmainを実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}