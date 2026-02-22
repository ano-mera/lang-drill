#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 修正された問題ID
const FIXED_QUESTIONS = ['part3_35', 'part3_51', 'part3_68'];
const NEW_VOICE_ID = 'IKne3meq5aSn9XLyUdCD';

console.log('🎤 修正された問題の音声ファイル再生成');
console.log(`対象問題: ${FIXED_QUESTIONS.join(', ')}`);
console.log(`新しいオーストラリア男性音声ID: ${NEW_VOICE_ID}`);

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

// 対象問題の音声を再生成
for (const questionId of FIXED_QUESTIONS) {
  const question = data.find(q => q.id === questionId);
  if (!question) {
    console.error(`❌ 問題 ${questionId} が見つかりません`);
    continue;
  }
  
  console.log(`\n🔄 ${questionId} の音声を再生成中...`);
  
  // 会話セグメントを再生成
  if (question.audioFiles && question.audioFiles.conversation && question.audioFiles.conversation.segments) {
    for (let i = 0; i < question.audioFiles.conversation.segments.length; i++) {
      const segment = question.audioFiles.conversation.segments[i];
      
      // 新しい音声IDを使用する話者のセグメントのみ再生成
      const speaker = question.speakers.find(s => s.id === segment.speaker);
      if (speaker && speaker.voiceProfile && speaker.voiceProfile.voiceId === NEW_VOICE_ID) {
        const audioPath = path.join(__dirname, '../public', segment.audioPath);
        
        console.log(`  🎤 セグメント${i + 1} (話者${segment.speaker}): "${segment.text.substring(0, 30)}..."`);
        console.log(`     音声ID: ${NEW_VOICE_ID}`);
        console.log(`     出力: ${segment.audioPath}`);
        
        try {
          await generateAudio(segment.text, audioPath, NEW_VOICE_ID);
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

console.log('\n🎉 音声再生成完了！');
console.log('次のステップ:');
console.log('1. 生成された音声ファイルをテストしてください');
console.log('2. 問題なければ残りの問題も修正してください');