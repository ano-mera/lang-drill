/**
 * Text generation utilities for clipboard copy functionality
 */

import { Passage, Part3Question, Part4Question } from "@/lib/types";

interface Part2QuestionData {
  question: string;
  options: string[];
}

interface Part5QuestionData {
  sentence: string;
  options: string[];
}

/**
 * Generate questions text for Part 1/7 (passage-based questions)
 */
export const generateQuestionsText = (currentPassage: Passage | null): string => {
  if (!currentPassage) return "";

  let text = "";

  // Part 1の場合は指示文を省略
  if (currentPassage.toeicPart !== 'part1') {
    text = `Questions 1-${currentPassage.questions.length} refer to the following ${currentPassage.type}.\n\n`;
  }

  currentPassage.questions.forEach((question, index) => {
    text += `${index + 1}. ${question.question}\n`;
    question.options.forEach((option, optionIndex) => {
      text += `(${String.fromCharCode(65 + optionIndex)}) ${option}\n`;
    });
    text += "\n";
  });

  return text;
};

/**
 * Generate Part 2 question text
 */
export const generatePart2QuestionsText = (currentPart2Question: Part2QuestionData | null): string => {
  if (!currentPart2Question) return "";

  let text = `${currentPart2Question.question}\n`;
  currentPart2Question.options.forEach((option, optionIndex) => {
    text += `(${String.fromCharCode(65 + optionIndex)}) ${option}\n`;
  });

  return text;
};

/**
 * Generate Part 3 questions text
 */
export const generatePart3QuestionsText = (currentPart3Question: Part3Question | null): string => {
  if (!currentPart3Question) return "";

  let text = "";
  currentPart3Question.questions.forEach((question, qIndex) => {
    text += `${qIndex + 1}. ${question.question}\n`;
    question.options.forEach((option, optionIndex) => {
      text += `(${String.fromCharCode(65 + optionIndex)}) ${option}\n`;
    });
    text += "\n";
  });

  return text;
};

/**
 * Generate Part 3 conversation text with speaker names
 */
export const generatePart3ConversationText = (currentPart3Question: Part3Question | null): string => {
  if (!currentPart3Question) return "";

  let text = "";
  currentPart3Question.conversation.forEach((turn) => {
    const speaker = currentPart3Question.speakers.find(s => s.id === turn.speaker);
    const speakerName = speaker?.name || turn.speaker;
    text += `${speakerName}: ${turn.text}\n`;
  });

  return text;
};

/**
 * Generate Part 4 speech text
 */
export const generatePart4SpeechText = (currentPart4Question: Part4Question | null): string => {
  if (!currentPart4Question) return "";
  return currentPart4Question.text;
};

/**
 * Generate Part 4 questions text
 */
export const generatePart4QuestionsText = (currentPart4Question: Part4Question | null): string => {
  if (!currentPart4Question) return "";

  let text = "";
  currentPart4Question.questions.forEach((question, qIndex) => {
    text += `${qIndex + 1}. ${question.question}\n`;
    question.options.forEach((option, optionIndex) => {
      text += `(${String.fromCharCode(65 + optionIndex)}) ${option}\n`;
    });
    text += "\n";
  });

  return text;
};

/**
 * Generate Part 5 question text
 */
export const generatePart5QuestionsText = (currentPart5Question: Part5QuestionData | null): string => {
  if (!currentPart5Question) return "";

  let text = `1. ${currentPart5Question.sentence}\n`;
  currentPart5Question.options.forEach((option, optionIndex) => {
    text += `(${String.fromCharCode(65 + optionIndex)}) ${option}\n`;
  });

  return text;
};

/**
 * Generate generic content text from passage
 */
export const generateContentText = (currentPassage: Passage | null): string => {
  if (!currentPassage) return "";
  return currentPassage.content || "";
};

/**
 * Generate instruction text for multiple document passages
 */
export const generateMultipleDocumentsInstruction = (currentPassage: Passage | null): string => {
  if (!currentPassage || !currentPassage.documents) return "";

  const docTypes = currentPassage.documents.map(doc => doc.type).join(" and ");
  return `Questions 1-${currentPassage.questions.length} refer to the following ${docTypes}.`;
};
