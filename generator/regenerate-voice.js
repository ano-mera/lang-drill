#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ElevenLabsAudio from './lib/elevenlabs-audio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 新しい音声ID（IKne3meq5aSn9XLyUdCD）でテスト
const NEW_VOICE_ID = 'IKne3meq5aSn9XLyUdCD';

// テスト対象の問題データを読み込み
const part3Questions = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/part3-questions.json'), 'utf8')
);

async function regenerateVoiceForQuestion(questionId) {
  const question = part3Questions.find(q => q.id === questionId);
  if (!question) {
    console.error(`問題 ${questionId} が見つかりません`);
    return;
  }

  console.log(`\n=== ${questionId} の音声を再生成中 ===`);
  // エセックス訛り音声IDを使用しているスピーカーを特定
  const problematicVoices = ['CYw3kZ02Hs0563khs1Fj', 'p43fx6U8afP2xoq1Ai9f'];
  const affectedSpeakers = question.speakers.filter(speaker => 
    problematicVoices.includes(speaker.voiceProfile.voiceId)
  );
  
  console.log(`影響を受けるスピーカー: ${affectedSpeakers.map(s => `${s.name}(${s.id})`).join(', ')}`);
  console.log(`新しい音声ID: ${NEW_VOICE_ID}`);

  if (affectedSpeakers.length === 0) {
    console.log('\nℹ️ この問題にはエセックス訛り音声は使用されていません');
    return;
  }

  // 会話の音声を再生成
  for (let i = 0; i < question.conversation.length; i++) {
    const turn = question.conversation[i];
    const speaker = question.speakers.find(s => s.id === turn.speaker);
    
    // 該当するスピーカーの音声のみ再生成
    if (speaker && problematicVoices.includes(speaker.voiceProfile.voiceId)) {
      const audioPath = path.join(__dirname, '../public/audio/part3/', `${questionId}_conversation_${i + 1}.mp3`);
      
      console.log(`\n再生成中: ${speaker.name}(${turn.speaker}) - Turn ${i + 1}`);
      console.log(`テキスト: ${turn.text}`);
      
      try {
        const elevenLabs = new ElevenLabsAudio();
        await elevenLabs.generateAudio(turn.text, audioPath, { voiceId: NEW_VOICE_ID });
        console.log(`✅ 成功: ${audioPath}`);
      } catch (error) {
        console.error(`❌ エラー: ${error.message}`);
      }
    }
  }

  // データファイルの音声IDも更新
  let updated = false;
  for (const speaker of question.speakers) {
    if (problematicVoices.includes(speaker.voiceProfile.voiceId)) {
      const oldVoiceId = speaker.voiceProfile.voiceId;
      speaker.voiceProfile.voiceId = NEW_VOICE_ID;
      console.log(`\n✅ ${speaker.name}(${speaker.id})の音声IDを更新: ${oldVoiceId} -> ${NEW_VOICE_ID}`);
      updated = true;
    }
  }

  // 更新したデータを保存
  fs.writeFileSync(
    path.join(__dirname, '../src/data/part3-questions.json'),
    JSON.stringify(part3Questions, null, 2)
  );
  console.log('✅ データファイルを更新しました');
}

// メイン処理
async function main() {
  console.log('音声再生成スクリプトを開始します...');
  console.log(`新しい音声ID: ${NEW_VOICE_ID}`);
  
  // テストとして複数の問題を処理
  const testQuestions = ['part3_30', 'part3_33', 'part3_34'];
  
  for (const questionId of testQuestions) {
    await regenerateVoiceForQuestion(questionId);
  }
  
  console.log('\n✅ 音声再生成が完了しました');
}

// 実行
main().catch(console.error);