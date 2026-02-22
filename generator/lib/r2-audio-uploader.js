import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import dotenv from 'dotenv';

// .env.local ファイルを読み込み
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Cloudflare R2 Audio Uploader
 * 音声ファイルを直接R2にアップロードし、CDN URLを返す
 */
export class R2AudioUploader {
  constructor() {
    // 環境変数の確認
    const requiredVars = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_BASE'];
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
    this.publicBase = process.env.R2_PUBLIC_BASE;
  }

  /**
   * 音声ファイルをR2にアップロード（ローカルバックアップ付き）
   * @param {Buffer} audioBuffer - 音声データ
   * @param {string} fileName - ファイル名（例: "part1_123_option_a.mp3"）
   * @param {string} partType - パートタイプ（例: "part1", "part2"）
   * @param {boolean} saveBackup - ローカルバックアップを保存するか（デフォルト: true）
   * @returns {Promise<{audioPath: string, publicUrl: string, backupPath?: string}>}
   */
  async uploadAudio(audioBuffer, fileName, partType, saveBackup = true) {
    const key = `audio/${partType}/${fileName}`;
    
    try {
      console.log(`📤 Uploading ${fileName} to R2...`);
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: audioBuffer,
        ContentType: 'audio/mpeg',
        CacheControl: 'public, max-age=31536000', // 1年キャッシュ
      });

      await this.s3Client.send(command);
      
      const audioPath = `/audio/${partType}/${fileName}`;
      const publicUrl = `${this.publicBase}/${key}`;
      
      console.log(`✅ Uploaded: ${fileName} -> ${publicUrl}`);
      
      // ローカルバックアップを保存
      let backupPath = null;
      if (saveBackup) {
        try {
          const backupDir = path.resolve(process.cwd(), 'audio-backup', partType);
          await fs.mkdir(backupDir, { recursive: true });
          backupPath = path.join(backupDir, fileName);
          await fs.writeFile(backupPath, audioBuffer);
          console.log(`💾 Backup saved: ${backupPath}`);
        } catch (backupError) {
          console.warn(`⚠️ Failed to save backup for ${fileName}:`, backupError.message);
        }
      }
      
      return {
        audioPath,
        publicUrl,
        ...(backupPath && { backupPath })
      };
    } catch (error) {
      console.error(`❌ Failed to upload ${fileName}:`, error);
      throw new Error(`R2 upload failed: ${error.message}`);
    }
  }

  /**
   * 複数の音声ファイルを一括アップロード
   * @param {Array} audioFiles - {buffer: Buffer, fileName: string}の配列
   * @param {string} partType - パートタイプ
   * @returns {Promise<Array>} アップロード結果の配列
   */
  async uploadMultipleAudio(audioFiles, partType) {
    const results = [];
    
    for (const audioFile of audioFiles) {
      try {
        const result = await this.uploadAudio(audioFile.buffer, audioFile.fileName, partType);
        results.push({
          ...result,
          originalFileName: audioFile.fileName,
          success: true
        });
      } catch (error) {
        console.error(`❌ Failed to upload ${audioFile.fileName}:`, error);
        results.push({
          originalFileName: audioFile.fileName,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * ローカルファイルからR2にアップロード
   * @param {string} localFilePath - ローカルファイルパス
   * @param {string} fileName - R2でのファイル名
   * @param {string} partType - パートタイプ
   * @returns {Promise<{audioPath: string, publicUrl: string}>}
   */
  async uploadFromFile(localFilePath, fileName, partType) {
    try {
      const audioBuffer = await fs.readFile(localFilePath);
      return await this.uploadAudio(audioBuffer, fileName, partType);
    } catch (error) {
      console.error(`❌ Failed to read file ${localFilePath}:`, error);
      throw new Error(`File read failed: ${error.message}`);
    }
  }

  /**
   * R2接続テスト
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      console.log('🔌 Testing R2 connection...');
      
      // 小さなテストファイルをアップロード
      const testData = Buffer.from('test', 'utf8');
      const testKey = `test/connection-test-${Date.now()}.txt`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: testKey,
        Body: testData,
        ContentType: 'text/plain',
      });

      await this.s3Client.send(command);
      console.log('✅ R2 connection successful');
      return true;
    } catch (error) {
      console.error('❌ R2 connection failed:', error);
      return false;
    }
  }
}

export default R2AudioUploader;