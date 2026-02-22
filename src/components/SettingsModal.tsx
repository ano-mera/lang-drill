"use client";

import { TOEICPart } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface SettingsModalProps {
  showSettings: boolean;
  tempToeicPart: TOEICPart;
  tempDifficulty: 'all' | 'easy' | 'medium' | 'hard';
  tempAudioVolume: number;
  passageIdInput: string;
  tempAnswerTime: number;
  tempTargetConsecutive: number;
  tempNextButtonBehavior: 'random' | 'sequential';
  errorMessage: string;
  onSetTempToeicPart: (value: TOEICPart) => void;
  onSetTempDifficulty: (value: 'all' | 'easy' | 'medium' | 'hard') => void;
  onSetTempAudioVolume: (value: number) => void;
  onSetPassageIdInput: (value: string) => void;
  onSetTempAnswerTime: (value: number) => void;
  onSetTempTargetConsecutive: (value: number) => void;
  onSetTempNextButtonBehavior: (value: 'random' | 'sequential') => void;
  onClose: () => void;
  onApply: () => void;
}

export default function SettingsModal({
  showSettings,
  tempToeicPart,
  tempDifficulty,
  tempAudioVolume,
  passageIdInput,
  tempAnswerTime,
  tempTargetConsecutive,
  tempNextButtonBehavior,
  errorMessage,
  onSetTempToeicPart,
  onSetTempDifficulty,
  onSetTempAudioVolume,
  onSetPassageIdInput,
  onSetTempAnswerTime,
  onSetTempTargetConsecutive,
  onSetTempNextButtonBehavior,
  onClose,
  onApply,
}: SettingsModalProps) {
  const { language, setLanguage, t } = useLanguage();

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">{t('settings.title')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl" title={t('settings.close')}>
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3">
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            TOEIC Part
          </label>
          <select
            value={tempToeicPart}
            onChange={(e) => onSetTempToeicPart(e.target.value as TOEICPart)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="part0">{t('part.0')}</option>
            <option value="part1">{t('part.1')}</option>
            <option value="part2">{t('part.2')}</option>
            <option value="part3">{t('part.3')}</option>
            <option value="part4">{t('part.4')}</option>
            <option value="part5">{t('part.5')}</option>
            <option value="part6">{t('part.6')}</option>
            <option value="part7_single_text">{t('part.7st')}</option>
            <option value="part7_single_chart">{t('part.7sc')}</option>
            <option value="part7_double">{t('part.7d')}</option>
          </select>
        </div>


        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('settings.difficulty')}
          </label>
          <select
            value={tempDifficulty}
            onChange={(e) => onSetTempDifficulty(e.target.value as 'all' | 'easy' | 'medium' | 'hard')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('settings.difficultyAll')}</option>
            <option value="easy">{t('settings.difficultyEasy')}</option>
            <option value="medium">{t('settings.difficultyMedium')}</option>
            <option value="hard">{t('settings.difficultyHard')}</option>
          </select>
        </div>

        {(tempToeicPart === 'part1' || tempToeicPart === 'part2' || tempToeicPart === 'part3' || tempToeicPart === 'part4') && (
          <div className="mb-3">
            <label htmlFor="audioVolume" className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.audioVolume', { volume: tempAudioVolume })}
            </label>
            <input
              type="range"
              id="audioVolume"
              min="0"
              max="100"
              step="5"
              value={tempAudioVolume}
              onChange={(e) => onSetTempAudioVolume(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="passageId" className="block text-sm font-medium text-gray-700 mb-1">
            {t('settings.questionId')}
          </label>
          <input
            type="text"
            id="passageId"
            value={passageIdInput}
            onChange={(e) => onSetPassageIdInput(e.target.value)}
            placeholder={t('settings.questionIdPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                onApply();
              }
            }}
          />
          {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="answerTime" className="block text-sm font-medium text-gray-700 mb-1">
            {t('settings.answerTime')}
          </label>
          <input
            type="text"
            id="answerTime"
            inputMode="numeric"
            value={tempAnswerTime === 0 ? "" : tempAnswerTime}
            onChange={(e) => {
              const value = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
              onSetTempAnswerTime(value);
            }}
            placeholder={t('settings.answerTimePlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">{t('settings.answerTimeHint')}</p>
        </div>

        <div className="mb-4">
          <label htmlFor="targetConsecutive" className="block text-sm font-medium text-gray-700 mb-1">
            {t('settings.targetConsecutive')}
          </label>
          <input
            type="text"
            id="targetConsecutive"
            inputMode="numeric"
            value={tempTargetConsecutive}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              onSetTempTargetConsecutive(value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">{t('settings.targetConsecutiveHint')}</p>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('settings.nextButtonBehavior')}
          </label>
          <select
            value={tempNextButtonBehavior}
            onChange={(e) => onSetTempNextButtonBehavior(e.target.value as 'random' | 'sequential')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="random">{t('settings.nextButtonRandom')}</option>
            <option value="sequential">{t('settings.nextButtonSequential')}</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {tempNextButtonBehavior === 'random' ?
              t('settings.nextButtonRandomDesc') :
              t('settings.nextButtonSequentialDesc')}
          </p>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('settings.language')}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('ja')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                language === 'ja'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              日本語
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                language === 'en'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              English
            </button>
          </div>
        </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
            {t('settings.cancel')}
          </button>
          <button onClick={onApply} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
