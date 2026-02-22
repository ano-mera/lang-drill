#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLD_VOICE_ID = 'CYw3kZ02Hs0563khs1Fj'; // エセックス訛り（不適切）

console.log('🔍 Part1でエセックス音声IDを使用している問題を分析中...');

// part1-questions.jsonを読み込み
const dataPath = path.join(__dirname, '../src/data/part1-questions.json');
let data;
try {
  const fileContent = fs.readFileSync(dataPath, 'utf8');
  data = JSON.parse(fileContent);
  console.log(`✅ Part1 JSONファイル読み込み完了: ${data.length}問`);
} catch (error) {
  console.error('❌ JSONファイル読み込みエラー:', error);
  process.exit(1);
}

const targetQuestions = [];

// 全問題をチェック
for (const question of data) {
  if (question.voiceProfile && question.voiceProfile.voiceId === OLD_VOICE_ID) {
    targetQuestions.push({
      id: question.id,
      voiceProfile: question.voiceProfile,
      audioFiles: question.audioFiles
    });
  }
}

console.log(`\n📊 Part1対象問題リスト:`);
console.log(`総数: ${targetQuestions.length}問`);

if (targetQuestions.length > 0) {
  console.log(`\n📝 対象問題詳細:`);
  targetQuestions.forEach((question, index) => {
    console.log(`${index + 1}. ${question.id}`);
    console.log(`   音声ID: ${question.voiceProfile.voiceId}`);
    console.log(`   性別: ${question.voiceProfile.gender}`);
    console.log(`   アクセント: ${question.voiceProfile.accent}`);
    console.log(`   国: ${question.voiceProfile.country}`);
    
    // 音声ファイル構造をチェック
    if (question.audioFiles) {
      console.log(`   音声ファイル構造:`);
      if (question.audioFiles.question) {
        console.log(`     - 質問音声: ${question.audioFiles.question.audioPath || 'パスなし'}`);
      }
      if (question.audioFiles.options) {
        console.log(`     - 選択肢音声: ${question.audioFiles.options.length}個`);
        question.audioFiles.options.forEach((option, optIndex) => {
          console.log(`       ${option.option}: ${option.audioPath || 'パスなし'}`);
        });
      }
    }
    console.log('');
  });
  
  console.log(`🎯 Part1修正計画:`);
  console.log(`1. ${targetQuestions.length}問のvoiceIDを一括修正`);
  console.log(`2. 各問題の音声ファイルを再生成:`);
  
  let totalAudioFiles = 0;
  targetQuestions.forEach(question => {
    let questionAudioCount = 0;
    if (question.audioFiles?.question?.audioPath) questionAudioCount++;
    if (question.audioFiles?.options) questionAudioCount += question.audioFiles.options.length;
    totalAudioFiles += questionAudioCount;
    console.log(`   - ${question.id}: ${questionAudioCount}ファイル`);
  });
  
  console.log(`\n📊 再生成予定音声ファイル数: ${totalAudioFiles}ファイル`);
  console.log(`\n⚠️  Part1の音声ファイル構造:`);
  console.log(`- 質問音声: question.audioPath`);
  console.log(`- 選択肢音声: options[].audioPath (A, B, C, D)`);
  console.log(`- Part3と異なり、セグメント形式ではない`);
  
  // 処理データを保存
  const outputPath = path.join(__dirname, 'part1-voice-fix-data.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    oldVoiceId: OLD_VOICE_ID,
    newVoiceId: 'IKne3meq5aSn9XLyUdCD',
    targetQuestions: targetQuestions.map(q => q.id),
    totalAudioFiles: totalAudioFiles,
    questionsData: targetQuestions
  }, null, 2));
  
  console.log(`💾 Part1修正データ保存: ${path.basename(outputPath)}`);
} else {
  console.log(`ℹ️  Part1に修正対象問題なし`);
}