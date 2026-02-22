#!/usr/bin/env node

/**
 * TOEIC Part 6 問題生成スクリプト
 * 長文穴埋め問題（4箇所）を生成
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import openai from '../../lib/openai-config.js';
import { PART6_GENERATION_CONFIG } from '../../lib/openai-config.js';
import { logPromptToFile } from '../../lib/prompt-logger.js';
import { 
  PROMPT_TEMPLATES, 
  PART6_DOCUMENT_TYPES, 
  PART6_QUESTION_TYPES,
  PART6_BUSINESS_TOPICS
} from '../../lib/prompt-templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Part 6問題データ構造
class Part6Question {
  constructor(data) {
    this.id = data.id;
    this.documentType = data.documentType;
    this.title = data.title;
    this.content = data.content;
    this.contentTranslation = data.contentTranslation;
    this.questions = data.questions; // 4問の配列
    this.difficulty = data.difficulty;
    this.topic = data.topic;
    this.createdAt = data.createdAt;
    this.generationBatch = data.generationBatch;
    this.partType = data.partType || 'part6';
  }
}

class Part6Generator {
  constructor(options = {}) {
    this.batchId = options.batchId || `part6_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.config = {
      difficulty: options.difficulty || 'medium',
      count: options.count || 1,
      documentType: options.documentType || null,
      topic: options.topic || null
    };
    this.startingId = null;
    
    // プロンプト情報を収集する配列
    this.promptData = {
      generationPrompts: [],
      qualityCheckPrompts: [],
      revisionPrompts: []
    };
    
    console.log(`🚀 Part 6 問題生成開始 (batchId: ${this.batchId})`);
    console.log(`📋 設定: difficulty=${this.config.difficulty}, count=${this.config.count}`);
  }

  // 重み付きランダム選択関数
  getRandomByWeight(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item;
      }
    }
    return items[0]; // フォールバック
  }

  // 文書タイプを選択（指定があれば指定を使用、なければ重み付きランダム）
  getDocumentType() {
    if (this.config.documentType) {
      const specified = PART6_DOCUMENT_TYPES.find(d => d.type === this.config.documentType);
      if (!specified) {
        throw new Error(`指定された文書タイプが見つかりません: ${this.config.documentType}`);
      }
      console.log(`📄 Using specified document type: ${specified.type} (${specified.description})`);
      return specified;
    }
    
    const selected = this.getRandomByWeight(PART6_DOCUMENT_TYPES);
    console.log(`📄 Selected weighted document type: ${selected.type} (weight: ${selected.weight})`);
    return selected;
  }

  // ビジネストピックを選択（指定があれば指定を使用、なければ重み付きランダム）
  getBusinessTopic() {
    if (this.config.topic) {
      // ユーザー指定のトピックをそのまま使用
      console.log(`📝 Using specified topic: ${this.config.topic}`);
      return {
        topic: this.config.topic,
        description: this.config.topic
      };
    }
    
    const selected = this.getRandomByWeight(PART6_BUSINESS_TOPICS);
    console.log(`📝 Selected weighted business topic: ${selected.topic} (${selected.description}, weight: ${selected.weight})`);
    return selected;
  }

  // 質問タイプを選択（4問分）
  getQuestionTypes() {
    const selectedTypes = [];
    const usedTypes = new Set();
    
    // 4問分の質問タイプを選択（重複を避ける）
    for (let i = 0; i < 4; i++) {
      let attempts = 0;
      let selected;
      
      do {
        selected = this.getRandomByWeight(PART6_QUESTION_TYPES);
        attempts++;
      } while (usedTypes.has(selected.type) && attempts < 10);
      
      selectedTypes.push(selected);
      usedTypes.add(selected.type);
      console.log(`🎯 Question ${i + 1} type: ${selected.type} (${selected.description})`);
    }
    
    return selectedTypes;
  }

  // ランダムに正解位置を選択（4問それぞれに対して）
  getRandomCorrectPositions() {
    const positions = ['A', 'B', 'C', 'D'];
    const correctPositions = [];
    
    // 4問それぞれにランダムな正解位置を割り当て
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * positions.length);
      const selectedPosition = positions[randomIndex];
      correctPositions.push(selectedPosition);
    }
    
    console.log(`🎲 Random correct positions: ${correctPositions.join(', ')}`);
    return correctPositions;
  }

  // AIでコンテンツを生成
  async generateWithAI(systemPrompt, userPrompt, promptType) {
    try {
      console.log(`🔄 Generating ${promptType}...`);
      
      // プロンプト情報を収集
      const fullPrompt = systemPrompt + '\n\n' + userPrompt;
      this.promptData.generationPrompts.push({
        prompt: fullPrompt,
        promptType: promptType,
        metadata: { 
          difficulty: this.config.difficulty,
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
          difficulty: this.config.difficulty
        }
      });

      const response = await openai.chat.completions.create({
        model: PART6_GENERATION_CONFIG.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: PART6_GENERATION_CONFIG.temperature,
        max_completion_tokens: PART6_GENERATION_CONFIG.max_completion_tokens || 4000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error('❌ OpenAI Response Details:', {
          model: PART6_GENERATION_CONFIG.model,
          response: response,
          choices: response.choices,
          message: response.choices[0]?.message,
          finish_reason: response.choices[0]?.finish_reason,
          error: response.error
        });
        throw new Error('Empty response from OpenAI');
      }

      console.log(`📝 Raw response for ${promptType}:`);

      // レスポンスをログに記録
      await logPromptToFile({
        batchId: this.batchId,
        functionName: 'generateWithAI',
        promptType: promptType + '_response',
        prompt: content,
        metadata: {
          difficulty: this.config.difficulty
        }
      });

      return content;
    } catch (error) {
      console.error(`❌ AI generation error (${promptType}):`, error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response,
        data: error.response?.data,
        model: PART6_GENERATION_CONFIG.model
      });
      throw error;
    }
  }

  // Part 6問題を生成
  async generateDocument() {
    try {
      const documentType = this.getDocumentType();
      const businessTopic = this.getBusinessTopic();
      const questionTypes = this.getQuestionTypes();
      const correctPositions = this.getRandomCorrectPositions();
      
      console.log('📝 Generating Part 6 document...');
      console.log(`📄 Document Type: ${documentType.type}`);
      console.log(`📝 Business Topic: ${businessTopic.topic} (${businessTopic.description})`);
      console.log(`🎯 Question Types: ${questionTypes.map(q => q.type).join(', ')}`);
      
      const config = {
        difficulty: this.config.difficulty,
        documentType,
        businessTopic,
        questionTypes,
        correctPositions
      };
      
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part6.textGeneration.systemPrompt,
        PROMPT_TEMPLATES.part6.textGeneration.userPrompt(config),
        'part6_document_generation'
      );
      
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
      if (!parsed.title || (!parsed.content && !parsed.fullText) || (!Array.isArray(parsed.questions) && !Array.isArray(parsed.blanks))) {
        throw new Error('Invalid document generation response format: missing required fields');
      }
      
      // fullText -> content, blanks -> questions の変換
      if (parsed.fullText && !parsed.content) {
        parsed.content = parsed.fullText;
      }
      if (parsed.blanks && !parsed.questions) {
        parsed.questions = parsed.blanks.map((blank, index) => ({
          id: `q${index + 1}`,
          options: blank.options,
          optionTranslations: blank.options, // 翻訳は後で処理
          correct: blank.correct,
          explanation: blank.explanation,
          questionType: blank.questionType
        }));
      }
      
      // 質問が4つあることを確認
      if (parsed.questions.length !== 4) {
        throw new Error(`Expected 4 questions, got ${parsed.questions.length}`);
      }
      
      // 各質問に必要なフィールドがあることを確認
      for (let i = 0; i < parsed.questions.length; i++) {
        const question = parsed.questions[i];
        if (!Array.isArray(question.options) || !question.correct || !question.explanation) {
          throw new Error(`Question ${i + 1} is missing required fields`);
        }
        if (question.options.length !== 4) {
          throw new Error(`Question ${i + 1} should have 4 options, got ${question.options.length}`);
        }
      }
      
      // Add metadata
      const documentData = {
        ...parsed,
        documentType: documentType.type,
        documentTypeDescription: documentType.description
      };
      
      return documentData;
      
    } catch (error) {
      console.error('❌ Document generation failed:', error);
      throw error;
    }
  }

  // 翻訳メソッド（文書全体と質問を一度に翻訳）
  async translateDocument(documentData) {
    try {
      console.log('🔄 バッチ翻訳（文書全体）を開始...');
      
      // 空欄に正解を埋めた完全な文書を作成
      let completedContent = documentData.content || documentData.fullText;
      (documentData.questions || documentData.blanks).forEach((item, index) => {
        const correctIndex = item.correct.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        const correctAnswer = item.options[correctIndex];
        const blankPattern = new RegExp(`\\(${index + 1}\\)`, 'g');
        completedContent = completedContent.replace(blankPattern, correctAnswer);
      });
      
      console.log('✅ 空欄に正解を埋めた文書を作成しました');
      console.log('📝 完成した文書プレビュー:');
      console.log(completedContent.substring(0, 200) + '...');
      
      // 翻訳用のデータを作成（完成した文書を含む）
      const translationData = {
        ...documentData,
        completedContent: completedContent
      };
      
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part6.translation.systemPrompt,
        PROMPT_TEMPLATES.part6.translation.userPrompt(translationData),
        'part6_document_translation'
      );
      
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
      if (!parsed.titleTranslation || !parsed.contentTranslation || !Array.isArray(parsed.questionsTranslations)) {
        throw new Error('Invalid translation response format: missing required fields');
      }
      
      if (parsed.questionsTranslations.length !== 4) {
        throw new Error(`Expected 4 question translations, got ${parsed.questionsTranslations.length}`);
      }
      
      console.log('✅ バッチ翻訳（文書全体）完了');
      return parsed;
      
    } catch (error) {
      console.error('❌ Document translation failed:', error);
      throw error;
    }
  }

  async getNextQuestionId() {
    try {
      // データベースファイルのパス
      const dbPath = path.join(__dirname, '../../../src/data/part6-questions.json');
      
      let questions = [];
      try {
        const data = await fs.readFile(dbPath, 'utf8');
        questions = JSON.parse(data);
      } catch (error) {
        // ファイルが存在しない場合は空配列から開始
        console.log('📁 Part6 questions file not found, starting from ID 1');
        questions = [];
      }
      
      // 既存の最大IDを取得
      let maxId = 0;
      questions.forEach(q => {
        const match = q.id.match(/^part6_(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxId) {
            maxId = num;
          }
        }
      });

      this.startingId = maxId + 1;
      console.log(`📝 次の問題IDは part6_${this.startingId} から開始します`);
      return this.startingId;
    } catch (error) {
      console.error('❌ ID取得エラー:', error);
      throw error;
    }
  }

  async saveToDatabase(questions) {
    try {
      // データベースファイルのパス
      const dbPath = path.join(__dirname, '../../../src/data/part6-questions.json');
      console.log(`📁 データベースパス: ${dbPath}`);
      
      console.log('📖 既存データを読み込み中...');
      let existingQuestions = [];
      try {
        const data = await fs.readFile(dbPath, 'utf8');
        existingQuestions = JSON.parse(data);
        console.log(`✅ 既存の問題数: ${existingQuestions.length}`);
      } catch (error) {
        console.log('📁 既存ファイルなし、新規作成します');
        existingQuestions = [];
      }
      
      // 重複チェック
      const newQuestions = questions.filter(newQ => {
        const isDuplicate = existingQuestions.some(existingQ => 
          existingQ.title === newQ.title && 
          existingQ.documentType === newQ.documentType
        );
        
        if (isDuplicate) {
          console.warn(`⚠️  重複検出: ${newQ.id} (title: ${newQ.title})`);
        }
        
        return !isDuplicate;
      });
      
      // 新しい問題を追加
      const updatedQuestions = [...existingQuestions, ...newQuestions];
      
      console.log(`💾 保存予定の問題数: ${updatedQuestions.length} (既存: ${existingQuestions.length}, 新規: ${newQuestions.length})`);
      
      // ファイルに保存
      await fs.writeFile(dbPath, JSON.stringify(updatedQuestions, null, 2));
      console.log(`✅ データベース更新完了: ${newQuestions.length}問をpart6-questions.jsonに追加`);
      
      return newQuestions.length;
    } catch (error) {
      console.error('❌ データベース保存エラー:', error);
      throw error;
    }
  }

  async generateBatch() {
    console.log('🚀 Part 6問題生成を開始します...');
    console.log(`📋 設定: ${JSON.stringify(this.config, null, 2)}`);
    
    const questions = [];
    const generatedIds = [];
    const failedQuestions = [];
    
    try {
      // 最初のIDを取得
      await this.getNextQuestionId();
      
      // 指定された数の問題を生成
      for (let i = 0; i < this.config.count; i++) {
        console.log(`\n🔄 問題 ${i + 1}/${this.config.count} を生成中...`);
        
        try {
          // 問題を生成
          const documentData = await this.generateDocument();
          
          // IDを生成
          const questionId = `part6_${this.startingId + i}`;
          console.log(`📝 問題ID: ${questionId}`);
          
          // 翻訳を生成
          console.log('🔄 文書翻訳を生成中...');
          const translations = await this.translateDocument(documentData);
          
          // 各質問にIDを割り当て
          for (let j = 0; j < documentData.questions.length; j++) {
            documentData.questions[j].id = `${questionId}_q${j + 1}`;
            
            // 翻訳を適用
            if (translations.questionsTranslations[j]) {
              documentData.questions[j].optionTranslations = translations.questionsTranslations[j].optionTranslations;
            }
          }
          
          // Part6Questionオブジェクトを作成
          const part6Question = new Part6Question({
            id: questionId,
            documentType: documentData.documentType,
            title: documentData.title,
            titleTranslation: translations.titleTranslation,
            content: documentData.content,
            contentTranslation: translations.contentTranslation,
            questions: documentData.questions,
            difficulty: this.config.difficulty,
            topic: documentData.topic,
            createdAt: new Date().toISOString(),
            generationBatch: this.batchId,
            partType: 'part6'
          });
          
          questions.push(part6Question);
          generatedIds.push(questionId);
          
          console.log(`✅ 問題 ${i + 1}/${this.config.count} の生成が完了しました`);
          
        } catch (error) {
          console.error(`❌ 問題 ${i + 1} の生成に失敗:`, error);
          failedQuestions.push({
            index: i + 1,
            error: error.message
          });
          // 続行
          console.log('⏭️ 次の問題に進みます...');
        }
      }
      
      // データベースに保存
      if (questions.length > 0) {
        const savedCount = await this.saveToDatabase(questions);
        console.log(`\n🎉 ${questions.length}問のPart 6問題生成が完了しました！`);
        
        // 生成されたIDを出力（APIが取得するため）
        console.log(`GENERATED_IDS:${generatedIds.join(',')}`);
        
        // プロンプトデータを出力
        console.log(`PROMPT_DATA:${JSON.stringify(this.promptData)}`);
        
        console.log('=== Part 6 問題生成完了 ===');
        console.log(`✅ 成功: ${questions.length}問`);
        console.log(`❌ 失敗: ${failedQuestions.length}問`);
        console.log(`💾 保存: ${savedCount}問`);
        console.log(`🆔 バッチID: ${this.batchId}`);
        
        return {
          success: savedCount > 0,
          count: savedCount,
          failed: failedQuestions.length,
          batchId: this.batchId,
          generatedIds: generatedIds,
          failures: failedQuestions,
          generationPrompts: this.promptData.generationPrompts
        };
      } else {
        console.log('⚠️ 生成された問題がありません');
        throw new Error(`All ${this.config.count} question generation attempts failed`);
      }
      
    } catch (error) {
      console.error('❌ バッチ生成エラー:', error);
      throw error;
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
  
  // バリデーション
  if (!['easy', 'medium', 'hard'].includes(options.difficulty)) {
    options.difficulty = 'medium';
  }

  if (options.count && (options.count < 1 || options.count > 10)) {
    options.count = 1;
  }

  // 文書タイプのバリデーション
  if (options.documentType) {
    const validDocumentTypes = PART6_DOCUMENT_TYPES.map(d => d.type);
    if (!validDocumentTypes.includes(options.documentType)) {
      console.error(`❌ 無効な文書タイプ: ${options.documentType}`);
      console.log(`利用可能な文書タイプ: ${validDocumentTypes.join(', ')}`);
      process.exit(1);
    }
  }
  
  return options;
}

// メイン処理
async function main() {
  try {
    const options = parseArgs();
    console.log('🎯 Part 6問題生成オプション:', options);
    
    const generator = new Part6Generator(options);
    const result = await generator.generateBatch();
    
    console.log('\n✅ Part 6 問題生成が完了しました');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmainを実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { Part6Generator };