// Generator用の品質チェックラッパー
import openai from "./openai-config.js";
import { logPromptToFile } from "./prompt-logger.js";

// 品質チェック結果の型定義
export const QualityCheckResult = {
  passed: false,
  score: 0,
  issues: [],
  recommendation: 'reject'
};

// 本文専用品質チェックプロンプト生成
function createContentQualityCheckPrompt(
  content,
  difficulty,
  hasChart = false,
  expectedWordRange = null,
  originalGenerationPrompt = null,
  chartData = null
) {
  const wordCount = content.split(/\s+/).length;
  
  const standardWordRanges = {
    'easy': [120, 180],
    'normal': [180, 250], 
    'hard': [250, 350]
  };
  
  const standardRange = standardWordRanges[difficulty] || [180, 250];
  const expectedRange = expectedWordRange ? `${expectedWordRange[0]}-${expectedWordRange[1]}語` : `${standardRange[0]}-${standardRange[1]}語（${difficulty}難易度標準）`;

  return `
以下のTOEIC Part 7文書の品質を評価してください：

【文書情報】
- 難易度: ${difficulty}
- 語数: ${wordCount}語 (目安範囲: ${expectedRange})
- 図表付き: ${hasChart ? 'あり' : 'なし'}

【文書内容】
${content}

${chartData && hasChart ? `【図表データ】
図表タイプ: ${chartData.type || '不明'}
図表タイトル: ${chartData.title || '不明'}
図表データ構造: ${JSON.stringify(chartData.data, null, 2)}

【図表評価ポイント】
- 文書内容に図表への適切な参照があるか
- 図表データが文書内容と整合性があるか  
- 図表データが構造化されており、質問回答に必要な情報を含んでいるか

` : ''}【評価基準（本文のみ）】
**重要: 以下の全ての項目で基準を満たしている場合のみ合格とする。**

1. 語数適合性: 期待範囲内の語数に厳密にあるか
2. 文法正確性: 完全に自然で正確な英語表現か
3. 内容妥当性: ビジネス文書として完全に自然か
4. 構造適合性: TOEIC Part 7の文書形式に準拠しているか
5. 難易度適合性: 指定難易度に適した語彙・構文か
${hasChart && chartData ? '6. 図表整合性: 図表データが文書内容と整合しているか' : ''}

【出力形式】
以下のJSON形式で日本語で回答してください：

{
  "passed": true/false,
  "score": 0-100の数値,
  "issues": [
    {
      "category": "文法|内容|構造|難易度|語数|図表整合性",
      "severity": "軽微|中程度|重大|致命的",
      "description": "具体的な問題の説明（日本語）",
      "suggestion": "改善提案（日本語、あれば）"
    }
  ],
  "recommendation": "合格|不合格|修正必要"
}
`;
}

// 問題文専用品質チェックプロンプト生成
function createQuestionsQualityCheckPrompt(
  content,
  questions,
  difficulty,
  hasChart = false,
  chartData = null
) {
  return `
以下のTOEIC Part 7問題の品質を評価してください：

【文書内容】
${content}

${chartData && hasChart ? `【図表データ】
図表タイプ: ${chartData.type || '不明'}
図表タイトル: ${chartData.title || '不明'}
図表データ構造: ${JSON.stringify(chartData.data, null, 2)}

` : ''}【問題文】
${questions.map((q, i) => `
問題${i + 1}: ${q.question}
選択肢: ${q.options.join(', ')}
正解: ${q.correct}
解説: ${q.explanation}
`).join('\n')}

【評価基準（問題文のみ）】
**重要: 以下の全ての項目で基準を満たしている場合のみ合格とする。**

1. 問題品質: 問題文と選択肢が適切で明確か
2. 解答根拠: 正解の根拠が文書内${hasChart ? 'または図表データ内' : ''}に明確にあるか
3. TOEIC準拠: TOEIC Part 7の出題形式に準拠しているか
4. 難易度適合性: 指定難易度に適した問題設定か
5. 選択肢品質: 選択肢が適切で紛らわしすぎないか

【出力形式】
以下のJSON形式で日本語で回答してください：

{
  "passed": true/false,
  "score": 0-100の数値,
  "issues": [
    {
      "category": "問題品質|解答根拠|TOEIC準拠|難易度|選択肢品質",
      "severity": "軽微|中程度|重大|致命的",
      "description": "具体的な問題の説明（日本語）",
      "suggestion": "改善提案（日本語、あれば）"
    }
  ],
  "recommendation": "合格|不合格|修正必要"
}
`;
}

