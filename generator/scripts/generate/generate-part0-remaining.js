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

async function generateAudio(text, voiceType, outputPath) {
  try {
    console.log(`Generating ${voiceType} audio for: "${text}"`);
    
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: VOICE_PROFILES[voiceType],
      input: text,
      speed: 0.9  
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

async function generateRemainingAudio() {
  console.log("=== Generating Remaining Part 0 Audio ===\n");

  // 残りの文章データ
  const remainingSentences = [
    {
      id: "p0-027",
      text: "Would you mind closing the window?"
    },
    {
      id: "p0-028", 
      text: "The flight has been delayed."
    },
    {
      id: "p0-029",
      text: "Could I have the bill, please?"
    },
    {
      id: "p0-030",
      text: "I need to make a reservation."
    }
  ];

  console.log(`Processing ${remainingSentences.length} remaining sentences\n`);

  let successCount = 0;
  let failCount = 0;

  for (const sentence of remainingSentences) {
    console.log(`\nProcessing: ${sentence.id}`);
    console.log(`Text: "${sentence.text}"`);
    
    // 男性音声の生成
    const malePath = path.resolve(
      __dirname,
      "../../../public/audio/part0",
      `${sentence.id}-m.mp3`
    );
    
    if (await generateAudio(sentence.text, "male", malePath)) {
      successCount++;
    } else {
      failCount++;
    }

    // 女性音声の生成
    const femalePath = path.resolve(
      __dirname,
      "../../../public/audio/part0",
      `${sentence.id}-f.mp3`
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
}

generateRemainingAudio().catch(console.error);