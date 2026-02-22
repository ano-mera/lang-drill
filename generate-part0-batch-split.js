#!/usr/bin/env node

/**
 * Part0の29問を分割して生成するバッチスクリプト
 */

import fetch from 'node-fetch';

async function generatePart0Batch(count, batchNumber) {
  console.log(`📝 Batch ${batchNumber}: Generating ${count} Part0 problems...\n`);
  
  try {
    const response = await fetch('http://localhost:3001/api/part0-sentences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ count })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log(`✅ Batch ${batchNumber} completed!`);
    console.log(`📊 Generated: ${result.problems?.length || 0} problems`);
    console.log(`📈 Total count: ${result.totalCount} problems\n`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Batch ${batchNumber} failed:`, error.message);
    throw error;
  }
}

async function generateAllBatches() {
  console.log('🚀 Starting Part0 generation in batches...\n');
  
  let totalGenerated = 0;
  
  try {
    // Batch 1: 10問
    const result1 = await generatePart0Batch(10, 1);
    totalGenerated += result1.problems?.length || 0;
    
    // 少し待機
    console.log('⏳ Waiting 2 seconds before next batch...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Batch 2: 10問 
    const result2 = await generatePart0Batch(10, 2);
    totalGenerated += result2.problems?.length || 0;
    
    // 少し待機
    console.log('⏳ Waiting 2 seconds before next batch...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Batch 3: 9問
    const result3 = await generatePart0Batch(9, 3);
    totalGenerated += result3.problems?.length || 0;
    
    console.log('🎉 All batches completed successfully!');
    console.log(`📊 Total generated: ${totalGenerated} problems`);
    console.log(`📈 Final total: ${result3.totalCount} problems`);
    
  } catch (error) {
    console.error('💥 Batch generation failed:', error.message);
    throw error;
  }
}

// 実行
generateAllBatches()
  .then(() => {
    console.log('✨ Part0 29-problem generation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Generation failed:', error.message);
    process.exit(1);
  });