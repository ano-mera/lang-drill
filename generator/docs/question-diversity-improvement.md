# 問題文多様化強化ドキュメント（TOEIC 準拠版）

## 概要

TOEIC 風英語学習アプリの問題文が画一的になっていた問題を解決するため、**TOEIC Part7 の実際の出題パターンに忠実な**問題文の多様化機能を実装しました。

## 問題の背景

### 従来の問題

- 問題文のパターンが限定的（3 パターンのみ）
- 同じような言い回しの繰り返し
- 学習者の興味を維持しにくい
- 実際の TOEIC 試験との差

### 重要な改善点

- **TOEIC 準拠**: 実際の TOEIC で出題される問題タイプのみを使用
- **多様性確保**: 限られたパターン内での表現の多様化
- **品質向上**: 自動的な多様性チェックと改善

## 実装した解決策

### 1. TOEIC Part7 準拠の問題パターン

#### 通常問題のパターン（7 種類、TOEIC 頻出順）

1. **主旨・目的理解（最も頻出）**

   - "What is the main purpose of this document?"
   - "What is the primary goal of this communication?"
   - "Why was this document created?"

2. **詳細情報・事実確認（頻出）**

   - "According to the document, what specific information is mentioned?"
   - "What details are provided about [具体的な内容]?"
   - "Which of the following is stated in the document?"

3. **推論・推測（頻出）**

   - "What can be inferred from the information provided?"
   - "What conclusion can be drawn from this document?"
   - "What does this suggest about [トピック]?"

4. **人物・役割（中頻度）**

   - "Who is responsible for [タスク]?"
   - "What role does [人物] play in this situation?"
   - "Who should be contacted regarding [問題]?"

5. **時系列・日程（中頻度）**

   - "When will [イベント] take place?"
   - "What is the deadline for [アクション]?"
   - "What is the timeline for [プロジェクト]?"

6. **場所・場所（中頻度）**

   - "Where will [イベント] be held?"
   - "What location is mentioned for [アクティビティ]?"
   - "Which venue is specified for [目的]?"

7. **条件・要件（低頻度だが出題される）**
   - "What is required for [条件] to be met?"
   - "Under what circumstances would [状況] occur?"
   - "What conditions must be satisfied for [結果]?"

#### 図表付き問題のパターン（6 種類、TOEIC 頻出順）

1. **図表データ理解（最も頻出）**

   - "What does the chart show about [データ]?"
   - "According to the chart, what is the [数値/傾向]?"
   - "What information can be found in the table?"

2. **文書・図表統合（頻出）**

   - "Based on both the document and chart, what can be concluded?"
   - "How does the chart support the information in the document?"
   - "What relationship exists between the document and the chart data?"

3. **数値・統計（頻出）**

   - "What percentage/amount is shown for [項目]?"
   - "Which [カテゴリ] has the highest/lowest [数値]?"
   - "What is the difference between [A] and [B] according to the chart?"

4. **比較・分析（中頻度）**

   - "How do [A] and [B] compare according to the chart?"
   - "What is the ranking of [項目] based on the data?"
   - "Which option performs best according to the chart?"

5. **推論・予測（中頻度）**

   - "What can be inferred from the chart data?"
   - "What does the trend suggest about [結果]?"
   - "What implication does this data have for [対象]?"

6. **時系列・変化（低頻度だが出題される）**
   - "How has [数値] changed over time according to the chart?"
   - "What was the trend for [項目] during [期間]?"

### 2. TOEIC で出題されない問題タイプ（使用禁止）

#### 通常問題

- 比較・対比問題（"How does A compare to B?"）
- 方法・手段問題（"How can this be achieved?"）
- 複雑な時系列・順序問題（"What happens first?"）
- 抽象的な推論問題

#### 図表付き問題

- 複雑な予測問題（"What would likely happen if..."）
- 抽象的な分析問題
- 図表の作成方法に関する問題

### 3. 自動多様性チェック機能（TOEIC 準拠）

#### 多様性スコア計算

```javascript
function checkQuestionDiversity(questions) {
  // TOEIC Part7で実際に出題される問題パターンのみ
  const toeicQuestionPatterns = {
    purpose: /what.*purpose|why.*created|what.*goal/i,
    detail: /what.*specific|what.*details|which.*stated/i,
    inference: /what.*inferred|what.*conclusion|what.*suggest/i,
    person: /who.*responsible|what.*role|who.*contacted/i,
    timeline: /when.*take.*place|what.*deadline|what.*timeline/i,
    location: /where.*held|what.*location|which.*venue/i,
    condition: /what.*required|under.*circumstances|what.*conditions/i,
  };

  // 多様性スコア = ユニークパターン数 / 問題数
  const diversityScore = uniquePatterns / questions.length;

  return {
    diversityScore,
    isDiverse: diversityScore >= 0.8, // 80%以上を良好とする
  };
}
```

#### 自動改善機能

