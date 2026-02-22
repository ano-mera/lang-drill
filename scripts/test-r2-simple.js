import { S3Client, PutObjectCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE } = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error('Missing R2 environment variables. Please check .env.local');
  process.exit(1);
}

console.log('🔧 Testing R2 connection with minimal config...\n');

// 最小限の設定のみ
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { 
    accessKeyId: R2_ACCESS_KEY_ID, 
    secretAccessKey: R2_SECRET_ACCESS_KEY 
  }
  // forcePathStyle: true を削除
});

async function testConnection() {
  try {
    // まずバケット一覧を取得してみる
    console.log('📋 Testing connection with ListBuckets...');
    const buckets = await s3.send(new ListBucketsCommand({}));
    console.log('✅ Connection successful!');
    console.log('   Buckets:', buckets.Buckets?.map(b => b.Name).join(', ') || 'none');
    console.log();
  } catch (error) {
    console.error('❌ ListBuckets failed:', error.message);
    console.log();
  }
  
  // 単一ファイルアップロードテスト
  const testFilePath = path.join(__dirname, '..', 'public', 'audio', 'part1', 'part1_163_option_a.mp3');
  
  if (!fs.existsSync(testFilePath)) {
    // テスト用の小さいファイルを作成
    console.log('📝 Creating test file...');
    const testContent = 'This is a test file for R2 upload';
    const testTxtPath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testTxtPath, testContent);
    
    try {
      console.log('📤 Uploading test text file...');
      const fileBuffer = fs.readFileSync(testTxtPath);
      const key = 'test/test-file.txt';
      
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: "text/plain"
      });
      
      const result = await s3.send(command);
      console.log('✅ Text file upload successful!');
      console.log('   ETag:', result.ETag);
      console.log(`   URL: ${R2_PUBLIC_BASE}/${key}`);
      
      // クリーンアップ
      fs.unlinkSync(testTxtPath);
    } catch (error) {
      console.error('❌ Text file upload failed:', error.message);
      if (error.Code) console.error('   Error Code:', error.Code);
      if (error.$metadata) console.error('   Metadata:', error.$metadata);
    }
    
    return;
  }
  
  const fileStats = fs.statSync(testFilePath);
  console.log(`📄 Test MP3 file: ${path.basename(testFilePath)}`);
  console.log(`   Size: ${fileStats.size} bytes\n`);
  
  try {
    console.log('📤 Uploading MP3 file...');
    const fileBuffer = fs.readFileSync(testFilePath);
    const key = 'audio/test/test-audio.mp3';
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: "audio/mpeg"
    });
    
    const result = await s3.send(command);
    
    console.log('✅ MP3 upload successful!');
    console.log('   ETag:', result.ETag);
    console.log(`   URL: ${R2_PUBLIC_BASE}/${key}\n`);
    
    // 公開アクセスのテスト
    console.log('🔍 Testing public access...');
    const testUrl = `${R2_PUBLIC_BASE}/${key}`;
    const response = await fetch(testUrl, { method: 'HEAD' });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('   ✅ File is publicly accessible!');
    } else if (response.status === 404) {
      console.log('   ⚠️ File not found. R2 bucket might not be configured for public access.');
      console.log('   Please check: https://dash.cloudflare.com/ → R2 → Your bucket → Settings');
    } else {
      console.log('   ❌ Unexpected status. Check R2 bucket settings.');
    }
    
  } catch (error) {
    console.error('❌ MP3 upload failed:', error.message);
    if (error.Code) console.error('   Error Code:', error.Code);
    if (error.$metadata) {
      console.error('   Metadata:', JSON.stringify(error.$metadata, null, 2));
    }
    
    // より詳細なエラー情報
    if (error.name === 'Error' && error.message.includes('SSL')) {
      console.log('\n💡 SSL Error detected. Possible solutions:');
      console.log('   1. Check if credentials are correct');
      console.log('   2. Verify account ID format (should not include dashes)');
      console.log('   3. Ensure R2 API is enabled for your account');
    }
  }
}

testConnection().catch(console.error);