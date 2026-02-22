# R2音声ファイル統合機能

新しい問題生成ワークフローでは、音声ファイルを直接Cloudflare R2にアップロードします。

## 概要

従来のワークフロー：
1. 音声ファイル生成 → ローカル保存 (`/public/audio/`)
2. Git push時にサーバーへアップロード

新しいワークフロー：
1. 音声ファイル生成 → 直接R2にアップロード
2. 問題データにR2 CDN URLを保存

## 設定

### 環境変数（.env.local）
```bash
R2_ACCOUNT_ID="your_account_id"
R2_ACCESS_KEY_ID="your_access_key"  
R2_SECRET_ACCESS_KEY="your_secret_key"
R2_BUCKET="toeic-audio"
R2_PUBLIC_BASE="https://pub-xxxxx.r2.dev"
ELEVENLABS_API_KEY="your_elevenlabs_key"
```

## 使用方法

### 1. 基本的な問題生成

```bash
# Part 1問題生成（R2アップロード有効）
cd generator/scripts/generate
node generate-part1-passages.js --difficulty=medium --count=3

# Part 2問題生成（R2アップロード有効）
node generate-part2-passages.js --difficulty=hard --count=5
```

### 2. R2統合機能のテスト

```bash
# R2接続とアップロード機能をテスト
node scripts/test-r2-audio-integration.js
```

## 技術詳細

### R2AudioUploader クラス

音声ファイルの直接R2アップロードを処理：

```javascript
import { R2AudioUploader } from '../generator/lib/r2-audio-uploader.js';

const uploader = new R2AudioUploader();
const result = await uploader.uploadAudio(audioBuffer, fileName, partType);
// result: { audioPath, publicUrl }
```

### ElevenLabsAudio クラスの更新

R2統合機能が自動で有効化：

```javascript
// R2アップロード機能付きで初期化
const audioGenerator = new ElevenLabsAudio({ useR2Upload: true });

const audioResult = await audioGenerator.generateAudio(text, outputPath, {
  partType: 'part1',
  isPart1: true
});

// 結果：
// - method: 'r2' | 'local' 
// - audioPath: '/audio/part1/file.mp3'
// - publicUrl: 'https://pub-xxxxx.r2.dev/audio/part1/file.mp3' (R2の場合)
```

## 利点

### 1. デプロイ最適化
- ローカル音声ファイル削除でVercel関数サイズ削減 (249MB → 20MB未満)
- 250MB制限の回避

### 2. パフォーマンス向上
- CDN経由での音声配信（グローバル配信）
- 帯域幅コスト削減（R2のゼロegress料金）

### 3. ワークフロー改善
- 問題生成と同時に音声がCDNで利用可能
- Git リポジトリサイズの削減

## フォールバック機能

R2アップロードに失敗した場合は自動的にローカル保存にフォールバック：

```javascript
// R2アップロード失敗時の自動フォールバック
if (this.useR2Upload && this.r2Uploader) {
  try {
    return await this.r2Uploader.uploadAudio(audioBuffer, fileName, partType);
  } catch (r2Error) {
    console.warn('⚠️ R2 upload failed, falling back to local storage');
    // ローカル保存処理
  }
}
```

## ログ出力例

```
✅ ElevenLabs audio generator initialized with R2 upload
🎵 Selected voice for question part1_123: EXAVITQu4vr4xnSDxMaL (female, American 🇺🇸)
📤 Uploading part1_123_option_a.mp3 to R2...
✅ Uploaded: part1_123_option_a.mp3 -> https://pub-xxxxx.r2.dev/audio/part1/part1_123_option_a.mp3
```

## トラブルシューティング

### R2接続エラー
```bash
# 接続テスト実行
node scripts/test-r2-audio-integration.js
```

### 環境変数確認
```bash
# 必要な環境変数が設定されているか確認
echo $R2_ACCESS_KEY_ID
echo $R2_SECRET_ACCESS_KEY
```

### ローカルフォールバック
R2が利用できない場合、自動的に従来のローカル保存に切り替わります。