import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'src', 'data', 'part5-questions.json');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    // Handle special actions for getting metadata
    if (action === 'categories') {
      return NextResponse.json({
        categories: [
          "品詞識別",
          "動詞の形・時制",
          "主語と動詞の一致",
          "接続詞",
          "前置詞",
          "関係詞・代名詞",
          "比較構文・数量",
          "語彙選択",
          "慣用表現・句動詞"
        ]
      });
    }
    
    if (action === 'options-types') {
      return NextResponse.json({
        optionsTypes: [
          "同語の語形変化",
          "類義語の選択",
          "前置詞や接続詞の選択",
          "同じ品詞で意味が紛らわしい語"
        ]
      });
    }
    
    // Read existing questions
    const data = await fs.readFile(dataPath, 'utf-8');
    let questions = JSON.parse(data);
    
    // Apply filters
    const difficulty = searchParams.get('difficulty');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');
    
    if (difficulty) {
      questions = questions.filter((q: any) => q.difficulty === difficulty);
    }
    
    if (category) {
      questions = questions.filter((q: any) => q.category === category);
    }
    
    if (limit) {
      const limitNum = parseInt(limit);
      questions = questions.slice(0, limitNum);
    }
    
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error reading Part 5 questions:', error);
    return NextResponse.json({ error: 'Failed to read questions' }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({
    error: 'Generation feature needs to be implemented',
    message: 'This endpoint is currently being restored'
  }, { status: 501 });
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    
    // Read existing questions
    const data = await fs.readFile(dataPath, 'utf-8');
    let questions = JSON.parse(data);
    
    // Filter out the question to delete
    const initialLength = questions.length;
    questions = questions.filter((q: any) => q.id !== id);
    
    if (questions.length === initialLength) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    // Write back to file
    await fs.writeFile(dataPath, JSON.stringify(questions, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: `Question ${id} deleted successfully`,
      remainingCount: questions.length
    });
    
  } catch (error) {
    console.error('Error deleting Part 5 question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}