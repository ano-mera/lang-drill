import { put, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadBatch(files, basePath, part) {
  const promises = files.map(async (file) => {
    const filePath = path.join(basePath, file);
    if (!fs.statSync(filePath).isFile()) return null;
    
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer]);
      
      const { url } = await put(`audio/${part}/${file}`, blob, {
        access: 'public',
      });
      
      return { file, url, status: 'success' };
    } catch (error) {
      if (error.message.includes('already exists')) {
        return { file, status: 'skipped', reason: 'already exists' };
      }
      return { file, error: error.message, status: 'error' };
    }
  });
  
  return Promise.all(promises);
}

async function uploadMissingAudio() {
  console.log('🔍 Finding and uploading missing audio files...\n');
  
  const publicDir = path.join(__dirname, '..', 'public');
  const audioParts = ['part1', 'part2', 'part3', 'part4'];
  const BATCH_SIZE = 10;
  
  // Get all existing blobs
  let allBlobs = [];
  let cursor;
  
  do {
    const response = await list({
      prefix: 'audio/',
      limit: 1000,
      cursor
    });
    allBlobs = allBlobs.concat(response.blobs);
    cursor = response.cursor;
  } while (cursor);
  
  const uploadedFiles = new Set(allBlobs.map(blob => blob.pathname));
  console.log(`📦 Files already in Blob storage: ${uploadedFiles.size}\n`);
  
  const stats = {
    total: 0,
    success: 0,
    skipped: 0,
    error: 0
  };
  
  for (const part of audioParts) {
    const audioDir = path.join(publicDir, 'audio', part);
    
    if (!fs.existsSync(audioDir)) {
      console.log(`⚠️  Skipping ${part}: directory not found`);
      continue;
    }
    
    const localFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));
    const missingFiles = localFiles.filter(file => {
      const blobPath = `audio/${part}/${file}`;
      return !uploadedFiles.has(blobPath);
    });
    
    if (missingFiles.length === 0) {
      console.log(`✅ ${part}: All files already uploaded`);
      continue;
    }
    
    console.log(`📁 Processing ${part}: ${missingFiles.length} missing files`);
    
    for (let i = 0; i < missingFiles.length; i += BATCH_SIZE) {
      const batch = missingFiles.slice(i, Math.min(i + BATCH_SIZE, missingFiles.length));
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(missingFiles.length / BATCH_SIZE);
      
      process.stdout.write(`  Batch ${batchNum}/${totalBatches}: `);
      
      const results = await uploadBatch(batch, audioDir, part);
      
      const successCount = results.filter(r => r?.status === 'success').length;
      const skippedCount = results.filter(r => r?.status === 'skipped').length;
      const errorCount = results.filter(r => r?.status === 'error').length;
      
      stats.total += batch.length;
      stats.success += successCount;
      stats.skipped += skippedCount;
      stats.error += errorCount;
      
      console.log(`✓ ${successCount} success, ${skippedCount} skipped, ${errorCount} errors`);
      
      if (errorCount > 0) {
        results.filter(r => r?.status === 'error').forEach(r => {
          console.log(`    ✗ ${r.file}: ${r.error}`);
        });
      }
    }
  }
  
  console.log('\n📊 Upload Summary:');
  console.log(`  Total processed: ${stats.total}`);
  console.log(`  ✅ Success: ${stats.success}`);
  console.log(`  ⏭️  Skipped: ${stats.skipped}`);
  console.log(`  ❌ Errors: ${stats.error}`);
  
  // Final verification
  console.log('\n📋 Final verification...');
  const { blobs } = await list({
    prefix: 'audio/',
    limit: 1
  });
  
  let totalCount = 0;
  cursor = undefined;
  do {
    const response = await list({
      prefix: 'audio/',
      limit: 1000,
      cursor
    });
    totalCount += response.blobs.length;
    cursor = response.cursor;
  } while (cursor);
  
  console.log(`  Total files in blob storage: ${totalCount}`);
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Error: BLOB_READ_WRITE_TOKEN environment variable is not set');
  process.exit(1);
}

uploadMissingAudio().catch(console.error);