import { list } from '@vercel/blob';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getCorrectBlobUrls() {
  console.log('🔍 Getting correct Blob URLs...\n');
  
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
  
  // Create a mapping of paths to URLs
  const urlMapping = {};
  
  for (const blob of allBlobs) {
    // blob.pathname is like "audio/part1/part1_163_option_a.mp3"
    // blob.url is the actual accessible URL
    urlMapping[blob.pathname] = blob.url;
    urlMapping['/' + blob.pathname] = blob.url; // Also map with leading slash
  }
  
  // Show sample URLs
  console.log('Sample URL mappings:');
  const samples = Object.entries(urlMapping).slice(0, 5);
  for (const [path, url] of samples) {
    console.log(`\n  Path: ${path}`);
    console.log(`  URL: ${url}`);
  }
  
  // Save the mapping to a JSON file
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'blob-urls.json');
  fs.writeFileSync(outputPath, JSON.stringify(urlMapping, null, 2));
  console.log(`\n✅ URL mapping saved to ${outputPath}`);
  
  // Test first URL
  if (samples.length > 0) {
    const testUrl = samples[0][1];
    console.log(`\n🔧 Testing URL: ${testUrl}`);
    
    try {
      const response = await fetch(testUrl);
      console.log(`  Status: ${response.status}`);
      console.log(`  Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.status === 200) {
        console.log('  ✅ URL is accessible!');
      } else {
        console.log('  ❌ URL returned non-200 status');
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  // Show the actual URL format
  if (allBlobs.length > 0) {
    const sampleBlob = allBlobs[0];
    console.log('\n📋 Actual Blob URL format:');
    console.log(`  Pathname: ${sampleBlob.pathname}`);
    console.log(`  URL: ${sampleBlob.url}`);
    console.log(`  Download URL: ${sampleBlob.downloadUrl}`);
    
    // Extract the domain from the URL
    const urlObj = new URL(sampleBlob.url);
    console.log(`\n  Domain: ${urlObj.origin}`);
    console.log(`  Path: ${urlObj.pathname}`);
  }
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Error: BLOB_READ_WRITE_TOKEN environment variable is not set');
  process.exit(1);
}

getCorrectBlobUrls().catch(console.error);