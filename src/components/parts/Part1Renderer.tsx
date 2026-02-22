"use client";

import { Volume2, VolumeX } from "lucide-react";
import { PART3_VOICE_VOLUME_MAP, DEFAULT_PART3_VOLUME } from "@/lib/audio-constants";
import { useLanguage } from "@/contexts/LanguageContext";

interface Part1Question {
  id: string;
  question: string;
  questionTranslation: string;
  options: string[];
  optionTranslations: string[];
  correct: string;
  explanation: string;
  sceneDescription?: string;
  imagePath?: string;
  imagePrompt?: string;
  voiceProfile?: {
    voiceId: string;
    gender: string;
    accent: string;
    country: string;
    age: string;
    tone: string;
  };
  optionExplanations?: {
    [key: string]: {
      type: 'correct' | 'confusing' | 'unrelated';
      explanation?: string;
    };
  };
}

interface Part1ResultsProps {
  question: Part1Question;
  selectedAnswers: { [key: string]: string };
  isSpeaking: boolean;
  onPlayAudio: () => void;
  onCopy: (text: string, type: string) => void;
}

export function Part1Results({
  question,
  selectedAnswers,
  isSpeaking,
  onPlayAudio,
  onCopy,
}: Part1ResultsProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Part 1 結果表示 */}
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

      {/* Part 1話者情報セクション */}
      {question.voiceProfile && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('misc.speakerInfo')}</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1 text-sm bg-white p-2 rounded border">
              <div className="flex items-center gap-2">
                <span className="font-medium">Speaker:</span>
                <span className="text-gray-600">{question.voiceProfile.country}</span>
                <span className="text-gray-600">{question.voiceProfile.accent} English</span>
                <span className="text-gray-500">({question.voiceProfile.gender})</span>
              </div>
              <div className="text-xs text-gray-500 font-mono">
                <span>Voice ID: {question.voiceProfile.voiceId}</span>
                <span className="ml-3">Volume: {((PART3_VOICE_VOLUME_MAP[question.voiceProfile.voiceId] || DEFAULT_PART3_VOLUME) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="text-black mb-4 font-medium text-lg">
          <span className="font-bold">{t('partLabel.1')}</span>
          <span
            className="text-gray-400 text-sm ml-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onCopy(question.id, "Part 1 ID")}
            title={t('misc.clickToCopyId', { type: 'Part 1' })}
          >ID: {question.id}</span>
        </div>
      </div>

      <div className="border-t border-gray-300 my-6"></div>

      {/* 【Part 1画像表示 #1】Part 1独立クイズ - 結果画面 */}
      <div className="mb-6">
        {question.imagePath && (
          <div className="flex justify-center mb-4">
            <img
              src={question.imagePath}
              alt="TOEIC Part 1 scene"
              className="w-full h-auto max-w-md mx-auto rounded-lg shadow-md"
              style={{ aspectRatio: '1/1', objectFit: 'contain' }}
              onLoad={() => {
                console.log('✅ Part 1 image loaded successfully (結果画面):', question.imagePath);
              }}
              onError={() => {
                console.error('❌ Part 1 image failed to load (結果画面):', question.imagePath);
              }}
            />
          </div>
        )}
        {/* シーン説明文も表示 */}
        <div className="text-black border border-gray-300 rounded-lg p-4 bg-white text-lg leading-relaxed whitespace-pre-wrap">
          {question.sceneDescription || ""}
        </div>
      </div>

      {/* Part 1 音声再生ボタン（結果画面） */}
      <div className="flex justify-center items-center mb-6">
        <button
          onClick={(e) => {
            console.log('🎵 Audio button clicked in Part1 results screen');
            e.preventDefault();
            e.stopPropagation();
            onPlayAudio();
          }}
          className={`flex items-center justify-center px-8 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-105 shadow-lg ${
            isSpeaking
              ? "bg-red-500 text-white hover:bg-red-600 shadow-red-200"
              : "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200"
          }`}
          title={isSpeaking ? t('misc.stopAudio') : t('misc.listenOptions')}
        >
          {isSpeaking ? <VolumeX size={24} className="mr-2" /> : <Volume2 size={24} className="mr-2" />}
          {isSpeaking ? t('misc.stopAudio') : t('misc.listenOptions')}
        </button>
      </div>

      {/* Part 1 選択肢表示（結果画面） */}
      <div className="space-y-2 mb-6">
        {question.options.map((option: string, optionIndex: number) => {
          const optionLetter = String.fromCharCode(65 + optionIndex);
          const isSelected = selectedAnswers[question.id] === optionLetter;
          const isCorrect = question.correct === optionLetter;

          return (
            <div
              key={optionIndex}
              className={`flex items-start space-x-3 p-3 rounded-lg border ${
                isSelected
                  ? isCorrect
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                  : isCorrect
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

      {/* Part 1 選択肢翻訳 */}
      {question.optionTranslations && question.optionTranslations.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 rounded">
          <div className="space-y-1">
            {question.optionTranslations.map((translation: string, optionIndex: number) => (
              <div key={optionIndex} className="text-black flex">
                <span className="flex-shrink-0 mr-2">({String.fromCharCode(65 + optionIndex)})</span>
                <span className="whitespace-pre-wrap">{translation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Part 1 正答・解説表示 */}
      <div className="mt-3 p-3 rounded">
        {(() => {
          const isCorrect = selectedAnswers[question.id] === question.correct;

          if (isCorrect) {
            return <div className="bg-green-100 text-green-800 p-2 rounded">{t('result.answerCorrect')}</div>;
          } else {
            return <div className="bg-red-100 text-red-800 p-2 rounded">{t('result.answerIncorrect', { answer: question.correct })}</div>;
          }
        })()}
        {/* 個別解説表示 */}
        {question.optionExplanations ? (
          <div className="mt-3 space-y-2">
            {/* 解説付き選択肢を表示（紛らわしい選択肢、無関係選択肢のみ） */}
            {Object.entries(question.optionExplanations).some(([, data]: [string, any]) => ((data.type === 'confusing' || data.type === 'unrelated') && data.explanation)) && (
              <div className="mt-2">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const data = question.optionExplanations![option];
                  if (!data) return null;

                  if (data.type === 'correct') {
                    return null;
                  } else if ((data.type === 'confusing' || data.type === 'unrelated') && data.explanation) {
                    return (
                      <div key={option} className="mt-2 text-black whitespace-pre-wrap">
                        <span className="font-medium">
                          ({option})
                        </span> {data.explanation}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        ) : (
          // フォールバック: 従来の解説表示
          <div className="mt-2 text-black whitespace-pre-wrap">{question.explanation}</div>
        )}
      </div>

      {/* Part 1 画像生成プロンプト表示 */}
      {question.imagePrompt && (
        <div className="mt-3 p-3 bg-purple-50 rounded border">
          <div className="text-sm font-medium text-purple-700 mb-2">{t('misc.imagePrompt')}</div>
          <div className="text-purple-800 text-sm whitespace-pre-wrap">{question.imagePrompt}</div>
        </div>
      )}

      {/* @ai-hint: Next/Retryボタンは共通セクション（L6107-6136）で処理されるため、ここには追加不要 */}
      {/* @ai-hint: scoreはcalculateScore()のL2650-2665で計算される */}
    </>
  );
}

interface Part1QuestionViewProps {
  question: Part1Question;
  selectedAnswers: { [key: string]: string };
  isSpeaking: boolean;
  part1ImageLoading: boolean;
  part1ImageError: boolean;
  onPlayAudio: () => void;
  onAnswer: (questionId: string, answer: string | null) => void;
  onImageLoad: () => void;
  onImageError: () => void;
  onCopy: (text: string, type: string) => void;
}

export function Part1QuestionView({
  question,
  selectedAnswers,
  isSpeaking,
  part1ImageLoading,
  part1ImageError,
  onPlayAudio,
  onAnswer,
  onImageLoad,
  onImageError,
  onCopy,
}: Part1QuestionViewProps) {
  const { t } = useLanguage();

  return (
    <>
      <div className="mb-4">
        <div className="text-black mb-4 font-medium text-lg">
          <span className="font-bold">{t('partLabel.1')}</span>
          <span
            className="text-gray-400 text-sm ml-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onCopy(question.id, "Part 1 ID")}
            title={t('misc.clickToCopyId', { type: 'Part 1' })}
          >ID: {question.id}</span>
        </div>
      </div>

      <div className="border-t border-gray-300 my-6"></div>

      {/* 【Part 1画像表示 #4】Part 1独立クイズ - 出題中 */}
      <div className="mb-6">
        {question.imagePath && !part1ImageError ? (
          <div className="flex justify-center relative">
            {part1ImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg max-w-md mx-auto" style={{ aspectRatio: '1/1' }}>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-500">Loading image...</span>
                </div>
              </div>
            )}
            <img
              src={question.imagePath}
              alt="TOEIC Part 1 scene"
              className={`w-full h-auto max-w-md mx-auto rounded-lg shadow-md ${part1ImageLoading ? 'invisible' : ''}`}
              style={{ aspectRatio: '1/1', objectFit: 'contain' }}
              onLoad={() => {
                console.log('✅ Part 1 image loaded successfully (独立クイズ):', question.imagePath);
                onImageLoad();
              }}
              onError={() => {
                console.error('❌ Part 1 image failed to load (独立クイズ):', question.imagePath);
                onImageError();
              }}
            />
          </div>
        ) : (
          <div className="text-black border border-gray-300 rounded-lg p-4 bg-white text-lg leading-relaxed whitespace-pre-wrap">
            {question.sceneDescription || ""}
          </div>
        )}
      </div>

      {/* Part 1 音声再生ボタン */}
      <div className="flex justify-center items-center mb-6">
        <button
          onClick={(e) => {
            console.log('🎵 Audio button clicked in Part1 quiz screen');
            e.preventDefault();
            e.stopPropagation();
            onPlayAudio();
          }}
          className={`flex items-center justify-center px-8 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-105 shadow-lg ${
            isSpeaking
              ? "bg-red-500 text-white hover:bg-red-600 shadow-red-200"
              : "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200"
          }`}
          title={isSpeaking ? "音声読み上げを停止" : "選択肢を音声で読み上げ"}
        >
          {isSpeaking ? <VolumeX size={24} className="mr-2" /> : <Volume2 size={24} className="mr-2" />}
          {isSpeaking ? t('misc.stopAudio') : t('misc.listenOptions')}
        </button>
      </div>

      {/* Part 1 選択肢（A/B/C/Dボタンのみ） */}
      <div className="text-center py-8">
        <div className="flex justify-center items-center gap-4">
          {['A', 'B', 'C', 'D'].map((option) => (
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
    </>
  );
}
