"use client";

import { Copy } from "lucide-react";
import { cleanText } from "@/utils/textUtils";
import { generatePart5QuestionsText } from "@/utils/textGenerators";
import { useLanguage } from "@/contexts/LanguageContext";

interface Part5Question {
  id: string;
  sentence: string;
  question: string;
  questionTranslation: string;
  options: string[];
  optionTranslations: string[];
  correct: string;
  explanation: string;
  category: string;
  intent: string;
  length: string;
  vocabLevel: string;
  optionsType: string;
  difficulty: string;
  topic: string;
  createdAt: string;
  generationBatch: string;
  partType: string;
}

interface Part5ResultsProps {
  question: Part5Question;
  selectedAnswers: { [key: string]: string };
  showTranslation: boolean;
  showResults: boolean;
  onCopy: (text: string, type: string) => void;
}

export function Part5Results({
  question,
  selectedAnswers,
  showTranslation,
  showResults,
  onCopy,
}: Part5ResultsProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Part 5 結果サマリー */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-center mb-4">
          <div className="text-gray-600">
            {t('result.score', { total: 1, correct: selectedAnswers[question.id] === question.correct ? 1 : 0 })}
          </div>
        </div>
        <div className="flex justify-center space-x-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              selectedAnswers[question.id] === question.correct ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
            title={`Q1: ${selectedAnswers[question.id] === question.correct ? t('result.correct') : t('result.incorrect')}`}
          >
            {selectedAnswers[question.id] === question.correct ? "✓" : "✗"}
          </div>
        </div>
      </div>

      {/* Part 5 問題セクション */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">問題</h2>
          <button
            onClick={() => onCopy(generatePart5QuestionsText(question), "問題文")}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('misc.copyQuestion')}
          >
            <Copy size={18} />
          </button>
        </div>
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium mb-3 text-black flex">
              <span className="flex-shrink-0 mr-2">1.</span>
              <span className="whitespace-pre-wrap">{question.sentence}</span>
            </h3>

            {showTranslation && question.questionTranslation && (
              <div className="mb-3 p-3 bg-blue-50 rounded text-black whitespace-pre-wrap">
                {question.questionTranslation}
              </div>
            )}

            <div className="space-y-2">
              {question.options.map((option, optionIndex) => {
                const optionLetter = String.fromCharCode(65 + optionIndex);
                const isSelected = selectedAnswers[question.id] === optionLetter;
                const isCorrect = question.correct === optionLetter;

                return (
                  <div
                    key={optionIndex}
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                      showResults
                        ? isSelected
                          ? isCorrect
                            ? "border-green-500 bg-green-50"
                            : "border-red-500 bg-red-50"
                          : isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200"
                        : isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    } cursor-default`}
                  >
                    <span className="flex-1 text-black flex text-lg">
                      <span className="flex-shrink-0 mr-2 font-medium">({optionLetter})</span>
                      <span className="whitespace-pre-wrap">{cleanText(option)}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 選択肢翻訳 */}
            {showTranslation && question.optionTranslations && question.optionTranslations.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded">
                <div className="space-y-1">
                  {question.optionTranslations.map((translation, optionIndex) => (
                    <div key={optionIndex} className="text-black flex">
                      <span className="flex-shrink-0 mr-2">({String.fromCharCode(65 + optionIndex)})</span>
                      <span className="whitespace-pre-wrap">{translation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 正答・解説表示 */}
            {showResults && (
              <div className="mt-3 p-3 rounded">
                {(() => {
                  const selectedLetter = selectedAnswers[question.id];
                  const isCorrectAnswer = selectedLetter === question.correct;

                  return isCorrectAnswer
                    ? <div className="bg-green-100 text-green-800 p-2 rounded">{t('result.answerCorrect')}</div>
                    : <div className="bg-red-100 text-red-800 p-2 rounded">{t('result.answerIncorrect', { answer: question.correct })}</div>;
                })()}
                <div className="mt-2 text-black whitespace-pre-wrap">{question.explanation}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

interface Part5QuestionViewProps {
  question: Part5Question;
  selectedAnswers: { [key: string]: string };
  onAnswer: (questionId: string, answer: string | null) => void;
  onCopy: (text: string, type: string) => void;
}

export function Part5QuestionView({
  question,
  selectedAnswers,
  onAnswer,
  onCopy,
}: Part5QuestionViewProps) {
  const { t } = useLanguage();

  return (
    <>
      <div className="mb-4">
        <div className="text-black mb-4 font-medium text-lg">
          <span className="font-bold">Part 5 | 短文穴埋め問題</span>
          <span
            className="text-gray-400 text-sm ml-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onCopy(question.id, "Part 5 ID")}
            title={t('misc.clickToCopyId', { type: '' })}
          >ID: {question.id}</span>
        </div>
      </div>

      <div className="border-t border-gray-300 my-6"></div>

      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-medium mb-4 text-black flex">
          <span className="flex-shrink-0 mr-2">1.</span>
          <span className="whitespace-pre-wrap">{question.sentence}</span>
        </h3>

        {/* 選択肢の表示 */}
        <div className="space-y-2">
          {question.options.map((option, index) => {
            const letter = ['A', 'B', 'C', 'D'][index];
            const isSelected = selectedAnswers[question.id] === letter;

            return (
              <div
                key={index}
                onClick={() => {
                  if (isSelected) {
                    onAnswer(question.id, null);
                  } else {
                    onAnswer(question.id, letter);
                  }
                }}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                  isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                } cursor-pointer hover:border-gray-300`}
              >
                <span className="flex-1 text-black flex text-lg">
                  <span className="flex-shrink-0 mr-2 font-medium">({letter})</span>
                  <span className="whitespace-pre-wrap">{option}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
