// プロンプトログ保存ユーティリティ
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// プロンプトログを保存する関数
export async function logPromptToFile(promptData) {
  try {
    const batchId = promptData.batchId || 'unknown';
    // generator/logs/prompts に固定
    const logDir = path.join(__dirname, '..', 'logs', 'prompts');
    const logFile = path.join(logDir, `prompts-${batchId}.json`);

    // ログディレクトリが存在しない場合は作成
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }

    // 同期的にファイルを読み書きして競合を防ぐ
    let existingLogs = [];
    try {
      if (fsSync.existsSync(logFile)) {
        const existingContent = fsSync.readFileSync(logFile, 'utf8');
        if (existingContent.trim()) {
          existingLogs = JSON.parse(existingContent);
        }
      }
    } catch (error) {
      // ファイルが存在しないか、破損している場合は新規作成
      console.warn(`プロンプトログファイルリセット: ${logFile}`, error.message);
      existingLogs = [];
    }

    // existingLogsが配列でない場合は修正
    if (!Array.isArray(existingLogs)) {
      existingLogs = [];
    }

    // 新しいプロンプトログを追加
    const logEntry = {
      timestamp: new Date().toISOString(),
      functionName: promptData.functionName,
      type: promptData.type || 'unknown',
      difficulty: promptData.difficulty || 'unknown',
      topic: promptData.topic || 'unknown',
      promptType: promptData.promptType || 'generation', // generation or quality_check
      prompt: promptData.prompt,
      metadata: promptData.metadata || {}
    };

    existingLogs.push(logEntry);

    // 同期的にログファイルに保存
    fsSync.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2), 'utf8');
    
    console.log(`📝 プロンプトログを保存しました: ${logFile}`);
  } catch (error) {
    console.error('プロンプトログの保存に失敗しました:', error);
  }
}

// 品質チェックプロンプトをログ保存する関数
export async function logQualityCheckPrompt(batchId, prompt, passageId) {
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

// プロンプトログを読み込む関数
export async function readPromptLogs(batchId) {
  try {
    // generator/logs/prompts に固定
    const logDir = path.join(__dirname, '..', 'logs', 'prompts');
    const logFile = path.join(logDir, `prompts-${batchId}.json`);

    // ログファイルが存在するかチェック
    try {
      await fs.access(logFile);
    } catch {
      console.warn(`プロンプトログファイルが見つかりません: ${logFile}`);
      return {
        generationPrompts: [],
        qualityCheckPrompts: [],
        revisionPrompts: []
      };
    }

    // ログファイルを読み込み
    const content = await fs.readFile(logFile, 'utf8');
    const logs = JSON.parse(content);

    // プロンプトタイプ別に分類
    const generationPrompts = [];
    const qualityCheckPrompts = [];
    const revisionPrompts = [];

    logs.forEach(log => {
      if (log.promptType && log.prompt) {
        // レスポンス（_response）は除外し、実際のプロンプトのみを収集
        if (log.promptType.endsWith('_response')) {
          return; // スキップ
        }

        const promptWithType = {
          prompt: log.prompt,
          promptType: log.promptType
        };

        if (log.promptType.includes('generation') || 
            log.promptType.includes('scene') || 
            log.promptType.includes('question') || 
            log.promptType.includes('translation')) {
          generationPrompts.push(promptWithType);
        } else if (log.promptType.includes('quality') || log.promptType.includes('check')) {
          qualityCheckPrompts.push(log.prompt);
        } else if (log.promptType.includes('revision') || log.promptType.includes('revise')) {
          revisionPrompts.push(log.prompt);
        }
      }
    });

    console.log(`📝 プロンプトログを読み込みました: ${logFile}`);
    console.log(`- 生成プロンプト: ${generationPrompts.length}件`);
    console.log(`- 品質チェックプロンプト: ${qualityCheckPrompts.length}件`);
    console.log(`- 修正プロンプト: ${revisionPrompts.length}件`);

    return {
      generationPrompts,
      qualityCheckPrompts,
      revisionPrompts
    };

  } catch (error) {
    console.error('プロンプトログの読み込みに失敗しました:', error);
    return {
      generationPrompts: [],
      qualityCheckPrompts: [],
      revisionPrompts: []
    };
  }
}