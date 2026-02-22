#!/usr/bin/env node

/**
 * Part 1画像なし問題削除スクリプト
 * - 画像パスがない問題をJSONから削除
 * - 関連する音声ファイルを削除
 * - バックアップ作成機能付き
 */

const fs = require('fs');
const path = require('path');

const PART1_JSON_PATH = './src/data/part1-questions.json';
const AUDIO_DIR = './public/audio/part1/';
const BACKUP_DIR = './backup-part1-cleanup/';

// バックアップディレクトリ作成
function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 バックアップディレクトリ作成: ${BACKUP_DIR}`);
  }
}

// JSONファイルのバックアップ
function backupJsonFile() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `part1-questions-backup-${timestamp}.json`);
  
  fs.copyFileSync(PART1_JSON_PATH, backupPath);
  console.log(`💾 JSONバックアップ作成: ${backupPath}`);
  return backupPath;
}

// 画像なし問題の特定
function findProblemsWithoutImages(questions) {
  return questions.filter(q => {
    return !q.imagePath || 
           q.imagePath === null || 
           q.imagePath === '' || 
           q.imagePath === undefined;
  });
}

// 関連音声ファイルの削除
function deleteAudioFiles(questionIds) {
  let deletedCount = 0;
  const deletedFiles = [];
  
  for (const questionId of questionIds) {
    const audioFiles = [
      `${questionId}_option_a.mp3`,
      `${questionId}_option_b.mp3`, 
      `${questionId}_option_c.mp3`,
      `${questionId}_option_d.mp3`
    ];
    
    for (const audioFile of audioFiles) {
      const audioPath = path.join(AUDIO_DIR, audioFile);
      if (fs.existsSync(audioPath)) {
        try {
          fs.unlinkSync(audioPath);
          deletedFiles.push(audioFile);
          deletedCount++;
          console.log(`🗑️ 音声ファイル削除: ${audioFile}`);
        } catch (error) {
          console.error(`❌ 音声ファイル削除失敗: ${audioFile}`, error.message);
        }
      }
    }
  }
  
  return { deletedCount, deletedFiles };
}

// メイン処理
function main() {
  console.log('🚀 Part 1画像なし問題削除スクリプト開始');
  
  try {
    // バックアップ作成
    createBackupDir();
    const backupPath = backupJsonFile();
    
    // JSONデータ読み込み
    console.log('📖 Part 1問題データ読み込み中...');
    const questions = JSON.parse(fs.readFileSync(PART1_JSON_PATH, 'utf8'));
    console.log(`📊 総問題数: ${questions.length}問`);
    
    // 画像なし問題の特定
    const problemsWithoutImages = findProblemsWithoutImages(questions);
    const problemsWithImages = questions.filter(q => q.imagePath && q.imagePath !== null && q.imagePath !== '');
    
    console.log(`🖼️ 画像あり問題: ${problemsWithImages.length}問`);
    console.log(`❌ 画像なし問題: ${problemsWithoutImages.length}問（削除対象）`);
    
    if (problemsWithoutImages.length === 0) {
      console.log('✅ 削除対象の問題がありません。');
      return;
    }
    
    // 削除対象問題IDリスト
    const deleteQuestionIds = problemsWithoutImages.map(q => q.id);
    console.log(`🎯 削除対象ID: ${deleteQuestionIds.slice(0, 5).join(', ')}... (${deleteQuestionIds.length}問)`);
    
    // 確認プロンプト（実際の環境では手動確認が必要）
    console.log('⚠️ 削除処理を開始します...');
    
    // 音声ファイル削除
    console.log('🔊 関連音声ファイル削除中...');
    const audioResult = deleteAudioFiles(deleteQuestionIds);
    console.log(`✅ 音声ファイル削除完了: ${audioResult.deletedCount}ファイル`);
    
    // JSONデータ更新
    console.log('📝 JSONデータ更新中...');
    const updatedQuestions = problemsWithImages;
    fs.writeFileSync(PART1_JSON_PATH, JSON.stringify(updatedQuestions, null, 2));
    console.log(`✅ JSONデータ更新完了: ${updatedQuestions.length}問が残存`);
    
    // 削除ログ作成
    const logData = {
      timestamp: new Date().toISOString(),
      deletedProblems: deleteQuestionIds,
      deletedAudioFiles: audioResult.deletedFiles,
      remainingProblems: updatedQuestions.length,
      backupPath: backupPath
    };
    
    const logPath = path.join(BACKUP_DIR, `deletion-log-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
    console.log(`📋 削除ログ作成: ${logPath}`);
    
    // 結果サマリー
    console.log('\n🎉 削除処理完了！');
    console.log(`📊 結果サマリー:`);
    console.log(`   - 削除問題数: ${deleteQuestionIds.length}問`);
    console.log(`   - 削除音声ファイル: ${audioResult.deletedCount}ファイル`);
    console.log(`   - 残存問題数: ${updatedQuestions.length}問`);
    console.log(`   - バックアップ場所: ${backupPath}`);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error('詳細:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = { main, findProblemsWithoutImages, deleteAudioFiles };