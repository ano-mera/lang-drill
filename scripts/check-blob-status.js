import { list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkBlobStatus() {
  console.log('🔍 Checking Vercel Blob storage status...\n');
  
  const publicDir = path.join(__dirname, '..', 'public');
  const audioParts = ['part1', 'part2', 'part3', 'part4'];
  
  // Get all blobs
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
  
  console.log(`📦 Total files in Blob storage: ${allBlobs.length}\n`);
  
  // Create a Set of uploaded files for quick lookup
  const uploadedFiles = new Set(allBlobs.map(blob => blob.pathname));
  
  // Check each part
  const stats = {
    total: 0,
    uploaded: 0,
    missing: 0
  };
  
  for (const part of audioParts) {
    const audioDir = path.join(publicDir, 'audio', part);
    
    if (!fs.existsSync(audioDir)) {
      console.log(`⚠️  ${part}: directory not found`);
      continue;
    }
    
    const localFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));
    const partStats = {
      local: localFiles.length,
      uploaded: 0,
      missing: []
    };
    
    for (const file of localFiles) {
      const blobPath = `audio/${part}/${file}`;
      if (uploadedFiles.has(blobPath)) {
        partStats.uploaded++;
      } else {
        partStats.missing.push(file);
      }
    }
    
    stats.total += partStats.local;
    stats.uploaded += partStats.uploaded;
    stats.missing += partStats.missing.length;
    
    console.log(`📁 ${part}:`);
    console.log(`   Local files: ${partStats.local}`);
    console.log(`   ✅ Uploaded: ${partStats.uploaded}`);
    console.log(`   ❌ Missing: ${partStats.missing.length}`);
    
    if (partStats.missing.length > 0 && partStats.missing.length <= 10) {
      console.log(`   Missing files:`);
      partStats.missing.forEach(f => console.log(`     - ${f}`));
    }
    console.log();
  }
  
  console.log('📊 Summary:');
  console.log(`   Total local files: ${stats.total}`);
  console.log(`   ✅ Uploaded: ${stats.uploaded} (${Math.round(stats.uploaded/stats.total*100)}%)`);
  console.log(`   ❌ Missing: ${stats.missing} (${Math.round(stats.missing/stats.total*100)}%)`);
  
  if (stats.missing > 0) {
    console.log('\n💡 To upload missing files, run:');
    console.log('   node scripts/upload-missing-audio.js');
  }
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Error: BLOB_READ_WRITE_TOKEN environment variable is not set');
  process.exit(1);
}

checkBlobStatus().catch(console.error);