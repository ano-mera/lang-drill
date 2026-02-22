// OpenAI APIを使用した問題生成機能
import openai, { PART7_PART7_GENERATION_CONFIG } from "./openai-config.js";
import { PROMPT_TEMPLATES, TOPIC_DIFFICULTY_COMBINATIONS, BUSINESS_TOPICS, generateTopicDifficultyCombination, getTopicsForDifficulty, DOCUMENT_TYPES, TWO_DOCUMENT_COMBINATIONS, MULTI_DOCUMENT_QUESTION_TYPES, TOEIC_COMBINATIONS, selectWeightedRandomCombination } from "./prompt-templates.js";
import { logPromptToFile } from "./prompt-logger.js";
import { checkPassageQuality, checkContentQuality, checkQuestionsQuality, revisePassageBasedOnQualityCheck, reviseContentBasedOnQualityCheck, reviseQuestionsBasedOnQualityCheck } from "./quality-checker-wrapper.js";

// APIコスト制限設定
export const API_COST_LIMITS = {
  maxTotalRetries: 2, // 全体の最大リトライ回数
  retryDelay: 1000, // リトライ間隔（ミリ秒）
  enableCostSavingMode: false, // コスト削減モード（必要に応じて有効化）
};

// コスト制限設定を変更する関数
export function updateCostLimits(newLimits) {
  Object.assign(API_COST_LIMITS, newLimits);
  console.log("💰 APIコスト制限設定を更新しました:", API_COST_LIMITS);
}

// コスト制限設定をリセットする関数
export function resetCostLimits() {
  Object.assign(API_COST_LIMITS, {
    maxTotalRetries: 2,
    retryDelay: 1000,
    enableCostSavingMode: false,
  });
  console.log("💰 APIコスト制限設定をリセットしました");
}

// コスト削減モードを有効にする関数
export function enableCostSavingMode() {
  Object.assign(API_COST_LIMITS, {
    maxTotalRetries: 1, // 最小限のリトライ
    enableCostSavingMode: true,
  });
  console.log("💰 コスト削減モードを有効にしました:", API_COST_LIMITS);
}

// 単語数カウント関数
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

// JSON解析関数（エラーハンドリング付き）
function parseJSON(jsonString) {
  try {
    // バッククォートやコードブロックを除去
    const cleaned = jsonString.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("JSON解析エラー:", error);
    return null;
  }
}

// 正解フィールドが正しい記号形式かを検証し、エラーを収集する関数
function validateCorrectAnswerFormat(questions) {
  const errors = [];
  const validatedQuestions = questions.map((question) => {
    const { correct, id, options } = question;

    // 正解が記号（A、B、C、D）の場合は正常
    if (["A", "B", "C", "D"].includes(correct)) {
      return question;
    }

    // 記号以外の場合は選択肢と照合して変換を試みる
    console.log(`⚠️ 問題 ${id}: 正解フィールドが記号形式ではありません ("${correct.substring(0, 100)}...")。変換を試みます...`);
    
    // 選択肢をログ出力
    console.log(`📝 問題 ${id}の選択肢:`, options.map((opt, i) => `${String.fromCharCode(65 + i)}: "${opt.substring(0, 50)}..."`));
    
    // 選択肢との完全一致を確認
    const matchingIndex = options.findIndex(option => option.trim() === correct.trim());
    if (matchingIndex !== -1) {
      const convertedSymbol = String.fromCharCode(65 + matchingIndex); // A, B, C, D
      console.log(`✅ 問題 ${id}: 正解を完全一致で "${convertedSymbol}" に変換しました`);
      return {
        ...question,
        correct: convertedSymbol
      };
    }

    // 部分一致を確認（最初の50文字で比較）
    const shortCorrect = correct.substring(0, 50);
    const partialMatchIndex = options.findIndex(option => 
      option.trim().substring(0, 50) === shortCorrect.trim()
    );
    if (partialMatchIndex !== -1) {
      const convertedSymbol = String.fromCharCode(65 + partialMatchIndex);
      console.log(`✅ 問題 ${id}: 正解を部分一致で "${convertedSymbol}" に変換しました`);
      return {
        ...question,
        correct: convertedSymbol
      };
    }

    // さらに緩い条件での一致を確認（大文字小文字を無視、句読点を無視）
    const normalizedCorrect = correct.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const normalizedMatchIndex = options.findIndex(option => {
      const normalizedOption = option.toLowerCase().replace(/[^\w\s]/g, '').trim();
      return normalizedOption === normalizedCorrect;
    });
    if (normalizedMatchIndex !== -1) {
      const convertedSymbol = String.fromCharCode(65 + normalizedMatchIndex);
      console.log(`✅ 問題 ${id}: 正解を正規化一致で "${convertedSymbol}" に変換しました`);
      return {
        ...question,
        correct: convertedSymbol
      };
    }

    // 変換できない場合はエラーとして記録
    const errorMessage = `問題 ${id}: 正解フィールド "${correct.substring(0, 100)}..." を記号に変換できませんでした。選択肢との一致が見つかりません。`;
    console.error(`❌ ${errorMessage}`);
    errors.push(errorMessage);
    
    return question;
  });

  return {
    questions: validatedQuestions,
    errors: errors
  };
}

// 一意のIDを生成する関数
function generateUniqueId(existingPassages, prefix = "passage") {
  // 既存のIDを取得
  const existingIds = new Set(existingPassages.map((p) => p.id));

  // 既存のIDから最大の番号を取得
  let maxNumber = 0;
  existingIds.forEach((id) => {
    const match = id.match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) {
      const number = parseInt(match[1]);
      if (number > maxNumber) {
        maxNumber = number;
      }
    }
  });

  // 次の番号を生成
  let nextNumber = maxNumber + 1;
  let newId = `${prefix}${nextNumber}`;

  // 万が一重複した場合の対策（連番を増やして重複を避ける）
  while (existingIds.has(newId)) {
    nextNumber++;
    newId = `${prefix}${nextNumber}`;
  }

  return newId;
}




// 文書生成
export async function generatePassage(type, difficulty, topic, batchId = null) {
  try {
    const prompt = PROMPT_TEMPLATES.generatePassage(type, difficulty, topic);
    
    // プロンプトログを保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'generatePassage',
        type,
        difficulty,
        topic,
        promptType: 'content_generation',
        prompt
      });
    }

    const response = await openai.chat.completions.create({
      model: PART7_GENERATION_CONFIG.model,
      messages: [
        {
          role: "system",
          content: "You are an expert in creating TOEIC Part7 reading passages. Always respond in valid JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: PART7_GENERATION_CONFIG.max_completion_tokens,
      temperature: PART7_GENERATION_CONFIG.temperature,
    });

    const content = response.choices[0].message.content;
    const passageData = parseJSON(content);

    if (!passageData) {
      throw new Error("文書生成に失敗しました");
    }

    return passageData;
  } catch (error) {
    console.error("文書生成エラー:", error);
    throw error;
  }
}

