"use client";

import { useState } from "react";
import { PART1_ATTRIBUTES } from "../../../generator/lib/prompt-templates";

// PART1_ATTRIBUTES.environmentから環境リストを取得
const environmentOptions = Object.keys(PART1_ATTRIBUTES.environment);
const environmentLabels = PART1_ATTRIBUTES.environment;

// 利用可能な音声プロファイル
const VOICE_PROFILES = [
  // American English voices
  { voiceId: "EXAVITQu4vr4xnSDxMaL", gender: "female", accent: "American", country: "🇺🇸", name: "Sarah" },
  { voiceId: "21m00Tcm4TlvDq8ikWAM", gender: "female", accent: "American", country: "🇺🇸", name: "Rachel" },
  { voiceId: "jsCqWAovK2LkecY7zXl4", gender: "female", accent: "American", country: "🇺🇸", name: "Freya" },
  { voiceId: "z9fAnlkpzviPz146aGWa", gender: "female", accent: "American", country: "🇺🇸", name: "Glinda" },
  { voiceId: "pNInz6obpgDQGcFmaJgB", gender: "male", accent: "American", country: "🇺🇸", name: "Adam" },
  { voiceId: "VR6AewLTigWG4xSOukaG", gender: "male", accent: "American", country: "🇺🇸", name: "Arnold" },
  { voiceId: "5Q0t7uMcjvnagumLfvZi", gender: "male", accent: "American", country: "🇺🇸", name: "Paul" },
  { voiceId: "N2lVS1w4EtoT3dr4eOWO", gender: "male", accent: "American", country: "🇺🇸", name: "Callum" },
  
  // British English voices
  { voiceId: "ThT5KcBeYPX3keUQqHPh", gender: "female", accent: "British", country: "🇬🇧", name: "Dorothy" },
  { voiceId: "XB0fDUnXU5powFXDhCwa", gender: "female", accent: "British", country: "🇬🇧", name: "Charlotte" },
  { voiceId: "JBFqnCBsd6RMkjVDRZzb", gender: "male", accent: "British", country: "🇬🇧", name: "George" },
  
  // Canadian English voices
   { voiceId: "1EZBFEhLjqjzuG8HBNbj", gender: "female", accent: "Canadian", country: "🇨🇦", name: "Gabby" },
   { voiceId: "w4Z9gYJrajAuQmheNbVn", gender: "male", accent: "Canadian", country: "🇨🇦", name: "Haseeb" },
  
  // Australian English voices
  { voiceId: "p43fx6U8afP2xoq1Ai9f", gender: "female", accent: "Australian", country: "🇦🇺", name: "Emily" },
  { voiceId: "IKne3meq5aSn9XLyUdCD", gender: "male", accent: "Australian", country: "🇦🇺", name: "Charlie" },
];

interface Part1GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (difficulty: string, count: number, scene?: string, voiceProfile?: any, includePeople?: boolean) => void;
  isGenerating: boolean;
}

export default function Part1GenerationModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: Part1GenerationModalProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [count, setCount] = useState(1);
  const [scene, setScene] = useState<string>('');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [includePeopleOption, setIncludePeopleOption] = useState<'random' | 'with' | 'without'>('random');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVoiceProfile = selectedVoiceId ? VOICE_PROFILES.find(v => v.voiceId === selectedVoiceId) : undefined;
    const includePeople = includePeopleOption === 'random' ? undefined : includePeopleOption === 'with';
    console.log('Modal values:', { difficulty, count, scene, selectedVoiceProfile, includePeople });
    onGenerate(difficulty, count, scene || undefined, selectedVoiceProfile, includePeople);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Part 1問題生成</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isGenerating}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                難易度
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isGenerating}
              >
                <option value="easy">Easy（初級）</option>
                <option value="medium">Medium（中級）</option>
                <option value="hard">Hard（上級）</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                生成数
              </label>
              <select
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isGenerating}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                人物の有無
              </label>
              <select
                value={includePeopleOption}
                onChange={(e) => setIncludePeopleOption(e.target.value as 'random' | 'with' | 'without')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isGenerating}
              >
                <option value="random">ランダム（80:20）</option>
                <option value="with">人物あり</option>
                <option value="without">人物なし</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                シーン環境
              </label>
              <select
                value={scene}
                onChange={(e) => setScene(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isGenerating}
              >
                <option value="">ランダム選択</option>
                {environmentOptions.map((envKey, index) => (
                  <option key={index} value={envKey}>
                    {environmentLabels[envKey as keyof typeof environmentLabels] || envKey}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              話者音声
            </label>
            <select
              value={selectedVoiceId}
              onChange={(e) => setSelectedVoiceId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={isGenerating}
            >
              <option value="">ランダム選択</option>
              {VOICE_PROFILES.map((profile) => (
                <option key={profile.voiceId} value={profile.voiceId}>
                  {profile.country} {profile.name} ({profile.accent} {profile.gender})
                </option>
              ))}
            </select>
          </div>

          <details className="bg-blue-50 border border-blue-200 rounded-md">
            <summary className="cursor-pointer p-3 text-sm font-medium text-blue-800 hover:bg-blue-100">
              🔍 生成プロセスの詳細
            </summary>
            <div className="p-3 pt-0">
              <ol className="text-xs text-blue-700 space-y-1">
                <li>1. {scene ? `シーン「${environmentLabels[scene as keyof typeof environmentLabels] || scene}」` : `ランダムシーン`}で生成</li>
                <li>2. {selectedVoiceId ? `話者「${VOICE_PROFILES.find(v => v.voiceId === selectedVoiceId)?.name}」` : `ランダム話者`}を使用</li>
                <li>3. AIでシーン説明文を生成</li>
                <li>4. DALL-E 3で写真を生成</li>
                <li>5. 選択肢と日本語翻訳を生成</li>
                <li>6. 音声ファイルを生成・保存</li>
              </ol>
            </div>
          </details>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              disabled={isGenerating}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isGenerating}
            >
              {isGenerating ? '生成中...' : '生成開始'}
            </button>
          </div>
        </form>

        {isGenerating && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
              <span className="text-sm text-yellow-800">Part 1問題を生成中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}