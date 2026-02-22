"use client";

import { Copy, Volume2, VolumeX } from "lucide-react";
import { generatePart2QuestionsText } from "@/utils/textGenerators";
import { PART3_VOICE_VOLUME_MAP, DEFAULT_PART3_VOLUME, DEFAULT_PART2_VOLUME } from "@/lib/audio-constants";
import { useLanguage } from "@/contexts/LanguageContext";

interface Part2Question {
  id: string;
  question: string;
  questionTranslation: string;
  options: string[];
  optionTranslations: string[];
  correct: string;
  explanation: string;
  questionType: string;
  difficulty: string;
  topic: string;
  createdAt: string;
  generationBatch: string;
  voiceProfile?: {
    voiceId: string;
    gender: string;
    accent: string;
    country: string;
    age: string;
    tone: string;
  };
  audioFiles: {
    question: {
      text: string;
      audioPath: string | null;
    };
    options: Array<{
      option: string;
      text: string;
      audioPath: string | null;
      labelAudioPath: string;
    }>;
  };
}

interface Part2ResultsProps {
  question: Part2Question;
  selectedAnswers: { [key: string]: string };
  isSpeaking: boolean;
  onPlayAudio: () => void;
  onCopy: (text: string, type: string) => void;
}

export function Part2Results({
  question,
  selectedAnswers,
  isSpeaking,
  onPlayAudio,
  onCopy,
}: Part2ResultsProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Part 2の話者情報セクション */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('misc.speakerInfo')}</h3>
        <div className="flex flex-wrap gap-4">
          {question.voiceProfile ? (
            <div className="flex flex-col gap-1 text-sm bg-white p-2 rounded border">
              <div className="flex items-center gap-2">
                <span className="font-medium">Speaker:</span>
                <span className="text-gray-600">{question.voiceProfile.country} {question.voiceProfile.accent} English ({question.voiceProfile.gender})</span>
              </div>
              <div className="text-xs text-gray-500 font-mono">
                <span>Voice ID: {question.voiceProfile.voiceId}</span>
                <span className="ml-3">Volume: {((PART3_VOICE_VOLUME_MAP[question.voiceProfile.voiceId] || DEFAULT_PART3_VOLUME) * 100).toFixed(0)}%</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1 text-sm bg-white p-2 rounded border">
              <div className="flex items-center gap-2">
                <span className="font-medium">Speaker:</span>
                <span className="text-gray-600">{t('misc.speakerUnknown')}</span>
              </div>
              <div className="text-xs text-gray-500 font-mono">
                <span>Voice ID: {t('misc.voiceIdUnknown')}</span>
                <span className="ml-3">Volume: {(DEFAULT_PART2_VOLUME * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Part 2 問題文セクション */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{t('misc.questionText')}</h2>
          <button
            onClick={() => onCopy(generatePart2QuestionsText(question), "問題文")}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('misc.copyQuestion')}
          >
            <Copy size={18} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            {/* 音声ボタン */}
            <div className="flex justify-center mb-6">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPlayAudio();
                }}
                className={`flex items-center justify-center px-8 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-105 shadow-lg ${
                  isSpeaking
                    ? "bg-red-500 text-white hover:bg-red-600 shadow-red-200"
                    : "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200"
                }`}
                title={isSpeaking ? "音声読み上げを停止" : "問題を音声で聞く"}
              >
                {isSpeaking ? <VolumeX size={24} className="mr-2" /> : <Volume2 size={24} className="mr-2" />}
                {isSpeaking ? "停止" : "問題を聞く"}
              </button>
            </div>

            {/* 質問文 */}
            <div className="mb-4">
              <div className="text-black text-lg mb-2">{question.question}</div>
            </div>

            {/* 質問文翻訳 */}
            {question.questionTranslation && (
              <div className="mb-3 p-3 bg-blue-50 rounded text-black whitespace-pre-wrap">
                {question.questionTranslation}
              </div>
            )}

            {/* 選択肢 */}
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => {
                const optionLetter = String.fromCharCode(65 + optionIndex);
                return (
                  <div
                    key={optionIndex}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      selectedAnswers[question.id] === optionLetter
                        ? selectedAnswers[question.id] === question.correct
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"
                        : question.correct === optionLetter
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                    }`}
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
            {question.optionTranslations && question.optionTranslations.length > 0 && (
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
            <div className="mt-3 p-3 rounded">
              {(() => {
                const isCorrect = selectedAnswers[question.id] === question.correct;

                if (isCorrect) {
                  return <div className="bg-green-100 text-green-800 p-2 rounded">{t('result.answerCorrect')}</div>;
                } else {
                  const correctLetter = question.correct;
                  return <div className="bg-red-100 text-red-800 p-2 rounded">{t('result.answerIncorrect', { answer: correctLetter })}</div>;
                }
              })()}
              <div className="mt-2 text-black whitespace-pre-wrap">{question.explanation}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface Part2QuestionViewProps {
  question: Part2Question;
  selectedAnswers: { [key: string]: string };
  isSpeaking: boolean;
  onPlayAudio: () => void;
  onAnswer: (questionId: string, answer: string | null) => void;
  onCopy: (text: string, type: string) => void;
}

export function Part2QuestionView({
  question,
  selectedAnswers,
  isSpeaking,
  onPlayAudio,
  onAnswer,
  onCopy,
}: Part2QuestionViewProps) {
  const { t } = useLanguage();

  return (
    <>
      <div className="mb-4">
        <div className="text-black mb-4 font-medium text-lg">
          <span className="font-bold">Part 2 | 応答問題</span>
          <span
            className="text-gray-400 text-sm ml-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onCopy(question.id, "Part 2 ID")}
            title={t('misc.clickToCopyId', { type: '' })}
          >ID: {question.id}</span>
        </div>
      </div>

      <div className="border-t border-gray-300 my-6"></div>

      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          {/* Part 2: 音声再生ボタンのみ */}
          <div className="flex justify-center items-center mb-6">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPlayAudio();
              }}
              className={`flex items-center justify-center px-8 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-105 shadow-lg ${
                isSpeaking
                  ? "bg-red-500 text-white hover:bg-red-600 shadow-red-200"
                  : "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200"
              }`}
              title={isSpeaking ? "音声読み上げを停止" : "質問と選択肢を音声で聞く"}
            >
              {isSpeaking ? <VolumeX size={24} className="mr-2" /> : <Volume2 size={24} className="mr-2" />}
              {isSpeaking ? "停止" : "問題を聞く"}
            </button>
          </div>

          {/* Part 2: A/B/Cボタンのみ */}
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">音声で選択肢を聞いて、下のボタンから答えを選択してください</p>
            <div className="flex justify-center items-center gap-4">
              {['A', 'B', 'C'].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    const currentAnswer = selectedAnswers[question.id];
                    if (currentAnswer === option) {
                      onAnswer(question.id, null);
                    } else {
                      onAnswer(question.id, option);
                    }
                  }}
                  className={`h-16 w-16 rounded-full font-bold text-xl transition-all transform hover:scale-110 ${
                    selectedAnswers[question.id] === option
                      ? "bg-blue-500 text-white shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
