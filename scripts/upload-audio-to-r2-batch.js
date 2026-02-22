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

async function uploadFile(filePath, key, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: "audio/mpeg",
        CacheControl: "public, max-age=31536000, immutable",
      }));
      
      return { success: true, url: `${R2_PUBLIC_BASE}/${key}` };
    } catch (error) {
      if (attempt === retries) {
        return { success: false, error: error.message };
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function uploadBatch(files, basePath, part, batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, Math.min(i + batchSize, files.length));
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(files.length / batchSize);
    
    process.stdout.write(`\r  Batch ${batchNum}/${totalBatches}: Processing ${batch.length} files...`);
    
    const batchPromises = batch.map(async (file) => {
      const filePath = path.join(basePath, file);
      const key = `audio/${part}/${file}`;
      return uploadFile(filePath, key);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    const successCount = batchResults.filter(r => r.success).length;
    process.stdout.write(`\r  Batch ${batchNum}/${totalBatches}: ✓ ${successCount}/${batch.length} success`);
  }
  
  console.log(); // New line after batches complete
  return results;
}

async function uploadAllAudioFiles() {
  const publicDir = path.join(__dirname, '..', 'public');
  const audioParts = ['part1', 'part2', 'part3', 'part4', 'labels'];
  
  console.log('📤 Starting batch upload to Cloudflare R2...\n');
  console.log(`   Bucket: ${R2_BUCKET}`);
  console.log(`   Public URL: ${R2_PUBLIC_BASE}\n`);
  
  const stats = {
    total: 0,
    success: 0,
    failed: 0
  };
  
  const failedFiles = [];
  
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
    
    const results = await uploadBatch(files, audioDir, part);
    
    const partStats = {
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
    
    stats.total += files.length;
    stats.success += partStats.success;
    stats.failed += partStats.failed;
    
    // Collect failed files
    results.forEach((result, index) => {
      if (!result.success) {
        failedFiles.push({
          part,
          file: files[index],
          error: result.error
        });
      }
    });
    
    console.log(`  ✅ ${part} complete: ${partStats.success}/${files.length} uploaded\n`);
    
    // Add delay between parts to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('📊 Upload Summary:');
  console.log(`  Total files: ${stats.total}`);
  console.log(`  ✅ Success: ${stats.success}`);
  console.log(`  ❌ Failed: ${stats.failed}`);
  
  if (failedFiles.length > 0) {
    console.log('\n❌ Failed files (first 10):');
    failedFiles.slice(0, 10).forEach(f => {
      console.log(`  ${f.part}/${f.file}: ${f.error.substring(0, 50)}...`);
    });
  }
  
  if (stats.success > 0) {
    console.log('\n🎉 Upload completed!');
    console.log(`📍 Audio files are now available at: ${R2_PUBLIC_BASE}/audio/`);
    
    // Test a sample file
    console.log('\n🔧 Testing sample file access...');
    const testUrl = `${R2_PUBLIC_BASE}/audio/part1/part1_163_option_a.mp3`;
    try {
      const response = await fetch(testUrl, { method: 'HEAD' });
      console.log(`  URL: ${testUrl}`);
      console.log(`  Status: ${response.status} ${response.statusText}`);
      if (response.status === 200) {
        console.log('  ✅ Files are publicly accessible!');
      } else {
        console.log('  ⚠️ Files may not be publicly accessible. Check R2 bucket settings.');
      }
    } catch (error) {
      console.log(`  ❌ Could not test file access: ${error.message}`);
    }
  }
}

uploadAllAudioFiles().catch(console.error);