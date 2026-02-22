"use client";

import { useState, useEffect } from "react";

interface Part3GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (difficulty: string, count: number, scenario?: string, industry?: string) => void;
  isGenerating: boolean;
}

interface Part3Scenario {
  scenario: string;
  description: string;
  jp: string;
  weight: number;
}

interface Part3Industry {
  industry: string;
  description: string;
  jp: string;
  weight: number;
}

export default function Part3GenerationModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: Part3GenerationModalProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(1);
  const [scenario, setScenario] = useState('');
  const [industry, setIndustry] = useState('');
  const [scenarios, setScenarios] = useState<Part3Scenario[]>([]);
  const [industries, setIndustries] = useState<Part3Industry[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);

  // シナリオと業種一覧を動的に読み込み
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      
      setLoadingScenarios(true);
      try {
        // シナリオを読み込み
        const scenariosResponse = await fetch('/api/part3-questions?action=scenarios');
        const scenariosData = await scenariosResponse.json();
        
        if (scenariosData.success) {
          setScenarios(scenariosData.scenarios);
        } else {
          console.error('Failed to load scenarios:', scenariosData.error);
        }

        // 業種を読み込み
        const industriesResponse = await fetch('/api/part3-questions?action=industries');
        const industriesData = await industriesResponse.json();
        
        if (industriesData.success) {
          setIndustries(industriesData.industries);
        } else {
          console.error('Failed to load industries:', industriesData.error);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingScenarios(false);
      }
    };

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(difficulty, count, scenario || undefined, industry || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Part 3問題生成</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                難易度
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              >
                <option value="easy">Easy（初級）</option>
                <option value="medium">Medium（中級）</option>
                <option value="hard">Hard（上級）</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                生成数
              </label>
              <select
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                シナリオ選択
              </label>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating || loadingScenarios}
              >
                <option value="">ランダム選択</option>
                {scenarios.map((s) => (
                  <option key={s.scenario} value={s.scenario}>
                    {s.jp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                業種選択
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating || loadingScenarios}
              >
                <option value="">ランダム選択</option>
                {industries.map((i) => (
                  <option key={i.industry} value={i.industry}>
                    {i.jp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 簡潔な情報セクション */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <strong>選択中：</strong>
                <br />シナリオ: {scenario ? scenarios.find(s => s.scenario === scenario)?.jp || 'ランダム' : 'ランダム'}
                <br />業種: {industry ? industries.find(i => i.industry === industry)?.jp || 'ランダム' : 'ランダム'}
              </div>
              <div>
                <strong>生成内容：</strong>
                <br />• 2-3名の会話形式
                <br />• 3問の理解問題（4択）
                <br />• 多国籍英語音声付き
              </div>
            </div>
          </div>

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
              className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span className="text-sm text-yellow-800">Part 3問題を生成中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}