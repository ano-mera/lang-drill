# TOEIC 風英語学習アプリ 問題作成仕様書

## 1. 概要

本仕様書は、TOEIC 風英語学習アプリで使用する問題の作成指針と検証基準を定義します。TOEIC 公式問題集の形式に忠実に従い、高品質で一貫性のある問題を効率的に作成することを目的としています。

## 2. AI 用プロンプトテンプレート

### 2.1 基本プロンプト

```
あなたはTOEIC公式問題集の形式に忠実な英語学習問題を作成する専門家です。

【必須要件】
1. 図表は必ずtable形式で、配列データを使用
2. 色や装飾は一切使用せず、モノクロ表現のみ
3. 問題は3問構成で、難易度を段階的に上げる
4. 実用的で自然な英語を使用
5. 選択肢は明確に区別できる内容にする

【出力形式】
以下のJSONスキーマに従って出力してください：
```

### 2.2 JSON スキーマ

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "問題の一意なID（例：passage1）"
    },
    "title": {
      "type": "string",
      "description": "問題タイトル（空文字列可）"
    },
    "type": {
      "type": "string",
      "enum": ["email", "advertisement", "article", "notice"],
      "description": "文書タイプ"
    },
    "content": {
      "type": "string",
      "description": "本文（英語、100-150語程度）"
    },
    "contentTranslation": {
      "type": "string",
      "description": "本文の日本語翻訳"
    },
    "hasChart": {
      "type": "boolean",
      "description": "図表があるかどうか"
    },
    "chart": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "const": "table",
          "description": "図表タイプ（tableのみ）"
        },
        "title": {
          "type": "string",
          "description": "図表タイトル"
        },
        "description": {
          "type": "string",
          "description": "図表の説明（オプション）"
        },
        "data": {
          "type": "array",
          "items": {
            "type": "object",
            "description": "配列形式のデータのみ使用"
          },
          "minItems": 3,
          "maxItems": 6,
          "description": "3-6行程度のデータ"
        }
      },
      "required": ["type", "title", "data"]
    },
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "問題ID（例：q1, q2, q3）"
          },
          "question": {
            "type": "string",
            "description": "問題文（英語）"
          },
          "options": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "minItems": 4,
            "maxItems": 4,
            "description": "4つの選択肢（A, B, C, D）"
          },
          "correct": {
            "type": "string",
            "enum": ["A", "B", "C", "D"],
            "description": "正解の選択肢"
          },
          "explanation": {
            "type": "string",
            "description": "解説（日本語）"
          },
          "questionTranslation": {
            "type": "string",
            "description": "問題文の日本語翻訳"
          },
          "optionTranslations": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "minItems": 4,
            "maxItems": 4,
            "description": "選択肢の日本語翻訳"
          }
        },
        "required": ["id", "question", "options", "correct", "explanation"]
      },
      "minItems": 3,
      "maxItems": 3,
      "description": "3つの問題"
    }
  },
  "required": ["id", "type", "content", "questions"]
}
```

### 2.3 図表作成専用プロンプト

```
図表作成時は以下を厳守してください：

【図表データ要件】
- データ形式：配列形式のみ（オブジェクト形式禁止）
- 列数：2-4列程度
- 行数：3-6行程度
- 列名：英語で明確な名称（例：Month, Sales, Percentage）
- データ型：数値、文字列、日付など適切な型

【表示仕様】
- 背景色：一切使用しない
- 色付きフォント：禁止
- 枠線：黒い枠線のみ
- 強調：太字、大文字、記号（※, *）のみ

【例】
{
  "type": "table",
  "title": "Monthly Sales Report",
  "data": [
    {"Month": "January", "Sales": 25000, "Growth": "5%"},
    {"Month": "February", "Sales": 28000, "Growth": "12%"},
    {"Month": "March", "Sales": 32000, "Growth": "14%"}
  ]
}
```

## 3. AI 検証用チェックリスト

### 3.1 自動検証項目

```yaml
data_integrity:
  - id_unique: true
  - required_fields_present: true
  - data_types_correct: true
  - chart_data_array_format: true

