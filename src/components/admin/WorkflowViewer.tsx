"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

interface WorkflowViewerProps {
  mermaidCode: string;
}

export default function WorkflowViewer({ mermaidCode }: WorkflowViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mermaidInitialized = useRef(false);

  useEffect(() => {
    const initializeAndRender = async () => {
      if (typeof window === "undefined") return;

      try {
        // Mermaidを初期化（一回のみ）
        if (!mermaidInitialized.current) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            flowchart: {
              htmlLabels: true,
              curve: "basis"
            }
          });
          mermaidInitialized.current = true;
        }

        // 図表をレンダリング
        await renderDiagram();
      } catch (error) {
        console.error("Mermaid initialization error:", error);
      }
    };

    const renderDiagram = async () => {
      if (!containerRef.current || !mermaidCode.trim()) return;

      try {
        // 既存の図表をクリア
        containerRef.current.innerHTML = "";
        
        // Mermaidで図表を生成
        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, mermaidCode);
        containerRef.current.innerHTML = svg;
      } catch (error) {
        console.error("Mermaid render error:", error);
        containerRef.current.innerHTML = `
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p class="font-medium">図表の描画に失敗しました</p>
            <p class="text-sm mt-1">Mermaid記法を確認してください</p>
          </div>
        `;
      }
    };

    initializeAndRender();
  }, [mermaidCode]);

  return (
    <div className="w-full">
      <div 
        ref={containerRef}
        className="w-full overflow-x-auto bg-white border border-gray-200 rounded-lg p-4 min-h-[200px] flex items-center justify-center"
      >
        <div className="text-gray-500">図表を読み込み中...</div>
      </div>
    </div>
  );
}