// 問題生成
export async function generateQuestions(passageContent, passageType, batchId = null) {
  try {
    const prompt = PROMPT_TEMPLATES.generateQuestions(passageContent, passageType);
    
    // プロンプトログを保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'generateQuestions',
        passageType,
        promptType: 'questions_generation',
        prompt,
        metadata: {
          passageContentLength: passageContent.length
        }
      });
    }

    const response = await openai.chat.completions.create({
      model: PART7_GENERATION_CONFIG.model,
      messages: [
        {
          role: "system",
          content: "You are an expert in creating TOEIC Part7 questions. Always respond in valid JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: PART7_GENERATION_CONFIG.max_completion_tokens,
      temperature: PART7_GENERATION_CONFIG.temperature,
    });

    const content = response.choices[0].message.content;
    const questionsData = parseJSON(content);

    if (!questionsData || !questionsData.questions) {
      throw new Error("問題生成に失敗しました");
    }

    return questionsData.questions;
  } catch (error) {
    console.error("問題生成エラー:", error);
    throw error;
  }
}

// 品質チェック（正解フィールド形式の検証付き）
export async function validatePassage(passageData) {
  try {
    console.log("🔧 品質チェック: 正解フィールド形式を検証");
    
    // 正解フィールドの形式を検証
    const validationResult = validateCorrectAnswerFormat(passageData.questions);
    
    // エラーがある場合は失敗として扱う
    const hasFormatErrors = validationResult.errors.length > 0;
    
    if (hasFormatErrors) {
      console.warn("⚠️ 正解フィールド形式エラーが検出されました:", validationResult.errors);
    }
    
    return {
      isValid: !hasFormatErrors, // エラーがある場合は無効
      issues: validationResult.errors,
      suggestions: hasFormatErrors ? ["プロンプトテンプレートの正解フィールド指示を確認してください"] : [],
      wordCount: passageData.content.split(/\s+/).length,
      difficulty: passageData.metadata?.difficulty || "medium",
      correctedPassage: {
        ...passageData,
        questions: validationResult.questions
      }
    };
  } catch (error) {
    console.error("品質チェックエラー:", error);
    return {
      isValid: false,
      issues: ["品質チェック中にエラーが発生しました: " + error.message],
      suggestions: ["システム管理者に連絡してください"],
      wordCount: 0,
      difficulty: passageData.metadata?.difficulty || "medium"
    };
  }
}

