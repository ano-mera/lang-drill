# Part0 問題生成ガイド

## 📋 概要
Part0は短い英文のリスニング練習用問題です。各問題には英文、日本語訳、学習ポイント、音声ファイルが含まれます。

## 🔧 標準生成スクリプト

### `generate-part0-standard.js`
安定した一貫性のあるフローでPart0問題を生成する標準スクリプトです。

#### 使用方法
```bash
# 1問生成
node generate-part0-standard.js

# 5問生成
node generate-part0-standard.js 5

# 10問生成
node generate-part0-standard.js 10
```

## 📊 データ構造

Part0の各問題は以下の構造を持ちます：

```json
{
  "id": "p0-001",
  "text": "Please have a seat.",
  "textTranslation": "お座りください。",
  "difficulty": "beginner",
  "wordCount": 4,
  "topic": "日常会話",
  "audioFiles": {
    "male": "/audio/part0/p0-001-m.mp3",
    "female": "/audio/part0/p0-001-f.mp3"
  },
  "pronunciation": "have a seatは「着席する」という意味の定型表現",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### フィールド説明

| フィールド | 型 | 説明 | 例 |
|----------|---|------|-----|
| id | string | 問題ID（p0-XXX形式） | "p0-001" |
| text | string | 英文 | "Please have a seat." |
| textTranslation | string | 日本語訳 | "お座りください。" |
| difficulty | string | 難易度 | "beginner" / "intermediate" / "advanced" |
| wordCount | number | 単語数 | 4 |
| topic | string | トピック | "日常会話", "ビジネス", "サービス" 等 |
| audioFiles | object | 音声ファイルパス | male/female別 |
| pronunciation | string | 学習ポイント | 文法・語彙・発音の解説 |
| createdAt | string | 作成日時 | ISO8601形式 |

## 🔄 生成フロー

1. **問題生成（GPT-4o）**
   - 英文、日本語訳、学習ポイントを同時に生成
   - TOEICリスニングセクションで使用される自然な英語

2. **音声生成（OpenAI TTS）**
   - 男性音声: onyx
   - 女性音声: nova
   - 速度: 0.9（少しゆっくり）

3. **データ保存**
   - `/src/data/part0-sentences.json`に追加
   - バックアップ自動作成

## 📝 学習ポイントのパターン

学習ポイント（pronunciation）は以下のパターンで生成されます：

1. **文法パターン**
   - "Could youは丁寧な依頼の定型表現"
   - "現在完了形で経験を表現"

2. **重要語彙**
   - "postponeは「延期する」を意味する動詞"
   - "sharpは「ちょうど」を意味する重要な副詞"

3. **発音のコツ**
   - "I'llの縮約形に注意"
   - "受動態の発音に注意"

4. **定型表現**
   - "have a seatは「着席する」という意味の定型表現"
   - "Let meは「〜させて」の定型表現"

## ⚠️ 注意事項

1. **一貫性の維持**
   - 既存のデータ構造を厳守
   - 学習ポイントのパターンを踏襲

2. **API制限**
   - 生成間隔: 1秒以上
   - 大量生成時は分割実行推奨

3. **品質管理**
   - 生成後は必ずアプリで動作確認
   - 学習ポイントの教育的価値を確認

## 🚀 その他のスクリプト

| スクリプト | 用途 | 状態 |
|----------|------|------|
| generate-part0-sentences.js | 音声のみ生成 | 音声生成専用 |
| generate-part0-toeic.js | TOEIC問題生成 | 学習ポイント未対応 |
| generate-part0-batch2.js | バッチ音声生成 | 音声生成専用 |

## 📌 推奨ワークフロー

1. **標準スクリプトを使用**
   ```bash
   node generate-part0-standard.js [問題数]
   ```

2. **動作確認**
   - アプリケーションで新問題を確認
   - 音声再生テスト

3. **本番環境へ**
   - 必要に応じてR2ストレージへアップロード
   - git commit & push

## 🔗 関連ファイル

- データファイル: `/src/data/part0-sentences.json`
- 音声ファイル: `/public/audio/part0/`
- 型定義: `/src/lib/types.ts` (Part0Sentence)
- コンポーネント: `/src/components/Part0Component.tsx`