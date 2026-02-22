"use client";

import { Copy, Volume2, VolumeX } from "lucide-react";
import { Part3Question } from "@/lib/types";
import { generatePart3ConversationText, generatePart3QuestionsText } from "@/utils/textGenerators";
import { PART3_VOICE_VOLUME_MAP, DEFAULT_PART3_VOLUME } from "@/lib/audio-constants";
import { useLanguage } from "@/contexts/LanguageContext";

interface Part3ResultsProps {
  question: Part3Question;
  selectedAnswers: { [key: string]: string };
  showResults: boolean;
  showTranslation: boolean;
  isSpeaking: boolean;
  onPlayAudio: () => void;
  onAnswer: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  onCopy: (text: string, type: string) => void;
}

export function Part3Results({
  question,
  selectedAnswers,
  showResults,
  showTranslation,
  isSpeaking,
  onPlayAudio,
  onAnswer,
  onSubmit,
  onCopy,
}: Part3ResultsProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* 話者情報セクション */}
      {question.speakers && question.speakers.some(s => s.voiceProfile) && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('misc.speakerInfo')}</h3>
          <div className="flex flex-wrap gap-4">
            {question.speakers.map((speaker) => {
              const voiceId = speaker.voiceProfile?.voiceId;
              const volumeLevel = voiceId ? (PART3_VOICE_VOLUME_MAP[voiceId] || DEFAULT_PART3_VOLUME) : DEFAULT_PART3_VOLUME;

              return (
                <div key={speaker.id} className="flex flex-col gap-1 text-sm bg-white p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{speaker.name}:</span>
                    {speaker.voiceProfile && (
                      <>
                        <span className="text-gray-600">{speaker.voiceProfile.country}</span>
                        <span className="text-gray-600">{speaker.voiceProfile.accent} English</span>
                        <span className="text-gray-500">({speaker.voiceProfile.gender})</span>
                      </>
                    )}
                  </div>
                  {voiceId && (
                    <div className="text-xs text-gray-500 font-mono">
                      <span>Voice ID: {voiceId}</span>
                      <span className="ml-3">Volume: {(volumeLevel * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Part 3 会話セクション */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">会話</h2>
          <div className="flex gap-2">
            {/* 会話コピーボタン */}
            <button
              onClick={() => onCopy(generatePart3ConversationText(question), "会話")}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={t('audio.copyConversation')}
            >
              <Copy size={18} />
            </button>
            {/* 音声再生ボタン */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPlayAudio();
              }}
              className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all ${
                isSpeaking
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              title={isSpeaking ? "音声を停止" : "会話を聞く"}
            >
              {isSpeaking ? <VolumeX size={20} className="mr-2" /> : <Volume2 size={20} className="mr-2" />}
              {isSpeaking ? "停止" : "会話を聞く"}
            </button>
          </div>
        </div>

        {/* 会話内容 */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          {question.conversation.map((turn, index) => {
            const speaker = question.speakers.find(s => s.id === turn.speaker);
            return (
              <div key={index} className="flex">
                <span className="font-semibold mr-2 text-gray-700 min-w-[80px]">
                  {speaker?.name || turn.speaker}:
                </span>
                <div className="flex-1">
                  <div className="text-black text-lg leading-relaxed">{turn.text}</div>
                  {showTranslation && turn.translation && (
                    <div className="mt-1 p-2 bg-blue-50 rounded text-black">{turn.translation}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Part 3 問題セクション */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">問題</h2>
          <button
            onClick={() => onCopy(generatePart3QuestionsText(question), "問題文")}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('misc.copyQuestion')}
          >
            <Copy size={18} />
          </button>
        </div>
        <div className="space-y-6">
          {question.questions.map((q, qIndex) => (
            <div key={q.id} className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium mb-3 text-black flex">
                <span className="flex-shrink-0 mr-2">{qIndex + 1}.</span>
                <span className="whitespace-pre-wrap">{q.question}</span>
              </h3>

              {showTranslation && q.questionTranslation && (
                <div className="mb-3 p-3 bg-blue-50 rounded text-black whitespace-pre-wrap">
                  {q.questionTranslation}
                </div>
              )}

              <div className="space-y-2">
                {q.options.map((option, optionIndex) => {
                  const optionLetter = String.fromCharCode(65 + optionIndex);
                  const isSelected = selectedAnswers[q.id] === optionLetter;
                  const isCorrect = q.correct === option;

                  return (
                    <div
                      key={optionIndex}
                      onClick={() => {
                        if (!showResults) {
                          onAnswer(q.id, optionLetter);
                        }
                      }}
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
                      } ${!showResults ? "cursor-pointer hover:border-gray-300" : "cursor-default"}`}
                    >
                      <span className="flex-1 text-black flex text-lg">
                        <span className="flex-shrink-0 mr-2 font-medium">({optionLetter})</span>
                        <span className="whitespace-pre-wrap">{option}</span>
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 選択肢翻訳 */}
              {showTranslation && q.optionTranslations && q.optionTranslations.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <div className="space-y-1">
                    {q.optionTranslations.map((translation, optionIndex) => (
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
                    const selectedLetter = selectedAnswers[q.id];
                    const selectedIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
                    const selectedOption = selectedIndex >= 0 && selectedIndex < q.options.length
                      ? q.options[selectedIndex]
                      : null;

                    let isCorrectAnswer = false;
                    if (q.correct.length === 1 && /^[A-D]$/.test(q.correct)) {
                      isCorrectAnswer = selectedLetter === q.correct;
                    } else {
                      isCorrectAnswer = selectedOption === q.correct;
                    }

                    let correctLetter = '?';
                    if (q.correct.length === 1 && /^[A-D]$/.test(q.correct)) {
                      correctLetter = q.correct;
                    } else {
                      const correctIndex = q.options.findIndex(option => option === q.correct);
                      if (correctIndex >= 0) {
                        correctLetter = String.fromCharCode(65 + correctIndex);
                      }
                    }

                    return isCorrectAnswer ? (
                      <div className="bg-green-100 text-green-800 p-2 rounded">{t('result.answerCorrect')}</div>
                    ) : (
                      <div className="bg-red-100 text-red-800 p-2 rounded">{t('result.answerIncorrect', { answer: correctLetter })}</div>
                    );
                  })()}
                  {q.explanation && (
                    <div className="mt-2 text-black whitespace-pre-wrap">
                      {q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 回答ボタン */}
        {!showResults && (
          <div className="mt-6 text-center">
            <button
              onClick={onSubmit}
              className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              回答を見る
            </button>
          </div>
        )}
      </div>
    </>
  );
}
