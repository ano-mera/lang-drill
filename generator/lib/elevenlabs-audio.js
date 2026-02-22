import fs from 'fs/promises';
import path from 'path';
import { R2AudioUploader } from './r2-audio-uploader.js';

// Part1向けTOEIC最適化設定
const PART1_VOICE_SETTINGS = {
  model_id: 'eleven_turbo_v2_5',
  stability: 0.65,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: false
};

/**
 * ElevenLabs API を使用してテキストから音声を生成
 */
export class ElevenLabsAudio {
  constructor(options = {}) {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    
    if (!this.apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is required');
    }
    
    // R2直接アップロード機能の初期化
    this.useR2Upload = options.useR2Upload !== false; // デフォルトでR2アップロードを使用
    if (this.useR2Upload) {
      try {
        this.r2Uploader = new R2AudioUploader();
        console.log('✅ R2 Audio Uploader initialized');
      } catch (error) {
        console.warn('⚠️ R2 uploader not available, falling back to local storage:', error.message);
        this.useR2Upload = false;
        this.r2Uploader = null;
      }
    }
    
    // TOEIC試験にふさわしい多国籍英語音声バリエーション（重み付き）
    this.voices = [
      // 🇺🇸 American English (General American) - 40%
      { "voice_id": "EXAVITQu4vr4xnSDxMaL", "gender": "female", "accent": "American", "country": "🇺🇸", "age": "adult", "tone": "professional", "weight": 0.05 },
      { "voice_id": "21m00Tcm4TlvDq8ikWAM", "gender": "female", "accent": "American", "country": "🇺🇸", "age": "young", "tone": "calm", "weight": 0.05 },
      { "voice_id": "jsCqWAovK2LkecY7zXl4", "gender": "female", "accent": "American", "country": "🇺🇸", "age": "young", "tone": "", "weight": 0.05 },
      { "voice_id": "z9fAnlkpzviPz146aGWa", "gender": "female", "accent": "American", "country": "🇺🇸", "age": "middle aged", "tone": "witch", "weight": 0.05 },
      { "voice_id": "pNInz6obpgDQGcFmaJgB", "gender": "male", "accent": "American", "country": "🇺🇸", "age": "middle aged", "tone": "deep", "weight": 0.05 },
      { "voice_id": "VR6AewLTigWG4xSOukaG", "gender": "male", "accent": "American", "country": "🇺🇸", "age": "middle aged", "tone": "crisp", "weight": 0.05 },
      { "voice_id": "5Q0t7uMcjvnagumLfvZi", "gender": "male", "accent": "American", "country": "🇺🇸", "age": "middle aged", "tone": "ground reporter", "weight": 0.05 },
      { "voice_id": "N2lVS1w4EtoT3dr4eOWO", "gender": "male", "accent": "American", "country": "🇺🇸", "age": "middle aged", "tone": "hoarse", "weight": 0.05 },
      
      // 🇬🇧 British English (RP/London) - 30%
      { "voice_id": "ThT5KcBeYPX3keUQqHPh", "gender": "female", "accent": "British", "country": "🇬🇧", "age": "adult", "tone": "professional", "weight": 0.10 },
      { "voice_id": "XB0fDUnXU5powFXDhCwa", "gender": "female", "accent": "British", "country": "🇬🇧", "age": "young", "tone": "friendly", "weight": 0.10 },
      { "voice_id": "JBFqnCBsd6RMkjVDRZzb", "gender": "male", "accent": "British", "country": "🇬🇧", "age": "middle aged", "tone": "raspy", "weight": 0.10 },
      
      // 🇨🇦 Canadian English - 15%
      { "voice_id": "1EZBFEhLjqjzuG8HBNbj", "gender": "female", "accent": "Canadian", "country": "🇨🇦", "age": "Young", "tone": "Calm", "weight": 0.08 },
      { "voice_id": "w4Z9gYJrajAuQmheNbVn", "gender": "male", "accent": "Canadian", "country": "🇨🇦", "age": "young", "tone": "professional", "weight": 0.07 },
      
      // 🇦🇺 Australian English - 15%
      { "voice_id": "p43fx6U8afP2xoq1Ai9f", "gender": "female", "accent": "Australian", "country": "🇦🇺", "age": "adult", "tone": "calm", "weight": 0.08 },
      { "voice_id": "IKne3meq5aSn9XLyUdCD", "gender": "male", "accent": "Australian", "country": "🇦🇺", "age": "young", "tone": "relaxed", "weight": 0.07 }
    ];
  }
  
