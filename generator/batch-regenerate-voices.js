#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎤 バッチ別音声再生成');

// バッチ処理データを読み込み
const batchDataPath = path.join(__dirname, 'batch-processing-data.json');
let batchData;
try {
  const fileContent = fs.readFileSync(batchDataPath, 'utf8');
  batchData = JSON.parse(fileContent);
  console.log(`✅ バッチデータ読み込み完了`);
  console.log(`総修正数: ${batchData.totalFixed}問`);
  console.log(`新規修正: ${batchData.newlyFixed.length}問`);
} catch (error) {
  console.error('❌ バッチデータ読み込みエラー:', error);
  process.exit(1);
}

// コマンドライン引数でバッチ番号を指定
const batchIndex = parseInt(process.argv[2]) - 1; // 1-based to 0-based
if (isNaN(batchIndex) || batchIndex < 0 || batchIndex >= batchData.batches.length) {
  console.error('❌ 使用法: node batch-regenerate-voices.js <バッチ番号>');
  console.log('バッチ一覧:');
  batchData.batches.forEach((batch, index) => {
    console.log(`  バッチ${index + 1}: ${batch.join(', ')}`);
  });
  process.exit(1);
}

const targetBatch = batchData.batches[batchIndex];
console.log(`🎯 バッチ${batchIndex + 1}を処理中: ${targetBatch.join(', ')}`);

// ElevenLabs API設定
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY環境変数が設定されていません');
  process.exit(1);
}

// part3-questions.jsonを読み込み
const dataPath = path.join(__dirname, '../src/data/part3-questions.json');
let data;
try {
  const fileContent = fs.readFileSync(dataPath, 'utf8');
  data = JSON.parse(fileContent);
  console.log(`✅ JSONファイル読み込み完了: ${data.length}問`);
} catch (error) {
  console.error('❌ JSONファイル読み込みエラー:', error);
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
let totalSegments = 0;
let processedSegments = 0;

// 対象バッチの問題を処理
for (const questionId of targetBatch) {
  const question = data.find(q => q.id === questionId);
  if (!question) {
    console.error(`❌ 問題 ${questionId} が見つかりません`);
    continue;
  }
  
  console.log(`\n🔄 ${questionId} の音声を再生成中...`);
  
  // セグメント数をカウント
  if (question.audioFiles && question.audioFiles.conversation && question.audioFiles.conversation.segments) {
    const segments = question.audioFiles.conversation.segments;
    const targetSegments = segments.filter(segment => {
      const speaker = question.speakers.find(s => s.id === segment.speaker);
      return speaker && speaker.voiceProfile && speaker.voiceProfile.voiceId === batchData.newVoiceId;
    });
    totalSegments += targetSegments.length;
  }
}

console.log(`📊 処理予定: ${totalSegments}セグメント`);

// 実際の音声生成処理
for (const questionId of targetBatch) {
  const question = data.find(q => q.id === questionId);
  if (!question) continue;
  
  console.log(`\n🔄 ${questionId} の音声を再生成中...`);
  
  // 会話セグメントを再生成
  if (question.audioFiles && question.audioFiles.conversation && question.audioFiles.conversation.segments) {
    for (let i = 0; i < question.audioFiles.conversation.segments.length; i++) {
      const segment = question.audioFiles.conversation.segments[i];
      
      // 新しい音声IDを使用する話者のセグメントのみ再生成
      const speaker = question.speakers.find(s => s.id === segment.speaker);
      if (speaker && speaker.voiceProfile && speaker.voiceProfile.voiceId === batchData.newVoiceId) {
        processedSegments++;
        const audioPath = path.join(__dirname, '../public', segment.audioPath);
        
        console.log(`  🎤 セグメント${i + 1} (話者${segment.speaker}) [${processedSegments}/${totalSegments}]`);
        console.log(`     "${segment.text.substring(0, 50)}..."`);
        console.log(`     音声ID: ${batchData.newVoiceId}`);
        console.log(`     出力: ${segment.audioPath}`);
        
        try {
          await generateAudio(segment.text, audioPath, batchData.newVoiceId);
          console.log(`     ✅ 生成完了`);
          
          // API制限対策で少し待機
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`     ❌ 生成失敗:`, error.message);
        }
      } else {
        console.log(`  ⏭️  セグメント${i + 1} (話者${segment.speaker}): スキップ（修正対象外）`);
      }
    }
  }
  
  console.log(`✅ ${questionId} 処理完了`);
}

console.log(`\n🎉 バッチ${batchIndex + 1}完了！`);
console.log(`処理済み: ${processedSegments}/${totalSegments}セグメント`);
console.log('\n次のステップ:');
console.log('1. 生成された音声ファイルをテストしてください');
if (batchIndex + 1 < batchData.batches.length) {
  console.log(`2. 次のバッチを処理: node batch-regenerate-voices.js ${batchIndex + 2}`);
} else {
  console.log('2. 全バッチ完了 - 最終テストを実行してください');
}