// 統合品質チェック用プロンプト生成
function createQualityCheckPrompt(
  content,
  questions,
  difficulty,
  hasChart = false,
  expectedWordRange = null,
  originalGenerationPrompt = null,
  chartData = null
) {
  const wordCount = content.split(/\s+/).length;
  
  // 難易度別の標準語数範囲を定義
  const standardWordRanges = {
    'easy': [120, 180],
    'normal': [180, 250], 
    'hard': [250, 350]
  };
  
  const standardRange = standardWordRanges[difficulty] || [180, 250];
  const expectedRange = expectedWordRange ? `${expectedWordRange[0]}-${expectedWordRange[1]}語` : `${standardRange[0]}-${standardRange[1]}語（${difficulty}難易度標準）`;

  const originalPromptSection = originalGenerationPrompt ? `
【生成時に使用された指示】
${originalGenerationPrompt}

【判定方針】
上記の生成指示に対して、実際に生成された問題が適切に対応しているかを評価してください。
生成指示で求められた要件（文書種類、内容、語数、難易度など）と実際の出力の整合性を重視してください。

` : `
【難易度別語数目安】
- Easy: 120-180語（基本的なビジネス文書、簡潔な内容）
- Normal: 180-250語（標準的なビジネス文書、適度な詳細）
- Hard: 250-350語（複雑なビジネス文書、詳細な情報）

`;

  return `
以下のTOEIC Part 7問題の品質を評価してください：

【文書情報】
- 難易度: ${difficulty}
- 語数: ${wordCount}語 (目安範囲: ${expectedRange})
- 図表付き: ${hasChart ? 'あり' : 'なし'}
- 質問数: ${questions.length}問

${originalPromptSection}【文書内容】
${content}

${chartData && hasChart ? `【図表データ】
図表タイプ: ${chartData.type || '不明'}
図表タイトル: ${chartData.title || '不明'}
図表データ構造: ${JSON.stringify(chartData.data, null, 2)}

【図表評価ポイント】
- 文書内容に図表への適切な参照があるか
- 図表データが文書内容と整合性があるか  
- 図表データが構造化されており、質問回答に必要な情報を含んでいるか
- 図表は別データオブジェクトとして提供されているため、文書テキスト内に図表そのものが含まれていなくても問題ありません

` : ''}【質問】
${questions.map((q, i) => `
質問${i + 1}: ${q.question}
選択肢: ${q.options.join(', ')}
正解: ${q.correct}
解説: ${q.explanation}
`).join('\n')}

【評価基準】
**重要: 以下の全ての項目で基準を満たしている場合のみ合格とする。一つでも不適合があれば不合格とする。**

${originalGenerationPrompt ? `
1. 指示適合性: 生成指示の要件を完全に満たしているか（満たしていない場合は不合格）
2. 語数適合性: 指示された語数範囲内に厳密にあるか（範囲外の場合は不合格）
3. 文法正確性: 完全に自然で正確な英語表現か（誤りがある場合は不合格）
4. 内容妥当性: 指示された文書種類・内容として完全に自然か（不自然な場合は不合格）
5. 構造適合性: TOEIC Part 7の形式に完全に準拠しているか（不準拠の場合は不合格）
6. 難易度適合性: 指定難易度に完全に適した語彙・構文か（不適合の場合は不合格）
7. 質問品質: 問題文と選択肢が完全に適切か（不適切な場合は不合格）
8. 解答根拠: 正解の根拠が文書内に明確かつ確実にあるか（曖昧な場合は不合格）
` : `
1. 語数適合性: 期待範囲内の語数に厳密にあるか（範囲外の場合は不合格）
2. 文法正確性: 完全に自然で正確な英語表現か（誤りがある場合は不合格）
3. 内容妥当性: ビジネス文書として完全に自然か（不自然な場合は不合格）
4. 構造適合性: TOEIC Part 7の形式に完全に準拠しているか（不準拠の場合は不合格）
5. 難易度適合性: 指定難易度に完全に適した語彙・構文か（不適合の場合は不合格）
6. 質問品質: 問題文と選択肢が完全に適切か（不適切な場合は不合格）
7. 解答根拠: 正解の根拠が文書内または図表データ内に明確かつ確実にあるか（曖昧な場合は不合格）
${hasChart && chartData ? `8. 図表整合性: 図表データが文書内容と整合し、図表への参照が適切か（不整合の場合は不合格）` : ''}
`}

【出力形式】
以下のJSON形式で日本語で回答してください：

{
  "passed": true/false,
  "score": 0-100の数値,
  "issues": [
    {
      "category": "文法|内容|構造|難易度|TOEIC準拠|語数|図表整合性",
      "severity": "軽微|中程度|重大|致命的",
      "description": "具体的な問題の説明（日本語）",
      "suggestion": "改善提案（日本語、あれば）"
    }
  ],
  "recommendation": "合格|不合格|修正必要"
}

【判定基準】
**厳格評価ルール：一つでも条件に一致しないものがあれば不適格とする**

- **合格条件**: 全ての評価項目が基準を満たしている場合のみ approve (Score 90-100)
- **不合格条件**: 一つでも評価項目で問題がある場合は reject (Score 0-89)
- **必須条件（一つでも満たさない場合は自動的に reject）**:
  1. 語数が指定範囲内にある
  2. 文法的に正確である
  3. 内容が自然で適切である
  4. TOEIC Part 7形式に準拠している
  5. 指定難易度に適している
  6. 質問が適切である
  7. 正解の根拠が明確である

- Critical, High, Medium severity の issue が一つでもある場合は自動的に reject
`;
}

