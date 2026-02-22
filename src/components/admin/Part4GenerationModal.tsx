"use client";

import { useState, useEffect } from "react";

interface Part4GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (difficulty: string, count: number, speechType?: string, industry?: string) => void;
  isGenerating: boolean;
}

interface Part4SpeechType {
  type: string;
  description: string;
  jp: string;
  weight: number;
}

interface Part4Industry {
  industry: string;
  description: string;
  jp: string;
  weight: number;
}

export default function Part4GenerationModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: Part4GenerationModalProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(1);
  const [speechType, setSpeechType] = useState('');
  const [industry, setIndustry] = useState('');
  const [speechTypes, setSpeechTypes] = useState<Part4SpeechType[]>([]);
  const [industries, setIndustries] = useState<Part4Industry[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // データキャッシュの管理
  const [dataCache, setDataCache] = useState<{
    speechTypes?: Part4SpeechType[];
    industries?: Part4Industry[];
    lastFetched?: number;
  }>({});

  const CACHE_DURATION = 5 * 60 * 1000; // 5分間キャッシュ

  // スピーチタイプと業種一覧を高速読み込み（キャッシュ付き）
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      
      // キャッシュが有効かチェック
      const now = Date.now();
      const isCacheValid = dataCache.lastFetched && 
                          dataCache.speechTypes && 
                          dataCache.industries &&
                          (now - dataCache.lastFetched) < CACHE_DURATION;
      
      if (isCacheValid) {
        // キャッシュからデータを使用
        setSpeechTypes(dataCache.speechTypes!);
        setIndustries(dataCache.industries!);
        return;
      }
      
      setLoadingData(true);
      try {
        // 一括データ取得（高速化）
        const response = await fetch('/api/part4-questions?action=modal-data');
        const data = await response.json();
        
        if (data.success) {
          setSpeechTypes(data.speechTypes);
          setIndustries(data.industries);
          
          // キャッシュに保存
          setDataCache({
            speechTypes: data.speechTypes,
            industries: data.industries,
            lastFetched: now
          });
        } else {
          console.error('Failed to load modal data:', data.error);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [isOpen, dataCache.lastFetched, dataCache.speechTypes, dataCache.industries, CACHE_DURATION]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(difficulty, count, speechType || undefined, industry || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Part 4問題生成</h2>
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
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating}
              >
                <option value="easy">Easy（基本）</option>
                <option value="medium">Medium（標準）</option>
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
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
                <option value={7}>7</option>
                <option value={8}>8</option>
                <option value={9}>9</option>
                <option value={10}>10</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                スピーチタイプ（任意）
              </label>
              <select
                value={speechType}
                onChange={(e) => setSpeechType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating || loadingData}
              >
                <option value="">ランダム選択</option>
                {speechTypes.map((type) => (
                  <option key={type.type} value={type.type}>
                    {type.jp} ({type.description})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                業種（任意）
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating || loadingData}
              >
                <option value="">ランダム選択</option>
                {industries.map((ind) => (
                  <option key={ind.industry} value={ind.industry}>
                    {ind.jp} ({ind.description})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Part 4の特徴説明 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Part 4の特徴</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>モノローグ形式</strong>：1人の話者による連続したスピーチ</p>
              <p>• <strong>スピーチタイプ</strong>：企業アナウンス、イベント案内、ガイドなど20種類</p>
              <p>• <strong>問題構成</strong>：各スピーチに対して3問の理解問題</p>
              <p>• <strong>音声時間</strong>：30-60秒程度のスピーチ</p>
            </div>
          </div>

          {/* 生成情報 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">生成される内容</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• スピーチ内容（英語・日本語翻訳）</p>
              <p>• 3問の理解問題（選択肢4個・解説付き）</p>
              <p>• 音声ファイル（スピーチ + 各問題）</p>
              <p>• 話者情報（性別・音声プロファイル）</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              disabled={isGenerating}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isGenerating || loadingData}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>生成中...</span>
                </>
              ) : (
                <span>生成開始</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}