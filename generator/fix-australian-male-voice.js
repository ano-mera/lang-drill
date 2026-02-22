#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLD_VOICE_ID = 'CYw3kZ02Hs0563khs1Fj'; // エセックス訛り（不適切）
const NEW_VOICE_ID = 'IKne3meq5aSn9XLyUdCD'; // 適切なオーストラリア男性音声

// 修正対象の問題ID（慎重に最初の3問のみ）
const TARGET_QUESTIONS = ['part3_35', 'part3_51', 'part3_68'];

console.log('🔧 オーストラリア男性音声ID修正開始');
console.log(`変更前: ${OLD_VOICE_ID}`);
console.log(`変更後: ${NEW_VOICE_ID}`);
console.log(`対象問題: ${TARGET_QUESTIONS.join(', ')}`);

// part3-questions.jsonを読み込み
const dataPath = path.join(__dirname, '../src/data/part3-questions.json');
console.log(`データファイル: ${dataPath}`);

let data;
try {
  const fileContent = fs.readFileSync(dataPath, 'utf8');
  data = JSON.parse(fileContent);
  console.log(`✅ JSONファイル読み込み完了: ${data.length}問`);
} catch (error) {
  console.error('❌ JSONファイル読み込みエラー:', error);
  process.exit(1);
}

let modifiedCount = 0;
let checkedQuestions = [];

// 対象の問題のみを修正
for (const question of data) {
  if (TARGET_QUESTIONS.includes(question.id)) {
    checkedQuestions.push(question.id);
    console.log(`\n🔍 ${question.id} をチェック中...`);
    
    let questionModified = false;
    
    // 話者情報の修正
    if (question.speakers) {
      for (const speaker of question.speakers) {
        if (speaker.voiceProfile && speaker.voiceProfile.voiceId === OLD_VOICE_ID) {
          console.log(`  👤 話者${speaker.id} (${speaker.name}, ${speaker.gender}): ${OLD_VOICE_ID} → ${NEW_VOICE_ID}`);
          speaker.voiceProfile.voiceId = NEW_VOICE_ID;
          questionModified = true;
        }
      }
    }
    
    // 会話セグメントの修正
    if (question.audioFiles && question.audioFiles.conversation && question.audioFiles.conversation.segments) {
      for (const segment of question.audioFiles.conversation.segments) {
        if (segment.voiceId === OLD_VOICE_ID) {
          console.log(`  🎤 セグメント話者${segment.speaker}: ${OLD_VOICE_ID} → ${NEW_VOICE_ID}`);
          segment.voiceId = NEW_VOICE_ID;
          questionModified = true;
        }
      }
    }
    
    if (questionModified) {
      modifiedCount++;
      console.log(`  ✅ ${question.id} 修正完了`);
    } else {
      console.log(`  ℹ️  ${question.id} 修正不要（対象音声IDなし）`);
    }
  }
}

console.log(`\n📊 修正結果:`);
console.log(`チェック対象: ${checkedQuestions.length}問 (${checkedQuestions.join(', ')})`);
console.log(`修正済み: ${modifiedCount}問`);

if (modifiedCount > 0) {
  // バックアップ作成
  const backupPath = `${dataPath}.backup.${Date.now()}`;
  fs.copyFileSync(dataPath, backupPath);
  console.log(`💾 バックアップ作成: ${path.basename(backupPath)}`);
  
  // 修正版を保存
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`✅ 修正版ファイル保存完了`);
  
  console.log(`\n⚠️  次のステップ:`);
  console.log(`1. 音声ファイルを再生成してください`);
  console.log(`2. 修正された問題をテストしてください`);
  console.log(`3. 問題なければ残りの問題も修正してください`);
} else {
  console.log(`ℹ️  修正対象なし - 処理完了`);
}