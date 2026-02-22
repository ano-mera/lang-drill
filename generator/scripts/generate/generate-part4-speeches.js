#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import openai from '../../lib/openai-config.js';
import { PART4_GENERATION_CONFIG } from '../../lib/openai-config.js';
import { 
  PROMPT_TEMPLATES, 
  PART4_SPEECH_TYPES,
  PART4_QUESTION_TYPES,
  INDUSTRIES 
} from '../../lib/prompt-templates.js';
import { logPromptToFile } from '../../lib/prompt-logger.js';
import ElevenLabsAudio from '../../lib/elevenlabs-audio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Part4Generator {
  constructor(config) {
    this.config = config;
    this.batchId = `part4_batch_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    this.startingId = 1;
    this.audioGenerator = null;
    
    // Part 2と同様のプロンプト情報収集構造
    this.promptData = {
      generationPrompts: [],
      qualityCheckPrompts: [],
      revisionPrompts: []
    };
    
    console.log(`🚀 Part 4 問題生成開始 (batchId: ${this.batchId})`);
    console.log(`📋 設定: difficulty=${config.difficulty}, count=${config.count}`);
  }

  async initializeAudioGenerator() {
    try {
      this.audioGenerator = new ElevenLabsAudio({ useR2Upload: true });
      console.log('ElevenLabs audio generator initialized with R2 upload');
    } catch (error) {
      console.warn('ElevenLabs audio generator initialization failed:', error.message);
      this.audioGenerator = null;
    }
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

  getRandomSpeechType() {
    let selectedSpeechType;
    
    // スピーチタイプが指定されている場合
    if (this.config.speechType) {
      selectedSpeechType = PART4_SPEECH_TYPES.find(s => s.type === this.config.speechType);
      if (!selectedSpeechType) {
        throw new Error(`指定されたスピーチタイプが見つかりません: ${this.config.speechType}`);
      }
      console.log(`🎯 Specified speech type: ${selectedSpeechType.type} (${selectedSpeechType.description})`);
    } else {
      // ランダム選択（従来の重み付け）
      selectedSpeechType = this.getRandomByWeight(PART4_SPEECH_TYPES);
      console.log(`🎯 Random selected speech type: ${selectedSpeechType.type} (weight: ${selectedSpeechType.weight})`);
    }
    
    // スピーチタイプの情報を返す
    return {
      speechType: selectedSpeechType.type,
      description: selectedSpeechType.description,
      jp: selectedSpeechType.jp
    };
  }

  getRandomIndustry() {
    let selectedIndustry;
    
    // 業種が指定されている場合
    if (this.config.industry) {
      selectedIndustry = INDUSTRIES.find(i => i.industry === this.config.industry);
      if (!selectedIndustry) {
        throw new Error(`指定された業種が見つかりません: ${this.config.industry}`);
      }
      console.log(`🏢 Specified industry: ${selectedIndustry.industry} (${selectedIndustry.description})`);
    } else {
      // ランダム選択（重み付け）
      selectedIndustry = this.getRandomByWeight(INDUSTRIES);
      console.log(`🏢 Random selected industry: ${selectedIndustry.industry} (weight: ${selectedIndustry.weight})`);
    }
    
    return {
      industry: selectedIndustry.industry,
      description: selectedIndustry.description,
      jp: selectedIndustry.jp
    };
  }

  // Part4用の質問タイプを定義（重複なし）
  getRandomQuestionTypes() {
    // 利用可能なタイプのコピーを作成（元の配列を変更しないため）
    const availableTypes = [...PART4_QUESTION_TYPES];
    const selectedTypes = [];
    
    // 3問分の質問タイプを重複なしで選択
    for (let i = 0; i < 3; i++) {
      // 残りのタイプから重み付きランダム選択
      const selected = this.getRandomByWeight(availableTypes);
      selectedTypes.push(selected.type);
      console.log(`🎯 Question ${i + 1} type: ${selected.type} (weight: ${selected.weight})`);
      
      // 選択したタイプを利用可能リストから除外
      const selectedIndex = availableTypes.findIndex(t => t.type === selected.type);
      availableTypes.splice(selectedIndex, 1);
      
      console.log(`📝 Remaining available types: ${availableTypes.length} (${availableTypes.map(t => t.type).join(', ')})`);
    }
    
    return selectedTypes;
  }

  // ランダムに正解位置を選択（3問それぞれに対して）
  getRandomCorrectPositions() {
    const positions = ['A', 'B', 'C', 'D'];
    const correctPositions = [];
    
    // 3問それぞれにランダムな正解位置を割り当て
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * positions.length);
      const selectedPosition = positions[randomIndex];
      correctPositions.push(selectedPosition);
    }
    
    console.log(`🎲 Random correct positions: ${correctPositions.join(', ')}`);
    return correctPositions;
  }

  // Part4用の話者選択（単一話者） - AIが生成したスピーカー情報から性別を取得
  extractSpeakerGender(speechData) {
    // AIが生成したスピーカー情報から性別を取得
    const aiSpeaker = speechData.speechContent?.speaker;
    let gender = 'female'; // デフォルト
    
    if (aiSpeaker && aiSpeaker.gender) {
      gender = aiSpeaker.gender.toLowerCase();
      console.log(`🎤 AI-generated speaker gender: ${gender}`);
    } else {
      console.log(`🎤 No gender specified by AI, using default: ${gender}`);
    }
    
    return {
      gender: gender,
      role: aiSpeaker?.role || 'Speaker',
      name: aiSpeaker?.name || 'Speaker'
    };
  }

  async generateSpeech() {
    try {
      const speechType = this.getRandomSpeechType();
      const industry = this.getRandomIndustry();
      const questionTypes = this.getRandomQuestionTypes();
      const correctPositions = this.getRandomCorrectPositions();
      
      console.log('\n📝 Generating Part 4 speech...');
      console.log(`🎯 Speech Type: ${speechType.speechType}`);
      console.log(`🏢 Industry: ${industry.industry}`);
      
      const config = {
        difficulty: this.config.difficulty,
        speechType,
        industry,
        questionTypes,
        correctPositions
      };
      
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part4.speechGeneration.systemPrompt,
        PROMPT_TEMPLATES.part4.speechGeneration.userPrompt(config),
        'part4_speech_generation'
      );
      
      // AIが生成したスピーカー情報から性別を取得
      const speaker = this.extractSpeakerGender(response);
      console.log(`🎤 Speaker: ${speaker.name} (${speaker.gender})`);
      
      // Add metadata
      const speechData = {
        ...response,
        speechType: speechType.speechType,
        speechTypeDescription: speechType.description,
        industry: industry.industry,
        industryDescription: industry.description,
        speaker: {
          ...response.speechContent.speaker,
          gender: speaker.gender // AIが生成した性別を使用
        }
      };
      
      return speechData;
      
    } catch (error) {
      console.error('❌ Speech generation failed:', error);
      throw error;
    }
  }

  async generateWithAI(systemPrompt, userPrompt, promptType) {
    try {
      console.log(`🤖 Calling OpenAI ${PART4_GENERATION_CONFIG.model} for ${promptType}...`);
      
      // Part 2と同様の形式でプロンプト情報を収集
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
        model: PART4_GENERATION_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: PART4_GENERATION_CONFIG.max_completion_tokens,
        temperature: PART4_GENERATION_CONFIG.temperature || 1, // モデル設定の温度を使用
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
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

      // JSONレスポンスをパース
      let cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      if (!cleanContent) {
        throw new Error('Empty JSON response');
      }

      let parsed;
      try {
        parsed = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.log('Raw content:', cleanContent);
        
        // 一般的なJSONエラーを修復
        let fixedContent = cleanContent;
        
        // 欠落しているカンマを修復
        fixedContent = fixedContent.replace(/"\s*\n\s*"/g, '",\n    "');
        fixedContent = fixedContent.replace(/}\s*\n\s*"/g, '},\n    "');
        fixedContent = fixedContent.replace(/]\s*\n\s*"/g, '],\n    "');
        
        try {
          parsed = JSON.parse(fixedContent);
          console.log('✅ JSON repaired successfully');
        } catch (innerError) {
          // JSONの修復を試行
          const jsonMatch = fixedContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
            } catch (finalError) {
              throw new Error(`Failed to parse JSON after extraction: ${finalError.message}`);
            }
          } else {
            throw new Error(`No valid JSON found in response: ${cleanContent}`);
          }
        }
      }

      console.log(`✅ ${promptType} completed successfully`);
      return parsed;

    } catch (error) {
      console.error(`❌ ${promptType} failed:`, error);
      throw error;
    }
  }

  async translateToJapanese(text) {
    try {
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part3.translation.systemPrompt,
        PROMPT_TEMPLATES.part3.translation.userPrompt(text),
        'part4_translation'
      );
      
      const translation = response.trim();
      if (translation) {
        return translation;
      } else {
        throw new Error('Empty translation response');
      }
    } catch (error) {
      console.error('❌ Translation failed:', error);
      throw error;
    }
  }

  // 統合翻訳メソッド（スピーチ + 問題を一括翻訳）
  async translateUnified(data) {
    try {
      console.log('🔄 統合翻訳を開始（スピーチ本文 + 問題・選択肢）...');
      
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part4.unifiedTranslation.systemPrompt,
        PROMPT_TEMPLATES.part4.unifiedTranslation.userPrompt(data),
        'part4_unified_translation'
      );
      
      console.log('✅ 統合翻訳完了');
      return response;
      
    } catch (error) {
      console.error('❌ Unified translation failed:', error);
      console.log('🔄 個別翻訳にフォールバック...');
      
      // フォールバック: 個別翻訳
      const textTranslation = await this.translateToJapanese(data.text);
      const questionsTranslations = [];
      
      for (const question of data.questions) {
        const questionTranslation = await this.translateToJapanese(question.question);
        const optionTranslations = [];
        
        for (const option of question.options) {
          const translation = await this.translateToJapanese(option);
          optionTranslations.push(translation);
        }
        
        questionsTranslations.push({
          questionTranslation,
          optionTranslations
        });
      }
      
      return {
        textTranslation,
        questionsTranslations
      };
    }
  }

  async getNextQuestionId() {
    try {
      // データベースファイルのパス
      const dbPath = join(__dirname, '../../../src/data/part4-questions.json');
      
      let questions = [];
      try {
        const data = await fs.readFile(dbPath, 'utf8');
        questions = JSON.parse(data);
      } catch (error) {
        // ファイルが存在しない場合は空配列から開始
        console.log('📁 Part4 questions file not found, starting from ID 1');
        questions = [];
      }
      
      // 既存の最大IDを取得
      let maxId = 0;
      questions.forEach(q => {
        const match = q.id.match(/^part4_(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxId) {
            maxId = num;
          }
        }
      });

      this.startingId = maxId + 1;
      console.log(`📝 次の問題IDは part4_${this.startingId} から開始します`);
      return this.startingId;
    } catch (error) {
      console.error('❌ ID取得エラー:', error);
      throw error;
    }
  }

  async saveToDatabase(questions) {
    try {
      // データベースファイルのパス
      const dbPath = join(__dirname, '../../../src/data/part4-questions.json');
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
          existingQ.speechType === newQ.speechType && 
          JSON.stringify(existingQ.text) === JSON.stringify(newQ.text)
        );
        
        if (isDuplicate) {
          console.warn(`⚠️  重複検出: ${newQ.id} (speechType: ${newQ.speechType})`);
        }
        
        return !isDuplicate;
      });
      
      // 新しい問題を追加
      const updatedQuestions = [...existingQuestions, ...newQuestions];
      
      console.log(`💾 保存予定の問題数: ${updatedQuestions.length} (既存: ${existingQuestions.length}, 新規: ${newQuestions.length})`);
      
      // ファイルに保存
      await fs.writeFile(dbPath, JSON.stringify(updatedQuestions, null, 2));
      console.log(`✅ データベース更新完了: ${newQuestions.length}問をpart4-questions.jsonに追加`);
      
      return newQuestions.length;
    } catch (error) {
      console.error('❌ データベース保存エラー:', error);
      throw error;
    }
  }

  // 音声ファイルの存在確認
  async validateAudioFiles(questionData) {
    try {
      const baseDir = '/home/ki/projects/eng/public/audio/part4';
      const missingFiles = [];
      
      // スピーチ音声ファイルの確認
      if (questionData.audioFiles?.speech?.audioPath) {
        const filePath = join(baseDir, questionData.audioFiles.speech.audioPath.replace('/audio/part4/', ''));
        try {
          await fs.access(filePath);
        } catch (error) {
          missingFiles.push(questionData.audioFiles.speech.audioPath);
        }
      }
      
      // Part4は問題文音声が不要なため、質問音声ファイルの確認をスキップ
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing audio files: ${missingFiles.join(', ')}`);
      }
      
      console.log(`🔍 Audio file validation passed: 1 speech file verified`);
    } catch (error) {
      console.error('❌ Audio file validation failed:', error);
      throw error;
    }
  }

  // 時間表記を音声用に変換する関数
  convertTimeForSpeech(text) {
    // 時間表記のパターンと変換ルール
    const timeConversions = [
      // 正時のパターン (例: 7:00 AM, 10:00 PM)
      { pattern: /\b(\d{1,2}):00\s*(AM|PM|am|pm)\b/g, 
        convert: (match, hour, period) => {
          const h = parseInt(hour);
          const hourWord = this.numberToWord(h);
          return `${hourWord} o'clock ${period.toUpperCase().split('').join(' ')}`;
        }
      },
      // 分が05の場合 (例: 9:05 AM)
      { pattern: /\b(\d{1,2}):05\s*(AM|PM|am|pm)\b/g,
        convert: (match, hour, period) => {
          const h = parseInt(hour);
          const hourWord = this.numberToWord(h);
          return `${hourWord} oh five ${period.toUpperCase().split('').join(' ')}`;
        }
      },
      // その他の時間 (例: 10:30 AM, 3:15 PM)
      { pattern: /\b(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)\b/g,
        convert: (match, hour, minute, period) => {
          const h = parseInt(hour);
          const m = parseInt(minute);
          const hourWord = this.numberToWord(h);
          const minuteWord = this.numberToWord(m);
          return `${hourWord} ${minuteWord} ${period.toUpperCase().split('').join(' ')}`;
        }
      }
    ];

    let convertedText = text;
    
    // 各パターンに対して変換を適用
    for (const conversion of timeConversions) {
      convertedText = convertedText.replace(conversion.pattern, conversion.convert);
    }
    
    return convertedText;
  }

  // 数字を英単語に変換するヘルパー関数
  numberToWord(num) {
    const words = [
      'zero', 'one', 'two', 'three', 'four', 'five', 
      'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
      'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'
    ];
    
    if (num <= 20) {
      return words[num];
    } else if (num < 30) {
      return `twenty-${words[num - 20]}`;
    } else if (num < 40) {
      return `thirty${num === 30 ? '' : '-' + words[num - 30]}`;
    } else if (num < 50) {
      return `forty${num === 40 ? '' : '-' + words[num - 40]}`;
    } else if (num < 60) {
      return `fifty${num === 50 ? '' : '-' + words[num - 50]}`;
    }
    
    return num.toString(); // フォールバック
  }

  async generateAudioFiles(questionData) {
    if (!this.audioGenerator) {
      const errorMsg = 'Audio generator not available (ElevenLabs initialization failed)';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      console.log('🎵 Starting audio generation...');
      
      // Part4音声ファイル用のディレクトリを設定
      const baseDir = '/home/ki/projects/eng/public/audio/part4';
      
      // Part4は単一話者
      const speaker = questionData.speaker;
      const speakerGender = speaker.gender || 'female';
      
      // 話者の性別に基づいて音声を選択
      const assignedVoice = this.audioGenerator.selectVoiceByGenderAndWeight(speakerGender);
      
      if (!assignedVoice) {
        throw new Error(`No suitable voice found for Part4 speaker (gender: ${speakerGender})`);
      }
      
      // 話者プロファイルに音声情報を追加
      speaker.voiceProfile = {
        voiceId: assignedVoice.voice_id,
        gender: assignedVoice.gender,
        accent: assignedVoice.accent,
        country: assignedVoice.country,
        age: assignedVoice.age,
        tone: assignedVoice.tone
      };
      
      console.log(`🎤 Selected voice for speaker: ${assignedVoice.voice_id} (${assignedVoice.accent} ${assignedVoice.country})`);
      
      // テキストの時間表記を音声用に変換
      const speechTextForAudio = this.convertTimeForSpeech(questionData.text);
      
      // 変換前後のテキストが異なる場合はログに出力
      if (speechTextForAudio !== questionData.text) {
        console.log('🕐 Time format conversion applied:');
        console.log('  Original:', questionData.text.match(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)/g));
        console.log('  Converted:', speechTextForAudio.match(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)[\w\s-]*(o'clock|oh\s+\w+)?\s*[AP]\s*M\b/gi));
      }
      
      // スピーチ音声を生成
      const speechFileName = `${questionData.id}_speech.mp3`;
      const fullSpeechPath = join(baseDir, speechFileName);
      
      console.log(`🎧 Generating speech audio: ${speechFileName}`);
      await this.audioGenerator.generateAudio(
        speechTextForAudio,  // 変換されたテキストを使用
        fullSpeechPath,
        { voiceId: assignedVoice.voice_id }
      );
      
      // Part4では問題文音声は不要なため、スピーチ音声のみ
      // 元のテキストを保存（表示用）
      questionData.audioFiles = {
        speech: {
          audioPath: `/audio/part4/${speechFileName}`,
          text: questionData.text  // 元のテキストを保持
        }
      };
      
      console.log('✅ Audio generation completed successfully');
      return questionData;
      
    } catch (error) {
      console.error('❌ Audio generation failed:', error);
      // 音声生成失敗は致命的エラーとして扱う
      throw new Error(`Audio generation failed: ${error.message}`);
    }
  }

  async run() {
    try {
      console.log('📝 プロンプトログを保存しました:', await logPromptToFile({
        batchId: this.batchId,
        functionName: 'start',
        promptType: 'generation_start',
        prompt: `Part 4 generation started with config: ${JSON.stringify(this.config)}`,
        metadata: this.config
      }));

      // Audio generator初期化
      await this.initializeAudioGenerator();
      
      // 次のIDを取得
      await this.getNextQuestionId();
      
      console.log('Step 1: 問題を生成中...');
      const generatedQuestions = [];
      const failedQuestions = [];
      
      for (let i = 0; i < this.config.count; i++) {
        console.log(`  問題 ${i + 1}/${this.config.count} を生成中...`);
        
        try {
          // この問題の生成開始
          
          // スピーチと問題を生成
          const speechData = await this.generateSpeech();
          
          // IDとメタデータを追加
          const questionId = `part4_${this.startingId + i}`;
          const fullQuestionData = {
            id: questionId,
            partType: 'part4',
            speechType: speechData.speechType,
            speechTypeTranslation: speechData.speechTypeDescription,
            industry: speechData.industry,
            speaker: speechData.speaker,
            text: speechData.speechContent.text,
            topic: speechData.speechContent.topic,
            questions: speechData.questions,
            difficulty: this.config.difficulty,
            createdAt: new Date().toISOString(),
            generationBatch: this.batchId,
            generationPrompts: [...this.promptData.generationPrompts] // プロンプト情報を追加
          };
          
          // 統合翻訳処理
          console.log('  統合翻訳処理中...');
          
          const translationResult = await this.translateUnified({
            text: fullQuestionData.text,
            questions: fullQuestionData.questions
          });
          
          // スピーチ翻訳を適用（textTranslationのみ）
          fullQuestionData.textTranslation = translationResult.textTranslation;
          
          // 問題翻訳を適用
          for (let j = 0; j < fullQuestionData.questions.length; j++) {
            const question = fullQuestionData.questions[j];
            question.id = `${questionId}_q${j + 1}`;
            
            if (translationResult.questionsTranslations && translationResult.questionsTranslations[j]) {
              question.questionTranslation = translationResult.questionsTranslations[j].questionTranslation;
              question.optionTranslations = translationResult.questionsTranslations[j].optionTranslations;
            } else {
              // フォールバック: 個別翻訳
              question.questionTranslation = await this.translateToJapanese(question.question);
              question.optionTranslations = [];
              for (const option of question.options) {
                const translation = await this.translateToJapanese(option);
                question.optionTranslations.push(translation);
              }
            }
            
            // 解説は既に日本語で生成されているため翻訳不要
          }
          
          // 音声ファイル生成
          const questionWithAudio = await this.generateAudioFiles(fullQuestionData);
          
          generatedQuestions.push(questionWithAudio);
          
          // プロンプト情報は既にthis.promptData に保存済み
          
          console.log(`  ✅ 問題 ${i + 1} 生成完了: ${questionId}`);
          
        } catch (error) {
          console.error(`  ❌ 問題 ${i + 1} 生成失敗:`, error);
          failedQuestions.push({
            index: i + 1,
            error: error.message
          });
          // 続行
          console.log('  ⏭️  次の問題に進みます...');
        }
      }
      
      console.log('\nStep 2: データベースに保存中...');
      const savedCount = await this.saveToDatabase(generatedQuestions);
      
      console.log('\n=== Part 4 問題生成完了 ===');
      console.log(`✅ 成功: ${generatedQuestions.length}問`);
      console.log(`❌ 失敗: ${failedQuestions.length}問`);
      console.log(`💾 保存: ${savedCount}問`);
      console.log(`🆔 バッチID: ${this.batchId}`);
      
      // 完全に失敗した場合はエラーとして扱う
      if (generatedQuestions.length === 0) {
        console.log('\n⚠️  警告: 要求されたすべての問題生成に失敗しました');
        throw new Error(`All ${this.config.count} question generation attempts failed`);
      }
      
      // 一部失敗の場合も警告
      if (failedQuestions.length > 0) {
        console.log('\n⚠️  警告: 一部の問題生成に失敗しました。音声ファイルやAPIの問題を確認してください。');
      }
      
      // 生成されたIDを出力（他のスクリプトが参照できるように）
      const generatedIds = generatedQuestions.map(q => q.id);
      console.log(`GENERATED_IDS:${generatedIds.join(',')}`);
      
      // プロンプトデータを出力（Part 2と同様の形式）
      console.log(`PROMPT_DATA:${JSON.stringify(this.promptData)}`);
      
      return {
        success: savedCount > 0,
        count: savedCount,
        failed: failedQuestions.length,
        batchId: this.batchId,
        generatedIds: generatedIds,
        failures: failedQuestions,
        generationPrompts: this.promptData.generationPrompts
      };
      
    } catch (error) {
      console.error('❌ Part 4 問題生成エラー:', error);
      process.exit(1);
    }
  }
}

