#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLD_VOICE_ID = 'CYw3kZ02Hs0563khs1Fj'; // エセックス訛り（不適切）
const NEW_VOICE_ID = 'IKne3meq5aSn9XLyUdCD'; // 適切なオーストラリア男性音声

console.log('🔧 Part1オーストラリア男性音声ID修正');
console.log(`変更前: ${OLD_VOICE_ID}`);
console.log(`変更後: ${NEW_VOICE_ID}`);

// part1-questions.jsonを読み込み
const dataPath = path.join(__dirname, '../src/data/part1-questions.json');
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
let modifiedQuestions = [];
let totalAudioFiles = 0;

// 全問題をチェック・修正
for (const question of data) {
  if (question.voiceProfile && question.voiceProfile.voiceId === OLD_VOICE_ID) {
    console.log(`\n🔄 ${question.id} を修正中...`);
    console.log(`  音声プロファイル: ${question.voiceProfile.gender} ${question.voiceProfile.accent} (${question.voiceProfile.country})`);
    
    // voiceProfileのvoiceIDを修正
    question.voiceProfile.voiceId = NEW_VOICE_ID;
    
    // 音声ファイル数をカウント
    let questionAudioCount = 0;
    if (question.audioFiles && Array.isArray(question.audioFiles)) {
      questionAudioCount = question.audioFiles.length;
      console.log(`  音声ファイル: ${questionAudioCount}個`);
      question.audioFiles.forEach(audioFile => {
        console.log(`    - ${audioFile.option}: "${audioFile.text.substring(0, 30)}..."`);
        console.log(`      パス: ${audioFile.audioPath}`);
      });
    }
    
    totalAudioFiles += questionAudioCount;
    modifiedCount++;
    modifiedQuestions.push(question.id);
    console.log(`  ✅ ${question.id} 修正完了`);
  }
}

console.log(`\n📊 Part1修正結果:`);
console.log(`修正問題数: ${modifiedCount}問`);
console.log(`総音声ファイル数: ${totalAudioFiles}ファイル`);

if (modifiedCount > 0) {
  console.log(`\n🎯 修正された問題:`);
  modifiedQuestions.forEach(questionId => {
    console.log(`  ✅ ${questionId}`);
  });
  
  // バックアップ作成
  const backupPath = `${dataPath}.backup.${Date.now()}`;
  fs.copyFileSync(dataPath, backupPath);
  console.log(`💾 バックアップ作成: ${path.basename(backupPath)}`);
  
  // 修正版を保存
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`✅ 修正版ファイル保存完了`);
  
  // 音声再生成用データを保存
  const regenerationDataPath = path.join(__dirname, 'part1-regeneration-data.json');
  const questionsToRegenerate = data.filter(q => modifiedQuestions.includes(q.id));
  
  fs.writeFileSync(regenerationDataPath, JSON.stringify({
    oldVoiceId: OLD_VOICE_ID,
    newVoiceId: NEW_VOICE_ID,
    modifiedQuestions: modifiedQuestions,
    totalAudioFiles: totalAudioFiles,
    questionsData: questionsToRegenerate
  }, null, 2));
  
  console.log(`💾 音声再生成データ保存: ${path.basename(regenerationDataPath)}`);
  
  console.log(`\n⚠️  次のステップ:`);
  console.log(`1. Part1音声再生成スクリプトを実行`);
  console.log(`2. 修正された問題をテストして確認`);
} else {
  console.log(`ℹ️  Part1に修正対象なし`);
}