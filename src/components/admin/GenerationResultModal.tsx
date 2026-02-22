import { useState } from "react";
import { Copy } from "lucide-react";
import { copyToClipboard } from "@/utils/clipboard";
import CopySuccessPopup from "@/components/CopySuccessPopup";

interface QualityCheckResponse {
  response: string;
  checkType?: string;
  passageId?: string;
  isFinal?: boolean;
  timestamp?: string;
}

interface PromptWithType {
  prompt: string;
  promptType: string;
}

interface GenerationResult {
  success: boolean;
  message: string;
  batchId?: string;
  generatedIds?: string[];
  successCount?: number;
  errorCount?: number;
  totalCount?: number;
  errors?: string[];
  difficulty?: string;
  estimatedTime?: number;
  stdout?: string;
  generationPrompts?: (string | PromptWithType)[];
  qualityCheckPrompts?: (string | { systemPrompt?: string; userPrompt?: string; [key: string]: any })[];
  qualityCheckResponses?: (string | QualityCheckResponse)[];
  revisionPrompts?: (string | { systemPrompt?: string; userPrompt?: string; [key: string]: any })[];
  imagePrompts?: (string | { prompt: string; questionId?: string })[];
}

interface GenerationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: GenerationResult | null;
  onComplete?: () => void;
}