// コマンドライン引数の解析
function parseArguments() {
  const args = process.argv.slice(2);
  const config = {
    difficulty: 'medium',
    count: 1,
    speechType: null, // null = ランダム選択
    industry: null   // null = ランダム選択
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--difficulty=')) {
      config.difficulty = arg.split('=')[1];
    } else if (arg.startsWith('--count=')) {
      config.count = parseInt(arg.split('=')[1]) || 1;
    } else if (arg.startsWith('--speech-type=')) {
      config.speechType = arg.split('=')[1];
    } else if (arg.startsWith('--industry=')) {
      config.industry = arg.split('=')[1];
    } else if (arg === '--list-speech-types') {
      // 利用可能なスピーチタイプを表示
      console.log('📋 利用可能なスピーチタイプ:');
      PART4_SPEECH_TYPES.forEach((speechTypeData, index) => {
        const jpText = speechTypeData.jp ? ` (${speechTypeData.jp})` : '';
        console.log(`  ${index + 1}. ${speechTypeData.type} - ${speechTypeData.description}${jpText}`);
        console.log(`     重み: ${speechTypeData.weight}`);
      });
      console.log('\n使用例: node generate-part4-speeches.js --speech-type=company_announcement --difficulty=medium --count=1');
      process.exit(0);
    } else if (arg === '--list-industries') {
      // 利用可能な業種を表示
      console.log('📋 利用可能な業種:');
      INDUSTRIES.forEach((industryData, index) => {
        const jpText = industryData.jp ? ` (${industryData.jp})` : '';
        console.log(`  ${index + 1}. ${industryData.industry} - ${industryData.description}${jpText}`);
        console.log(`     重み: ${industryData.weight}`);
      });
      console.log('\n使用例: node generate-part4-speeches.js --industry=retail --difficulty=medium --count=1');
      process.exit(0);
    }
  }

  // バリデーション
  if (!['easy', 'medium', 'hard'].includes(config.difficulty)) {
    config.difficulty = 'medium';
  }

  if (config.count < 1 || config.count > 10) {
    config.count = 1;
  }

  // スピーチタイプのバリデーション
  if (config.speechType) {
    const validSpeechTypes = PART4_SPEECH_TYPES.map(s => s.type);
    if (!validSpeechTypes.includes(config.speechType)) {
      console.error(`❌ 無効なスピーチタイプ: ${config.speechType}`);
      console.log(`利用可能なスピーチタイプ: ${validSpeechTypes.join(', ')}`);
      console.log('--list-speech-types で詳細を確認できます');
      process.exit(1);
    }
  }

  // 業種のバリデーション
  if (config.industry) {
    const validIndustries = INDUSTRIES.map(i => i.industry);
    if (!validIndustries.includes(config.industry)) {
      console.error(`❌ 無効な業種: ${config.industry}`);
      console.log(`利用可能な業種: ${validIndustries.join(', ')}`);
      console.log('--list-industries で詳細を確認できます');
      process.exit(1);
    }
  }

  return config;
}

// メイン処理
(async () => {
  const config = parseArguments();
  const generator = new Part4Generator(config);

  try {
    await generator.initializeAudioGenerator();
    const result = await generator.run();
    console.log('\n✅ Part 4 問題生成が完了しました');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Part 4 問題生成に失敗しました:', error);
    process.exit(1);
  }
})();