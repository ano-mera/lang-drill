import { Part3Question } from "@/lib/types";
import { useEffect, useState } from "react";

interface Part3QuestionListProps {
  questions: Part3Question[];
  onEdit: (question: Part3Question) => void;
  onDelete: (questionId: string) => void;
  onGenerate?: () => void;
}

export default function Part3QuestionList({ questions, onEdit, onDelete, onGenerate }: Part3QuestionListProps) {
  const [latestBatch, setLatestBatch] = useState<string | null>(null);

  useEffect(() => {
    // クライアントサイドでのみlocalStorageにアクセス
    if (typeof window !== 'undefined') {
      setLatestBatch(localStorage.getItem('latestGenerationBatch'));
    }
  }, []);

  // questions が更新されたときにも localStorage を再確認
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLatestBatch(localStorage.getItem('latestGenerationBatch'));
    }
  }, [questions]);

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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Part 3問題一覧 ({questions.length})</h2>
          {onGenerate && (
            <button
              onClick={onGenerate}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Part 3問題生成
            </button>
          )}
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-500 text-lg">Part 3問題が見つかりません</div>
          <div className="text-gray-400 text-sm mt-2">問題を生成してください</div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {questions.map((question) => (
            <div key={question.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-medium">
                      <a
                        href={`/?id=${question.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {question.scenario || `Part 3問題 ${question.id}`}
                      </a>
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                      ID: {question.id}
                    </span>
                    {question.generationBatch && 
                     question.generationBatch === latestBatch && (
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-600 text-white shadow-sm">
                        New
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      Part 3
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {question.scenarioTranslation || question.scenario}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>質問数: {question.questions.length}</span>
                    <span>話者数: {question.speakers.length}</span>
                    <span>会話ターン: {question.conversation.length}</span>
                    <span>トピック: {question.topic}</span>
                    {question.industry && (
                      <span>業種: {question.industry}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button 
                    onClick={() => onEdit(question)} 
                    className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded text-sm font-medium"
                  >
                    編集
                  </button>
                  <button 
                    onClick={() => onDelete(question.id)} 
                    className="text-red-600 hover:text-red-800 px-3 py-1 rounded text-sm font-medium"
                  >
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