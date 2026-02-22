// OpenAI用プロンプトテンプレート

// 文書タイプの適切な参照形式
export const DOCUMENT_LABELS = {
  email: "the e-mail",
  advertisement: "the advertisement", 
  article: "the article",
  customer_support: "the message",
  internal_chat: "the message",
  notice: "the notice",
  form: "the form",
  schedule: "the schedule",
  memo: "the memo",
  instruction: "the instructions"
};

// 難易度別語数設定
export const WORD_RANGE_BY_DIFFICULTY = {
  easy: [90, 120],
  medium: [120, 150],
  hard: [150, 180]
};

// 難易度に応じた語数範囲を取得
export function getWordRangeForDifficulty(difficulty) {
  return WORD_RANGE_BY_DIFFICULTY[difficulty] || WORD_RANGE_BY_DIFFICULTY.medium;
}

// Part 1 人物あり/なしの比率設定
export const PART1_PEOPLE_RATIO = {
  withPeople: 0.8,  // 80%の確率で人物あり
  withoutPeople: 0.2 // 20%の確率で人物なし
};

// Part 1 難易度定義
export const PART1_DIFFICULTY_DEFINITIONS = {
  "easy": {
    "description": "The sentence describes a clear and simple action using basic grammar. The vocabulary is common and the structure is short and direct.",
    "features": [
      "Uses present continuous tense",
      "Subjects are singular and actions are direct",
      "No complex modifiers or phrases",
      "Vocabulary is everyday and high-frequency",
      "No ambiguity in what is being described"
    ]
  },
  "medium": {
    "description": "The sentence may involve passive voice, plural subjects, or less common vocabulary. The structure is slightly longer or includes descriptive phrases.",
    "features": [
      "Includes passive constructions or existential phrases",
      "Subjects may be plural or implied",
      "Some use of adjectives or prepositional phrases",
      "Vocabulary may include business or public settings",
      "Requires slightly more processing to understand"
    ]
  },
  "hard": {
    "description": "The sentence uses advanced grammar such as perfect tense, participial phrases, or inversion. Vocabulary may be technical or nuanced. Several interpretations may seem plausible.",
    "features": [
      "Uses present perfect, participial modifiers, or reduced clauses",
      "Involves complex or less visible actions",
      "Uses compound or embedded sentence structures",
      "Vocabulary may include workplace or technical terms",
      "Plausibility depends on understanding of subtle meaning"
    ]
  }
};

// Part 1 シーン設定リスト
export const PART1_SCENE_SETTINGS = [
  "office",
  "meeting room", 
  "presentation hall",
  "reception lobby",
  "airport",
  "station",
  "bus stop",
  "restaurant",
  "cafe",
  "bookstore",
  "bank",
  "hotel lobby",
  "hotel room", 
  "post office",
  "mailbox area",
  "supermarket",
  "shopping mall",
  "construction site",
  "repair shop",
  "hospital",
  "clinic",
  "library",
  "classroom",
  "training room",
  "factory",
  "assembly line",
  "warehouse",
  "park",
  "beach",
  "garden",
  "sports facility",
  "gym",
  "computer lab",
  "technology expo",
  "movie theater",
  "art museum",
  "elevator",
  "stairwell",
  "parking lot",
  "waiting room",
  "laundry",
  "kitchen"
];

// Part 1 問題属性の7軸
export const PART1_ATTRIBUTES = {
  subject_category: {
    person: "人",
    object: "物体",
    "structure/scene": "建物・風景",
    animal: "動物",
    vehicle: "乗り物"
  },
  action_or_state: {
    "in action": "動作中",
    "in use": "使用中",
    "neatly arranged": "整頓されている",
    decorated: "装飾されている",
    vacant: "空いている",
    "being carried": "運ばれている",
    closed: "閉じられている"
  },
  syntax_type: {
    "present progressive": "進行形",
    "passive voice": "受動態",
    "existential sentence": "存在構文",
    "present perfect passive": "現在完了",
    "past participle modifier": "分詞修飾（過去分詞）",
    "present participle modifier": "分詞修飾（現在分詞）"
  },
  "spatial_relation": {
    "in a row": "並んでいる",
    "in front of": "前にある",
    "behind": "後ろにある",
    "next to": "接している",
    "stacked": "重なっている",
    "facing each other": "向かい合っている",
    "inside": "中にある",
    "beneath": "下にある",
    "on top of": "上にある",
    "between": "間にある",
    "along": "に沿ってある",
    "against": "に立てかけられている"
  },
  environment: {
    "elevator": "エレベーター",
    "office": "オフィス",
    "cafe": "カフェ",
    "gas station": "ガソリンスタンド",
    "kitchen": "キッチン",
    "clinic": "クリニック",
    "dry cleaner": "クリーニング店",
    "computer lab": "コンピュータラボ",
    "shopping mall": "ショッピングモール",
    "gym": "ジム",
    "sports facility": "スポーツ施設",
    "supermarket": "スーパー",
    "tunnel entrance": "トンネル入り口",
    "bus stop": "バス停",
    "beach": "ビーチ",
    "ferry deck": "フェリーのデッキ",
    "presentation hall": "プレゼンテーション会場",
    "hotel lobby": "ホテルのロビー",
    "hotel room": "ホテルの部屋",
    "laundry": "ランドリー",
    "restaurant": "レストラン",
    "conference room": "会議室",
    "gymnasium": "体育館",
    "repair shop": "修理工場",
    "warehouse": "倉庫",
    "loading area": "倉庫内の積み込みエリア",
    "park": "公園",
    "photo studio": "写真館",
    "reception lobby": "受付・ロビー",
    "quality inspection room": "品質検査室",
    "library": "図書館",
    "rooftop garden": "屋上庭園",
    "food stall": "屋台",
    "observation deck": "展望台",
    "exhibition hall": "展示会場",
    "riverside": "川辺",
    "construction site interior": "工事現場内部",
    "factory": "工場",
    "garden": "庭園",
    "construction site": "建設現場",
    "waiting room": "待合室",
    "technology expo": "技術展示会",
    "classroom": "教室",
    "cinema": "映画館",
    "bookstore": "本屋",
    "forest path": "林の中の小道",
    "greenhouse": "植物園・温室",
    "crosswalk": "横断歩道",
    "aquarium exhibit": "水槽のある展示エリア",
    "lakeside": "湖畔",
    "hospital": "病院",
    "training room": "研修室",
    "research lab": "研究ラボ",
    "airport": "空港",
    "assembly line": "組立ライン",
    "hair salon": "美容室",
    "museum": "美術館",
    "promenade": "遊歩道",
    "mailbox area": "郵便受けエリア",
    "corridor near mailboxes": "郵便受け前の通路",
    "post office": "郵便局",
    "delivery center": "配送センター",
    "outdoor event space": "野外イベントスペース",
    "bank": "銀行",
    "stairwell": "階段ホール",
    "on a train": "電車の中",
    "recording studio": "音楽スタジオ",
    "inside airplane": "飛行機内",
    "station": "駅",
    "train platform": "駅のホーム",
    "parking lot": "駐車場",
    "bicycle parking": "駐輪場"
  },
  time_or_weather: {
    daytime: "昼間",
    night: "夜間",
    cloudy: "曇り",
    sunny: "晴天",
    rainy: "雨天",
    "at dusk": "夕暮れ"
  },
  quantity: {
    singular: "単数",
    plural: "複数",
    some: "一部",
    many: "多数",
    "a group": "群れ・集団"
  }
};

