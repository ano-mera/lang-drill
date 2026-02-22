import { useState, useEffect } from "react";
import { Passage, Question, Document } from "@/lib/types";

interface AdminPassageEditorProps {
  passage: Passage;
  onSave: (passage: Passage) => void;
  onCancel: () => void;
}

export default function AdminPassageEditor({ passage, onSave, onCancel }: AdminPassageEditorProps) {
  // 安全な初期化
  const safePassage = {
    ...passage,
    questions: passage.questions.map(q => ({
      ...q,
      optionTranslations: q.optionTranslations || ["", "", "", ""]
    }))
  };
  
  const [editedPassage, setEditedPassage] = useState<Passage>(safePassage);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    const safePassage = {
      ...passage,
      questions: passage.questions.map(q => ({
        ...q,
        optionTranslations: q.optionTranslations || ["", "", "", ""]
      }))
    };
    setEditedPassage(safePassage);
  }, [passage]);

  const handleInputChange = (field: keyof Passage, value: any) => {
    setEditedPassage((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMetadataChange = (field: keyof Passage["metadata"], value: any) => {
    setEditedPassage((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value,
      },
    }));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    setEditedPassage((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    }));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${editedPassage.questions.length + 1}`,
      question: "",
      options: ["", "", "", ""],
      correct: "A",
      explanation: "",
      questionTranslation: "",
      optionTranslations: ["", "", "", ""],
    };

    setEditedPassage((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const removeQuestion = (index: number) => {
    setEditedPassage((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleDocumentChange = (index: number, field: keyof Document, value: any) => {
    if (!editedPassage.documents) return;
    
    setEditedPassage((prev) => ({
      ...prev,
      documents: prev.documents!.map((doc, i) => (i === index ? { ...doc, [field]: value } : doc)),
    }));
  };

  const handleSave = () => {
    // 語数を計算（2資料問題の場合は各文書の語数を合計）
    let wordCount = 0;
    if (editedPassage.isMultiDocument && editedPassage.documents) {
      wordCount = editedPassage.documents.reduce((total, doc) => {
        return total + (doc.content ? doc.content.split(/\s+/).length : 0);
      }, 0);
    } else {
      wordCount = (editedPassage.content || "").split(/\s+/).length;
    }
    
    const updatedPassage = {
      ...editedPassage,
      metadata: {
        ...editedPassage.metadata,
        wordCount,
        questionCount: editedPassage.questions.length,
      },
    };
    onSave(updatedPassage);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">{passage.id ? "問題を編集" : "新しい問題を作成"}</h2>
            {editedPassage.id && (
              <a
                href={`/?id=${editedPassage.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>サイトで見る</span>
              </a>
            )}
          </div>
          <div className="flex space-x-2">
            <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md text-sm font-medium">
              キャンセル
            </button>
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              保存
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* タブ */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {["basic", "content", "questions"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab === "basic" && "基本情報"}
                {tab === "content" && "内容"}
                {tab === "questions" && `質問 (${editedPassage.questions.length})`}
              </button>
            ))}
          </nav>
        </div>

        {/* 基本情報タブ */}
        {activeTab === "basic" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                {editedPassage.id || "新規作成時に自動生成"}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">タイトル</label>
              <input
                type="text"
                value={editedPassage.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">タイプ</label>
                <select
                  value={editedPassage.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="article">記事</option>
                  <option value="email">メール</option>
                  <option value="advertisement">広告</option>
                  <option value="chart">図表</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">難易度</label>
                <select
                  value={editedPassage.metadata.difficulty}
                  onChange={(e) => handleMetadataChange("difficulty", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">資料形式</label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                  {editedPassage.isMultiDocument ? "2資料問題" : "単一資料問題"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">推定時間（秒）</label>
                <input
                  type="number"
                  value={editedPassage.metadata.estimatedTime}
                  onChange={(e) => handleMetadataChange("estimatedTime", parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">トピック</label>
                <input
                  type="text"
                  value={editedPassage.metadata.topic}
                  onChange={(e) => handleMetadataChange("topic", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 内容タブ */}
        {activeTab === "content" && (
          <div className="space-y-4">
            {editedPassage.isMultiDocument && editedPassage.documents ? (
              // 2資料問題の場合
              <>
                {editedPassage.documents.map((document, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">文書 {index + 1}</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">文書タイプ</label>
                          <select
                            value={document.type}
                            onChange={(e) => handleDocumentChange(index, "type", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="article">記事</option>
                            <option value="email">メール</option>
                            <option value="advertisement">広告</option>
                            <option value="chart">図表</option>
                            <option value="notice">お知らせ</option>
                            <option value="memo">メモ</option>
                            <option value="form">フォーム</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">タイトル</label>
                          <input
                            type="text"
                            value={document.title}
                            onChange={(e) => handleDocumentChange(index, "title", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="文書のタイトル"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">英語内容</label>
                        <textarea
                          value={document.content}
                          onChange={(e) => handleDocumentChange(index, "content", e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="英語の内容を入力してください..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">日本語翻訳</label>
                        <textarea
                          value={document.contentTranslation}
                          onChange={(e) => handleDocumentChange(index, "contentTranslation", e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="日本語の翻訳を入力してください..."
                        />
                      </div>

                      {/* 文書内の図表情報を表示 */}
                      {document.hasChart && document.chart && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="text-md font-medium mb-2 text-blue-600">図表情報</h4>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="mb-2">
                              <span className="font-medium text-sm">タイトル:</span>
                              <span className="ml-2 text-sm">{document.chart.title}</span>
                            </div>
                            <div className="mb-2">
                              <span className="font-medium text-sm">タイプ:</span>
                              <span className="ml-2 text-sm">{document.chart.type}</span>
                            </div>
                            <div>
                              <span className="font-medium text-sm">データ:</span>
                              <pre className="ml-2 text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                                {JSON.stringify(document.chart.data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              // 単一資料問題の場合
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">英語内容</label>
                  <textarea
                    value={editedPassage.content}
                    onChange={(e) => handleInputChange("content", e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="英語の内容を入力してください..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">日本語翻訳</label>
                  <textarea
                    value={editedPassage.contentTranslation}
                    onChange={(e) => handleInputChange("contentTranslation", e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="日本語の翻訳を入力してください..."
                  />
                </div>

                {/* 単一資料問題の図表情報を表示 */}
                {editedPassage.hasChart && editedPassage.chart && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-md font-medium mb-2 text-blue-600">図表情報</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="mb-2">
                        <span className="font-medium text-sm">タイトル:</span>
                        <span className="ml-2 text-sm">{editedPassage.chart.title}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-medium text-sm">タイプ:</span>
                        <span className="ml-2 text-sm">{editedPassage.chart.type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-sm">データ:</span>
                        <pre className="ml-2 text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                          {JSON.stringify(editedPassage.chart.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 質問タブ */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            {editedPassage.questions.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">質問 {index + 1}</h4>
                  <button onClick={() => removeQuestion(index)} className="text-red-600 hover:text-red-800 text-sm">
                    削除
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">質問（英語）</label>
                    <input
                      type="text"
                      value={question.question}
                      onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">質問（日本語）</label>
                    <input
                      type="text"
                      value={question.questionTranslation}
                      onChange={(e) => handleQuestionChange(index, "questionTranslation", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">選択肢</label>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            value={String.fromCharCode(65 + optionIndex)}
                            checked={question.correct === String.fromCharCode(65 + optionIndex)}
                            onChange={(e) => handleQuestionChange(index, "correct", e.target.value)}
                            className="text-blue-600"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...question.options];
                              newOptions[optionIndex] = e.target.value;
                              handleQuestionChange(index, "options", newOptions);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`選択肢 ${String.fromCharCode(65 + optionIndex)}`}
                          />
                          <input
                            type="text"
                            value={(question.optionTranslations && question.optionTranslations[optionIndex]) || ""}
                            onChange={(e) => {
                              const currentTranslations = question.optionTranslations || [];
                              const newTranslations = [...currentTranslations];
                              // 配列が短い場合は拡張
                              while (newTranslations.length <= optionIndex) {
                                newTranslations.push("");
                              }
                              newTranslations[optionIndex] = e.target.value;
                              handleQuestionChange(index, "optionTranslations", newTranslations);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`選択肢 ${String.fromCharCode(65 + optionIndex)} の翻訳`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">解説</label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) => handleQuestionChange(index, "explanation", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="正解の解説を入力してください..."
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addQuestion}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
            >
              + 質問を追加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
