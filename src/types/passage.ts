export type TOEICPart = 'part1' | 'part5' | 'part7_single_text' | 'part7_single_chart' | 'part7_double';

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
}

export interface Part1Data {
  id: string;
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
}

export interface Part5Question extends Question {
  sentence: string;
  blankPosition: number;
  category: "品詞識別" | "動詞の形・時制" | "主語と動詞の一致" | "接続詞" | "前置詞" | "関係詞・代名詞" | "比較構文・数量" | "語彙選択" | "慣用表現・句動詞";
  intent: string;
  length: "short" | "medium" | "long";
  vocabLevel: "easy" | "medium" | "hard";
  optionsType: "同語の語形変化" | "類義語の選択" | "前置詞や接続詞の選択" | "同じ品詞で意味が紛らわしい語";
}

export interface Part5Data extends Part5Question {
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  createdAt: string;
  generationBatch?: string;
  qualityCheck?: QualityCheckResult;
  partType: "part5";
}

export interface Passage {
  id: string;
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
  part1Questions?: Part1Question[];
}
