import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";
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

console.log('🔧 Testing R2 with custom TLS settings...\n');

// カスタムHTTPハンドラーでTLS設定を調整
const httpHandler = new NodeHttpHandler({
  httpsAgent: new https.Agent({
    maxSockets: 50,
    keepAlive: true,
    secureProtocol: 'TLSv1_2_method', // TLS 1.2を明示的に指定
  }),
  requestTimeout: 30000,
  connectionTimeout: 30000,
});

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { 
    accessKeyId: R2_ACCESS_KEY_ID, 
    secretAccessKey: R2_SECRET_ACCESS_KEY 
  },
  requestHandler: httpHandler
});

async function testUpload() {
  // 小さいテキストファイルから試す
  console.log('📝 Creating small test file...');
  const testContent = 'Hello R2!';
  const testTxtPath = path.join(__dirname, 'test-r2.txt');
  fs.writeFileSync(testTxtPath, testContent);
  
  try {
    console.log('📤 Uploading small text file...');
    const key = 'test/hello.txt';
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: testContent,  // 直接文字列を渡す
      ContentType: "text/plain"
    });
    
    console.log('   Bucket:', R2_BUCKET);
    console.log('   Key:', key);
    console.log('   Endpoint:', `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
    
    const result = await s3.send(command);
    console.log('✅ Upload successful!');
    console.log('   ETag:', result.ETag);
    console.log(`   Public URL: ${R2_PUBLIC_BASE}/${key}`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    
    if (error.message.includes('SSL')) {
      console.log('\n💡 SSL問題の可能性:');
      console.log('   1. アカウントIDの確認（ダッシュなし）');
      console.log('   2. API トークンの権限確認');
      console.log('   3. R2 API が有効か確認');
      
      // アカウントIDの形式チェック
      if (R2_ACCOUNT_ID.includes('-')) {
        console.log('\n⚠️  警告: アカウントIDにダッシュが含まれています');
        console.log('   これが原因の可能性があります');
      }
    }
    
    if (error.$fault) console.error('   Fault:', error.$fault);
    if (error.$metadata) console.error('   Metadata:', JSON.stringify(error.$metadata, null, 2));
  } finally {
    // クリーンアップ
    if (fs.existsSync(testTxtPath)) {
      fs.unlinkSync(testTxtPath);
    }
  }
}

testUpload().catch(console.error);