"use client";

import { Copy } from "lucide-react";
import { Part6Data } from "@/lib/types";
import { cleanText, cleanTranslationText } from "@/utils/textUtils";
import { useLanguage } from "@/contexts/LanguageContext";

interface Part6ResultsProps {
  question: Part6Data;
  selectedAnswers: { [key: string]: string };
  showResults: boolean;
  onCopy: (text: string, type: string) => void;
}

export function Part6Results({
  question,
  selectedAnswers,
  showResults,
  onCopy,
}: Part6ResultsProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* メタデータタグ */}
      <div className="mb-4">
        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2">
          {question.difficulty}
        </span>
        <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">
          Part 6
        </span>
        <span
          className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2 cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={() => onCopy(question.id, "Part 6 ID")}
          title={t('misc.clickToCopyId', { type: 'Part 6' })}
        >
          ID: {question.id}
        </span>
        <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">
          {question.documentType}
        </span>
        {question.topic && (
          <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">
            {question.topic}
          </span>
        )}
      </div>

      {/* Part 6 結果サマリー */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-center mb-4">
          <div className="text-gray-600">
            {(() => {
              const correctCount = question.questions.filter(q =>
                selectedAnswers[q.id] === q.correct
              ).length;
              return t('result.score', { total: question.questions.length, correct: correctCount });
            })()}
          </div>
        </div>
        <div className="flex justify-center space-x-2">
          {question.questions.map((q, index) => {
            const isCorrect = selectedAnswers[q.id] === q.correct;
            return (
              <div
                key={q.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}
                title={`Q${index + 1}: ${isCorrect ? t('result.correct') : t('result.incorrect')}`}
              >
                {isCorrect ? "✓" : "✗"}
              </div>
            );
          })}
        </div>
      </div>

      {/* Part 6 文書セクション */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">文書</h2>
          <button
            onClick={() => onCopy(
              `${question.title}\n\n${question.content}\n\n翻訳:\n${question.titleTranslation || ''}\n${question.contentTranslation}`,
              "Part 6 文書"
            )}
            className="text-gray-500 hover:text-blue-600 transition-colors"
            title={t('audio.copyDocument')}
          >
            <Copy size={18} />
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="whitespace-pre-wrap text-gray-800 text-lg leading-relaxed mb-4">
            {question.content.split(/(\(\d+\))/).map((part, index) => {
              const blankMatch = part.match(/^\((\d+)\)$/);
              if (blankMatch) {
                const blankNumber = parseInt(blankMatch[1]);
                return (
                  <span
                    key={index}
                    className="font-bold inline-block relative"
                    style={{
                      borderBottom: '1px solid currentColor',
                      paddingLeft: '1.2em',
                      paddingRight: '1.2em',
                      lineHeight: '1.1'
                    }}
                  >
                    {blankNumber}
                  </span>
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-black whitespace-pre-wrap p-4 bg-blue-50 rounded">
              {question.contentTranslation.split(/(\_{3}\d*\_{3})/).map((part, index) => {
                if (part.match(/^\_{3}\d*\_{3}$/)) {
                  return <span key={index} className="inline-block mx-1 px-1 bg-blue-200 text-blue-800 rounded text-xs font-medium">空欄</span>;
                }
                return <span key={index}>{part}</span>;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Part 6 問題文 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{t('misc.questionText')}</h2>
          <button
            onClick={() => {
              const questionsText = question.questions.map((q, index) => {
                const blankNumber = index + 1;
                const selectedAnswer = selectedAnswers[q.id];
                const isCorrect = selectedAnswer === q.correct;

                return `空欄${blankNumber} (${q.questionType}):
選択した回答: ${selectedAnswer || '未回答'}
正解: ${q.correct}
結果: ${isCorrect ? '正解' : '不正解'}

選択肢:
${q.options.map((opt, i) => `${['A', 'B', 'C', 'D'][i]}. ${opt}`).join('\n')}

解説: ${q.explanation}`;
              }).join('\n\n---\n\n');

              onCopy(questionsText, "Part 6 問題詳細");
            }}
            className="text-gray-500 hover:text-blue-600 transition-colors"
            title={t('audio.copyQuestionDetails')}
          >
            <Copy size={18} />
          </button>
        </div>

        <div className="space-y-0">
          {question.questions.map((q, questionIndex) => {
            const blankNumber = questionIndex + 1;
            const selectedAnswer = selectedAnswers[q.id];
            const isCorrect = selectedAnswer === q.correct;

            return (
              <div key={q.id} className={questionIndex > 0 ? "border-t border-gray-200 pt-6" : ""}>
                <div className="flex items-start space-x-4">
                  <span className="flex-shrink-0 text-lg font-bold text-black">{blankNumber}.</span>
                  <div className="flex-1">
                    {/* 選択肢 */}
                    <div className="space-y-2 mb-4">
                      {q.options.map((option, optionIndex) => {
                        const letter = ['A', 'B', 'C', 'D'][optionIndex];
                        const isSelectedAnswer = selectedAnswer === letter;
                        const isCorrectAnswer = q.correct === letter;

                        return (
                          <div
                            key={optionIndex}
                            className={`flex items-start space-x-3 p-3 rounded-lg border ${
                              isSelectedAnswer
                                ? isCorrectAnswer
                                  ? "border-green-500 bg-green-50"
                                  : "border-red-500 bg-red-50"
                                : isCorrectAnswer
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200"
                            }`}
                          >
                            <span className="flex-1 text-black flex text-lg">
                              <span className="flex-shrink-0 mr-2 font-medium">({letter})</span>
                              <span className="whitespace-pre-wrap">{cleanText(option)}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* 選択肢翻訳 */}
                    {q.optionTranslations && q.optionTranslations.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <div className="space-y-1">
                          {q.optionTranslations.map((translation, optionIndex) => (
                            <div key={optionIndex} className="text-black flex">
                              <span className="flex-shrink-0 mr-2">({['A', 'B', 'C', 'D'][optionIndex]})</span>
                              <span className="whitespace-pre-wrap">{cleanTranslationText(translation)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 正解/不正解のフィードバック */}
                    {showResults && (
                      <div className="mt-3 p-3 rounded">
                        {isCorrect ? (
                          <div className="bg-green-100 text-green-800 p-2 rounded">{t('result.answerCorrect')}</div>
                        ) : (
                          <div className="bg-red-100 text-red-800 p-2 rounded">{t('result.answerIncorrect', { answer: q.correct })}</div>
                        )}
                        <div className="mt-2 text-black whitespace-pre-wrap">{q.explanation}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

interface Part6QuestionViewProps {
  question: Part6Data;
  selectedAnswers: { [key: string]: string };
  onAnswer: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  onCopy: (text: string, type: string) => void;
}

export function Part6QuestionView({
  question,
  selectedAnswers,
  onAnswer,
  onSubmit,
  onCopy,
}: Part6QuestionViewProps) {
  const { t } = useLanguage();

  return (
    <>
      <div className="mb-4">
        <div className="text-black mb-4 font-medium text-lg">
          <span className="font-bold">{t('partLabel.6')}</span>
          <span
            className="text-gray-400 text-sm ml-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onCopy(question.id, "Part 6 ID")}
            title={t('misc.clickToCopyId', { type: '' })}
          >ID: {question.id}</span>
        </div>
      </div>

      <div className="border-t border-gray-300 my-6"></div>

      <div className="text-black mb-4 font-medium text-lg">
        <span><span className="font-bold">Questions 1-{question.questions?.length || 4}</span> refer to the following {question.documentType || 'document'}.</span>
      </div>

      {/* 文書内容（空欄付き） */}
      <div className="text-black border border-gray-300 rounded-lg p-4 bg-white text-lg leading-relaxed whitespace-pre-wrap mb-8">
        {question.content.split(/(\(\d+\))/).map((part, index) => {
          const blankMatch = part.match(/^\((\d+)\)$/);
          if (blankMatch) {
            const blankNumber = parseInt(blankMatch[1]);
            return (
              <span
                key={index}
                className="inline-block cursor-pointer hover:opacity-80"
                onClick={() => {
                  const element = document.getElementById(`question-${blankNumber}`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                title={`空欄${blankNumber}へジャンプ`}
              >
                <span
                  className="font-bold inline-block relative"
                  style={{
                    borderBottom: '1px solid currentColor',
                    paddingLeft: '1.2em',
                    paddingRight: '1.2em',
                    lineHeight: '1.1'
                  }}
                >
                  {blankNumber}
                </span>
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>

      {/* 各空欄の選択肢 */}
      <div className="space-y-8">
        {question.questions?.map((q, questionIndex) => {
          const blankNumber = questionIndex + 1;
          return (
            <div key={q.id} id={`question-${blankNumber}`} className="border-b border-gray-200 pb-6">
              <div className="flex items-start space-x-4">
                <span className="flex-shrink-0 text-lg font-bold text-black">{blankNumber}.</span>
                <div className="flex-1 space-y-2">
                  {q.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      onClick={() => {
                        const currentAnswer = selectedAnswers[q.id];
                        const newAnswer = String.fromCharCode(65 + optionIndex);
                        if (currentAnswer === newAnswer) {
                          onAnswer(q.id, "");
                        } else {
                          onAnswer(q.id, newAnswer);
                        }
                      }}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                        selectedAnswers[q.id] === String.fromCharCode(65 + optionIndex) ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      } cursor-pointer hover:border-gray-300`}
                    >
                      <span className="flex-1 text-black flex text-lg">
                        <span className="flex-shrink-0 mr-2 font-medium">({String.fromCharCode(65 + optionIndex)})</span>
                        <span className="whitespace-pre-wrap">{cleanText(option)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkボタン */}
      <div className="mt-8">
        <button onClick={onSubmit} className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600">
          Check
        </button>
      </div>
    </>
  );
}
