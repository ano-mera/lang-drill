export type TOEICPart = 'part0' | 'part1' | 'part2' | 'part3' | 'part4' | 'part5' | 'part6' | 'part7_single_text' | 'part7_single_chart' | 'part7_double';

// 新しいPartType型定義（設定画面の分類と一致）
export type PartType = 'part0' | 'part1' | 'part2' | 'part3' | 'part4' | 'part5' | 'part6' | 'part7_single_text' | 'part7_single_chart' | 'part7_double';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  questionTranslation: string;
  optionTranslations: string[];
  referenceDocuments?: number[];
  crossReference?: boolean;
}

export interface QualityCheckResult {
  passed: boolean;
  score: number;
  issues: Array<{
    category: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    suggestion?: string;
  }>;
  recommendation: "approve" | "reject" | "revision_needed";
}

export interface PassageMetadata {
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: number;
  wordCount: number;
  questionCount: number;
  passageType: string;
  topic: string;
  qualityCheck?: QualityCheckResult;
}

export interface Document {
  id: string;
  type: "article" | "email" | "advertisement" | "chart" | "notice" | "memo" | "form";
  title: string;
  content: string;
  contentTranslation: string;
  hasChart?: boolean;
  chart?: any;
}

export interface Part1Question extends Question {
  imageUrl?: string;
  audioUrl?: string;
  imageDescription?: string;
  imageDescriptionTranslation?: string;
  voiceProfile?: {               // 音声プロファイル
    voiceId: string;
    gender: string;
    accent: string;
    country: string;
    age: string;
    tone: string;
  };
  scene?: string;              // 環境・シーン情報
  imagePath?: string;          // 最適化画像パス（表示用）
  originalImagePath?: string;  // 元画像パス（アーカイブ用）
  optionExplanations?: {       // 各選択肢の個別解説
    [key: string]: {
      type: 'correct' | 'confusing' | 'unrelated';
      explanation?: string;  // 紛らわしい選択肢のみ解説あり
    };
  };
}

export interface Part1Data {
  id: string;
  partType?: PartType;
  sceneDescription: string;
  sceneDescriptionTranslation: string;
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
  qualityCheck?: QualityCheckResult;
  voiceProfile?: {               // 音声プロファイル
    voiceId: string;
    gender: string;
    accent: string;
    country: string;
    age: string;
    tone: string;
  };
  audioFiles?: Array<{
    option: string;
    text: string;
    audioPath: string;
  }>;
  scene?: string;              // 環境・シーン情報
  imagePath?: string;          // 最適化画像パス（表示用）
  originalImagePath?: string;  // 元画像パス（アーカイブ用）
  optionExplanations?: {       // 各選択肢の個別解説
    [key: string]: {
      type: 'correct' | 'confusing' | 'unrelated';
      explanation?: string;  // 紛らわしい選択肢のみ解説あり
    };
  };
}

export interface Part2Question {
  id: string;
  partType?: PartType;
  question: string;              // 質問文（英語）
  questionTranslation: string;   // 質問文（日本語翻訳）
  options: [string, string, string]; // 3つの応答選択肢（A, B, C）
  optionTranslations: [string, string, string]; // 選択肢の日本語翻訳
  correct: 'A' | 'B' | 'C';      // 正解
  explanation: string;           // 解説（日本語）
  questionType: 'wh-question' | 'yes-no' | 'choice' | 'negative' | 'tag' | 'request' | 'indirect';
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;                 // ビジネス、日常生活など
  createdAt: string;
  generationBatch: string;
  voiceProfile?: {               // 音声プロファイル
    voiceId: string;
    gender: string;
    accent: string;
    country: string;
    age: string;
    tone: string;
  };
  audioFiles?: {
    question: {
      text: string;
      audioPath: string | null;
    };
    options: Array<{
      option: 'A' | 'B' | 'C';
      text: string;
      audioPath: string | null;
      labelAudioPath?: string;   // "A", "B", "C"の音声
    }>;
  };
}

export interface Part3Speaker {
  id: string;                    // 話者ID (A, B, C など)
  name: string;                  // 話者名 (Man, Woman, Customer など)
  role: string;                  // 役割 (客、店員、同僚など)
  gender?: 'male' | 'female';   // 性別
  voiceProfile?: {               // 音声プロファイル
    voiceId: string;
    gender: string;
    accent: string;
    country: string;
    age: string;
    tone: string;
  };
}

export interface Part3Turn {
  speaker: string;               // 話者ID
  text: string;                  // 発話内容（英語）
  translation: string;           // 日本語翻訳
}

