import { useState } from "react";

interface BulkGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (difficulty: string, count: number, hasChart: boolean, isMultiDocument?: boolean) => void;
  isGenerating: boolean;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  // Part 7専用設定
  modalType?: 'general' | 'part7_single_text' | 'part7_single_chart' | 'part7_double';
  title?: string;
  description?: string;
}

export default function BulkGenerationModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  soundEnabled,
  onSoundToggle,
  modalType = 'general',
  title,
  description,
}: BulkGenerationModalProps) {
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [count, setCount] = useState<number>(1);
  
  // modalTypeに基づいて固定パラメータを設定
  const getFixedParams = () => {
    switch (modalType) {
      case 'part7_single_text':
        return { hasChart: false, isMultiDocument: false };
      case 'part7_single_chart':
        return { hasChart: true, isMultiDocument: false };
      case 'part7_double':
        return { hasChart: false, isMultiDocument: true };
      default:
        return { hasChart: false, isMultiDocument: false };
    }
  };
  
  const fixedParams = getFixedParams();
  const [hasChart, setHasChart] = useState<boolean>(fixedParams.hasChart);
  const [isMultiDocument, setIsMultiDocument] = useState<boolean>(fixedParams.isMultiDocument);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Part 7専用の場合は固定パラメータを使用、それ以外は状態値を使用
    const params = modalType !== 'general' ? fixedParams : { hasChart, isMultiDocument };
    onGenerate(difficulty, count, params.hasChart, params.isMultiDocument);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title || '問題の一括生成'}</h3>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              難易度
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={isGenerating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生成数
            </label>
            <select
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              disabled={isGenerating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
              <option value={11}>11</option>
              <option value={12}>12</option>
              <option value={13}>13</option>
              <option value={14}>14</option>
              <option value={15}>15</option>
              <option value={16}>16</option>
              <option value={17}>17</option>
              <option value={18}>18</option>
              <option value={19}>19</option>
              <option value={20}>20</option>
            </select>
          </div>

          {/* Part 7専用の場合は説明のみ表示、一般の場合は設定項目を表示 */}
          {modalType !== 'general' ? (
            description && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800" dangerouslySetInnerHTML={{ __html: description }} />
              </div>
            )
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  資料形式
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="documentFormat"
                      checked={!isMultiDocument}
                      onChange={() => setIsMultiDocument(false)}
                      disabled={isGenerating}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">単一資料</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="documentFormat"
                      checked={isMultiDocument}
                      onChange={() => setIsMultiDocument(true)}
                      disabled={isGenerating}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">2資料</span>
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {isMultiDocument ? "2つの資料を組み合わせた問題を生成します" : "1つの資料に基づく問題を生成します"}
                </p>
              </div>

              {!isMultiDocument && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    問題タイプ
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="chartType"
                        checked={!hasChart}
                        onChange={() => setHasChart(false)}
                        disabled={isGenerating}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">通常問題（文書のみ）</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="chartType"
                        checked={hasChart}
                        onChange={() => setHasChart(true)}
                        disabled={isGenerating}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">図表付き問題</span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {hasChart ? "表・グラフ付きの問題を生成します" : "文書のみの問題を生成します"}
                  </p>
                </div>
              )}
            </>
          )}

          {isGenerating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-blue-800 font-medium">問題生成中...</span>
              </div>
              <p className="text-blue-700 text-sm mt-2">
                {difficulty.toUpperCase()}難易度で{count}問の{
                  modalType === 'part7_double' ? "2資料" :
                  modalType === 'part7_single_chart' ? "図表付き" :
                  modalType === 'part7_single_text' ? "テキスト" :
                  fixedParams.isMultiDocument ? "2資料" : 
                  fixedParams.hasChart ? "図表付き" : "通常"
                }問題を生成しています。
                この処理には数分かかる場合があります。
              </p>
            </div>
          )}

          {/* 完了音設定 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">完了音を再生する</span>
              <button
                type="button"
                onClick={onSoundToggle}
                disabled={isGenerating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              生成完了時に音でお知らせします
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
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