// 完全な問題セット生成
export async function generateCompletePassage(passageId, type, difficulty, topic, existingPassages = [], batchId = null) {
  // 一意のIDを生成（passageIdが指定されていない場合）
  const finalPassageId = passageId || generateUniqueId(existingPassages, "passage");
  
  // プロンプト情報を収集する配列
  const promptData = {
    generationPrompts: [],
    qualityCheckPrompts: [],
    revisionPrompts: []
  };
  
  try {
    console.log(`生成開始: ${finalPassageId} (${type}, ${difficulty}, ${topic})`);

    // 1. 本文生成
    const passageData = await generatePassage(type, difficulty, topic, batchId);
    console.log("本文生成完了");
    
    // 本文生成プロンプトを収集
    if (batchId) {
      const contentPrompt = PROMPT_TEMPLATES.generatePassage(type, difficulty, topic);
      promptData.generationPrompts.push({
        prompt: contentPrompt,
        promptType: 'content_generation',
        metadata: { type, difficulty, topic, step: '本文生成' }
      });
    }

    // 2. 本文品質チェック
    let finalContent = passageData.content;
    let finalContentTranslation = passageData.contentTranslation || "";
    let contentQualityCheck = null;
    
    if (batchId) {
      console.log("本文品質チェック実行中...");
      contentQualityCheck = await checkContentQuality(
        finalContent,
        difficulty,
        false, // hasChart - will be set later for chart problems
        undefined, // expectedWordRange
        undefined, // originalGenerationPrompt
        batchId,
        finalPassageId,
        null // chartData - will be updated for chart problems
      );
      
      // 本文品質チェックプロンプトを収集
      if (contentQualityCheck && contentQualityCheck.promptData) {
        promptData.qualityCheckPrompts.push(contentQualityCheck.promptData);
      }
      
      console.log(`本文品質チェック完了: ${contentQualityCheck.passed ? '合格' : '不合格'} (スコア: ${contentQualityCheck.score})`);
      
      // 3. 本文修正（不合格の場合）
      if (!contentQualityCheck.passed) {
        console.warn(`⚠️ 本文品質チェック不合格: スコア ${contentQualityCheck.score}`);
        console.log(`🔧 本文修正を開始します...`);
        
        try {
          const contentRevisionResult = await reviseContentBasedOnQualityCheck(
            finalContent,
            contentQualityCheck,
            difficulty,
            passageData.type,
            batchId,
            finalPassageId,
            null // chartData
          );
          
          if (contentRevisionResult.success) {
            console.log(`✅ 本文修正完了: ${contentRevisionResult.revisionNotes}`);
            finalContent = contentRevisionResult.revisedContent;
            finalContentTranslation = contentRevisionResult.revisedContentTranslation;
            
            // 本文修正プロンプトを収集
            if (contentRevisionResult.promptData) {
              promptData.revisionPrompts.push(contentRevisionResult.promptData);
            }
            
            // 修正後の本文再検証
            console.log(`🔍 本文修正後の再検証実行中...`);
            const contentRecheckResult = await checkContentQuality(
              finalContent,
              difficulty,
              false,
              undefined,
              undefined,
              batchId,
              `${finalPassageId}_content_revised`,
              null
            );
            
            console.log(`本文修正後再検証完了: ${contentRecheckResult.passed ? '合格' : '不合格'} (スコア: ${contentRecheckResult.score})`);
            contentQualityCheck = contentRecheckResult; // 最新の結果で更新
            
            // 修正後の再検証プロンプトも収集
            if (contentRecheckResult && contentRecheckResult.promptData) {
              promptData.qualityCheckPrompts.push(contentRecheckResult.promptData);
            }
          } else {
            console.error(`❌ 本文修正に失敗: ${contentRevisionResult.error}`);
          }
        } catch (error) {
          console.error(`❌ 本文修正処理でエラー: ${error.message}`);
        }
      } else {
        console.log(`✅ 本文品質チェック合格: スコア ${contentQualityCheck.score}`);
      }
    }
    
    console.log(`📝 本文フェーズ完了 - 問題生成フェーズに進みます`);

    // 4. 問題生成（修正済み本文を使用）
    const questions = await generateQuestions(finalContent, passageData.type, batchId);
    console.log("問題生成完了");
    
    // 問題生成プロンプトを収集
    if (batchId) {
      const questionsPrompt = PROMPT_TEMPLATES.generateQuestions(finalContent, passageData.type);
      promptData.generationPrompts.push({
        prompt: questionsPrompt,
        promptType: 'questions_generation',
        metadata: { type: passageData.type, difficulty, contentLength: finalContent.length, step: '問題生成' }
      });
    }

    // 5. 問題フォーマット検証
    const originalQuestions = questions.questions || questions;
    const validationResult = validateCorrectAnswerFormat(originalQuestions);
    let correctedQuestions = validationResult.questions;
    
    // フォーマットエラーがある場合はエラーを投げる
    if (validationResult.errors.length > 0) {
      const errorMessage = `正解フィールド形式エラー: ${validationResult.errors.join(', ')}`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // 6. 問題文品質チェック
    let questionsQualityCheck = null;
    
    if (batchId) {
      console.log("問題文品質チェック実行中...");
      questionsQualityCheck = await checkQuestionsQuality(
        finalContent,
        correctedQuestions,
        difficulty,
        false, // hasChart
        batchId,
        finalPassageId,
        null // chartData
      );
      
      console.log(`問題文品質チェック完了: ${questionsQualityCheck.passed ? '合格' : '不合格'} (スコア: ${questionsQualityCheck.score})`);
      
      // 問題文品質チェックプロンプトを収集
      if (questionsQualityCheck && questionsQualityCheck.promptData) {
        promptData.qualityCheckPrompts.push(questionsQualityCheck.promptData);
      }
      
      // 7. 問題文修正（不合格の場合）
      if (!questionsQualityCheck.passed) {
        console.warn(`⚠️ 問題文品質チェック不合格: スコア ${questionsQualityCheck.score}`);
        console.log(`🔧 問題文修正を開始します...`);
        
        try {
          const questionsRevisionResult = await reviseQuestionsBasedOnQualityCheck(
            finalContent,
            correctedQuestions,
            questionsQualityCheck,
            difficulty,
            passageData.type,
            batchId,
            finalPassageId,
            null // chartData
          );
          
          if (questionsRevisionResult.success) {
            console.log(`✅ 問題文修正完了: ${questionsRevisionResult.revisionNotes}`);
            correctedQuestions = questionsRevisionResult.revisedQuestions;
            
            // 問題文修正プロンプトを収集
            if (questionsRevisionResult.promptData) {
              promptData.revisionPrompts.push(questionsRevisionResult.promptData);
            }
            
            // 修正後の問題文再検証
            console.log(`🔍 問題文修正後の再検証実行中...`);
            const questionsRecheckResult = await checkQuestionsQuality(
              finalContent,
              correctedQuestions,
              difficulty,
              false,
              batchId,
              `${finalPassageId}_questions_revised`,
              null
            );
            
            console.log(`問題文修正後再検証完了: ${questionsRecheckResult.passed ? '合格' : '不合格'} (スコア: ${questionsRecheckResult.score})`);
            
            // 問題文修正後の再検証プロンプトも収集
            if (questionsRecheckResult && questionsRecheckResult.promptData) {
              promptData.qualityCheckPrompts.push(questionsRecheckResult.promptData);
            }
            questionsQualityCheck = questionsRecheckResult; // 最新の結果で更新
          } else {
            console.error(`❌ 問題文修正に失敗: ${questionsRevisionResult.error}`);
          }
        } catch (error) {
          console.error(`❌ 問題文修正処理でエラー: ${error.message}`);
        }
      } else {
        console.log(`✅ 問題文品質チェック合格: スコア ${questionsQualityCheck.score}`);
      }
    }

    // 8. 完全な問題セットを構築
    const completePassage = {
      id: finalPassageId,
      title: passageData.title || "",
      type: passageData.type,
      content: finalContent,
      contentTranslation: finalContentTranslation,
      questions: correctedQuestions,
      metadata: {
        difficulty: passageData.difficulty,
        estimatedTime: 300,
        wordCount: countWords(finalContent),
        questionCount: correctedQuestions.length,
        passageType: passageData.type,
        topic: passageData.topic,
      },
      partType: 'part7_single_text',
      toeicPart: 'part7_single_text',
    };

    // 9. 最終検証と品質チェック結果統合
    const validation = await validatePassage(completePassage);
    console.log("フォーマットチェック完了:", validation.isValid);

    if (!validation.isValid) {
      console.warn("フォーマットチェックで問題が見つかりました:", validation.issues);
    }

    // 品質チェック結果を統合
    let qualityCheck = null;
    if (contentQualityCheck && questionsQualityCheck) {
      qualityCheck = {
        passed: contentQualityCheck.passed && questionsQualityCheck.passed,
        score: Math.min(contentQualityCheck.score, questionsQualityCheck.score),
        issues: [...(contentQualityCheck.issues || []), ...(questionsQualityCheck.issues || [])],
        recommendation: (contentQualityCheck.passed && questionsQualityCheck.passed) ? '合格' : '不合格',
        contentCheck: contentQualityCheck,
        questionsCheck: questionsQualityCheck
      };
      
      completePassage.metadata.qualityCheck = qualityCheck;
      console.log(`🎉 全体品質チェック完了: ${qualityCheck.passed ? '合格' : '不合格'} (総合スコア: ${qualityCheck.score})`);
    }

    return {
      passage: completePassage,
      validation: {
        ...validation,
        qualityCheck: qualityCheck
      },
      promptData: promptData
    };
  } catch (error) {
    console.error(`問題セット生成エラー (${finalPassageId}):`, error);
    throw error;
  }
}

// 図表付きバッチ生成
export async function generateBatchPassagesWithCharts(count = 5, existingPassages = [], difficulty = "all", batchId = null) {
  const results = [];
  const errors = [];
  let totalAPICalls = 0;
  let diversityImprovements = 0;

  console.log("💰 バッチ生成を開始します");

  for (let i = 0; i < count; i++) {
    try {
      // 一意のIDを生成（図表付き問題用のプレフィックス）
      const passageId = generateUniqueId(existingPassages, "chart_passage");
      
      // TOEIC_COMBINATIONSを使用した重み付きランダム選択
      const weightedCombination = selectWeightedRandomCombination();
      const type = weightedCombination.document_type;
      const topic = weightedCombination.topic;

      console.log(`\n📊 図表付き問題 ${i + 1}/${count} 生成開始: ${passageId}`);

      const result = await generateCompletePassageWithChart(passageId, type, difficulty, topic, existingPassages, batchId);

      results.push(result);
      // 生成された問題を既存リストに追加して、次のID生成時に考慮する
      existingPassages.push(result.passage);
      totalAPICalls += 2; // 文書生成 + 問題生成

      console.log(`✅ 図表付き問題 ${passageId} 生成完了`);

      // API制限を避けるため少し待機
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      errors.push({
        index: i,
        error: error.message,
      });
      console.error(`❌ 図表付き問題 ${i + 1} 生成失敗:`, error.message);
    }
  }

  console.log(`\n📊 図表付き問題生成結果:`);
  console.log(`✅ 成功: ${results.length}問`);
  console.log(`❌ 失敗: ${errors.length}問`);
  console.log(`💰 推定API呼び出し回数: ${totalAPICalls}回`);

  if (errors.length > 0) {
    console.log("失敗した問題:");
    errors.forEach((error) => {
      console.log(`  - 問題 ${error.index + 1}: ${error.error}`);
    });
  }

  return results.map((result) => result.passage);
}

// バッチ生成（コスト制限付き）
export async function generateBatchPassages(count = 10, existingPassages = [], batchId = null) {
  const results = [];
  const errors = [];
  let totalAPICalls = 0;
  let diversityImprovements = 0;

  console.log("💰 バッチ生成を開始します");

  for (let i = 0; i < count; i++) {
    try {
      // 一意のIDを生成
      const passageId = generateUniqueId(existingPassages, "passage");
      // TOEIC_COMBINATIONSを使用した重み付きランダム選択
      const weightedCombination = selectWeightedRandomCombination();
      const type = weightedCombination.document_type;
      const topic = weightedCombination.topic;
      // 難易度はランダムに選択
      const difficulties = ['easy', 'medium', 'hard'];
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

      console.log(`\n📊 問題 ${i + 1}/${count} 生成開始: ${passageId}`);

      const result = await generateCompletePassage(passageId, type, difficulty, topic, existingPassages, batchId);

      results.push(result);
      // 生成された問題を既存リストに追加して、次のID生成時に考慮する
      existingPassages.push(result.passage);
      totalAPICalls += 2; // 文書生成 + 問題生成

      console.log(`✅ ${passageId} 生成完了`);

      // API制限を避けるため少し待機
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      errors.push({
        index: i,
        error: error.message,
      });
      console.error(`❌ 問題 ${i + 1} 生成失敗:`, error.message);
    }
  }

  console.log(`\n📊 問題生成結果:`);
  console.log(`✅ 成功: ${results.length}問`);
  console.log(`❌ 失敗: ${errors.length}問`);
  console.log(`💰 推定API呼び出し回数: ${totalAPICalls}回`);

  if (errors.length > 0) {
    console.log("失敗した問題:");
    errors.forEach((error) => {
      console.log(`  - 問題 ${error.index + 1}: ${error.error}`);
    });
  }

  return {
    success: results,
    errors: errors,
    total: count,
    successCount: results.length,
    errorCount: errors.length,
    estimatedAPICalls: totalAPICalls,
  };
}

// 難易度指定バッチ生成関数（統合版）
export async function generateBatchPassagesByDifficulty(count = 10, existingPassages = [], difficulty = "hard", batchId = null) {
  const results = [];
  const errors = [];
  let totalAPICalls = 0;
  let diversityImprovements = 0;

  console.log("💰 バッチ生成を開始します");

  for (let i = 0; i < count; i++) {
    try {
      // 一意のIDを生成
      const passageId = generateUniqueId(existingPassages, "passage");
      // TOEIC_COMBINATIONSを使用した重み付きランダム選択
      const weightedCombination = selectWeightedRandomCombination();
      const type = weightedCombination.document_type;
      const topic = weightedCombination.topic;

      console.log(`\n📊 ${difficulty.toUpperCase()}問題 ${i + 1}/${count} 生成開始: ${passageId}`);

      const result = await generateCompletePassage(passageId, type, difficulty, topic, existingPassages, batchId);

      results.push(result);
      // 生成された問題を既存リストに追加して、次のID生成時に考慮する
      existingPassages.push(result.passage);
      totalAPICalls += 2; // 文書生成 + 問題生成

      console.log(`✅ ${difficulty.toUpperCase()}問題 ${passageId} 生成完了`);

      // API制限を避けるため少し待機
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      errors.push({
        index: i,
        error: error.message,
      });
      console.error(`❌ ${difficulty.toUpperCase()}問題 ${i + 1} 生成失敗:`, error.message);
    }
  }

  console.log(`\n📊 ${difficulty.toUpperCase()}問題生成結果:`);
  console.log(`✅ 成功: ${results.length}問`);
  console.log(`❌ 失敗: ${errors.length}問`);
  console.log(`💰 推定API呼び出し回数: ${totalAPICalls}回`);

  if (errors.length > 0) {
    console.log("失敗した問題:");
    errors.forEach((error) => {
      console.log(`  - ${difficulty.toUpperCase()}問題 ${error.index + 1}: ${error.error}`);
    });
  }

  return {
    success: results,
    errors: errors,
    total: count,
    successCount: results.length,
    errorCount: errors.length,
    estimatedAPICalls: totalAPICalls,
  };
}

// 後方互換性のためのエイリアス
export async function generateBatchHardPassages(count = 10, existingPassages = []) {
  return generateBatchPassagesByDifficulty(count, existingPassages, "hard");
}

// 既存データベースに新しい問題を追加
export function addPassagesToDatabase(existingPassages, newPassages, batchId = null) {
  // Debug: バッチIDをログ出力
  console.log(`🔍 Debug: addPassagesToDatabase called with batchId: ${batchId}`);
  
  // 既存のIDを取得
  const existingIds = new Set(existingPassages.map((p) => p.id));
  const createdAt = new Date().toISOString();

  // newPassagesがvalidationプロパティを持つ場合（従来型）、バリデーション済みのみ追加
  if (newPassages.length > 0 && newPassages[0].validation !== undefined) {
    const validPassages = newPassages
      .filter((result) => result.validation.isValid)
      .map((result) => {
        const passage = result.passage;
        // createdAtとgenerationBatchを追加
        const updatedPassage = {
          ...passage,
          createdAt,
          ...(batchId !== null && batchId !== undefined && { generationBatch: batchId })
        };
        // Debug: 更新されたパッセージをログ出力
        console.log(`🔍 Debug: Updated passage ${passage.id} with batchId: ${batchId}, generationBatch: ${updatedPassage.generationBatch}`);
        
        // ID重複チェック - 重複がある場合は既存の問題を更新
        if (existingIds.has(passage.id)) {
          console.log(`⚠️  ID重複を検出: ${passage.id} - 既存の問題を新しい問題で更新します`);
          const existingIndex = existingPassages.findIndex(p => p.id === passage.id);
          if (existingIndex !== -1) {
            existingPassages[existingIndex] = updatedPassage;
          }
          return null; // この問題は追加リストに含めない（既存を更新したため）
        }
        
        return updatedPassage;
      })
      .filter(passage => passage !== null); // null要素を除去

    return {
      passages: [...existingPassages, ...validPassages],
    };
  }

  // 図表付き問題など、純粋なpassageデータの場合は重複チェックして追加
  const uniquePassages = newPassages
    .map((passage) => {
      // createdAtとgenerationBatchを追加
      const updatedPassage = {
        ...passage,
        createdAt,
        ...(batchId !== null && batchId !== undefined && { generationBatch: batchId })
      };
      // Debug: 更新されたパッセージをログ出力
      console.log(`🔍 Debug: Updated passage ${passage.id} with batchId: ${batchId}, generationBatch: ${updatedPassage.generationBatch}`);
      return updatedPassage;
    })
    .filter((passage) => {
      if (existingIds.has(passage.id)) {
        console.log(`⚠️  ID重複を検出: ${passage.id} は既に存在するため除外します`);
        return false;
      }
      return true;
    });

  return {
    passages: [...existingPassages, ...uniquePassages],
  };
}

// 図表付き文書生成
export async function generatePassageWithChart(type, difficulty, topic, batchId = null) {
  try {
    const prompt = PROMPT_TEMPLATES.generatePassageWithChart(type, difficulty, topic);
    
    // プロンプトログを保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'generatePassageWithChart',
        type,
        difficulty,
        topic,
        promptType: 'content_generation',
        prompt,
        metadata: {
          hasChart: true
        }
      });
    }

    const response = await openai.chat.completions.create({
      model: PART7_GENERATION_CONFIG.model,
      messages: [
        {
          role: "system",
          content: "You are an expert in creating TOEIC Part7 reading passages with charts. Always respond in valid JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: PART7_GENERATION_CONFIG.max_completion_tokens,
      temperature: PART7_GENERATION_CONFIG.temperature,
    });

    const content = response.choices[0].message.content;
    const passageData = parseJSON(content);

    if (!passageData) {
      throw new Error("図表付き文書生成に失敗しました");
    }

    return passageData;
  } catch (error) {
    console.error("図表付き文書生成エラー:", error);
    throw error;
  }
}