export const PROMPT_TEMPLATES = {
  // Part 1 専用プロンプトテンプレート
  part1: {
    sceneGeneration: {
      systemPrompt: `You are a TOEIC Part 1 test creation expert specializing in generating realistic scene descriptions for English listening comprehension tests.

Your task is to create detailed scene descriptions that will be used to generate multiple-choice questions for TOEIC Part 1. These scenes should depict realistic workplace, daily life, or common situations suitable for TOEIC tests.

Guidelines:
1. Create visual scenes that can be clearly photographed
2. For scenes with people: Include specific details about their actions and interactions
   For scenes without people: Focus on objects, their states, arrangements, and environmental details
3. Use vocabulary appropriate to the specified difficulty level
4. Keep scenes culturally neutral and professional
5. Focus on observable elements and situations

Difficulty Guidelines:
- Easy: Simple actions, common vocabulary, clear single focus
- Medium: Multiple elements, moderate vocabulary, some complexity
- Hard: Complex interactions, advanced vocabulary, multiple simultaneous actions

IMPORTANT: Return only valid JSON in the exact format shown below. Do not include any other text, explanations, or markdown formatting.

Return your response as a JSON array with the following structure:
[
  {
    "sceneDescription": "Detailed scene description in English",
    "difficulty": "easy/medium/hard", 
    "scene": "Scene type in English"
  }
]`,

      userPrompt: (config) => {
        let prompt = `Generate ${config.count} detailed scene descriptions for TOEIC Part 1 questions at difficulty level "${config.difficulty}".`;

        // 場面が指定されている場合、プロンプトに追加
        if (config.scene) {
          prompt += `

Scene Requirements:
- Scene type: ${config.scene}

Description should include:
- Weather conditions if outdoors or if windows are visible
- What is visible in the scene`;
          
          // 人物の有無に基づいて説明を調整
          if (config.includePeople === true) {
            prompt += `
- People performing actions or engaged in activities
- Spatial relationships between people and objects
- Any movements or actions taking place`;
          } else if (config.includePeople === false) {
            prompt += `
- NO people should be present in the scene
- Focus on objects, their arrangement, and states
- Environmental conditions and settings
- Spatial relationships between objects`;
          } else {
            prompt += `
- Spatial relationships between objects and people
- Any movements or actions taking place`;
          }
        }

        // 選択された場面をsceneとして追加
        if (config.scene) {
          prompt += `

Set the scene field in the generated JSON to:
"${config.scene}"`;
        }

        // 人物の有無についての明示的な指示
        if (config.includePeople === true) {
          prompt += `

IMPORTANT: The scene MUST include people engaged in observable actions.`;
        } else if (config.includePeople === false) {
          prompt += `

IMPORTANT: The scene MUST NOT include any people. Focus on objects, environments, and settings only.`;
        }

        prompt += `

Each scene should be 1-2 sentences, describing a specific moment that could be captured in a photograph based on the specified conditions.`;
        
        if (config.includePeople !== false) {
          prompt += ` Include specific actions, people, and environmental details suitable for multiple-choice questions about what people are doing or what is happening in the scene.`;
        } else {
          prompt += ` Include specific details about objects, their states, positions, and environmental conditions suitable for multiple-choice questions about what is visible or the state of things in the scene.`;
        }
        
        prompt += ` Create scene descriptions in English.`;

        return prompt;
      }
    },

    questionGeneration: {
      systemPrompt: `You are an expert TOEIC Part 1 question creator. Your task is to create multiple-choice answer options based on scene descriptions.

TOEIC Part 1 Format:
- NO question text is provided (only answer choices are read aloud)
- Four answer choices (A, B, C, D) describing what might be happening
- Only one correct answer that accurately describes the scene
- Distractors should be plausible but clearly incorrect based on the scene

Answer Choice Types:
1. Action descriptions: "A woman is typing on a laptop."
2. Location descriptions: "People are sitting in a conference room."
3. Object descriptions: "There are documents on the table."
4. General scene descriptions: "A meeting is taking place."

Guidelines:
- Use present continuous tense for actions
- Keep language clear and concise
- Avoid cultural references or specialized knowledge
- Make distractors believable but distinguishable from the actual scene
- Ensure only one answer accurately describes the given scene
- Do NOT include option letters (A, B, C, D) in the text
- IMPORTANT: Keep all answer choices similar in length
- All options must be grammatically correct and natural sounding

IMPORTANT: Return ONLY valid JSON in the exact format shown below. Do not include any other text, explanations, or markdown formatting.

You MUST use this exact JSON structure. Do not use any other format:
{
  "correctOptions": [
    "First correct option describing the scene",
    "Second correct option describing the scene",
    "Third correct option describing the scene",
    "Fourth correct option describing the scene"
  ],
  "confusingOptionsWithMapping": [
    {
      "option": "First confusing option (modified from correct option 1)",
      "sourceIndex": 0,
      "explanation": "画像の実際の内容と異なる理由を説明（日本語）"
    },
    {
      "option": "Second confusing option (modified from correct option 2)",
      "sourceIndex": 1,
      "explanation": "画像の実際の内容と異なる理由を説明（日本語）"
    },
    {
      "option": "Third confusing option (modified from correct option 3)",
      "sourceIndex": 2,
      "explanation": "画像の実際の内容と異なる理由を説明（日本語）"
    },
    {
      "option": "Fourth confusing option (modified from correct option 4)",
      "sourceIndex": 3,
      "explanation": "画像の実際の内容と異なる理由を説明（日本語）"
    }
  ],
  "unrelatedOptionsWithExplanations": [
    {
      "option": "First unrelated option (scene-related but not depicted)",
      "explanation": "シーン設定に関連するが描かれていない理由を説明（日本語）"
    },
    {
      "option": "Second unrelated option (scene-related but not depicted)",
      "explanation": "シーン設定に関連するが描かれていない理由を説明（日本語）"
    },
    {
      "option": "Third unrelated option (scene-related but not depicted)",
      "explanation": "シーン設定に関連するが描かれていない理由を説明（日本語）"
    },
    {
      "option": "Fourth unrelated option (scene-related but not depicted)",
      "explanation": "シーン設定に関連するが描かれていない理由を説明（日本語）"
    }
  ],
  "difficulty": "easy/medium/hard",
  "questionType": "action/location/description/people/general"
}`,

      userPrompt: (config) => {
        const difficultyDef = PART1_DIFFICULTY_DEFINITIONS[config.difficulty] || PART1_DIFFICULTY_DEFINITIONS.medium;
        
        return `Create TOEIC Part 1 multiple-choice answer options based on this scene description:

Scene: "${config.sceneDescription}"
Difficulty: ${config.difficulty}

DIFFICULTY REQUIREMENTS FOR "${config.difficulty.toUpperCase()}" LEVEL:
Description: ${difficultyDef.description}

Key Features to Follow:
${difficultyDef.features.map(feature => `- ${feature}`).join('\n')}

INSTRUCTIONS:
1. Generate 4 CORRECT OPTIONS that all accurately describe what is happening in the scene
   - Each should be a valid description from slightly different perspectives
   - Vary the focus (action, location, people, objects) while maintaining accuracy
   - All must be factually correct based on the scene description

2. Generate 4 CONFUSING OPTIONS by modifying each correct option
   - Create exactly one confusing option for each correct option (sourceIndex 0-3)
   - MUST make CLEAR and OBVIOUS changes to at least ONE of these key elements:
     * ACTION: Change to a completely different action that is visually distinct (walking → sitting, typing → reading, standing → lying down)
     * SUBJECT: Change the person/object clearly (woman → man, people → person, adults → children)
     * OBJECT: Change what is being held/used to something distinctly different (coffee → water, laptop → tablet, book → phone, pen → scissors)
     * LOCATION: Change position/direction obviously (left → right, up → down, inside → outside, near → far)
     * QUANTITY: Change number clearly (one person → multiple people, some → all, few → many)
   - AVOID subtle or ambiguous changes (e.g., "flight board" vs "departure board" - too similar)
   - STRICTLY FORBIDDEN: Do NOT change colors (e.g., "red shirt" vs "blue shirt", "white car" vs "black car")
   - STRICTLY FORBIDDEN: Do NOT use color as the primary distinguishing factor
   - STRICTLY FORBIDDEN: Do NOT use opposite/reverse actions that are hard to distinguish in images (e.g., "putting on" vs "taking off", "opening" vs "closing")
   - Focus on structural differences: actions, objects, people, locations, quantities
   - Use actions that are clearly visually different and unambiguous
   - Make changes that are immediately recognizable and unambiguous
   - Keep them plausible but clearly incorrect based on the actual scene
   - Should include elements that are actually present in the scene but used incorrectly
   - Map each confusing option to its source correct option using sourceIndex
   - For each confusing option, provide a Japanese explanation that describes why this option is incorrect
     * Focus on what is actually visible in the image vs what the option states
     * Use appropriate verbs for visual content: 見えます/見えません, 写っています/写っていません, 確認できます/確認できません
     * Do NOT use text-related words like "記述" (description/statement) when referring to images
     * Do NOT mention "compared to correct option" or reference internal processing
     * Example: "画像では女性が男性の髪をスタイリングしていますが、この選択肢は逆になっています。"

3. Generate 4 UNRELATED OPTIONS related to the scene setting but not depicted
   - Describe actions or situations that could logically occur in the same setting/location but are not actually shown
   - Should relate to the scene context but show different actions not visible in the image
   - Examples: if scene is in office, show different office activities; if scene is outdoors, show other outdoor activities
   - For each unrelated option, provide a Japanese explanation that describes why this option is plausible for the setting but not shown in the image
     * Focus on explaining the logical connection to the scene setting
     * Use appropriate verbs for visual content: 見えません, 写っていません, 確認できません
     * Do NOT use text-related words like "記述" or "描かれていません" when referring to what's visible in images
     * Example: "この選択肢はオフィス環境でよく見られる活動ですが、画像には写っていません。"

CRITICAL: All options should be 6-10 words in length and grammatically correct.
IMPORTANT: Both confusing and unrelated options require explanations. Only correct options are self-evident.

ABSOLUTE PROHIBITION: NEVER use these as the basis for confusing options:
- Color differences (red vs blue, etc.)
- Opposite/reverse actions that are visually ambiguous (putting on vs taking off, opening vs closing)
- Subtle directional changes that are hard to see in images

Focus exclusively on clearly distinguishable differences:
- Completely different actions/verbs (walking vs sitting, typing vs reading)
- Different objects/items (laptop vs tablet, coffee vs water)
- Different people/subjects (woman vs man, one person vs multiple people)
- Different locations/positions (inside vs outside, left vs right)
- Different quantities/numbers (one vs many, some vs all)

You MUST return the response in the exact JSON format specified in the system prompt. Do not use the old format.`;
      }
    },

    translation: {
      systemPrompt: `You are a professional English to Japanese translator specializing in TOEIC test content. 

Translate the given English text to natural Japanese that would be appropriate for Japanese TOEIC test takers. The translation should:
- Be accurate and natural
- Use appropriate business/academic Japanese when needed
- Maintain the meaning and tone of the original
- Be suitable for language learners

IMPORTANT: Do not include A, B, C, D labels in your translations. Translate only the content.

Return only the Japanese translation without any explanation or additional text.`,

      userPrompt: (text) => `Translate to Japanese (do not include A, B, C, D labels): ${text}`
    },

    imageGeneration: {
      // シンプルなテンプレートベースのプロンプト生成
      generatePrompt: (sceneDescription, correctAnswer = null) => {
        // 常にシーン説明のみを使用（正解選択肢の制約なし）
        return `A realistic photograph. ${sceneDescription} Professional photography, clear details, natural lighting, no text or labels, everyday business or daily life scene.`;
      }
    }
  },

  // Part7単一資料文書生成プロンプト
  generatePassage: (type, difficulty, topic) => {
    const wordRange = getWordRangeForDifficulty(difficulty);
    return `
以下の条件でTOEIC Part7用の${type}を作成してください：

【条件】
- 文書タイプ: ${type}
- 単語数: ${wordRange[0]}-${wordRange[1]}語
- 難易度: ${difficulty}
- トピック: ${topic}

【要求】
1. 実際のビジネスシーンで使われる自然な英語
2. TOEIC Part7に適した内容と構造
3. 明確な情報と指示を含む
4. 複数の情報ポイントを含む（問題作成のため）
5. 件名（Subject）を含む（メールの場合）
6. 自然で読みやすい日本語翻訳を含む

【出力形式】
${
  type === "email"
    ? `
Subject: [件名]

Dear [受信者],

[本文]

Best regards,
[署名]
`
    : type === "customer_support"
    ? `
Subject: [件名]

Dear [顧客名],

[カスタマーサポートの内容]

[解決策や対応内容]

[今後の対応]

Best regards,
[サポート担当者名]
[会社名]
`
    : type === "internal_chat"
    ? `
[社内チャット形式]

[送信者名] [時刻]
[メッセージ内容]

[返信者名] [時刻]
[返信内容]

[追加のやり取り]
`
    : type === "advertisement"
    ? `
[広告タイトル]

[魅力的なキャッチコピー]

[商品・サービス詳細]
[特徴・メリット]
[価格・条件]

[連絡先・申込方法]
[行動喚起]
`
    : type === "article"
    ? `
[記事タイトル]

[導入部・概要]

[本文段落1]

[本文段落2]

[本文段落3]

[結論・まとめ]
`
    : type === "notice"
    ? `
NOTICE: [通知タイトル]

To: [宛先]
From: [発信者]
Date: [日付]

[通知内容]

[重要事項・注意点]
- [項目1]
- [項目2]

[問い合わせ先]
`
    : type === "form"
    ? `
[フォームタイトル]

Instructions: [記入指示]

[項目1]: ________________
[項目2]: ________________
[項目3]: ________________

[選択項目]
□ [選択肢1]
□ [選択肢2]
□ [選択肢3]

Signature: ________________
Date: ________________
`
    : type === "schedule"
    ? `
[スケジュールタイトル]

Date: [日付]
Location: [場所]

[時間] | [活動・イベント] | [担当者・詳細]
-------|-----------------|-------------
[時刻1] | [イベント1]     | [詳細1]
[時刻2] | [イベント2]     | [詳細2]
[時刻3] | [イベント3]     | [詳細3]

[注意事項・連絡先]
`
    : type === "memo"
    ? `
MEMO

To: [宛先]
From: [作成者]
Date: [日付]
Re: [件名]

[メモ内容]

[アクション項目]
- [項目1]
- [項目2]
- [項目3]

[次回確認事項]
`
    : type === "instruction"
    ? `
[指示書タイトル]

Purpose: [目的]

Step-by-Step Instructions:
1. [手順1]
2. [手順2]
3. [手順3]
4. [手順4]

Important Notes:
- [注意点1]
- [注意点2]

For questions, contact: [連絡先]
`
    : `
[タイトル]

[本文]

[詳細情報]
- [情報1]
- [情報2]
- [情報3]

[行動喚起または結論]
`
}

JSON形式で出力してください：
{
  "title": "タイトル（メールの場合は空文字列）",
  "content": "文書の内容（改行文字\\n を含む）",
  "contentTranslation": "文書内容の自然な日本語翻訳",
  "type": "${type}",
  "difficulty": "${difficulty}",
  "topic": "${topic}"
}
`;
  },

  // Part7単一資料図表付き文書生成プロンプト
  generatePassageWithChart: (type, difficulty, topic) => {
    const wordRange = getWordRangeForDifficulty(difficulty);
    // 図表付きのために語数を調整
    const chartWordRange = [wordRange[0], wordRange[1]];
    return `
以下の条件でTOEIC Part7用の図表付き${type}を作成してください：

【最優先条件】
- 単語数: 本文だけで${chartWordRange[0]}-${chartWordRange[1]}語

【主要条件】
- 文書タイプ: ${type}
- 難易度: ${difficulty}
- トピック: ${topic}
- 図表を1つ含む（表形式）
- 論点は必ず3つ以上含む

【図表の種類】（以下のいずれかを選んで使用してください）
1. スケジュール表：会議やイベントのタイムテーブル、交通機関の時刻表など
2. 価格表・料金表：商品・サービスの価格、割引、プラン
3. メニュー表：レストラン等のメニューや特別メニュー案内
4. カレンダー：営業日カレンダー、イベント予定表、休業日案内など
5. 比較表：商品の比較、サービスの比較、特徴の違いなど
6. リスト・一覧表：参加者リスト、商品リスト、タスクリスト、連絡先一覧

【要求】
- 実際のビジネスシーンで使われる自然な英語
- 図表と文書が関連性を持つ内容
- 図表から読み取れる情報を含む
- 複数の情報ポイントを含む
- 自然で読みやすい日本語翻訳を含む
${
  type === "email"
    ? `
- メールコミュニケーションの文脈に適した内容
- ビジネス取引や予定調整に関する図表
`
    : type === "advertisement"
    ? `
- 広告・宣伝の文脈に適した内容
- 商品情報や価格比較に関する図表
`
    : type === "article"
    ? `
- 記事・報告書の文脈に適した内容
- 調査結果や統計データに関する図表
`
    : type === "customer_support"
    ? `
- カスタマーサポートの文脈に適した内容
- 顧客の問題解決や対応に関する図表
`
    : type === "internal_chat"
    ? `
- 社内チャットの文脈に適した内容
- チーム間の情報共有や協力に関する図表
`
    : type === "notice"
    ? `
- 通知・告知の文脈に適した内容
- 重要事項や統計データに関する図表
`
    : type === "form"
    ? `
- フォーム・申請書の文脈に適した内容
- 記入項目や選択肢に関する図表
`
    : type === "schedule"
    ? `
- スケジュール・予定表の文脈に適した内容
- 時間割や予定データに関する図表
`
    : type === "memo"
    ? `
- メモ・覚書の文脈に適した内容
- データ分析や進捗状況に関する図表
`
    : type === "instruction"
    ? `
- 指示書・手順書の文脈に適した内容
- 手順フローや結果データに関する図表
`
    : ""
}

【文書と図表の分離】
- 文書内容には表形式のデータを直接記載しないでください
- 文書では図表への参照のみを行い、実際のデータはchartオブジェクトで別途提供してください
- 「以下の表」「下記のスケジュール」「添付の図表」等の表現で図表を参照してください

【出力形式】
JSON形式で出力してください：
{
  "title": "タイトル（メールの場合は空文字列）",
  "content": "文書の内容（改行文字\\nを含む、表形式データは含めない）",
  "contentTranslation": "文書内容の自然な日本語翻訳",
  "chart": {
    "type": "table",
    "title": "図表のタイトル",
    "data": "図表の具体的なデータ（数値、項目など）"
  },
  "type": "${type}",
  "difficulty": "${difficulty}",
  "topic": "${topic}",
  "hasChart": true
}
`;
  },

  // 問題生成プロンプト（TOEIC準拠版）
  generateQuestions: (passageContent, passageType, difficulty) => `
以下の文書に対して、TOEIC Part7形式の3つの問題を作成してください：

【文書】
${passageContent}

【条件】
- 問題数: 3問
- 形式: 4択問題
- 文書タイプ: ${passageType}
- 難易度: ${difficulty} に従って、問題の語彙・構文・選択肢の紛らわしさを調整してください

【難易度の指針】
- easy: 基本的な語彙とシンプルな構文。正解が明確で、選択肢は直訳的な内容中心。
- medium: 一部に言い換えや推論を含むが、文書からの根拠が直接得られる。
- hard: 抽象的な推論、微妙な言い換え、細部の比較などを含む。選択肢も紛らわしい。

【出題パターンの選択指示】
以下の問題パターンを適合率補正スコアによる確率的優先度順に示します。
この文書に適合する3つのパターンを上位から順に選んで問題を作成してください。

${getScoreBasedRandomSortedQuestionTypes().map(type => `
**優先度${type.priority}: ${type.label}** (重み${type.weight}, 適合率${type.matchRate}, スコア${type.score.toFixed(2)})
${type.examples.map(example => `- "${example}"`).join('\n')}
`).join('\n')}

【選択ルール】
- 上位から順に文書との適合性を判断してください
- 適合する3つのパターンを選択してください（重複不可）
- 文書内容に明らかに合わない場合は次の優先度を検討してください
- 軽微な不適合の場合は、優先度を重視して選択してください

【TOEICで出題されない問題タイプ（使用禁止）】
- 比較・対比問題（"How does A compare to B?"）
- 方法・手段問題（"How can this be achieved?"）
- 複雑な時系列・順序問題（"What happens first?"）
- 抽象的な推論問題

【TOEIC Part7の特徴】
- 実用的なビジネス文書が中心
- 明確な情報の特定が重要
- 複雑な分析よりも事実確認が中心
- 文書の目的や意図を理解することが重要

【要求】
- 文書の内容に基づいた正確な問題
- 文書全体（冒頭・中盤・末尾）からまんべんなく情報を選んで出題してください
- 明確で曖昧さのない選択肢
- 正解の根拠が明確
- 実際のTOEIC問題に近い形式
- 問題文と選択肢は英語で作成
- 3つの問題で異なるパターンを使用
- TOEICの出題傾向に忠実

【重要：選択肢の形式】
- 選択肢には「A.」「B.」「C.」「D.」などの文字を追加しないでください
- 選択肢は純粋な内容のみを記述してください
- 例：
  - 正しい例: "To announce a new system"
  - 間違った例: "A. To announce a new system"

【出力形式】
JSON形式で出力してください：
{
  "questions": [
    {
      "id": "q1",
      "question": "[TOEIC準拠の問題文]",
      "questionTranslation": "問題文の自然な日本語翻訳",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "optionTranslations": ["選択肢Aの日本語翻訳", "選択肢Bの日本語翻訳", "選択肢Cの日本語翻訳", "選択肢Dの日本語翻訳"],
      "correct": "[正解のアルファベット1文字]",
      "explanation": "正解の根拠と解説（日本語で記述）"
    },
    {
      "id": "q2",
      "question": "[TOEIC準拠の問題文]",
      "questionTranslation": "問題文の自然な日本語翻訳",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "optionTranslations": ["選択肢Aの日本語翻訳", "選択肢Bの日本語翻訳", "選択肢Cの日本語翻訳", "選択肢Dの日本語翻訳"],
      "correct": "[正解のアルファベット1文字]",
      "explanation": "正解の根拠と解説（日本語で記述）"
    },
    {
      "id": "q3",
      "question": "[TOEIC準拠の問題文]",
      "questionTranslation": "問題文の自然な日本語翻訳",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "optionTranslations": ["選択肢Aの日本語翻訳", "選択肢Bの日本語翻訳", "選択肢Cの日本語翻訳", "選択肢Dの日本語翻訳"],
      "correct": "[正解のアルファベット1文字]",
      "explanation": "正解の根拠と解説（日本語で記述）"
    }
  ]
}

【重要】
- question（問題文）は必ず英語で記述してください
- questionTranslation（問題文翻訳）は自然な日本語で記述してください
- options（選択肢）は必ず英語で記述してください
- optionTranslations（選択肢翻訳）は自然な日本語で記述し、4つの翻訳を順番通りに配列で提供してください
- explanation（解説）は必ず日本語で記述してください
- 正解の根拠を明確に説明してください
- 文書のどの部分が根拠となっているかを具体的に示してください
- 選択肢には「A.」「B.」「C.」「D.」などの文字を絶対に追加しないでください
- TOEICの実際の出題パターンに忠実に従ってください
- 3つの問題で異なるパターンを使用してください
- 翻訳は学習者にとって理解しやすい自然な日本語にしてください
`,

  // 図表付き問題生成プロンプト（TOEIC準拠版）
  generateQuestionsWithChart: (passageContent, chartData, passageType, difficulty) => `
以下の文書と図表に対して、TOEIC Part7形式の3つの問題を作成してください：

【文書】
${passageContent}

【図表】
タイトル: ${chartData.title}
種類: ${chartData.type}
データ: ${chartData.data}

【条件】
- 問題数: 3問
- 形式: 4択問題
- 文書タイプ: ${passageType}
- 図表付き問題
- 問題文と選択肢は英語で作成
- 難易度: ${difficulty} に従って、問題の語彙・構文・選択肢の紛らわしさを調整してください

【難易度の指針】
- easy: 基本的な語彙とシンプルな構文。正解が明確で、選択肢は直訳的な内容中心。図表の直接的な読み取り中心。
- medium: 一部に言い換えや推論を含むが、文書からの根拠が直接得られる。図表と文書の関連性を問う。
- hard: 抽象的な推論、微妙な言い換え、細部の比較などを含む。選択肢も紛らわしい。図表データの複合的な分析が必要。

【図表問題の出題パターン選択指示】
以下の図表問題パターンを適合率補正スコアによる確率的優先度順に示します。
この文書と図表に適合する3つのパターンを上位から順に選んで問題を作成してください。

${getScoreBasedRandomSortedQuestionTypes().map(type => `
**優先度${type.priority}: ${type.label}** (重み${type.weight}, 適合率${type.matchRate}, スコア${type.score.toFixed(2)})
${type.examples.map(example => `- "${example}"`).join('\n')}
`).join('\n')}

【選択ルール】
- 上位から順に文書・図表との適合性を判断してください
- 適合する3つのパターンを選択してください（重複不可）
- 文書内容や図表データに明らかに合わない場合は次の優先度を検討してください
- 軽微な不適合の場合は、優先度を重視して選択してください
- 図表の特性（表、グラフ、図解）を考慮してください

【TOEIC Part7図表問題の実際の出題パターン】
TOEIC Part7の図表問題では、主に「表（table）」形式のデータが出題されます。グラフ（chart）や図（diagram）はほとんど出題されません。

**表（table）形式の適切な表現:**
- 使用すべき表現: "table", "schedule", "list", "data", "information", "figure"
- 例: "According to the table", "What information can be found in the schedule", "The data shows", "Based on the list"
- 特徴: 行と列で構成されたデータ、スケジュール、リスト形式

【重要】
- 形式は表（table）のみですが、表現は多様にしてください
- 「chart」「graph」「diagram」は使用しないでください
- 表のデータ構造（行と列）を正確に理解して問題を作成してください

【TOEICで出題されない図表問題タイプ（使用禁止）**
- 複雑な予測問題（"What would likely happen if..."）
- 抽象的な分析問題
- 図表の作成方法に関する問題

【TOEIC Part7図表問題の特徴】
- 図表から読み取れる具体的な情報の特定
- 文書と図表の関連性の理解
- 数値や統計の正確な読み取り
- 実用的なビジネスデータの解釈

【要求】
- 図表の情報を活用した問題
- 文書と図表の関連性を問う問題
- 文書全体（冒頭・中盤・末尾）からまんべんなく情報を選んで出題してください
- 明確で曖昧さのない選択肢
- 正解の根拠が明確
- 実際のTOEIC図表問題に近い形式
- 3つの問題で異なるパターンを使用
- TOEICの出題傾向に忠実
- TOEIC Part7に準拠した表（table）形式の問題を作成し、表現は多様にしてください

【TOEIC Part7図表問題の特徴】
TOEIC Part7の図表問題では、以下の特徴があります：
- 主に出題されるのは表（table）形式のデータ
- スケジュール、価格表、統計データ、リストなどが一般的
- 行と列で構成された構造化されたデータ
- ビジネス文書と組み合わせて出題される

【表（table）形式の表現ルール】
- 形式は表（table）のみですが、表現は多様にしてください
- 使用可能な表現: "table", "schedule", "list", "data", "information", "figure"
- 「chart」「graph」「diagram」は使用しないでください
- 例: "According to the table", "What information can be found in the schedule", "The data shows", "Based on the list"

【重要：選択肢の形式】
- 選択肢には「A.」「B.」「C.」「D.」などの文字を追加しないでください
- 選択肢は純粋な内容のみを記述してください

【出力形式】
JSON形式で出力してください：
{
  "questions": [
    {
      "id": "q1",
      "question": "[TOEIC準拠の図表問題文]",
      "questionTranslation": "問題文の自然な日本語翻訳",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "optionTranslations": ["選択肢Aの日本語翻訳", "選択肢Bの日本語翻訳", "選択肢Cの日本語翻訳", "選択肢Dの日本語翻訳"],
      "correct": "[正解のアルファベット1文字]",
      "explanation": "正解の根拠と解説（日本語で記述）"
    },
    {
      "id": "q2",
      "question": "[TOEIC準拠の図表問題文]",
      "questionTranslation": "問題文の自然な日本語翻訳",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "optionTranslations": ["選択肢Aの日本語翻訳", "選択肢Bの日本語翻訳", "選択肢Cの日本語翻訳", "選択肢Dの日本語翻訳"],
      "correct": "[正解のアルファベット1文字]",
      "explanation": "正解の根拠と解説（日本語で記述）"
    },
    {
      "id": "q3",
      "question": "[TOEIC準拠の図表問題文]",
      "questionTranslation": "問題文の自然な日本語翻訳",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "optionTranslations": ["選択肢Aの日本語翻訳", "選択肢Bの日本語翻訳", "選択肢Cの日本語翻訳", "選択肢Dの日本語翻訳"],
      "correct": "[正解のアルファベット1文字]",
      "explanation": "正解の根拠と解説（日本語で記述）"
    }
  ]
}

【正解の記号について】
- "correct" は選択肢配列におけるインデックス順に A, B, C, D のいずれか1文字で指定してください
- 例：2番目の選択肢が正解なら "correct": "B"

【重要】
- question（問題文）は必ず英語で記述してください
- questionTranslation（問題文翻訳）は自然な日本語で記述してください
- options（選択肢）は必ず英語で記述してください
- optionTranslations（選択肢翻訳）は自然な日本語で記述し、4つの翻訳を順番通りに配列で提供してください
- explanation（解説）は必ず日本語で記述してください
- 正解の根拠を明確に説明してください
- 図表のどの部分が根拠となっているかを具体的に示してください
- 選択肢には「A.」「B.」「C.」「D.」などの文字を絶対に追加しないでください
- TOEICの実際の出題パターンに忠実に従ってください
- 3つの問題で異なるパターンを使用してください
- 図表の種類に応じて適切な表現（table/chart/diagram）を使用してください
- 翻訳は学習者にとって理解しやすい自然な日本語にしてください

【TOEIC Part7図表表現の厳格なルール】
- 形式は表（table）のみですが、表現は多様にしてください
- 使用可能な表現: "table", "schedule", "list", "data", "information", "figure"
- 「chart」「graph」「diagram」は使用しないでください
- 表のデータ構造（行と列）を正確に理解して問題を作成してください
- ビジネス文書と表の関連性を重視してください
`,

  // 二資料問題生成プロンプト（重み付き選択版）
  generateMultiDocumentPassage: (difficulty, topic = null) => {
    const wordRange = getWordRangeForDifficulty(difficulty);
    // 二資料問題では各文書を短めに（全体の60%程度）
    const docWordRange = [Math.floor(wordRange[0] * 0.6), Math.floor(wordRange[1] * 0.6)];
    
    // 重み付き選択でトピックと文書タイプを決定（順番はAIに委ねる）
    const combination = topic ? 
      selectWeightedRandomTwoDocumentByTopic(topic) : 
      selectWeightedRandomTwoDocumentCombination();
    
    return `
以下の条件でTOEIC Part7用の2資料問題を作成してください：

【条件】
- 問題タイプ: 2資料問題（Multi-Document Problem）
- 各文書の単語数: ${docWordRange[0]}-${docWordRange[1]}語
- 難易度: ${difficulty}
- トピック: ${combination.topic}
- 文書タイプ: ${combination.doc1Type} と ${combination.doc2Type}
- 文書の組み合わせ: ${combination.combinationString} (重み: ${combination.weight})
- 文書数: 2つの関連する文書

【2資料問題の特徴】
1. 2つの文書が同じビジネス状況に関連している
2. 各文書は独立して理解できる内容
3. 両文書を組み合わせることで、より深い理解が可能
4. 実際のビジネスシーンでよく見られる文書の組み合わせ

【文書タイプの指定】
- 使用する文書タイプ: ${combination.doc1Type} と ${combination.doc2Type}
- この組み合わせは重み付き選択により決定されました（重み: ${combination.weight}）
- ${combination.topic}のトピックに適した内容で作成してください

【文書順番の決定】
- 2つの文書タイプのうち、どちらを最初に配置するかはあなたが決定してください
- ビジネスシーンで最も自然で論理的な順番になるよう配置してください
- 一般的なガイドライン：
  * 主要な情報や依頼が含まれる文書を最初に
  * 詳細情報や補足データは後に配置
  * 時系列的に先のものから順に配置
  * 読み手の理解の流れを考慮して配置

【文書間の関係性】
- 文書1は読み手が最初に接する文書として重要な役割を果たします
- 文書2は文書1の内容を補完・詳細化・発展させる役割を担います
- 両文書の関係性が自然で論理的な流れになるよう作成してください

【要求】
1. 実際のビジネスシーンで使われる自然な英語
2. TOEIC Part7の2資料問題に適した内容と構造
3. 各文書が独立して意味を成す内容
4. 文書間に明確な関連性（相互補完、詳細説明、follow-up等）
5. 複数の情報ポイントを各文書に含む
6. クロスリファレンス可能な情報要素
7. 自然で読みやすい日本語翻訳を含む

【文書1の構造】
- 主要な情報やアクションを含む
- 文書2への参照や関連性を暗示
- 独立して理解可能な内容

【文書2の構造】
- 文書1の詳細情報や補足データ
- 文書1で言及された内容の具体化
- 追加の文脈や背景情報

【出力形式】
JSON形式で出力してください：
{
  "title": "2資料問題のタイトル",
  "type": "multi-document",
  "isMultiDocument": true,
  "documents": [
    {
      "id": "doc1",
      "type": "[あなたが決定した最初の文書タイプ]",
      "title": "文書1のタイトル",
      "content": "文書1の内容（改行文字\\nを含む）",
      "contentTranslation": "文書1の自然な日本語翻訳"
    },
    {
      "id": "doc2",
      "type": "[あなたが決定した2番目の文書タイプ]",
      "title": "文書2のタイトル",
      "content": "文書2の内容（改行文字\\nを含む）",
      "contentTranslation": "文書2の自然な日本語翻訳",
      "hasChart": "[chartタイプの場合はtrue、それ以外はfalse]",
      "chart": "[chartタイプの場合のみ図表データを含める、それ以外はnull]"
    }
  ],
  "documentTypes": "[決定した文書タイプの配列]",
  "difficulty": "${difficulty}",
  "topic": "${combination.topic}",
  "relationships": {
    "type": "complementary|detailed|follow-up|comparison",
    "description": "文書間の関連性の説明"
  }
}

【重要な注意点】
- 各文書は独立して理解できる内容にしてください
- 文書間の関連性は自然で現実的なものにしてください
- TOEIC Part7の実際の出題形式に忠実に従ってください
- 両文書を読まないと答えられない質問を想定して作成してください
- 図表を含む場合は、最も適切な文書に配置してください

【文書順番決定の最終確認】
- ${combination.doc1Type} と ${combination.doc2Type} のうち、どちらを最初に配置するのが自然か考えてください
- ビジネスの文脈で、読み手にとって最も理解しやすい順番を選択してください
- 文書間の参照関係（例：メールでスケジュールに言及）を考慮してください
- 時系列（例：依頼→回答、発表→詳細）を考慮してください
`;
  },

  // 二資料問題用質問生成プロンプト（重み付き選択対応）
  generateMultiDocumentQuestions: (doc1Content, doc2Content, doc1Type, doc2Type, difficulty, topic = null) => {
    const doc1Label = DOCUMENT_LABELS[doc1Type] || `the ${doc1Type}`;
    const doc2Label = DOCUMENT_LABELS[doc2Type] || `the ${doc2Type}`;
    
    return `
以下の2つの文書に対して、TOEIC Part7形式の3つの問題を作成してください：

【文書1】
タイプ: ${doc1Type}
参照形式: ${doc1Label}
内容: ${doc1Content}

【文書2】
タイプ: ${doc2Type}
参照形式: ${doc2Label}
内容: ${doc2Content}

【条件】
- 問題数: 3問
- 形式: 4択問題
- 2資料問題形式
- 問題文と選択肢は英語で作成
- 難易度: ${difficulty}

【2資料問題の出題パターン】
以下の配分で問題を作成してください：
1. 文書1のみに基づく問題: 1問
2. 文書2のみに基づく問題: 1問
3. 両文書を組み合わせた問題: 1問

【難易度の指針】
- easy: 基本的な語彙とシンプルな構文。各文書からの直接的な情報取得が中心。
- medium: 一部に言い換えや推論を含む。文書間の関連性の理解が必要。
- hard: 複合的な推論、微妙な言い換え、文書間の詳細な比較分析が必要。

【2資料問題の特徴】
- 各文書の独立した理解
- 文書間の関連性の把握
- 情報の統合と比較
- クロスリファレンスの活用

【出題パターンの選択指示】
以下の2資料問題パターンを適合率補正スコアによる確率的優先度順に示します。
この文書に適合する3つのパターンを上位から順に選んで問題を作成してください。

${getScoreBasedRandomSortedMultiDocumentQuestionTypes().map(type => `
**優先度${type.priority}: ${type.label}** (重み${type.weight}, 適合率${type.matchRate}, スコア${type.score.toFixed(2)})
${type.examples.map(example => `- "${example}"`).join('\n')}
`).join('\n')}

【選択ルール】
- 上位から順に文書との適合性を判断してください
- 適合する3つのパターンを選択してください（重複不可）
- 文書内容に明らかに合わない場合は次の優先度を検討してください
- 軽微な不適合の場合は、優先度を重視して選択してください
- 2資料問題の特性を活かした問題を重視してください

【TOEICで出題されない問題タイプ（使用禁止）】
- 複雑な比較・対比問題（"How does A compare to B in detail?"）
- 抽象的な方法・手段問題（"How can this be achieved?"）
- 複雑な時系列・順序問題（"What happens first, second, and third?"）
- 高度な推論・仮定問題

【TOEIC Part7 二資料問題の特徴】
- 文書間の関連性理解が重要
- 情報の統合と比較が中心
- クロスリファレンスの活用
- 実用的なビジネス文書の組み合わせ
- 明確な情報の特定が重要

【質問の種類別要求】
**文書1単独の質問:**
- 文書1の内容のみで回答可能
- 他の文書への参照は不要
- 問題文で文書を参照する場合は「${doc1Label}」を使用
- referenceDocuments: [0]

**文書2単独の質問:**
- 文書2の内容のみで回答可能
- 他の文書への参照は不要
- 問題文で文書を参照する場合は「${doc2Label}」を使用
- referenceDocuments: [1]

**両文書を組み合わせた質問:**
- 両方の文書の情報が必要
- 文書間の関連性や統合的理解が必要
- 問題文で文書を参照する場合は「${doc1Label}」と「${doc2Label}」を使用
- referenceDocuments: [0, 1]
- crossReference: true

【文書参照の例】
- 「According to ${doc1Label}, what is...」
- 「In ${doc2Label}, it is mentioned that...」
- 「Based on ${doc1Label} and ${doc2Label}, what can be concluded...」
- 「What does ${doc1Label} suggest about...」

【重要：選択肢の形式】
- 選択肢には「A.」「B.」「C.」「D.」などの文字を追加しないでください
- 選択肢は純粋な内容のみを記述してください

【出力形式】
JSON形式で出力してください：
{
  "questions": [
    {
      "id": "q1",
      "question": "[文書1に基づく問題文]",
      "questionTranslation": "問題文の自然な日本語翻訳",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "optionTranslations": ["選択肢Aの日本語翻訳", "選択肢Bの日本語翻訳", "選択肢Cの日本語翻訳", "選択肢Dの日本語翻訳"],
      "correct": "[正解のアルファベット1文字]",
      "explanation": "正解の根拠と解説（日本語で記述）",
      "referenceDocuments": [0],
      "crossReference": false
    },
    {
      "id": "q2",
      "question": "[文書2に基づく問題文]",
      "questionTranslation": "問題文の自然な日本語翻訳",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "optionTranslations": ["選択肢Aの日本語翻訳", "選択肢Bの日本語翻訳", "選択肢Cの日本語翻訳", "選択肢Dの日本語翻訳"],
      "correct": "[正解のアルファベット1文字]",
      "explanation": "正解の根拠と解説（日本語で記述）",
      "referenceDocuments": [1],
      "crossReference": false
    },
    {
      "id": "q3",
      "question": "[両文書を組み合わせた問題文]",
      "questionTranslation": "問題文の自然な日本語翻訳",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "optionTranslations": ["選択肢Aの日本語翻訳", "選択肢Bの日本語翻訳", "選択肢Cの日本語翻訳", "選択肢Dの日本語翻訳"],
      "correct": "[正解のアルファベット1文字]",
      "explanation": "正解の根拠と解説（日本語で記述）",
      "referenceDocuments": [0, 1],
      "crossReference": true
    }
  ]
}

【重要】
- question（問題文）は必ず英語で記述してください
- questionTranslation（問題文翻訳）は自然な日本語で記述してください
- options（選択肢）は必ず英語で記述してください
- optionTranslations（選択肢翻訳）は自然な日本語で記述してください
- explanation（解説）は必ず日本語で記述してください
- referenceDocuments は問題の根拠となる文書のインデックス（0 or 1 or [0,1]）
- crossReference は両文書が必要な場合のみ true
- 選択肢には「A.」「B.」「C.」「D.」などの文字を絶対に追加しないでください
- 3つの問題は上記の配分（文書1単独、文書2単独、両文書統合）に従ってください
- 実際のTOEIC Part7の2資料問題の出題パターンに忠実に従ってください
- 翻訳は学習者にとって理解しやすい自然な日本語にしてください
- 文書を参照する際は「${doc1Label}」「${doc2Label}」の形式を使用してください
`;
  },

  // 品質チェックプロンプト
  validatePassage: (passageData) => `
以下の問題データの品質をチェックし、必要に応じて修正してください：

【問題データ】
${JSON.stringify(passageData, null, 2)}

【チェック項目】
1. 文書の長さ（100-150語）
2. 自然な英語表現
3. 明確な情報構造
4. 複数の情報ポイント
5. 問題の妥当性
6. 選択肢の明確さ
7. 正解の根拠の明確さ
8. 正解フィールドの形式（A、B、C、Dの記号が正しい形式）

【出力形式】
JSON形式で出力してください：
{
  "isValid": true/false,
  "issues": ["問題点1", "問題点2"],
  "suggestions": ["改善提案1", "改善提案2"],
  "wordCount": 数値,
  "difficulty": "easy/medium/hard",
  "correctedPassage": {
    // 修正された問題データ（正解フィールドが記号形式の場合のみ）
  }
}
`,

  // 品質チェック結果に基づく修正プロンプト
  reviseBasedOnQualityCheck: (originalContent, questions, qualityCheckResult, difficulty, type) => `
あなたはTOEIC Part 7問題の修正専門家です。以下の品質チェック結果に基づいて、問題を修正してください：

【元の文書内容】
${originalContent}

【元の質問】
${questions.map((q, i) => `
質問${i + 1}: ${q.question}
選択肢: ${q.options.join(', ')}
正解: ${q.correct}
解説: ${q.explanation}
`).join('\n')}

【品質チェック結果】
- 合格: ${qualityCheckResult.passed ? 'いいえ' : 'はい'}（修正が必要）
- スコア: ${qualityCheckResult.score}/100
- 推奨アクション: ${qualityCheckResult.recommendation}

【検出された問題点】
${qualityCheckResult.issues.map((issue, i) => `
${i + 1}. カテゴリ: ${issue.category}
   重要度: ${issue.severity}
   問題: ${issue.description}
   ${issue.suggestion ? `改善提案: ${issue.suggestion}` : ''}
`).join('\n')}

【修正指示】
上記の問題点を全て解決するように、文書内容と質問を修正してください：

1. **文法・語彙の修正**: 不自然な表現や誤りを修正
2. **内容の改善**: ビジネス文書として自然で適切な内容に
3. **難易度調整**: ${difficulty}難易度に適した語彙・構文に調整
4. **TOEIC準拠**: TOEIC Part 7の出題形式に完全準拠
5. **質問の改善**: 問題文と選択肢を明確で適切に
6. **正解根拠の明確化**: 正解の根拠が文書内に明確に存在するように

【重要な制約】
- 文書タイプ: ${type} を維持
- 質問数: ${questions.length}問を維持
- 語数: 適切な範囲内に調整
- 品質チェックで指摘された全ての問題を解決すること

【出力形式】
以下のJSON形式で修正結果を出力してください：

{
  "content": "修正された文書内容",
  "contentTranslation": "修正された文書内容の日本語翻訳",
  "questions": [
    {
      "id": "q1",
      "question": "修正された質問文",
      "questionTranslation": "修正された質問文の日本語翻訳",
      "options": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
      "optionTranslations": ["選択肢Aの日本語翻訳", "選択肢Bの日本語翻訳", "選択肢Cの日本語翻訳", "選択肢Dの日本語翻訳"],
      "correct": "正解の記号(A/B/C/D)",
      "explanation": "修正された解説（日本語）"
    }
  ],
  "revisionNotes": "修正内容の要約（日本語で、どの問題をどのように修正したかを説明）"
}
`,

  // 本文専用品質チェック結果に基づく修正プロンプト
  reviseContentBasedOnQualityCheck: (originalContent, contentQualityCheckResult, difficulty, type, chartData = null) => `
あなたはTOEIC Part 7文書の修正専門家です。以下の品質チェック結果に基づいて、文書内容のみを修正してください：

【元の文書内容】
${originalContent}

${chartData ? `【図表データ】
図表タイプ: ${chartData.type || '不明'}
図表タイトル: ${chartData.title || '不明'}
図表データ構造: ${JSON.stringify(chartData.data, null, 2)}
` : ''}

【品質チェック結果】
- 合格: ${contentQualityCheckResult.passed ? 'はい' : 'いいえ'}（修正が必要）
- スコア: ${contentQualityCheckResult.score}/100
- 推奨アクション: ${contentQualityCheckResult.recommendation}

【検出された問題点】
${contentQualityCheckResult.issues.map((issue, i) => `
${i + 1}. カテゴリ: ${issue.category}
   重要度: ${issue.severity}
   問題: ${issue.description}
   ${issue.suggestion ? `改善提案: ${issue.suggestion}` : ''}
`).join('\n')}

【修正指示】
上記の問題点を全て解決するように、文書内容のみを修正してください：

1. **語数調整**: ${difficulty}難易度に適した語数範囲に調整
2. **文法・語彙の修正**: 不自然な表現や誤りを修正
3. **内容の改善**: ビジネス文書として自然で適切な内容に
4. **難易度調整**: ${difficulty}難易度に適した語彙・構文に調整
5. **TOEIC準拠**: TOEIC Part 7の文書形式に完全準拠
${chartData ? '6. **図表整合性**: 図表データとの整合性を確保' : ''}

【重要な制約】
- 文書タイプ: ${type} を維持
- 品質チェックで指摘された全ての問題を解決すること
- 文書の基本的な構造と意図は維持すること
${chartData ? '- 図表への参照を適切に含めること' : ''}

【出力形式】
以下のJSON形式で修正結果を出力してください：

{
  "revisedContent": "修正された文書内容（改行文字\\nを含む）",
  "revisedContentTranslation": "修正された文書内容の自然な日本語翻訳",
  "revisionNotes": "修正内容の要約（日本語で、どの問題をどのように修正したかを説明）"
}

【重要】
- revisedContent は必ず英語で記述してください
- revisedContentTranslation は自然な日本語で記述してください
- revisionNotes で修正した内容を具体的に説明してください
`,

  // 問題専用品質チェック結果に基づく修正プロンプト
  reviseQuestionsBasedOnQualityCheck: (originalContent, originalQuestions, questionsQualityCheckResult, difficulty, type, chartData = null) => `
あなたはTOEIC Part 7問題の修正専門家です。以下の品質チェック結果に基づいて、問題のみを修正してください：

【文書内容】
${originalContent}

${chartData ? `【図表データ】
図表タイプ: ${chartData.type || '不明'}
図表タイトル: ${chartData.title || '不明'}
図表データ構造: ${JSON.stringify(chartData.data, null, 2)}
` : ''}

【元の質問】
${originalQuestions.map((q, i) => `
質問${i + 1}: ${q.question}
選択肢: ${q.options.join(', ')}
正解: ${q.correct}
解説: ${q.explanation}
`).join('\n')}

【品質チェック結果】
- 合格: ${questionsQualityCheckResult.passed ? 'はい' : 'いいえ'}（修正が必要）
- スコア: ${questionsQualityCheckResult.score}/100
- 推奨アクション: ${questionsQualityCheckResult.recommendation}

【検出された問題点】
${questionsQualityCheckResult.issues.map((issue, i) => `
${i + 1}. カテゴリ: ${issue.category}
   重要度: ${issue.severity}
   問題: ${issue.description}
   ${issue.suggestion ? `改善提案: ${issue.suggestion}` : ''}
`).join('\n')}

【修正指示】
上記の問題点を全て解決するように、問題のみを修正してください：

1. **問題品質**: 問題文と選択肢が適切で明確になるように修正
2. **解答根拠**: 正解の根拠が文書内に明確に存在するように調整
3. **TOEIC準拠**: TOEIC Part 7の出題形式に完全準拠
4. **難易度適合性**: ${difficulty}難易度に適した問題設定に調整
5. **選択肢品質**: 選択肢が適切で紛らわしすぎないように調整
${chartData ? '6. **図表活用**: 図表データを適切に活用した問題に調整' : ''}

【重要な制約】
- 文書タイプ: ${type} を維持
- 質問数: ${originalQuestions.length}問を維持
- 品質チェックで指摘された全ての問題を解決すること
- 文書内容は変更せず、問題のみを修正すること
${chartData ? '- 図表データとの整合性を確保すること' : ''}

【出力形式】
以下のJSON形式で修正結果を出力してください：

{
  "revisedQuestions": [
    {
      "id": "q1",
      "question": "修正された問題文（英語）",
      "questionTranslation": "修正された問題文の日本語翻訳",
      "options": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
      "optionTranslations": ["選択肢Aの日本語翻訳", "選択肢Bの日本語翻訳", "選択肢Cの日本語翻訳", "選択肢Dの日本語翻訳"],
      "correct": "正解の記号(A/B/C/D)",
      "explanation": "修正された解説（日本語）"
    }
  ],
  "revisionNotes": "修正内容の要約（日本語で、どの問題をどのように修正したかを説明）"
}

【重要】
- question は必ず英語で記述してください
- questionTranslation は自然な日本語で記述してください
- options は必ず英語で記述してください
- optionTranslations は自然な日本語で記述してください
- explanation は必ず日本語で記述してください
- revisionNotes で修正した内容を具体的に説明してください
`,
};