// JSON解析関数
function parseQualityCheckResult(response) {
  try {
    // JSONブロックを抽出
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("JSON形式の応答が見つかりません");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // 基本的な形式チェック
    if (typeof parsed.passed !== 'boolean' || 
        typeof parsed.score !== 'number' || 
        !Array.isArray(parsed.issues)) {
      throw new Error("応答形式が不正です");
    }

    return {
      passed: parsed.passed,
      score: Math.max(0, Math.min(100, parsed.score)), // 0-100の範囲に制限
      issues: parsed.issues.map((issue) => ({
        category: issue.category || '内容',
        severity: issue.severity || '中程度',
        description: issue.description || '詳細不明',
        suggestion: issue.suggestion
      })),
      recommendation: parsed.recommendation || '不合格'
    };
  } catch (error) {
    console.error("Failed to parse quality check result:", error);
    return {
      passed: false,
      score: 0,
      issues: [{
        category: '内容',
        severity: '致命的',
        description: '品質チェック結果の解析に失敗しました'
      }],
      recommendation: '不合格'
    };
  }
}

// 本文専用の品質チェック関数
export async function checkContentQuality(
  passageContent,
  difficulty,
  hasChart = false,
  expectedWordRange = null,
  originalGenerationPrompt = null,
  batchId = null,
  passageId = null,
  chartData = null
) {
  try {
    const prompt = createContentQualityCheckPrompt(passageContent, difficulty, hasChart, expectedWordRange, originalGenerationPrompt, chartData);
    
    // 本文品質チェックプロンプトをログ保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'checkContentQuality',
        promptType: 'content_quality_check',
        prompt,
        metadata: {
          passageId,
          checkType: 'content_only'
        }
      });
    }
    
    const messages = [
      {
        role: "system",
        content: "あなたはTOEIC Part 7文書の品質管理専門家です。文書の品質を厳格に評価し、TOEICの出題基準に準拠しているかを判定してください。回答は必ず日本語で行い、JSON形式で出力してください。"
      },
      {
        role: "user",
        content: prompt
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.1,
      max_tokens: 1500
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error("OpenAI APIからの応答が空です");
    }

    // 本文品質チェック結果をログ保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'checkContentQuality',
        promptType: 'content_quality_check_response',
        prompt: result,
        metadata: {
          passageId,
          checkType: 'content_only',
          rawResponse: true
        }
      });
    }

    const qualityResult = parseQualityCheckResult(result);
    
    // プロンプト情報も返すようにオブジェクトを拡張
    return {
      ...qualityResult,
      promptData: {
        systemPrompt: messages[0].content,
        userPrompt: messages[1].content,
        response: result,
        promptType: 'content_quality_check',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("Content quality check failed:", error);
    return {
      passed: false,
      score: 0,
      issues: [{
        category: '内容',
        severity: '致命的',
        description: `本文品質チェック処理でエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      }],
      recommendation: '不合格'
    };
  }
}

// 問題文専用の品質チェック関数
export async function checkQuestionsQuality(
  passageContent,
  questions,
  difficulty,
  hasChart = false,
  batchId = null,
  passageId = null,
  chartData = null
) {
  try {
    const prompt = createQuestionsQualityCheckPrompt(passageContent, questions, difficulty, hasChart, chartData);
    
    // 問題文品質チェックプロンプトをログ保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'checkQuestionsQuality',
        promptType: 'questions_quality_check',
        prompt,
        metadata: {
          passageId,
          checkType: 'questions_only'
        }
      });
    }
    
    const messages = [
      {
        role: "system",
        content: "あなたはTOEIC Part 7問題の品質管理専門家です。問題文の品質を厳格に評価し、TOEICの出題基準に準拠しているかを判定してください。回答は必ず日本語で行い、JSON形式で出力してください。"
      },
      {
        role: "user",
        content: prompt
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.1,
      max_tokens: 1500
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error("OpenAI APIからの応答が空です");
    }

    // 問題文品質チェック結果をログ保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'checkQuestionsQuality',
        promptType: 'questions_quality_check_response',
        prompt: result,
        metadata: {
          passageId,
          checkType: 'questions_only',
          rawResponse: true
        }
      });
    }

    const qualityResult = parseQualityCheckResult(result);
    
    // プロンプト情報も返すようにオブジェクトを拡張
    return {
      ...qualityResult,
      promptData: {
        systemPrompt: messages[0].content,
        userPrompt: messages[1].content,
        response: result,
        promptType: 'questions_quality_check',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("Questions quality check failed:", error);
    return {
      passed: false,
      score: 0,
      issues: [{
        category: '問題品質',
        severity: '致命的',
        description: `問題文品質チェック処理でエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      }],
      recommendation: '不合格'
    };
  }
}

