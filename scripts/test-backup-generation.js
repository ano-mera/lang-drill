#!/usr/bin/env node

import { ElevenLabsAudio } from '../generator/lib/elevenlabs-audio.js';
import fs from 'fs/promises';
import path from 'path';

async function testBackupGeneration() {
  console.log('🧪 Testing audio generation with automatic backup...\n');
  
  try {
    // ElevenLabsAudioを初期化（R2アップロードが有効）
    const audioGenerator = new ElevenLabsAudio({ useR2Upload: true });
    
    // テスト用のテキスト
    const testText = "This is a test audio for backup functionality.";
    const testId = `test_backup_${Date.now()}`;
    const fileName = `${testId}.mp3`;
    const outputPath = `/home/ki/projects/eng/public/audio/part1/${fileName}`;
    
    console.log('📝 Test Configuration:');
    console.log(`  Text: "${testText}"`);
    console.log(`  File: ${fileName}`);
    console.log(`  Part: part1\n`);
    
    // 音声生成（R2アップロード + 自動バックアップ）
    console.log('🎵 Generating audio...');
    const result = await audioGenerator.generateAudio(testText, outputPath, {
      partType: 'part1',
      isPart1: true
    });
    
    console.log('\n✅ Audio generation result:');
    console.log(`  Method: ${result.method}`);
    console.log(`  Audio Path: ${result.audioPath}`);
    if (result.publicUrl) {
      console.log(`  Public URL: ${result.publicUrl}`);
    }
    
    // バックアップファイルの確認
    const backupPath = path.join(process.cwd(), 'audio-backup', 'part1', fileName);
    console.log('\n🔍 Checking backup file:');
    console.log(`  Expected path: ${backupPath}`);
    
    try {
      const stats = await fs.stat(backupPath);
      console.log(`  ✅ Backup exists: ${(stats.size / 1024).toFixed(1)} KB`);
      
      // バックアップファイルの内容確認
      const backupData = await fs.readFile(backupPath);
      console.log(`  ✅ Backup is readable: ${backupData.length} bytes`);
      
    } catch (error) {
      console.log(`  ❌ Backup not found: ${error.message}`);
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

// 実行
testBackupGeneration();