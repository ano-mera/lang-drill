#!/usr/bin/env node

/**
 * TOEIC Part 1 問題生成スクリプト
 * 既存のアーキテクチャに合わせた実装
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import openai from '../../lib/openai-config.js';
import { PART1_GENERATION_CONFIG } from '../../lib/openai-config.js';
import { logPromptToFile, readPromptLogs } from '../../lib/prompt-logger.js';
import ElevenLabsAudio from '../../lib/elevenlabs-audio.js';
import DalleImageGenerator from '../../lib/dalle-image.js';
import { PROMPT_TEMPLATES, PART1_SCENE_SETTINGS, PART1_ATTRIBUTES, PART1_PEOPLE_RATIO } from '../../lib/prompt-templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Part 1 プロンプトテンプレートは prompt-templates.js から取得

// データベース更新用のPart1データ構造
class Part1Question {
  constructor(data) {
    this.id = data.id;
    this.sceneDescription = data.sceneDescription; // 解析後シーン説明文の日本語翻訳（表示用）
    this.originalSceneDescription = data.originalSceneDescription; // 生成前シーン説明文（英語、画像生成用）
    this.analyzedSceneDescription = data.analyzedSceneDescription; // 解析後シーン説明文（英語、問題生成用）
    // Part 1には問題文がない
    this.options = data.options;
    this.correct = data.correct;
    this.explanation = data.explanation;
    // Part 1には問題文翻訳がない
    this.optionTranslations = data.optionTranslations;
    this.difficulty = data.difficulty;
    this.topic = data.topic;
    this.scene = data.scene; // 環境・シーン情報
    this.questionType = data.questionType;
    this.createdAt = data.createdAt;
    this.generationBatch = data.generationBatch;
    this.audioFiles = data.audioFiles; // ElevenLabs音声ファイル情報
    this.voiceProfile = data.voiceProfile; // 音声プロファイル情報
    this.partType = data.partType || 'part1'; // パートタイプ
    this.imagePath = data.imagePath; // 最適化画像パス
    this.originalImagePath = data.originalImagePath; // 元画像パス
    this.imagePrompt = data.imagePrompt; // 画像生成プロンプト
    this.optionExplanations = data.optionExplanations; // 各選択肢の個別解説
  }
}

class Part1Generator {
  constructor(options = {}) {
    this.batchId = options.batchId || `part1_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.config = {
      difficulty: options.difficulty || 'medium',
      count: options.count || 1,
      scene: options.scene,
      voiceProfile: options.voiceProfile,
      includePeople: options.includePeople !== undefined ? options.includePeople : null
    };
    this.startingId = null; // 開始IDを保存
    
    // 環境設定リストをPART1_ATTRIBUTES.environmentから取得
    this.sceneSettings = Object.keys(PART1_ATTRIBUTES.environment);
    
    // ElevenLabs音声生成の初期化（R2アップロード機能付き）
    try {
      this.audioGenerator = new ElevenLabsAudio({ useR2Upload: true });
      console.log('✅ ElevenLabs audio generator initialized with R2 upload');
    } catch (error) {
      console.warn('⚠️ ElevenLabs not available:', error.message);
      this.audioGenerator = null;
    }
    
    // DALL-E画像生成の初期化
    try {
      this.imageGenerator = new DalleImageGenerator();
      console.log('✅ DALL-E image generator initialized');
    } catch (error) {
      console.warn('⚠️ DALL-E not available:', error.message);
      this.imageGenerator = null;
    }
  }

  // ランダムにシーン設定を選択
  getRandomSceneSetting() {
    const randomIndex = Math.floor(Math.random() * this.sceneSettings.length);
    const selectedScene = this.sceneSettings[randomIndex];
    console.log(`🎯 Selected scene: ${selectedScene} (index: ${randomIndex}/${this.sceneSettings.length - 1})`);
    return selectedScene;
  }

  // ランダムに正解位置を選択
  getRandomCorrectPosition() {
    const positions = ['A', 'B', 'C', 'D'];
    const randomIndex = Math.floor(Math.random() * positions.length);
    const selectedPosition = positions[randomIndex];
    console.log(`🎲 Random correct position: ${selectedPosition} (index: ${randomIndex}/${positions.length - 1})`);
    return selectedPosition;
  }

  // 次の問題IDを生成
  getNextId(index) {
    return `part1_${this.startingId + index}`;
  }


  async generateWithAI(systemPrompt, userPrompt, promptType) {
    try {
      console.log(`🤖 Calling OpenAI ${PART1_GENERATION_CONFIG.model} for ${promptType}...`);
      
      // プロンプトをログに記録
      await logPromptToFile({
        batchId: this.batchId,
        functionName: 'generateWithAI',
        promptType: promptType,
        prompt: systemPrompt + '\n\n' + userPrompt,
        metadata: {
          difficulty: this.config.difficulty
        }
      });
      
      const response = await openai.chat.completions.create({
        model: PART1_GENERATION_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: PART1_GENERATION_CONFIG.max_completion_tokens,
        temperature: PART1_GENERATION_CONFIG.temperature,
      });

      console.log(`🔍 Full OpenAI response for ${promptType}:`, JSON.stringify(response, null, 2));
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error(`❌ Empty content in response for ${promptType}. Full response:`, response);
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
          difficulty: this.config.difficulty
        }
      });
      
      console.log(`✅ OpenAI response received successfully for ${promptType}`);
      return content;
    } catch (error) {
      console.error(`❌ OpenAI API error for ${promptType}:`, error);
      throw new Error(`OpenAI API failed for ${promptType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateSceneDescriptions(customConfig = null) {
    try {
      // カスタム設定が提供されていればそれを使用、そうでなければデフォルトの処理
      let configWithScene;
      if (customConfig) {
        configWithScene = customConfig;
      } else {
        // ランダムにシーン設定を選択（後方互換性のため）
        const selectedScene = this.getRandomSceneSetting();
        configWithScene = {
          ...this.config,
          sceneSetting: selectedScene
        };
      }
      
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part1.sceneGeneration.systemPrompt,
        PROMPT_TEMPLATES.part1.sceneGeneration.userPrompt(configWithScene),
        'part1_scene_generation'
      );
      
      console.log('🔍 Raw scene generation response:', response);
      
      // マークダウンコードブロックを除去
      let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      cleanResponse = cleanResponse.replace(/```\n?/g, '').trim();
      
      // レスポンスが空でないことを確認
      if (!cleanResponse) {
        throw new Error('Empty response after cleaning');
      }
      
      console.log('🔍 Cleaned scene response:', cleanResponse);
      
      let parsed;
      try {
        parsed = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Problematic response:', cleanResponse);
        
        // JSONの修復を試行
        const jsonMatch = cleanResponse.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
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
      
      // レスポンス形式の正規化
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed.scenes && Array.isArray(parsed.scenes)) {
        return parsed.scenes;
      } else if (parsed.sceneDescription) {
        return [parsed];
      } else {
        throw new Error('Invalid scene generation response format');
      }
    } catch (error) {
      console.error('❌ Scene generation failed:', error);
      console.log('🔄 Generating fallback scene descriptions...');
      
      // フォールバック: 手動で作成したシーン説明
      const fallbackScenes = [
        {
          sceneDescription: "A woman in business attire is sitting at a desk, typing on a laptop computer while looking at the screen.",
          difficulty: this.config.difficulty || "easy",
          topic: this.config.topic || "office environments"
        },
        {
          sceneDescription: "A man is standing at a whiteboard, pointing to a chart while presenting to colleagues seated around a conference table.",
          difficulty: this.config.difficulty || "easy", 
          topic: this.config.topic || "office environments"
        }
      ];
      
      const selectedScenes = fallbackScenes.slice(0, this.config.count);
      console.log(`✅ Using ${selectedScenes.length} fallback scene(s)`);
      return selectedScenes;
    }
  }

  async generateQuestionFromScene(sceneData) {
    try {
      const config = {
        sceneDescription: sceneData.englishSceneDescription || sceneData.sceneDescription, // 英語のシーン説明を優先使用
        difficulty: sceneData.difficulty,
        topic: sceneData.topic
      };
      
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part1.questionGeneration.systemPrompt,
        PROMPT_TEMPLATES.part1.questionGeneration.userPrompt(config),
        'part1_question_generation'
      );
      
      console.log('🔍 Raw AI response:', response);
      
      // マークダウンコードブロックを除去
      let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // 他の可能なマークダウン形式も除去
      cleanResponse = cleanResponse.replace(/```\n?/g, '').trim();
      
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
      
      // 3つのカテゴリのレスポンス形式の検証
      if (parsed && parsed.correctOptions && parsed.confusingOptionsWithMapping && parsed.unrelatedOptionsWithExplanations &&
          Array.isArray(parsed.correctOptions) && Array.isArray(parsed.confusingOptionsWithMapping) && Array.isArray(parsed.unrelatedOptionsWithExplanations)) {
        
        // 必要なフィールドの検証
        if (!parsed.difficulty) {
          throw new Error('Missing required fields in response');
        }
        
        // 選択肢数の確認
        if (parsed.correctOptions.length !== 4) {
          throw new Error(`Expected 4 correct options, got ${parsed.correctOptions.length}`);
        }
        if (parsed.confusingOptionsWithMapping.length !== 4) {
          throw new Error(`Expected 4 confusing options, got ${parsed.confusingOptionsWithMapping.length}`);
        }
        if (parsed.unrelatedOptionsWithExplanations.length !== 4) {
          throw new Error(`Expected 4 unrelated options, got ${parsed.unrelatedOptionsWithExplanations.length}`);
        }
        
        // 新しい構造の検証
        const correctOptionsValid = parsed.correctOptions.every(item => 
          typeof item === 'string'
        );
        const confusingOptionsValid = parsed.confusingOptionsWithMapping.every(item => 
          item && typeof item.option === 'string' && typeof item.explanation === 'string' && typeof item.sourceIndex === 'number'
        );
        const unrelatedOptionsValid = parsed.unrelatedOptionsWithExplanations.every(item => 
          item && typeof item.option === 'string' && typeof item.explanation === 'string'
        );
        
        if (!correctOptionsValid || !confusingOptionsValid || !unrelatedOptionsValid) {
          throw new Error('Invalid option structure: missing required fields');
        }
        
        // 難易度に応じた選択肢の組み合わせを決定
        const difficulty = sceneData.difficulty;
        let confusingCount, unrelatedCount;
        
        if (difficulty === 'easy') {
          confusingCount = 0;  // 紛らわしい選択肢 0つ
          unrelatedCount = 3;  // 無関係選択肢 3つ
        } else if (difficulty === 'medium') {
          confusingCount = 1;  // 紛らわしい選択肢 1つ
          unrelatedCount = 2;  // 無関係選択肢 2つ
        } else { // hard
          confusingCount = 3;  // 紛らわしい選択肢 3つ
          unrelatedCount = 0;  // 無関係選択肢 0つ
        }
        
        console.log(`🎯 Difficulty: ${difficulty} - Using ${confusingCount} confusing + ${unrelatedCount} unrelated options`);
        
        // Step 1: ランダムに正解選択肢を選択
        const selectedCorrectIndex = Math.floor(Math.random() * parsed.correctOptions.length);
        const selectedCorrect = parsed.correctOptions[selectedCorrectIndex];
        console.log(`🎲 Selected correct option at index ${selectedCorrectIndex}: "${selectedCorrect}"`);
        
        // Step 2: 選択された正解選択肢から派生したものでない紛らわしい選択肢を選択
        const availableConfusingOptions = parsed.confusingOptionsWithMapping.filter(
          confusingItem => confusingItem.sourceIndex !== selectedCorrectIndex
        );
        console.log(`🔍 Available confusing options (excluding source index ${selectedCorrectIndex}): ${availableConfusingOptions.length} options`);
        
        if (availableConfusingOptions.length < confusingCount) {
          console.warn(`⚠️ Not enough available confusing options (${availableConfusingOptions.length}) for required count (${confusingCount}). Using all available.`);
        }
        
        const shuffledConfusing = [...availableConfusingOptions].sort(() => Math.random() - 0.5);
        const selectedConfusingItems = shuffledConfusing.slice(0, Math.min(confusingCount, availableConfusingOptions.length));
        const selectedConfusing = selectedConfusingItems.map(item => item.option);
        
        // Step 3: 無関係選択肢をランダムに選択
        const shuffledUnrelatedItems = [...parsed.unrelatedOptionsWithExplanations].sort(() => Math.random() - 0.5);
        const selectedUnrelatedItems = shuffledUnrelatedItems.slice(0, unrelatedCount);
        const selectedUnrelated = selectedUnrelatedItems.map(item => item.option);
        
        console.log(`✅ Selected ${selectedConfusing.length} confusing options (not derived from selected correct option)`);
        console.log(`✅ Selected ${selectedUnrelated.length} unrelated options`);
        
        // 不正解選択肢を結合
        const selectedIncorrect = [...selectedConfusing, ...selectedUnrelated];
        
        // 4つの選択肢を作成（正解1つ、不正解3つ）
        const allOptions = [selectedCorrect, ...selectedIncorrect];
        
        // ランダムに正解位置を決定
        const positions = ['A', 'B', 'C', 'D'];
        const correctPosition = positions[Math.floor(Math.random() * positions.length)];
        const correctIndex = positions.indexOf(correctPosition);
        
        // 選択肢を配置（ランダムな位置に正解を配置）
        const finalOptions = ['', '', '', ''];
        finalOptions[correctIndex] = selectedCorrect;
        
        // 残りの位置に不正解選択肢を配置
        let incorrectIdx = 0;
        for (let i = 0; i < 4; i++) {
          if (i !== correctIndex) {
            finalOptions[i] = selectedIncorrect[incorrectIdx++];
          }
        }
        
        // 選択された解説データを収集（紛らわしい選択肢のみ）
        const optionExplanations = {};
        
        // 正解選択肢（解説なし）
        optionExplanations[correctPosition] = {
          type: 'correct'
        };
        
        // 紛らわしい選択肢の解説
        selectedConfusingItems.forEach((confusingItem, index) => {
          const position = positions.find(pos => finalOptions[positions.indexOf(pos)] === confusingItem.option);
          if (position) {
            optionExplanations[position] = {
              type: 'confusing',
              explanation: confusingItem.explanation
            };
          }
        });
        
        // 無関係選択肢の解説
        selectedUnrelatedItems.forEach((unrelatedItem, index) => {
          const position = positions.find(pos => finalOptions[positions.indexOf(pos)] === unrelatedItem.option);
          if (position) {
            optionExplanations[position] = {
              type: 'unrelated',
              explanation: unrelatedItem.explanation
            };
          }
        });

        return {
          options: finalOptions,
          correct: correctPosition,
          explanation: `正解: ${selectedCorrect}`, // 後方互換性のため
          difficulty: parsed.difficulty,
          questionType: parsed.questionType || 'action',
          optionExplanations: optionExplanations
        };
      } else {
        throw new Error('Invalid question generation response format: missing correctOptions, confusingOptionsWithMapping, or unrelatedOptionsWithExplanations arrays');
      }
    } catch (error) {
      console.error('❌ Question generation failed:', error);
      throw new Error(`Part1 question generation failed: ${error.message}`);
    }
  }

  async translateToJapanese(text) {
    try {
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part1.translation.systemPrompt,
        PROMPT_TEMPLATES.part1.translation.userPrompt(text),
        'part1_translation'
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
      
      // フォールバック: 基本的な翻訳マッピング
      const basicTranslations = {
        'typing': 'タイピング',
        'computer': 'コンピューター',
        'laptop': 'ノートパソコン',
        'woman': '女性',
        'man': '男性',
        'pointing': '指差し',
        'presentation': 'プレゼンテーション',
        'meeting': '会議',
        'office': 'オフィス',
        'desk': '机',
        'chair': '椅子',
        'whiteboard': 'ホワイトボード',
        'chart': 'チャート'
      };
      
      let fallbackTranslation = text;
      Object.entries(basicTranslations).forEach(([en, jp]) => {
        fallbackTranslation = fallbackTranslation.replace(new RegExp(en, 'gi'), jp);
      });
      
      console.log(`🔄 Using fallback translation: ${fallbackTranslation}`);
      return fallbackTranslation;
    }
  }

  async translateToEnglish(japaneseText) {
    try {
      const response = await this.generateWithAI(
        `You are a professional Japanese to English translator specializing in TOEIC test content. 

Translate the given Japanese text to natural English that would be appropriate for TOEIC Part 1 scene descriptions. The translation should:
- Be accurate and natural
- Use appropriate business/academic English when needed
- Maintain the meaning and tone of the original
- Be suitable for English listening comprehension tests

Return only the English translation without any explanation or additional text.`,
        `Translate to English: ${japaneseText}`,
        'part1_english_translation'
      );

      // 翻訳レスポンスの簡単なクリーニング
      let translation = response.trim();
      
      // 余分な引用符や説明文を除去
      translation = translation.replace(/^["']|["']$/g, '');
      translation = translation.replace(/^Translation[:：]\s*/i, '');
      
      if (translation && translation.length > 0) {
        return translation;
      } else {
        throw new Error('Empty English translation response');
      }
    } catch (error) {
      console.error('❌ English translation failed:', error);
      
      // フォールバック: 基本的な日本語→英語翻訳マッピング
      const basicTranslations = {
        'タイピング': 'typing',
        'コンピューター': 'computer',
        'ノートパソコン': 'laptop',
        '女性': 'woman',
        '男性': 'man',
        '指差し': 'pointing',
        'プレゼンテーション': 'presentation',
        '会議': 'meeting',
        'オフィス': 'office',
        '机': 'desk',
        '椅子': 'chair',
        'ホワイトボード': 'whiteboard',
        'チャート': 'chart'
      };
      
      let fallbackTranslation = japaneseText;
      Object.entries(basicTranslations).forEach(([jp, en]) => {
        fallbackTranslation = fallbackTranslation.replace(new RegExp(jp, 'gi'), en);
      });
      
      console.log(`🔄 Using fallback English translation: ${fallbackTranslation}`);
      return fallbackTranslation;
    }
  }

  // Part 1用バッチ翻訳メソッド
  async translateOptionsBatch(data) {
    try {
      console.log('🔄 バッチ翻訳（選択肢・解説）を開始...');
      
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part1Translation.optionsBatch.systemPrompt,
        PROMPT_TEMPLATES.part1Translation.optionsBatch.userPrompt(data),
        'part1_batch_options_translation'
      );
      
      // JSONレスポンスをパース
      let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      if (!cleanResponse) {
        throw new Error('Empty batch translation response');
      }
      
      let parsed;
      try {
        parsed = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('❌ JSON parse error in batch translation:', parseError);
        // JSONの修復を試行
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(`No valid JSON found in batch translation response: ${cleanResponse}`);
        }
      }
      
      // バリデーション
      if (!Array.isArray(parsed.optionTranslations) || 
          parsed.optionTranslations.length !== 4 ||
          !parsed.explanationTranslation) {
        throw new Error('Invalid batch translation response format');
      }
      
      console.log('✅ バッチ翻訳（選択肢・解説）完了');
      return {
        optionTranslations: parsed.optionTranslations,
        explanationTranslation: parsed.explanationTranslation
      };
      
    } catch (error) {
      console.error('❌ Batch options translation failed:', error);
      console.log('🔄 個別翻訳にフォールバック...');
      
      // フォールバック: 個別翻訳
      const optionTranslations = [];
      for (const option of data.options) {
        const translation = await this.translateToJapanese(option);
        optionTranslations.push(translation);
      }
      
      const explanationTranslation = await this.translateToJapanese(data.explanation);
      
      return {
        optionTranslations,
        explanationTranslation
      };
    }
  }

  async getNextQuestionId() {
    try {
      // データベースファイルのパス
      const dbPath = path.join(__dirname, '../../../src/data/part1-questions.json');
      
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
        const match = question.id.match(/^part1_(\d+)$/);
        if (match) {
          const idNum = parseInt(match[1]);
          if (idNum > maxId) {
            maxId = idNum;
          }
        }
      });

      this.startingId = maxId + 1;
      console.log(`📝 次の問題IDは part1_${this.startingId} から開始します`);
      return this.startingId;
    } catch (error) {
      console.error('❌ ID取得エラー:', error);
      // フォールバック: タイムスタンプベース
      this.startingId = Date.now() % 100000;
      return this.startingId;
    }
  }

  async saveToDatabase(questions) {
    try {
      // データベースファイルのパス
      const dbPath = path.join(__dirname, '../../../src/data/part1-questions.json');
      
      console.log(`📁 データベースパス: ${dbPath}`);
      
      // 既存データを読み込み
      let existingQuestions = [];
      try {
        console.log('📖 既存データを読み込み中...');
        const existingData = await fs.readFile(dbPath, 'utf8');
        
        console.log('🔍 読み込んだデータの先頭100文字:', existingData.substring(0, 100));
        
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
      
      console.log(`✅ データベース更新完了: ${questions.length}問をpart1-questions.jsonに追加`);
      return true;
    } catch (error) {
      console.error('❌ Database save failed:', error);
      console.error('❌ Error details:', error.stack);
      
      // バックアップとして新しいファイルに保存を試行
      try {
        const backupPath = path.join(__dirname, `../../../src/data/part1-questions-backup-${Date.now()}.json`);
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
      console.log(`🚀 Part 1 問題生成開始 (batchId: ${this.batchId})`);
      console.log(`📋 設定: difficulty=${this.config.difficulty}, count=${this.config.count}`);

      // Step 0: 次のIDを取得
      await this.getNextQuestionId();

      const generatedQuestions = [];
      
      // シーン指定の有無を確認
      const hasSpecifiedScene = !!this.config.scene;
      if (hasSpecifiedScene) {
        console.log(`🎯 All questions will use specified scene: ${this.config.scene}`);
      } else {
        console.log(`🎲 Each question will use a randomly selected scene`);
      }
      
      // Step 1 & 2: 各問題を生成
      console.log('Step 1 & 2: 問題を生成中...');
      for (let i = 0; i < this.config.count; i++) {
        try {
          // シーン指定がない場合は各問題でランダムに選択
          const selectedScene = this.config.scene || this.getRandomSceneSetting();
          console.log(`  問題 ${i + 1}/${this.config.count} を生成中... (シーン: ${selectedScene})`);
          
          // Step 2: シーン説明を生成
          // includePeopleの設定に基づいて人物の有無を決定（重み付けはprompt-templates.jsで設定）
          let includePeople = this.config.includePeople;
          if (includePeople === null || includePeople === undefined) {
            // 明示的な指定がない場合は、PART1_PEOPLE_RATIOの比率で人物ありを選択
            includePeople = Math.random() < PART1_PEOPLE_RATIO.withPeople;
          }
          console.log(`    シーン説明を生成中... (${selectedScene}, 人物${includePeople ? 'あり' : 'なし'})`);
          const configWithScene = {
            ...this.config,
            count: 1, // 1問ずつ生成
            sceneSetting: selectedScene,
            scene: selectedScene,
            includePeople: includePeople
          };
          
          const sceneDescriptions = await this.generateSceneDescriptions(configWithScene);
          if (!sceneDescriptions || sceneDescriptions.length === 0) {
            throw new Error('シーン説明の生成に失敗しました');
          }
          const scene = sceneDescriptions[0];
          
          // Step 2: 画像を生成（生成前シーン説明を使用）
          const originalSceneDescription = scene.sceneDescription; // 生成前シーン説明文（英語）
          console.log(`    画像を生成中...`);
          
          // 画像を生成
          let imagePath = null;
          let originalImagePath = null;
          let imagePrompt = null;
          let analyzedSceneDescription = null;
          let japaneseAnalyzedDescription = null; // 日本語訳（画像解析時に取得する場合）
          
          if (this.imageGenerator && originalSceneDescription) {
            try {
              const questionId = this.getNextId(i);
              const imageResult = await this.imageGenerator.generateWithRetry(
                originalSceneDescription, // 生成前シーン説明を使用
                questionId
                // 正解選択肢の制約なしで画像生成
              );
              
              if (imageResult.success) {
                imagePath = imageResult.webPath;
                originalImagePath = imageResult.originalPath;
                imagePrompt = imageResult.prompt;
                console.log(`    ✅ 画像生成完了: ${imagePath}`);
                
                // Step 3: 画像解析でシーン説明文を取得（英語と日本語）
                console.log(`    画像解析中...`);
                const imageAnalysisResult = await this.imageGenerator.analyzeImage(
                  imageResult.originalPath.replace(/^\//, process.cwd() + '/public/'),
                  questionId
                );
                
                if (imageAnalysisResult.success) {
                  analyzedSceneDescription = imageAnalysisResult.analyzedDescription;
                  japaneseAnalyzedDescription = imageAnalysisResult.japaneseDescription;
                  console.log(`    ✅ 画像解析完了: ${analyzedSceneDescription}`);
                  if (japaneseAnalyzedDescription) {
                    console.log(`    ✅ 日本語訳も取得済み: ${japaneseAnalyzedDescription}`);
                  }
                } else {
                  console.warn(`    ⚠️ 画像解析失敗: ${imageAnalysisResult.error}`);
                  analyzedSceneDescription = originalSceneDescription; // フォールバック
                }
              } else {
                console.warn(`    ⚠️ 画像生成失敗: ${imageResult.error}`);
                analyzedSceneDescription = originalSceneDescription; // フォールバック
              }
            } catch (imageError) {
              console.warn(`    ⚠️ 画像処理エラー: ${imageError.message}`);
              analyzedSceneDescription = originalSceneDescription; // フォールバック
            }
          } else {
            console.log(`    ⏭️ 画像生成をスキップ（DALL-E未初期化またはシーン説明なし）`);
            analyzedSceneDescription = originalSceneDescription; // フォールバック
          }
          
          // analyzedSceneDescriptionがまだnullの場合（エラー時など）
          if (!analyzedSceneDescription) {
            analyzedSceneDescription = originalSceneDescription;
          }
          
          // Step 4: 解析後シーン説明文を使用して問題選択肢を生成
          console.log(`    解析後シーン説明文で問題選択肢を生成中...`);
          const finalQuestionData = await this.generateQuestionFromScene({
            sceneDescription: analyzedSceneDescription,
            difficulty: scene.difficulty,
            topic: scene.topic
          });
          
          // Step 5: 解析後シーン説明文を日本語に翻訳（画像解析で取得済みの場合はスキップ）
          if (!japaneseAnalyzedDescription) {
            console.log(`    解析後シーン説明文を日本語に翻訳中...`);
            japaneseAnalyzedDescription = await this.translateToJapanese(analyzedSceneDescription);
            console.log(`    ✅ 日本語翻訳完了: ${japaneseAnalyzedDescription}`);
          } else {
            console.log(`    ✅ 日本語翻訳は画像解析時に取得済み`);
          }
          
          // Step 6: バッチ翻訳（選択肢と解説を一括翻訳）
          console.log(`    選択肢と解説のバッチ翻訳を生成中...`);
          const batchTranslationResult = await this.translateOptionsBatch({
            options: finalQuestionData.options,
            explanation: finalQuestionData.explanation
          });
          
          const optionTranslations = batchTranslationResult.optionTranslations;
          const explanationTranslation = batchTranslationResult.explanationTranslation;
          
          // Step 7: 音声ファイルを生成
          let audioFiles = [];
          let voiceProfile = null;
          const questionId = `part1_${this.startingId + i}`;
          if (this.audioGenerator) {
            try {
              console.log(`    音声ファイル生成中...`);
              const audioResult = await this.audioGenerator.generateOptionsAudio(questionId, finalQuestionData.options, '/home/ki/projects/eng/public/audio/part1', this.config.voiceProfile);
              audioFiles = audioResult.audioFiles;
              voiceProfile = audioResult.voiceProfile;
              console.log(`    ✅ 音声ファイル ${audioFiles.length}個生成完了`);
            } catch (audioError) {
              console.warn(`    ⚠️ 音声生成失敗: ${audioError.message}`);
              // 音声生成に失敗しても問題生成は継続
              audioFiles = finalQuestionData.options.map((option, index) => ({
                option: String.fromCharCode(65 + index),
                text: option,
                audioPath: null
              }));
            }
          } else {
            console.log(`    ⚠️ ElevenLabs利用不可のため音声生成スキップ`);
            audioFiles = questionData.options.map((option, index) => ({
              option: String.fromCharCode(65 + index),
              text: option,
              audioPath: null
            }));
          }

          // Step 2h: Part1Questionオブジェクトを作成
          const part1Question = new Part1Question({
            id: questionId,
            sceneDescription: japaneseAnalyzedDescription, // 解析後シーン説明文の日本語翻訳
            originalSceneDescription: originalSceneDescription, // 生成前シーン説明文（英語、画像生成用）
            analyzedSceneDescription: analyzedSceneDescription, // 解析後シーン説明文（英語、問題生成用）
            options: finalQuestionData.options,
            correct: finalQuestionData.correct,
            explanation: explanationTranslation, // 日本語に翻訳された解説
            optionTranslations: optionTranslations,
            difficulty: finalQuestionData.difficulty,
            topic: scene.topic,
            scene: scene.scene,
            questionType: finalQuestionData.questionType,
            createdAt: new Date().toISOString(),
            generationBatch: this.batchId,
            audioFiles: audioFiles, // 音声ファイル情報を追加
            voiceProfile: voiceProfile, // 音声プロファイル情報を追加
            partType: 'part1', // パートタイプを追加
            imagePath: imagePath, // 最適化画像パス
            originalImagePath: originalImagePath, // 元画像パス
            imagePrompt: imagePrompt, // 画像生成プロンプトを追加
            optionExplanations: finalQuestionData.optionExplanations // 各選択肢の個別解説を追加
          });

          generatedQuestions.push(part1Question);
          console.log(`  ✅ 問題 ${i + 1} 完了 (シーン: ${selectedScene}, 正解: ${finalQuestionData.correct})`);
        } catch (questionError) {
          console.error(`❌ 問題 ${i + 1} の生成に失敗:`, questionError.message);
          throw new Error(`Failed to generate Part1 question ${i + 1}: ${questionError.message}`);
        }
      }

      // Step 4: データベースに保存
      console.log('Step 4: データベースに保存中...');
      await this.saveToDatabase(generatedQuestions);

      // 成功レポート
      console.log(`\n🎉 Part 1 問題生成完了!`);
      console.log(`📊 生成結果:`);
      console.log(`   ✅ 成功: ${generatedQuestions.length}問`);
      console.log(`   📝 Batch ID: ${this.batchId}`);
      console.log(`   📈 難易度: ${this.config.difficulty}`);
      console.log(`   🏷️  環境: ${[...new Set(generatedQuestions.map(q => q.sceneFeatures?.environment || 'unknown'))].join(', ')}`);
      console.log(`   🎯 使用シーン: ${generatedQuestions.length}問すべて異なるランダムシーン`);
      console.log(`   🎲 解答位置: ${[...new Set(generatedQuestions.map(q => q.correct))].join(', ')} (ランダム分布)`);
      
      // 標準出力に結果を出力（API側で使用）
      console.log(`GENERATED_IDS:${generatedQuestions.map(q => q.id).join(',')}`);

      // プロンプトログを読み込んで出力
      try {
        const promptData = await readPromptLogs(this.batchId);
        console.log(`PROMPT_DATA:${JSON.stringify(promptData)}`);
      } catch (error) {
        console.warn('プロンプトログの読み込みに失敗しました:', error);
        console.log(`PROMPT_DATA:${JSON.stringify({ generationPrompts: [], qualityCheckPrompts: [], revisionPrompts: [] })}`);
      }

      return {
        success: true,
        batchId: this.batchId,
        generatedQuestions: generatedQuestions,
        count: generatedQuestions.length
      };

    } catch (error) {
      console.error('❌ Part 1 generation error:', error);
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
    scene: null,
    batchId: null,
    voiceProfile: null,
    includePeople: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--difficulty=')) {
      config.difficulty = arg.split('=')[1];
    } else if (arg.startsWith('--count=')) {
      config.count = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--scene=')) {
      config.scene = arg.split('=')[1];
    } else if (arg.startsWith('--batch-id=')) {
      config.batchId = arg.split('=')[1];
    } else if (arg.startsWith('--voiceProfile=')) {
      try {
        // base64デコードしてからJSONパース
        const encodedProfile = arg.split('=')[1];
        const decodedProfile = Buffer.from(encodedProfile, 'base64').toString('utf8');
        config.voiceProfile = JSON.parse(decodedProfile);
        console.log('✅ Parsed voiceProfile:', config.voiceProfile);
      } catch (error) {
        console.warn('Failed to parse voiceProfile argument:', error);
        config.voiceProfile = null;
      }
    } else if (arg.startsWith('--includePeople=')) {
      config.includePeople = arg.split('=')[1] === 'true';
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

    // シーン選択のバリデーション
    if (config.scene && !Object.keys(PART1_ATTRIBUTES.environment).includes(config.scene)) {
      console.error(`❌ Invalid scene: "${config.scene}"`);
      console.error(`Available scenes: ${Object.keys(PART1_ATTRIBUTES.environment).join(', ')}`);
      throw new Error(`Invalid scene selection: "${config.scene}"`);
    }

    console.log('🔧 Configuration:', {
      difficulty: config.difficulty,
      count: config.count,
      scene: config.scene,
      voiceProfile: config.voiceProfile,
      includePeople: config.includePeople
    });
    
    const generator = new Part1Generator(config);
    const result = await generator.generate();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Part 1 generation failed:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { Part1Generator, Part1Question };