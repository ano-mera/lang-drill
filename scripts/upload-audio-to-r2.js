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

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { 
    accessKeyId: R2_ACCESS_KEY_ID, 
    secretAccessKey: R2_SECRET_ACCESS_KEY 
  },
  forcePathStyle: true,
});

async function uploadFile(filePath, key) {
  try {
    const fileStream = fs.createReadStream(filePath);
    
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: "audio/mpeg",
      CacheControl: "public, max-age=31536000, immutable",
    }));
    
    return { success: true, url: `${R2_PUBLIC_BASE}/${key}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function uploadAllAudioFiles() {
  const publicDir = path.join(__dirname, '..', 'public');
  const audioParts = ['part1', 'part2', 'part3', 'part4', 'labels'];
  
  console.log('📤 Starting audio upload to Cloudflare R2...\n');
  console.log(`   Bucket: ${R2_BUCKET}`);
  console.log(`   Public URL: ${R2_PUBLIC_BASE}\n`);
  
  const stats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0
  };
  
  for (const part of audioParts) {
    const audioDir = path.join(publicDir, 'audio', part);
    
    if (!fs.existsSync(audioDir)) {
      console.log(`⚠️  Skipping ${part}: directory not found`);
      continue;
    }
    
    const files = fs.readdirSync(audioDir).filter(f => 
      f.endsWith('.mp3') || f.endsWith('.wav')
    );
    
    console.log(`📁 Processing ${part}: ${files.length} files`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(audioDir, file);
      
      // R2のキーは audio/part1/filename.mp3 の形式
      const key = `audio/${part}/${file}`;
      
      stats.total++;
      
      // Progress indicator
      if ((i + 1) % 10 === 0 || i === files.length - 1) {
        process.stdout.write(`\r  Uploading: ${i + 1}/${files.length} files`);
      }
      
      const result = await uploadFile(filePath, key);
      
      if (result.success) {
        stats.success++;
      } else {
        stats.failed++;
        console.error(`\n  ❌ Failed: ${file} - ${result.error}`);
      }
    }
    
    console.log(`\n  ✅ ${part} complete: ${stats.success} uploaded\n`);
  }
  
  console.log('📊 Upload Summary:');
  console.log(`  Total files: ${stats.total}`);
  console.log(`  ✅ Success: ${stats.success}`);
  console.log(`  ❌ Failed: ${stats.failed}`);
  console.log(`  ⏭️  Skipped: ${stats.skipped}`);
  
  if (stats.success > 0) {
    console.log('\n🎉 Upload completed!');
    console.log(`📍 Audio files are now available at: ${R2_PUBLIC_BASE}/audio/`);
  }
}

uploadAllAudioFiles().catch(console.error);