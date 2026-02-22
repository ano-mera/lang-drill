import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { Part4Question } from '@/lib/types';

// Part4スピーチタイプ一覧を高速取得する関数
async function getPart4SpeechTypes() {
  try {
    const filePath = path.join(process.cwd(), 'src/data/part4-speech-types.json');
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load Part4 speech types:', error);
    
    // フォールバック：デフォルトスピーチタイプ
    return [
      { type: 'company_announcement', description: 'Company announcement', jp: '企業からのお知らせ', weight: 0.07 }
    ];
  }
}

// Part4業種一覧を高速取得する関数
async function getPart4Industries() {
  try {
    const filePath = path.join(process.cwd(), 'src/data/industries.json');
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load industries:', error);
    
    // フォールバック：デフォルト業種
    return [
      { industry: 'retail', description: 'Retail', jp: '小売業', weight: 0.08 }
    ];
  }
}

// GET: Part 4問題を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // スピーチタイプ一覧を取得する場合
    if (action === 'speech-types') {
      const speechTypes = await getPart4SpeechTypes();
      return NextResponse.json({
        success: true,
        speechTypes: speechTypes
      });
    }

    // 業種一覧を取得する場合
    if (action === 'industries') {
      const industries = await getPart4Industries();
      return NextResponse.json({
        success: true,
        industries: industries
      });
    }

    // 一括データ取得（モーダル用の高速化）
    if (action === 'modal-data') {
      const [speechTypes, industries] = await Promise.all([
        getPart4SpeechTypes(),
        getPart4Industries()
      ]);
      return NextResponse.json({
        success: true,
        speechTypes: speechTypes,
        industries: industries
      });
    }
    
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const difficulty = searchParams.get('difficulty');
    const speechType = searchParams.get('speechType');

    // データファイルから問題を読み込み
    const dataPath = path.join(process.cwd(), 'src/data/part4-questions.json');
    
    let questions = [];
    try {
      const data = await fs.readFile(dataPath, 'utf8');
      questions = JSON.parse(data);
    } catch (error) {
      console.error('Error reading Part 4 questions:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to read Part 4 questions'
      }, { status: 500 });
    }

    // フィルタリング
    let filteredQuestions = questions;
    
    if (difficulty) {
      filteredQuestions = filteredQuestions.filter((q: Part4Question) => q.difficulty === difficulty);
    }
    
    if (speechType) {
      filteredQuestions = filteredQuestions.filter((q: Part4Question) => q.speechType === speechType);
    }

    // 制限
    if (limit) {
      filteredQuestions = filteredQuestions.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      questions: filteredQuestions,
      total: questions.length,
      filtered: filteredQuestions.length
    });

  } catch (error) {
    console.error('Error in Part 4 questions GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT: 新しいPart 4問題を生成
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
      return NextResponse.json({
        success: false,
        error: 'Question ID is required'
      }, { status: 400 });
    }

    // データファイルから問題を読み込み
    const dataPath = path.join(process.cwd(), 'src/data/part4-questions.json');
    
    let questions = [];
    try {
      const data = await fs.readFile(dataPath, 'utf8');
      questions = JSON.parse(data);
    } catch (error) {
      console.error('Error reading Part 4 questions:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to read Part 4 questions'
      }, { status: 500 });
    }

    // 指定されたIDの問題を削除
    const originalLength = questions.length;
    questions = questions.filter((q: Part4Question) => q.id !== questionId);

    if (questions.length === originalLength) {
      return NextResponse.json({
        success: false,
        error: 'Question not found'
      }, { status: 404 });
    }

    // ファイルに書き戻し
    try {
      await fs.writeFile(dataPath, JSON.stringify(questions, null, 2));
      console.log(`✅ Deleted Part 4 question: ${questionId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Part 4 question deleted successfully',
        deletedId: questionId,
        remaining: questions.length
      });
    } catch (error) {
      console.error('Error writing Part 4 questions:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to save changes'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in Part 4 questions DELETE:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}