// 図表付き問題生成
export async function generateQuestionsWithChart(passageContent, chartData, passageType, batchId = null) {
  try {
    const prompt = PROMPT_TEMPLATES.generateQuestionsWithChart(passageContent, chartData, passageType);
    
    // プロンプトログを保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'generateQuestionsWithChart',
        passageType,
        promptType: 'questions_generation',
        prompt,
        metadata: {
          hasChart: true,
          passageContentLength: passageContent.length,
          chartType: chartData?.type || 'unknown'
        }
      });
    }

    const response = await openai.chat.completions.create({
      model: PART7_GENERATION_CONFIG.model,
      messages: [
        {
          role: "system",
          content: "You are an expert in creating TOEIC Part7 questions with charts. Always respond in valid JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: PART7_GENERATION_CONFIG.max_completion_tokens,
      temperature: PART7_GENERATION_CONFIG.temperature,
    });

    const content = response.choices[0].message.content;
    const questionsData = parseJSON(content);

    if (!questionsData || !questionsData.questions) {
      throw new Error("図表付き問題生成に失敗しました");
    }

    return questionsData.questions;
  } catch (error) {
    console.error("図表付き問題生成エラー:", error);
    throw error;
  }
}



// 図表付き完全な問題セット生成
export async function generateCompletePassageWithChart(passageId, type, difficulty, topic, existingPassages = [], batchId = null) {
  // 一意のIDを生成（passageIdが指定されていない場合）
  const finalPassageId = passageId || generateUniqueId(existingPassages, "chart_passage");
  
  // プロンプト情報を収集する配列
  const promptData = {
    generationPrompts: [],
    qualityCheckPrompts: [],
    revisionPrompts: []
  };
  
  try {
    console.log(`図表付き問題生成開始: ${finalPassageId} (${type}, ${difficulty}, ${topic})`);

    // 1. 図表付き本文生成
    const passageData = await generatePassageWithChart(type, difficulty, topic, batchId);
    console.log("図表付き本文生成完了");
    
    // 図表付き本文生成プロンプトを収集
    if (batchId) {
      const contentPrompt = PROMPT_TEMPLATES.generatePassageWithChart(type, difficulty, topic);
      promptData.generationPrompts.push({
        prompt: contentPrompt,
        promptType: 'content_generation',
        metadata: { type, difficulty, topic, hasChart: true, step: '図表付き本文生成' }
      });
    }

    // 2. 本文品質チェック
    let finalContent = passageData.content;
    let finalContentTranslation = passageData.contentTranslation || "";
    let contentQualityCheck = null;
    
    if (batchId) {
      console.log("図表付き本文品質チェック実行中...");
      contentQualityCheck = await checkContentQuality(
        finalContent,
        difficulty,
        true, // hasChart
        undefined,
        undefined,
        batchId,
        finalPassageId,
        passageData.chart
      );
      
      console.log(`図表付き本文品質チェック完了: ${contentQualityCheck.passed ? '合格' : '不合格'} (スコア: ${contentQualityCheck.score})`);
      
      // 緊急デバッグ: 品質チェック結果の詳細確認
      console.error(`🚨 EMERGENCY DEBUG: contentQualityCheck =`, JSON.stringify(contentQualityCheck, null, 2));
      console.error(`🚨 EMERGENCY DEBUG: contentQualityCheck.passed =`, contentQualityCheck.passed);
      console.error(`🚨 EMERGENCY DEBUG: typeof contentQualityCheck.passed =`, typeof contentQualityCheck.passed);
      console.error(`🚨 EMERGENCY DEBUG: !contentQualityCheck.passed =`, !contentQualityCheck.passed);
      console.error(`🚨 EMERGENCY DEBUG: contentQualityCheck.passed === false =`, contentQualityCheck.passed === false);
      console.error(`🚨 EMERGENCY DEBUG: 修正条件チェック開始`);
      
      // 強制的にコンソールに出力
      process.stderr.write(`🚨 STDERR DEBUG: contentQualityCheck.passed = ${contentQualityCheck.passed}\n`);
      
      // 3. 本文修正（不合格の場合）
      if (!contentQualityCheck.passed) {
        console.warn(`⚠️ 図表付き本文品質チェック不合格: スコア ${contentQualityCheck.score}`);
        console.log(`🔧 図表付き本文修正を開始します...`);
        console.log(`🔍 DEBUG: 本文修正処理に到達しました`);
        
        // デバッグ: 修正関数呼び出し前の状態確認
        console.log(`🔍 DEBUG: finalContent長さ =`, finalContent.length);
        console.log(`🔍 DEBUG: batchId =`, batchId);
        console.log(`🔍 DEBUG: finalPassageId =`, finalPassageId);
        
        try {
          const contentRevisionResult = await reviseContentBasedOnQualityCheck(
            finalContent,
            contentQualityCheck,
            difficulty,
            passageData.type,
            batchId,
            finalPassageId,
            passageData.chart
          );
          
          if (contentRevisionResult.success) {
            console.log(`✅ 図表付き本文修正完了: ${contentRevisionResult.revisionNotes}`);
            finalContent = contentRevisionResult.revisedContent;
            finalContentTranslation = contentRevisionResult.revisedContentTranslation;
            
            // 修正後の本文再検証
            console.log(`🔍 図表付き本文修正後の再検証実行中...`);
            const contentRecheckResult = await checkContentQuality(
              finalContent,
              difficulty,
              true,
              undefined,
              undefined,
              batchId,
              `${finalPassageId}_content_revised`,
              passageData.chart
            );
            
            console.log(`図表付き本文修正後再検証完了: ${contentRecheckResult.passed ? '合格' : '不合格'} (スコア: ${contentRecheckResult.score})`);
            contentQualityCheck = contentRecheckResult;
          } else {
            console.error(`❌ 図表付き本文修正に失敗: ${contentRevisionResult.error}`);
          }
        } catch (error) {
          console.error(`❌ 図表付き本文修正処理でエラー: ${error.message}`);
        }
      } else {
        console.log(`✅ 図表付き本文品質チェック合格: スコア ${contentQualityCheck.score}`);
        console.log(`🔍 DEBUG: 本文修正をスキップしました（品質チェック合格のため）`);
      }
    }
    
    console.log(`📊 図表付き本文フェーズ完了 - 問題生成フェーズに進みます`);

    // 4. 図表付き問題生成（修正済み本文を使用）
    const questions = await generateQuestionsWithChart(finalContent, passageData.chart, passageData.type, batchId);
    console.log("図表付き問題生成完了");

    // 5. 問題フォーマット検証
    const originalQuestions = questions.questions || questions;
    const validationResult = validateCorrectAnswerFormat(originalQuestions);
    let correctedQuestions = validationResult.questions;
    
    // フォーマットエラーがある場合はエラーを投げる
    if (validationResult.errors.length > 0) {
      const errorMessage = `図表付き問題の正解フィールド形式エラー: ${validationResult.errors.join(', ')}`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // 6. 問題文品質チェック
    let questionsQualityCheck = null;
    
    if (batchId) {
      console.log("図表付き問題文品質チェック実行中...");
      questionsQualityCheck = await checkQuestionsQuality(
        finalContent,
        correctedQuestions,
        difficulty,
        true, // hasChart
        batchId,
        finalPassageId,
        passageData.chart
      );
      
      console.log(`図表付き問題文品質チェック完了: ${questionsQualityCheck.passed ? '合格' : '不合格'} (スコア: ${questionsQualityCheck.score})`);
      
      // 7. 問題文修正（不合格の場合）
      if (!questionsQualityCheck.passed) {
        console.warn(`⚠️ 図表付き問題文品質チェック不合格: スコア ${questionsQualityCheck.score}`);
        console.log(`🔧 図表付き問題文修正を開始します...`);
        
        try {
          const questionsRevisionResult = await reviseQuestionsBasedOnQualityCheck(
            finalContent,
            correctedQuestions,
            questionsQualityCheck,
            difficulty,
            passageData.type,
            batchId,
            finalPassageId,
            passageData.chart
          );
          
          if (questionsRevisionResult.success) {
            console.log(`✅ 図表付き問題文修正完了: ${questionsRevisionResult.revisionNotes}`);
            correctedQuestions = questionsRevisionResult.revisedQuestions;
            
            // 修正後の問題文再検証
            console.log(`🔍 図表付き問題文修正後の再検証実行中...`);
            const questionsRecheckResult = await checkQuestionsQuality(
              finalContent,
              correctedQuestions,
              difficulty,
              true,
              batchId,
              `${finalPassageId}_questions_revised`,
              passageData.chart
            );
            
            console.log(`図表付き問題文修正後再検証完了: ${questionsRecheckResult.passed ? '合格' : '不合格'} (スコア: ${questionsRecheckResult.score})`);
            questionsQualityCheck = questionsRecheckResult;
          } else {
            console.error(`❌ 図表付き問題文修正に失敗: ${questionsRevisionResult.error}`);
          }
        } catch (error) {
          console.error(`❌ 図表付き問題文修正処理でエラー: ${error.message}`);
        }
      } else {
        console.log(`✅ 図表付き問題文品質チェック合格: スコア ${questionsQualityCheck.score}`);
      }
    }

    // 8. 完全な問題セットを構築
    const completePassage = {
      id: finalPassageId,
      title: passageData.title || "",
      type: passageData.type,
      content: finalContent,
      contentTranslation: finalContentTranslation,
      chart: passageData.chart,
      questions: correctedQuestions,
      hasChart: true,
      metadata: {
        difficulty: passageData.difficulty,
        estimatedTime: 300,
        wordCount: countWords(finalContent),
        questionCount: correctedQuestions.length,
        passageType: passageData.type,
        topic: passageData.topic,
        hasChart: true,
      },
      partType: 'part7_single_chart',
      toeicPart: 'part7_single_chart',
    };

    // 9. 最終検証と品質チェック結果統合
    const validation = await validatePassage(completePassage);
    console.log("フォーマットチェック完了:", validation.isValid);

    if (!validation.isValid) {
      console.warn("フォーマットチェックで問題が見つかりました:", validation.issues);
    }

    // 品質チェック結果を統合
    let qualityCheck = null;
    if (contentQualityCheck && questionsQualityCheck) {
      qualityCheck = {
        passed: contentQualityCheck.passed && questionsQualityCheck.passed,
        score: Math.min(contentQualityCheck.score, questionsQualityCheck.score),
        issues: [...(contentQualityCheck.issues || []), ...(questionsQualityCheck.issues || [])],
        recommendation: (contentQualityCheck.passed && questionsQualityCheck.passed) ? '合格' : '不合格',
        contentCheck: contentQualityCheck,
        questionsCheck: questionsQualityCheck
      };
      
      completePassage.metadata.qualityCheck = qualityCheck;
      console.log(`🎉 図表付き全体品質チェック完了: ${qualityCheck.passed ? '合格' : '不合格'} (総合スコア: ${qualityCheck.score})`);
    }

    return {
      passage: completePassage,
      validation: {
        ...validation,
        qualityCheck: qualityCheck
      },
    };
  } catch (error) {
    console.error(`図表付き問題セット生成エラー (${finalPassageId}):`, error);
    throw error;
  }
}

// 重み付き選択関数
function selectWeightedRandom(options) {
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  const random = Math.random() * totalWeight;
  let currentWeight = 0;
  
  for (const option of options) {
    currentWeight += option.weight;
    if (random <= currentWeight) {
      return option;
    }
  }
  
  return options[0]; // フォールバック
}

// 2資料問題生成
export async function generateMultiDocumentPassage(difficulty, topic, batchId = null) {
  try {
    const prompt = PROMPT_TEMPLATES.generateMultiDocumentPassage(difficulty, topic);
    
    // プロンプトログを保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'generateMultiDocumentPassage',
        difficulty,
        topic,
        promptType: 'content_generation',
        prompt,
        metadata: {
          isMultiDocument: true
        }
      });
    }

    const response = await openai.chat.completions.create({
      model: PART7_GENERATION_CONFIG.model,
      messages: [
        {
          role: "system",
          content: "You are an expert in creating TOEIC Part7 multi-document reading passages. Always respond in valid JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: PART7_GENERATION_CONFIG.max_completion_tokens,
      temperature: PART7_GENERATION_CONFIG.temperature,
    });

    const content = response.choices[0].message.content;
    const passageData = parseJSON(content);

    if (!passageData) {
      throw new Error("2資料問題生成に失敗しました");
    }

    return passageData;
  } catch (error) {
    console.error("2資料問題生成エラー:", error);
    throw error;
  }
}

