#!/usr/bin/env node

import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// .env.local ファイルを読み込み
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * R2から音声ファイルをダウンロードしてローカルバックアップを作成
 */
class R2BackupDownloader {
  constructor() {
    // 環境変数の確認
    const requiredVars = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`${varName} environment variable is required`);
      }
    }

    // R2 S3クライアント設定
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
      requestHandler: new NodeHttpHandler({
        httpsAgent: {
          maxSockets: 100,
          keepAlive: true
        }
      }),
      maxAttempts: 3
    });

    this.bucket = process.env.R2_BUCKET;
    this.backupDir = path.resolve(process.cwd(), 'audio-backup');
  }

  /**
   * R2バケット内の音声ファイルをリスト
   * @param {string} prefix - プレフィックス（例: "audio/part1/"）
   * @returns {Promise<Array>} オブジェクトのリスト
   */
  async listAudioFiles(prefix = 'audio/') {
    const files = [];
    let continuationToken = null;

    try {
      do {
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
          MaxKeys: 1000
        });

        const response = await this.s3Client.send(command);
        
        if (response.Contents) {
          files.push(...response.Contents);
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      console.log(`📋 Found ${files.length} files in R2 with prefix "${prefix}"`);
      return files;
    } catch (error) {
      console.error('❌ Failed to list R2 objects:', error);
      throw error;
    }
  }

  /**
   * R2から単一ファイルをダウンロード
   * @param {string} key - オブジェクトキー（例: "audio/part1/file.mp3"）
   * @returns {Promise<Buffer>} ファイルデータ
   */
  async downloadFile(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const response = await this.s3Client.send(command);
      const chunks = [];
      
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error(`❌ Failed to download ${key}:`, error);
      throw error;
    }
  }

  /**
   * ファイルをローカルに保存
   * @param {string} key - オブジェクトキー
   * @param {Buffer} data - ファイルデータ
   */
  async saveToLocal(key, data) {
    // "audio/part1/file.mp3" -> "audio-backup/part1/file.mp3"
    const relativePath = key.replace('audio/', '');
    const localPath = path.join(this.backupDir, relativePath);
    const dir = path.dirname(localPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(localPath, data);
    
    return localPath;
  }

  /**
   * 全音声ファイルをバックアップ
   * @param {string} partFilter - 特定のパートのみ（例: "part1"）
   */
  async backupAll(partFilter = null) {
    console.log('🚀 Starting R2 backup download...');
    console.log(`📁 Backup directory: ${this.backupDir}`);
    
    const prefix = partFilter ? `audio/${partFilter}/` : 'audio/';
    const files = await this.listAudioFiles(prefix);
    
    if (files.length === 0) {
      console.log('ℹ️ No files found to backup');
      return;
    }

    const stats = {
      success: 0,
      failed: 0,
      skipped: 0,
      totalSize: 0
    };

    for (const file of files) {
      const { Key: key, Size: size } = file;
      
      // テストファイルはスキップ
      if (key.includes('/test/') || key.endsWith('.txt')) {
        console.log(`⏭️ Skipping non-audio file: ${key}`);
        stats.skipped++;
        continue;
      }

      try {
        // ローカルファイルが既に存在するかチェック
        const relativePath = key.replace('audio/', '');
        const localPath = path.join(this.backupDir, relativePath);
        
        try {
          const localStats = await fs.stat(localPath);
          if (localStats.size === size) {
            console.log(`✓ Already exists: ${relativePath}`);
            stats.skipped++;
            continue;
          }
        } catch (e) {
          // ファイルが存在しない場合は続行
        }

        console.log(`📥 Downloading: ${key} (${(size / 1024).toFixed(1)} KB)`);
        const data = await this.downloadFile(key);
        const savedPath = await this.saveToLocal(key, data);
        
        console.log(`💾 Saved: ${savedPath}`);
        stats.success++;
        stats.totalSize += size;
        
      } catch (error) {
        console.error(`❌ Failed to backup ${key}:`, error.message);
        stats.failed++;
      }
    }

    // 統計情報を表示
    console.log('\n📊 Backup Summary:');
    console.log(`✅ Successfully downloaded: ${stats.success} files`);
    console.log(`⏭️ Skipped (already exists or non-audio): ${stats.skipped} files`);
    console.log(`❌ Failed: ${stats.failed} files`);
    console.log(`💾 Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
  }

  /**
   * バックアップの整合性チェック
   */
  async verifyBackup() {
    console.log('🔍 Verifying backup integrity...');
    
    const r2Files = await this.listAudioFiles('audio/');
    const audioFiles = r2Files.filter(f => 
      f.Key.endsWith('.mp3') && !f.Key.includes('/test/')
    );
    
    let matching = 0;
    let missing = 0;
    let different = 0;

    for (const file of audioFiles) {
      const { Key: key, Size: r2Size } = file;
      const relativePath = key.replace('audio/', '');
      const localPath = path.join(this.backupDir, relativePath);
      
      try {
        const localStats = await fs.stat(localPath);
        if (localStats.size === r2Size) {
          matching++;
        } else {
          different++;
          console.log(`⚠️ Size mismatch: ${relativePath} (R2: ${r2Size}, Local: ${localStats.size})`);
        }
      } catch (e) {
        missing++;
        console.log(`❌ Missing: ${relativePath}`);
      }
    }

    console.log('\n📊 Verification Results:');
    console.log(`✅ Matching files: ${matching}`);
    console.log(`❌ Missing files: ${missing}`);
    console.log(`⚠️ Size mismatches: ${different}`);
    console.log(`📁 Total R2 audio files: ${audioFiles.length}`);
    
    return { matching, missing, different, total: audioFiles.length };
  }
}

// CLIエントリーポイント
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'backup';
  const partFilter = args[1]; // オプション: part1, part2, part3, part4

  try {
    const downloader = new R2BackupDownloader();

    switch (command) {
      case 'backup':
        await downloader.backupAll(partFilter);
        break;
      
      case 'verify':
        await downloader.verifyBackup();
        break;
      
      case 'list':
        const prefix = partFilter ? `audio/${partFilter}/` : 'audio/';
        const files = await downloader.listAudioFiles(prefix);
        console.log('\n📄 Files in R2:');
        files.forEach(f => {
          console.log(`  ${f.Key} (${(f.Size / 1024).toFixed(1)} KB)`);
        });
        break;
      
      default:
        console.log('Usage:');
        console.log('  node scripts/download-r2-backup.js backup [part]  # Download all or specific part');
        console.log('  node scripts/download-r2-backup.js verify         # Verify backup integrity');
        console.log('  node scripts/download-r2-backup.js list [part]    # List R2 files');
        console.log('\nExamples:');
        console.log('  node scripts/download-r2-backup.js backup         # Backup all audio files');
        console.log('  node scripts/download-r2-backup.js backup part1   # Backup only Part 1 audio');
        console.log('  node scripts/download-r2-backup.js verify         # Check backup completeness');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { R2BackupDownloader };