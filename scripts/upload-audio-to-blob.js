import { put, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadAudioFiles() {
  const publicDir = path.join(__dirname, '..', 'public');
  const audioParts = ['part1', 'part2', 'part3', 'part4'];
  
  console.log('Starting audio file upload to Vercel Blob...');
  
  for (const part of audioParts) {
    const audioDir = path.join(publicDir, 'audio', part);
    
    if (!fs.existsSync(audioDir)) {
      console.log(`Skipping ${part}: directory not found`);
      continue;
    }
    
    const files = fs.readdirSync(audioDir);
    console.log(`Found ${files.length} files in ${part}`);
    
    for (const file of files) {
      const filePath = path.join(audioDir, file);
      
      if (!fs.statSync(filePath).isFile()) continue;
      
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const blob = new Blob([fileBuffer]);
        
        const { url } = await put(`audio/${part}/${file}`, blob, {
          access: 'public',
        });
        
        console.log(`✓ Uploaded ${part}/${file} -> ${url}`);
      } catch (error) {
        console.error(`✗ Failed to upload ${part}/${file}:`, error.message);
      }
    }
  }
  
  console.log('Upload complete!');
  
  console.log('\nListing all uploaded audio files:');
  const { blobs } = await list({
    prefix: 'audio/',
  });
  
  console.log(`Total files in blob storage: ${blobs.length}`);
  blobs.forEach(blob => {
    console.log(`- ${blob.pathname} (${blob.size} bytes)`);
  });
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Error: BLOB_READ_WRITE_TOKEN environment variable is not set');
  console.error('Please add it to your .env.local file:');
  console.error('BLOB_READ_WRITE_TOKEN=your_token_here');
  process.exit(1);
}

uploadAudioFiles().catch(console.error);