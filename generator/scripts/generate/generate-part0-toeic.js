#!/usr/bin/env node

/**
 * TOEIC向けPart0問題生成スクリプト
 * ビジネスシーンで頻出する短いフレーズを生成
 */

import openai from "../../lib/openai-config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 音声プロファイル設定
const VOICE_PROFILES = {
  male: "onyx",
  female: "nova"
};

// TOEICスタイルの問題生成プロンプト
const TOEIC_PROMPT = `
Generate 20 short English sentences commonly used in TOEIC listening sections.

Requirements:
- Length: 5-10 words per sentence
- Context: Business situations (office, meetings, travel, customer service, phone calls)
- Grammar: Mix of present, progressive, perfect tenses, questions, and requests
- Vocabulary: Common TOEIC business vocabulary

Categories to include:
1. Schedule/Time: appointments, deadlines, meetings
2. Office equipment: copier, printer, computer issues
3. Requests/Instructions: polite requests, giving directions
4. Phone/Email: phone calls, messages, emails
5. Travel/Transportation: flights, trains, hotels
6. Problems/Solutions: reporting issues, offering help

Format each sentence as JSON:
{
  "text": "English sentence",
  "category": "category name",
  "translation": "Japanese translation"
}

Make sentences natural and practical for business situations.
`;

async function generateTOEICProblems() {
  console.log("=== Generating TOEIC-style Part 0 Problems ===\n");

  try {
    // GPT-4でTOEICスタイルの問題を生成
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert TOEIC test creator specializing in business English."
        },
        {
          role: "user",
          content: TOEIC_PROMPT
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    console.log("Generated problems:\n", content);

    // JSONコードブロックを抽出
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : content;

    // 生成された問題を保存
    const outputPath = path.resolve(__dirname, "toeic-problems.json");
    fs.writeFileSync(outputPath, jsonContent, "utf-8");
    console.log(`\n✓ Problems saved to: ${outputPath}`);

    return JSON.parse(jsonContent);
  } catch (error) {
    console.error("Failed to generate problems:", error);
    throw error;
  }
}

async function generateAudio(text, voiceType, outputPath) {
  try {
    console.log(`Generating ${voiceType} audio for: "${text}"`);
    
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: VOICE_PROFILES[voiceType],
      input: text,
      speed: 0.9  // TOEICリスニング速度に合わせて調整
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, buffer);
    console.log(`✓ Audio saved: ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error(`✗ Failed to generate audio: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("=== TOEIC Part 0 Generation Started ===\n");

  // Step 1: 問題生成
  console.log("Step 1: Generating TOEIC-style problems...\n");
  const problems = await generateTOEICProblems();

  // Step 2: 音声生成
  console.log("\nStep 2: Generating audio files...\n");
  
  let audioCount = 0;
  const audioDir = path.resolve(__dirname, "../../../public/audio/part0-toeic");

  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    const id = `p0-toeic-${(i + 1).toString().padStart(3, '0')}`;
    
    console.log(`\nProcessing: ${id}`);
    console.log(`Text: "${problem.text}"`);
    console.log(`Category: ${problem.category}`);
    
    // 男性音声
    const malePath = path.join(audioDir, `${id}-m.mp3`);
    if (await generateAudio(problem.text, "male", malePath)) {
      audioCount++;
    }

    // 女性音声
    const femalePath = path.join(audioDir, `${id}-f.mp3`);
    if (await generateAudio(problem.text, "female", femalePath)) {
      audioCount++;
    }

    // API制限対策
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n=== Generation Complete ===");
  console.log(`✓ Generated ${problems.length} TOEIC-style problems`);
  console.log(`✓ Created ${audioCount} audio files`);
  console.log("\n📝 Next steps:");
  console.log("1. Review generated problems in toeic-problems.json");
  console.log("2. Update /src/data/part0-sentences.json with TOEIC problems");
  console.log("3. Upload audio files to R2 storage");
}

// 実行
main().catch(console.error);