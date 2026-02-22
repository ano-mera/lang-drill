import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

console.log('🔧 Testing R2 connection...\n');
console.log(`Account ID: ${R2_ACCOUNT_ID}`);
console.log(`Bucket: ${R2_BUCKET}`);
console.log(`Public URL: ${R2_PUBLIC_BASE}\n`);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { 
    accessKeyId: R2_ACCESS_KEY_ID, 
    secretAccessKey: R2_SECRET_ACCESS_KEY 
  },
  forcePathStyle: true,
});

async function testUpload() {
  // Test with a single file
  const testFilePath = path.join(__dirname, '..', 'public', 'audio', 'part1', 'part1_163_option_a.mp3');
  
  if (!fs.existsSync(testFilePath)) {
    console.error('Test file not found:', testFilePath);
    return;
  }
  
  const fileStats = fs.statSync(testFilePath);
  console.log(`📄 Test file: ${testFilePath}`);
  console.log(`   Size: ${fileStats.size} bytes\n`);
  
  try {
    console.log('📤 Uploading test file...');
    const fileBuffer = fs.readFileSync(testFilePath);
    const key = 'audio/test/test_file.mp3';
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: "audio/mpeg",
      CacheControl: "public, max-age=31536000, immutable",
    });
    
    const result = await s3.send(command);
    
    console.log('✅ Upload successful!');
    console.log('   Response:', result);
    console.log(`   URL: ${R2_PUBLIC_BASE}/${key}\n`);
    
    // Test public access
    console.log('🔍 Testing public access...');
    const testUrl = `${R2_PUBLIC_BASE}/${key}`;
    const response = await fetch(testUrl, { method: 'HEAD' });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Content-Length: ${response.headers.get('content-length')}`);
    
    if (response.status === 200) {
      console.log('   ✅ File is publicly accessible!');
    } else {
      console.log('   ❌ File is not publicly accessible. Check R2 bucket settings.');
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    console.error('Error details:', error.message);
    if (error.$metadata) {
      console.error('Metadata:', error.$metadata);
    }
  }
}

testUpload().catch(console.error);