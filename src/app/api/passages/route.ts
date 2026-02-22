import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import path from 'path';

const passagesDataPath = path.join(process.cwd(), 'src/data/passages.json');
const part1DataPath = path.join(process.cwd(), 'src/data/part1-questions.json');
const part2DataPath = path.join(process.cwd(), 'src/data/part2-questions.json');
const part3DataPath = path.join(process.cwd(), 'src/data/part3-questions.json');
const part4DataPath = path.join(process.cwd(), 'src/data/part4-questions.json');

export async function GET(request: Request) {
  try {
    console.log('[API] GET /api/passages - Start');
    
    // partTypeクエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const partTypeParam = searchParams.get('partType');
    const partTypes = partTypeParam ? partTypeParam.split(',') : [];
    
    console.log('[API] Query params:', { partTypeParam, partTypes });
    
    let passages = [];
    let part1Questions = [];
    let part2Questions = [];
    let part3Questions = [];
    let part4Questions = [];

    // Load regular passages
    try {
      const passagesData = await fs.readFile(passagesDataPath, 'utf8');
      const parsedData = JSON.parse(passagesData);
      // Handle both array format and object with passages property
      passages = Array.isArray(parsedData) ? parsedData : parsedData.passages || [];
    } catch {
      console.warn('Passages file not found, using empty array');
      passages = [];
    }

    // Load Part 1 questions
    try {
      const part1Data = await fs.readFile(part1DataPath, 'utf8');
      part1Questions = JSON.parse(part1Data);
    } catch {
      console.warn('Part 1 questions file not found, using empty array');
      part1Questions = [];
    }

    // Load Part 2 questions
    try {
      const part2Data = await fs.readFile(part2DataPath, 'utf8');
      part2Questions = JSON.parse(part2Data);
    } catch {
      console.warn('Part 2 questions file not found, using empty array');
      part2Questions = [];
    }

    // Load Part 3 questions
    try {
      const part3Data = await fs.readFile(part3DataPath, 'utf8');
      part3Questions = JSON.parse(part3Data);
    } catch {
      console.warn('Part 3 questions file not found, using empty array');
      part3Questions = [];
    }

    // Load Part 4 questions
    try {
      const part4Data = await fs.readFile(part4DataPath, 'utf8');
      part4Questions = JSON.parse(part4Data);
    } catch {
      console.warn('Part 4 questions file not found, using empty array');
      part4Questions = [];
    }

    // Convert Part 1 questions to passage format for admin display
    const part1Passages = part1Questions.map((question: any) => {
      const environment = question.scene;
      const displayTopic = environment || question.topic || 'Unknown';
      
      return {
        id: question.id,
        title: `Part 1 - ${displayTopic}`,
        type: 'part1',
        content: question.sceneDescription || 'Part 1 Question',
        metadata: {
          difficulty: question.difficulty,
          estimatedTime: 30,
          wordCount: 0,
          questionCount: 1,
          passageType: 'part1',
          topic: displayTopic,
          qualityCheck: question.qualityCheck
        },
      questions: [{
        id: question.id,
        question: 'Select the best description for the image',
        options: question.options,
        correct: question.correct,
        explanation: question.explanation,
        questionTranslation: 'この写真を最も適切に説明している文を選択してください',
        optionTranslations: question.optionTranslations || [],
        voiceProfile: question.voiceProfile
      }],
        contentTranslation: question.sceneDescriptionTranslation || '',
        createdAt: question.createdAt,
        generationBatch: question.generationBatch,
        toeicPart: 'part1' as const,
        partType: 'part1' as const,
        part1Questions: [question]
      };
    });

    // Convert Part 2 questions to passage format for admin display
    const part2Passages = part2Questions.map((question: any) => ({
      id: question.id,
      title: `Part 2 - ${question.questionType} (${question.topic})`,
      type: 'part2',
      content: question.question,
      metadata: {
        difficulty: question.difficulty,
        estimatedTime: 20,
        wordCount: 0,
        questionCount: 1,
        passageType: 'part2',
        topic: question.topic,
        qualityCheck: question.qualityCheck
      },
      questions: [{
        id: question.id,
        question: question.question,
        options: question.options,
        correct: question.correct,
        explanation: question.explanation,
        questionTranslation: question.questionTranslation,
        optionTranslations: question.optionTranslations || []
      }],
      contentTranslation: question.questionTranslation || '',
      createdAt: question.createdAt,
      generationBatch: question.generationBatch,
      toeicPart: 'part2' as const,
      partType: 'part2' as const,
      part2Question: question
    }));

    // Convert Part 3 questions to passage format for admin display
    const part3Passages = part3Questions.map((question: any) => ({
      id: question.id,
      title: `Part 3 - ${question.scenario} (${question.speakers?.length || 2} speakers)`,
      type: 'part3',
      content: question.conversation?.map((turn: any) => 
        `${turn.speaker}: ${turn.text}`
      ).join('\n') || 'Part 3 Conversation',
      metadata: {
        difficulty: question.difficulty,
        estimatedTime: 60,
        wordCount: question.conversation?.reduce((count: number, turn: any) => 
          count + (turn.text?.split(' ').length || 0), 0) || 0,
        questionCount: question.questions?.length || 3,
        passageType: 'part3',
        topic: question.topic,
        scenario: question.scenario,
        speakerCount: question.speakers?.length || 2,
        qualityCheck: question.qualityCheck
      },
      questions: question.questions?.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        questionTranslation: q.questionTranslation,
        optionTranslations: q.optionTranslations || []
      })) || [],
      contentTranslation: question.conversation?.map((turn: any) => 
        `${turn.speaker}: ${turn.translation || turn.text}`
      ).join('\n') || '',
      createdAt: question.createdAt,
      generationBatch: question.generationBatch,
      toeicPart: 'part3' as const,
      partType: 'part3' as const,
      part3Question: question
    }));

    // Convert Part 4 questions to passage format for admin display
    const part4Passages = part4Questions.map((question: any) => ({
      id: question.id,
      title: `Part 4 - ${question.speechTypeTranslation || question.speechType} (${question.speaker?.name || 'Speaker'})`,
      type: 'part4',
      content: question.text || 'Part 4 Speech',
      metadata: {
        difficulty: question.difficulty,
        estimatedTime: 90,
        wordCount: question.text?.split(' ').length || 0,
        questionCount: question.questions?.length || 3,
        passageType: 'part4',
        topic: question.topicTranslation || question.topic,
        speechType: question.speechType,
        speechTypeTranslation: question.speechTypeTranslation,
        industry: question.industry,
        speaker: question.speaker,
        qualityCheck: question.qualityCheck
      },
      questions: question.questions?.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        questionTranslation: q.questionTranslation,
        optionTranslations: q.optionTranslations || []
      })) || [],
      contentTranslation: question.textTranslation || '',
      createdAt: question.createdAt,
      generationBatch: question.generationBatch,
      toeicPart: 'part4' as const,
      partType: 'part4' as const,
      part4Question: question
    }));

    // Combine all passages
    let allPassages = [...passages, ...part1Passages, ...part2Passages, ...part3Passages, ...part4Passages];
    
    // partTypeでフィルタリング
    if (partTypes.length > 0) {
      allPassages = allPassages.filter(passage => 
        partTypes.includes(passage.partType || passage.toeicPart)
      );
    }

    // Sort by creation date (newest first)
    allPassages.sort((a, b) => {
      const dateA = new Date(a.createdAt || '1970-01-01').getTime();
      const dateB = new Date(b.createdAt || '1970-01-01').getTime();
      return dateB - dateA;
    });

    // 分類統計を生成
    const partTypeCounts = {
      part1: 0,
      part2: 0,
      part3: 0,
      part4: 0,
      part7_single_text: 0,
      part7_single_chart: 0,
      part7_double: 0
    };
    
    allPassages.forEach(passage => {
      const type = passage.partType || passage.toeicPart;
      if (partTypeCounts.hasOwnProperty(type)) {
        (partTypeCounts as any)[type]++;
      }
    });
    
    return NextResponse.json({
      success: true,
      passages: allPassages,
      total: allPassages.length,
      meta: {
        ...partTypeCounts,
        totalOriginal: passages.length + part1Questions.length + part2Questions.length,
        filteredBy: partTypes.length > 0 ? partTypes : null
      }
    });

  } catch (error) {
    console.error('[API] Error loading passages:', error);
    
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
      cwd: process.cwd(),
      passagesPath: passagesDataPath,
      part1Path: part1DataPath,
      part2Path: part2DataPath
    };
    
    console.error('[API] Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load passages',
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}