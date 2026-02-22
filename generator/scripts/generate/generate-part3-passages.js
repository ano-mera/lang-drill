#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import openai from '../../lib/openai-config.js';
import { PART3_GENERATION_CONFIG } from '../../lib/openai-config.js';
import { 
  PROMPT_TEMPLATES, 
  PART3_SCENARIOS, 
  PART3_QUESTION_TYPES,
  PART3_SPEAKER_PATTERNS,
  INDUSTRIES 
} from '../../lib/prompt-templates.js';
import { logPromptToFile } from '../../lib/prompt-logger.js';
import ElevenLabsAudio from '../../lib/elevenlabs-audio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Part3Generator {
  constructor(config) {
    this.config = config;
    this.batchId = `part3_batch_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    this.startingId = 1;
    this.audioGenerator = null;
    
    // Part 2と同様のプロンプト情報収集構造
    this.promptData = {
      generationPrompts: [],
      qualityCheckPrompts: [],
      revisionPrompts: []
    };
    
    console.log(`🚀 Part 3 問題生成開始 (batchId: ${this.batchId})`);
    console.log(`📋 設定: difficulty=${config.difficulty}, count=${config.count}, scenario=${config.scenario || 'random'}, industry=${config.industry || 'random'}`);
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

  getRandomScenario() {
    let selectedMainScenario;
    
    // シナリオが指定されている場合
    if (this.config.scenario) {
      selectedMainScenario = PART3_SCENARIOS.find(s => s.scenario === this.config.scenario);
      if (!selectedMainScenario) {
        throw new Error(`指定されたシナリオが見つかりません: ${this.config.scenario}`);
      }
      console.log(`🎯 Specified scenario: ${selectedMainScenario.scenario} (${selectedMainScenario.description})`);
    } else {
      // ランダム選択（従来の重み付け）
      selectedMainScenario = this.getRandomByWeight(PART3_SCENARIOS);
      console.log(`🎯 Random selected scenario: ${selectedMainScenario.scenario} (weight: ${selectedMainScenario.weight})`);
    }
    
    // メインシナリオの情報を返す
    return {
      scenario: selectedMainScenario.scenario,
      description: selectedMainScenario.description
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

  getRandomQuestionType() {
    const selected = this.getRandomByWeight(PART3_QUESTION_TYPES);
    console.log(`🎯 Selected question type: ${selected.type} (weight: ${selected.weight})`);
    return selected.type;
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

  // 重み付きランダムで話者パターンを選択
  getRandomSpeakerPattern() {
    const selected = this.getRandomByWeight(PART3_SPEAKER_PATTERNS);
    console.log(`👥 Selected speaker pattern: ${selected.pattern} (${selected.description}, weight: ${selected.weight})`);
    
    // 3人の場合、性別の組み合わせをランダムに決定
    if (selected.count === 3) {
      const patterns = [
        ['male', 'female', 'male'],
        ['female', 'male', 'female'],
        ['male', 'female', 'female'],
        ['female', 'male', 'male']
      ];
      const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
      return {
        ...selected,
        genders: randomPattern
      };
    }
    
    return selected;
  }

  async generateWithAI(systemPrompt, userPrompt, promptType) {
    try {
      console.log(`🤖 Calling OpenAI GPT-4o for ${promptType}...`);
      
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
        model: PART3_GENERATION_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: PART3_GENERATION_CONFIG.max_completion_tokens,
        temperature: PART3_GENERATION_CONFIG.temperature,
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

  async generateConversation() {
    try {
      // ランダムにシナリオ、業種、正解位置、話者パターンを決定
      const scenarioData = this.getRandomScenario();
      const industryData = this.getRandomIndustry();
      const correctPositions = this.getRandomCorrectPositions();
      const speakerPattern = this.getRandomSpeakerPattern();
      
      // この問題用の音声を選択（問題全体で統一）
      const selectedVoice = this.audioGenerator ? this.audioGenerator.selectVoiceByWeight() : null;
      
      const config = {
        difficulty: this.config.difficulty,
        scenario: scenarioData.scenario,
        industry: industryData.industry,
        industryDescription: industryData.description,
        correctPositions: correctPositions,
        speakerCount: speakerPattern.count,
        speakerGenders: speakerPattern.genders
      };
      
      console.log(`📝 Generating conversation with config:`, config);
      
      const systemPrompt = PROMPT_TEMPLATES.part3.conversationGeneration.systemPrompt;
      const userPrompt = PROMPT_TEMPLATES.part3.conversationGeneration.userPrompt(config);
      
      const response = await this.generateWithAI(systemPrompt, userPrompt, 'part3_conversation_generation');
      
      console.log('🔍 Raw AI response:', response);
      
      // マークダウンコードブロックを除去
      let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // レスポンスが空でないことを確認
      if (!cleanResponse) {
        throw new Error('Empty response after cleaning');
      }
      
      console.log('🔍 Cleaned response:', cleanResponse);
      
      // JSONパース
      let parsed;
      try {
        parsed = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
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
      
      // バリデーション
      if (parsed.scenario && parsed.speakers && parsed.conversation && parsed.questions) {
        console.log('✅ Valid conversation generated');
        
        // 質問数のバリデーション
        if (!Array.isArray(parsed.questions) || parsed.questions.length !== 3) {
          throw new Error(`Expected 3 questions, got ${parsed.questions?.length || 0}`);
        }
        
        // 各質問の選択肢数をバリデーション
        for (let i = 0; i < parsed.questions.length; i++) {
          const question = parsed.questions[i];
          if (!Array.isArray(question.options) || question.options.length !== 4) {
            throw new Error(`Question ${i + 1}: Expected 4 options, got ${question.options?.length || 0}`);
          }
        }
        
        // シナリオと業種情報をデータに追加
        parsed.scenario = scenarioData.scenario;
        parsed.industry = industryData.industry;
        
        return { conversationData: parsed, selectedVoice };
      } else {
        throw new Error('Invalid conversation generation response format: missing required fields');
      }
    } catch (error) {
      console.error('❌ Conversation generation failed:', error);
      throw error; // フォールバック処理を削除し、エラーをそのまま投げる
    }
  }

  async translateToJapanese(text) {
    try {
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part3.translation.systemPrompt,
        PROMPT_TEMPLATES.part3.translation.userPrompt(text),
        'part3_translation'
      );
      
      const translation = response.trim();
      if (translation) {
        return translation;
      } else {
        throw new Error('Empty translation response');
      }
    } catch (error) {
      console.error('❌ Translation failed:', error);
      throw error; // フォールバック処理を削除し、エラーをそのまま投げる
    }
  }

  async translateConversationBatch(data) {
    try {
      console.log('🔄 バッチ翻訳（会話）を開始...');
      
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part3.batchTranslation.conversationBatch.systemPrompt,
        PROMPT_TEMPLATES.part3.batchTranslation.conversationBatch.userPrompt(data),
        'part3_batch_conversation_translation'
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
      if (!parsed.scenarioTranslation || !Array.isArray(parsed.conversationTranslations)) {
        throw new Error('Invalid batch translation response format');
      }
      
      console.log('✅ バッチ翻訳（会話）完了');
      return parsed;
      
    } catch (error) {
      console.error('❌ Batch conversation translation failed:', error);
      console.log('🔄 個別翻訳にフォールバック...');
      
      // フォールバック: 個別翻訳
      const scenarioTranslation = await this.translateToJapanese(data.scenario);
      const conversationTranslations = [];
      
      for (const turn of data.conversation) {
        const translation = await this.translateToJapanese(turn.text);
        conversationTranslations.push({
          speaker: turn.speaker,
          translation: translation
        });
      }
      
      return {
        scenarioTranslation,
        conversationTranslations
      };
    }
  }

  async translateQuestionsBatch(questions) {
    try {
      console.log('🔄 バッチ翻訳（問題）を開始...');
      
      const response = await this.generateWithAI(
        PROMPT_TEMPLATES.part3.batchTranslation.questionsBatch.systemPrompt,
        PROMPT_TEMPLATES.part3.batchTranslation.questionsBatch.userPrompt(questions),
        'part3_batch_questions_translation'
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
      if (!Array.isArray(parsed.questionsTranslations) || parsed.questionsTranslations.length !== questions.length) {
        throw new Error('Invalid batch translation response format or length mismatch');
      }
      
      console.log('✅ バッチ翻訳（問題）完了');
      return parsed.questionsTranslations;
      
    } catch (error) {
      console.error('❌ Batch questions translation failed:', error);
      console.log('🔄 個別翻訳にフォールバック...');
      
      // フォールバック: 個別翻訳
      const questionsTranslations = [];
      
      for (const question of questions) {
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
      
      return questionsTranslations;
    }
  }

  async getNextQuestionId() {
    try {
      // データベースファイルのパス
      const dbPath = join(__dirname, '../../../src/data/part3-questions.json');
      
      let questions = [];
      try {
        const data = await fs.readFile(dbPath, 'utf8');
        questions = JSON.parse(data);
      } catch (error) {
        // ファイルが存在しない場合は空配列から開始
        console.log('📁 Part3 questions file not found, starting from ID 1');
        questions = [];
      }
      
      // 既存の最大IDを取得
      let maxId = 0;
      questions.forEach(q => {
        const match = q.id.match(/^part3_(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxId) {
            maxId = num;
          }
        }
      });

      this.startingId = maxId + 1;
      console.log(`📝 次の問題IDは part3_${this.startingId} から開始します`);
      return this.startingId;
    } catch (error) {
      console.error('❌ ID取得エラー:', error);
      throw error; // フォールバック処理を削除し、エラーをそのまま投げる
    }
  }

  async saveToDatabase(questions) {
    try {
      // データベースファイルのパス
      const dbPath = join(__dirname, '../../../src/data/part3-questions.json');
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
          existingQ.scenario === newQ.scenario && 
          JSON.stringify(existingQ.conversation) === JSON.stringify(newQ.conversation)
        );
        
        if (isDuplicate) {
          console.warn(`⚠️  重複検出: ${newQ.id} (scenario: ${newQ.scenario})`);
        }
        
        return !isDuplicate;
      });
      
      // 新しい問題を追加
      const updatedQuestions = [...existingQuestions, ...newQuestions];
      
      console.log(`💾 保存予定の問題数: ${updatedQuestions.length} (既存: ${existingQuestions.length}, 新規: ${newQuestions.length})`);
      
      // ファイルに保存
      await fs.writeFile(dbPath, JSON.stringify(updatedQuestions, null, 2));
      console.log(`✅ データベース更新完了: ${newQuestions.length}問をpart3-questions.jsonに追加`);
      
      return newQuestions.length;
    } catch (error) {
      console.error('❌ データベース保存エラー:', error);
      throw error;
    }
  }

  // 音声ファイルの存在確認
  async validateAudioFiles(questionData) {
    try {
      // R2アップロードモードの場合はバリデーションをスキップ
      if (this.audioGenerator && this.audioGenerator.useR2Upload) {
        console.log(`🔍 Audio files uploaded to R2 - skipping local validation`);
        return;
      }
      
      const baseDir = '/home/ki/projects/eng/public/audio/part3';
      const missingFiles = [];
      
      // 会話音声ファイルの確認
      if (questionData.audioFiles?.conversation?.segments) {
        for (const segment of questionData.audioFiles.conversation.segments) {
          const filePath = join(baseDir, segment.audioPath.replace('/audio/part3/', ''));
          try {
            await fs.access(filePath);
          } catch (error) {
            missingFiles.push(segment.audioPath);
          }
        }
      }
      
      // 質問音声ファイルの確認
      if (questionData.audioFiles?.questions) {
        for (const question of questionData.audioFiles.questions) {
          const filePath = join(baseDir, question.audioPath.replace('/audio/part3/', ''));
          try {
            await fs.access(filePath);
          } catch (error) {
            missingFiles.push(question.audioPath);
          }
        }
      }
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing audio files: ${missingFiles.join(', ')}`);
      }
      
      console.log(`🔍 Audio file validation passed: ${questionData.audioFiles.conversation.segments.length + questionData.audioFiles.questions.length} files verified`);
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

  async generateAudioFiles(questionData, selectedVoice) {
    if (!this.audioGenerator) {
      const errorMsg = 'Audio generator not available (ElevenLabs initialization failed)';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      console.log('🎵 Starting audio generation...');
      
      // Part3音声ファイル用のディレクトリを設定
      const baseDir = '/home/ki/projects/eng/public/audio/part3';
      
      // 話者ごとに異なる音声を割り当て
      const speakers = questionData.speakers || [];
      const speakerVoices = {};
      const usedVoiceIds = [];
      
      // 各話者に音声を割り当て
      for (let i = 0; i < speakers.length; i++) {
        const speaker = speakers[i];
        let assignedVoice;
        
        // 話者の性別を取得（AIが生成した性別を使用）
        const speakerGender = speaker.gender || 'female'; // デフォルトは女性
        
        if (i === 0) {
          // 最初の話者は性別に基づいて音声を選択
          assignedVoice = this.audioGenerator.selectVoiceByGenderAndWeight(speakerGender);
        } else {
          // 他の話者には同じ性別で別の音声を選択（重複を避ける）
          assignedVoice = this.audioGenerator.selectVoiceByGenderAndWeight(
            speakerGender, 
            usedVoiceIds.join(',') // 既に使用された音声IDを除外
          );
        }
        
        speakerVoices[speaker.id] = assignedVoice;
        usedVoiceIds.push(assignedVoice.voice_id);
        
        // 話者プロファイルに音声情報を追加
        speaker.voiceProfile = {
          voiceId: assignedVoice.voice_id,
          gender: assignedVoice.gender,
          accent: assignedVoice.accent,
          country: assignedVoice.country,
          age: assignedVoice.age,
          tone: assignedVoice.tone
        };
        
        console.log(`🎤 Speaker ${speaker.id} (${speaker.name}, ${speakerGender}): ${assignedVoice.voice_id} (${assignedVoice.accent} ${assignedVoice.country})`);
      }
      
      // 会話の各発言を個別に生成して結合
      const conversationAudioSegments = [];
      
      for (let i = 0; i < questionData.conversation.length; i++) {
        const turn = questionData.conversation[i];
        const speakerVoice = speakerVoices[turn.speaker];
        
        if (!speakerVoice) {
          console.warn(`⚠️ No voice assigned for speaker ${turn.speaker}, using default`);
          continue;
        }
        
        // 話者記号を除去してテキストのみを音声化
        const segmentFilename = `${questionData.id}_conversation_${i + 1}.mp3`;
        const segmentFullPath = join(baseDir, segmentFilename);
        
        // テキストの時間表記を音声用に変換
        const textForAudio = this.convertTimeForSpeech(turn.text);
        
        await this.audioGenerator.generateAudio(
          textForAudio, // 変換されたテキストを使用
          segmentFullPath,
          { voiceId: speakerVoice.voice_id }
        );
        
        conversationAudioSegments.push({
          speaker: turn.speaker,
          audioPath: `/audio/part3/${segmentFilename}`,
          text: turn.text
        });
      }
      
      // 各問題の音声を生成（質問者の音声を使用）
      const questionAudioFiles = [];
      const questionVoice = selectedVoice; // 質問は主音声を使用
      
      for (let i = 0; i < questionData.questions.length; i++) {
        const question = questionData.questions[i];
        const questionFilename = `${questionData.id}_question_${i + 1}.mp3`;
        const questionFullPath = join(baseDir, questionFilename);
        
        // 質問文の時間表記を音声用に変換
        const questionTextForAudio = this.convertTimeForSpeech(question.question);
        
        await this.audioGenerator.generateAudio(
          questionTextForAudio, // 変換されたテキストを使用
          questionFullPath,
          { voiceId: questionVoice.voice_id }
        );
        
        questionAudioFiles.push({
          questionNumber: i + 1,
          audioPath: `/audio/part3/${questionFilename}`
        });
      }

      // 音声ファイル情報を追加
      questionData.audioFiles = {
        conversation: {
          segments: conversationAudioSegments, // 個別セグメント
          combinedAudioPath: null // 結合音声は今後実装可能
        },
        questions: questionAudioFiles
      };

      // 音声ファイルの存在確認
      await this.validateAudioFiles(questionData);
      
      console.log('✅ Audio generation completed with speaker separation');
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
        prompt: `Part 3 generation started with config: ${JSON.stringify(this.config)}`,
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
          
          // 会話と問題を生成
          const { conversationData, selectedVoice } = await this.generateConversation();
          
          // IDとメタデータを追加
          const questionId = `part3_${this.startingId + i}`;
          const fullQuestionData = {
            id: questionId,
            partType: 'part3',
            ...conversationData,
            createdAt: new Date().toISOString(),
            generationBatch: this.batchId,
            generationPrompts: [...this.promptData.generationPrompts] // プロンプト情報を追加
          };
          
          // バッチ翻訳処理
          console.log('  バッチ翻訳処理中...');
          
          // バッチ1: 会話翻訳（シナリオ + 会話）
          const conversationBatchResult = await this.translateConversationBatch({
            scenario: fullQuestionData.scenario,
            conversation: fullQuestionData.conversation
          });
          
          // シナリオ翻訳を適用
          fullQuestionData.scenarioTranslation = conversationBatchResult.scenarioTranslation;
          
          // 会話翻訳を適用
          for (let j = 0; j < fullQuestionData.conversation.length; j++) {
            const turn = fullQuestionData.conversation[j];
            const batchTranslation = conversationBatchResult.conversationTranslations.find(
              t => t.speaker === turn.speaker && conversationBatchResult.conversationTranslations.indexOf(t) === j
            );
            turn.translation = batchTranslation ? batchTranslation.translation : await this.translateToJapanese(turn.text);
          }
          
          // バッチ2: 問題翻訳（質問 + 選択肢）
          const questionsBatchResult = await this.translateQuestionsBatch(fullQuestionData.questions);
          
          // 問題翻訳を適用
          for (let j = 0; j < fullQuestionData.questions.length; j++) {
            const question = fullQuestionData.questions[j];
            question.id = `${questionId}_q${j + 1}`;
            
            if (questionsBatchResult[j]) {
              question.questionTranslation = questionsBatchResult[j].questionTranslation;
              question.optionTranslations = questionsBatchResult[j].optionTranslations;
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
          const questionWithAudio = await this.generateAudioFiles(fullQuestionData, selectedVoice);
          
          generatedQuestions.push(questionWithAudio);
          
          // プロンプト情報は既にthis.promptData に保存済み
          
          console.log(`  ✅ 問題 ${i + 1} 生成完了: ${questionId}`);
          
        } catch (error) {
          console.error(`  ❌ 問題 ${i + 1} 生成失敗:`, error);
          failedQuestions.push({
            index: i + 1,
            error: error.message,
            type: error.message.includes('Audio generation') ? 'audio_generation' : 'content_generation'
          });
          // 個別の問題生成失敗時は続行
          continue;
        }
      }
      
      console.log('Step 2: データベースに保存中...');
      const savedCount = await this.saveToDatabase(generatedQuestions);
      
      console.log('\n🎉 Part 3 問題生成完了!');
      console.log('📊 生成結果:');
      console.log(`   ✅ 成功: ${savedCount}問`);
      if (failedQuestions.length > 0) {
        console.log(`   ❌ 失敗: ${failedQuestions.length}問`);
        console.log('   📋 失敗詳細:');
        failedQuestions.forEach(fail => {
          console.log(`      問題 ${fail.index}: ${fail.type} - ${fail.error}`);
        });
      }
      console.log(`   📝 Batch ID: ${this.batchId}`);
      console.log(`   📈 難易度: ${this.config.difficulty}`);
      console.log(`   🎯 シナリオ: ${generatedQuestions.map(q => q.scenario).join(', ')}`);
      
      // 正解位置の分布を表示
      const allCorrectAnswers = [];
      generatedQuestions.forEach(q => {
        q.questions.forEach(question => {
          // 正解テキストから位置を推定
          const correctIndex = question.options.findIndex(option => option === question.correct);
          const correctLetter = correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : '?';
          allCorrectAnswers.push(correctLetter);
        });
      });
      
      const answerDistribution = ['A', 'B', 'C', 'D'].map(letter => {
        const count = allCorrectAnswers.filter(a => a === letter).length;
        return `${letter}:${count}`;
      }).join(', ');
      
      console.log(`   🎲 正解位置分布: ${answerDistribution} (ランダム化適用済)`);
      
      // 全て失敗した場合は警告
      if (savedCount === 0 && this.config.count > 0) {
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
      console.error('❌ Part 3 問題生成エラー:', error);
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
    scenario: null, // null = ランダム選択
    industry: null  // null = ランダム選択
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--difficulty=')) {
      config.difficulty = arg.split('=')[1];
    } else if (arg.startsWith('--count=')) {
      config.count = parseInt(arg.split('=')[1]) || 1;
    } else if (arg.startsWith('--scenario=')) {
      config.scenario = arg.split('=')[1];
    } else if (arg.startsWith('--industry=')) {
      config.industry = arg.split('=')[1];
    } else if (arg === '--list-scenarios') {
      // 利用可能なシナリオを表示
      console.log('📋 利用可能なシナリオ:');
      PART3_SCENARIOS.forEach((scenarioData, index) => {
        const jpText = scenarioData.jp ? ` (${scenarioData.jp})` : '';
        console.log(`  ${index + 1}. ${scenarioData.scenario} - ${scenarioData.description}${jpText}`);
        console.log(`     重み: ${scenarioData.weight}`);
      });
      console.log('\n使用例: node generate-part3-passages.js --scenario=appointment_scheduling --difficulty=medium --count=1');
      process.exit(0);
    } else if (arg === '--list-industries') {
      // 利用可能な業種を表示
      console.log('📋 利用可能な業種:');
      INDUSTRIES.forEach((industryData, index) => {
        const jpText = industryData.jp ? ` (${industryData.jp})` : '';
        console.log(`  ${index + 1}. ${industryData.industry} - ${industryData.description}${jpText}`);
        console.log(`     重み: ${industryData.weight}`);
      });
      console.log('\n使用例: node generate-part3-passages.js --industry=retail --difficulty=medium --count=1');
      process.exit(0);
    }
  }

  // バリデーション
  if (!['easy', 'medium', 'hard'].includes(config.difficulty)) {
    config.difficulty = 'medium';
  }

  if (config.count < 1 || config.count > 5) {
    config.count = 1;
  }

  // シナリオのバリデーション
  if (config.scenario) {
    const validScenarios = PART3_SCENARIOS.map(s => s.scenario);
    if (!validScenarios.includes(config.scenario)) {
      console.error(`❌ 無効なシナリオ: ${config.scenario}`);
      console.log(`利用可能なシナリオ: ${validScenarios.join(', ')}`);
      console.log('--list-scenarios で詳細を確認できます');
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

const argv = parseArguments();

// メイン実行
const generator = new Part3Generator(argv);
generator.run();