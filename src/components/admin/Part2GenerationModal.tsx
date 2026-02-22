"use client";

import { useState } from "react";

interface Part2GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (difficulty: string, count: number, questionType?: string, topic?: string) => void;
  isGenerating: boolean;
}

export default function Part2GenerationModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: Part2GenerationModalProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [count, setCount] = useState(1);
  const [questionType, setQuestionType] = useState<string>('');
  const [topic, setTopic] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(difficulty, count, questionType || undefined, topic || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Part 2問題生成</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isGenerating}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* メイン設定：2列レイアウト */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value={6}>6</option>
                <option value={7}>7</option>
                <option value={8}>8</option>
                <option value={9}>9</option>
                <option value={10}>10</option>
              </select>
            </div>
          </div>

          {/* オプション設定：2列レイアウト */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                発話タイプ（オプション）
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              >
                <option value="">ランダム選択（重み付きあり）</option>
                <option value="yes_no_question">Yes/No疑問文</option>
                <option value="wh_question">WH疑問文</option>
                <option value="choice_question">選択疑問文</option>
                <option value="alternative_question">or疑問文</option>
                <option value="request_or_instruction">依頼・指示</option>
                <option value="indirect_question">間接疑問文</option>
                <option value="tag_question">付加疑問文</option>
                <option value="suggestion_or_offer">提案・申し出</option>
                <option value="statement_response">平叙文応答</option>
                <option value="greeting_or_farewell">あいさつ・別れ</option>
                <option value="thanks_or_apology">感謝・謝罪</option>
                <option value="compliment_or_emotion">感嘆・感情</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                トピック（オプション）
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              >
                <option value="">ランダム選択（重み付きあり）</option>
                <option value="オフィス・会議">オフィス・会議</option>
                <option value="予定・スケジュール">予定・スケジュール</option>
                <option value="顧客サービス">顧客サービス</option>
                <option value="社内コミュニケーション">社内コミュニケーション</option>
                <option value="電話対応">電話対応</option>
                <option value="交通・移動">交通・移動</option>
                <option value="サービス・修理">サービス・修理</option>
                <option value="レストラン・食事">レストラン・食事</option>
                <option value="ショッピング">ショッピング</option>
                <option value="日常生活">日常生活</option>
              </select>
            </div>
          </div>

          {/* 説明セクション：2列レイアウト */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-green-800 mb-2">自動生成プロセス</h4>
              <ol className="text-xs text-green-700 space-y-1">
                <li>1. 発話タイプを選択（指定時は指定タイプ、未指定時は重み付きランダム）</li>
                <li>2. トピックを選択（指定時は指定トピック、未指定時は重み付きランダム）</li>
                <li>3. 質問文と3つの応答選択肢を生成</li>
                <li>4. 日本語翻訳を生成</li>
                <li>5. 音声ファイルを生成</li>
                <li>6. 問題を自動保存</li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Part 2の特徴</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 質問-応答形式（Question-Response）</li>
                <li>• 3択選択肢（A, B, C）</li>
                <li>• 音声のみ（テキスト表示なし）</li>
                <li>• 質問タイプ：WH疑問文、Yes/No疑問文、依頼表現等</li>
                <li>• トピック：ビジネス、電話対応、日常生活等</li>
              </ul>
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
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span className="text-sm text-yellow-800">Part 2問題を生成中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}