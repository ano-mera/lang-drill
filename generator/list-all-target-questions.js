#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLD_VOICE_ID = 'CYw3kZ02Hs0563khs1Fj';

console.log('🔍 エセックス音声IDを使用している全問題を特定中...');

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

const targetQuestions = [];
const alreadyFixed = ['part3_35', 'part3_51', 'part3_68'];

// すべての問題をチェック
for (const question of data) {
  let hasOldVoiceId = false;
  
  // 話者情報をチェック
  if (question.speakers) {
    for (const speaker of question.speakers) {
      if (speaker.voiceProfile && speaker.voiceProfile.voiceId === OLD_VOICE_ID) {
        hasOldVoiceId = true;
        break;
      }
    }
  }
  
  // 会話セグメントをチェック
  if (!hasOldVoiceId && question.audioFiles && question.audioFiles.conversation && question.audioFiles.conversation.segments) {
    for (const segment of question.audioFiles.conversation.segments) {
      if (segment.voiceId === OLD_VOICE_ID) {
        hasOldVoiceId = true;
        break;
      }
    }
  }
  
  if (hasOldVoiceId) {
    targetQuestions.push(question.id);
  }
}

console.log(`\n📊 対象問題リスト:`);
console.log(`総数: ${targetQuestions.length}問`);
console.log(`修正済み: ${alreadyFixed.length}問 (${alreadyFixed.join(', ')})`);

const remaining = targetQuestions.filter(q => !alreadyFixed.includes(q));
console.log(`残り: ${remaining.length}問`);

console.log(`\n📝 全対象問題:`);
targetQuestions.sort((a, b) => {
  const numA = parseInt(a.replace('part3_', ''));
  const numB = parseInt(b.replace('part3_', ''));
  return numA - numB;
});

targetQuestions.forEach((questionId, index) => {
  const status = alreadyFixed.includes(questionId) ? '✅' : '⏳';
  console.log(`${status} ${questionId}`);
});

console.log(`\n🎯 処理計画:`);
console.log(`1. バッチ処理で残り${remaining.length}問のvoiceIDを修正`);
console.log(`2. 5問ずつのグループに分けて音声再生成`);
console.log(`3. 各グループごとにテスト実行`);

// 残りの問題を5問ずつのグループに分割
const batches = [];
for (let i = 0; i < remaining.length; i += 5) {
  batches.push(remaining.slice(i, i + 5));
}

console.log(`\n📦 処理バッチ:`);
batches.forEach((batch, index) => {
  console.log(`バッチ${index + 1}: ${batch.join(', ')}`);
});

// ファイルに保存
const outputPath = path.join(__dirname, 'remaining-questions.json');
fs.writeFileSync(outputPath, JSON.stringify({
  total: targetQuestions.length,
  fixed: alreadyFixed,
  remaining: remaining,
  batches: batches
}, null, 2));

console.log(`\n💾 詳細情報を保存: ${path.basename(outputPath)}`);