// 2資料問題用の質問生成
export async function generateMultiDocumentQuestions(documents, documentTypes, difficulty, topic, batchId = null) {
  try {
    const doc1 = documents[0];
    const doc2 = documents[1];
    
    const prompt = PROMPT_TEMPLATES.generateMultiDocumentQuestions(
      doc1.content, 
      doc2.content, 
      doc1.type, 
      doc2.type, 
      difficulty, 
      topic
    );
    
    // プロンプトログを保存
    if (batchId) {
      await logPromptToFile({
        batchId,
        functionName: 'generateMultiDocumentQuestions',
        difficulty,
        topic,
        promptType: 'questions_generation',
        prompt,
        metadata: {
          isMultiDocument: true,
          doc1Type: doc1.type,
          doc2Type: doc2.type,
          doc1ContentLength: doc1.content.length,
          doc2ContentLength: doc2.content.length
        }
      });
    }

    const response = await openai.chat.completions.create({
      model: PART7_GENERATION_CONFIG.model,
      messages: [
        {
          role: "system",
          content: "You are an expert in creating TOEIC Part7 multi-document questions. Always respond in valid JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: PART7_GENERATION_CONFIG.max_completion_tokens,
      temperature: PART7_GENERATION_CONFIG.temperature,
    });

    const content = response.choices[0].message.content;
    const questionsData = parseJSON(content);

    if (!questionsData || !questionsData.questions) {
      throw new Error("2資料問題の質問生成に失敗しました");
    }

    return questionsData.questions;
  } catch (error) {
    console.error("2資料問題の質問生成エラー:", error);
    throw error;
  }
}

// 完全な2資料問題セット生成（シーケンシャルフロー）
export async function generateCompleteMultiDocumentPassage(passageId, difficulty, topic, existingPassages = [], batchId = null) {
  // 一意のIDを生成（passageIdが指定されていない場合）
  const finalPassageId = passageId || generateUniqueId(existingPassages, "passage");
  
  try {
    console.log(`🔄 2資料問題生成開始（シーケンシャルフロー）: ${finalPassageId} (${difficulty}, ${topic})`);

    // === 第1段階: 文書コンテンツ生成・検証・修正 ===
    console.log("📝 第1段階: 2資料文書コンテンツ処理開始");
    
    // 1. 2資料問題生成
    const passageData = await generateMultiDocumentPassage(difficulty, topic, batchId);
    console.log("✅ 2資料問題生成完了");
    
    // 2資料問題の場合、両方の文書内容を結合してチェック
    const combinedContent = passageData.documents.map(doc => doc.content).join('\n\n--- Document 2 ---\n\n');
    
    // 2. 文書内容の品質チェック（本文のみ）
    let contentQualityCheck = null;
    let finalContent = combinedContent;
    let finalDocuments = passageData.documents;
    
    if (batchId) {
      console.log("🔍 2資料文書内容品質チェック実行中...");
      contentQualityCheck = await checkContentQuality(
        combinedContent,
        difficulty,
        false, // hasChart
        undefined, // expectedWordRange
        undefined, // originalGenerationPrompt
        batchId,
        finalPassageId,
        null
      );
      
      console.log(`📊 2資料文書内容品質チェック完了: ${contentQualityCheck.passed ? '✅ 合格' : '❌ 不合格'} (スコア: ${contentQualityCheck.score})`);
      
      // 3. 文書内容修正（必要な場合）
      if (!contentQualityCheck.passed) {
        console.log(`🔧 2資料文書内容修正を開始します...`);
        
        // 2資料問題の場合、第1文書を代表として修正
        const revisionResult = await reviseContentBasedOnQualityCheck(
          passageData.documents[0].content,
          contentQualityCheck,
          difficulty,
          'multi_document',
          batchId,
          finalPassageId,
          null
        );
        
        if (revisionResult.success) {
          console.log(`✅ 2資料文書内容修正完了: ${revisionResult.revisionNotes}`);
          
          // 修正された第1文書を更新
          finalDocuments = [...passageData.documents];
          finalDocuments[0] = {
            ...finalDocuments[0],
            content: revisionResult.revisedContent,
            contentTranslation: revisionResult.revisedContentTranslation
          };
          
          finalContent = finalDocuments.map(doc => doc.content).join('\n\n--- Document 2 ---\n\n');
          
          // 修正後の文書内容品質チェック
          console.log(`🔍 修正後2資料文書内容品質チェック実行中...`);
          const revisedContentQualityCheck = await checkContentQuality(
            finalContent,
            difficulty,
            false,
            undefined,
            undefined,
            batchId,
            `${finalPassageId}_content_final`,
            null
          );
          
          console.log(`📊 修正後2資料文書内容品質チェック完了: ${revisedContentQualityCheck.passed ? '✅ 合格' : '❌ 不合格'} (スコア: ${revisedContentQualityCheck.score})`);
          contentQualityCheck = revisedContentQualityCheck;
        } else {
          console.warn(`⚠️ 2資料文書内容修正失敗: ${revisionResult.error}`);
        }
      }
    }
    
    console.log("✅ 第1段階完了: 2資料文書コンテンツ処理完了");
    
    // === 第2段階: 問題生成・検証・修正 ===
    console.log("📝 第2段階: 2資料問題処理開始");
    
    // 4. 2資料問題用の質問生成
    const questions = await generateMultiDocumentQuestions(finalDocuments, passageData.documentTypes, difficulty, topic, batchId);
    console.log("✅ 2資料問題の質問生成完了");

    // 5. 正解フィールド形式を検証
    const originalQuestions = questions.questions || questions;
    const validationResult = validateCorrectAnswerFormat(originalQuestions);
    let correctedQuestions = validationResult.questions;
    
    // フォーマットエラーがある場合はエラーを投げる
    if (validationResult.errors.length > 0) {
      const errorMessage = `2資料問題の正解フィールド形式エラー: ${validationResult.errors.join(', ')}`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    // 6. 問題文の品質チェック（問題文のみ）
    let questionsQualityCheck = null;
    
    if (batchId) {
      console.log("🔍 2資料問題文品質チェック実行中...");
      questionsQualityCheck = await checkQuestionsQuality(
        finalContent,
        correctedQuestions,
        difficulty,
        false, // hasChart
        batchId,
        finalPassageId,
        null
      );
      
      console.log(`📊 2資料問題文品質チェック完了: ${questionsQualityCheck.passed ? '✅ 合格' : '❌ 不合格'} (スコア: ${questionsQualityCheck.score})`);
      
      // 7. 問題文修正（必要な場合）
      if (!questionsQualityCheck.passed) {
        console.log(`🔧 2資料問題文修正を開始します...`);
        
        const revisionResult = await reviseQuestionsBasedOnQualityCheck(
          finalContent,
          correctedQuestions,
          questionsQualityCheck,
          difficulty,
          'multi_document',
          batchId,
          finalPassageId,
          null
        );
        
        if (revisionResult.success) {
          console.log(`✅ 2資料問題文修正完了: ${revisionResult.revisionNotes}`);
          correctedQuestions = revisionResult.revisedQuestions;
          
          // 修正後の問題文品質チェック
          console.log(`🔍 修正後2資料問題文品質チェック実行中...`);
          const revisedQuestionsQualityCheck = await checkQuestionsQuality(
            finalContent,
            correctedQuestions,
            difficulty,
            false,
            batchId,
            `${finalPassageId}_questions_final`,
            null
          );
          
          console.log(`📊 修正後2資料問題文品質チェック完了: ${revisedQuestionsQualityCheck.passed ? '✅ 合格' : '❌ 不合格'} (スコア: ${revisedQuestionsQualityCheck.score})`);
          questionsQualityCheck = revisedQuestionsQualityCheck;
        } else {
          console.warn(`⚠️ 2資料問題文修正失敗: ${revisionResult.error}`);
        }
      }
    }
    
    console.log("✅ 第2段階完了: 2資料問題処理完了");

    // 8. 完全な問題セットを構築
    const completePassage = {
      id: finalPassageId,
      title: passageData.title || "",
      type: finalDocuments[0].type, // 第1文書のタイプをメインタイプとする
      content: "", // 2資料問題では空文字
      contentTranslation: "", // 2資料問題では空文字
      isMultiDocument: true,
      documents: finalDocuments,
      documentTypes: passageData.documentTypes,
      questions: correctedQuestions,
      metadata: {
        difficulty: passageData.difficulty,
        estimatedTime: 400, // 2資料問題は時間がかかる
        wordCount: finalDocuments.reduce((total, doc) => total + countWords(doc.content), 0),
        questionCount: correctedQuestions.length,
        passageType: "multi_document",
        topic: passageData.topic,
      },
      partType: 'part7_double',
      toeicPart: 'part7_double',
    };

    // 9. 正解フィールド形式チェック
    const validation = await validatePassage(completePassage);
    console.log("📋 フォーマットチェック完了:", validation.isValid);

    if (!validation.isValid) {
      console.warn("⚠️ フォーマットチェックで問題が見つかりました:", validation.issues);
    }

    // 10. 品質チェック結果統合
    let qualityCheck = null;
    if (contentQualityCheck && questionsQualityCheck) {
      qualityCheck = {
        passed: contentQualityCheck.passed && questionsQualityCheck.passed,
        score: Math.min(contentQualityCheck.score, questionsQualityCheck.score),
        issues: [...(contentQualityCheck.issues || []), ...(questionsQualityCheck.issues || [])],
        recommendation: (contentQualityCheck.passed && questionsQualityCheck.passed) ? '合格' : '不合格',
        contentCheck: contentQualityCheck,
        questionsCheck: questionsQualityCheck
      };
      
      console.log(`🎯 2資料問題シーケンシャル品質チェック完了: ${qualityCheck.passed ? '✅ 合格' : '❌ 不合格'} (総合スコア: ${qualityCheck.score})`);
      
      // 品質チェック結果をpassageオブジェクトに追加
      completePassage.metadata.qualityCheck = qualityCheck;
    }

    return {
      passage: completePassage,
      validation: {
        ...validation,
        qualityCheck: qualityCheck
      },
    };
  } catch (error) {
    console.error(`2資料問題セット生成エラー (${finalPassageId}):`, error);
    throw error;
  }
}

// 2資料問題バッチ生成
export async function generateBatchMultiDocumentPassages(count = 10, existingPassages = [], difficulty = "all", batchId = null) {
  const results = [];
  const errors = [];
  let totalAPICalls = 0;

  console.log("💰 2資料問題バッチ生成を開始します");

  for (let i = 0; i < count; i++) {
    try {
      // 一意のIDを生成
      const passageId = generateUniqueId(existingPassages, "passage");
      // 指定難易度または全難易度から選択
      const combination = generateTopicDifficultyCombination(i, difficulty);

      console.log(`\n📊 2資料問題 ${i + 1}/${count} 生成開始: ${passageId}`);

      const result = await generateCompleteMultiDocumentPassage(passageId, combination.difficulty, combination.topic, existingPassages, batchId);

      results.push(result);
      // 生成された問題を既存リストに追加して、次のID生成時に考慮する
      existingPassages.push(result.passage);
      totalAPICalls += 2; // 文書生成 + 問題生成

      console.log(`✅ 2資料問題 ${passageId} 生成完了`);

      // API制限を避けるため少し待機
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      errors.push({
        index: i,
        error: error.message,
      });
      console.error(`❌ 2資料問題 ${i + 1} 生成失敗:`, error.message);
    }
  }

  console.log(`\n📊 2資料問題生成結果:`);
  console.log(`✅ 成功: ${results.length}問`);
  console.log(`❌ 失敗: ${errors.length}問`);
  console.log(`💰 推定API呼び出し回数: ${totalAPICalls}回`);

  if (errors.length > 0) {
    console.log("失敗した問題:");
    errors.forEach((error) => {
      console.log(`  - 2資料問題 ${error.index + 1}: ${error.error}`);
    });
  }

  return {
    success: results,
    errors: errors,
    total: count,
    successCount: results.length,
    errorCount: errors.length,
    estimatedAPICalls: totalAPICalls,
  };
}