  /**
   * 重み付きランダムで音声を選択
   */
  selectVoiceByWeight() {
    const totalWeight = this.voices.reduce((sum, voice) => sum + voice.weight, 0);
    const random = Math.random() * totalWeight;
    let currentWeight = 0;
    
    for (const voice of this.voices) {
      currentWeight += voice.weight;
      if (random <= currentWeight) {
        return voice;
      }
    }
    return this.voices[0]; // フォールバック
  }

  /**
   * 性別指定で重み付きランダムで音声を選択
   * @param {string} gender - 'male' または 'female'
   * @param {string} excludeVoiceId - 除外する音声ID（同じ音声を避けるため）
   */
  selectVoiceByGenderAndWeight(gender, excludeVoiceId = null) {
    // 指定された性別の音声のみフィルタリング
    const genderVoices = this.voices.filter(voice => 
      voice.gender === gender && voice.voice_id !== excludeVoiceId
    );
    
    if (genderVoices.length === 0) {
      console.warn(`No ${gender} voices available, using fallback`);
      return this.voices.find(v => v.gender === gender) || this.voices[0];
    }
    
    // 重み付きランダム選択
    const totalWeight = genderVoices.reduce((sum, voice) => sum + voice.weight, 0);
    const random = Math.random() * totalWeight;
    let currentWeight = 0;
    
    for (const voice of genderVoices) {
      currentWeight += voice.weight;
      if (random <= currentWeight) {
        return voice;
      }
    }
    
    return genderVoices[0]; // フォールバック
  }

  /**
   * パスからパートタイプを抽出
   * @param {string} filePath - ファイルパス
   * @returns {string} パートタイプ (例: "part1", "part2")
   */
  extractPartTypeFromPath(filePath) {
    const match = filePath.match(/\/audio\/(part\d+)\//);
    return match ? match[1] : 'part1'; // デフォルトはpart1
  }

  /**
   * テキストから音声を生成（R2直接アップロードまたはローカル保存）
   * @param {string} text - 音声化するテキスト
   * @param {string} outputPath - 保存先パス（R2使用時はファイル名のみ使用）
   * @param {object} options - オプション設定
   * @returns {Promise<{audioPath: string, publicUrl?: string, localPath?: string}>}
   */
  async generateAudio(text, outputPath, options = {}) {
    // 重み付きランダムで音声を選択（optionsで指定されていない場合）
    const selectedVoice = options.voiceId ? 
      { voice_id: options.voiceId } : 
      this.selectVoiceByWeight();
    
    // Part1用のTOEIC最適化設定を使用するか判定
    const isPart1 = options.isPart1 || false;
    const voiceSettings = isPart1 ? PART1_VOICE_SETTINGS : {};
    
    const {
      voiceId = selectedVoice.voice_id,
      stability = voiceSettings.stability || 0.5,
      similarityBoost = voiceSettings.similarity_boost || 0.5,
      style = voiceSettings.style || 0.0,
      useSpeakerBoost = voiceSettings.use_speaker_boost !== undefined ? voiceSettings.use_speaker_boost : true
    } = options;

    try {
      console.log(`ElevenLabs: Generating audio for text: "${text.substring(0, 50)}..."`);
      console.log(`ElevenLabs: Using voice: ${selectedVoice.voice_id} (${selectedVoice.gender || 'unknown'}, ${selectedVoice.accent || 'unknown'} ${selectedVoice.country || ''})`);
      
      // APIリクエストボディを構築
      const requestBody = {
        text: text,
        voice_settings: {
          stability: stability,
          similarity_boost: similarityBoost,
          style: style,
          use_speaker_boost: useSpeakerBoost
        }
      };
      
      // Part1の場合はモデルを指定
      if (isPart1) {
        requestBody.model_id = PART1_VOICE_SETTINGS.model_id;
        console.log(`🎤 Using TOEIC-optimized settings for Part1: model=${requestBody.model_id}, stability=${stability}, similarity_boost=${similarityBoost}, use_speaker_boost=${useSpeakerBoost}`);
      }
      
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      // 音声データを取得
      const audioBuffer = await response.arrayBuffer();
      
      // R2直接アップロードまたはローカル保存
      if (this.useR2Upload && this.r2Uploader) {
        try {
          // パートタイプを判定（パスから抽出）
          const partType = options.partType || this.extractPartTypeFromPath(outputPath);
          const fileName = path.basename(outputPath);
          
          console.log(`📤 Uploading audio to R2: ${fileName}`);
          const uploadResult = await this.r2Uploader.uploadAudio(
            Buffer.from(audioBuffer), 
            fileName, 
            partType
          );
          
          return {
            audioPath: uploadResult.audioPath,
            publicUrl: uploadResult.publicUrl,
            method: 'r2'
          };
        } catch (r2Error) {
          console.warn(`⚠️ R2 upload failed, falling back to local storage: ${r2Error.message}`);
          // R2アップロードに失敗した場合はローカル保存にフォールバック
        }
      }
      
      // ローカルファイルに保存
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, new Uint8Array(audioBuffer));
      
      console.log(`ElevenLabs: Audio saved locally to ${outputPath}`);
      return {
        audioPath: outputPath.replace('/home/ki/projects/eng/public', ''),
        localPath: outputPath,
        method: 'local'
      };

    } catch (error) {
      console.error('ElevenLabs audio generation failed:', error);
      throw error;
    }
  }

