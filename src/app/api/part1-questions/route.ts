import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

interface Part1Data {
  id: string;
  sceneDescription: string; // 日本語の場面説明（写真の代わり）
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  questionTranslation: string;
  optionTranslations: string[];
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  questionType: "action" | "location" | "description" | "people" | "general";
  createdAt: string;
  generationBatch?: string;
  scene?: string;              // 環境・シーン情報
  imagePath?: string;          // 最適化画像パス（表示用）
  originalImagePath?: string;  // 元画像パス（アーカイブ用）
  imagePrompt?: string;        // 画像生成プロンプト
}

const dataPath = path.join(process.cwd(), 'src/data/part1-questions.json');

interface Part1QuestionsData {
  part1Questions: Part1Data[];
}

function readPart1Questions(): Part1QuestionsData {
  try {
    if (!fs.existsSync(dataPath)) {
      return { part1Questions: [] };
    }
    const data = fs.readFileSync(dataPath, 'utf8');
    const parsed = JSON.parse(data);
    
    // ファイルが配列形式の場合は適切な形式に変換
    if (Array.isArray(parsed)) {
      return { part1Questions: parsed };
    }
    
    // オブジェクト形式の場合はそのまま返す
    return parsed;
  } catch (error) {
    console.error('Error reading Part 1 questions:', error);
    return { part1Questions: [] };
  }
}

function writePart1Questions(data: Part1QuestionsData): void {
  try {
    // 配列形式で保存（既存ファイル形式と統一）
    fs.writeFileSync(dataPath, JSON.stringify(data.part1Questions, null, 2));
  } catch (error) {
    console.error('Error writing Part 1 questions:', error);
    throw new Error('Failed to save Part 1 questions');
  }
}

// GET: Part 1問題の取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty');
    const topic = searchParams.get('topic');
    const limit = searchParams.get('limit');

    const data = readPart1Questions();
    let questions = data.part1Questions;

    // フィルタリング
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }

    if (topic) {
      questions = questions.filter(q => q.topic === topic);
    }

    // リミット適用
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (limitNum > 0) {
        questions = questions.slice(0, limitNum);
      }
    }

    // 作成日時順でソート（新しい順）
    questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      questions,
      total: questions.length,
      filters: {
        difficulty: difficulty || 'all',
        topic: topic || 'all',
        limit: limit || 'none'
      }
    });

  } catch (error) {
    console.error('Failed to get Part 1 questions:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve Part 1 questions',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: 新しいPart 1問題の保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questions }: { questions: Part1Data[] } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid questions data' },
        { status: 400 }
      );
    }

    // データ検証（Part 1には問題文がない）
    for (const question of questions) {
      if (!question.id || !question.sceneDescription || 
          !Array.isArray(question.options) || question.options.length !== 4 ||
          !question.correct || !['A', 'B', 'C', 'D'].includes(question.correct)) {
        return NextResponse.json(
          { success: false, message: 'Invalid question format' },
          { status: 400 }
        );
      }
    }

    const data = readPart1Questions();
    
    // 重複チェック（IDベース）
    const existingIds = new Set(data.part1Questions.map(q => q.id));
    const newQuestions = questions.filter(q => !existingIds.has(q.id));

    if (newQuestions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'All questions already exist' },
        { status: 409 }
      );
    }

    // 新しい問題を追加
    data.part1Questions.push(...newQuestions);
    writePart1Questions(data);

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${newQuestions.length} Part 1 questions`,
      saved: newQuestions.length,
      total: data.part1Questions.length
    });

  } catch (error) {
    console.error('Failed to save Part 1 questions:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to save Part 1 questions',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 生成用の新しいエンドポイント
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { difficulty = 'easy', count = 1, scene, voiceProfile, includePeople } = body;
    
    console.log('API received values:', { difficulty, count, scene, voiceProfile, includePeople });
    
    // バリデーション
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { success: false, message: 'Invalid difficulty level' },
        { status: 400 }
      );
    }
    
    if (count < 1 || count > 10) {
      return NextResponse.json(
        { success: false, message: 'Count must be between 1 and 10' },
        { status: 400 }
      );
    }

    // OpenAI生成スクリプトを実行
    const scriptPath = path.join(process.cwd(), 'generator/scripts/generate/generate-part1-passages.js');
    
    const args = [
      `--difficulty=${difficulty}`,
      `--count=${count}`
    ];

    if (scene) {
      args.push(`--scene=${scene}`);
    }

    if (voiceProfile) {
      // JSONをbase64エンコードして安全に渡す
      const encodedProfile = Buffer.from(JSON.stringify(voiceProfile)).toString('base64');
      args.push(`--voiceProfile=${encodedProfile}`);
    }

    if (includePeople !== undefined) {
      args.push(`--includePeople=${includePeople}`);
    }

    console.log('Executing Part 1 generation script:', scriptPath, args);

    return new Promise<NextResponse>((resolve) => {
      const child = spawn('node', [scriptPath, ...args], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('Script stdout:', data.toString());
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error('Script stderr:', data.toString());
      });

      child.on('close', (code) => {
        if (code === 0) {
          // 生成IDを抽出
          const generatedIdsMatch = stdout.match(/GENERATED_IDS:(.+)/);
          const generatedIds = generatedIdsMatch ? generatedIdsMatch[1].split(',') : [];
          
          // プロンプト情報を抽出
          let promptData = null;
          const promptMatch = stdout.match(/PROMPT_DATA:(.+)/);
          if (promptMatch && promptMatch[1]) {
            try {
              promptData = JSON.parse(promptMatch[1]);
            } catch (error) {
              console.warn('Failed to parse prompt data:', error);
            }
          }
          
          // 生成されたデータを読み込み
          const data = readPart1Questions();
          const newQuestions = data.part1Questions.filter(q => generatedIds.includes(q.id));

          resolve(NextResponse.json({
            success: true,
            message: `${newQuestions.length}問のPart 1問題を生成しました`,
            batchId: newQuestions[0]?.generationBatch || `part1_${Date.now()}`,
            generatedQuestions: newQuestions,
            count: newQuestions.length,
            successCount: newQuestions.length,
            totalCount: newQuestions.length,
            errorCount: 0,
            generatedIds: generatedIds,
            difficulty: difficulty,
            stdout: stdout,
            generationPrompts: promptData?.generationPrompts || [],
            qualityCheckPrompts: promptData?.qualityCheckPrompts || [],
            imagePrompts: newQuestions.map(q => ({
              prompt: q.imagePrompt || `A realistic photograph suitable for TOEIC Part 1 listening test. ${q.sceneDescription}. Professional photography, clear details, natural lighting, no text or labels, everyday business or daily life scene.`,
              questionId: q.id
            })).filter(p => p.prompt),
            revisionPrompts: promptData?.revisionPrompts || []
          }));
        } else {
          console.error('Generation script failed with code:', code);
          console.error('stderr:', stderr);
          
          resolve(NextResponse.json(
            { 
              success: false, 
              message: 'Part 1問題生成中にエラーが発生しました',
              error: stderr || `Generation script failed with exit code ${code}`
            },
            { status: 500 }
          ));
        }
      });

      child.on('error', (error) => {
        console.error('Failed to start generation script:', error);
        resolve(NextResponse.json(
          { 
            success: false, 
            message: 'Part 1問題生成スクリプトの起動に失敗しました',
            error: error.message
          },
          { status: 500 }
        ));
      });
    });

  } catch (error) {
    console.error('Part 1 generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Part 1問題生成中にエラーが発生しました',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}