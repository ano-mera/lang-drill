"use client";

import { useState, useEffect } from "react";

interface Part5GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    difficulty: string,
    count: number,
    category?: string,
    intent?: string,
    length?: string,
    vocabLevel?: string,
    optionsType?: string,
    answerIndex?: string
  ) => void;
  isGenerating: boolean;
}

export default function Part5GenerationModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: Part5GenerationModalProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(1);
  const [category, setCategory] = useState<string>('');
  const [intent, setIntent] = useState<string>('');
  const [length, setLength] = useState<string>('');
  const [vocabLevel, setVocabLevel] = useState<string>('');
  const [optionsType, setOptionsType] = useState<string>('');
  const [answerIndex, setAnswerIndex] = useState<string>('');

  // テンプレートファイルから最新のオプションを動的に取得
  const [categories, setCategories] = useState<string[]>([]);
  const [intentsByCategory, setIntentsByCategory] = useState<{ [key: string]: string[] }>({});
  const [optionsTypes, setOptionsTypes] = useState<string[]>([]);

  // デフォルトのintentsByCategoryを返すヘルパー関数
  const getDefaultIntentsByCategory = () => {
    return {
      "品詞識別": [
        "名詞と動詞の使い分けを問う",
        "形容詞と副詞の識別を問う",
        "名詞と形容詞の使い分けを問う",
        "動詞と形容詞の識別を問う"
      ],
      "動詞の形・時制": [
        "不定詞と動名詞の使い分けを問う",
        "受動態と能動態の判断を問う",
        "過去形と現在完了の区別を問う",
        "現在形と現在進行形の使い分けを問う",
        "未来形の表現方法を問う"
      ],
      "主語と動詞の一致": [
        "主語に合った動詞選択を問う",
        "単数・複数の一致を問う",
        "集合名詞の動詞選択を問う"
      ],
      "接続詞": [
        "論理関係に合った接続詞選択を問う",
        "因果関係を表す接続詞を問う",
        "対比・譲歩の接続詞を問う",
        "時間関係の接続詞を問う"
      ],
      "前置詞": [
        "時間・場所に応じた前置詞の選択を問う",
        "動詞との組み合わせによる前置詞を問う",
        "慣用的な前置詞の使用を問う"
      ],
      "関係詞・代名詞": [
        "関係代名詞の機能に応じた選択を問う",
        "関係副詞の適切な使用を問う",
        "指示代名詞の使い分けを問う"
      ],
      "比較構文・数量": [
        "比較級・最上級・数量表現の理解を問う",
        "同等比較の表現を問う",
        "数量詞の正しい使用を問う"
      ],
      "語彙選択": [
        "意味の似た語の正しい用法を問う",
        "文脈に応じた適切な語彙選択を問う",
        "ビジネス用語の使い分けを問う"
      ],
      "慣用表現・句動詞": [
        "句動詞やビジネス慣用表現の使い分けを問う",
        "イディオムの正しい使用を問う",
        "定型表現の理解を問う"
      ],
      "構文": [
        "否定構文の語順を問う",
        "倒置構文の語順を問う",
        "仮定法過去の構文を問う",
        "仮定法過去完了の構文を問う",
        "省略された仮定法の文を完成させる",
        "強調構文（It is ... that）を問う"
      ],
      "語法": [
        "to不定詞と動名詞を取る動詞の使い分けを問う",
        "目的語＋不定詞構文（enable A to doなど）を問う",
        "that節を取る動詞の語法を問う",
        "使役・知覚構文の語法を問う",
        "形容詞を伴う構文（be eager to / be likely to など）を問う",
        "提案・要求動詞に続く仮定法構文（demand that he goなど）を問う"
      ]
    };
  };

  // コンポーネントマウント時にテンプレートデータを取得
  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        const response = await fetch('/api/part5-templates');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
          // intentsByCategoryのweightedオブジェクトからキーのみを抽出
          const intentsArray: { [key: string]: string[] } = {};
          Object.keys(data.intentsByCategory || {}).forEach(category => {
            intentsArray[category] = Object.keys(data.intentsByCategory[category] || {});
          });
          setIntentsByCategory(intentsArray);
          setOptionsTypes(data.optionsTypes || []);
        } else {
          // フォールバック: APIが失敗した場合はデフォルト値を使用
          console.warn('Template API failed, using fallback values');
          setCategories([
            "品詞識別", "動詞の形・時制", "主語と動詞の一致", "接続詞", "前置詞", 
            "関係詞・代名詞", "比較構文・数量", "語彙選択", "慣用表現・句動詞", "構文", "語法"
          ]);
          setIntentsByCategory(getDefaultIntentsByCategory());
          setOptionsTypes([
            "同語の語形変化", "類義語の選択", "前置詞や接続詞の選択", "同じ品詞で意味が紛らわしい語"
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch template data:', error);
        // エラー時はデフォルト値を使用
        setCategories([
          "品詞識別", "動詞の形・時制", "主語と動詞の一致", "接続詞", "前置詞", 
          "関係詞・代名詞", "比較構文・数量", "語彙選択", "慣用表現・句動詞", "構文", "語法"
        ]);
        setIntentsByCategory(getDefaultIntentsByCategory());
        setOptionsTypes([
          "同語の語形変化", "類義語の選択", "前置詞や接続詞の選択", "同じ品詞で意味が紛らわしい語"
        ]);
      }
    };

    if (isOpen) {
      fetchTemplateData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(
      difficulty,
      count,
      category || undefined,
      intent || undefined,
      length || undefined,
      vocabLevel || undefined,
      optionsType || undefined,
      answerIndex || undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Part 5問題生成</h2>
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

          {/* カテゴリと出題意図：2列レイアウト */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ（オプション）
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setIntent(''); // カテゴリ変更時に意図をリセット
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              >
                <option value="">ランダム選択</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出題意図（オプション）
              </label>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating || !category}
              >
                <option value="">自動選択</option>
                {category && intentsByCategory[category]?.map((int) => (
                  <option key={int} value={int}>{int}</option>
                ))}
              </select>
              {!category && (
                <p className="text-xs text-gray-500 mt-1">カテゴリを選択してください</p>
              )}
            </div>
          </div>

          {/* 詳細設定：2列レイアウト */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文の長さ（オプション）
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              >
                <option value="">自動選択</option>
                <option value="short">Short（短文）</option>
                <option value="medium">Medium（中文）</option>
                <option value="long">Long（長文）</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                語彙レベル（オプション）
              </label>
              <select
                value={vocabLevel}
                onChange={(e) => setVocabLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              >
                <option value="">自動選択</option>
                <option value="easy">Easy（基礎語彙）</option>
                <option value="medium">Medium（標準語彙）</option>
                <option value="hard">Hard（高度語彙）</option>
              </select>
            </div>
          </div>

          {/* 選択肢設定：2列レイアウト */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選択肢タイプ（オプション）
              </label>
              <select
                value={optionsType}
                onChange={(e) => setOptionsType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              >
                <option value="">自動選択</option>
                {optionsTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                正解の位置（オプション）
              </label>
              <select
                value={answerIndex}
                onChange={(e) => setAnswerIndex(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              >
                <option value="">ランダム</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>

          {/* 説明セクション：2列レイアウト */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-green-800 mb-2">自動生成プロセス</h4>
              <ol className="text-xs text-green-700 space-y-1">
                <li>1. 指定されたパラメータに基づいて問題文を生成</li>
                <li>2. 空欄位置を決定し、適切な選択肢を作成</li>
                <li>3. 文法的正確性と自然さを確認</li>
                <li>4. 詳細な解説を生成</li>
                <li>5. 日本語翻訳を付与</li>
                <li>6. 問題を自動保存</li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Part 5の特徴</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 短文穴埋め問題（Incomplete Sentences）</li>
                <li>• 4択選択肢（A, B, C, D）</li>
                <li>• 文法・語彙の理解を測定</li>
                <li>• ビジネス・日常場面の実用的な文</li>
                <li>• 30問を8分で解答（本番試験）</li>
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
              <span className="text-sm text-yellow-800">Part 5問題を生成中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}