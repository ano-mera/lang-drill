#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 元のオーストラリア女性音声ID
const ORIGINAL_FEMALE_VOICE_ID = 'p43fx6U8afP2xoq1Ai9f';

// Part3データを読み込み
const part3Questions = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/part3-questions.json'), 'utf8')
);

async function revertFemaleVoices() {
  console.log('女性音声を元に戻しています...');
  
  let revertedCount = 0;
  
  for (const question of part3Questions) {
    for (const speaker of question.speakers) {
      // IKne3meq5aSn9XLyUdCDに変更された女性音声を元に戻す
      if (speaker.voiceProfile.voiceId === 'IKne3meq5aSn9XLyUdCD' && 
          speaker.voiceProfile.gender === 'female') {
        
        const oldVoiceId = speaker.voiceProfile.voiceId;
        speaker.voiceProfile.voiceId = ORIGINAL_FEMALE_VOICE_ID;
        speaker.voiceProfile.accent = 'Australian';
        speaker.voiceProfile.country = '🇦🇺';
        speaker.voiceProfile.age = 'adult';
        speaker.voiceProfile.tone = 'calm';
        
        console.log(`✅ ${question.id} - ${speaker.name}(${speaker.id})の音声IDを復元: ${oldVoiceId} -> ${ORIGINAL_FEMALE_VOICE_ID}`);
        revertedCount++;
      }
    }
  }
  
  // データファイルを保存
  fs.writeFileSync(
    path.join(__dirname, '../src/data/part3-questions.json'),
    JSON.stringify(part3Questions, null, 2)
  );
  
  console.log(`\n✅ ${revertedCount}人の女性音声を元に戻しました`);
  console.log('✅ データファイルを更新しました');
}

// 実行
revertFemaleVoices().catch(console.error);