import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// GET: Part 2問題を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const difficulty = searchParams.get('difficulty');
    const questionType = searchParams.get('questionType');

    // データファイルから問題を読み込み
    const dataPath = path.join(process.cwd(), 'src/data/part2-questions.json');
    
    let questions = [];
    try {
      const data = await fs.readFile(dataPath, 'utf8');
      questions = JSON.parse(data);
    } catch (error) {
      console.warn('Part 2 questions file not found or empty, returning empty array', error);
      questions = [];
    }

    // フィルタリング
    let filteredQuestions = questions;
    
    if (difficulty) {
      filteredQuestions = filteredQuestions.filter((q: any) => q.difficulty === difficulty);
    }
    
    if (questionType) {
      filteredQuestions = filteredQuestions.filter((q: any) => q.questionType === questionType);
    }

    // 制限適用
    if (limit && limit > 0) {
      filteredQuestions = filteredQuestions.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      questions: filteredQuestions,
      total: filteredQuestions.length,
      filters: { difficulty, questionType, limit }
    });

  } catch (error) {
    console.error('Failed to retrieve Part 2 questions:', error);
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

// PUT: Part 2問題を生成
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
    const dataPath = path.join(process.cwd(), 'src/data/part2-questions.json');
    
    let questions = [];
    try {
      const data = await fs.readFile(dataPath, 'utf8');
      questions = JSON.parse(data);
    } catch (error) {
      console.error('Failed to load Part 2 questions for deletion:', error);
      return NextResponse.json(
        { success: false, error: 'Part 2 questions file not found' },
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
    console.error('Failed to delete Part 2 question:', error);
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