// ビジネストピック（難易度非依存）
// Used by: TOEIC Part 7 (single documents, charts, multi-document passages)
// Functions: generatePassage, generatePassageWithChart, generateMultiDocumentPassage
export const BUSINESS_TOPICS = [
  "meeting_scheduling",           // 会議スケジュール調整
  "office_announcements",         // オフィス告知
  "simple_notifications",         // 簡単な通知
  "basic_requests",               // 基本的な依頼
  "schedule_changes",             // スケジュール変更
  "customer_inquiries",           // 顧客問い合わせ
  "team_coordination",            // チーム連携
  "policy_changes",               // 方針変更
  "system_updates",               // システム更新
  "training_programs",            // 研修プログラム
  "business_trends",              // ビジネストレンド
  "performance_reviews",          // 人事評価
  "customer_complaints",          // 顧客苦情
  "project_collaboration",        // プロジェクト協力
  "complex_negotiations",         // 複雑な交渉
  "strategic_planning",           // 戦略計画
  "financial_analysis",           // 財務分析
  "legal_compliance",             // 法的遵守
  "international_business",       // 国際ビジネス
  "crisis_management",            // 危機管理
  "cross_department_coordination", // 部門間連携
  "event_planning",               // イベント企画・運営
  "inventory_updates",            // 在庫・供給状況
  "service_announcements",        // サービス変更通知
  "product_launch"                // 商品発売・紹介
];

