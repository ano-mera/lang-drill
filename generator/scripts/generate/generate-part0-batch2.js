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

async function generateBatch2Audio() {
  console.log("=== Generating Part 0 Batch 2 Audio (p0-041 to p0-060) ===\n");

  // 新しい問題データ (p0-041 to p0-060)
  const batch2Problems = [
    { id: "p0-041", text: "Excuse me, where is the exit?" },
    { id: "p0-042", text: "The printer is not working." },
    { id: "p0-043", text: "Could you repeat that, please?" },
    { id: "p0-044", text: "The train is delayed by ten minutes." },
    { id: "p0-045", text: "I'd like to book a table." },
    { id: "p0-046", text: "Is this seat taken?" },
    { id: "p0-047", text: "The weather is nice today." },
    { id: "p0-048", text: "Can I pay by cash?" },
    { id: "p0-049", text: "I need to catch a taxi." },
    { id: "p0-050", text: "The meeting room is occupied." },
    { id: "p0-051", text: "What's your favorite color?" },
    { id: "p0-052", text: "I'm running late for work." },
    { id: "p0-053", text: "Could you turn on the lights?" },
    { id: "p0-054", text: "The store closes at nine." },
    { id: "p0-055", text: "I forgot my passport." },
    { id: "p0-056", text: "Would you like a receipt?" },
    { id: "p0-057", text: "The phone is ringing." },
    { id: "p0-058", text: "I need to check my email." },
    { id: "p0-059", text: "The coffee tastes good." },
    { id: "p0-060", text: "I'll see you tomorrow." }
  ];

  console.log(`Processing ${batch2Problems.length} problems (Batch 2)\n`);

  let successCount = 0;
  let failCount = 0;

  for (const problem of batch2Problems) {
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
    console.log("\n🎵 Batch 2 audio files generated successfully!");
    console.log("Next steps:");
    console.log("1. Test the audio files locally");
    console.log("2. Upload to R2: node scripts/upload-part0-batch2.js");
    console.log("3. Deploy to production");
    console.log("\nTotal Part0 problems will be: 60 (p0-001 to p0-060)");
  }
}

generateBatch2Audio().catch(console.error);