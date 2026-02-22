#!/usr/bin/env node

/**
 * Part0 Batch 2（p0-041からp0-060）の音声ファイルをR2にアップロードするスクリプト
 */

import { R2AudioUploader } from '../generator/lib/r2-audio-uploader.js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function uploadBatch2ToR2() {
  console.log('🎵 Uploading Part0 Batch 2 audio files (p0-041 to p0-060) to R2...\n');

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
    
    // Batch 2のファイル名リスト（p0-041からp0-060）
    const batch2Files = [];
    for (let i = 41; i <= 60; i++) {
      const id = `p0-${i.toString().padStart(3, '0')}`;
      batch2Files.push(`${id}-m.mp3`);
      batch2Files.push(`${id}-f.mp3`);
    }
    
    console.log(`Found ${batch2Files.length} batch 2 audio files to upload\n`);
    
    let successCount = 0;
    let failCount = 0;

    // 各音声ファイルをアップロード
    for (const fileName of batch2Files) {
      try {
        console.log(`Uploading: ${fileName}`);
        
        const filePath = path.join(audioDir, fileName);
        
        // ファイルが存在するか確認
        try {
          await fs.access(filePath);
        } catch (error) {
          console.log(`⚠️ File not found: ${fileName} - skipping`);
          continue;
        }
        
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
      console.log(`\n🎉 Part0 Batch 2 audio files are now available at:`);
      console.log(`   https://pub-bc215fa64b534ea3a8cbe191e688d356.r2.dev/audio/part0/`);
      console.log(`\n📊 Part0 Summary:`);
      console.log(`   - Total problems: 60 (p0-001 to p0-060)`);
      console.log(`   - Total audio files: 120 (60 male + 60 female)`);
      console.log(`   - All files available on R2 CDN`);
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

uploadBatch2ToR2().catch(console.error);