// 難易度設定（独立）
export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"];

// トピックとランダム難易度の組み合わせを生成する関数
export function generateTopicDifficultyCombination(topicIndex, difficulty = null) {
  const topic = BUSINESS_TOPICS[topicIndex % BUSINESS_TOPICS.length];
  const selectedDifficulty = difficulty || DIFFICULTY_LEVELS[Math.floor(Math.random() * DIFFICULTY_LEVELS.length)];
  
  return {
    topic: topic,
    difficulty: selectedDifficulty
  };
}

// 後方互換性のための関数（既存コード用）
export function getTopicsForDifficulty(difficulty) {
  // 指定難易度で全トピックの組み合わせを生成
  return BUSINESS_TOPICS.map(topic => ({
    topic: topic,
    difficulty: difficulty === "all" ? DIFFICULTY_LEVELS[Math.floor(Math.random() * DIFFICULTY_LEVELS.length)] : difficulty
  }));
}

// 後方互換性のための配列（既存コード用）
export const TOPIC_DIFFICULTY_COMBINATIONS = BUSINESS_TOPICS.map((topic, index) => {
  // 3つの難易度を順次割り当て（7:7:7の配分）
  const difficultyIndex = Math.floor(index / 7) % 3;
  return {
    topic: topic,
    difficulty: DIFFICULTY_LEVELS[difficultyIndex]
  };
});

// 文書タイプ
// Used by: TOEIC Part 7 (single documents, charts, multi-document passages)
// Functions: generatePassage, generatePassageWithChart, generateMultiDocumentPassage
export const DOCUMENT_TYPES = [
  "email",
  "advertisement", 
  "article",
  "customer_support",
  "internal_chat",
  "notice",
  "form",
  "schedule",
  "memo",
  "instruction"
];

// TOEIC問題の組み合わせデータ（topic, document_type, weight）
export const TOEIC_COMBINATIONS = [
  { topic: "basic_requests", document_type: "email", weight: 5 },
  { topic: "business_trends", document_type: "article", weight: 5 },
  { topic: "customer_complaints", document_type: "customer_support", weight: 5 },
  { topic: "customer_inquiries", document_type: "customer_support", weight: 5 },
  { topic: "meeting_scheduling", document_type: "email", weight: 5 },
  { topic: "office_announcements", document_type: "notice", weight: 5 },
  { topic: "policy_changes", document_type: "notice", weight: 5 },
  { topic: "product_launch", document_type: "advertisement", weight: 5 },
  { topic: "schedule_changes", document_type: "email", weight: 5 },
  { topic: "cross_department_coordination", document_type: "internal_chat", weight: 4 },
  { topic: "customer_complaints", document_type: "email", weight: 4 },
  { topic: "customer_inquiries", document_type: "email", weight: 4 },
  { topic: "event_planning", document_type: "email", weight: 4 },
  { topic: "event_planning", document_type: "schedule", weight: 4 },
  { topic: "financial_analysis", document_type: "article", weight: 4 },
  { topic: "international_business", document_type: "article", weight: 4 },
  { topic: "legal_compliance", document_type: "notice", weight: 4 },
  { topic: "meeting_scheduling", document_type: "schedule", weight: 4 },
  { topic: "performance_reviews", document_type: "memo", weight: 4 },
  { topic: "project_collaboration", document_type: "internal_chat", weight: 4 },
  { topic: "schedule_changes", document_type: "notice", weight: 4 },
  { topic: "service_announcements", document_type: "notice", weight: 4 },
  { topic: "simple_notifications", document_type: "notice", weight: 4 },
  { topic: "system_updates", document_type: "notice", weight: 4 },
  { topic: "team_coordination", document_type: "internal_chat", weight: 4 },
  { topic: "training_programs", document_type: "notice", weight: 4 },
  { topic: "basic_requests", document_type: "internal_chat", weight: 3 },
  { topic: "business_trends", document_type: "memo", weight: 3 },
  { topic: "complex_negotiations", document_type: "email", weight: 3 },
  { topic: "crisis_management", document_type: "notice", weight: 3 },
  { topic: "crisis_management", document_type: "memo", weight: 3 },
  { topic: "cross_department_coordination", document_type: "memo", weight: 3 },
  { topic: "financial_analysis", document_type: "memo", weight: 3 },
  { topic: "inventory_updates", document_type: "notice", weight: 3 },
  { topic: "legal_compliance", document_type: "article", weight: 3 },
  { topic: "office_announcements", document_type: "memo", weight: 3 },
  { topic: "performance_reviews", document_type: "email", weight: 3 },
  { topic: "policy_changes", document_type: "email", weight: 3 },
  { topic: "product_launch", document_type: "article", weight: 3 },
  { topic: "project_collaboration", document_type: "memo", weight: 3 },
  { topic: "service_announcements", document_type: "advertisement", weight: 3 },
  { topic: "simple_notifications", document_type: "internal_chat", weight: 3 },
  { topic: "strategic_planning", document_type: "memo", weight: 3 },
  { topic: "team_coordination", document_type: "memo", weight: 3 },
  { topic: "training_programs", document_type: "schedule", weight: 3 },
  { topic: "complex_negotiations", document_type: "article", weight: 2 },
  { topic: "event_planning", document_type: "form", weight: 2 },
  { topic: "international_business", document_type: "email", weight: 2 },
  { topic: "inventory_updates", document_type: "form", weight: 2 },
  { topic: "strategic_planning", document_type: "article", weight: 2 },
  { topic: "system_updates", document_type: "article", weight: 2 },
  { topic: "business_trends", document_type: "email", weight: 1 },
  { topic: "crisis_management", document_type: "instruction", weight: 1 },
  { topic: "cross_department_coordination", document_type: "email", weight: 1 },
  { topic: "customer_complaints", document_type: "form", weight: 1 },
  { topic: "financial_analysis", document_type: "form", weight: 1 },
  { topic: "financial_analysis", document_type: "instruction", weight: 1 },
  { topic: "inventory_updates", document_type: "email", weight: 1 },
  { topic: "inventory_updates", document_type: "article", weight: 1 },
  { topic: "legal_compliance", document_type: "instruction", weight: 1 },
  { topic: "product_launch", document_type: "memo", weight: 1 },
  { topic: "product_launch", document_type: "email", weight: 1 },
  { topic: "team_coordination", document_type: "schedule", weight: 1 },
  { topic: "training_programs", document_type: "advertisement", weight: 1 },
  { topic: "training_programs", document_type: "memo", weight: 1 }
];

// 重み付けランダム選択関数
export function selectWeightedRandomCombination() {
  // 全重みの合計を計算
  const totalWeight = TOEIC_COMBINATIONS.reduce((sum, item) => sum + item.weight, 0);
  
  // 0から総重み未満のランダム値を生成
  const random = Math.random() * totalWeight;
  
  // 累積重みで選択
  let cumulative = 0;
  for (const combination of TOEIC_COMBINATIONS) {
    cumulative += combination.weight;
    if (random < cumulative) {
      return {
        topic: combination.topic,
        document_type: combination.document_type,
        weight: combination.weight
      };
    }
  }
  
  // フォールバック（通常は到達しない）
  return TOEIC_COMBINATIONS[TOEIC_COMBINATIONS.length - 1];
}

// 特定のトピックまたは文書タイプでフィルタリングした重み付け選択
export function selectWeightedRandomByFilter(filterType, filterValue) {
  const filtered = TOEIC_COMBINATIONS.filter(item => item[filterType] === filterValue);
  
  if (filtered.length === 0) {
    throw new Error(`No combinations found for ${filterType}: ${filterValue}`);
  }
  
  const totalWeight = filtered.reduce((sum, item) => sum + item.weight, 0);
  const random = Math.random() * totalWeight;
  
  let cumulative = 0;
  for (const combination of filtered) {
    cumulative += combination.weight;
    if (random < cumulative) {
      return {
        topic: combination.topic,
        document_type: combination.document_type,
        weight: combination.weight
      };
    }
  }
  
  return filtered[filtered.length - 1];
}

// 問題パターンの重み付けデータ（適合率補正付き）
export const QUESTION_TYPES = [
  { 
    id: 'mainPurpose', 
    label: '主旨・目的理解', 
    weight: 5, 
    matchRate: 0.95,
    examples: [
      "What is the main purpose of this document?",
      "What is the primary goal of this communication?",
      "Why was this document created?",
      "What is the writer trying to achieve?"
    ]
  },
  { 
    id: 'detail', 
    label: '詳細情報・事実確認', 
    weight: 5, 
    matchRate: 0.90,
    examples: [
      "According to the document, what specific information is mentioned?",
      "What details are provided about [具体的な内容]?",
      "Which of the following is stated in the document?",
      "What does the document say about [トピック]?"
    ]
  },
  { 
    id: 'inference', 
    label: '推論・推測', 
    weight: 5, 
    matchRate: 0.85,
    examples: [
      "What can be inferred from the information provided?",
      "What conclusion can be drawn from this document?",
      "What does this suggest about [トピック]?",
      "Based on the information given, what is likely to happen?"
    ]
  },
  { 
    id: 'role', 
    label: '人物・役割', 
    weight: 3, 
    matchRate: 0.60,
    examples: [
      "Who is responsible for [タスク]?",
      "What role does [人物] play in this situation?",
      "Who should be contacted regarding [問題]?"
    ]
  },
  { 
    id: 'schedule', 
    label: '時系列・日程', 
    weight: 2, 
    matchRate: 0.50,
    examples: [
      "When will [イベント] take place?",
      "What is the deadline for [アクション]?",
      "What is the timeline for [プロジェクト]?"
    ]
  },
  { 
    id: 'location', 
    label: '場所・会場', 
    weight: 2, 
    matchRate: 0.45,
    examples: [
      "Where will [イベント] be held?",
      "What location is mentioned for [アクティビティ]?",
      "Which venue is specified for [目的]?"
    ]
  },
  { 
    id: 'condition', 
    label: '条件・要件', 
    weight: 1, 
    matchRate: 0.30,
    examples: [
      "What is required for [条件] to be met?",
      "Under what circumstances would [状況] occur?",
      "What conditions must be satisfied for [結果]?"
    ]
  }
];

