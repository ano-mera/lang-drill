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
      return { file, error: error.message, status: 'error' };
    }
  });
  
  return Promise.all(promises);
}

async function uploadAudioFiles() {
  const publicDir = path.join(__dirname, '..', 'public');
  const audioParts = ['part1', 'part2', 'part3', 'part4'];
  const BATCH_SIZE = 10;
  
  console.log('Starting batch upload to Vercel Blob...');
  
  const stats = {
    total: 0,
    success: 0,
    error: 0
  };
  
  for (const part of audioParts) {
    const audioDir = path.join(publicDir, 'audio', part);
    
    if (!fs.existsSync(audioDir)) {
      console.log(`Skipping ${part}: directory not found`);
      continue;
    }
    
    const files = fs.readdirSync(audioDir);
    console.log(`\n📁 Processing ${part}: ${files.length} files`);
    
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, Math.min(i + BATCH_SIZE, files.length));
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(files.length / BATCH_SIZE);
      
      process.stdout.write(`  Batch ${batchNum}/${totalBatches}: `);
      
      const results = await uploadBatch(batch, audioDir, part);
      
      const successCount = results.filter(r => r?.status === 'success').length;
      const errorCount = results.filter(r => r?.status === 'error').length;
      
      stats.total += batch.length;
      stats.success += successCount;
      stats.error += errorCount;
      
      console.log(`✓ ${successCount} success, ${errorCount} errors`);
      
      if (errorCount > 0) {
        results.filter(r => r?.status === 'error').forEach(r => {
          console.log(`    ✗ ${r.file}: ${r.error}`);
        });
      }
    }
  }
  
  console.log('\n📊 Upload Summary:');
  console.log(`  Total files: ${stats.total}`);
  console.log(`  ✓ Success: ${stats.success}`);
  console.log(`  ✗ Errors: ${stats.error}`);
  
  console.log('\n📋 Verifying uploaded files...');
  const { blobs } = await list({
    prefix: 'audio/',
    limit: 1000
  });
  
  console.log(`  Files in blob storage: ${blobs.length}`);
  
  const partCounts = {};
  blobs.forEach(blob => {
    const match = blob.pathname.match(/audio\/(part\d+)\//);
    if (match) {
      partCounts[match[1]] = (partCounts[match[1]] || 0) + 1;
    }
  });
  
  Object.entries(partCounts).forEach(([part, count]) => {
    console.log(`  ${part}: ${count} files`);
  });
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Error: BLOB_READ_WRITE_TOKEN environment variable is not set');
  console.error('Please add it to your .env.local file');
  process.exit(1);
}

uploadAudioFiles().catch(console.error);