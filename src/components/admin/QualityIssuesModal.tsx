"use client";

import { QualityCheckResult, QualityIssue } from "@/lib/quality-checker";

interface QualityIssuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: QualityCheckResult | null;
  passageId?: string;
}

export default function QualityIssuesModal({ isOpen, onClose, result, passageId }: QualityIssuesModalProps) {
  if (!isOpen || !result) return null;

  const getSeverityColor = (severity: QualityIssue['severity']) => {
    switch (severity) {
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'critical': return 'text-red-800 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryLabel = (category: QualityIssue['category']) => {
    switch (category) {
      case 'grammar': return '文法';
      case 'content': return '内容';
      case 'structure': return '構造';
      case 'difficulty': return '難易度';
      case 'toeic_compliance': return 'TOEIC準拠';
      case 'word_count': return '語数';
      default: return 'その他';
    }
  };

  const getRecommendationColor = (recommendation: QualityCheckResult['recommendation']) => {
    switch (recommendation) {
      case 'approve': return 'text-green-600 bg-green-50';
      case 'revision_needed': return 'text-yellow-600 bg-yellow-50';
      case 'reject': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRecommendationLabel = (recommendation: QualityCheckResult['recommendation']) => {
    switch (recommendation) {
      case 'approve': return '承認';
      case 'revision_needed': return '修正必要';
      case 'reject': return '不合格';
      default: return '不明';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">品質チェック結果</h2>
              {passageId && (
                <p className="text-sm text-gray-500 mt-1">問題ID: {passageId}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 結果サマリー */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                {result.passed ? '合格' : '不合格'}
              </div>
              <div className="text-sm text-gray-500">判定結果</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{result.score}</div>
              <div className="text-sm text-gray-500">品質スコア</div>
            </div>
            <div className="text-center">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(result.recommendation)}`}>
                {getRecommendationLabel(result.recommendation)}
              </div>
              <div className="text-sm text-gray-500 mt-1">推奨アクション</div>
            </div>
          </div>
        </div>

        {/* 課題リスト */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            検出された課題 ({result.issues.length}件)
          </h3>
          
          {result.issues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              課題は検出されませんでした
            </div>
          ) : (
            <div className="space-y-4">
              {result.issues.map((issue, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium px-2 py-1 rounded bg-white bg-opacity-50">
                        {getCategoryLabel(issue.category)}
                      </span>
                      <span className="text-xs font-medium uppercase">
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm font-medium mb-2">
                    {issue.description}
                  </p>
                  
                  {issue.suggestion && (
                    <div className="mt-2 p-2 bg-white bg-opacity-50 rounded">
                      <p className="text-xs font-medium text-gray-700 mb-1">改善提案:</p>
                      <p className="text-xs text-gray-600">{issue.suggestion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              この問題は品質基準を満たしていないため破棄されました
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}