# 統合版 TOEIC Part7 問題生成スクリプト

## 概要

`generate-passages-unified.js`は、普通の問題用とハード用のスクリプトを統合した問題生成スクリプトです。1 つのスクリプトで全難易度（Easy、Medium、Hard）または Hard 難易度のみの問題を生成できます。

## 主な機能

- **難易度選択**: 全難易度または Hard 難易度のみを選択可能
- **テストモード**: データベースに追加せずにログファイルのみ出力
- **コスト削減モード**: API 呼び出し回数を削減
- **詳細ログ**: 生成された問題の詳細をログファイルに記録
- **品質チェック**: 生成された問題の品質を自動検証

## 使用方法

### 基本的な使用方法

```bash
# 全難易度で3問生成（本番モード）
node generate-passages-unified.js

# Hard難易度のみで5問生成
node generate-passages-unified.js --difficulty=hard --count=5

# テストモードで3問生成（データベースには追加しない）
node generate-passages-unified.js --test --count=3

# コスト削減モードでHard問題生成
node generate-passages-unified.js --cost-saving --difficulty=hard
```

### オプション一覧

| オプション          | 短縮形 | 説明                                 | デフォルト値 |
| ------------------- | ------ | ------------------------------------ | ------------ |
| `--test`            | `-t`   | テストモード（ログファイルのみ出力） | `false`      |
| `--count=N`         | -      | 生成する問題数                       | `3`          |
| `--difficulty=TYPE` | -      | 生成する難易度（`all`/`hard`）       | `all`        |
| `--cost-saving`     | `-c`   | コスト削減モード                     | `false`      |
| `--help`            | `-h`   | ヘルプを表示                         | -            |

### 難易度オプション

- `all`: 全難易度（Easy、Medium、Hard）をランダムに生成
- `hard`: Hard 難易度のみを生成

## 出力ファイル

### ログファイル

生成されたログファイルは `logs/` ディレクトリに保存されます。

ファイル名形式: `question-generation-{difficulty}-{timestamp}.log`

ログファイルには以下が含まれます：

- 生成結果の統計情報
- 生成された問題の詳細内容
- エラー情報（発生した場合）
- データベース更新結果

### データベース更新

本番モードでは、生成された問題が `src/data/passages.json` に自動追加されます。

## 使用例

### 1. 通常の問題生成（全難易度）

```bash
node generate-passages-unified.js --count=10
```

### 2. Hard 問題のみ生成

```bash
node generate-passages-unified.js --difficulty=hard --count=5
```

### 3. テストモードで品質確認

```bash
node generate-passages-unified.js --test --count=3 --difficulty=hard
```

### 4. コスト削減モード

```bash
node generate-passages-unified.js --cost-saving --difficulty=hard --count=3
```

## 注意事項

1. **API コスト**: 問題生成には OpenAI API の使用料が発生します
2. **品質チェック**: 生成された問題は自動的に品質チェックが行われます
3. **データベース**: 本番モードでは既存の問題データベースに追加されます
4. **ログファイル**: 詳細なログは自動的に保存されます

## トラブルシューティング

### よくある問題

1. **API キーエラー**: OpenAI API キーが正しく設定されているか確認
2. **ファイルパスエラー**: データベースファイルのパスが正しいか確認
3. **メモリ不足**: 大量の問題生成時はメモリ使用量に注意

### エラーログの確認

エラーが発生した場合は、ログファイルを確認してください：

```bash
# 最新のログファイルを確認
ls -la logs/
cat logs/question-generation-*.log
```

## 従来のスクリプトとの違い

| 機能             | 従来のスクリプト | 統合版スクリプト           |
| ---------------- | ---------------- | -------------------------- |
| 難易度選択       | スクリプト別     | 1 つのスクリプトで選択可能 |
| テストモード     | なし             | あり                       |
| コスト削減モード | なし             | あり                       |
| ログ形式         | 簡易             | 詳細                       |
| 使用方法         | 複数のスクリプト | 1 つのスクリプト           |

## 移行ガイド

従来のスクリプトから統合版への移行：

```bash
# 従来: 普通の問題生成
node generate-passages.js

# 統合版: 全難易度生成
node generate-passages-unified.js

# 従来: Hard問題生成
node generate-hard-passages.js

# 統合版: Hard問題生成
node generate-passages-unified.js --difficulty=hard
```
