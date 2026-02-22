"use client";

import { useState, useEffect } from "react";

interface Part6GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    difficulty: string,
    count: number,
    documentType?: string,
    topic?: string
  ) => void;
  isGenerating: boolean;
}

export default function Part6GenerationModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: Part6GenerationModalProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(1);
  const [documentType, setDocumentType] = useState<string>('');
  const [topic, setTopic] = useState<string>('');

  // メタデータを動的に取得
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [businessTopics, setBusinessTopics] = useState<Array<{topic: string, description: string, weight: number}>>([]);

  // コンポーネントマウント時にメタデータを取得
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Document types取得
        const docTypesResponse = await fetch('/api/part6-questions?action=document-types');
        if (docTypesResponse.ok) {
          const docTypesData = await docTypesResponse.json();
          setDocumentTypes(docTypesData.documentTypes || []);
        } else {
          // フォールバック
          setDocumentTypes(['email', 'letter', 'article', 'advertisement', 'notice', 'memo']);
        }

        // Question types取得
        const questionTypesResponse = await fetch('/api/part6-questions?action=question-types');
        if (questionTypesResponse.ok) {
          const questionTypesData = await questionTypesResponse.json();
          setQuestionTypes(questionTypesData.questionTypes || []);
        } else {
          // フォールバック
          setQuestionTypes(['vocabulary', 'grammar', 'context', 'sentence_insertion']);
        }

        // Business topics取得
        const businessTopicsResponse = await fetch('/api/part6-questions?action=business-topics');
        if (businessTopicsResponse.ok) {
          const businessTopicsData = await businessTopicsResponse.json();
          setBusinessTopics(businessTopicsData.businessTopics || []);
        } else {
          // フォールバック
          setBusinessTopics([
            { topic: 'meeting_scheduling', description: '会議スケジュール調整', weight: 0.08 },
            { topic: 'customer_inquiries', description: '顧客問い合わせ', weight: 0.06 },
            { topic: 'office_announcements', description: 'オフィス告知', weight: 0.07 },
            { topic: 'product_launch', description: '商品発売・紹介', weight: 0.04 }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch Part 6 metadata:', error);
        // エラー時はデフォルト値を使用
        setDocumentTypes(['email', 'letter', 'article', 'advertisement', 'notice', 'memo']);
        setQuestionTypes(['vocabulary', 'grammar', 'context', 'sentence_insertion']);
        setBusinessTopics([
          { topic: 'meeting_scheduling', description: '会議スケジュール調整', weight: 0.08 },
          { topic: 'customer_inquiries', description: '顧客問い合わせ', weight: 0.06 },
          { topic: 'office_announcements', description: 'オフィス告知', weight: 0.07 },
          { topic: 'product_launch', description: '商品発売・紹介', weight: 0.04 }
        ]);
      }
    };

    if (isOpen) {
      fetchMetadata();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(
      difficulty,
      count,
      documentType || undefined,
      topic || undefined
    );
  };

  const getDocumentTypeDisplayName = (type: string) => {
    const displayNames: { [key: string]: string } = {
      email: 'Eメール',
      letter: 'ビジネスレター',
      article: '記事',
      advertisement: '広告',
      notice: '通知・お知らせ',
      memo: 'メモ'
    };
    return displayNames[type] || type;
  };

  const getQuestionTypeDisplayName = (type: string) => {
    const displayNames: { [key: string]: string } = {
      vocabulary: '語彙選択',
      grammar: '文法',
      context: '文脈理解',
      sentence_insertion: '文挿入'
    };
    return displayNames[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Part 6問題生成</h2>
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
                全体難易度
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

          {/* 文書設定：2列レイアウト */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文書タイプ（オプション）
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              >
                <option value="">ランダム選択</option>
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {getDocumentTypeDisplayName(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ビジネストピック（オプション）
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              >
                <option value="">重み付きランダム選択</option>
                {businessTopics
                  .sort((a, b) => b.weight - a.weight) // 重みの高い順にソート
                  .map((businessTopic) => (
                    <option key={businessTopic.topic} value={businessTopic.topic}>
                      {businessTopic.description} ({(businessTopic.weight * 100).toFixed(1)}%)
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                25種類のビジネストピックから選択可能（括弧内は出現確率）
                <br />
                空欄の場合は重み付きに基づいてランダム選択されます
              </p>
            </div>
          </div>

          {/* 説明セクション：2列レイアウト */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-green-800 mb-2">自動生成プロセス</h4>
              <ol className="text-xs text-green-700 space-y-1">
                <li>1. 文書タイプとビジネストピックを決定</li>
                <li>2. 指定パラメータに基づいて文書を生成</li>
                <li>3. 4箇所の空欄位置を決定</li>
                <li>4. 各空欄に適切な選択肢を作成</li>
                <li>5. 文法・語彙・文脈の正確性を確認</li>
                <li>6. 詳細な解説を生成</li>
                <li>7. 日本語翻訳を付与</li>
                <li>8. 問題を自動保存</li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Part 6の特徴</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 長文穴埋め問題（Text Completion）</li>
                <li>• 1つの文書につき4つの空欄</li>
                <li>• 4択選択肢（A, B, C, D）</li>
                <li>• 語彙・文法・文脈理解・文挿入を測定</li>
                <li>• ビジネス文書（メール、レター、広告など）</li>
                <li>• 25種類のビジネストピック（重み付き）</li>
                <li>• 16問を9分で解答（本番試験）</li>
              </ul>
            </div>
          </div>

          {/* 問題タイプ説明 */}
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-purple-800 mb-2">Part 6の問題タイプ（自動選択）</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {questionTypes.map((type) => (
                <div key={type} className="text-xs text-purple-700">
                  • <strong>{getQuestionTypeDisplayName(type)}</strong>
                  {type === 'vocabulary' && '：適切な語彙の選択'}
                  {type === 'grammar' && '：文法的に正しい選択肢'}
                  {type === 'context' && '：文脈に適した表現'}
                  {type === 'sentence_insertion' && '：文書全体の流れに合う文の挿入'}
                </div>
              ))}
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
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span className="text-sm text-yellow-800">Part 6問題を生成中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}