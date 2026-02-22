import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// Part3シナリオ一覧を動的に取得する関数
async function getPart3Scenarios() {
  try {
    const templatePath = path.join(process.cwd(), 'generator/lib/prompt-templates.js');
    const content = await fs.readFile(templatePath, 'utf8');
    
    // PART3_SCENARIOSの部分を抽出
    const scenariosMatch = content.match(/export const PART3_SCENARIOS = (\[[\s\S]*?\]);/);
    if (scenariosMatch) {
      // JSONとして評価（危険なのでeval使わずに正規表現で解析）
      const scenariosText = scenariosMatch[1];
      // 簡単な変換でJSONパースできる形に
      const jsonText = scenariosText
        .replace(/(\w+):/g, '"$1":')  // キーをクォート
        .replace(/'/g, '"')           // シングルクォートをダブルクォートに
        .replace(/,\s*}/g, '}')       // 末尾カンマ削除
        .replace(/,\s*]/g, ']');      // 末尾カンマ削除
      
      return JSON.parse(jsonText);
    }
  } catch (error) {
    console.error('Failed to parse PART3_SCENARIOS:', error);
  }
  
  // フォールバック：デフォルトシナリオ
  return [
    { scenario: 'appointment_scheduling', description: 'Appointment scheduling', jp: '予定／予約の調整', weight: 0.06 }
  ];
}

// Part3業種一覧を動的に取得する関数
async function getPart3Industries() {
  try {
    const templatePath = path.join(process.cwd(), 'generator/lib/prompt-templates.js');
    const content = await fs.readFile(templatePath, 'utf8');
    
    // INDUSTRIESの部分を抽出
    const industriesMatch = content.match(/export const INDUSTRIES = (\[[\s\S]*?\]);/);
    if (industriesMatch) {
      // JSONとして評価（危険なのでeval使わずに正規表現で解析）
      const industriesText = industriesMatch[1];
      // 簡単な変換でJSONパースできる形に
      const jsonText = industriesText
        .replace(/(\w+):/g, '"$1":')  // キーをクォート
        .replace(/'/g, '"')           // シングルクォートをダブルクォートに
        .replace(/,\s*}/g, '}')       // 末尾カンマ削除
        .replace(/,\s*]/g, ']');      // 末尾カンマ削除
      
      return JSON.parse(jsonText);
    }
  } catch (error) {
    console.error('Failed to parse INDUSTRIES:', error);
  }
  
  // フォールバック：デフォルト業種
  return [
    { industry: 'retail', description: 'Retail', jp: '小売業', weight: 0.08 }
  ];
}

// GET: Part 3問題を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // シナリオ一覧を取得する場合
    if (action === 'scenarios') {
      const scenarios = await getPart3Scenarios();
      return NextResponse.json({
        success: true,
        scenarios: scenarios
      });
    }

    // 業種一覧を取得する場合
    if (action === 'industries') {
      const industries = await getPart3Industries();
      return NextResponse.json({
        success: true,
        industries: industries
      });
    }
    
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const difficulty = searchParams.get('difficulty');
    const scenario = searchParams.get('scenario');

    // データファイルから問題を読み込み
    const dataPath = path.join(process.cwd(), 'src/data/part3-questions.json');
    
    let questions = [];
    try {
      const data = await fs.readFile(dataPath, 'utf8');
      questions = JSON.parse(data);
    } catch (error) {
      console.warn('Part 3 questions file not found or empty, returning empty array', error);
      questions = [];
    }

    // フィルタリング
    let filteredQuestions = questions;
    
    if (difficulty) {
      filteredQuestions = filteredQuestions.filter((q: any) => q.difficulty === difficulty);
    }
    
    if (scenario) {
      filteredQuestions = filteredQuestions.filter((q: any) => q.scenario === scenario);
    }

    // 制限適用
    if (limit && limit > 0) {
      filteredQuestions = filteredQuestions.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      questions: filteredQuestions,
      total: filteredQuestions.length,
      filters: { difficulty, scenario, limit }
    });

  } catch (error) {
    console.error('Failed to retrieve Part 3 questions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve questions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT: Part 3問題を生成
export async function PUT() {
  return NextResponse.json({
    error: 'Generation feature needs to be implemented',
    message: 'This endpoint is currently being restored'
  }, { status: 501 });
}
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 }
      );
    }

    // データファイルから問題を読み込み
    const dataPath = path.join(process.cwd(), 'src/data/part3-questions.json');
    
    let questions = [];
    try {
      const data = await fs.readFile(dataPath, 'utf8');
      questions = JSON.parse(data);
    } catch (error) {
      console.error('Failed to load Part 3 questions for deletion:', error);
      return NextResponse.json(
        { success: false, error: 'Part 3 questions file not found' },
        { status: 404 }
      );
    }

    // 問題を削除
    const initialLength = questions.length;
    questions = questions.filter((q: any) => q.id !== questionId);

    if (questions.length === initialLength) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    // ファイルを更新
    await fs.writeFile(dataPath, JSON.stringify(questions, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
      deletedId: questionId,
      remainingCount: questions.length
    });

  } catch (error) {
    console.error('Failed to delete Part 3 question:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete question',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}