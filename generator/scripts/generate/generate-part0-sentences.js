import openai from "../../lib/openai-config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 音声プロファイル設定
const VOICE_PROFILES = {
  male: "onyx",    // 男性音声
  female: "nova"    // 女性音声
};

async function generateAudio(text, voiceType, outputPath) {
  try {
    console.log(`Generating ${voiceType} audio for: "${text}"`);
    
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: VOICE_PROFILES[voiceType],
      input: text,
      speed: 0.9  // 少しゆっくり目に設定
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // ディレクトリが存在しない場合は作成
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

async function generatePart0Audio() {
  console.log("=== Part 0 Audio Generation Started ===\n");

  // データファイルの読み込み
  const dataPath = path.resolve(__dirname, "../../../src/data/part0-sentences.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const sentences = data.sentences;

  console.log(`Found ${sentences.length} sentences to process\n`);

  let successCount = 0;
  let failCount = 0;

  for (const sentence of sentences) {
    console.log(`\nProcessing: ${sentence.id}`);
    console.log(`Text: "${sentence.text}"`);
    
    // 男性音声の生成
    const malePath = path.resolve(
      __dirname,
      "../../../public",
      sentence.audioFiles.male.slice(1) // 先頭の/を削除
    );
    
    if (await generateAudio(sentence.text, "male", malePath)) {
      successCount++;
    } else {
      failCount++;
    }

    // 女性音声の生成
    const femalePath = path.resolve(
      __dirname,
      "../../../public",
      sentence.audioFiles.female.slice(1) // 先頭の/を削除
    );
    
    if (await generateAudio(sentence.text, "female", femalePath)) {
      successCount++;
    } else {
      failCount++;
    }

    // API制限を考慮して待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n=== Generation Complete ===");
  console.log(`✓ Success: ${successCount} audio files`);
  console.log(`✗ Failed: ${failCount} audio files`);
  console.log(`Total sentences: ${sentences.length}`);
}

// 実行
generatePart0Audio().catch(console.error);