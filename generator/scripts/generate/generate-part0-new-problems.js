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

async function generateNewProblemsAudio() {
  console.log("=== Generating Part 0 New Problems Audio (p0-031 to p0-040) ===\n");

  // 新しい問題データ (p0-031 to p0-040)
  const newProblems = [
    {
      id: "p0-031",
      text: "What time does the store open?"
    },
    {
      id: "p0-032", 
      text: "Can you help me with this?"
    },
    {
      id: "p0-033",
      text: "The meeting starts at ten."
    },
    {
      id: "p0-034",
      text: "I'm looking for the restroom."
    },
    {
      id: "p0-035",
      text: "Would you like some coffee?"
    },
    {
      id: "p0-036",
      text: "The elevator is out of order."
    },
    {
      id: "p0-037",
      text: "How much does this cost?"
    },
    {
      id: "p0-038",
      text: "Please speak more slowly."
    },
    {
      id: "p0-039",
      text: "Do you accept credit cards?"
    },
    {
      id: "p0-040",
      text: "I'll take this one, please."
    }
  ];

  console.log(`Processing ${newProblems.length} new problems\n`);

  let successCount = 0;
  let failCount = 0;

  for (const problem of newProblems) {
    console.log(`\nProcessing: ${problem.id}`);
    console.log(`Text: "${problem.text}"`);
    
    // 男性音声の生成
    const malePath = path.resolve(
      __dirname,
      "../../../public/audio/part0",
      `${problem.id}-m.mp3`
    );
    
    if (await generateAudio(problem.text, "male", malePath)) {
      successCount++;
    } else {
      failCount++;
    }

    // 女性音声の生成
    const femalePath = path.resolve(
      __dirname,
      "../../../public/audio/part0",
      `${problem.id}-f.mp3`
    );
    
    if (await generateAudio(problem.text, "female", femalePath)) {
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
  
  if (successCount > 0) {
    console.log("\n🎵 New audio files generated successfully!");
    console.log("Next steps:");
    console.log("1. Test the audio files locally");
    console.log("2. Upload to R2: node scripts/upload-part0-to-r2.js");
    console.log("3. Deploy to production");
  }
}

generateNewProblemsAudio().catch(console.error);