// 二資料問題専用の問題パターンデータ
export const MULTI_DOCUMENT_QUESTION_TYPES = [
  // 二資料問題特有のパターン
  { 
    id: 'crossReference', 
    label: 'クロスリファレンス', 
    weight: 6, 
    matchRate: 0.90,
    examples: [
      "What does Document 1 refer to that is detailed in Document 2?",
      "Which information mentioned in the first document is clarified in the second?",
      "What connection exists between the email and the schedule?",
      "How does the information in Document 2 relate to what is mentioned in Document 1?"
    ]
  },
  { 
    id: 'informationIntegration', 
    label: '情報統合・比較', 
    weight: 6, 
    matchRate: 0.85,
    examples: [
      "Based on both documents, what can be concluded?",
      "What information is provided in both documents?",
      "How does the data in Document 2 relate to Document 1?",
      "What additional information does Document 2 provide about the topic in Document 1?"
    ]
  },
  { 
    id: 'documentRelationship', 
    label: '文書間の関連性理解', 
    weight: 5, 
    matchRate: 0.80,
    examples: [
      "How do the two documents relate to each other?",
      "What is the relationship between the documents?",
      "How does the second document support the first?",
      "What is the purpose of providing both documents together?"
    ]
  },
  
  // 単一資料問題パターンの二資料版
  { 
    id: 'mainPurpose', 
    label: '主旨・目的理解', 
    weight: 5, 
    matchRate: 0.95,
    examples: [
      "What is the main purpose of Document 1?",
      "What is the primary goal of Document 2?",
      "Why was Document 1 created?",
      "What is the writer trying to achieve in Document 2?"
    ]
  },
  { 
    id: 'detail', 
    label: '詳細情報・事実確認', 
    weight: 5, 
    matchRate: 0.90,
    examples: [
      "According to Document 1, what specific information is mentioned?",
      "What details are provided in Document 2?",
      "Which of the following is stated in Document 1?",
      "What does Document 2 say about [トピック]?"
    ]
  },
  { 
    id: 'inference', 
    label: '推論・推測', 
    weight: 5, 
    matchRate: 0.85,
    examples: [
      "What can be inferred from Document 1?",
      "Based on Document 2, what conclusion can be drawn?",
      "What does Document 1 suggest about [トピック]?",
      "Based on the information in Document 2, what is likely to happen?"
    ]
  },
  { 
    id: 'role', 
    label: '人物・役割', 
    weight: 3, 
    matchRate: 0.60,
    examples: [
      "According to Document 1, who is responsible for [タスク]?",
      "Based on Document 2, what role does [人物] play?",
      "Who should be contacted according to the information in both documents?"
    ]
  },
  { 
    id: 'schedule', 
    label: '時系列・日程', 
    weight: 3, 
    matchRate: 0.55,
    examples: [
      "According to Document 1, when will [イベント] take place?",
      "Based on Document 2, what is the deadline for [アクション]?",
      "What is the timeline mentioned in both documents?"
    ]
  },
  { 
    id: 'location', 
    label: '場所・会場', 
    weight: 2, 
    matchRate: 0.45,
    examples: [
      "According to Document 1, where will [イベント] be held?",
      "Based on Document 2, what location is mentioned?",
      "Which venue is specified in the documents?"
    ]
  },
  { 
    id: 'condition', 
    label: '条件・要件', 
    weight: 1, 
    matchRate: 0.30,
    examples: [
      "According to Document 1, what is required for [条件]?",
      "Based on Document 2, under what circumstances would [状況] occur?",
      "What conditions must be satisfied according to both documents?"
    ]
  }
];

// スコア計算関数（重み × 適合率の逆数）
export function calculateQuestionTypeScores() {
  return QUESTION_TYPES.map(type => ({
    ...type,
    score: type.weight * (1 / type.matchRate)
  }));
}

// 二資料問題用スコア計算関数
export function calculateMultiDocumentQuestionTypeScores() {
  return MULTI_DOCUMENT_QUESTION_TYPES.map(type => ({
    ...type,
    score: type.weight * (1 / type.matchRate)
  }));
}

// 確率的ソート関数（スコアベース）
export function getScoreBasedRandomSortedQuestionTypes() {
  const typesWithScores = calculateQuestionTypeScores();
  const sortedTypes = [];
  
  while (typesWithScores.length > 0) {
    const totalScore = typesWithScores.reduce((sum, t) => sum + t.score, 0);
    const random = Math.random() * totalScore;
    
    let cumulative = 0;
    for (let i = 0; i < typesWithScores.length; i++) {
      cumulative += typesWithScores[i].score;
      if (random < cumulative) {
        sortedTypes.push(typesWithScores[i]);
        typesWithScores.splice(i, 1);
        break;
      }
    }
  }
  
  return sortedTypes.map((type, index) => ({
    ...type,
    priority: index + 1
  }));
}

// 二資料問題用の確率的ソート関数
export function getScoreBasedRandomSortedMultiDocumentQuestionTypes() {
  const typesWithScores = calculateMultiDocumentQuestionTypeScores();
  const sortedTypes = [];
  
  while (typesWithScores.length > 0) {
    const totalScore = typesWithScores.reduce((sum, t) => sum + t.score, 0);
    const random = Math.random() * totalScore;
    
    let cumulative = 0;
    for (let i = 0; i < typesWithScores.length; i++) {
      cumulative += typesWithScores[i].score;
      if (random < cumulative) {
        sortedTypes.push(typesWithScores[i]);
        typesWithScores.splice(i, 1);
        break;
      }
    }
  }
  
  return sortedTypes.map((type, index) => ({
    ...type,
    priority: index + 1
  }));
}

// 2資料問題の重み付き組み合わせデータ
export const TWO_DOCUMENT_COMBINATIONS = [
  // Basic Requests
  { topic: "basic_requests", document_types: "email + notice", weight: 5 },
  { topic: "basic_requests", document_types: "email + memo", weight: 4 },
  { topic: "basic_requests", document_types: "email + schedule", weight: 5 },
  { topic: "basic_requests", document_types: "email + internal_chat", weight: 3 },
  { topic: "basic_requests", document_types: "email + form", weight: 3 },
  { topic: "basic_requests", document_types: "notice + schedule", weight: 4 },
  { topic: "basic_requests", document_types: "notice + form", weight: 3 },
  { topic: "basic_requests", document_types: "notice + instruction", weight: 2 },
  { topic: "basic_requests", document_types: "memo + internal_chat", weight: 3 },
  { topic: "basic_requests", document_types: "form + instruction", weight: 2 },
  
  // Business Trends
  { topic: "business_trends", document_types: "email + notice", weight: 5 },
  { topic: "business_trends", document_types: "email + memo", weight: 4 },
  { topic: "business_trends", document_types: "email + article", weight: 1 },
  { topic: "business_trends", document_types: "notice + article", weight: 1 },
  { topic: "business_trends", document_types: "memo + article", weight: 1 },
  
  // Customer Complaints
  { topic: "customer_complaints", document_types: "email + customer_support", weight: 5 },
  { topic: "customer_complaints", document_types: "email + form", weight: 4 },
  { topic: "customer_complaints", document_types: "customer_support + form", weight: 4 },
  { topic: "customer_complaints", document_types: "email + notice", weight: 3 },
  { topic: "customer_complaints", document_types: "email + memo", weight: 3 },
  
  // Customer Inquiries
  { topic: "customer_inquiries", document_types: "email + customer_support", weight: 5 },
  { topic: "customer_inquiries", document_types: "email + form", weight: 4 },
  { topic: "customer_inquiries", document_types: "customer_support + form", weight: 4 },
  { topic: "customer_inquiries", document_types: "email + notice", weight: 3 },
  { topic: "customer_inquiries", document_types: "email + advertisement", weight: 3 },
  
  // Meeting Scheduling
  { topic: "meeting_scheduling", document_types: "email + schedule", weight: 5 },
  { topic: "meeting_scheduling", document_types: "email + notice", weight: 4 },
  { topic: "meeting_scheduling", document_types: "email + memo", weight: 4 },
  { topic: "meeting_scheduling", document_types: "email + internal_chat", weight: 3 },
  { topic: "meeting_scheduling", document_types: "notice + schedule", weight: 3 },
  
  // Office Announcements
  { topic: "office_announcements", document_types: "email + notice", weight: 5 },
  { topic: "office_announcements", document_types: "notice + memo", weight: 4 },
  { topic: "office_announcements", document_types: "email + memo", weight: 4 },
  { topic: "office_announcements", document_types: "notice + schedule", weight: 3 },
  { topic: "office_announcements", document_types: "notice + form", weight: 3 },
  
  // Policy Changes
  { topic: "policy_changes", document_types: "email + notice", weight: 5 },
  { topic: "policy_changes", document_types: "notice + memo", weight: 4 },
  { topic: "policy_changes", document_types: "email + memo", weight: 4 },
  { topic: "policy_changes", document_types: "notice + instruction", weight: 3 },
  { topic: "policy_changes", document_types: "email + instruction", weight: 3 },
  
  // Product Launch
  { topic: "product_launch", document_types: "email + advertisement", weight: 5 },
  { topic: "product_launch", document_types: "advertisement + notice", weight: 4 },
  { topic: "product_launch", document_types: "email + notice", weight: 4 },
  { topic: "product_launch", document_types: "advertisement + schedule", weight: 3 },
  { topic: "product_launch", document_types: "email + article", weight: 3 },
  
  // Schedule Changes
  { topic: "schedule_changes", document_types: "email + schedule", weight: 5 },
  { topic: "schedule_changes", document_types: "email + notice", weight: 4 },
  { topic: "schedule_changes", document_types: "notice + schedule", weight: 4 },
  { topic: "schedule_changes", document_types: "email + memo", weight: 3 },
  { topic: "schedule_changes", document_types: "email + internal_chat", weight: 3 },
  
  // Event Planning
  { topic: "event_planning", document_types: "email + schedule", weight: 5 },
  { topic: "event_planning", document_types: "email + notice", weight: 4 },
  { topic: "event_planning", document_types: "email + form", weight: 4 },
  { topic: "event_planning", document_types: "notice + schedule", weight: 3 },
  { topic: "event_planning", document_types: "schedule + form", weight: 3 },
  
  // Financial Analysis
  { topic: "financial_analysis", document_types: "email + memo", weight: 5 },
  { topic: "financial_analysis", document_types: "email + article", weight: 4 },
  { topic: "financial_analysis", document_types: "memo + article", weight: 4 },
  { topic: "financial_analysis", document_types: "email + notice", weight: 3 },
  { topic: "financial_analysis", document_types: "article + form", weight: 3 },
  
  // Training Programs
  { topic: "training_programs", document_types: "email + notice", weight: 5 },
  { topic: "training_programs", document_types: "email + schedule", weight: 4 },
  { topic: "training_programs", document_types: "notice + schedule", weight: 4 },
  { topic: "training_programs", document_types: "email + form", weight: 3 },
  { topic: "training_programs", document_types: "notice + form", weight: 3 },
  
  // Project Collaboration
  { topic: "project_collaboration", document_types: "email + memo", weight: 5 },
  { topic: "project_collaboration", document_types: "email + internal_chat", weight: 4 },
  { topic: "project_collaboration", document_types: "memo + internal_chat", weight: 4 },
  { topic: "project_collaboration", document_types: "email + schedule", weight: 3 },
  { topic: "project_collaboration", document_types: "email + notice", weight: 3 },
  
  // System Updates
  { topic: "system_updates", document_types: "email + notice", weight: 5 },
  { topic: "system_updates", document_types: "notice + instruction", weight: 4 },
  { topic: "system_updates", document_types: "email + instruction", weight: 4 },
  { topic: "system_updates", document_types: "email + memo", weight: 3 },
  { topic: "system_updates", document_types: "notice + memo", weight: 3 },
  
  // Team Coordination
  { topic: "team_coordination", document_types: "email + internal_chat", weight: 5 },
  { topic: "team_coordination", document_types: "email + memo", weight: 4 },
  { topic: "team_coordination", document_types: "internal_chat + memo", weight: 4 },
  { topic: "team_coordination", document_types: "email + schedule", weight: 3 },
  { topic: "team_coordination", document_types: "email + notice", weight: 3 },
  
  // Performance Reviews
  { topic: "performance_reviews", document_types: "email + memo", weight: 5 },
  { topic: "performance_reviews", document_types: "email + form", weight: 4 },
  { topic: "performance_reviews", document_types: "memo + form", weight: 4 },
  { topic: "performance_reviews", document_types: "email + notice", weight: 3 },
  { topic: "performance_reviews", document_types: "email + schedule", weight: 3 },
  
  // Service Announcements
  { topic: "service_announcements", document_types: "email + notice", weight: 5 },
  { topic: "service_announcements", document_types: "notice + advertisement", weight: 4 },
  { topic: "service_announcements", document_types: "email + advertisement", weight: 4 },
  { topic: "service_announcements", document_types: "email + memo", weight: 3 },
  { topic: "service_announcements", document_types: "notice + memo", weight: 3 },
  
  // Legal Compliance
  { topic: "legal_compliance", document_types: "email + notice", weight: 5 },
  { topic: "legal_compliance", document_types: "notice + instruction", weight: 4 },
  { topic: "legal_compliance", document_types: "email + instruction", weight: 4 },
  { topic: "legal_compliance", document_types: "email + memo", weight: 3 },
  { topic: "legal_compliance", document_types: "notice + form", weight: 3 },
  
  // International Business
  { topic: "international_business", document_types: "email + article", weight: 5 },
  { topic: "international_business", document_types: "email + memo", weight: 4 },
  { topic: "international_business", document_types: "article + memo", weight: 4 },
  { topic: "international_business", document_types: "email + notice", weight: 3 },
  { topic: "international_business", document_types: "email + form", weight: 3 },
  
  // Crisis Management
  { topic: "crisis_management", document_types: "email + notice", weight: 5 },
  { topic: "crisis_management", document_types: "email + memo", weight: 4 },
  { topic: "crisis_management", document_types: "notice + memo", weight: 4 },
  { topic: "crisis_management", document_types: "email + instruction", weight: 3 },
  { topic: "crisis_management", document_types: "notice + instruction", weight: 3 },
  
  // Inventory Updates
  { topic: "inventory_updates", document_types: "email + notice", weight: 5 },
  { topic: "inventory_updates", document_types: "email + form", weight: 4 },
  { topic: "inventory_updates", document_types: "notice + form", weight: 4 },
  { topic: "inventory_updates", document_types: "email + memo", weight: 3 },
  { topic: "inventory_updates", document_types: "notice + memo", weight: 3 },
  
  // Strategic Planning
  { topic: "strategic_planning", document_types: "email + memo", weight: 5 },
  { topic: "strategic_planning", document_types: "email + article", weight: 4 },
  { topic: "strategic_planning", document_types: "memo + article", weight: 4 },
  { topic: "strategic_planning", document_types: "email + notice", weight: 3 },
  { topic: "strategic_planning", document_types: "email + internal_chat", weight: 3 }
];

// 2資料問題の重み付きランダム選択関数
export function selectWeightedRandomTwoDocumentCombination() {
  // 全重みの合計を計算
  const totalWeight = TWO_DOCUMENT_COMBINATIONS.reduce((sum, item) => sum + item.weight, 0);
  
  // 0から総重み未満のランダム値を生成
  const random = Math.random() * totalWeight;
  
  // 累積重みで選択
  let cumulative = 0;
  for (const combination of TWO_DOCUMENT_COMBINATIONS) {
    cumulative += combination.weight;
    if (random < cumulative) {
      // document_typesを配列に分割
      const [doc1Type, doc2Type] = combination.document_types.split(' + ');
      return {
        topic: combination.topic,
        doc1Type: doc1Type,
        doc2Type: doc2Type,
        weight: combination.weight,
        combinationString: combination.document_types
      };
    }
  }
  
  // フォールバック（通常は到達しない）
  const fallback = TWO_DOCUMENT_COMBINATIONS[TWO_DOCUMENT_COMBINATIONS.length - 1];
  const [doc1Type, doc2Type] = fallback.document_types.split(' + ');
  return {
    topic: fallback.topic,
    doc1Type: doc1Type,
    doc2Type: doc2Type,
    weight: fallback.weight,
    combinationString: fallback.document_types
  };
}

