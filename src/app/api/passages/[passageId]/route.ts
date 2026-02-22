import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Part1Data {
  id: string;
  sceneDescription: string;
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

interface Part7Data {
  id: string;
  title: string;
  type: string;
  content: string;
  metadata: {
    difficulty: string;
    estimatedTime: number;
    wordCount: number;
    questionCount: number;
    passageType: string;
    topic: string;
  };
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correct: string;
    explanation: string;
  }>;
  contentTranslation: string;
  toeicPart: string;
  isMultiDocument?: boolean;
  hasChart?: boolean;
  chart?: any;
  createdAt?: string;
  generationBatch?: string;
}

const part1DataPath = path.join(process.cwd(), 'src/data/part1-questions.json');
const part7DataPath = path.join(process.cwd(), 'src/data/passages.json');

function readPart1Questions(): Part1Data[] {
  try {
    if (!fs.existsSync(part1DataPath)) {
      return [];
    }
    const data = fs.readFileSync(part1DataPath, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading Part 1 questions:', error);
    return [];
  }
}

function writePart1Questions(questions: Part1Data[]): void {
  try {
    fs.writeFileSync(part1DataPath, JSON.stringify(questions, null, 2));
  } catch (error) {
    console.error('Error writing Part 1 questions:', error);
    throw new Error('Failed to save Part 1 questions');
  }
}

function readPart7Passages(): { passages: Part7Data[] } {
  try {
    if (!fs.existsSync(part7DataPath)) {
      return { passages: [] };
    }
    const data = fs.readFileSync(part7DataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading Part 7 passages:', error);
    return { passages: [] };
  }
}

function writePart7Passages(data: { passages: Part7Data[] }): void {
  try {
    fs.writeFileSync(part7DataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing Part 7 passages:', error);
    throw new Error('Failed to save Part 7 passages');
  }
}

// DELETE: 問題削除（Part 1またはPart 7を自動判別）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ passageId: string }> }
) {
  try {
    const { passageId } = await params;

    if (!passageId) {
      return NextResponse.json(
        { success: false, message: 'Passage ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ 削除要求: ${passageId}`);

    // Part 2問題かどうかを判別（IDに"part2_"が含まれているかで判断）
    const isPart2 = passageId.includes('part2_');
    // Part 1問題かどうかを判別（IDに"part1_"が含まれているかで判断）
    const isPart1 = passageId.includes('part1_');
    // Part 3問題かどうかを判別（IDに"part3_"が含まれているかで判断）
    const isPart3 = passageId.includes('part3_');
    // Part 4問題かどうかを判別（IDに"part4_"が含まれているかで判断）
    const isPart4 = passageId.includes('part4_');

    if (isPart2) {
      // Part 2問題の削除
      console.log('📝 Part 2問題を削除中...');
      const part2DataPath = path.join(process.cwd(), 'src/data/part2-questions.json');
      
      let part2Questions = [];
      try {
        const data = fs.readFileSync(part2DataPath, 'utf8');
        part2Questions = JSON.parse(data);
      } catch {
        return NextResponse.json(
          { success: false, message: 'Part 2 questions file not found' },
          { status: 404 }
        );
      }
      
      const originalCount = part2Questions.length;
      const questionIndex = part2Questions.findIndex((q: any) => q.id === passageId);
      
      if (questionIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'Part 2 question not found' },
          { status: 404 }
        );
      }

      const questionToDelete = part2Questions[questionIndex];

      // 関連音声ファイルを削除
      try {
        if (questionToDelete.audioFiles) {
          // 質問音声ファイルの削除
          if (questionToDelete.audioFiles.question && questionToDelete.audioFiles.question.audioPath) {
            const questionAudioPath = path.join(process.cwd(), 'public', questionToDelete.audioFiles.question.audioPath);
            if (fs.existsSync(questionAudioPath)) {
              fs.unlinkSync(questionAudioPath);
              console.log(`🗑️ Part 2質問音声削除: ${questionToDelete.audioFiles.question.audioPath}`);
            }
          }

          // 選択肢音声ファイルの削除
          if (questionToDelete.audioFiles.options) {
            questionToDelete.audioFiles.options.forEach((option: any) => {
              if (option.audioPath) {
                const optionAudioPath = path.join(process.cwd(), 'public', option.audioPath);
                if (fs.existsSync(optionAudioPath)) {
                  fs.unlinkSync(optionAudioPath);
                  console.log(`🗑️ Part 2選択肢音声削除: ${option.audioPath}`);
                }
              }
              // ラベル音声（A, B, C）の削除
              if (option.labelAudioPath) {
                const labelAudioPath = path.join(process.cwd(), 'public', option.labelAudioPath);
                if (fs.existsSync(labelAudioPath)) {
                  fs.unlinkSync(labelAudioPath);
                  console.log(`🗑️ Part 2ラベル音声削除: ${option.labelAudioPath}`);
                }
              }
            });
          }
        }
      } catch (fileError) {
        console.warn(`⚠️ Part 2音声ファイル削除でエラーが発生しましたが、データベースからの削除は続行します:`, fileError);
      }

      // 問題を削除
      part2Questions.splice(questionIndex, 1);
      fs.writeFileSync(part2DataPath, JSON.stringify(part2Questions, null, 2));

      console.log(`✅ Part 2問題削除完了: ${passageId}`);
      console.log(`📊 削除前: ${originalCount}問 → 削除後: ${part2Questions.length}問`);

      return NextResponse.json({
        success: true,
        message: 'Part 2 question deleted successfully',
        deletedId: passageId,
        remainingCount: part2Questions.length
      });

    } else if (isPart3) {
      // Part 3問題の削除
      console.log('📝 Part 3問題を削除中...');
      const part3DataPath = path.join(process.cwd(), 'src/data/part3-questions.json');
      
      let part3Questions = [];
      try {
        const data = fs.readFileSync(part3DataPath, 'utf8');
        part3Questions = JSON.parse(data);
      } catch {
        return NextResponse.json(
          { success: false, message: 'Part 3 questions file not found' },
          { status: 404 }
        );
      }
      
      const originalCount = part3Questions.length;
      const questionIndex = part3Questions.findIndex((q: any) => q.id === passageId);
      
      if (questionIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'Part 3 question not found' },
          { status: 404 }
        );
      }

      const questionToDelete = part3Questions[questionIndex];

      // 関連音声ファイルを削除
      try {
        if (questionToDelete.audioFiles) {
          // 会話音声ファイルの削除
          if (questionToDelete.audioFiles.conversation) {
            // セグメント形式の音声ファイル削除
            if (questionToDelete.audioFiles.conversation.segments) {
              questionToDelete.audioFiles.conversation.segments.forEach((segment: any) => {
                if (segment.audioPath) {
                  const audioPath = path.join(process.cwd(), 'public', segment.audioPath);
                  if (fs.existsSync(audioPath)) {
                    fs.unlinkSync(audioPath);
                    console.log(`🗑️ セグメント音声削除: ${segment.audioPath}`);
                  }
                }
              });
            }

            // 結合音声ファイルの削除
            if (questionToDelete.audioFiles.conversation.combinedAudioPath) {
              const combinedAudioPath = path.join(process.cwd(), 'public', questionToDelete.audioFiles.conversation.combinedAudioPath);
              if (fs.existsSync(combinedAudioPath)) {
                fs.unlinkSync(combinedAudioPath);
                console.log(`🗑️ 結合音声削除: ${questionToDelete.audioFiles.conversation.combinedAudioPath}`);
              }
            }

            // レガシー音声ファイルの削除
            if (questionToDelete.audioFiles.conversation.audioPath) {
              const audioPath = path.join(process.cwd(), 'public', questionToDelete.audioFiles.conversation.audioPath);
              if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
                console.log(`🗑️ 会話音声削除: ${questionToDelete.audioFiles.conversation.audioPath}`);
              }
            }
          }

          // 各問題の音声ファイル削除
          if (questionToDelete.audioFiles.questions) {
            questionToDelete.audioFiles.questions.forEach((question: any) => {
              if (question.audioPath) {
                const audioPath = path.join(process.cwd(), 'public', question.audioPath);
                if (fs.existsSync(audioPath)) {
                  fs.unlinkSync(audioPath);
                  console.log(`🗑️ 問題音声削除: ${question.audioPath}`);
                }
              }
            });
          }
        }
      } catch (fileError) {
        console.warn(`⚠️ Part 3音声ファイル削除でエラーが発生しましたが、データベースからの削除は続行します:`, fileError);
      }

      // 問題を削除
      part3Questions.splice(questionIndex, 1);
      fs.writeFileSync(part3DataPath, JSON.stringify(part3Questions, null, 2));

      console.log(`✅ Part 3問題削除完了: ${passageId}`);
      console.log(`📊 削除前: ${originalCount}問 → 削除後: ${part3Questions.length}問`);

      return NextResponse.json({
        success: true,
        message: 'Part 3 question deleted successfully',
        deletedId: passageId,
        remainingCount: part3Questions.length
      });

    } else if (isPart4) {
      // Part 4問題の削除
      console.log('📝 Part 4問題を削除中...');
      const part4DataPath = path.join(process.cwd(), 'src/data/part4-questions.json');
      
      let part4Questions = [];
      try {
        const data = fs.readFileSync(part4DataPath, 'utf8');
        part4Questions = JSON.parse(data);
      } catch {
        return NextResponse.json(
          { success: false, message: 'Part 4 questions file not found' },
          { status: 404 }
        );
      }
      
      const originalCount = part4Questions.length;
      const questionIndex = part4Questions.findIndex((q: any) => q.id === passageId);
      
      if (questionIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'Part 4 question not found' },
          { status: 404 }
        );
      }

      const questionToDelete = part4Questions[questionIndex];

      // 関連音声ファイルを削除
      try {
        if (questionToDelete.audioFiles) {
          // スピーチ音声ファイルの削除
          if (questionToDelete.audioFiles.speech && questionToDelete.audioFiles.speech.audioPath) {
            const speechAudioPath = path.join(process.cwd(), 'public', questionToDelete.audioFiles.speech.audioPath);
            if (fs.existsSync(speechAudioPath)) {
              fs.unlinkSync(speechAudioPath);
              console.log(`🗑️ Part 4スピーチ音声削除: ${questionToDelete.audioFiles.speech.audioPath}`);
            }
          }

          // 各問題の音声ファイル削除
          if (questionToDelete.audioFiles.questions) {
            questionToDelete.audioFiles.questions.forEach((question: any) => {
              if (question.audioPath) {
                const audioPath = path.join(process.cwd(), 'public', question.audioPath);
                if (fs.existsSync(audioPath)) {
                  fs.unlinkSync(audioPath);
                  console.log(`🗑️ Part 4問題音声削除: ${question.audioPath}`);
                }
              }
            });
          }
        }
      } catch (fileError) {
        console.warn(`⚠️ Part 4音声ファイル削除でエラーが発生しましたが、データベースからの削除は続行します:`, fileError);
      }

      // 問題を削除
      part4Questions.splice(questionIndex, 1);
      fs.writeFileSync(part4DataPath, JSON.stringify(part4Questions, null, 2));

      console.log(`✅ Part 4問題削除完了: ${passageId}`);
      console.log(`📊 削除前: ${originalCount}問 → 削除後: ${part4Questions.length}問`);

      return NextResponse.json({
        success: true,
        message: 'Part 4 question deleted successfully',
        deletedId: passageId,
        remainingCount: part4Questions.length
      });

    } else if (isPart1) {
      // Part 1問題の削除
      console.log('📝 Part 1問題を削除中...');
      const part1Questions = readPart1Questions();
      const originalCount = part1Questions.length;

      // 該当するPart 1問題を検索
      const questionIndex = part1Questions.findIndex(q => q.id === passageId);
      
      if (questionIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'Part 1 question not found' },
          { status: 404 }
        );
      }

      const questionToDelete = part1Questions[questionIndex];

      // 関連画像ファイルを削除
      try {
        // 元画像の削除（originalImagePath）
        if (questionToDelete.originalImagePath) {
          const originalImagePath = path.join(process.cwd(), 'public', questionToDelete.originalImagePath);
          if (fs.existsSync(originalImagePath)) {
            fs.unlinkSync(originalImagePath);
            console.log(`🗑️ 元画像削除: ${questionToDelete.originalImagePath}`);
          }
        }

        // 最適化済み画像の削除（imagePath）
        if (questionToDelete.imagePath) {
          const optimizedImagePath = path.join(process.cwd(), 'public', questionToDelete.imagePath);
          if (fs.existsSync(optimizedImagePath)) {
            fs.unlinkSync(optimizedImagePath);
            console.log(`🗑️ 最適化画像削除: ${questionToDelete.imagePath}`);
          }
        }

        // 音声ファイルの削除
        if ('audioFiles' in questionToDelete && questionToDelete.audioFiles) {
          (questionToDelete.audioFiles as any[]).forEach((audioFile: any) => {
            if (audioFile.audioPath) {
              const audioPath = path.join(process.cwd(), 'public', audioFile.audioPath);
              if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
                console.log(`🗑️ 音声ファイル削除: ${audioFile.audioPath}`);
              }
            }
          });
        }
      } catch (fileError) {
        console.warn(`⚠️ ファイル削除でエラーが発生しましたが、データベースからの削除は続行します:`, fileError);
      }

      // 問題を削除
      part1Questions.splice(questionIndex, 1);
      writePart1Questions(part1Questions);

      console.log(`✅ Part 1問題削除完了: ${passageId}`);
      console.log(`📊 削除前: ${originalCount}問 → 削除後: ${part1Questions.length}問`);

      return NextResponse.json({
        success: true,
        message: 'Part 1 question deleted successfully',
        deletedId: passageId,
        remainingCount: part1Questions.length
      });

    } else {
      // Part 7問題の削除
      console.log('📝 Part 7問題を削除中...');
      const part7Data = readPart7Passages();
      const originalCount = part7Data.passages.length;

      // 該当するPart 7問題を検索
      const passageIndex = part7Data.passages.findIndex(p => p.id === passageId);
      
      if (passageIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'Part 7 passage not found' },
          { status: 404 }
        );
      }

      // 問題を削除
      part7Data.passages.splice(passageIndex, 1);
      writePart7Passages(part7Data);

      console.log(`✅ Part 7問題削除完了: ${passageId}`);
      console.log(`📊 削除前: ${originalCount}問 → 削除後: ${part7Data.passages.length}問`);

      return NextResponse.json({
        success: true,
        message: 'Part 7 passage deleted successfully',
        deletedId: passageId,
        remainingCount: part7Data.passages.length
      });
    }

  } catch (error) {
    console.error('❌ Deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete passage',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT: 問題更新（Part 3, Part 7対応）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ passageId: string }> }
) {
  try {
    const { passageId } = await params;
    const updatedData = await request.json();

    if (!passageId) {
      return NextResponse.json(
        { success: false, message: 'Passage ID is required' },
        { status: 400 }
      );
    }

    console.log(`📝 更新要求: ${passageId}`);

    // Part 3問題かどうかを判別
    const isPart3 = passageId.includes('part3_');

    if (isPart3) {
      // Part 3問題の更新
      console.log('📝 Part 3問題を更新中...');
      const part3DataPath = path.join(process.cwd(), 'src/data/part3-questions.json');
      
      let part3Questions = [];
      try {
        const data = fs.readFileSync(part3DataPath, 'utf8');
        part3Questions = JSON.parse(data);
      } catch {
        return NextResponse.json(
          { success: false, message: 'Part 3 questions file not found' },
          { status: 404 }
        );
      }
      
      const questionIndex = part3Questions.findIndex((q: any) => q.id === passageId);
      
      if (questionIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'Part 3 question not found' },
          { status: 404 }
        );
      }

      // 既存の問題を更新
      part3Questions[questionIndex] = {
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      // ファイルに保存
      fs.writeFileSync(part3DataPath, JSON.stringify(part3Questions, null, 2));

      console.log(`✅ Part 3問題更新完了: ${passageId}`);

      return NextResponse.json({
        success: true,
        message: 'Part 3 question updated successfully',
        question: part3Questions[questionIndex]
      });

    } else {
      // Part 7問題の更新
      const part7Data = readPart7Passages();
      const passageIndex = part7Data.passages.findIndex(p => p.id === passageId);
      
      if (passageIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'Part 7 passage not found' },
          { status: 404 }
        );
      }

      // 既存のpassageを更新
      part7Data.passages[passageIndex] = {
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      // ファイルに保存
      writePart7Passages(part7Data);

      console.log(`✅ Part 7問題更新完了: ${passageId}`);

      return NextResponse.json({
        success: true,
        message: 'Part 7 passage updated successfully',
        passage: part7Data.passages[passageIndex]
      });
    }

  } catch (error) {
    console.error('❌ Update error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update passage',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET: 特定の問題取得（Part 1またはPart 7を自動判別）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ passageId: string }> }
) {
  try {
    const { passageId } = await params;

    if (!passageId) {
      return NextResponse.json(
        { success: false, message: 'Passage ID is required' },
        { status: 400 }
      );
    }

    // Part 1問題かどうかを判別
    const isPart1 = passageId.includes('part1_');

    if (isPart1) {
      // Part 1問題の取得
      const part1Questions = readPart1Questions();
      const question = part1Questions.find(q => q.id === passageId);
      
      if (!question) {
        return NextResponse.json(
          { success: false, message: 'Part 1 question not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        question,
        type: 'part1'
      });

    } else {
      // Part 7問題の取得
      const part7Data = readPart7Passages();
      const passage = part7Data.passages.find(p => p.id === passageId);
      
      if (!passage) {
        return NextResponse.json(
          { success: false, message: 'Part 7 passage not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        passage,
        type: 'part7'
      });
    }

  } catch (error) {
    console.error('❌ Get passage error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get passage',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}