export interface Part3Question {
  id: string;
  partType?: PartType;
  scenario: string;              // シナリオ（会議、電話など）
  scenarioTranslation: string;   // シナリオ翻訳
  industry?: string;             // 業種（小売業、医療など）
  conversation: Part3Turn[];     // 会話の流れ
  speakers: Part3Speaker[];      // 話者情報
  questions: Array<{             // 3問セット
    id: string;
    question: string;            // 問題文（英語）
    questionTranslation: string; // 問題文翻訳
    options: string[];           // 4つの選択肢（A, B, C, D）
    optionTranslations: string[]; // 選択肢翻訳
    correct: string;             // 正解（テキスト形式）
    explanation: string;         // 解説（日本語）
    questionType: 'detail' | 'main_idea' | 'inference' | 'speaker_intention' | 'next_action';
  }>;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;                 // オフィス、レストラン、病院など
  createdAt: string;
  generationBatch: string;
  generationPrompts?: Array<{    // 生成時のプロンプト情報
    type: string;
    systemPrompt: string;
    userPrompt: string;
    response?: string;
    timestamp: string;
    config?: {
      difficulty: string;
      topic?: string;
    };
  }>;
  audioFiles?: {
    conversation: {              // 会話音声
      audioPath?: string | null; // レガシー対応
      segments?: Array<{        // セグメント形式（新方式）
        speaker: string;
        audioPath: string;
        text: string;
      }>;
      combinedAudioPath?: string | null;
    };
    questions: Array<{           // 各問題の音声
      questionNumber: number;
      audioPath: string | null;
    }>;
  };
}

export interface Part4Speaker {
  id: string;                    // 話者ID (通常は1人なのでA)
  name: string;                  // 話者名 (Announcer, Speaker など)
  role: string;                  // 役割 (アナウンサー、ガイドなど)
  gender?: 'male' | 'female';   // 性別
  voiceProfile?: {               // 音声プロファイル
    voiceId: string;
    gender: string;
    accent: string;
    country: string;
    age: string;
    tone: string;
  };
}

export interface Part4Question {
  id: string;
  partType?: PartType;
  speechType: string;            // スピーチタイプ（company_announcement, event_announcementなど）
  speechTypeTranslation: string; // スピーチタイプ翻訳
  industry?: string;             // 業種（小売業、医療など）
  speaker: Part4Speaker;         // 話者情報（1人）
  text: string;                  // スピーチ内容（英語）
  textTranslation: string;       // スピーチ内容翻訳
  questions: Array<{             // 3問セット
    id: string;
    question: string;            // 問題文（英語）
    questionTranslation: string; // 問題文翻訳
    options: string[];           // 4つの選択肢（A, B, C, D）
    optionTranslations: string[]; // 選択肢翻訳
    correct: string;             // 正解（テキスト形式）
    explanation: string;         // 解説（日本語）
    questionType: 'main_purpose' | 'detail' | 'inference' | 'next_action' | 'intended_audience';
  }>;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;                 // 発表の主題
  createdAt: string;
  generationBatch: string;
  generationPrompts?: Array<{    // 生成時のプロンプト情報
    type: string;
    systemPrompt: string;
    userPrompt: string;
    response?: string;
    timestamp: string;
    config?: {
      difficulty: string;
      topic?: string;
    };
  }>;
  audioFiles?: {
    speech: {                    // スピーチ音声
      audioPath: string | null;
      text: string;
    };
  };
}

export interface Part6Question {
  id: string;
  documentType: "email" | "letter" | "article" | "advertisement" | "notice" | "memo";
  title: string;
  titleTranslation?: string;
  content: string;
  contentTranslation: string;
  questions: Array<{
    id: string;
    question: string;
    questionTranslation: string;
    options: string[];
    optionTranslations: string[];
    correct: string;
    explanation: string;
    questionType: "vocabulary" | "grammar" | "context" | "sentence_insertion";
  }>;
}

export interface Part6Data extends Part6Question {
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  createdAt: string;
  generationBatch?: string;
  qualityCheck?: QualityCheckResult;
  partType: "part6";
}

export interface Part0Sentence {
  id: string;
  text: string;                    // 英文
  textTranslation: string;         // 日本語訳
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  wordCount: number;               // 単語数
  topic: string;                   // トピック
  audioFiles: {
    male?: string;                 // 男性音声パス
    female?: string;               // 女性音声パス
  };
  pronunciation?: string;          // 発音のポイント
  createdAt: string;
  generationBatch?: string;
}

export interface Passage {
  id: string;
  partType?: PartType;
  title: string;
  type: "article" | "email" | "advertisement" | "chart";
  content: string;
  metadata: PassageMetadata;
  questions: Question[];
  contentTranslation: string;
  createdAt?: string;
  generationBatch?: string;
  hasChart?: boolean;
  chart?: any;
  documents?: Document[];
  documentTypes?: string[];
  isMultiDocument?: boolean;
  toeicPart: TOEICPart;
  part1Questions?: Part1Data[];
}