// 特定のトピックでフィルタリングした2資料問題の重み付き選択
export function selectWeightedRandomTwoDocumentByTopic(topic) {
  const filtered = TWO_DOCUMENT_COMBINATIONS.filter(item => item.topic === topic);
  
  if (filtered.length === 0) {
    throw new Error(`No two-document combinations found for topic: ${topic}`);
  }
  
  const totalWeight = filtered.reduce((sum, item) => sum + item.weight, 0);
  const random = Math.random() * totalWeight;
  
  let cumulative = 0;
  for (const combination of filtered) {
    cumulative += combination.weight;
    if (random < cumulative) {
      const [doc1Type, doc2Type] = combination.document_types.split(' + ');
      return {
        topic: combination.topic,
        doc1Type: doc1Type,
        doc2Type: doc2Type,
        weight: combination.weight,
        combinationString: combination.document_types
      };
    }
  }
  
  // フォールバック
  const fallback = filtered[filtered.length - 1];
  const [doc1Type, doc2Type] = fallback.document_types.split(' + ');
  return {
    topic: fallback.topic,
    doc1Type: doc1Type,
    doc2Type: doc2Type,
    weight: fallback.weight,
    combinationString: fallback.document_types
  };
}

// Part 2発話タイプ定義（重み付き）
export const PART2_QUESTION_TYPES = [
  {
    type: "yes_no_question",
    description: "Yes / No で答える疑問文（例: Do you have a pen?）",
    weight: 25,
    instruction: "質問はYes/Noで答えられる疑問文にしてください。Do/Does/Are/Is/Can/Will/Would等で始まる形式を使用してください。"
  },
  {
    type: "wh_question",
    description: "Whで始まる情報疑問文（例: Where is the meeting?）",
    weight: 25,
    instruction: "質問はWho/What/When/Where/Why/How等のWh疑問詞で始まる情報疑問文にしてください。"
  },
  {
    type: "choice_question",
    description: "選択肢を提示する疑問文（例: Would you like tea or coffee?）",
    weight: 15,
    instruction: "質問は「AかBか」を選ぶ選択疑問文にしてください。'or'を含む質問形式を使用してください。"
  },
  {
    type: "request_or_command",
    description: "依頼・命令（例: Please call him back.）",
    weight: 10,
    instruction: "質問は依頼や命令の形式にしてください。Could you...?, Would you mind...?, Please...等の表現を使用してください。"
  },
  {
    type: "suggestion_or_offer",
    description: "提案・申し出（例: Shall we reschedule the meeting?）",
    weight: 10,
    instruction: "質問は提案や申し出の形式にしてください。Shall we...?, How about...?, Why don't we...?等の表現を使用してください。"
  },
  {
    type: "statement_response",
    description: "平叙文に対する返答（例: The elevator is not working. – Oh, I'll take the stairs.）",
    weight: 10,
    instruction: "質問は平叙文（陳述文）にしてください。相手からの応答を期待する自然な文にしてください。"
  },
  {
    type: "greeting_or_farewell",
    description: "あいさつや別れ（例: Good morning. – Good morning.）",
    weight: 2,
    instruction: "質問はあいさつや別れの表現にしてください。Good morning, How are you?, See you later等の表現を使用してください。"
  },
  {
    type: "thanks_or_apology",
    description: "感謝や謝罪（例: Thank you. – You're welcome.）",
    weight: 2,
    instruction: "質問は感謝や謝罪の表現にしてください。Thank you, I'm sorry, Excuse me等の表現を使用してください。"
  },
  {
    type: "compliment_or_emotion",
    description: "感嘆・感情表現（例: That was amazing!）",
    weight: 1,
    instruction: "質問は感嘆や感情表現にしてください。驚き、称賛、感動等を表す自然な表現を使用してください。"
  }
];

// Part 2発話タイプの重み付きランダム選択
export function selectQuestionTypeByWeight() {
  const totalWeight = PART2_QUESTION_TYPES.reduce((sum, type) => sum + type.weight, 0);
  const random = Math.random() * totalWeight;
  let currentWeight = 0;
  
  for (const type of PART2_QUESTION_TYPES) {
    currentWeight += type.weight;
    if (random <= currentWeight) {
      return type;
    }
  }
  return PART2_QUESTION_TYPES[0]; // フォールバック
}

// Part 2トピック定義（重み付き）
export const PART2_TOPICS = [
  {
    topic: "オフィス・会議",
    weight: 0.20
  },
  {
    topic: "予定・スケジュール", 
    weight: 0.15
  },
  {
    topic: "顧客サービス",
    weight: 0.12
  },
  {
    topic: "社内コミュニケーション",
    weight: 0.12
  },
  {
    topic: "電話対応",
    weight: 0.10
  },
  {
    topic: "交通・移動",
    weight: 0.08
  },
  {
    topic: "サービス・修理",
    weight: 0.07
  },
  {
    topic: "レストラン・食事",
    weight: 0.06
  },
  {
    topic: "ショッピング",
    weight: 0.06
  },
  {
    topic: "日常生活",
    weight: 0.04
  }
];

// Part 2トピックの重み付きランダム選択
export function selectTopicByWeight() {
  const totalWeight = PART2_TOPICS.reduce((sum, topicData) => sum + topicData.weight, 0);
  const random = Math.random() * totalWeight;
  let currentWeight = 0;
  
  for (const topicData of PART2_TOPICS) {
    currentWeight += topicData.weight;
    if (random <= currentWeight) {
      return topicData;
    }
  }
  return PART2_TOPICS[0]; // フォールバック
}

// Part 2専用プロンプトテンプレートを既存のPROMPT_TEMPLATESオブジェクトに追加
PROMPT_TEMPLATES.part2 = {
  questionGeneration: {
    systemPrompt: `あなたはTOEIC Part 2のテスト作成専門家で、質問-応答形式の英語リスニング問題の作成を専門としています。

TOEIC Part 2の形式:
- 質問文（音声のみ、テキスト表示なし）
- 3つの応答選択肢（A, B, C）
- 正解は1つ
- すべて音声で読み上げられる

応答のパターン:
- 直接応答: 質問に直接答える
- 間接応答: 質問の意図を理解した適切な応答
- 不適切応答: 質問と関係ない内容（ダミー選択肢）

重要な指示:
- ビジネスシーンと日常生活の両方を含む
- 自然で実用的な英語を使用
- 正解は指定された位置に配置
- 不正解は巧妙だが明確に間違っている応答にする
- 文化的に中立な内容にする

以下の構造のJSONのみを返してください（他のテキストは含めない）:
{
  "question": "英語の質問文",
  "questionType": "質問のタイプ",
  "options": ["応答A", "応答B", "応答C"],
  "correct": "正解の位置（A, B, C）",
  "explanation": "なぜこの応答が正解なのかの日本語説明",
  "topic": "質問のトピック",
  "difficulty": "難易度"
}`,

    userPrompt: (config) => {
      // 質問タイプの詳細情報を取得
      const questionTypeInfo = PART2_QUESTION_TYPES.find(type => type.type === config.questionType);
      const typeInstruction = questionTypeInfo ? questionTypeInfo.instruction : '自然で適切な質問形式を使用してください。';
      
      return `以下の設定でTOEIC Part 2問題を1問生成してください:

必須設定:
- 難易度: ${config.difficulty}
- 質問タイプ: ${config.questionType}
- 正解位置: ${config.correctPosition}
- トピック: ${config.topic || 'ビジネス・日常生活'}

要求事項:
- 指定された質問タイプに適合した自然な英語の質問を作成
- 正解は位置${config.correctPosition}に配置
- 選択肢には「A.」「B.」「C.」「D.」などの文字を絶対に追加しないでください
- 2つの不正解選択肢は巧妙だが明確に間違った応答
- 実際のTOEIC試験レベルの難易度を維持
- ビジネス環境または日常生活の文脈を使用

質問タイプ別の要求:
${typeInstruction}

必ずJSONのみを返してください。`;
    }
  },

  translation: {
    systemPrompt: `You are a professional English to Japanese translator specializing in TOEIC test content.

Translate the given English text to natural Japanese that would be appropriate for Japanese TOEIC test takers. The translation should:
- Be accurate and natural
- Use appropriate business/academic Japanese when needed
- Maintain the meaning and tone of the original
- Be suitable for language learners
- Be concise and clear

Return only the Japanese translation without any explanation or additional text.`,

    userPrompt: (text) => `Translate to Japanese: ${text}`
  }
};

// Part 3専用の設定
export const PART3_SCENARIOS = [
  { "scenario": "appointment_scheduling", "description": "Appointment scheduling", "jp": "予定／予約の調整", "weight": 0.06 },
  { "scenario": "service_inquiry", "description": "Service inquiry", "jp": "サービスに関する問い合わせ", "weight": 0.06 },
  { "scenario": "product_information", "description": "Product information request", "jp": "商品・製品情報の問い合わせ", "weight": 0.06 },
  { "scenario": "complaint_handling", "description": "Complaint handling", "jp": "クレーム対応", "weight": 0.06 },
  { "scenario": "order_placement", "description": "Placing an order", "jp": "注文の手続き", "weight": 0.06 },
  { "scenario": "order_issue", "description": "Problem with an order", "jp": "注文に関するトラブル", "weight": 0.06 },
  { "scenario": "payment_issue", "description": "Billing or payment issue", "jp": "支払い・請求に関する問題", "weight": 0.06 },
  { "scenario": "job_interview", "description": "Job interview", "jp": "採用面接", "weight": 0.05 },
  { "scenario": "internal_meeting", "description": "Internal meeting", "jp": "社内ミーティング", "weight": 0.05 },
  { "scenario": "client_meeting", "description": "Client meeting", "jp": "顧客との会議", "weight": 0.05 },
  { "scenario": "schedule_adjustment", "description": "Schedule adjustment", "jp": "日程の変更・調整", "weight": 0.05 },
  { "scenario": "technical_support", "description": "Technical support", "jp": "技術サポート", "weight": 0.05 },
  { "scenario": "feedback_request", "description": "Asking for feedback", "jp": "フィードバックの依頼", "weight": 0.05 },
  { "scenario": "reservation_check", "description": "Checking or changing a reservation", "jp": "予約確認・変更", "weight": 0.04 },
  { "scenario": "delivery_arrangement", "description": "Delivery arrangement", "jp": "配送手配", "weight": 0.04 },
  { "scenario": "follow_up_call", "description": "Follow-up call", "jp": "フォローアップの電話", "weight": 0.04 },
  { "scenario": "information_update", "description": "Updating customer information", "jp": "顧客情報の更新", "weight": 0.04 },
  { "scenario": "new_service_intro", "description": "Introducing a new service/product", "jp": "新しいサービス／製品の紹介", "weight": 0.04 },
  { "scenario": "onboarding_process", "description": "Onboarding or orientation", "jp": "入社時のオリエンテーション", "weight": 0.04 },
  { "scenario": "support_ticket", "description": "Support ticket follow-up", "jp": "サポート依頼の進捗確認", "weight": 0.04 }
];

// 業種リスト（重み付き）
// TOEIC Part 3（会話）とPart 4（スピーチ）で使用される業種のリスト
export const INDUSTRIES = [
  { "industry": "retail", "description": "Retail", "jp": "小売業", "weight": 0.08 },
  { "industry": "hospitality", "description": "Hospitality", "jp": "宿泊・観光業", "weight": 0.08 },
  { "industry": "healthcare", "description": "Healthcare", "jp": "医療・ヘルスケア", "weight": 0.08 },
  { "industry": "finance", "description": "Finance and Banking", "jp": "金融・銀行", "weight": 0.08 },
  { "industry": "education", "description": "Education", "jp": "教育", "weight": 0.07 },
  { "industry": "it_services", "description": "IT Services", "jp": "ITサービス", "weight": 0.07 },
  { "industry": "transportation", "description": "Transportation and Logistics", "jp": "運輸・物流", "weight": 0.07 },
  { "industry": "real_estate", "description": "Real Estate", "jp": "不動産", "weight": 0.07 },
  { "industry": "manufacturing", "description": "Manufacturing", "jp": "製造業", "weight": 0.07 },
  { "industry": "food_service", "description": "Food and Beverage", "jp": "飲食業", "weight": 0.07 },
  { "industry": "government", "description": "Public Sector / Government", "jp": "公共機関／行政", "weight": 0.06 },
  { "industry": "telecommunications", "description": "Telecommunications", "jp": "通信業", "weight": 0.06 },
  { "industry": "consulting", "description": "Consulting", "jp": "コンサルティング", "weight": 0.06 },
  { "industry": "entertainment", "description": "Entertainment and Media", "jp": "エンタメ・メディア", "weight": 0.06 },
  { "industry": "legal_services", "description": "Legal Services", "jp": "法律サービス", "weight": 0.05 },
  { "industry": "construction", "description": "Construction", "jp": "建設業", "weight": 0.05 },
  { "industry": "insurance", "description": "Insurance", "jp": "保険業", "weight": 0.05 },
  { "industry": "energy_utilities", "description": "Energy and Utilities", "jp": "エネルギー・インフラ", "weight": 0.05 },
  { "industry": "agriculture", "description": "Agriculture and Farming", "jp": "農業・酪農", "weight": 0.05 },
  { "industry": "personal_care", "description": "Personal Care Services", "jp": "美容・パーソナルケア", "weight": 0.05 },
  { "industry": "non_profit", "description": "Non-profit / NGO", "jp": "非営利団体／NGO", "weight": 0.05 },
  { "industry": "security_services", "description": "Security Services", "jp": "警備・セキュリティ", "weight": 0.05 },
  { "industry": "design_creative", "description": "Design and Creative", "jp": "デザイン・クリエイティブ", "weight": 0.05 },
  { "industry": "sports_fitness", "description": "Sports and Fitness", "jp": "スポーツ・フィットネス", "weight": 0.05 },
  { "industry": "postal_delivery", "description": "Postal and Delivery Services", "jp": "郵便・宅配業", "weight": 0.05 },
  { "industry": "rental_services", "description": "Rental Services (cars, equipment, etc.)", "jp": "レンタル業（自動車・機材など）", "weight": 0.05 },
  { "industry": "travel_agency", "description": "Travel Agency and Tour Services", "jp": "旅行代理店・ツアーサービス", "weight": 0.05 },
  { "industry": "airlines_airports", "description": "Airlines and Airport Services", "jp": "航空会社・空港サービス", "weight": 0.05 },
  { "industry": "retail_books", "description": "Bookstores", "jp": "書店", "weight": 0.04 },
  { "industry": "retail_electronics", "description": "Electronics and Appliance Retail", "jp": "家電・電子機器販売", "weight": 0.04 },
  { "industry": "retail_clothing", "description": "Clothing and Apparel Retail", "jp": "衣料品販売", "weight": 0.04 },
  { "industry": "retail_supermarket", "description": "Supermarkets and Grocery Stores", "jp": "スーパーマーケット・食料品店", "weight": 0.04 },
  { "industry": "pharmacy", "description": "Pharmacies and Drugstores", "jp": "薬局・ドラッグストア", "weight": 0.04 }
];

// Part 4スピーチタイプリスト（重み付き）
export const PART4_SPEECH_TYPES = [
  { type: "company_announcement", description: "Company announcement", jp: "企業からのお知らせ", weight: 0.07 },
  { type: "event_announcement", description: "Event announcement", jp: "イベント案内", weight: 0.07 },
  { type: "tour_guide", description: "Tour or facility guide", jp: "施設や観光地のガイド", weight: 0.07 },
  { type: "radio_broadcast", description: "Radio or podcast broadcast", jp: "ラジオ・ポッドキャスト放送", weight: 0.07 },
  { type: "sales_pitch", description: "Sales pitch or promotion", jp: "販売促進・セールス案内", weight: 0.06 },
  { type: "training_session", description: "Training or orientation session", jp: "研修・オリエンテーション", weight: 0.06 },
  { type: "customer_message", description: "Message to customers", jp: "顧客へのメッセージ", weight: 0.06 },
  { type: "phone_message", description: "Phone or voicemail message", jp: "電話・留守電メッセージ", weight: 0.06 },
  { type: "weather_update", description: "Weather or traffic update", jp: "天気・交通情報", weight: 0.05 },
  { type: "meeting_summary", description: "Meeting summary or update", jp: "会議の要点や更新", weight: 0.05 },
  { type: "public_event_notice", description: "Public event announcement", jp: "公共イベントの案内", weight: 0.05 },
  { type: "flight_announcement", description: "Airport or flight announcement", jp: "空港・飛行機内の案内", weight: 0.05 },
  { type: "company_vo_message", description: "Company voice announcement (IVR)", jp: "企業の音声案内メッセージ", weight: 0.05 },
  { type: "exhibit_guide", description: "Exhibit or museum guide", jp: "展示会・博物館ガイド", weight: 0.05 },
  { type: "emergency_notice", description: "Emergency alert or update", jp: "緊急連絡・注意喚起", weight: 0.05 },
  { type: "media_promo", description: "Media or entertainment promotion", jp: "メディア・番組の宣伝", weight: 0.05 },
  { type: "staff_training", description: "Internal staff training", jp: "社員研修・社内教育", weight: 0.05 },
  { type: "system_maintenance", description: "System maintenance announcement", jp: "システム保守案内", weight: 0.05 },
  { type: "policy_update", description: "Company policy or procedure change", jp: "方針変更・社内通知", weight: 0.05 },
  { type: "recruitment_notice", description: "Job opportunity or recruitment pitch", jp: "採用・求人のお知らせ", weight: 0.05 }
];

