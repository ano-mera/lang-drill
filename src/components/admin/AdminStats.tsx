import { Passage } from "@/lib/types";

interface AdminStatsProps {
  passages: Passage[];
}

export default function AdminStats({ passages }: AdminStatsProps) {
  // 基本統計
  const totalPassages = passages.length;
  const totalQuestions = passages.reduce((sum, passage) => sum + passage.questions.length, 0);
  const totalWordCount = passages.reduce((sum, passage) => sum + passage.metadata.wordCount, 0);

  // 資料形式別統計
  const singleDocumentPassages = passages.filter((p) => !p.isMultiDocument);
  const multiDocumentPassages = passages.filter((p) => p.isMultiDocument);

  // 単一資料問題の統計
  const singleDocStats = {
    total: singleDocumentPassages.length,
    easy: singleDocumentPassages.filter((p) => p.metadata.difficulty === "easy").length,
    medium: singleDocumentPassages.filter((p) => p.metadata.difficulty === "medium").length,
    hard: singleDocumentPassages.filter((p) => p.metadata.difficulty === "hard").length,
    chart: singleDocumentPassages.filter((p) => p.hasChart).length,
    regular: singleDocumentPassages.filter((p) => !p.hasChart).length,
    questions: singleDocumentPassages.reduce((sum, passage) => sum + passage.questions.length, 0),
    wordCount: singleDocumentPassages.reduce((sum, passage) => sum + passage.metadata.wordCount, 0)
  };

  // 単一資料問題の図表付き問題を難易度別に集計
  const singleDocChartStats = {
    easy: singleDocumentPassages.filter((p) => p.hasChart && p.metadata.difficulty === "easy").length,
    medium: singleDocumentPassages.filter((p) => p.hasChart && p.metadata.difficulty === "medium").length,
    hard: singleDocumentPassages.filter((p) => p.hasChart && p.metadata.difficulty === "hard").length,
  };

  // 単一資料問題の通常問題を難易度別に集計
  const singleDocRegularStats = {
    easy: singleDocumentPassages.filter((p) => !p.hasChart && p.metadata.difficulty === "easy").length,
    medium: singleDocumentPassages.filter((p) => !p.hasChart && p.metadata.difficulty === "medium").length,
    hard: singleDocumentPassages.filter((p) => !p.hasChart && p.metadata.difficulty === "hard").length,
  };

  // 2資料問題の統計
  const multiDocStats = {
    total: multiDocumentPassages.length,
    easy: multiDocumentPassages.filter((p) => p.metadata.difficulty === "easy").length,
    medium: multiDocumentPassages.filter((p) => p.metadata.difficulty === "medium").length,
    hard: multiDocumentPassages.filter((p) => p.metadata.difficulty === "hard").length,
    questions: multiDocumentPassages.reduce((sum, passage) => sum + passage.questions.length, 0),
    wordCount: multiDocumentPassages.reduce((sum, passage) => sum + passage.metadata.wordCount, 0)
  };

  // 単一資料問題のタイプ別統計
  const singleDocTypeStats = singleDocumentPassages.reduce((acc, passage) => {
    if (!acc[passage.type]) {
      acc[passage.type] = { total: 0, chart: 0 };
    }
    acc[passage.type].total += 1;
    if (passage.hasChart) {
      acc[passage.type].chart += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; chart: number }>);

  // 2資料問題のタイプ別統計（資料の組み合わせを表示）
  const multiDocTypeStats = multiDocumentPassages.reduce((acc, passage) => {
    if (passage.documents && passage.documents.length > 0) {
      const types = passage.documents.map(doc => doc.type).sort().join(" + ");
      if (!acc[types]) {
        acc[types] = 0;
      }
      acc[types] += 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">統計</h3>

      <div className="space-y-6">
        {/* 全体統計 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalPassages}</div>
            <div className="text-sm text-gray-600">総問題数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalQuestions}</div>
            <div className="text-sm text-gray-600">総質問数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalWordCount.toLocaleString()}</div>
            <div className="text-sm text-gray-600">総語数</div>
          </div>
        </div>

        {/* 資料形式別統計 */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">資料形式別</h4>
          <div className="grid grid-cols-2 gap-4">
            {/* 単一資料 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-2">単一資料問題</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>問題数</span>
                  <span className="font-medium">{singleDocStats.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>質問数</span>
                  <span className="font-medium">{singleDocStats.questions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>語数</span>
                  <span className="font-medium">{singleDocStats.wordCount.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Easy</span>
                      <span>{singleDocStats.easy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium</span>
                      <span>{singleDocStats.medium}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hard</span>
                      <span>{singleDocStats.hard}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>通常</span>
                      <span>{singleDocStats.regular}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>図表付き</span>
                      <span>{singleDocStats.chart}</span>
                    </div>
                  </div>
                </div>
                {singleDocStats.regular > 0 && (
                  <div className="border-t pt-2 mt-2">
                    <div className="text-xs text-green-600 font-medium mb-1">通常 (難易度別):</div>
                    <div className="text-xs text-gray-600 space-y-1 ml-2">
                      <div className="flex justify-between">
                        <span>Easy</span>
                        <span>{singleDocRegularStats.easy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medium</span>
                        <span>{singleDocRegularStats.medium}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hard</span>
                        <span>{singleDocRegularStats.hard}</span>
                      </div>
                    </div>
                  </div>
                )}
                {singleDocStats.chart > 0 && (
                  <div className="border-t pt-2 mt-2">
                    <div className="text-xs text-blue-600 font-medium mb-1">図表付き (難易度別):</div>
                    <div className="text-xs text-gray-600 space-y-1 ml-2">
                      <div className="flex justify-between">
                        <span>Easy</span>
                        <span>{singleDocChartStats.easy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medium</span>
                        <span>{singleDocChartStats.medium}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hard</span>
                        <span>{singleDocChartStats.hard}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2資料 */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-medium text-green-800 mb-2">2資料問題</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>問題数</span>
                  <span className="font-medium">{multiDocStats.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>質問数</span>
                  <span className="font-medium">{multiDocStats.questions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>語数</span>
                  <span className="font-medium">{multiDocStats.wordCount.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Easy</span>
                      <span>{multiDocStats.easy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium</span>
                      <span>{multiDocStats.medium}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hard</span>
                      <span>{multiDocStats.hard}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 単一資料問題のタイプ別統計 */}
        {singleDocStats.total > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">単一資料問題 - タイプ別</h4>
            <div className="space-y-2">
              {Object.entries(singleDocTypeStats).map(([type, stats]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{type}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium">{stats.total}</span>
                    {stats.chart > 0 && (
                      <div className="text-xs text-blue-600">図表付き: {stats.chart}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2資料問題のタイプ別統計 */}
        {multiDocStats.total > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">2資料問題 - 資料組み合わせ</h4>
            <div className="space-y-2">
              {Object.entries(multiDocTypeStats).map(([types, count]) => (
                <div key={types} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{types}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
