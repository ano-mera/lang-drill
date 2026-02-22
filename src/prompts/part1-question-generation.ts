export interface QuestionGenerationConfig {
  sceneDescription: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface Part1QuestionExample {
  sceneDescription: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const QUESTION_EXAMPLES: Part1QuestionExample[] = [
  {
    sceneDescription: 'A businesswoman is sitting at her desk in an office, typing on a computer keyboard while looking at the monitor screen.',
    question: 'What is the woman doing?',
    options: [
      'She is writing on paper.',
      'She is typing on a keyboard.',
      'She is talking on the phone.',
      'She is reading a document.'
    ],
    correct: 'B',
    explanation: 'The scene description clearly states that the businesswoman is "typing on a computer keyboard," which matches option B.',
    difficulty: 'easy'
  },
  {
    sceneDescription: 'A waiter is carrying a tray with dishes and walking towards a table where customers are seated.',
    question: 'What is the waiter doing?',
    options: [
      'He is taking an order.',
      'He is cleaning a table.',
      'He is serving food.',
      'He is counting money.'
    ],
    correct: 'C',
    explanation: 'The waiter is "carrying a tray with dishes and walking towards a table," which indicates he is serving food to customers.',
    difficulty: 'easy'
  },
  {
    sceneDescription: 'Several passengers are standing in line at the check-in counter while a female airline employee is processing their boarding passes and checking their luggage.',
    question: 'Where does this scene most likely take place?',
    options: [
      'At a hotel reception desk',
      'At an airport check-in counter',
      'At a train ticket office',
      'At a hospital information desk'
    ],
    correct: 'B',
    explanation: 'The scene mentions "check-in counter," "boarding passes," and "airline employee," which clearly indicates an airport setting.',
    difficulty: 'medium'
  }
];

export const QUESTION_TYPES = [
  'What is the [person] doing?',
  'Where does this scene take place?',
  'What can be seen in this scene?',
  'Who is in the scene?',
  'What is happening in the scene?'
];

export const QUESTION_GENERATION_PROMPT = {
  systemPrompt: `You are an expert TOEIC Part 1 question creator. Your role is to generate high-quality multiple-choice questions based on scene descriptions. Each question should follow the exact format and difficulty standards of official TOEIC Part 1 tests.

Key Requirements:
- Create exactly 1 question with 4 answer choices (A, B, C, D)
- One correct answer and three plausible distractors
- Questions should test listening comprehension skills
- Use natural, appropriate English for the specified difficulty level
- Ensure answer choices are grammatically parallel
- Focus on what would be audible/observable in the scene
- Provide clear, educational explanations

Question Types to Use:
- Action questions: "What is the [person] doing?"
- Location questions: "Where does this scene take place?"
- Description questions: "What can be seen in this scene?"
- People questions: "Who is [doing action]?"
- General questions: "What is happening?"`,

  userPrompt: (config: QuestionGenerationConfig) => `Create a TOEIC Part 1 multiple-choice question based on this scene description:

Scene: "${config.sceneDescription}"
Difficulty: ${config.difficulty}
Topic: ${config.topic}

Requirements:
1. Generate 1 clear, appropriate question
2. Provide exactly 4 answer choices (A, B, C, D)
3. Identify the correct answer
4. Write a brief explanation for why the correct answer is right
5. Ensure all choices are grammatically parallel and plausible
6. Match the difficulty level: 
   - Easy: Simple vocabulary, straightforward questions
   - Medium: Moderate vocabulary, may require inference
   - Hard: Advanced vocabulary, complex scenarios

Format your response as JSON:
{
  "question": "Your question here",
  "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
  "correct": "A" | "B" | "C" | "D",
  "explanation": "Brief explanation of why the correct answer is right",
  "difficulty": "${config.difficulty}",
  "questionType": "action|location|description|people|general"
}`,

  difficultyGuidelines: {
    easy: {
      vocabulary: 'Basic, everyday words (1000-2000 most common English words)',
      grammar: 'Simple present/present continuous, basic sentence structures',
      concepts: 'Direct, obvious actions and situations',
      distractors: 'Clearly different from correct answer'
    },
    medium: {
      vocabulary: 'Intermediate vocabulary, some professional terms',
      grammar: 'More complex sentence structures, passive voice',
      concepts: 'May require basic inference, workplace scenarios',
      distractors: 'Plausible but incorrect, require careful listening'
    },
    hard: {
      vocabulary: 'Advanced vocabulary, technical/professional terms',
      grammar: 'Complex structures, conditional, perfect tenses',
      concepts: 'Complex scenarios, multiple people, simultaneous actions',
      distractors: 'Very plausible, require detailed understanding'
    }
  },

  examples: QUESTION_EXAMPLES
};