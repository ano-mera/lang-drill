# TOEIC Part7 問題自動生成ツール

このディレクトリは、TOEIC Part7 の問題を自動生成するための独立したツールです。

## 📁 ディレクトリ構造

```
generator/
├── lib/                    # 生成機能のライブラリ
│   ├── openai-config.js    # OpenAI API設定
│   ├── prompt-templates.js # プロンプトテンプレート
│   └── passage-generator.js # 問題生成機能
├── scripts/                # 実行スクリプト
│   └── generate-passages.js # メイン生成スクリプト
├── package.json            # 依存関係
└── README.md              # このファイル
```

## 🚀 使用方法

### 1. 依存関係のインストール

```bash
cd generator
npm install
```

### 2. 環境変数の設定

#### 方法 1: .env ファイルを使用（推奨）

```bash
# generator/.env ファイルを作成
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

#### 方法 2: システム環境変数として設定

```bash
# Windows PowerShell
$env:OPENAI_API_KEY="your_openai_api_key_here"

# Windows Command Prompt
set OPENAI_API_KEY=your_openai_api_key_here

# Linux/macOS
export OPENAI_API_KEY="your_openai_api_key_here"
```

#### API キーの取得方法

1. [OpenAI Platform](https://platform.openai.com/api-keys) にアクセス
2. アカウントにログイン
3. "Create new secret key" をクリック
4. 生成されたキーをコピーして環境変数に設定

### 3. 問題生成の実行

```bash
npm run generate
```

## ⚙️ 設定

### 生成設定

- **モデル**: GPT-4
- **最大トークン**: 2000
- **温度**: 0.7
- **生成数**: 20 問（デフォルト）

### 文書タイプ

- メール (email)
- 広告 (advertisement)
- 記事 (article)

### 難易度

- 初級 (easy)
- 中級 (medium)
- 上級 (hard)

## 📊 出力

生成された問題は `../src/data/passages.json` に自動追加されます。

## 🔧 カスタマイズ

### 生成数を変更

`scripts/generate-passages.js` の `generateCount` を変更

### プロンプトを調整

`lib/prompt-templates.js` を編集

### 品質チェックを調整

`lib/passage-generator.js` の `validatePassage` 関数を編集

## ⚠️ 注意事項

- OpenAI API キーが必要です
- API 使用料金が発生します
- 生成には時間がかかります（約 40-60 分）
- 品質チェックを通過した問題のみが追加されます

### 🔒 セキュリティ

- **API キーの管理**: `.env` ファイルは絶対に Git にコミットしないでください
- **ファイル除外**: `.env` ファイルは `.gitignore` に追加されています
- **キーの共有**: API キーを他人と共有したり、公開リポジトリにアップロードしないでください
- **定期的な更新**: セキュリティのため、API キーは定期的に更新することをお勧めします

### 📝 .env ファイルの管理

```bash
# .env ファイルが存在するか確認
ls -la .env

# .env ファイルの内容確認（キーは表示されません）
cat .env | sed 's/=.*/=***/'
```

## 📈 統計

生成結果には以下の統計が含まれます：

- 成功率
- 難易度別内訳
- 文書タイプ別内訳
- エラー詳細
# Force rebuild