// 全体統合品質チェック実行関数
export async function checkPassageQuality(
  passageContent,
  questions,
  difficulty,
  hasChart = false,
  expectedWordRange = null,
  originalGenerationPrompt = null,
  batchId = null,
  passageId = null,
  chartData = null
) {
  try {
    const prompt = createQualityCheckPrompt(passageContent, questions, difficulty, hasChart, expectedWordRange, originalGenerationPrompt, chartData);
    
    // 品質チェックプロンプトをログ保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'checkPassageQuality',
        promptType: 'quality_check',
        prompt,
        metadata: {
          passageId,
          checkType: 'toeic_part7_quality'
        }
      });
    }
    
    const messages = [
      {
        role: "system",
        content: "あなたはTOEIC Part 7問題の品質管理専門家です。問題の品質を厳格に評価し、TOEICの出題基準に準拠しているかを判定してください。回答は必ず日本語で行い、JSON形式で出力してください。"
      },
      {
        role: "user",
        content: prompt
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.1,
      max_tokens: 1500
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error("OpenAI APIからの応答が空です");
    }

    // 品質チェック結果（生のレスポンス）をログ保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'checkPassageQuality',
        promptType: 'quality_check_response',
        prompt: result,
        metadata: {
          passageId,
          checkType: 'toeic_part7_quality',
          rawResponse: true
        }
      });
    }

    const qualityResult = parseQualityCheckResult(result);
    
    // プロンプト情報も返すようにオブジェクトを拡張
    return {
      ...qualityResult,
      promptData: {
        systemPrompt: messages[0].content,
        userPrompt: messages[1].content,
        response: result,
        promptType: 'quality_check',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("Quality check failed:", error);
    // エラー時は保守的に不合格とする
    return {
      passed: false,
      score: 0,
      issues: [{
        category: '内容',
        severity: '致命的',
        description: `品質チェック処理でエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      }],
      recommendation: '不合格'
    };
  }
}

// 本文専用修正機能
export async function reviseContentBasedOnQualityCheck(
  originalContent,
  contentQualityCheckResult,
  difficulty,
  type,
  batchId = null,
  passageId = null,
  chartData = null
) {
  try {
    const { PROMPT_TEMPLATES } = await import('./prompt-templates.js');
    const prompt = PROMPT_TEMPLATES.reviseContentBasedOnQualityCheck(
      originalContent,
      contentQualityCheckResult,
      difficulty,
      type,
      chartData
    );
    
    // 本文修正プロンプトをログ保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'reviseContentBasedOnQualityCheck',
        promptType: 'content_revision',
        prompt,
        metadata: {
          passageId,
          revisionType: 'content_quality_check_based',
          originalScore: contentQualityCheckResult.score
        }
      });
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたはTOEIC Part 7文書の修正専門家です。本文の品質チェック結果に基づいて文書を改善し、すべての指摘事項を解決してください。回答は必ず日本語で行い、JSON形式で出力してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error("OpenAI APIからの本文修正結果が空です");
    }

    // 本文修正結果をログ保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'reviseContentBasedOnQualityCheck',
        promptType: 'content_revision_response',
        prompt: result,
        metadata: {
          passageId,
          revisionType: 'content_quality_check_based_response'
        }
      });
    }

    // JSON解析
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("JSON形式の本文修正結果が見つかりません");
      }

      const parsedRevision = JSON.parse(jsonMatch[0]);
      
      if (!parsedRevision.revisedContent) {
        throw new Error("本文修正結果の形式が不正です");
      }

      return {
        success: true,
        revisedContent: parsedRevision.revisedContent,
        revisedContentTranslation: parsedRevision.revisedContentTranslation || "",
        revisionNotes: parsedRevision.revisionNotes || "本文修正が完了しました",
        originalScore: contentQualityCheckResult.score,
        promptData: {
          systemPrompt: "本文修正専門家として品質チェック結果に基づく修正",
          userPrompt: prompt,
          response: result,
          promptType: 'content_revision',
          timestamp: new Date().toISOString()
        }
      };
    } catch (parseError) {
      return {
        success: false,
        error: "本文修正結果の解析に失敗しました",
        rawResponse: result
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `本文修正処理でエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
      originalScore: contentQualityCheckResult.score
    };
  }
}

// 問題文専用修正機能
export async function reviseQuestionsBasedOnQualityCheck(
  content,
  originalQuestions,
  questionsQualityCheckResult,
  difficulty,
  type,
  batchId = null,
  passageId = null,
  chartData = null
) {
  try {
    const { PROMPT_TEMPLATES } = await import('./prompt-templates.js');
    const prompt = PROMPT_TEMPLATES.reviseQuestionsBasedOnQualityCheck(
      content,
      originalQuestions,
      questionsQualityCheckResult,
      difficulty,
      type,
      chartData
    );
    
    // 問題文修正プロンプトをログ保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'reviseQuestionsBasedOnQualityCheck',
        promptType: 'questions_revision',
        prompt,
        metadata: {
          passageId,
          revisionType: 'questions_quality_check_based',
          originalScore: questionsQualityCheckResult.score
        }
      });
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたはTOEIC Part 7問題の修正専門家です。問題文の品質チェック結果に基づいて質問を改善し、すべての指摘事項を解決してください。回答は必ず日本語で行い、JSON形式で出力してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error("OpenAI APIからの問題文修正結果が空です");
    }

    // 問題文修正結果をログ保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'reviseQuestionsBasedOnQualityCheck',
        promptType: 'questions_revision_response',
        prompt: result,
        metadata: {
          passageId,
          revisionType: 'questions_quality_check_based_response'
        }
      });
    }

    // JSON解析
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("JSON形式の問題文修正結果が見つかりません");
      }

      const parsedRevision = JSON.parse(jsonMatch[0]);
      
      if (!parsedRevision.revisedQuestions || !Array.isArray(parsedRevision.revisedQuestions)) {
        throw new Error("問題文修正結果の形式が不正です");
      }

      return {
        success: true,
        revisedQuestions: parsedRevision.revisedQuestions,
        revisionNotes: parsedRevision.revisionNotes || "問題文修正が完了しました",
        originalScore: questionsQualityCheckResult.score,
        promptData: {
          systemPrompt: "あなたはTOEIC Part 7問題の修正専門家です。問題文の品質チェック結果に基づいて質問を改善し、すべての指摘事項を解決してください。回答は必ず日本語で行い、JSON形式で出力してください。",
          userPrompt: prompt,
          response: result,
          promptType: 'questions_revision',
          timestamp: new Date().toISOString()
        }
      };
    } catch (parseError) {
      return {
        success: false,
        error: "問題文修正結果の解析に失敗しました",
        rawResponse: result
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `問題文修正処理でエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
      originalScore: questionsQualityCheckResult.score
    };
  }
}

// 統合修正機能（互換性のため保持）
export async function revisePassageBasedOnQualityCheck(
  originalContent,
  questions,
  qualityCheckResult,
  difficulty,
  type,
  batchId = null,
  passageId = null
) {
  try {
    const { PROMPT_TEMPLATES } = await import('./prompt-templates.js');
    const prompt = PROMPT_TEMPLATES.reviseBasedOnQualityCheck(
      originalContent,
      questions,
      qualityCheckResult,
      difficulty,
      type
    );
    
    // 修正プロンプトをログ保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'revisePassageBasedOnQualityCheck',
        promptType: 'revision',
        prompt,
        metadata: {
          passageId,
          revisionType: 'quality_check_based',
          originalScore: qualityCheckResult.score
        }
      });
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたはTOEIC Part 7問題の修正専門家です。品質チェック結果に基づいて問題を改善し、すべての指摘事項を解決してください。回答は必ず日本語で行い、JSON形式で出力してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // 修正なので一貫性を重視
      max_tokens: 2000
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error("OpenAI APIからの修正結果が空です");
    }

    // 修正結果をログ保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'revisePassageBasedOnQualityCheck',
        promptType: 'revision_response',
        prompt: result,
        metadata: {
          passageId,
          revisionType: 'quality_check_based_response'
        }
      });
    }

    // JSON解析
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("修正結果にJSON形式が見つかりません:", result);
        throw new Error("JSON形式の修正結果が見つかりません");
      }

      console.log("修正結果のJSON解析を開始:", jsonMatch[0].substring(0, 200) + "...");
      const parsedRevision = JSON.parse(jsonMatch[0]);
      
      // 基本的な形式チェック
      if (!parsedRevision.content || !parsedRevision.questions || !Array.isArray(parsedRevision.questions)) {
        console.error("修正結果の形式が不正です:", parsedRevision);
        throw new Error("修正結果の形式が不正です");
      }

      console.log("修正結果の解析成功:");
      console.log(`- 修正後語数: ${parsedRevision.content.split(/\s+/).length}`);
      console.log(`- 質問数: ${parsedRevision.questions.length}`);

      return {
        success: true,
        revisedContent: parsedRevision.content,
        revisedContentTranslation: parsedRevision.contentTranslation || "",
        revisedQuestions: parsedRevision.questions,
        revisionNotes: parsedRevision.revisionNotes || "修正が完了しました",
        originalScore: qualityCheckResult.score
      };
    } catch (parseError) {
      console.error("修正結果の解析に失敗:", parseError);
      return {
        success: false,
        error: "修正結果の解析に失敗しました",
        rawResponse: result
      };
    }
  } catch (error) {
    console.error("品質チェック結果に基づく修正でエラーが発生:", error);
    return {
      success: false,
      error: `修正処理でエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
      originalScore: qualityCheckResult.score
    };
  }
}