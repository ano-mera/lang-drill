#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Part3_30の音声ファイルをチェック
const audioFiles = [
  '/home/ki/projects/eng/public/audio/part3/part3_30_conversation_2.mp3',
  '/home/ki/projects/eng/public/audio/part3/part3_30_conversation_4.mp3',
  '/home/ki/projects/eng/public/audio/part3/part3_30_conversation_6.mp3'
];

console.log('Part3音声ファイルの詳細情報をチェック中...');

for (const audioFile of audioFiles) {
  if (fs.existsSync(audioFile)) {
    const stats = fs.statSync(audioFile);
    console.log(`\n${path.basename(audioFile)}:`);
    console.log(`  サイズ: ${(stats.size / 1024).toFixed(1)}KB`);
    console.log(`  更新日時: ${stats.mtime.toLocaleString()}`);
    
    // ファイルの最初の数バイトを読んで形式確認
    const buffer = fs.readFileSync(audioFile);
    const header = buffer.slice(0, 10);
    console.log(`  ヘッダー: ${Array.from(header).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
  } else {
    console.log(`❌ ファイルが見つかりません: ${audioFile}`);
  }
}

console.log('\n📝 推奨対応:');
console.log('1. ElevenLabsの音声設定で前後の無音部分を最小化');
console.log('2. 音声生成時にtrimming設定を有効化');
console.log('3. または、200ms間隔を100ms以下に短縮');