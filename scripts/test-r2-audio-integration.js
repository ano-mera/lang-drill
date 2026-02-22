#!/usr/bin/env node

/**
 * R2音声統合機能のテストスクリプト
 * 新しい問題生成ワークフローでR2アップロードが正常に動作することを確認
 */

import { R2AudioUploader } from '../generator/lib/r2-audio-uploader.js';
import ElevenLabsAudio from '../generator/lib/elevenlabs-audio.js';
import dotenv from 'dotenv';
import path from 'path';

// 環境変数の読み込み
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testR2AudioIntegration() {
  console.log('🔧 Testing R2 Audio Integration...\n');

  try {
    // 1. R2 Uploader単体テスト
    console.log('1️⃣ Testing R2AudioUploader...');
    const r2Uploader = new R2AudioUploader();
    
    const connectionTest = await r2Uploader.testConnection();
    if (!connectionTest) {
      throw new Error('R2 connection test failed');
    }
    console.log('✅ R2 connection successful\n');

    // 2. ElevenLabsAudio with R2 integration test
    console.log('2️⃣ Testing ElevenLabsAudio with R2 upload...');
    
    if (!process.env.ELEVENLABS_API_KEY) {
      console.log('⚠️ ELEVENLABS_API_KEY not found, skipping ElevenLabs test');
      return;
    }

    const audioGenerator = new ElevenLabsAudio({ useR2Upload: true });
    console.log('✅ ElevenLabsAudio initialized with R2 upload\n');

    // 3. テスト音声生成とR2アップロード
    console.log('3️⃣ Testing audio generation and R2 upload...');
    
    const testText = "This is a test audio file for R2 integration.";
    const testFileName = `test_r2_integration_${Date.now()}.mp3`;
    const testOutputPath = `/tmp/${testFileName}`;

    try {
      const audioResult = await audioGenerator.generateAudio(testText, testOutputPath, {
        partType: 'part1',
        isPart1: true
      });

      console.log('📤 Audio generation and upload result:', {
        audioPath: audioResult.audioPath,
        publicUrl: audioResult.publicUrl?.substring(0, 100) + '...',
        method: audioResult.method
      });

      if (audioResult.method === 'r2' && audioResult.publicUrl) {
        console.log('✅ R2 audio upload successful');
        console.log(`🌐 Public URL: ${audioResult.publicUrl}`);
      } else {
        console.log('⚠️ R2 upload failed, fell back to local storage');
      }

    } catch (audioError) {
      console.error('❌ Audio generation test failed:', audioError.message);
    }

    console.log('\n4️⃣ Testing Part1 options audio generation...');
    
    try {
      const testOptions = [
        "A woman is reading a book",
        "A man is walking down the street",
        "Children are playing in the park",
        "Workers are building a house"
      ];
      
      const questionId = `test_part1_${Date.now()}`;
      const audioResult = await audioGenerator.generateOptionsAudio(
        questionId, 
        testOptions, 
        '/tmp/test_audio', // この値は無視される（R2使用時）
        null // ランダム音声選択
      );

      console.log('📊 Part1 options audio generation result:', {
        totalOptions: audioResult.audioFiles.length,
        firstOption: {
          option: audioResult.audioFiles[0]?.option,
          method: audioResult.audioFiles[0]?.method,
          hasPublicUrl: !!audioResult.audioFiles[0]?.publicUrl
        },
        voiceProfile: {
          gender: audioResult.voiceProfile?.gender,
          accent: audioResult.voiceProfile?.accent,
          country: audioResult.voiceProfile?.country
        }
      });

      const r2UploadCount = audioResult.audioFiles.filter(af => af.method === 'r2').length;
      console.log(`✅ Successfully uploaded ${r2UploadCount}/${audioResult.audioFiles.length} audio files to R2`);

    } catch (optionsError) {
      console.error('❌ Part1 options audio test failed:', optionsError.message);
    }

    console.log('\n🎉 R2 Audio Integration test completed!');

  } catch (error) {
    console.error('❌ R2 Audio Integration test failed:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみテストを実行
if (import.meta.url === `file://${process.argv[1]}`) {
  testR2AudioIntegration();
}

export { testR2AudioIntegration };