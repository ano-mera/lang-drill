#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLD_VOICE_ID = 'CYw3kZ02Hs0563khs1Fj'; // エセックス訛り（不適切）
const NEW_VOICE_ID = 'IKne3meq5aSn9XLyUdCD'; // 適切なオーストラリア男性音声

// 既に修正済みの問題
const ALREADY_FIXED = ['part3_35', 'part3_51', 'part3_68'];

console.log('🔧 全オーストラリア男性音声ID一括修正');
console.log(`変更前: ${OLD_VOICE_ID}`);
console.log(`変更後: ${NEW_VOICE_ID}`);
console.log(`修正済みスキップ: ${ALREADY_FIXED.join(', ')}`);

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
let modifiedQuestions = [];

// 全問題をチェック・修正
for (const question of data) {
  // 既に修正済みの問題はスキップ
  if (ALREADY_FIXED.includes(question.id)) {
    console.log(`⏭️  ${question.id}: 修正済みのためスキップ`);
    continue;
  }
  
  let hasOldVoiceId = false;
  let questionModified = false;
  
  // 話者情報の修正
  if (question.speakers) {
    for (const speaker of question.speakers) {
      if (speaker.voiceProfile && speaker.voiceProfile.voiceId === OLD_VOICE_ID) {
        console.log(`🔄 ${question.id} - 話者${speaker.id} (${speaker.name}, ${speaker.gender}): ${OLD_VOICE_ID} → ${NEW_VOICE_ID}`);
        speaker.voiceProfile.voiceId = NEW_VOICE_ID;
        hasOldVoiceId = true;
        questionModified = true;
      }
    }
  }
  
  // 会話セグメントの修正
  if (question.audioFiles && question.audioFiles.conversation && question.audioFiles.conversation.segments) {
    for (const segment of question.audioFiles.conversation.segments) {
      if (segment.voiceId === OLD_VOICE_ID) {
        console.log(`🔄 ${question.id} - セグメント話者${segment.speaker}: ${OLD_VOICE_ID} → ${NEW_VOICE_ID}`);
        segment.voiceId = NEW_VOICE_ID;
        hasOldVoiceId = true;
        questionModified = true;
      }
    }
  }
  
  if (hasOldVoiceId) {
    checkedQuestions.push(question.id);
    if (questionModified) {
      modifiedCount++;
      modifiedQuestions.push(question.id);
      console.log(`  ✅ ${question.id} 修正完了`);
    }
  }
}

console.log(`\n📊 修正結果:`);
console.log(`対象問題発見: ${checkedQuestions.length}問`);
console.log(`修正実行: ${modifiedCount}問`);
console.log(`修正済みスキップ: ${ALREADY_FIXED.length}問`);
console.log(`総修正数: ${modifiedCount + ALREADY_FIXED.length}問`);

if (modifiedCount > 0) {
  // バックアップ作成
  const backupPath = `${dataPath}.backup.${Date.now()}`;
  fs.copyFileSync(dataPath, backupPath);
  console.log(`💾 バックアップ作成: ${path.basename(backupPath)}`);
  
  // 修正版を保存
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`✅ 修正版ファイル保存完了`);
  
  console.log(`\n🎯 修正された問題一覧:`);
  modifiedQuestions.sort((a, b) => {
    const numA = parseInt(a.replace('part3_', ''));
    const numB = parseInt(b.replace('part3_', ''));
    return numA - numB;
  });
  modifiedQuestions.forEach(questionId => {
    console.log(`  ✅ ${questionId}`);
  });
  
  console.log(`\n⚠️  次のステップ:`);
  console.log(`1. バッチ別音声再生成スクリプトを実行`);
  console.log(`2. 5問ずつ段階的に音声ファイルを生成`);
  console.log(`3. 各バッチをテストして確認`);
  
  // 処理用データを保存
  const processDataPath = path.join(__dirname, 'batch-processing-data.json');
  const remaining = modifiedQuestions;
  const batches = [];
  for (let i = 0; i < remaining.length; i += 5) {
    batches.push(remaining.slice(i, i + 5));
  }
  
  fs.writeFileSync(processDataPath, JSON.stringify({
    oldVoiceId: OLD_VOICE_ID,
    newVoiceId: NEW_VOICE_ID,
    totalFixed: modifiedCount + ALREADY_FIXED.length,
    alreadyFixed: ALREADY_FIXED,
    newlyFixed: modifiedQuestions,
    batches: batches
  }, null, 2));
  
  console.log(`💾 バッチ処理データ保存: ${path.basename(processDataPath)}`);
} else {
  console.log(`ℹ️  新規修正対象なし - データベース修正完了済み`);
}