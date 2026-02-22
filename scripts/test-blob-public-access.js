import { put, list, del } from '@vercel/blob';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testBlobPublicAccess() {
  console.log('🔬 Testing Vercel Blob public access...\n');
  
  const testFileName = 'test-public-access.txt';
  const testContent = 'This is a test file for public access';
  
  try {
    // 1. Upload a test file with public access
    console.log('1️⃣ Uploading test file with public access...');
    const blob = new Blob([testContent]);
    
    const { url, downloadUrl, pathname, contentType } = await put(testFileName, blob, {
      access: 'public',
      contentType: 'text/plain',
    });
    
    console.log('   Upload successful!');
    console.log(`   URL: ${url}`);
    console.log(`   Download URL: ${downloadUrl}`);
    console.log(`   Pathname: ${pathname}`);
    console.log(`   Content Type: ${contentType}\n`);
    
    // 2. Test accessing the URL without authentication
    console.log('2️⃣ Testing public access (no auth)...');
    try {
      const response = await fetch(url);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Headers:`);
      console.log(`     Content-Type: ${response.headers.get('content-type')}`);
      console.log(`     Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin')}`);
      
      if (response.ok) {
        const content = await response.text();
        console.log(`   ✅ Content retrieved: "${content}"\n`);
      } else {
        console.log(`   ❌ Failed to retrieve content\n`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
    
    // 3. List the file to check its properties
    console.log('3️⃣ Checking file properties via list...');
    const { blobs } = await list({
      prefix: testFileName,
    });
    
    if (blobs.length > 0) {
      const fileBlob = blobs[0];
      console.log(`   Found file: ${fileBlob.pathname}`);
      console.log(`   URL: ${fileBlob.url}`);
      console.log(`   Size: ${fileBlob.size} bytes`);
      console.log(`   Uploaded: ${fileBlob.uploadedAt}\n`);
    }
    
    // 4. Clean up
    console.log('4️⃣ Cleaning up test file...');
    await del(url);
    console.log('   Test file deleted\n');
    
    // 5. Check existing audio files
    console.log('5️⃣ Checking existing audio file properties...');
    const { blobs: audioBlobs } = await list({
      prefix: 'audio/part1/',
      limit: 1
    });
    
    if (audioBlobs.length > 0) {
      const audioFile = audioBlobs[0];
      console.log(`   Sample audio file: ${audioFile.pathname}`);
      console.log(`   URL: ${audioFile.url}`);
      console.log(`   Size: ${audioFile.size} bytes`);
      
      // Test access
      console.log('\n   Testing access to audio file...');
      try {
        const audioResponse = await fetch(audioFile.url);
        console.log(`   Status: ${audioResponse.status} ${audioResponse.statusText}`);
        
        if (!audioResponse.ok) {
          console.log('   ❌ Audio file is not publicly accessible');
          console.log('\n   🔄 Re-uploading with explicit public access...');
          
          // Try to get the actual download URL
          if (audioFile.downloadUrl) {
            console.log(`   Download URL: ${audioFile.downloadUrl}`);
            const dlResponse = await fetch(audioFile.downloadUrl);
            console.log(`   Download URL Status: ${dlResponse.status}`);
          }
        } else {
          console.log('   ✅ Audio file is publicly accessible');
        }
      } catch (error) {
        console.log(`   ❌ Error accessing audio: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Error: BLOB_READ_WRITE_TOKEN environment variable is not set');
  process.exit(1);
}

testBlobPublicAccess().catch(console.error);