content_quality:
  - english_natural: true
  - japanese_translation_accurate: true
  - questions_clear: true
  - options_distinct: true
  - correct_answer_justified: true

chart_quality:
  - monochrome_only: true
  - simple_structure: true
  - logical_data: true
  - clear_column_names: true

display_quality:
  - chart_displays_correctly: true
  - responsive_design: true
  - readable_font_size: true
  - proper_borders: true
```

### 3.2 検証プロンプト

```
以下のJSONデータを検証し、問題があれば修正してください：

【検証基準】
1. データ構造がJSONスキーマに準拠しているか
2. 図表データが配列形式か
3. 英語が自然か
4. 選択肢が明確に区別されているか
5. 正解に根拠があるか

【出力】
- 問題なし：VALID
- 問題あり：INVALID + 修正版JSON
```

## 4. 問題作成指針

### 4.1 本文（Content）

- **実用的な内容**: ビジネス、日常生活で実際に使用される文書
- **適切な長さ**: 100-150 語程度
- **明確な構造**: 導入、本文、結論の構造を持つ
- **自然な英語**: ネイティブが実際に書くような自然な表現

### 4.2 問題文（Questions）

- **TOEIC 形式**: 3 つの問題で構成
- **難易度**: 易しい問題から始まり、徐々に難しくなる
- **問題タイプ**:
  1. 情報の特定（What information can be found...）
  2. 結論の導出（Based on both the document and chart...）
  3. 推論（What can be inferred from...）

### 4.3 選択肢（Options）

- **4 択**: A, B, C, D の 4 つの選択肢
- **明確な区別**: 選択肢間で明確に区別できる内容
- **適切な長さ**: 1-2 文程度
- **正解の根拠**: 本文や図表に明確な根拠がある

### 4.4 解説（Explanation）

- **日本語**: 学習者の理解を助けるため日本語で記述
- **根拠の明示**: なぜその選択肢が正解なのかを説明
- **学習ポイント**: 重要な語彙や表現について言及

## 5. 図表作成指針

### 5.1 図表タイプ

- **テーブル形式のみ**: 棒グラフ、円グラフ、折れ線グラフは使用しない
- **シンプルな構造**: 2-4 列程度のシンプルな表
- **実用的なデータ**: 売上、スケジュール、調査結果など

### 5.2 データ設計

- **適切な規模**: 3-6 行程度のデータ
- **意味のある関係**: データ間に論理的な関係がある
- **読みやすさ**: 一目で理解できる構造

### 5.3 列名設計

- **明確な名称**: 何を表しているかが明確
- **統一された形式**: 大文字で始める（例：Month, Sales, Percentage）
- **適切な粒度**: 詳細すぎず、抽象すぎない

## 6. 運用ルール

### 6.1 新規問題作成時

1. AI 用プロンプトテンプレートを使用
2. JSON スキーマに従って出力
3. AI 検証用チェックリストで確認
4. 表示テストを実施

### 6.2 既存問題修正時

1. データ形式の統一（配列形式に変更）
2. 図表のモノクロ表現確認
3. 表示テストの実施
4. 仕様書との整合性確認

### 6.3 定期メンテナンス

1. 月次でデータ整合性チェック
2. 四半期で表示確認
3. 年次で仕様書の見直し

## 7. トラブルシューティング

### 7.1 よくある問題

- **図表が表示されない**: データ形式が配列になっているか確認
- **選択肢が重複**: 選択肢間の区別を明確にする
- **翻訳が不自然**: 文脈を考慮した翻訳に修正

### 7.2 修正手順

1. 問題の特定
2. 原因の分析
3. 仕様書に基づく修正
4. テストの実施
5. 結果の確認

---

**最終更新**: 2024 年 12 月
**バージョン**: 2.0
**対象**: 問題作成者、品質管理者、AI システム