export default function GenerationResultModal({
  isOpen,
  onClose,
  result,
  onComplete,
}: GenerationResultModalProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'prompts' | 'quality'>('results');
  const [copySuccess, setCopySuccess] = useState<string>("");

  if (!isOpen || !result) return null;

  const isSuccess = result.success;
  const actualSuccessCount = result.successCount || result.generatedIds?.length || 0;
  const successRate = result.totalCount ? (actualSuccessCount / result.totalCount * 100).toFixed(1) : "0";
  const isPartialFailure = result.success && (result.errorCount || 0) > 0;
  const isZeroSuccess = actualSuccessCount === 0;

  const handleCopyPrompt = async (prompt: string, type: string) => {
    try {
      const message = await copyToClipboard(prompt, type);
      setCopySuccess(message);
      setTimeout(() => setCopySuccess(""), 2000);
    } catch {
      setCopySuccess("コピーに失敗しました");
      setTimeout(() => setCopySuccess(""), 2000);
    }
  };

  const parseQualityCheckResponse = (response: string) => {
    try {
      // JSONブロックを抽出
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('品質チェック結果のパースに失敗:', error);
      return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case '軽微':
        return 'bg-blue-100 text-blue-800';
      case '中程度':
        return 'bg-yellow-100 text-yellow-800';
      case '重大':
        return 'bg-orange-100 text-orange-800';
      case '致命的':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {isSuccess && !isZeroSuccess ? "🎉 生成完了" : 
             isSuccess && isZeroSuccess ? "⚠️ 生成失敗" : 
             "❌ 生成失敗"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'results'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            生成結果
          </button>
          {(result.generationPrompts || result.qualityCheckPrompts || result.revisionPrompts) && (
            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'prompts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              プロンプト詳細
            </button>
          )}
          {result.qualityCheckResponses && result.qualityCheckResponses.length > 0 && (
            <button
              onClick={() => setActiveTab('quality')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'quality'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              品質チェック結果
            </button>
          )}
        </div>

        {activeTab === 'results' && (isSuccess && !isZeroSuccess ? (
          <div className="space-y-4">
            {/* 成功時の結果表示 */}
            <div className={`${isPartialFailure ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4`}>
              <div className="flex items-center space-x-2 mb-2">
                <svg className={`w-5 h-5 ${isPartialFailure ? 'text-yellow-600' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className={`${isPartialFailure ? 'text-yellow-800' : 'text-green-800'} font-medium`}>
                  {isPartialFailure ? '部分的に成功' : '生成成功'}
                </span>
              </div>
              <p className={`${isPartialFailure ? 'text-yellow-700' : 'text-green-700'}`}>{result.message}</p>
            </div>

            {/* 統計情報 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{actualSuccessCount}</div>
                <div className="text-blue-800 text-sm">成功</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-600">{result.errorCount || 0}</div>
                <div className="text-gray-800 text-sm">失敗</div>
              </div>
            </div>

            {/* 詳細情報 */}
            {result.totalCount && result.totalCount > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>成功率</span>
                  <span className="font-medium">{successRate}%</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>難易度</span>
                  <span className="font-medium capitalize">{result.difficulty || "不明"}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>バッチID</span>
                  <span className="font-mono text-xs">{result.batchId?.slice(-12) || "不明"}</span>
                </div>
                {result.estimatedTime && (
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>推定実行時間</span>
                    <span className="font-medium">{Math.round(result.estimatedTime / 1000)}秒</span>
                  </div>
                )}
              </div>
            )}


            {/* 生成されたIDリスト */}
            {result.generatedIds && result.generatedIds.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">生成された問題ID</h4>
                <div className="flex flex-wrap gap-2">
                  {result.generatedIds.map((id, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}


            {/* エラー詳細（失敗した問題がある場合） */}
            {result.errors && result.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center space-x-2 text-yellow-800 hover:text-yellow-900"
                >
                  <svg
                    className={`w-4 h-4 transform transition-transform ${showDetails ? 'rotate-90' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">エラー詳細を表示 ({result.errors.length}件)</span>
                </button>
                {showDetails && (
                  <div className="mt-3 space-y-2">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 失敗時の表示（品質チェック失敗も含む） */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  {result.message?.includes('品質チェック') ? (
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
                </svg>
                <span className="text-red-800 font-medium">
                  {result.message?.includes('品質チェック') ? '品質チェック失敗' : '生成失敗'}
                </span>
              </div>
              <p className="text-red-700">{result.message}</p>
              
              {result.message?.includes('品質チェック') && (
                <div className="mt-3 p-3 bg-red-100 rounded">
                  <p className="text-red-800 text-sm">
                    生成された問題が品質基準を満たさなかったため、データベースに追加されませんでした。
                    別の難易度で再試行するか、生成パラメータを調整してください。
                  </p>
                </div>
              )}
            </div>

            {/* 統計情報（失敗時も表示） */}
            {result.totalCount && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-600">{actualSuccessCount}</div>
                  <div className="text-gray-800 text-sm">成功</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">{result.errorCount || 0}</div>
                  <div className="text-red-800 text-sm">失敗</div>
                </div>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">エラー詳細</h4>
                <div className="space-y-2">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Debug: Show stdout for troubleshooting */}
            {result.stdout && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center space-x-2 text-gray-800 hover:text-gray-900"
                >
                  <svg
                    className={`w-4 h-4 transform transition-transform ${showDetails ? 'rotate-90' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">詳細ログを表示</span>
                </button>
                {showDetails && (
                  <div className="mt-3">
                    <pre className="text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                      {result.stdout}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* プロンプト詳細タブ */}
        {activeTab === 'prompts' && (
          <div className="space-y-6">
            {/* 生成指示プロンプト */}
            {result.generationPrompts && result.generationPrompts.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  生成指示プロンプト ({result.generationPrompts.length}件)
                </h4>
                <div className="space-y-3">
                  {(() => {
                    // タイプ別カウンターを初期化
                    const typeCounters = { '本文生成': 0, '問題文生成': 0, '統合生成': 0, 'Part3会話生成': 0, 'Part3翻訳': 0, 'Part5問題生成': 0, 'Part5翻訳': 0, 'Part5選択肢翻訳': 0 };
                    
                    return result.generationPrompts
                      .map((promptItem, index) => {
                        // promptItemがnullまたはundefinedの場合はスキップ
                        if (!promptItem) return null;
                        
                        // promptItemが文字列の場合（後方互換性）とPromptWithType型の場合の両方に対応
                        const promptText = typeof promptItem === 'string' ? promptItem : promptItem.prompt;
                        const promptType = typeof promptItem === 'string' ? 'generation' : promptItem.promptType;
                        
                        // promptTextが空の場合もスキップ
                        if (!promptText) return null;
                      
                        // promptTypeに基づいて安定的に分類
                        let generationType = '本文生成'; // デフォルト
                        if (promptType === 'questions_generation') {
                          generationType = '問題文生成';
                        } else if (promptType === 'content_generation') {
                          generationType = '本文生成';
                        } else if (promptType === 'part3_conversation_generation') {
                          generationType = 'Part3会話生成';
                        } else if (promptType === 'part3_translation') {
                          generationType = 'Part3翻訳';
                        } else if (promptType === 'part5_generation') {
                          generationType = 'Part5問題生成';
                        } else if (promptType === 'part5_translation') {
                          generationType = 'Part5翻訳';
                        } else if (promptType === 'part5_options_translation') {
                          generationType = 'Part5選択肢翻訳';
                        } else {
                          // 旧形式（'generation'）の場合は文字列マッチング（後方互換性）
                          const isQuestionsGeneration = (promptText.includes('問題を作成してください') || 
                                                        promptText.includes('質問を作成してください')) &&
                                                        !promptText.includes('TOEIC Part7用の') &&
                                                        !promptText.includes('以下の条件で');
                          if (isQuestionsGeneration) {
                            generationType = '問題文生成';
                          }
                        }
                      
                      // タイプ別カウンターを更新
                      if (generationType in typeCounters) {
                        typeCounters[generationType as keyof typeof typeCounters]++;
                      }
                      
                      return (
                        <details key={index} className="bg-white rounded border">
                          <summary className="flex justify-between items-center p-3 border-b border-blue-100 cursor-pointer hover:bg-blue-50">
                            <span className="text-sm font-medium text-blue-800">{generationType}プロンプト {generationType in typeCounters ? typeCounters[generationType as keyof typeof typeCounters] : 0}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPrompt(promptText, "生成プロンプト");
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="プロンプトをコピー"
                          >
                            <Copy size={18} />
                          </button>
                        </summary>
                        <div className="p-3">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                            {promptText}
                          </pre>
                        </div>
                        </details>
                        );
                      })
                      .filter(Boolean); // null値を除外
                  })()}
                </div>
              </div>
            )}

            {/* 品質チェックプロンプト */}
            {result.qualityCheckPrompts && result.qualityCheckPrompts.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  品質チェックプロンプト ({result.qualityCheckPrompts.length}件)
                </h4>
                <div className="space-y-3">
                  {(() => {
                    // タイプ別カウンターを初期化
                    const typeCounters = { '本文検証': 0, '問題文検証': 0, '統合検証': 0 };
                    
                    return result.qualityCheckPrompts
                      .map((prompt, index) => {
                        // promptがnullまたはundefinedの場合はスキップ
                        if (!prompt) return null;
                        
                        // プロンプトタイプを判定
                        const promptText = typeof prompt === 'string' ? prompt : (prompt.userPrompt || prompt.systemPrompt || '');
                        const isContentCheck = promptText.includes('本文専用品質チェック') || promptText.includes('【評価基準（本文のみ）】');
                        const isQuestionsCheck = promptText.includes('問題文専用品質チェック') || promptText.includes('【評価基準（問題文のみ）】');
                      
                      let promptType = '統合検証';
                      if (isContentCheck) promptType = '本文検証';
                      else if (isQuestionsCheck) promptType = '問題文検証';
                      
                      // タイプ別カウンターを更新
                      if (promptType in typeCounters) {
                        typeCounters[promptType as keyof typeof typeCounters]++;
                      }
                      
                      return (
                        <details key={index} className="bg-white rounded border">
                          <summary className="flex justify-between items-center p-3 border-b border-green-100 cursor-pointer hover:bg-green-50">
                            <span className="text-sm font-medium text-green-800">{promptType}プロンプト {promptType in typeCounters ? typeCounters[promptType as keyof typeof typeCounters] : 0}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const copyText = typeof prompt === 'string' ? prompt : 
                                `System: ${prompt.systemPrompt || ''}\n\nUser: ${prompt.userPrompt || ''}\n\nResponse: ${prompt.response || ''}`;
                              handleCopyPrompt(copyText, "検証プロンプト");
                            }}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            title="プロンプトをコピー"
                          >
                            <Copy size={18} />
                          </button>
                        </summary>
                        <div className="p-3">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                            {typeof prompt === 'string' ? prompt : 
                              `System: ${prompt.systemPrompt || ''}\n\nUser: ${prompt.userPrompt || ''}\n\nResponse: ${prompt.response || ''}`}
                          </pre>
                        </div>
                        </details>
                        );
                      })
                      .filter(Boolean); // null値を除外
                  })()}
                </div>
              </div>
            )}

            {/* 画像生成プロンプト */}
            {result.imagePrompts && result.imagePrompts.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  画像生成プロンプト ({result.imagePrompts.length}件)
                </h4>
                <div className="space-y-3">
                  {result.imagePrompts.map((promptItem, index) => {
                    // promptItemがnullまたはundefinedの場合はスキップ
                    if (!promptItem) return null;
                    
                    // promptItemが文字列の場合とオブジェクトの場合の両方に対応
                    const promptText = typeof promptItem === 'string' ? promptItem : promptItem.prompt;
                    const questionId = typeof promptItem === 'string' ? `画像${index + 1}` : promptItem.questionId || `画像${index + 1}`;
                    
                    // promptTextが空の場合もスキップ
                    if (!promptText) return null;
                    
                    return (
                      <details key={index} className="bg-white rounded border">
                        <summary className="flex justify-between items-center p-3 border-b border-purple-100 cursor-pointer hover:bg-purple-50">
                          <span className="text-sm font-medium text-purple-800">{questionId} 画像生成プロンプト</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPrompt(promptText, "画像生成プロンプト");
                            }}
                            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                            title="プロンプトをコピー"
                          >
                            <Copy size={18} />
                          </button>
                        </summary>
                        <div className="p-3">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                            {promptText}
                          </pre>
                        </div>
                      </details>
                    );
                  }).filter(Boolean)}
                </div>
              </div>
            )}

            {/* 修正依頼プロンプト */}
            {result.revisionPrompts && result.revisionPrompts.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  修正依頼プロンプト ({result.revisionPrompts.length}件)
                </h4>
                <div className="space-y-3">
                  {(() => {
                    // タイプ別カウンターを初期化
                    const typeCounters = { '本文修正': 0, '問題文修正': 0, '統合修正': 0 };
                    
                    return result.revisionPrompts
                      .map((prompt, index) => {
                        // promptがnullまたはundefinedの場合はスキップ
                        if (!prompt) return null;
                        
                        // プロンプトタイプを判定
                        const revisionPromptText = typeof prompt === 'string' ? prompt : (prompt.userPrompt || prompt.systemPrompt || '');
                        const isQuestionsRevision = revisionPromptText.includes('問題文の修正') || revisionPromptText.includes('問題のみを修正') || revisionPromptText.includes('reviseQuestionsBasedOnQualityCheck');
                      
                      let revisionType = '本文修正'; // デフォルトを本文修正に変更
                      if (isQuestionsRevision) {
                        revisionType = '問題文修正';
                      }
                      
                      // タイプ別カウンターを更新
                      if (revisionType in typeCounters) {
                        typeCounters[revisionType as keyof typeof typeCounters]++;
                      }
                      
                      return (
                        <details key={index} className="bg-white rounded border">
                          <summary className="flex justify-between items-center p-3 border-b border-orange-100 cursor-pointer hover:bg-orange-50">
                            <span className="text-sm font-medium text-orange-800">{revisionType}プロンプト {revisionType in typeCounters ? typeCounters[revisionType as keyof typeof typeCounters] : 0}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const copyText = typeof prompt === 'string' ? prompt : 
                                `System: ${prompt.systemPrompt || ''}\n\nUser: ${prompt.userPrompt || ''}\n\nResponse: ${prompt.response || ''}`;
                              handleCopyPrompt(copyText, "修正プロンプト");
                            }}
                            className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                            title="プロンプトをコピー"
                          >
                            <Copy size={18} />
                          </button>
                        </summary>
                        <div className="p-3">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                            {typeof prompt === 'string' ? prompt : 
                              `System: ${prompt.systemPrompt || ''}\n\nUser: ${prompt.userPrompt || ''}\n\nResponse: ${prompt.response || ''}`}
                          </pre>
                        </div>
                        </details>
                        );
                      })
                      .filter(Boolean); // null値を除外
                  })()}
                </div>
              </div>
            )}

            {/* プロンプトが利用できない場合 */}
            {(!result.generationPrompts || result.generationPrompts.length === 0) && 
             (!result.qualityCheckPrompts || result.qualityCheckPrompts.length === 0) &&
             (!result.revisionPrompts || result.revisionPrompts.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                プロンプト情報は利用できません
              </div>
            )}
          </div>
        )}

        {/* 品質チェック結果タブ */}
        {activeTab === 'quality' && (
          <div className="space-y-6">
            {result.qualityCheckResponses && result.qualityCheckResponses.length > 0 ? (
              <div className="space-y-4">
                {(() => {
                  // まず全ての品質チェック結果にメタデータを付与
                  const itemsWithMetadata = result.qualityCheckResponses.map((responseItem, index) => {
                    // レスポンスアイテムが文字列かオブジェクトかを判別
                    const response = typeof responseItem === 'string' ? responseItem : responseItem.response;
                    const metadata = typeof responseItem === 'object' ? responseItem : null;
                    
                    const parsedResult = parseQualityCheckResponse(response);
                    
                    // メタデータから情報を取得（新しいシーケンシャルフロー対応）
                    let checkType = '品質チェック';
                    let bgColor = 'bg-gray-50 border-gray-200';
                    let displayOrder = 999;
                    
                    if (metadata?.checkType === 'content_only') {
                      // passageIdに"_revised"が含まれているか、タイムスタンプで判定
                      const isRevised = metadata?.passageId?.includes('_revised') || 
                                       metadata?.passageId?.includes('_final') ||
                                       response.includes('修正後の再検証');
                      checkType = '本文品質チェック';
                      bgColor = 'bg-blue-50 border-blue-200';
                      displayOrder = isRevised ? 2 : 1; // 本文: 1, 2
                    } else if (metadata?.checkType === 'questions_only') {
                      // passageIdに"_revised"が含まれているか、タイムスタンプで判定
                      const isRevised = metadata?.passageId?.includes('_revised') || 
                                       metadata?.passageId?.includes('_final') ||
                                       response.includes('修正後の再検証');
                      checkType = '問題文品質チェック';
                      bgColor = 'bg-green-50 border-green-200';
                      displayOrder = isRevised ? 4 : 3; // 問題文: 3, 4
                    } else if (metadata?.checkType === 'toeic_part7_quality') {
                      checkType = '統合品質チェック';
                      bgColor = 'bg-purple-50 border-purple-200';
                      displayOrder = metadata.isFinal ? 5 : 0;
                    } else {
                      // フォールバック: レスポンス内容で判定（古い形式との互換性）
                      const isContentCheck = response.includes('【評価基準（本文のみ）】');
                      const isQuestionsCheck = response.includes('【評価基準（問題文のみ）】');
                      const isFinalCheck = response.includes('_final');
                      
                      if (isContentCheck) {
                        checkType = '本文品質チェック';
                        bgColor = 'bg-blue-50 border-blue-200';
                        displayOrder = isFinalCheck ? 2 : 1;
                      } else if (isQuestionsCheck) {
                        checkType = '問題文品質チェック';
                        bgColor = 'bg-green-50 border-green-200';
                        displayOrder = isFinalCheck ? 4 : 3;
                      }
                    }
                    
                    return {
                      result: parsedResult,
                      type: checkType,
                      bgColor,
                      displayOrder,
                      originalIndex: index,
                      key: `${index}-${metadata?.checkType || 'unknown'}`,
                      originalResponse: response,
                      metadata
                    };
                  });
                  
                  // チェックタイプごとに番号を割り当て  
                  const sortedItems = itemsWithMetadata.sort((a, b) => a.displayOrder - b.displayOrder);
                  
                  // タイムスタンプベースで修正後判定を改善
                  const contentCheckTimes: Array<{ item: any; timestamp?: string }> = [];
                  const questionsCheckTimes: Array<{ item: any; timestamp?: string }> = [];
                  
                  sortedItems.forEach((item) => {
                    if (item.type.includes('本文品質チェック')) {
                      contentCheckTimes.push({ item, timestamp: item.metadata?.timestamp });
                    } else if (item.type.includes('問題文品質チェック')) {
                      questionsCheckTimes.push({ item, timestamp: item.metadata?.timestamp });
                    }
                  });
                  
                  // タイムスタンプ順にソートして、2番目以降を修正後として判定
                  contentCheckTimes.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
                  questionsCheckTimes.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
                  
                  contentCheckTimes.forEach((entry, index) => {
                    if (index > 0) {
                      entry.item.type = '本文品質チェック';
                      entry.item.displayOrder = 2; // 本文修正後は2番目
                    }
                  });
                  
                  questionsCheckTimes.forEach((entry, index) => {
                    if (index > 0) {
                      entry.item.type = '問題文品質チェック';
                      entry.item.displayOrder = 4; // 問題文修正後は4番目
                    }
                  });
                  
                  // 再ソート
                  const reSortedItems = sortedItems.sort((a, b) => a.displayOrder - b.displayOrder);
                  
                  // 各タイプごとのカウンタを事前に計算
                  const typeCounters: Record<string, number> = {};
                  reSortedItems.forEach((item) => {
                    const baseType = item.type.trim();
                    if (!typeCounters[baseType]) {
                      typeCounters[baseType] = 0;
                    }
                    typeCounters[baseType]++;
                    (item as any).displayNumber = typeCounters[baseType];
                  });
                  
                  return reSortedItems.map((item) => {
                  return (
                    <div key={item.key} className={`${item.bgColor} border rounded-lg p-6`}>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {item.type} {(item as any).displayNumber}
                          </h4>
                          {item.metadata && (
                            <div className="text-sm text-gray-500 mt-1">
                              {item.metadata.passageId && `ID: ${item.metadata.passageId}`}
                              {item.metadata.timestamp && ` • ${new Date(item.metadata.timestamp).toLocaleString('ja-JP')}`}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopyPrompt(item.originalResponse || JSON.stringify(item.result), "品質チェック結果")}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                          title="結果をコピー"
                        >
                          <Copy size={18} />
                        </button>
                      </div>

                      {item.result ? (
                        <div className="space-y-4">
                          {/* 総合評価 */}
                          <div className="flex items-center space-x-4">
                            <div className={`px-4 py-2 rounded-lg font-medium ${
                              item.result.passed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.result.passed ? '✓ 合格' : '✗ 不合格'}
                            </div>
                            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                              スコア: {item.result.score}/100
                            </div>
                            {item.result.recommendation && (
                              <div className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg">
                                推奨: {item.result.recommendation}
                              </div>
                            )}
                          </div>

                          {/* 問題点一覧 */}
                          {item.result.issues && item.result.issues.length > 0 && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-3">検出された問題点</h5>
                              <div className="space-y-2">
                                {item.result.issues.map((issue: any, issueIndex: number) => (
                                  <div key={issueIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(issue.severity)}`}>
                                        {issue.severity}
                                      </span>
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="text-sm font-medium text-gray-700">{issue.category}</span>
                                        </div>
                                        <p className="text-sm text-gray-800 mb-2">{issue.description}</p>
                                        {issue.suggestion && (
                                          <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                                            💡 {issue.suggestion}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white border border-gray-200 rounded p-4">
                          <h5 className="font-medium text-gray-900 mb-2">生のレスポンス</h5>
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                            {item.originalResponse}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                  });
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                品質チェック結果は利用できません
              </div>
            )}
          </div>
        )}

        {/* コピー成功ポップアップ */}
        <CopySuccessPopup message={copySuccess} isVisible={!!copySuccess} />

        <div className="flex justify-end pt-4">
          <button
            onClick={() => {
              if (onComplete) {
                onComplete();
              } else {
                onClose();
              }
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
}