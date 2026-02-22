import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import openai from './openai-config.js';
import { PROMPT_TEMPLATES } from './prompt-templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DalleImageGenerator {
  constructor() {
    this.client = openai;
    this.originalDir = path.join(process.cwd(), 'public/images/part1/original');
    this.optimizedDir = path.join(process.cwd(), 'public/images/part1/optimized');
    
    // ディレクトリが存在することを確認
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.originalDir, { recursive: true });
      await fs.mkdir(this.optimizedDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create directories:', error);
    }
  }

  /**
   * シーン説明文を英語の画像生成プロンプトに変換（シンプルなテンプレート使用）
   */
  createImagePrompt(sceneDescription, correctAnswer = null) {
    // プロンプトテンプレートから直接生成
    const template = PROMPT_TEMPLATES.part1.imageGeneration;
    return template.generatePrompt(sceneDescription, correctAnswer);
  }

  /**
   * gpt-4oで画像を解析してシーン説明文を生成（英語と日本語の両方を同時に取得）
   */
  async analyzeImage(imagePath, questionId) {
    try {
      console.log(`🔍 Analyzing image for question ${questionId}...`);
      
      // 画像をbase64エンコード
      const fs = await import('fs/promises');
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      // gpt-4oで画像解析（英語と日本語の両方を取得）
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert at describing images for TOEIC Part 1 questions. Analyze the provided image and create a precise, detailed description of what is actually visible in the photograph.

Your description should:
- Be accurate and objective
- Focus on observable actions, people, objects, and settings
- Use present continuous tense for actions
- Be suitable for creating TOEIC Part 1 multiple-choice questions
- Include specific details about positioning, relationships, and activities
- Be 1-2 sentences long and clear

Return the description in BOTH English and Japanese in the following JSON format:
{
  "english": "Your English description here",
  "japanese": "Your Japanese translation here"
}

The Japanese translation should be natural and appropriate for Japanese TOEIC test takers.
Return ONLY the JSON object, no other text.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this image and provide a detailed scene description suitable for TOEIC Part 1 questions in both English and Japanese."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 600,
        temperature: 0.3
      });

      let responseContent = response.choices[0].message.content.trim();
      
      // マークダウンのコードブロックを除去
      responseContent = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        // JSONパースを試みる
        const parsed = JSON.parse(responseContent);
        console.log(`✅ Image analysis completed: ${parsed.english}`);
        console.log(`✅ 日本語訳: ${parsed.japanese}`);
        
        return {
          success: true,
          analyzedDescription: parsed.english,
          japaneseDescription: parsed.japanese,
          questionId
        };
      } catch (parseError) {
        // JSONパースに失敗した場合は英語のみとして扱う
        console.warn('⚠️ Failed to parse JSON response, treating as English only');
        console.log(`✅ Image analysis completed: ${responseContent}`);
        
        return {
          success: true,
          analyzedDescription: responseContent,
          japaneseDescription: null, // 翻訳は別途必要
          questionId
        };
      }

    } catch (error) {
      console.error(`❌ Failed to analyze image for ${questionId}:`, error.message);
      
      return {
        success: false,
        error: error.message,
        questionId
      };
    }
  }

  /**
   * DALL-E 3で画像を生成
   */
  async generateImage(sceneDescription, questionId, correctAnswer = null) {
    try {
      console.log(`🎨 Generating image for question ${questionId}...`);
      console.log(`📝 English scene description: ${sceneDescription}`);

      // 画像生成プロンプトを作成（正解選択肢なしで）
      const imagePrompt = this.createImagePrompt(sceneDescription, null);
      console.log(`🖼️ Image prompt: ${imagePrompt}`);

      // DALL-E 3で画像生成
      const response = await this.client.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      });

      const imageUrl = response.data[0].url;
      console.log(`✅ Image generated successfully`);

      // 画像を保存
      const { originalPath, optimizedPath } = await this.saveAndOptimizeImage(imageUrl, questionId);
      
      return {
        success: true,
        imageUrl,
        originalPath,
        optimizedPath,
        webPath: `/images/part1/optimized/${questionId}.jpg`,
        prompt: imagePrompt, // 実際に使用されたプロンプトを返す
        englishSceneDescription: sceneDescription // 英語のシーン説明
      };

    } catch (error) {
      console.error(`❌ Failed to generate image for ${questionId}:`, error.message);
      
      // APIエラーの詳細をログ
      if (error.response) {
        console.error('API Error:', error.response.data);
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 画像をダウンロードして保存・最適化
   */
  async saveAndOptimizeImage(imageUrl, questionId) {
    try {
      // 画像をダウンロード
      console.log(`📥 Downloading image...`);
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });
      const buffer = Buffer.from(response.data);

      // オリジナル画像を保存
      const originalFilename = `${questionId}.png`;
      const originalPath = path.join(this.originalDir, originalFilename);
      await fs.writeFile(originalPath, buffer);
      console.log(`💾 Original image saved: ${originalFilename}`);

      // 最適化画像を作成（600x600、JPEG、品質80%）
      const optimizedFilename = `${questionId}.jpg`;
      const optimizedPath = path.join(this.optimizedDir, optimizedFilename);
      
      await sharp(buffer)
        .resize(600, 600, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 80,
          progressive: true
        })
        .toFile(optimizedPath);
      
      console.log(`🗜️ Optimized image saved: ${optimizedFilename}`);

      return {
        originalPath: `/images/part1/original/${originalFilename}`,
        optimizedPath: `/images/part1/optimized/${optimizedFilename}`
      };

    } catch (error) {
      console.error('Failed to save/optimize image:', error);
      throw error;
    }
  }

  /**
   * 画像生成のリトライ機能付きラッパー
   */
  async generateWithRetry(sceneDescription, questionId, correctAnswer = null, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.generateImage(sceneDescription, questionId, correctAnswer);
        if (result.success) {
          return result;
        }
        
        if (attempt < maxRetries) {
          console.log(`🔄 Retrying image generation (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
        }
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`❌ Failed to generate image after ${maxRetries} attempts`);
          return {
            success: false,
            error: error.message
          };
        }
      }
    }
  }
}

export default DalleImageGenerator;