- 多様性が不足している場合、AI が自動的に問題文を改善
- **TOEIC 準拠のパターンのみ**を使用して改善
- 選択肢と正解は保持し、問題文のみを多様化
- 改善後の多様性スコアを再評価

### 4. プロンプトテンプレートの強化（TOEIC 準拠）

#### 通常問題生成プロンプト

- 7 種類の TOEIC 頻出パターンから 3 つを選択するよう指示
- 同じパターンの重複を避けるよう明記
- **使用禁止パターンを明確に指定**
- TOEIC の出題傾向に忠実であるよう強調

#### 図表付き問題生成プロンプト

- 6 種類の TOEIC 図表問題パターンから選択
- 文書と図表の統合を重視
- 数値・統計・比較に特化したパターン
- **複雑な予測問題は除外**

## 実装ファイル

### 主要ファイル

- `generator/lib/prompt-templates.js` - TOEIC 準拠プロンプトテンプレート
- `generator/lib/passage-generator.js` - TOEIC 準拠問題生成ロジック
- `generator/scripts/generate/test-diversity.js` - テストスクリプト

### 追加された機能

- `checkQuestionDiversity()` - TOEIC 準拠多様性チェック
- `improveQuestionDiversity()` - TOEIC 準拠多様性改善
- `checkChartQuestionDiversity()` - TOEIC 準拠図表問題多様性チェック
- `improveChartQuestionDiversity()` - TOEIC 準拠図表問題多様性改善

## 使用方法

### 1. 通常の問題生成

```javascript
import { generateQuestions } from "./lib/passage-generator.js";

const questions = await generateQuestions(passageContent, passageType);
// 自動的にTOEIC準拠の多様性チェックと改善が実行される
```

### 2. 図表付き問題生成

```javascript
import { generateQuestionsWithChart } from "./lib/passage-generator.js";

const chartQuestions = await generateQuestionsWithChart(passageContent, chartData, passageType);
// 図表問題専用のTOEIC準拠多様性チェックと改善が実行される
```

### 3. 多様性テスト

```bash
cd generator/scripts/generate
node test-diversity.js
```

## TOEIC Part7 の特徴

### 実際の出題傾向

- **実用的なビジネス文書が中心**
- **明確な情報の特定が重要**
- **複雑な分析よりも事実確認が中心**
- **文書の目的や意図を理解することが重要**

### 問題の特徴

- 主旨理解問題が最も頻出
- 具体的な情報の特定が重要
- 推論問題は文書の内容に基づく
- 図表問題はデータの読み取りが中心

## 期待される効果

### 学習効果の向上

- **TOEIC に忠実な問題文**による理解力向上
- **実際の TOEIC 試験に近い体験**
- 学習者の興味維持

### 品質向上

- **TOEIC 準拠の自動的な多様性確保**
- 一貫した品質管理
- エラー検出と改善

### 開発効率

- 自動化された多様性チェック
- 手動調整の削減
- スケーラブルな問題生成

## 今後の改善予定

### 短期目標

- [ ] TOEIC 公式問題集との詳細比較分析
- [ ] 問題文パターンのさらなる精緻化
- [ ] 学習者フィードバックの収集

### 中期目標

- [ ] TOEIC の出題傾向変化への対応
- [ ] 学習者のレベルに応じたパターン調整
- [ ] 多言語対応（日本語問題文）

### 長期目標

- [ ] 完全自動化された TOEIC 準拠問題品質管理
- [ ] 学習効果の測定と最適化
- [ ] 他言語版への展開

## 技術仕様

### 多様性スコア計算式

```
多様性スコア = ユニークパターン数 / 総問題数
良好判定: スコア >= 0.8 (80%)
```

### TOEIC 準拠パターン検出正規表現

```javascript
const toeicQuestionPatterns = {
  purpose: /what.*purpose|why.*created|what.*goal/i,
  detail: /what.*specific|what.*details|which.*stated/i,
  inference: /what.*inferred|what.*conclusion|what.*suggest/i,
  person: /who.*responsible|what.*role|who.*contacted/i,
  timeline: /when.*take.*place|what.*deadline|what.*timeline/i,
  location: /where.*held|what.*location|which.*venue/i,
  condition: /what.*required|under.*circumstances|what.*conditions/i,
};
```

### API 制限対策

- 改善処理の温度設定: 0.7
- エラーハンドリングの強化
- フォールバック機能

## まとめ

**TOEIC 準拠の問題文多様化強化**により、以下の成果が期待されます：

1. **学習体験の向上**: TOEIC に忠実な問題文による理解力向上
2. **品質の向上**: TOEIC 準拠の自動的な多様性確保
3. **効率の向上**: 自動化による開発時間短縮
4. **スケーラビリティ**: 大量の問題生成に対応

この実装により、TOEIC 風英語学習アプリの問題品質が大幅に向上し、**実際の TOEIC 試験により近い学習体験**を提供できるようになります。