// Part 4質問タイプリスト（重み付き）
// TOEIC Part 4で出題される5種類の質問パターンとその出現確率
export const PART4_QUESTION_TYPES = [
  { type: 'main_purpose', weight: 0.22, description: '主目的', jp: 'スピーチの主な目的を問う質問' },
  { type: 'detail', weight: 0.22, description: '詳細情報', jp: '具体的な情報・詳細を問う質問' },
  { type: 'inference', weight: 0.18, description: '推論', jp: '内容から推測できることを問う質問' },
  { type: 'next_action', weight: 0.13, description: '次の行動', jp: '聞き手が取るべき行動を問う質問' },
  { type: 'intended_audience', weight: 0.13, description: '対象者', jp: 'スピーチの対象聴衆を問う質問' },
  { type: 'location', weight: 0.06, description: '場所・状況', jp: 'このスピーチが行われている場所や状況を問う質問' },
  { type: 'speaker_role', weight: 0.06, description: '話者の立場', jp: '話者の職業や立場を問う質問' }
];

export const PART3_QUESTION_TYPES = [
  { type: 'detail', weight: 0.3, description: '詳細情報' },
  { type: 'main_idea', weight: 0.2, description: '主要内容' },
  { type: 'inference', weight: 0.2, description: '推論' },
  { type: 'speaker_intention', weight: 0.15, description: '話者の意図' },
  { type: 'next_action', weight: 0.15, description: '次の行動' }
];

// Part 3の話者構成パターン（重み付き）
export const PART3_SPEAKER_PATTERNS = [
  { 
    pattern: 'male-female', 
    count: 2, 
    weight: 0.35, 
    description: '男性1名・女性1名',
    genders: ['male', 'female']
  },
  { 
    pattern: 'female-male', 
    count: 2, 
    weight: 0.35, 
    description: '女性1名・男性1名',
    genders: ['female', 'male']
  },
  { 
    pattern: 'male-male', 
    count: 2, 
    weight: 0.10, 
    description: '男性2名',
    genders: ['male', 'male']
  },
  { 
    pattern: 'female-female', 
    count: 2, 
    weight: 0.10, 
    description: '女性2名',
    genders: ['female', 'female']
  },
  { 
    pattern: 'mixed-three', 
    count: 3, 
    weight: 0.10, 
    description: '3名（性別混合）',
    genders: ['male', 'female', 'male'] // または ['female', 'male', 'female']など
  }
];

// Part 3専用プロンプトテンプレートを追加
PROMPT_TEMPLATES.part3 = {
  conversationGeneration: {
    systemPrompt: `あなたはTOEIC Part 3のテスト作成専門家で、2-3人の会話形式の英語リスニング問題の作成を専門としています。

TOEIC Part 3の形式:
- 2-3人による会話（30-60秒程度）
- 会話内容に関する3問の理解問題
- 各問題は4つの選択肢（A, B, C, D）
- 音声のみで会話と問題が読み上げられる

会話の特徴:
- 自然で実用的な英語の会話
- ビジネスシーンや日常生活の場面
- 明確な文脈と目的がある対話
- 情報交換、問題解決、依頼・応答などを含む

重要な指示:
- 各話者に明確な役割と目的を設定
- 自然な会話の流れを作成
- 3問の質問に答えられる十分な情報を含む
- 文化的に中立な内容にする
- 実際のTOEICレベルの語彙と表現を使用

【重要】TOEIC Part 3 問題文での話者指定方法:
- 問題文では話者の名前を使わず、「the man」「the woman」で指定する
- 同性が複数いる場合は「the first woman」「the second woman」を使用
- 3人の場合は「the third speaker」なども可能
- 例: ○「What does the man suggest?」 ×「What does John suggest?」

以下の構造のJSONのみを返してください（他のテキストは含めない）:
{
  "scenario": "シナリオ名",
  "speakers": [
    {"id": "A", "name": "話者名", "role": "役割", "gender": "male/female"},
    {"id": "B", "name": "話者名", "role": "役割", "gender": "male/female"}
  ],
  "conversation": [
    {"speaker": "A", "text": "発話内容"},
    {"speaker": "B", "text": "発話内容"}
  ],
  "questions": [
    {
      "question": "問題文",
      "options": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
      "correct": "正解",
      "explanation": "なぜこの選択肢が正解なのかの日本語解説",
      "questionType": "問題タイプ"
    }
  ],
  "difficulty": "難易度"
}`,

    userPrompt: (config) => `以下の設定でTOEIC Part 3問題を1問生成してください:

必須設定:
- 難易度: ${config.difficulty}
- シナリオ: ${config.scenario}${config.subScenario ? ` (具体的な状況: ${config.subScenario})` : ''}
- 業種: ${config.industry} (${config.industryDescription})
- 正解位置: ${config.correctPositions ? `問題1は${config.correctPositions[0]}、問題2は${config.correctPositions[1]}、問題3は${config.correctPositions[2]}` : 'A, B, C, Dからランダム'}
- 話者数: ${config.speakerCount}人
- 話者の性別: ${config.speakerGenders ? config.speakerGenders.map((g, i) => `話者${String.fromCharCode(65 + i)}は${g === 'male' ? '男性' : '女性'}`).join('、') : 'ランダム'}

要求事項:
- 指定されたシナリオと業種に適した自然な英語の会話を作成${config.subScenario ? `（特に「${config.subScenario}」の具体的な状況を反映）` : ''}
- 会話の内容は${config.industryDescription}業界の文脈に合わせて作成
- 会話は4-8回のやりとりで構成
- 3問の理解問題を作成（各問題は異なる側面を問う）
- 話者の名前と役割は指定された性別に適したものを使用
- speakers配列の各要素にgenderフィールドを必ず含める（"male"または"female"）
${config.correctPositions ? `- 正解は指定された位置に配置（問題1: ${config.correctPositions[0]}位置、問題2: ${config.correctPositions[1]}位置、問題3: ${config.correctPositions[2]}位置）` : ''}
- 選択肢には「A.」「B.」「C.」「D.」などの文字を絶対に追加しないでください
- 3つの不正解選択肢は巧妙だが明確に間違った内容
- 実際のTOEIC試験レベルの難易度を維持
- 会話から推論できる情報も問題に含める
- 各問題の解説（explanation）は日本語で記述し、なぜその選択肢が正解なのかを明確に説明

【重要】問題文での話者指定方法（TOEIC標準）:
- 男性1人の場合: "What does the man..." を使用
- 女性1人の場合: "What does the woman..." を使用  
- 同性が複数の場合: "What does the first woman..." "What does the second woman..." を使用
- 3人の場合: "What does the third speaker..." のような表現も可能
- 決して会話中の名前（John, Emily等）を問題文で使用しないこと
- 例: ✓ "What does the woman ask the man to do?" / ✗ "What does Emily ask John to do?"

会話の長さ:
- Easy: 4-5回のやりとり、基本的な語彙
- Medium: 5-6回のやりとり、中程度の語彙
- Hard: 6-8回のやりとり、高度な語彙と複雑な状況

必ずJSONのみを返してください。`
  },

  translation: {
    systemPrompt: `You are a professional English to Japanese translator specializing in TOEIC Part 3 conversation content.

Translate the given English conversation and questions to natural Japanese that would be appropriate for Japanese TOEIC test takers. The translation should:
- Be accurate and natural
- Maintain the conversational tone and context
- Use appropriate business/daily life Japanese when needed
- Preserve the meaning and nuance of the original
- Be suitable for language learners
- Be concise and clear

Return only the Japanese translation without any explanation or additional text.`,

    userPrompt: (text) => `Translate to Japanese: ${text}`
  },

  batchTranslation: {
    conversationBatch: {
      systemPrompt: `You are a professional English to Japanese translator specializing in TOEIC Part 3 conversation content.

Translate the given scenario and conversation to natural Japanese that would be appropriate for Japanese TOEIC test takers. The translation should:
- Be accurate and natural
- Maintain the conversational tone and context
- Use appropriate business/daily life Japanese when needed
- Preserve the meaning and nuance of the original
- Be suitable for language learners
- Be concise and clear

Return the result in the following JSON format:
{
  "scenarioTranslation": "シナリオの日本語翻訳",
  "conversationTranslations": [
    {
      "speaker": "A",
      "translation": "発話の日本語翻訳"
    },
    {
      "speaker": "B", 
      "translation": "発話の日本語翻訳"
    }
  ]
}

Return only valid JSON without any explanation or additional text.`,

      userPrompt: (data) => `Translate the following scenario and conversation to Japanese:

Scenario: ${data.scenario}

Conversation:
${data.conversation.map(turn => `${turn.speaker}: ${turn.text}`).join('\n')}

Please return the translations in the specified JSON format.`
    },

    questionsBatch: {
      systemPrompt: `You are a professional English to Japanese translator specializing in TOEIC Part 3 questions and options.

Translate the given questions and options to natural Japanese that would be appropriate for Japanese TOEIC test takers. The translation should:
- Be accurate and natural
- Maintain question clarity and precision
- Use appropriate business/daily life Japanese when needed
- Preserve the meaning and nuance of the original
- Be suitable for language learners
- Be concise and clear

Return the result in the following JSON format:
{
  "questionsTranslations": [
    {
      "questionTranslation": "問題文の日本語翻訳",
      "optionTranslations": [
        "選択肢Aの日本語翻訳",
        "選択肢Bの日本語翻訳", 
        "選択肢Cの日本語翻訳",
        "選択肢Dの日本語翻訳"
      ]
    }
  ]
}

Return only valid JSON without any explanation or additional text.`,

      userPrompt: (questions) => `Translate the following questions and options to Japanese:

${questions.map((q, index) => 
  `Question ${index + 1}: ${q.question}
Options:
A: ${q.options[0]}
B: ${q.options[1]}
C: ${q.options[2]}
D: ${q.options[3]}`
).join('\n\n')}

Please return the translations in the specified JSON format.`
    }
  }
};

// Part 1翻訳用プロンプトテンプレートを追加
PROMPT_TEMPLATES.part1Translation = {
    optionsBatch: {
      systemPrompt: `You are a professional English to Japanese translator specializing in TOEIC Part 1 questions.

Translate the given options and explanation to natural Japanese that would be appropriate for Japanese TOEIC test takers. The translation should:
- Be accurate and natural
- Maintain clarity and precision for image description questions
- Use appropriate descriptive Japanese
- Preserve the meaning and nuance of the original
- Be suitable for language learners
- Be concise and clear

Return the result in the following JSON format:
{
  "optionTranslations": [
    "第1選択肢の日本語翻訳",
    "第2選択肢の日本語翻訳",
    "第3選択肢の日本語翻訳",
    "第4選択肢の日本語翻訳"
  ],
  "explanationTranslation": "解説の日本語翻訳"
}

IMPORTANT: Do not include A, B, C, D labels in your translations. Translate only the content of each option.

Return only valid JSON without any explanation or additional text.`,

      userPrompt: (data) => `Translate the following Part 1 options and explanation to Japanese:

Options:
A: ${data.options[0]}
B: ${data.options[1]}
C: ${data.options[2]}
D: ${data.options[3]}

Explanation: ${data.explanation}

IMPORTANT: Translate only the content, do not include any A, B, C, D labels in your translations.

Please return the translations in the specified JSON format.`
    }
  };

// Part 4専用プロンプトテンプレートを追加
PROMPT_TEMPLATES.part4 = {
  speechGeneration: {
    systemPrompt: `あなたはTOEIC Part 4のテスト作成専門家で、1人のスピーカーによるモノローグ形式の英語リスニング問題の作成を専門としています。

TOEIC Part 4の形式:
- 1人による連続したスピーチ（30-60秒程度）
- スピーチ内容に関する3問の理解問題
- 各問題は4つの選択肢（A, B, C, D）
- 音声のみでスピーチと問題が読み上げられる

スピーチの特徴:
- 自然で実用的な英語のモノローグ
- 企業アナウンス、イベント案内、ラジオ放送など
- 明確な目的と構造がある内容
- 聞き手に情報を伝える、説明する、案内する

重要な指示:
- スピーカーの立場と目的を明確に設定
- 論理的で聞きやすい構成
- 指定された難易度に適した語彙と構文
- 質問の正解位置は指定された位置に必ず配置

難易度ガイドライン:
- Easy: シンプルな構文、基本的な語彙、明確な情報構造
- Medium: 標準的な構文、一般的なビジネス語彙、やや複雑な情報
- Hard: 複雑な構文、高度な語彙、詳細で複雑な情報

IMPORTANT: Return ONLY valid JSON in the exact format shown below. Do not include any other text, explanations, or markdown formatting.

応答は以下の形式のJSONで返してください:
{
  "speechContent": {
    "speaker": {
      "id": "A",
      "name": "適切な話者名（例: Announcer, Manager, Guide）",
      "role": "話者の役割（例: Company spokesperson, Event coordinator）",
      "gender": "male/female"
    },
    "text": "スピーチの完全な内容（5-8文程度）",
    "topic": "スピーチの主題"
  },
  "questions": [
    {
      "id": 1,
      "question": "問題文",
      "options": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
      "correct": "正解のテキスト（選択肢の中から1つ）",
      "correctPosition": "A/B/C/D",
      "explanation": "なぜその答えが正しいかの説明（日本語）",
      "questionType": "main_purpose/detail/inference/next_action/intended_audience"
    },
    // 同様に合計3問
  ]
}`,

    userPrompt: (config) => {
      const { difficulty, speechType, industry, questionTypes, correctPositions } = config;
      
      return `Generate a TOEIC Part 4 speech with the following specifications:

【Speech Type】: ${speechType.description} (${speechType.jp})
【Industry】: ${industry.description} (${industry.jp})
【Difficulty】: ${difficulty}
【Question Types】: ${questionTypes.join(', ')}
【Correct Answer Positions】: Question 1=${correctPositions[0]}, Question 2=${correctPositions[1]}, Question 3=${correctPositions[2]}

Create a natural monologue speech appropriate for the specified speech type and industry context. The speech should be 30-60 seconds when read aloud (approximately 100-150 words).

For each question:
- Place the correct answer at the EXACT position specified above
- Ensure all other options are plausible but clearly incorrect
- Match the question type specified for each question

Return the response in the specified JSON format.`;
    }
  },

  qualityCheck: {
    systemPrompt: `あなたはTOEIC Part 4問題の品質チェック専門家です。生成されたスピーチと問題を評価し、必要に応じて改善案を提供してください。

評価基準:
1. スピーチが指定されたタイプと業種に適合しているか
2. 難易度が適切か（語彙、構文の複雑さ）
3. スピーチが自然で論理的か
4. 各問題の正解が明確で、誤答が適切に誤りであるか
5. 問題タイプが指定通りか

IMPORTANT: Return ONLY valid JSON. Do not include any other text or markdown.`,

    userPrompt: (speech) => `以下のTOEIC Part 4問題を評価してください:

${JSON.stringify(speech, null, 2)}

応答は以下のJSON形式で返してください:
{
  "isValid": true/false,
  "issues": ["問題点1", "問題点2", ...],
  "suggestions": ["改善案1", "改善案2", ...]
}`
  },

  // 統合翻訳（スピーチ本文 + 質問・選択肢を一度に翻訳）
  unifiedTranslation: {
    systemPrompt: `あなたは英日翻訳の専門家です。TOEIC Part 4のスピーチ本文と質問・選択肢を日本語に翻訳してください。

重要:
- 自然で分かりやすい日本語に翻訳
- ビジネス用語は適切な日本語表現を使用
- 文脈を考慮した翻訳
- 質問は明確で理解しやすい日本語に
- 選択肢はラベル（A:, B:, C:, D:）を含めない

Return ONLY valid JSON without any markdown formatting or explanations.`,

    userPrompt: (data) => `Translate the following Part 4 content to Japanese:

Speech Text:
${data.text}

Questions and Options:
${data.questions.map((q, index) => 
  `Question ${index + 1}: ${q.question}
Options:
A: ${q.options[0]}
B: ${q.options[1]}
C: ${q.options[2]}
D: ${q.options[3]}`
).join('\n\n')}

Return the translations in this JSON format:
{
  "textTranslation": "スピーチ全文の日本語訳",
  "questionsTranslations": [
    {
      "questionTranslation": "問題文の日本語翻訳",
      "optionTranslations": [
        "選択肢Aの日本語翻訳",
        "選択肢Bの日本語翻訳",
        "選択肢Cの日本語翻訳",
        "選択肢Dの日本語翻訳"
      ]
    }
  ]
}`
  }
}; // End of PROMPT_TEMPLATES

