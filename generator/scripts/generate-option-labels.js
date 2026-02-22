#!/usr/bin/env node

/**
 * 選択肢記号（A、B、C、D）の音声ファイル生成スクリプト
 * ElevenLabs APIを使用して共通で使い回す記号音声を作成
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 環境変数を設定（Next.js環境と同様）
if (!process.env.ELEVENLABS_API_KEY) {
  console.log('ELEVENLABS_API_KEY not found in environment variables');
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('ELEVEN') || k.includes('API')));
  
  // 他の環境変数名も確認
  const possibleKeys = [
    'ELEVENLABS_API_KEY',
    'ELEVEN_LABS_API_KEY', 
    'ELEVENLABS_KEY',
    'NEXT_PUBLIC_ELEVENLABS_API_KEY'
  ];
  
  for (const key of possibleKeys) {
    if (process.env[key]) {
      console.log(`Found API key in ${key}`);
      process.env.ELEVENLABS_API_KEY = process.env[key];
      break;
    }
  }
}

import ElevenLabsAudio from '../lib/elevenlabs-audio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 音声ファイル保存先
const OUTPUT_DIR = path.join(__dirname, '../../public/audio/labels');

async function generateOptionLabels() {
  console.log('🎵 選択肢記号音声ファイル生成開始');
  
  try {
    // ElevenLabs音声生成の初期化
    const audioGenerator = new ElevenLabsAudio();
    console.log('✅ ElevenLabs audio generator initialized');
    
    // 生成する記号
    const labels = ['A', 'B', 'C', 'D'];
    
    for (const label of labels) {
      const filename = `option_${label.toLowerCase()}.mp3`;
      const outputPath = path.join(OUTPUT_DIR, filename);
      
      console.log(`🔊 Generating audio for label: ${label}`);
      
      try {
        // Aのみ長い文章を使って正しい発音にする
        const textToGenerate = label === 'A' ? 'A. The man is holding a book. B. The woman is writing. A. The man is holding a book.' : label;
        await audioGenerator.generateAudio(textToGenerate, outputPath);
        console.log(`✅ Generated: ${filename}`);
      } catch (error) {
        console.error(`❌ Failed to generate ${label}:`, error.message);
      }
    }
    
    console.log('🎉 選択肢記号音声ファイル生成完了');
    
    // 生成されたファイルの情報を表示
    console.log('\n📋 Generated files:');
    labels.forEach(label => {
      const filename = `option_${label.toLowerCase()}.mp3`;
      console.log(`  - /audio/labels/${filename} (${label})`);
    });
    
  } catch (error) {
    console.error('❌ 生成エラー:', error);
    process.exit(1);
  }
}

// スクリプトを直接実行した場合のみ生成を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  generateOptionLabels();
}

export { generateOptionLabels };