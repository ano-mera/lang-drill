#!/usr/bin/env node

/**
 * Part0音声ファイルをR2にアップロードするスクリプト
 */

import { R2AudioUploader } from '../generator/lib/r2-audio-uploader.js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function uploadPart0AudioToR2() {
  console.log('🎵 Uploading Part0 audio files to R2...\n');

  try {
    // R2 Uploaderを初期化
    const r2Uploader = new R2AudioUploader();
    
    // 接続テスト
    const connectionTest = await r2Uploader.testConnection();
    if (!connectionTest) {
      throw new Error('R2 connection test failed');
    }
    console.log('✅ R2 connection successful\n');

    // Part0音声ファイルのディレクトリ
    const audioDir = path.resolve(process.cwd(), 'public/audio/part0');
    
    // 音声ファイル一覧を取得
    const audioFiles = await fs.readdir(audioDir);
    const mp3Files = audioFiles.filter(file => file.endsWith('.mp3'));
    
    console.log(`Found ${mp3Files.length} audio files to upload\n`);
    
    let successCount = 0;
    let failCount = 0;

    // 各音声ファイルをアップロード
    for (const fileName of mp3Files) {
      try {
        console.log(`Uploading: ${fileName}`);
        
        const filePath = path.join(audioDir, fileName);
        const audioBuffer = await fs.readFile(filePath);
        
        // R2にアップロード
        const result = await r2Uploader.uploadAudio(
          audioBuffer,
          fileName,
          'part0',
          false // ローカルバックアップは不要（既にローカルにある）
        );
        
        console.log(`✅ Uploaded: ${fileName} -> ${result.publicUrl}`);
        successCount++;
        
        // レート制限を避けるために少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to upload ${fileName}:`, error.message);
        failCount++;
      }
    }
    
    console.log(`\n=== Upload Summary ===`);
    console.log(`✅ Success: ${successCount} files`);
    console.log(`❌ Failed: ${failCount} files`);
    
    if (successCount > 0) {
      console.log(`\n🎉 Part0 audio files are now available at:`);
      console.log(`   https://pub-bc215fa64b534ea3a8cbe191e688d356.r2.dev/audio/part0/`);
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

uploadPart0AudioToR2().catch(console.error);