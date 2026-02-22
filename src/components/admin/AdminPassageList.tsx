import { Passage } from "@/lib/types";
import { useEffect, useState } from "react";

interface AdminPassageListProps {
  passages: Passage[];
  onEdit: (passage: Passage) => void;
  onDelete: (passageId: string) => void;
  onBulkGenerate: () => void;
  onPart1Generate?: () => void;
  onPart2Generate?: () => void;
  onPart3Generate?: () => void;
  onPart4Generate?: () => void;
  onPart5Generate?: () => void;
  onPart6Generate?: () => void;
  onPart7SingleTextGenerate?: () => void;
  onPart7SingleChartGenerate?: () => void;
  onPart7DoubleGenerate?: () => void;
  isGenerating: boolean;
}

export default function AdminPassageList({ passages, onEdit, onDelete, onPart1Generate, onPart2Generate, onPart3Generate, onPart4Generate, onPart5Generate, onPart6Generate, onPart7SingleTextGenerate, onPart7SingleChartGenerate, onPart7DoubleGenerate, isGenerating }: AdminPassageListProps) {
  const [latestBatch, setLatestBatch] = useState<string | null>(null);

  useEffect(() => {
    // クライアントサイドでのみlocalStorageにアクセス
    if (typeof window !== 'undefined') {
      setLatestBatch(localStorage.getItem('latestGenerationBatch'));
    }
  }, []);

  // passages が更新されたときにも localStorage を再確認
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLatestBatch(localStorage.getItem('latestGenerationBatch'));
    }
  }, [passages]);
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "article":
        return "bg-blue-100 text-blue-800";
      case "email":
        return "bg-purple-100 text-purple-800";
      case "advertisement":
        return "bg-orange-100 text-orange-800";
      case "chart":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getQualityCheckTag = (passage: Passage) => {
    const qualityCheck = passage.metadata?.qualityCheck;
    
    if (!qualityCheck) {
      return null; // 品質チェックが行われていない場合
    }

    if (qualityCheck.passed) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
          ✓ 検証合格
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
          ⚠ 検証不合格
        </span>
      );
    }
  };

  const getQualityScore = (passage: Passage) => {
    const qualityCheck = passage.metadata?.qualityCheck;
    return qualityCheck?.score || null;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">問題一覧 ({passages.length})</h2>
          <div className="flex items-center space-x-3">
            {onPart1Generate && (
              <button
                onClick={onPart1Generate}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Part 1問題生成
              </button>
            )}
            {onPart2Generate && (
              <>
                <button
                  onClick={onPart2Generate}
                  disabled={isGenerating}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Part 2問題生成
                </button>
              </>
            )}
            {onPart3Generate && (
              <button
                onClick={onPart3Generate}
                disabled={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Part 3問題生成
              </button>
            )}
            {onPart4Generate && (
              <button
                onClick={onPart4Generate}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Part 4問題生成
              </button>
            )}
            {onPart5Generate && (
              <button
                onClick={onPart5Generate}
                disabled={isGenerating}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Part 5問題生成
              </button>
            )}
            {onPart6Generate && (
              <button
                onClick={onPart6Generate}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Part 6問題生成
              </button>
            )}
            {/* Part 7 Single Text Generation */}
            {onPart7SingleTextGenerate && (
              <button
                onClick={onPart7SingleTextGenerate}
                disabled={isGenerating}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Part 7 Single Text 生成
              </button>
            )}
            
            {/* Part 7 Single Chart Generation */}
            {onPart7SingleChartGenerate && (
              <button
                onClick={onPart7SingleChartGenerate}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Part 7 Single Chart 生成
              </button>
            )}
            
            {/* Part 7 Double Generation */}
            {onPart7DoubleGenerate && (
              <button
                onClick={onPart7DoubleGenerate}
                disabled={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Part 7 Double 生成
              </button>
            )}
          </div>
        </div>
      </div>

      {passages.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-500 text-lg">問題が見つかりません</div>
          <div className="text-gray-400 text-sm mt-2">フィルターを調整するか、新しい問題を追加してください</div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {passages.map((passage) => (
            <div key={passage.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-medium">
                      <a
                        href={`/?id=${passage.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {passage.title || `問題 ${passage.id}`}
                      </a>
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                      ID: {passage.id}
                    </span>
                    {passage.generationBatch && 
                     passage.generationBatch === latestBatch && (
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-600 text-white shadow-sm">
                        New
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(passage.metadata.difficulty)}`}>
                      {passage.metadata.difficulty}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(passage.type)}`}>{passage.type}</span>
                    {getQualityCheckTag(passage)}
                    {getQualityScore(passage) !== null && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        スコア: {getQualityScore(passage)}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{passage.content ? passage.content.substring(0, 150) : (passage.isMultiDocument ? `${passage.documents?.length || 0} documents` : 'No content')}...</p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>質問数: {passage.questions.length}</span>
                    <span>語数: {passage.metadata.wordCount}</span>
                    <span>トピック: {(() => {
                      if (passage.toeicPart === 'part1' && passage.part1Questions?.[0]?.scene) {
                        return passage.part1Questions[0].scene;
                      }
                      return passage.metadata.topic;
                    })()}</span>
                    {passage.metadata?.qualityCheck && (
                      <span className={`${passage.metadata.qualityCheck.passed ? 'text-green-600' : 'text-red-600'}`}>
                        品質: {passage.metadata.qualityCheck.passed ? '合格' : '不合格'} ({passage.metadata.qualityCheck.score}/100)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button onClick={() => onEdit(passage)} className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded text-sm font-medium">
                    編集
                  </button>
                  <button onClick={() => onDelete(passage.id)} className="text-red-600 hover:text-red-800 px-3 py-1 rounded text-sm font-medium">
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
