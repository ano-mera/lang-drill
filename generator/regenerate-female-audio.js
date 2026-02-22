#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ElevenLabsAudio from './lib/elevenlabs-audio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 元のオーストラリア女性音声ID
const ORIGINAL_FEMALE_VOICE_ID = 'p43fx6U8afP2xoq1Ai9f';

// Part3データを読み込み
const part3Questions = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/part3-questions.json'), 'utf8')
);

async function regenerateFemaleAudioFiles() {
  console.log('女性音声ファイルを元の音声で再生成しています...');
  
  const targetQuestions = ['part3_30', 'part3_33'];
  
  for (const questionId of targetQuestions) {
    const question = part3Questions.find(q => q.id === questionId);
    if (!question) {
      console.error(`問題 ${questionId} が見つかりません`);
      continue;
    }

    console.log(`\n=== ${questionId} の女性音声を再生成中 ===`);
    
    // 女性スピーカーを特定
    const femaleSpeakers = question.speakers.filter(speaker => 
      speaker.voiceProfile.gender === 'female'
    );
    
    for (const speaker of femaleSpeakers) {
      console.log(`女性スピーカー: ${speaker.name}(${speaker.id})`);
      
      // 該当する会話の音声を再生成
      for (let i = 0; i < question.conversation.length; i++) {
        const turn = question.conversation[i];
        
        if (turn.speaker === speaker.id) {
          const audioPath = path.join(__dirname, '../public/audio/part3/', `${questionId}_conversation_${i + 1}.mp3`);
          
          console.log(`\n再生成中: ${speaker.name}(${turn.speaker}) - Turn ${i + 1}`);
          console.log(`テキスト: ${turn.text}`);
          
          try {
            const elevenLabs = new ElevenLabsAudio();
            await elevenLabs.generateAudio(turn.text, audioPath, { voiceId: ORIGINAL_FEMALE_VOICE_ID });
            console.log(`✅ 成功: ${audioPath}`);
          } catch (error) {
            console.error(`❌ エラー: ${error.message}`);
          }
        }
      }
    }
  }
  
  console.log('\n✅ 女性音声ファイルの再生成が完了しました');
}

// 実行
regenerateFemaleAudioFiles().catch(console.error);