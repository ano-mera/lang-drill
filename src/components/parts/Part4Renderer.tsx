"use client";

import { Copy, Volume2, Play, Pause, Square, SkipBack, SkipForward } from "lucide-react";
import { Part4Question } from "@/lib/types";
import { generatePart4SpeechText, generatePart4QuestionsText } from "@/utils/textGenerators";
import { PART3_VOICE_VOLUME_MAP, DEFAULT_PART3_VOLUME } from "@/lib/audio-constants";
import { useLanguage } from "@/contexts/LanguageContext";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface Part4ResultsProps {
  question: Part4Question;
  selectedAnswers: { [key: string]: string };
  showResults: boolean;
  showTranslation: boolean;
  isSpeaking: boolean;
  isPlayingPart4: boolean;
  isPausedPart4: boolean;
  part4CurrentTime: number;
  part4Duration: number;
  onPlayPart4Audio: (audioPath: string) => void;
  onPausePart4Audio: () => void;
  onStopPart4Audio: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onSeek: (time: number) => void;
  onButtonAction: (action: () => void, label: string) => void;
  onCopy: (text: string, type: string) => void;
}

export function Part4Results({
  question,
  selectedAnswers,
  showResults,
  showTranslation,
  isPlayingPart4,
  isPausedPart4,
  part4CurrentTime,
  part4Duration,
  onPlayPart4Audio,
  onPausePart4Audio,
  onStopPart4Audio,
  onSkipBackward,
  onSkipForward,
  onSeek,
  onButtonAction,
  onCopy,
}: Part4ResultsProps) {
  const { t } = useLanguage();

  return (
    <>
      <div className="mb-4">
        <div className="text-black mb-4 font-medium text-lg">
          <span className="font-bold">Part 4 | スピーチ問題</span>
          <span
            className="text-gray-400 text-sm ml-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onCopy(question.id, "Part 4 ID")}
            title={t('misc.clickToCopyId', { type: '' })}
          >ID: {question.id}</span>
        </div>
      </div>

      <div className="border-t border-gray-300 my-6"></div>

      {/* 話者情報セクション */}
      {question.speaker && question.speaker.voiceProfile && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('misc.speakerInfo')}</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1 text-sm bg-white p-2 rounded border">
              <div className="flex items-center gap-2">
                <span className="font-medium">{question.speaker.name}:</span>
                <span className="text-gray-600">{question.speaker.voiceProfile.country}</span>
                <span className="text-gray-600">{question.speaker.voiceProfile.accent} English</span>
                <span className="text-gray-500">({question.speaker.voiceProfile.gender})</span>
              </div>
              <div className="text-xs text-gray-500 font-mono">
                <span>Voice ID: {question.speaker.voiceProfile.voiceId}</span>
                <span className="ml-3">Volume: {((PART3_VOICE_VOLUME_MAP[question.speaker.voiceProfile.voiceId] || DEFAULT_PART3_VOLUME) * 100).toFixed(0)}%</span>
                <span className="ml-3">Role: {question.speaker.role}</span>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* スピーチセクション */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold text-gray-800">スピーチ</h3>
          <button
            onClick={() => onCopy(generatePart4SpeechText(question), "スピーチ")}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('audio.copySpeech')}
          >
            <Copy size={18} />
          </button>
        </div>

        {/* スピーチ音声制御ボタン */}
        <div className="mb-6">
          {question.audioFiles?.speech?.audioPath && (
            <div className="space-y-4">
              <div className="flex justify-center items-center gap-4">
                {/* 再生/再開ボタン */}
                {!isPlayingPart4 && (
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onButtonAction(
                        () => onPlayPart4Audio(question.audioFiles!.speech!.audioPath!),
                        isPausedPart4 ? '再開' : '再生'
                      );
                    }}
                    className="flex items-center justify-center px-8 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-105 shadow-lg bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200 touch-none"
                    title={isPausedPart4 ? "スピーチを再開" : "スピーチを再生"}
                  >
                    {isPausedPart4 ? (
                      <>
                        <Play size={24} className="mr-2" />
                        再開
                      </>
                    ) : (
                      <>
                        <Volume2 size={24} className="mr-2" />
                        スピーチを聞く
                      </>
                    )}
                  </button>
                )}

                {/* 一時停止ボタン */}
                {isPlayingPart4 && (
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onButtonAction(onPausePart4Audio, '一時停止');
                    }}
                    className="flex items-center justify-center px-8 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-105 shadow-lg bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200 touch-none"
                    title={t('audio.pause')}
                  >
                    <Pause size={24} className="mr-2" />
                    {t('audio.pause')}
                  </button>
                )}

                {/* 停止ボタン */}
                {(isPlayingPart4 || isPausedPart4) && (
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onButtonAction(onStopPart4Audio, '停止');
                    }}
                    className="flex items-center justify-center px-6 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-105 shadow-lg bg-red-500 text-white hover:bg-red-600 shadow-red-200 touch-none"
                    title={t('audio.stop')}
                  >
                    <Square size={20} className="mr-2" />
                    停止
                  </button>
                )}
              </div>

              {/* スライダーコントロール */}
              {(part4Duration > 0 || isPlayingPart4 || isPausedPart4) && (
                <div className="w-full bg-gray-100 p-4 rounded-lg space-y-3">
                  {/* スキップボタン */}
                  <div className="flex justify-center items-center gap-4">
                    <button
                      onPointerDown={(e) => {
                        e.preventDefault();
                        onButtonAction(onSkipBackward, '5秒戻る');
                      }}
                      className="flex items-center justify-center px-6 py-4 md:px-4 md:py-3 rounded-lg bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 transition-all hover:scale-105 active:scale-95 touch-none select-none"
                      title={t('audio.back5')}
                      type="button"
                      aria-label={t('audio.back5')}
                    >
                      <SkipBack size={28} className="md:w-6 md:h-6" />
                    </button>
                    <button
                      onPointerDown={(e) => {
                        e.preventDefault();
                        onButtonAction(onSkipForward, '5秒進む');
                      }}
                      className="flex items-center justify-center px-6 py-4 md:px-4 md:py-3 rounded-lg bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 transition-all hover:scale-105 active:scale-95 touch-none select-none"
                      title={t('audio.forward5')}
                      type="button"
                      aria-label={t('audio.forward5')}
                    >
                      <SkipForward size={28} className="md:w-6 md:h-6" />
                    </button>
                  </div>

                  {/* スライダー */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 min-w-[45px]">
                      {formatTime(part4CurrentTime)}
                    </span>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min="0"
                        max={part4Duration || 100}
                        value={part4CurrentTime}
                        onChange={(e) => onSeek(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider-thumb"
                        style={{
                          background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(part4CurrentTime / (part4Duration || 100)) * 100}%, #D1D5DB ${(part4CurrentTime / (part4Duration || 100)) * 100}%, #D1D5DB 100%)`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 min-w-[45px]">
                      {formatTime(part4Duration)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* スピーチ内容 */}
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="text-black text-lg leading-relaxed whitespace-pre-wrap">
            {question.text}
          </div>

          {/* 翻訳表示 */}
          {showTranslation && question.textTranslation && (
            <div className="mt-3 p-3 bg-blue-50 rounded text-black whitespace-pre-wrap">
              {question.textTranslation}
            </div>
          )}
        </div>
      </div>

      {/* 質問セクション */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">問題</h2>
          <button
            onClick={() => onCopy(generatePart4QuestionsText(question), "問題文")}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('misc.copyQuestion')}
          >
            <Copy size={18} />
          </button>
        </div>

        <div className="space-y-6">
          {question.questions.map((q, questionIndex) => (
            <div key={q.id} className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium mb-3 text-black flex">
              <span className="flex-shrink-0 mr-2">{questionIndex + 1}.</span>
              <span className="whitespace-pre-wrap">{q.question}</span>
            </h3>

            {/* 翻訳された質問文 */}
            {showTranslation && q.questionTranslation && (
              <div className="mb-3 p-3 bg-blue-50 rounded text-black whitespace-pre-wrap">
                {q.questionTranslation}
              </div>
            )}

            {/* 選択肢 */}
            <div className="space-y-2">
              {q.options.map((option, optionIndex) => {
                const letter = String.fromCharCode(65 + optionIndex);
                const isSelected = selectedAnswers[q.id] === letter;
                const isCorrect = option === q.correct;

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
                      <span className="flex-shrink-0 mr-2 font-medium">({letter})</span>
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

            {/* 結果表示 */}
            {showResults && (
              <div className="mt-3 p-3 rounded">
                {(() => {
                  const selectedLetter = selectedAnswers[q.id];
                  const selectedIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
                  const selectedOption = selectedIndex >= 0 && selectedIndex < q.options.length
                    ? q.options[selectedIndex]
                    : null;
                  const isCorrectAnswer = selectedOption === q.correct;
                  const correctIndex = q.options.findIndex(opt => opt === q.correct);
                  const correctLetter = correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : '';

                  if (isCorrectAnswer) {
                    return <div className="bg-green-100 text-green-800 p-2 rounded">{t('result.answerCorrect')}</div>;
                  } else {
                    return <div className="bg-red-100 text-red-800 p-2 rounded">{t('result.answerIncorrect', { answer: `(${correctLetter})` })}</div>;
                  }
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
      </div>
    </>
  );
}

interface Part4QuestionViewProps {
  question: Part4Question;
  selectedAnswers: { [key: string]: string };
  showTranslation: boolean;
  isPlayingPart4: boolean;
  isPausedPart4: boolean;
  part4CurrentTime: number;
  part4Duration: number;
  onPlayPart4Audio: (audioPath: string) => void;
  onPausePart4Audio: () => void;
  onStopPart4Audio: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onSeek: (time: number) => void;
  onButtonAction: (action: () => void, label: string) => void;
  onAnswer: (questionId: string, answer: string | null) => void;
  onCopy: (text: string, type: string) => void;
}

export function Part4QuestionView({
  question,
  selectedAnswers,
  showTranslation,
  isPlayingPart4,
  isPausedPart4,
  part4CurrentTime,
  part4Duration,
  onPlayPart4Audio,
  onPausePart4Audio,
  onStopPart4Audio,
  onSkipBackward,
  onSkipForward,
  onSeek,
  onButtonAction,
  onAnswer,
  onCopy,
}: Part4QuestionViewProps) {
  const { t } = useLanguage();

  return (
    <>
      <div className="mb-4">
        <div className="text-black mb-4 font-medium text-lg">
          <span className="font-bold">Part 4 | スピーチ問題</span>
          <span
            className="text-gray-400 text-sm ml-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onCopy(question.id, "Part 4 ID")}
            title={t('misc.clickToCopyId', { type: '' })}
          >ID: {question.id}</span>
        </div>
      </div>

      <div className="border-t border-gray-300 my-6"></div>

      {/* スピーチ音声再生ボタン */}
      <div className="mb-6">
        {question.audioFiles?.speech?.audioPath && (
          <div className="space-y-4">
            <div className="flex justify-center items-center gap-4">
              {/* 再生/再開ボタン */}
              {!isPlayingPart4 && (
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onButtonAction(
                      () => onPlayPart4Audio(question.audioFiles!.speech!.audioPath!),
                      isPausedPart4 ? '再開' : '再生'
                    );
                  }}
                  className="flex items-center justify-center px-8 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-105 shadow-lg bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200 touch-none"
                  title={isPausedPart4 ? "スピーチを再開" : "スピーチを再生"}
                >
                  {isPausedPart4 ? (
                    <>
                      <Play size={24} className="mr-2" />
                      再開
                    </>
                  ) : (
                    <>
                      <Volume2 size={24} className="mr-2" />
                      スピーチを聞く
                    </>
                  )}
                </button>
              )}

              {/* 一時停止ボタン */}
              {isPlayingPart4 && (
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onButtonAction(onPausePart4Audio, '一時停止');
                  }}
                  className="flex items-center justify-center px-8 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-105 shadow-lg bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200 touch-none"
                  title={t('audio.pause')}
                >
                  <Pause size={24} className="mr-2" />
                  一時停止
                </button>
              )}

              {/* 停止ボタン */}
              {(isPlayingPart4 || isPausedPart4) && (
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onButtonAction(onStopPart4Audio, '停止');
                  }}
                  className="flex items-center justify-center px-6 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-105 shadow-lg bg-red-500 text-white hover:bg-red-600 shadow-red-200 touch-none"
                  title={t('audio.stop')}
                >
                  <Square size={20} className="mr-2" />
                  停止
                </button>
              )}
            </div>

            {/* スライダーコントロール */}
            {(part4Duration > 0 || isPlayingPart4 || isPausedPart4) && (
              <div className="w-full bg-gray-100 p-4 rounded-lg space-y-3">
                {/* スキップボタン */}
                <div className="flex justify-center items-center gap-4">
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onButtonAction(onSkipBackward, '5秒戻る');
                    }}
                    className="flex items-center justify-center px-6 py-4 md:px-4 md:py-3 rounded-lg bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 transition-all hover:scale-105 active:scale-95 touch-none select-none"
                    title={t('audio.back5')}
                    type="button"
                    aria-label={t('audio.back5')}
                  >
                    <SkipBack size={28} className="md:w-6 md:h-6" />
                  </button>
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onButtonAction(onSkipForward, '5秒進む');
                    }}
                    className="flex items-center justify-center px-6 py-4 md:px-4 md:py-3 rounded-lg bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 transition-all hover:scale-105 active:scale-95 touch-none select-none"
                    title={t('audio.forward5')}
                    type="button"
                    aria-label={t('audio.forward5')}
                  >
                    <SkipForward size={28} className="md:w-6 md:h-6" />
                  </button>
                </div>

                {/* スライダー */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 min-w-[45px]">
                    {formatTime(part4CurrentTime)}
                  </span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max={part4Duration || 100}
                      value={part4CurrentTime}
                      onChange={(e) => onSeek(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(part4CurrentTime / (part4Duration || 100)) * 100}%, #D1D5DB ${(part4CurrentTime / (part4Duration || 100)) * 100}%, #D1D5DB 100%)`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 min-w-[45px]">
                    {formatTime(part4Duration)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3問の問題 */}
      <div className="space-y-8">
        {question.questions.map((q, qIndex) => (
          <div key={q.id} className="border-b border-gray-200 pb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-black flex">
                <span className="flex-shrink-0 mr-2">{qIndex + 1}.</span>
                <span className="whitespace-pre-wrap">{q.question}</span>
              </h3>
            </div>

            {/* 翻訳された質問文 */}
            {showTranslation && q.questionTranslation && (
              <div className="mb-4 p-3 bg-blue-50 rounded text-black whitespace-pre-wrap">
                {q.questionTranslation}
              </div>
            )}

            {/* 選択肢（A,B,C,D） */}
            <div className="space-y-2">
              {q.options.map((option, optionIndex) => {
                const optionLetter = String.fromCharCode(65 + optionIndex);
                const isSelected = selectedAnswers[q.id] === optionLetter;

                return (
                  <div
                    key={optionIndex}
                    onClick={() => {
                      if (isSelected) {
                        onAnswer(q.id, null);
                      } else {
                        onAnswer(q.id, optionLetter);
                      }
                    }}
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    } cursor-pointer hover:border-gray-300`}
                  >
                    <span className="flex-1 text-black flex text-lg">
                      <span className="flex-shrink-0 mr-2 font-medium">({optionLetter})</span>
                      <span className="whitespace-pre-wrap">{option}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