  /**
   * Part 1問題の選択肢用に音声ファイルを生成（記号なし）
   * @param {string} questionId - 問題ID
   * @param {string[]} options - 選択肢テキスト配列
   * @param {string} baseDir - 基本保存ディレクトリ
   * @param {object} specificVoice - 指定する音声プロファイル（省略時はランダム選択）
   */
  async generateOptionsAudio(questionId, options, baseDir = '/home/ki/projects/eng/public/audio/part1', specificVoice = null) {
    const audioFiles = [];
    const publicPath = baseDir.replace('/home/ki/projects/eng/public', '');
    
    // 同じ問題IDの全選択肢で同じ音声IDを使用するため、最初に音声を選択
    const selectedVoice = specificVoice ? {
      voice_id: specificVoice.voiceId,
      gender: specificVoice.gender,
      accent: specificVoice.accent,
      country: specificVoice.country,
      age: specificVoice.age || 'adult',
      tone: specificVoice.tone || 'professional'
    } : this.selectVoiceByWeight();
    
    console.log(`🎵 Selected voice for question ${questionId}: ${selectedVoice.voice_id} (${selectedVoice.gender}, ${selectedVoice.accent} ${selectedVoice.country}) ${specificVoice ? '[Specified]' : '[Random]'}`);
    
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const optionLabel = String.fromCharCode(65 + i); // A, B, C, D
      const filename = `${questionId}_option_${optionLabel.toLowerCase()}.mp3`;
      const outputPath = path.join(baseDir, filename);
      
      try {
        // 選択肢テキストのみを音声化（記号なし）、Part1最適化設定を使用
        const audioResult = await this.generateAudio(option, outputPath, { 
          voiceId: selectedVoice.voice_id,
          isPart1: true,
          partType: 'part1'
        });
        
        audioFiles.push({
          option: optionLabel,
          text: option, // 元のテキストのまま保存
          audioPath: audioResult.audioPath, // R2またはローカルパス
          publicUrl: audioResult.publicUrl, // R2の場合のみ
          labelAudioPath: `/audio/labels/option_${optionLabel.toLowerCase()}.mp3`, // 記号音声のパス
          method: audioResult.method // 'r2' または 'local'
        });
        console.log(`✅ Generated audio for option ${optionLabel}: "${option}"`);
      } catch (error) {
        console.error(`Failed to generate audio for option ${optionLabel}:`, error);
        // エラーの場合でも配列に追加（audioPathはnull）
        audioFiles.push({
          option: optionLabel,
          text: option,
          audioPath: null,
          labelAudioPath: `/audio/labels/option_${optionLabel.toLowerCase()}.mp3`
        });
      }
    }
    
