#!/usr/bin/env node

/**
 * Part0の29問を生成するバッチスクリプト
 */

import fetch from 'node-fetch';

async function generatePart0Problems() {
  console.log('📝 Generating 29 new Part0 problems...\n');
  
  try {
    // Part0生成APIを呼び出し
    console.log('🔄 Calling Part0 generation API...');
    
    const response = await fetch('http://localhost:3001/api/part0-sentences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        count: 29 
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Generation completed successfully!');
    console.log(`📊 Generated: ${result.problems?.length || 0} problems`);
    console.log(`📈 Total count: ${result.totalCount} problems`);
    
    if (result.problems && result.problems.length > 0) {
      console.log('\n📋 Generated problems:');
      result.problems.forEach((problem, index) => {
        console.log(`  ${index + 1}. ${problem.id}: "${problem.text}"`);
        console.log(`     ${problem.textTranslation}`);
        console.log(`     Topic: ${problem.topic}, Difficulty: ${problem.difficulty}`);
        console.log('');
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error generating Part0 problems:', error.message);
    throw error;
  }
}

// 実行
generatePart0Problems()
  .then(() => {
    console.log('🎉 Part0 generation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Generation failed:', error.message);
    process.exit(1);
  });