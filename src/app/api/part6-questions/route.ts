import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'src', 'data', 'part6-questions.json');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    // Handle special actions for getting metadata
    if (action === 'document-types') {
      return NextResponse.json({
        documentTypes: [
          "email",
          "letter", 
          "article",
          "advertisement",
          "notice",
          "memo"
        ]
      });
    }
    
    if (action === 'question-types') {
      return NextResponse.json({
        questionTypes: [
          "vocabulary",
          "grammar",
          "context",
          "sentence_insertion"
        ]
      });
    }

    if (action === 'business-topics') {
      return NextResponse.json({
        businessTopics: [
          // 高頻度：日常的なビジネスコミュニケーション
          { topic: 'meeting_scheduling', description: '会議スケジュール調整', weight: 0.08 },
          { topic: 'office_announcements', description: 'オフィス告知', weight: 0.07 },
          { topic: 'simple_notifications', description: '簡単な通知', weight: 0.07 },
          { topic: 'basic_requests', description: '基本的な依頼', weight: 0.06 },
          { topic: 'schedule_changes', description: 'スケジュール変更', weight: 0.06 },
          { topic: 'customer_inquiries', description: '顧客問い合わせ', weight: 0.06 },
          { topic: 'team_coordination', description: 'チーム連携', weight: 0.05 },
          
          // 中頻度：業務関連
          { topic: 'project_updates', description: 'プロジェクト進捗', weight: 0.04 },
          { topic: 'training_programs', description: '研修プログラム', weight: 0.04 },
          { topic: 'policy_updates', description: 'ポリシー変更', weight: 0.04 },
          { topic: 'employee_recognition', description: '従業員表彰', weight: 0.04 },
          { topic: 'workflow_optimization', description: '業務フロー最適化', weight: 0.03 },
          
          // 低頻度：専門的な内容
          { topic: 'technical_documentation', description: '技術文書', weight: 0.03 },
          { topic: 'budget_planning', description: '予算計画', weight: 0.02 },
          { topic: 'vendor_management', description: '業者管理', weight: 0.02 },
          { topic: 'compliance_matters', description: 'コンプライアンス', weight: 0.02 },
          { topic: 'strategic_planning', description: '戦略計画', weight: 0.02 }
        ]
      });
    }
    
    // Read existing questions
    const data = await fs.readFile(dataPath, 'utf-8');
    let questions = JSON.parse(data);
    
    // Apply filters
    const difficulty = searchParams.get('difficulty');
    const documentType = searchParams.get('documentType');
    const limit = searchParams.get('limit');
    
    if (difficulty) {
      questions = questions.filter((q: any) => q.difficulty === difficulty);
    }
    
    if (documentType) {
      questions = questions.filter((q: any) => q.documentType === documentType);
    }
    
    if (limit) {
      const limitNum = parseInt(limit);
      questions = questions.slice(0, limitNum);
    }
    
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error reading Part 6 questions:', error);
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
    let questions;
    try {
      const data = await fs.readFile(dataPath, 'utf-8');
      questions = JSON.parse(data);
    } catch {
      return NextResponse.json({ error: 'Questions file not found' }, { status: 404 });
    }
    
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
      message: `Deleted Part 6 question ${id}`,
      deletedId: id
    });
  } catch (error) {
    console.error('Error deleting Part 6 question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}