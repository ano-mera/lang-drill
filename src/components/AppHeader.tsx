"use client";

import { GameSettings } from "@/utils/gameSettings";
import { useLanguage } from "@/contexts/LanguageContext";

interface AppHeaderProps {
  onShowSplash?: () => void;
  timeLeft: number | null;
  consecutiveCorrect: number;
  targetAchieved: boolean;
  gameSettings: GameSettings;
  onOpenSettings: () => void;
  onShowStats: () => void;
  onNext: () => void;
}

export default function AppHeader({
  onShowSplash,
  timeLeft,
  consecutiveCorrect,
  targetAchieved,
  gameSettings,
  onOpenSettings,
  onShowStats,
  onNext,
}: AppHeaderProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="mb-6 flex justify-between items-center h-10">
      <button onClick={onShowSplash} className="flex items-center gap-2 hover:opacity-70 transition-opacity ml-6 h-10">
        <img src="/icon-192x192.png" alt="LangDrill" className="h-10 w-auto rounded" />
        <span className="text-[24px] hidden sm:inline"><span className="font-bold">Lang</span><span className="font-light">Drill</span></span>
      </button>
      <div className="flex items-center gap-2 h-10">
        {/* タイマー表示 */}
        {timeLeft !== null && (
          <div className="h-10 flex items-center px-3 bg-orange-100 text-orange-800 rounded font-mono text-sm">
            {t('header.timer', { seconds: timeLeft })}
          </div>
        )}

        {/* 連続正答数表示、目標達成通知 */}
        {targetAchieved ? (
          <div className="h-10 flex items-center text-lg font-bold text-green-600 bg-green-100 px-4 rounded-lg border-2 border-green-500 animate-pulse">
            🎉 {t('header.consecutiveAchieved', { count: gameSettings.targetConsecutive })} 🎉
          </div>
        ) : (
          <div className="h-10 flex items-center px-3 bg-blue-100 text-blue-800 rounded text-sm">
            {consecutiveCorrect}/{gameSettings.targetConsecutive}
          </div>
        )}

        <button
          onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
          className="h-10 px-3 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm font-bold"
          title={language === 'ja' ? 'Switch to English' : '日本語に切り替え'}
        >
          {language === 'ja' ? 'EN' : 'JA'}
        </button>
        <button onClick={onShowStats} className="h-10 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm" title={t('header.stats')}>
          📊
        </button>
        <button onClick={onOpenSettings} className="h-10 px-3 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm" title={t('header.settings')}>
          ⚙️
        </button>
        <button onClick={onNext} className="h-10 px-4 bg-green-500 text-white rounded hover:bg-green-600">
          Next
        </button>
      </div>
    </div>
  );
}
