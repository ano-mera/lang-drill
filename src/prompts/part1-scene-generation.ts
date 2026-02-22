export interface SceneGenerationConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
  count: number;
}

export interface SceneExample {
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  sceneDescription: string;
  translation: string;
}

export const SCENE_EXAMPLES: SceneExample[] = [
  {
    difficulty: 'easy',
    topic: 'office',
    sceneDescription: 'A businesswoman is sitting at her desk in an office, typing on a computer keyboard while looking at the monitor screen.',
    translation: 'オフィスでビジネスウーマンがデスクに座り、モニター画面を見ながらコンピューターのキーボードを打っている。'
  },
  {
    difficulty: 'easy', 
    topic: 'restaurant',
    sceneDescription: 'A waiter is carrying a tray with dishes and walking towards a table where customers are seated.',
    translation: 'ウェイターが料理の載ったトレーを運び、お客さんが座っているテーブルに向かって歩いている。'
  },
  {
    difficulty: 'medium',
    topic: 'airport',
    sceneDescription: 'Several passengers are standing in line at the check-in counter while a female airline employee is processing their boarding passes and checking their luggage.',
    translation: '複数の乗客がチェックインカウンターで列に並んでおり、女性の航空会社職員が搭乗券の手続きをして荷物を確認している。'
  },
  {
    difficulty: 'medium',
    topic: 'hospital',
    sceneDescription: 'A doctor in a white coat is examining a patient who is sitting on an examination table, while a nurse is taking notes on a clipboard.',
    translation: '白衣を着た医師が診察台に座っている患者を診察しており、看護師がクリップボードにメモを取っている。'
  },
  {
    difficulty: 'hard',
    topic: 'construction',
    sceneDescription: 'Multiple construction workers wearing hard hats and safety vests are collaborating on a building site, with one operating heavy machinery while others are discussing blueprints and coordinating the installation of steel beams.',
    translation: 'ヘルメットと安全ベストを着用した複数の建設作業員が建設現場で協力しており、一人が重機を操作している間、他の作業員は設計図について話し合い、鉄骨の設置を調整している。'
  }
];

export const SCENE_TOPICS = [
  'office', 'restaurant', 'airport', 'train_station', 'hospital', 
  'bank', 'hotel', 'store', 'library', 'park', 'construction',
  'factory', 'meeting', 'presentation', 'interview'
];

export const SCENE_GENERATION_PROMPT = {
  systemPrompt: `You are an expert TOEIC Part 1 test creator specializing in generating realistic scene descriptions for photo description questions. Your role is to create detailed, natural scene descriptions in English that would correspond to photographs used in TOEIC Part 1 tests.

Key Requirements:
- Create scenes that are appropriate for TOEIC Part 1 format
- Use present continuous tense for actions (is/are + verb-ing)
- Include specific details about people, actions, and environments
- Ensure scenes are realistic and commonly encountered in professional/daily life contexts
- Vary the complexity based on difficulty level
- Focus on observable actions and visible elements`,

  userPrompt: (config: SceneGenerationConfig) => `Generate ${config.count} detailed scene description(s) for TOEIC Part 1 questions.

Requirements:
- Difficulty: ${config.difficulty}
- Topic focus: ${config.topic || 'varied professional/daily life contexts'}
- Language: English only
- Format: Each scene should be 1-2 sentences describing what someone would see in a photograph

Difficulty Guidelines:
- Easy: Simple actions, common vocabulary, single person/clear subject
- Medium: Multiple people, slightly complex actions, workplace scenarios  
- Hard: Complex scenes, multiple simultaneous actions, technical/professional contexts

Please provide scene descriptions that are:
1. Visually clear and specific
2. Appropriate for the difficulty level
3. Realistic and commonly encountered
4. Suitable for creating 4 multiple-choice questions
5. Using present continuous tense for actions

Format your response as a JSON array:
[
  {
    "sceneDescription": "Your scene description here",
    "difficulty": "${config.difficulty}",
    "topic": "identified topic category"
  }
]`,

  examples: SCENE_EXAMPLES
};