// Part 5専用プロンプトテンプレートを追加
PROMPT_TEMPLATES.part5 = {
  // カテゴリ
  categories: [
    "品詞識別",
    "動詞の形・時制",
    "主語と動詞の一致",
    "接続詞",
    "前置詞",
    "関係詞・代名詞",
    "比較構文・数量",
    "語彙選択",
    "慣用表現・句動詞",
    "構文",
    "語法"
  ],

  // カテゴリ別重み付け
  weightsByCategory: {
    "品詞識別": 2.5,
    "動詞の形・時制": 2.2,
    "主語と動詞の一致": 1.8,
    "接続詞": 1.5,
    "前置詞": 1.3,
    "関係詞・代名詞": 1.2,
    "比較構文・数量": 1.0,
    "語彙選択": 2.8,
    "慣用表現・句動詞": 1.0,
    "構文": 0.7,
    "語法": 1.5
  },

  // カテゴリ別出題意図（重み付け対応）
  intentsByCategory: {
    "品詞識別": {
      "名詞と動詞の使い分けを問う": 2.3,
      "形容詞と副詞の識別を問う": 2.7,
      "名詞と形容詞の使い分けを問う": 2.2,
      "動詞と形容詞の識別を問う": 2.0
    },
    "動詞の形・時制": {
      "不定詞と動名詞の使い分けを問う": 2.2,
      "受動態と能動態の判断を問う": 2.0,
      "過去形と現在完了の区別を問う": 1.8,
      "現在形と現在進行形の使い分けを問う": 1.5,
      "未来形の表現方法を問う": 1.3
    },
    "主語と動詞の一致": {
      "主語に合った動詞選択を問う": 2.0,
      "単数・複数の一致を問う": 1.8,
      "集合名詞の動詞選択を問う": 1.5
    },
    "接続詞": {
      "論理関係に合った接続詞選択を問う": 1.8,
      "因果関係を表す接続詞を問う": 1.6,
      "対比・譲歩の接続詞を問う": 1.4,
      "時間関係の接続詞を問う": 1.2
    },
    "前置詞": {
      "時間・場所に応じた前置詞の選択を問う": 1.4,
      "動詞との組み合わせによる前置詞を問う": 1.3,
      "慣用的な前置詞の使用を問う": 1.2
    },
    "関係詞・代名詞": {
      "関係代名詞の機能に応じた選択を問う": 1.3,
      "関係副詞の適切な使用を問う": 1.1,
      "指示代名詞の使い分けを問う": 1.0
    },
    "比較構文・数量": {
      "比較級・最上級・数量表現の理解を問う": 1.3,
      "同等比較の表現を問う": 1.0,
      "数量詞の正しい使用を問う": 1.0
    },
    "語彙選択": {
      "意味の似た語の正しい用法を問う": 2.8,
      "文脈に応じた適切な語彙選択を問う": 2.5,
      "ビジネス用語の使い分けを問う": 2.3
    },
    "慣用表現・句動詞": {
      "句動詞やビジネス慣用表現の使い分けを問う": 1.2,
      "イディオムの正しい使用を問う": 1.0,
      "定型表現の理解を問う": 0.8
    },
    "構文": {
      "否定構文の語順を問う": 0.6,
      "倒置構文の語順を問う": 0.5,
      "仮定法過去の構文を問う": 0.7,
      "仮定法過去完了の構文を問う": 0.6,
      "省略された仮定法の文を完成させる": 0.5,
      "強調構文（It is ... that）を問う": 0.6
    },
    "語法": {
      "to不定詞と動名詞を取る動詞の使い分けを問う": 1.8,
      "目的語＋不定詞構文（enable A to doなど）を問う": 1.7,
      "that節を取る動詞の語法を問う": 1.5,
      "使役・知覚構文の語法を問う": 1.3,
      "形容詞を伴う構文（be eager to / be likely to など）を問う": 1.3,
      "提案・要求動詞に続く仮定法構文（demand that he goなど）を問う": 1.2
    }
  },

  // 文の長さ
  lengths: ['short', 'medium', 'long'],

  // 選択肢タイプ
  optionsTypes: [
    "同語の語形変化",
    "類義語の選択",
    "前置詞や接続詞の選択",
    "同じ品詞で意味が紛らわしい語"
  ],

  // 正解位置
  answerPositions: ['A', 'B', 'C', 'D'],

  // 問題生成プロンプト
  generation: {
    systemPrompt: `あなたはTOEIC Part 5問題の専門作成者です。
短文穴埋め問題を作成してください。

重要な要求事項：
1. ビジネス・日常生活で自然な英文を作成
2. 文法的に正確で、ネイティブスピーカーが自然に感じる表現
3. TOEIC Part 5の形式と難易度に準拠
4. 1つの空所のみを設ける
5. 4つの選択肢（A, B, C, D）を提供
6. 正解は1つのみ、他は明確に不正解
7. 日本語解説も含める

【重要：選択肢の形式】
- 選択肢には「A.」「B.」「C.」「D.」などの文字を追加しないでください
- 選択肢は純粋な内容のみを記述してください
- 例：
  - 正しい例: "efficiently"
  - 間違った例: "A. efficiently"

出力形式はJSON形式で以下の構造にしてください：
{
  "sentence": "空所を___で示した英文",
  "question": "(_____) に入る最も適切な語を選びなさい。",
  "options": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
  "correct": "A|B|C|D",
  "explanation": "日本語での詳細解説",
  "difficulty": "easy|medium|hard",
  "category": "指定されたカテゴリ",
  "intent": "出題意図",
  "length": "short|medium|long",
  "vocabLevel": "easy|medium|hard",
  "optionsType": "選択肢タイプ",
  "topic": "ビジネス/日常のトピック"
}`,

    userPrompt: (params) => `以下の条件でTOEIC Part 5問題を1問作成してください：

【生成条件】
- 難易度: ${params.difficulty}
- カテゴリ: ${params.category}
- 出題意図: ${params.intent}
- 文の長さ: ${params.length}
- 語彙レベル: ${params.vocabLevel}
- 選択肢タイプ: ${params.optionsType}
- 正解位置: ${params.answerIndex}

【特別な要求】
正解の位置は必ず指定された位置（${params.answerIndex}）に配置してください。
- Aは1番目の選択肢（options[0]）
- Bは2番目の選択肢（options[1]）
- Cは3番目の選択肢（options[2]）
- Dは4番目の選択肢（options[3]）

JSON形式で問題を作成してください。`
  },

  // 翻訳プロンプト
  translation: {
    question: {
      systemPrompt: `あなたは優秀な日英翻訳者です。以下の英文を自然な日本語に翻訳してください。文法用語や専門用語は適切に日本語化してください。`,
      userPrompt: (text) => `次の英文を日本語に翻訳してください：\n\n${text}`
    },

    options: {
      systemPrompt: `あなたはTOEIC Part 5問題の選択肢翻訳者です。
選択肢を受験者向けに簡潔に翻訳してください。

重要なルール：
1. 各選択肢は1-4語の日本語に翻訳
2. 説明や解説は絶対に不要
3. 文脈に応じた最も適切な意味のみ
4. 前置詞は「～に/～で」のような形式
5. 冗長な説明は避ける

例：
- "at" → "～に/～で"
- "efficiently" → "効率的に"
- "complete" → "完了する"`,

      userPrompt: (sentence, optionsList) => `問題文: "${sentence}"

以下の選択肢をTOEIC受験者向けに簡潔に翻訳してください。
各選択肢は1行で、説明なしで翻訳のみ：

${optionsList}

翻訳:`
    },

    // 統合翻訳プロンプト（問題文と選択肢を一度に翻訳）
    combined: {
      systemPrompt: `あなたはTOEIC Part 5問題の翻訳専門家です。
問題文と選択肢を適切に日本語に翻訳してください。

重要なルール：
1. 問題文は自然な日本語に翻訳
2. 選択肢は1-4語の簡潔な日本語に翻訳
3. 選択肢に説明や解説は絶対に不要
4. 文脈に応じた最も適切な意味のみ
5. 前置詞は「～に/～で」のような形式
6. 文法用語や専門用語は適切に日本語化

出力形式：
{
  "questionTranslation": "問題文の翻訳",
  "optionTranslations": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"]
}`,

      userPrompt: (completeSentence, options) => `次のTOEIC Part 5問題を翻訳してください：

問題文（空欄を正解で埋めた完全な文）：
${completeSentence}

選択肢：
${options.map((option, index) => `${index + 1}. ${option}`).join('\n')}

JSON形式で翻訳を出力してください。`
    }
  }
};

// ユーティリティ関数
export const TEMPLATE_UTILS = {
  /**
   * テンプレート文字列の変数を置換
   */
  fillTemplate(template, variables) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  },

  /**
   * 配列からランダムに選択
   */
  randomSelect(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  /**
   * 重み付きランダム選択
   * @param {Object} weights - {item: weight, ...} 形式のオブジェクト
   * @returns {string} - 選択されたアイテム
   */
  weightedRandomSelect(weights) {
    const items = Object.keys(weights);
    const weightValues = Object.values(weights);
    
    // 重みの合計を計算
    const totalWeight = weightValues.reduce((sum, weight) => sum + weight, 0);
    
    // ランダムな値を生成（0 から totalWeight の間）
    let randomValue = Math.random() * totalWeight;
    
    // 重み付きでアイテムを選択
    for (let i = 0; i < items.length; i++) {
      randomValue -= weightValues[i];
      if (randomValue <= 0) {
        return items[i];
      }
    }
    
    // フォールバック（通常は実行されない）
    return items[items.length - 1];
  },

  /**
   * カテゴリを重み付きランダム選択
   */
  selectWeightedCategory() {
    return this.weightedRandomSelect(PROMPT_TEMPLATES.part5.weightsByCategory);
  },

  /**
   * カテゴリに基づいて出題意図を重み付きランダム選択
   */
  selectWeightedIntent(category) {
    const intents = PROMPT_TEMPLATES.part5.intentsByCategory[category];
    if (!intents || typeof intents !== 'object') {
      return "文法知識の理解を問う";
    }
    return this.weightedRandomSelect(intents);
  },

  /**
   * カテゴリに基づいて出題意図を取得（後方互換性のため）
   */
  getIntentsByCategory(category) {
    const intents = PROMPT_TEMPLATES.part5.intentsByCategory[category];
    if (!intents || typeof intents !== 'object') {
      return [];
    }
    return Object.keys(intents);
  }
};

// Part 6専用の設定
export const PART6_DOCUMENT_TYPES = [
  { type: 'email', description: 'Business Email', jp: 'ビジネスメール', weight: 0.25 },
  { type: 'letter', description: 'Business Letter', jp: 'ビジネスレター', weight: 0.15 },
  { type: 'article', description: 'Article/Report', jp: '記事・レポート', weight: 0.20 },
  { type: 'advertisement', description: 'Advertisement', jp: '広告', weight: 0.15 },
  { type: 'notice', description: 'Notice/Announcement', jp: '通知・案内', weight: 0.15 },
  { type: 'memo', description: 'Internal Memo', jp: '社内メモ', weight: 0.10 }
];

export const PART6_QUESTION_TYPES = [
  { type: 'vocabulary', description: '語彙選択', weight: 0.30 },
  { type: 'grammar', description: '文法・語形', weight: 0.30 },
  { type: 'context', description: '文脈理解', weight: 0.25 },
  { type: 'sentence_insertion', description: '文挿入', weight: 0.15 }
];

// Part 6用ビジネストピック（Part 7のBUSINESS_TOPICSを重み付けして流用）
// 文書形式（メール、レター、記事、広告、通知、メモ）に適したトピック分布
export const PART6_BUSINESS_TOPICS = [
  // 高頻度：日常的なビジネスコミュニケーション（メール・通知向け）
  { topic: 'meeting_scheduling', description: '会議スケジュール調整', weight: 0.08 },
  { topic: 'office_announcements', description: 'オフィス告知', weight: 0.07 },
  { topic: 'simple_notifications', description: '簡単な通知', weight: 0.07 },
  { topic: 'basic_requests', description: '基本的な依頼', weight: 0.06 },
  { topic: 'schedule_changes', description: 'スケジュール変更', weight: 0.06 },
  { topic: 'customer_inquiries', description: '顧客問い合わせ', weight: 0.06 },
  { topic: 'team_coordination', description: 'チーム連携', weight: 0.05 },
  
  // 中頻度：業務関連（記事・レポート向け）
  { topic: 'policy_changes', description: '方針変更', weight: 0.05 },
  { topic: 'system_updates', description: 'システム更新', weight: 0.05 },
  { topic: 'training_programs', description: '研修プログラム', weight: 0.04 },
  { topic: 'service_announcements', description: 'サービス変更通知', weight: 0.04 },
  { topic: 'event_planning', description: 'イベント企画・運営', weight: 0.04 },
  { topic: 'inventory_updates', description: '在庫・供給状況', weight: 0.04 },
  { topic: 'product_launch', description: '商品発売・紹介', weight: 0.04 },
  
  // 中頻度：業務改善・評価（レター・記事向け）
  { topic: 'business_trends', description: 'ビジネストレンド', weight: 0.03 },
  { topic: 'performance_reviews', description: '人事評価', weight: 0.03 },
  { topic: 'customer_complaints', description: '顧客苦情', weight: 0.03 },
  { topic: 'project_collaboration', description: 'プロジェクト協力', weight: 0.03 },
  { topic: 'cross_department_coordination', description: '部門間連携', weight: 0.03 },
  
  // 低頻度：専門的・高度なビジネス（記事・広告向け）
  { topic: 'complex_negotiations', description: '複雑な交渉', weight: 0.02 },
  { topic: 'strategic_planning', description: '戦略計画', weight: 0.02 },
  { topic: 'financial_analysis', description: '財務分析', weight: 0.02 },
  { topic: 'legal_compliance', description: '法的遵守', weight: 0.02 },
  { topic: 'international_business', description: '国際ビジネス', weight: 0.02 },
  { topic: 'crisis_management', description: '危機管理', weight: 0.01 }
];

// Part 6プロンプトテンプレート
PROMPT_TEMPLATES.part6 = {
  textGeneration: {
    systemPrompt: `あなたはTOEIC Part 6のテスト作成専門家です。
長文穴埋め問題を作成してください。

TOEIC Part 6の形式：
- 1つの文書（メール、記事、広告など）に4つの空欄
- 各空欄に4つの選択肢（A, B, C, D）
- 語彙・文法・文脈理解を総合的に評価
- ビジネス文書形式

重要な要求事項：
1. 自然で実用的なビジネス文書を作成
2. 文法的に正確で、ネイティブスピーカーが自然に感じる表現
3. TOEIC Part 6の形式と難易度に準拠
4. 4つの空欄を適切な位置に配置
5. 各空欄に4つの選択肢を提供
6. 正解は1つのみ、他は明確に不正解
7. 日本語解説も含める

出力形式はJSON形式で以下の構造にしてください：
{
  "documentType": "指定された文書タイプ",
  "title": "文書のタイトル",
  "fullText": "空欄を(1)、(2)、(3)、(4)で示した完全な文書",
  "blanks": [
    {
      "blankId": "blank1",
      "position": 1,
      "options": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
      "correct": "A|B|C|D",
      "explanation": "なぜその答えが正しいかの説明（日本語）",
      "questionType": "vocabulary|grammar|context|sentence_insertion"
    }
  ],
  "difficulty": "easy|medium|hard",
  "topic": "ビジネス分野",
  "wordCount": 文書の単語数
}`,

    userPrompt: (config) => `以下の条件でTOEIC Part 6問題を1問作成してください：

【生成条件】
- 難易度: ${config.difficulty}
- 文書タイプ: ${config.documentType.type} (${config.documentType.description})
- ビジネストピック: ${config.businessTopic.topic} (${config.businessTopic.description})
- 空欄数: 4個

【特別な要求】
各空欄の正解位置は以下のように配置してください：
- 空欄1の正解位置: ${config.correctPositions[0]}
- 空欄2の正解位置: ${config.correctPositions[1]}
- 空欄3の正解位置: ${config.correctPositions[2]}
- 空欄4の正解位置: ${config.correctPositions[3]}

【問題タイプの配分】
- 空欄1: ${config.questionTypes[0].type} (${config.questionTypes[0].description})
- 空欄2: ${config.questionTypes[1].type} (${config.questionTypes[1].description})
- 空欄3: ${config.questionTypes[2].type} (${config.questionTypes[2].description})
- 空欄4: ${config.questionTypes[3].type} (${config.questionTypes[3].description})

JSON形式で問題を作成してください。`
  },

  translation: {
    systemPrompt: `あなたはTOEIC Part 6問題の翻訳専門家です。
文書全体と選択肢を適切に日本語に翻訳してください。

重要なルール：
1. 文書は自然で分かりやすい日本語に翻訳
2. 与えられた文書は既に完成した文章なので、そのまま翻訳
3. 選択肢は1-4語の簡潔な日本語に翻訳
4. 選択肢に説明や解説は絶対に不要
5. 文脈に応じた最も適切な意味のみ
6. ビジネス用語は適切な日本語表現を使用
7. 4つの空欄すべてに対する選択肢翻訳を提供すること

出力形式：
{
  "titleTranslation": "タイトルの翻訳",
  "contentTranslation": "文書全体の翻訳（空欄なしの完全な文章として）",
  "questionsTranslations": [
    {
      "optionTranslations": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"]
    },
    {
      "optionTranslations": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"]
    },
    {
      "optionTranslations": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"]
    },
    {
      "optionTranslations": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"]
    }
  ]
}`,

    userPrompt: (data) => `次のTOEIC Part 6問題を翻訳してください：

タイトル：${data.title}

文書全体（正解が埋められた完全な文章）：
${data.completedContent || data.content || data.fullText}

選択肢：
${(data.questions || data.blanks).map((item, index) => 
  `空欄${index + 1}: ${item.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join(', ')}`
).join('\n')}

重要：
1. 上記の文書は既に空欄に正解が埋められた完全な文章です
2. この完全な文章をそのまま自然な日本語に翻訳してください
3. 翻訳には空欄を含めないでください（元の文書は既に完成しています）
4. 選択肢は簡潔に翻訳してください
5. questionsTranslationsは必ず4つの要素を含む配列で、各要素が4つの選択肢翻訳を含むこと

JSON形式で翻訳を出力してください。`
  }
};

