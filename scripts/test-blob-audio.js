import { list } from '@vercel/blob';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

async function testBlobAudio() {
  console.log('🔍 Testing Vercel Blob audio access...\n');
  
  // Get first few audio files from blob
  const { blobs } = await list({
    prefix: 'audio/part1/',
    limit: 5
  });
  
  if (blobs.length === 0) {
    console.error('❌ No audio files found in Blob storage');
    return;
  }
  
  console.log(`Found ${blobs.length} test files:\n`);
  
  for (const blob of blobs) {
    console.log(`📄 Testing: ${blob.pathname}`);
    console.log(`   URL: ${blob.url}`);
    
    try {
      // Test accessibility
      const response = await fetch(blob.url, { method: 'HEAD' });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`);
      console.log(`   Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin') || 'not set'}`);
      
      if (response.status === 200) {
        console.log(`   ✅ File is accessible\n`);
      } else {
        console.log(`   ❌ File returned non-200 status\n`);
      }
    } catch (error) {
      console.error(`   ❌ Error accessing file: ${error.message}\n`);
    }
  }
  
  // Test URL generation
  console.log('\n🔧 Testing URL generation:');
  const testPaths = [
    '/audio/part1/part1_163_option_a.mp3',
    'audio/part2/part2_001_question.mp3',
    '/audio/labels/option_a.mp3'
  ];
  
  for (const path of testPaths) {
    const expectedUrl = `https://cncouhzlqago0mjj.public.blob.vercel-storage.com${path.startsWith('/') ? path : '/' + path}`;
    console.log(`\n   Input: ${path}`);
    console.log(`   Expected: ${expectedUrl}`);
    
    // Check if file exists
    try {
      const response = await fetch(expectedUrl, { method: 'HEAD' });
      if (response.status === 200) {
        console.log(`   ✅ URL is valid and accessible`);
      } else {
        console.log(`   ⚠️ URL returned status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Could not access URL: ${error.message}`);
    }
  }
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Error: BLOB_READ_WRITE_TOKEN environment variable is not set');
  process.exit(1);
}

testBlobAudio().catch(console.error);