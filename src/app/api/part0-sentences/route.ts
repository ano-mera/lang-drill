import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// OpenAI client lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Voice profiles for audio generation
const VOICE_PROFILES = {
  male: "onyx",
  female: "nova"
};

// Helper functions
function loadExistingData() {
  const dataPath = path.join(process.cwd(), 'src/data/part0-sentences.json');
  if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    return data.sentences || [];
  }
  return [];
}

function getNextId(existingSentences: any[]) {
  if (existingSentences.length === 0) {
    return "p0-001";
  }
  const lastId = existingSentences[existingSentences.length - 1].id;
  const lastNumber = parseInt(lastId.split("-")[1]);
  return `p0-${String(lastNumber + 1).padStart(3, "0")}`;
}

function getDifficulty(wordCount: number) {
  if (wordCount <= 5) return "beginner";
  if (wordCount <= 8) return "intermediate";
  return "advanced";
}

export async function GET() {
  try {
    // データファイルのパスを構築
    const dataPath = path.join(process.cwd(), 'src/data/part0-sentences.json');
    
    // ファイルの存在チェック
    if (!fs.existsSync(dataPath)) {
      console.error('Part 0 sentences file not found:', dataPath);
      return NextResponse.json(
        { 
          error: 'Part 0 sentences data not found',
          path: dataPath 
        }, 
        { status: 404 }
      );
    }

    // ファイルを読み込み
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);

    console.log('Part 0 sentences loaded successfully:', {
      sentencesCount: data.sentences?.length || 0,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading Part 0 sentences:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load Part 0 sentences data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// POST method for generating new Part0 problems
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 1 } = body;
    
    // Validation
    if (count < 1 || count > 10) {
      return NextResponse.json(
        { success: false, message: 'Count must be between 1 and 10' },
        { status: 400 }
      );
    }

    console.log(`📝 Generating ${count} Part0 problems...`);
    
    // Generate problems using GPT-4o
    const standardPrompt = `
Generate ${count} short English sentences for TOEIC Part 0 practice.

Requirements:
- Length: 4-10 words per sentence
- Context: Business situations and daily conversations
- Grammar: Natural English used in TOEIC listening sections
- Difficulty distribution: Mix of beginner (4-5 words), intermediate (6-8 words), and advanced (9-10 words)

For EACH sentence, provide:
1. text: The English sentence
2. textTranslation: Natural Japanese translation
3. pronunciation: A learning point in Japanese that explains:
   - Key grammar patterns (e.g., "Could youは丁寧な依頼の定型表現")
   - Important vocabulary (e.g., "postponeは「延期する」を意味する動詞")
   - Pronunciation tips (e.g., "I'llの縮約形に注意")
   - Fixed expressions (e.g., "have a seatは「着席する」という意味の定型表現")
4. topic: Choose from: 日常会話, ビジネス, サービス, オフィス, 会議, 電話対応, 旅行, ホテル

Format as JSON array:
[
  {
    "text": "English sentence",
    "textTranslation": "Japanese translation",
    "pronunciation": "Learning point in Japanese",
    "topic": "Category"
  }
]

Make sentences practical and commonly used in TOEIC listening sections.
The learning points should be educational and helpful for Japanese TOEIC learners.
    `;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert TOEIC test creator specializing in business English education for Japanese learners. Generate content that matches the existing Part 0 data patterns."
        },
        {
          role: "user",
          content: standardPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    console.log("✅ GPT-4o response received");
    
    // Extract JSON
    const jsonMatch = content?.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from GPT response");
    }
    
    const problems = JSON.parse(jsonMatch[0]);
    console.log(`✅ Parsed ${problems.length} problems`);

    // Load existing data
    const existingSentences = loadExistingData();
    const newProblems = [];
    
    for (const problem of problems) {
      const wordCount = problem.text.split(' ').length;
      const id = getNextId([...existingSentences, ...newProblems]);
      
      const newProblem = {
        id,
        text: problem.text,
        textTranslation: problem.textTranslation,
        difficulty: getDifficulty(wordCount),
        wordCount,
        topic: problem.topic,
        audioFiles: {
          male: `/audio/part0/${id}_male.mp3`,
          female: `/audio/part0/${id}_female.mp3`
        },
        pronunciation: problem.pronunciation,
        createdAt: new Date().toISOString()
      };
      
      // Generate audio files
      const audioDir = path.join(process.cwd(), 'public/audio/part0');
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      
      try {
        // Generate male voice
        const maleResponse = await openai.audio.speech.create({
          model: "tts-1",
          voice: VOICE_PROFILES.male,
          input: problem.text,
          speed: 0.9
        });
        const maleBuffer = Buffer.from(await maleResponse.arrayBuffer());
        fs.writeFileSync(path.join(audioDir, `${id}_male.mp3`), maleBuffer);
        
        // Generate female voice
        const femaleResponse = await openai.audio.speech.create({
          model: "tts-1",
          voice: VOICE_PROFILES.female,
          input: problem.text,
          speed: 0.9
        });
        const femaleBuffer = Buffer.from(await femaleResponse.arrayBuffer());
        fs.writeFileSync(path.join(audioDir, `${id}_female.mp3`), femaleBuffer);
        
        console.log(`  ✅ Audio files generated for ${id}`);
      } catch (audioError) {
        console.error(`  ❌ Failed to generate audio for ${id}:`, audioError);
        // Continue without audio - can be regenerated later
      }
      
      newProblems.push(newProblem);
    }
    
    // Update data file
    const allSentences = [...existingSentences, ...newProblems];
    const dataPath = path.join(process.cwd(), 'src/data/part0-sentences.json');
    
    // Backup existing file
    if (fs.existsSync(dataPath)) {
      const backupPath = `${dataPath.replace('.json', '')}-backup-${Date.now()}.json`;
      fs.copyFileSync(dataPath, backupPath);
      console.log(`📁 Backup created: ${path.basename(backupPath)}`);
    }
    
    // Write new data
    const finalData = { sentences: allSentences };
    fs.writeFileSync(dataPath, JSON.stringify(finalData, null, 2));
    
    console.log(`✅ Generated ${newProblems.length} Part0 problems successfully`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully generated ${newProblems.length} Part0 problems`,
      problems: newProblems,
      totalCount: allSentences.length
    });
    
  } catch (error) {
    console.error('Part 0 generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Part 0問題生成中にエラーが発生しました',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}