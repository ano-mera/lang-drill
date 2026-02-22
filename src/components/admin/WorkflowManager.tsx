"use client";

import { useState, useEffect } from "react";
import WorkflowViewer from "./WorkflowViewer";

export default function WorkflowManager() {
  const [mermaidCode, setMermaidCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastModified, setLastModified] = useState("");

  // ワークフロー図を読み込み
  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workflow");
      const result = await response.json();
      
      if (result.success) {
        setMermaidCode(result.data);
        setEditedCode(result.data);
        setLastModified(result.lastModified);
        setError("");
      } else {
        setError(result.error || "読み込みに失敗しました");
      }
    } catch (err) {
      console.error("Load workflow error:", err);
      setError("ワークフロー図の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // ワークフロー図を保存
  const saveWorkflow = async () => {
    try {
      setSaving(true);
      setError("");
      
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: editedCode }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMermaidCode(editedCode);
        setLastModified(result.lastModified);
        setIsEditing(false);
        setError("");
      } else {
        setError(result.error || "保存に失敗しました");
      }
    } catch (err) {
      console.error("Save workflow error:", err);
      setError("ワークフロー図の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  // 編集をキャンセル
  const cancelEdit = () => {
    setEditedCode(mermaidCode);
    setIsEditing(false);
    setError("");
  };


  useEffect(() => {
    loadWorkflow();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">ワークフロー図を読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">問題生成ワークフロー図</h2>
            {lastModified && (
              <p className="text-sm text-gray-500 mt-1">
                最終更新: {new Date(lastModified).toLocaleString("ja-JP")}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800 rounded-md text-sm font-medium"
                >
                  編集
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md text-sm font-medium"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveWorkflow}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {saving ? "保存中..." : "保存"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="p-6">
        {isEditing ? (
          /* 編集モード */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mermaid記法でワークフロー図を定義
              </label>
              <textarea
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="flowchart TD&#10;    A[開始] --> B[処理]&#10;    B --> C[終了]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mermaidフローチャート記法で記述してください。
                <a 
                  href="https://mermaid.js.org/syntax/flowchart.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 ml-1"
                >
                  記法の詳細 →
                </a>
              </p>
            </div>
          </div>
        ) : (
          /* 表示モード */
          <WorkflowViewer 
            mermaidCode={mermaidCode} 
          />
        )}
      </div>
    </div>
  );
}