    return {
      audioFiles,
      voiceProfile: {
        voiceId: selectedVoice.voice_id,
        gender: selectedVoice.gender,
        accent: selectedVoice.accent,
        country: selectedVoice.country,
        age: selectedVoice.age,
        tone: selectedVoice.tone
      }
    };
  }

  /**
   * 単一テキストから音声を生成してファイル情報を返す
   * @param {string} text - 音声化するテキスト
   * @param {string} filename - ファイル名（拡張子なし）
   * @param {string} baseDir - 基本保存ディレクトリ
   * @param {object} options - オプション設定
   */
  async generateSingleAudio(text, filename, baseDir = '/home/ki/projects/eng/public/audio/part2', options = {}) {
    const outputPath = path.join(baseDir, `${filename}.mp3`);
    const publicPath = baseDir.replace('/home/ki/projects/eng/public', '');
    
    try {
      await this.generateAudio(text, outputPath, options);
      return {
        text: text,
        audioPath: `${publicPath}/${filename}.mp3`
      };
    } catch (error) {
      console.error(`Failed to generate single audio for "${filename}":`, error);
      return {
        text: text,
        audioPath: null
      };
    }
  }

  /**
   * Part 2問題用に質問音声と選択肢音声を生成
   * @param {string} questionId - 問題ID
   * @param {string} questionText - 質問テキスト
   * @param {string[]} options - 選択肢テキスト配列（3つ）
   * @param {string} baseDir - 基本保存ディレクトリ
   * @param {object} voice - 使用する音声情報（省略時は重み付きランダム選択）
   */
  async generatePart2Audio(questionId, questionText, options, baseDir = '/home/ki/projects/eng/public/audio/part2', voice = null) {
    const publicPath = baseDir.replace('/home/ki/projects/eng/public', '');
    
    // 問題用の音声を決定（指定されていない場合は重み付きランダム選択）
    const selectedVoice = voice || this.selectVoiceByWeight();
    console.log(`ElevenLabs: Using unified voice for question ${questionId}: ${selectedVoice.voice_id} (${selectedVoice.gender || 'unknown'}, ${selectedVoice.accent || 'unknown'} ${selectedVoice.country || ''})`);
    
    // 質問音声を生成（統一された音声を使用）
    const questionAudio = await this.generateSingleAudio(
      questionText, 
      `${questionId}_question`,
      baseDir,
      { voiceId: selectedVoice.voice_id }
    );
    
    // 選択肢音声を生成（A, B, C）
    const audioFiles = [];
    
    for (let i = 0; i < options.length && i < 3; i++) {
      const option = options[i];
      const optionLabel = String.fromCharCode(65 + i); // A, B, C
      const filename = `${questionId}_option_${optionLabel.toLowerCase()}.mp3`;
      const outputPath = path.join(baseDir, filename);
      
      try {
        await this.generateAudio(option, outputPath, { voiceId: selectedVoice.voice_id });
        audioFiles.push({
          option: optionLabel,
          text: option,
          audioPath: `${publicPath}/${filename}`,
          labelAudioPath: `/audio/labels/option_${optionLabel.toLowerCase()}.mp3`
        });
        console.log(`✅ Generated Part 2 audio for option ${optionLabel}: "${option.substring(0, 30)}..."`);
      } catch (error) {
        console.error(`Failed to generate Part 2 audio for option ${optionLabel}:`, error);
        audioFiles.push({
          option: optionLabel,
          text: option,
          audioPath: null,
          labelAudioPath: `/audio/labels/option_${optionLabel.toLowerCase()}.mp3`
        });
      }
    }
    
    return {
      question: questionAudio,
      options: audioFiles
    };
  }

  /**
   * 利用可能な音声一覧を取得
   */
  async getAvailableVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Failed to get available voices:', error);
      throw error;
    }
  }
}

export default ElevenLabsAudio;