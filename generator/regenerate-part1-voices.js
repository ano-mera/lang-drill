#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎤 Part1音声ファイル再生成');

// 再生成データを読み込み
const regenerationDataPath = path.join(__dirname, 'part1-regeneration-data.json');
let regenerationData;
try {
  const fileContent = fs.readFileSync(regenerationDataPath, 'utf8');
  regenerationData = JSON.parse(fileContent);
  console.log(`✅ 再生成データ読み込み完了`);
  console.log(`修正問題数: ${regenerationData.modifiedQuestions.length}問`);
  console.log(`総音声ファイル数: ${regenerationData.totalAudioFiles}ファイル`);
} catch (error) {
  console.error('❌ 再生成データ読み込みエラー:', error);
  process.exit(1);
}

// ElevenLabs API設定
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY環境変数が設定されていません');
  process.exit(1);
}

// ElevenLabs音声生成関数
async function generateAudio(text, outputPath, voiceId) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // ディレクトリが存在しない場合は作成
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, buffer);
}

// 進捗ログ
let totalFiles = regenerationData.totalAudioFiles;
let processedFiles = 0;

console.log(`\n🎯 処理対象: ${regenerationData.modifiedQuestions.join(', ')}`);
console.log(`新しいオーストラリア男性音声ID: ${regenerationData.newVoiceId}`);

// 各問題の音声を再生成
for (const questionData of regenerationData.questionsData) {
  console.log(`\n🔄 ${questionData.id} の音声を再生成中...`);
  
  if (questionData.audioFiles && Array.isArray(questionData.audioFiles)) {
    for (const audioFile of questionData.audioFiles) {
      processedFiles++;
      const audioPath = path.join(__dirname, '../public', audioFile.audioPath);
      
      console.log(`  🎤 選択肢${audioFile.option} [${processedFiles}/${totalFiles}]`);
      console.log(`     "${audioFile.text.substring(0, 50)}..."`);
      console.log(`     音声ID: ${regenerationData.newVoiceId}`);
      console.log(`     出力: ${audioFile.audioPath}`);
      
      try {
        await generateAudio(audioFile.text, audioPath, regenerationData.newVoiceId);
        console.log(`     ✅ 生成完了`);
        
        // API制限対策で少し待機
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`     ❌ 生成失敗:`, error.message);
      }
    }
  }
  
  console.log(`✅ ${questionData.id} 処理完了`);
}

console.log(`\n🎉 Part1音声再生成完了！`);
console.log(`処理済み: ${processedFiles}/${totalFiles}ファイル`);
console.log('\n次のステップ:');
console.log('1. 生成された音声ファイルをテストしてください');
console.log('2. Part1問題の音声が適切なオーストラリア音声になっているか確認してください');