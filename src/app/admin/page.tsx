"use client";

import { useState, useEffect } from "react";
import { Passage, TOEICPart } from "@/lib/types";
import AdminPassageList from "@/components/admin/AdminPassageList";
import AdminPassageEditor from "@/components/admin/AdminPassageEditor";
import AdminStats from "@/components/admin/AdminStats";
import AdminHeader from "@/components/admin/AdminHeader";
import BulkGenerationModal from "@/components/admin/BulkGenerationModal";
import Part1GenerationModal from "@/components/admin/Part1GenerationModal";
import Part2GenerationModal from "@/components/admin/Part2GenerationModal";
import Part3GenerationModal from "@/components/admin/Part3GenerationModal";
import Part4GenerationModal from "@/components/admin/Part4GenerationModal";
import Part5GenerationModal from "@/components/admin/Part5GenerationModal";
import Part6GenerationModal from "@/components/admin/Part6GenerationModal";
import GenerationResultModal from "@/components/admin/GenerationResultModal";
import WorkflowManager from "@/components/admin/WorkflowManager";

export default function AdminPage() {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [filteredPassages, setFilteredPassages] = useState<Passage[]>([]);
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [documentFormatFilter, setDocumentFormatFilter] = useState<string>("all");
  const [hasChartFilter, setHasChartFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [showPart1GenerationModal, setShowPart1GenerationModal] = useState(false);
  const [showPart2GenerationModal, setShowPart2GenerationModal] = useState(false);
  const [showPart3GenerationModal, setShowPart3GenerationModal] = useState(false);
  const [showPart4GenerationModal, setShowPart4GenerationModal] = useState(false);
  const [showPart5GenerationModal, setShowPart5GenerationModal] = useState(false);
  const [showPart6GenerationModal, setShowPart6GenerationModal] = useState(false);
  const [showPart7SingleTextModal, setShowPart7SingleTextModal] = useState(false);
  const [showPart7SingleChartModal, setShowPart7SingleChartModal] = useState(false);
  const [showPart7DoubleModal, setShowPart7DoubleModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [showResultModal, setShowResultModal] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"passages" | "workflow">("passages");
  const [partFilter, setPartFilter] = useState<TOEICPart | "all">("all");

  // 完了音を再生する関数
  const playCompletionSound = () => {
    if (!soundEnabled) return;
    
    try {
      // Web Audio APIを使用してビープ音を生成
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 2つの音を順番に再生（完了感のある音）
      const frequencies = [800, 1000]; // Hz
      let startTime = audioContext.currentTime;
      
      frequencies.forEach((freq) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        // 音量の設定（フェードイン・フェードアウト）
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.05, startTime + 0.3 - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + 0.3);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
        
        startTime += 0.2; // 次の音までの間隔
      });
      
      console.log('🔊 完了音を再生しました');
    } catch (error) {
      console.warn('音の再生に失敗しました:', error);
    }
  };

  useEffect(() => {
    loadPassages();
  }, []);

  useEffect(() => {
    filterPassages();
  }, [passages, searchTerm, idFilter, difficultyFilter, typeFilter, documentFormatFilter, hasChartFilter, sortBy, partFilter]);

  const loadPassages = async () => {
    try {
      // 既存のpassagesを読み込み
      const passagesResponse = await fetch("/api/passages");
      const passagesData = await passagesResponse.json();
      let allPassages = passagesData.passages || [];

      // Part 5問題を読み込み
      try {
        const part5Response = await fetch("/api/part5-questions");
        const part5Data = await part5Response.json();
        if (Array.isArray(part5Data) && part5Data.length > 0) {
          // Part 5データをPassage形式に変換
          const part5Passages = part5Data.map(question => ({
            id: question.id,
            title: `Part 5 問題: ${question.id}`,
            type: "part5_question",
            content: question.sentence,
            metadata: {
              difficulty: question.difficulty,
              estimatedTime: 1, // Part 5は通常1分程度
              wordCount: question.sentence.split(' ').length,
              questionCount: 1,
              passageType: "part5_question",
              topic: question.topic || question.category
            },
            questions: [{
              id: question.id,
              question: question.question,
              options: question.options,
              correct: question.correct,
              explanation: question.explanation,
              questionTranslation: question.questionTranslation,
              optionTranslations: question.optionTranslations
            }],
            contentTranslation: question.questionTranslation,
            createdAt: question.createdAt,
            generationBatch: question.generationBatch,
            toeicPart: "part5",
            part5Data: question // 元のPart 5データを保持
          }));
          allPassages = [...allPassages, ...part5Passages];
        }
      } catch (part5Error) {
        console.warn("Failed to load Part 5 questions:", part5Error);
      }

      // Part 6問題を読み込み
      try {
        const part6Response = await fetch("/api/part6-questions");
        const part6Data = await part6Response.json();
        if (Array.isArray(part6Data) && part6Data.length > 0) {
          // Part 6データをPassage形式に変換
          const part6Passages = part6Data.map(question => ({
            id: question.id,
            title: `Part 6 問題: ${question.title || question.id}`,
            type: "part6_question",
            content: question.content,
            metadata: {
              difficulty: question.difficulty,
              estimatedTime: 4, // Part 6は通常4問で4分程度
              wordCount: question.content.split(' ').length,
              questionCount: 4, // Part 6は4問セット
              passageType: "part6_question",
              topic: question.topic || question.documentType
            },
            questions: question.questions || [],
            contentTranslation: question.contentTranslation,
            createdAt: question.createdAt,
            generationBatch: question.generationBatch,
            toeicPart: "part6",
            part6Data: question // 元のPart 6データを保持
          }));
          allPassages = [...allPassages, ...part6Passages];
        }
      } catch (part6Error) {
        console.warn("Failed to load Part 6 questions:", part6Error);
      }

      setPassages(allPassages);
    } catch (error) {
      console.error("Failed to load passages:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPassages = () => {
    let filtered = passages;

    // TOEIC Part フィルター
    if (partFilter !== "all") {
      filtered = filtered.filter((passage) => passage.toeicPart === partFilter);
    }

    // 検索フィルター
    if (searchTerm) {
      filtered = filtered.filter(
        (passage) =>
          passage.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          passage.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          passage.metadata.topic.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // IDフィルター
    if (idFilter) {
      filtered = filtered.filter((passage) => passage.id.toLowerCase() === idFilter.toLowerCase());
    }

    // 難易度フィルター
    if (difficultyFilter !== "all") {
      filtered = filtered.filter((passage) => passage.metadata.difficulty === difficultyFilter);
    }

    // タイプフィルター
    if (typeFilter !== "all") {
      filtered = filtered.filter((passage) => passage.type === typeFilter);
    }

    // 資料形式フィルター
    if (documentFormatFilter !== "all") {
      if (documentFormatFilter === "single") {
        filtered = filtered.filter((passage) => !passage.isMultiDocument);
      } else if (documentFormatFilter === "multi") {
        filtered = filtered.filter((passage) => passage.isMultiDocument);
      }
    }

    // 図表付きフィルター
    if (hasChartFilter !== "all") {
      if (hasChartFilter === "with_chart") {
        filtered = filtered.filter((passage) => passage.hasChart || passage.chart);
      } else if (hasChartFilter === "without_chart") {
        filtered = filtered.filter((passage) => !passage.hasChart && !passage.chart);
      }
    }

    // ソート処理
    const sortedFiltered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "createdAt":
          // 作成日時順（新しい順）
          // createdAtがある問題を最優先で上に表示
          if (a.createdAt && !b.createdAt) return -1;
          if (!a.createdAt && b.createdAt) return 1;
          
          if (a.createdAt && b.createdAt) {
            // 両方ともcreatedAtがある場合は日時でソート
            const aDate = new Date(a.createdAt);
            const bDate = new Date(b.createdAt);
            const timeDiff = bDate.getTime() - aDate.getTime();
            if (timeDiff !== 0) return timeDiff;
            // 作成日時が同じ場合はIDでソート
            const getIdNumber = (id: string) => {
              // passage123 または chart_passage123 の形式に対応
              const match = id.match(/^(?:chart_)?passage(\d+)$/);
              return match ? parseInt(match[1]) : 0;
            };
            return getIdNumber(b.id) - getIdNumber(a.id);
          }
          
          // 両方ともcreatedAtがない場合
          if (a.generationBatch && !b.generationBatch) return -1;
          if (!a.generationBatch && b.generationBatch) return 1;
          
          // 最後はIDでソート（新しいIDが上に）
          // ID文字列から数値部分を抽出して数値比較
          const getIdNumber = (id: string) => {
            // passage123 または chart_passage123 の形式に対応
            const match = id.match(/^(?:chart_)?passage(\d+)$/);
            return match ? parseInt(match[1]) : 0;
          };
          return getIdNumber(b.id) - getIdNumber(a.id);
        case "id":
          // ID順（昇順）
          return a.id.localeCompare(b.id);
        case "title":
          // タイトル順（昇順）
          return a.title.localeCompare(b.title);
        case "difficulty":
          // 難易度順（Easy < Medium < Hard）
          const difficultyOrder = { "easy": 0, "medium": 1, "hard": 2 };
          return difficultyOrder[a.metadata.difficulty] - difficultyOrder[b.metadata.difficulty];
        default:
          return 0;
      }
    });

    setFilteredPassages(sortedFiltered);
  };

  const handleEditPassage = (passage: Passage) => {
    setSelectedPassage(passage);
    setIsEditing(true);
    // 画面上部にスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSavePassage = async (updatedPassage: Passage) => {
    try {
      const response = await fetch(`/api/passages/${updatedPassage.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPassage),
      });

      if (response.ok) {
        setPassages((prev) => prev.map((p) => (p.id === updatedPassage.id ? updatedPassage : p)));
        setIsEditing(false);
        setSelectedPassage(null);
      }
    } catch (error) {
      console.error("Failed to save passage:", error);
    }
  };

  const handleDeletePassage = async (passageId: string) => {
    if (!confirm("この問題を削除しますか？")) return;

    try {
      let response;
      
      // Part 5問題の場合は専用のAPIを使用
      if (passageId.startsWith('part5_')) {
        response = await fetch(`/api/part5-questions`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: passageId })
        });
      } else if (passageId.startsWith('part6_')) {
        // Part 6問題の場合は専用のAPIを使用
        response = await fetch(`/api/part6-questions`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: passageId })
        });
      } else {
        // 他のpartは既存のAPIを使用
        response = await fetch(`/api/passages/${passageId}`, {
          method: "DELETE",
        });
      }

      if (response.ok) {
        setPassages((prev) => prev.filter((p) => p.id !== passageId));
        if (selectedPassage?.id === passageId) {
          setSelectedPassage(null);
          setIsEditing(false);
        }
        // Part 3問題の場合の処理（必要に応じて追加）
      }
    } catch (error) {
      console.error("Failed to delete passage:", error);
    }
  };



  const handlePart1Generate = async (difficulty: string, count: number, scene?: string, voiceProfile?: any, includePeople?: boolean) => {
    setIsGenerating(true);
    
    console.log('🚀 Admin page received values:', { difficulty, count, scene, voiceProfile, includePeople });
    
    try {
      const requestBody: any = { difficulty, count };
      if (scene) requestBody.scene = scene;
      if (voiceProfile) requestBody.voiceProfile = voiceProfile;
      if (includePeople !== undefined) requestBody.includePeople = includePeople;
      console.log('📤 Sending to API:', requestBody);
      
      // 安全版APIを呼び出し
      const response = await fetch("/api/part1-questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📨 API Response status:', response.status);
      const result = await response.json();
      console.log('📨 API Response result:', result);

      if (response.ok) {
        console.log('✅ Generation successful!');
        
        // Save the new batch ID to localStorage
        if (result.batchId) {
          localStorage.setItem('latestPart1GenerationBatch', result.batchId);
          console.log('💾 Saved batch ID:', result.batchId);
        }
        
        // Reload passages to show newly generated ones (if needed)
        console.log('🔄 Reloading passages...');
        await loadPassages();
        
        console.log('🚪 Closing generation modal...');
        setShowPart1GenerationModal(false);
        
        // Play completion sound
        console.log('🔊 Playing completion sound...');
        playCompletionSound();
        
        // Show result modal
        console.log('📋 Setting generation result and showing modal...');
        setGenerationResult(result);
        setShowResultModal(true);
        console.log('✨ Part 1 generation completed successfully!');
      } else {
        console.log('❌ Generation failed:', result);
        setGenerationResult({
          success: false,
          message: result.message || "Part 1問題生成中にエラーが発生しました",
          error: result.error || "Unknown error"
        });
        setShowResultModal(true);
      }
    } catch (error) {
      console.error("Part 1 Generation error:", error);
      setGenerationResult({
        success: false,
        message: "Part 1問題生成中にエラーが発生しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
      setShowResultModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePart2Generate = async (difficulty: string, count: number, questionType?: string, topic?: string) => {
    setIsGenerating(true);
    
    try {
      // Part 2 API を呼び出し
      const response = await fetch("/api/part2-questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ difficulty, count, questionType, topic }),
      });

      const result = await response.json();

      if (response.ok) {
        // Save the new batch ID to localStorage
        if (result.batchId) {
          localStorage.setItem('latestPart2GenerationBatch', result.batchId);
        }
        
        // Reload passages to show newly generated ones (if needed)
        await loadPassages();
        setShowPart2GenerationModal(false);
        
        // Play completion sound
        playCompletionSound();
        
        // Show result modal
        setGenerationResult(result);
        setShowResultModal(true);
      } else {
        setGenerationResult({
          success: false,
          message: result.message || "Part 2問題生成中にエラーが発生しました",
          error: result.error || "Unknown error"
        });
        setShowResultModal(true);
      }
    } catch (error) {
      console.error("Part 2 Generation error:", error);
      setGenerationResult({
        success: false,
        message: "Part 2問題生成中にエラーが発生しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
      setShowResultModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePart3Generate = async (difficulty: string, count: number, scenario?: string, industry?: string) => {
    setIsGenerating(true);
    console.log('🚀 Starting Part 3 generation:', { difficulty, count, scenario, industry });
    
    try {
      // Part 3 API を呼び出し
      const requestBody: any = { difficulty, count };
      if (scenario) {
        requestBody.scenario = scenario;
      }
      if (industry) {
        requestBody.industry = industry;
      }
      
      console.log('📤 Sending request to /api/part3-questions:', requestBody);
      
      const response = await fetch("/api/part3-questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status, response.ok);
      const result = await response.json();
      console.log('📦 Response data:', result);

      if (response.ok) {
        // Save the new batch ID to localStorage
        if (result.batchId) {
          localStorage.setItem('latestPart3GenerationBatch', result.batchId);
        }
        
        // Reload passages to show newly generated ones (if needed)
        await loadPassages();
        setShowPart3GenerationModal(false);
        
        // Play completion sound
        playCompletionSound();
        
        // Show result modal
        setGenerationResult(result);
        setShowResultModal(true);
      } else {
        setGenerationResult({
          success: false,
          message: result.message || "Part 3問題生成中にエラーが発生しました",
          error: result.error || "Unknown error"
        });
        setShowResultModal(true);
      }
    } catch (error) {
      console.error("Part 3 Generation error:", error);
      setGenerationResult({
        success: false,
        message: "Part 3問題生成中にエラーが発生しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
      setShowResultModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePart4Generate = async (difficulty: string, count: number, speechType?: string, industry?: string) => {
    setIsGenerating(true);
    
    try {
      // Part 4 API を呼び出し
      const requestBody: any = { difficulty, count };
      if (speechType) {
        requestBody.speechType = speechType;
      }
      if (industry) {
        requestBody.industry = industry;
      }
      
      const response = await fetch("/api/part4-questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        // Part4 APIは generatedIds を返すため、バッチIDを生成
        const batchId = `part4_batch_${Date.now()}`;
        localStorage.setItem('latestPart4GenerationBatch', batchId);
        
        // Reload passages to show newly generated ones (if needed)
        await loadPassages();
        setShowPart4GenerationModal(false);
        
        // Play completion sound
        playCompletionSound();
        
        // Show result modal with prompt data
        setGenerationResult({
          ...result,
          batchId: batchId,
          generationPrompts: result.promptData?.generationPrompts || [],
          qualityCheckPrompts: result.promptData?.qualityCheckPrompts || [],
          revisionPrompts: result.promptData?.revisionPrompts || []
        });
        setShowResultModal(true);
      } else {
        setGenerationResult({
          success: false,
          message: result.message || "Part 4問題生成中にエラーが発生しました",
          error: result.error || "Unknown error"
        });
        setShowResultModal(true);
      }
    } catch (error) {
      console.error("Part 4 Generation error:", error);
      setGenerationResult({
        success: false,
        message: "Part 4問題生成中にエラーが発生しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
      setShowResultModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePart5Generate = async (
    difficulty: string,
    count: number,
    category?: string,
    intent?: string,
    length?: string,
    vocabLevel?: string,
    optionsType?: string,
    answerIndex?: string
  ) => {
    setIsGenerating(true);
    
    try {
      const requestBody: any = { difficulty, count };
      if (category) requestBody.category = category;
      if (intent) requestBody.intent = intent;
      if (length) requestBody.length = length;
      if (vocabLevel) requestBody.vocabLevel = vocabLevel;
      if (optionsType) requestBody.optionsType = optionsType;
      if (answerIndex) requestBody.answerIndex = answerIndex;
      
      const response = await fetch("/api/part5-questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        const batchId = `part5_batch_${Date.now()}`;
        localStorage.setItem('latestPart5GenerationBatch', batchId);
        
        await loadPassages();
        setShowPart5GenerationModal(false);
        
        playCompletionSound();
        
        // Part 5のプロンプトデータをGenerationResultModal用の形式に変換
        const formattedResult = {
          ...result,
          batchId: batchId
        };

        // Part 5のプロンプトデータが存在する場合、GenerationResultModal用に変換
        if (result.promptData) {
          // 生成プロンプトを変換
          if (result.promptData.generationPrompts) {
            formattedResult.generationPrompts = result.promptData.generationPrompts.map((prompt: any) => ({
              prompt: `System Prompt:\n${prompt.systemPrompt}\n\nUser Prompt:\n${prompt.userPrompt}\n\nResponse:\n${prompt.response}`,
              promptType: prompt.type || 'part5_generation'
            }));
          }

          // 品質チェックプロンプトを変換
          if (result.promptData.qualityCheckPrompts) {
            formattedResult.qualityCheckPrompts = result.promptData.qualityCheckPrompts.map((prompt: any) => 
              typeof prompt === 'string' ? prompt : `${prompt.systemPrompt}\n\n${prompt.userPrompt}`
            );
          }

          // 修正プロンプトを変換
          if (result.promptData.revisionPrompts) {
            formattedResult.revisionPrompts = result.promptData.revisionPrompts.map((prompt: any) =>
              typeof prompt === 'string' ? prompt : `${prompt.systemPrompt}\n\n${prompt.userPrompt}`
            );
          }
        }
        
        setGenerationResult(formattedResult);
        setShowResultModal(true);
      } else {
        setGenerationResult({
          success: false,
          message: result.message || "Part 5問題生成中にエラーが発生しました",
          error: result.error || "Unknown error"
        });
        setShowResultModal(true);
      }
    } catch (error) {
      console.error("Part 5 Generation error:", error);
      setGenerationResult({
        success: false,
        message: "Part 5問題生成中にエラーが発生しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
      setShowResultModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePart6Generate = async (
    difficulty: string,
    count: number,
    documentType?: string,
    topic?: string
  ) => {
    setIsGenerating(true);
    
    try {
      const requestBody: any = { difficulty, count };
      if (documentType) requestBody.documentType = documentType;
      if (topic) requestBody.topic = topic;
      
      const response = await fetch("/api/part6-questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        const batchId = `part6_batch_${Date.now()}`;
        localStorage.setItem('latestPart6GenerationBatch', batchId);
        
        await loadPassages();
        setShowPart6GenerationModal(false);
        
        playCompletionSound();
        
        // Part 6のプロンプトデータをGenerationResultModal用の形式に変換
        const formattedResult = {
          ...result,
          batchId: batchId
        };

        // Part 6のプロンプトデータが存在する場合、GenerationResultModal用に変換
        if (result.promptData) {
          // 生成プロンプトを変換
          if (result.promptData.generationPrompts) {
            formattedResult.generationPrompts = result.promptData.generationPrompts.map((prompt: any) => ({
              prompt: prompt.prompt,
              promptType: prompt.promptType || 'part6_generation'
            }));
          }

          // 品質チェックプロンプトを変換
          if (result.promptData.qualityCheckPrompts) {
            formattedResult.qualityCheckPrompts = result.promptData.qualityCheckPrompts.map((prompt: any) => 
              typeof prompt === 'string' ? prompt : `${prompt.systemPrompt}\n\n${prompt.userPrompt}`
            );
          }

          // 修正プロンプトを変換
          if (result.promptData.revisionPrompts) {
            formattedResult.revisionPrompts = result.promptData.revisionPrompts.map((prompt: any) =>
              typeof prompt === 'string' ? prompt : `${prompt.systemPrompt}\n\n${prompt.userPrompt}`
            );
          }
        }
        
        setGenerationResult(formattedResult);
        setShowResultModal(true);
      } else {
        setGenerationResult({
          success: false,
          message: result.message || "Part 6問題生成中にエラーが発生しました",
          error: result.error || "Unknown error"
        });
        setShowResultModal(true);
      }
    } catch (error) {
      console.error("Part 6 Generation error:", error);
      setGenerationResult({
        success: false,
        message: "Part 6問題生成中にエラーが発生しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
      setShowResultModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkGenerate = async (difficulty: string, count: number, hasChart: boolean, isMultiDocument?: boolean) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/passages/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ difficulty, count, hasChart, isMultiDocument }),
      });

      const result = await response.json();

      if (response.ok) {
        // Save the new batch ID to localStorage
        if (result.batchId) {
          localStorage.setItem('latestGenerationBatch', result.batchId);
        }
        
        // Reload passages to show newly generated ones
        await loadPassages();
        setShowGenerationModal(false);
        
        // Play completion sound
        playCompletionSound();
        
        // Show result modal
        setGenerationResult(result);
        setShowResultModal(true);
      } else {
        setGenerationResult(result);
        setShowResultModal(true);
      }
    } catch (error) {
      console.error("Generation error:", error);
      setGenerationResult({
        success: false,
        message: "生成中にエラーが発生しました",
        errors: [error instanceof Error ? error.message : "Unknown error"]
      });
      setShowResultModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Part 7 Single Text Generation Handler
  const handlePart7SingleTextGenerate = async (difficulty: string, count: number) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/passages/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          difficulty, 
          count, 
          hasChart: false, 
          isMultiDocument: false,
          partType: 'part7_single_text'  
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.batchId) {
          localStorage.setItem('latestGenerationBatch', result.batchId);
        }
        
        await loadPassages();
        setShowPart7SingleTextModal(false);
        playCompletionSound();
        setGenerationResult(result);
        setShowResultModal(true);
      } else {
        setGenerationResult(result);
        setShowResultModal(true);
      }
    } catch (error) {
      console.error("Part 7 Single Text Generation error:", error);
      setGenerationResult({
        success: false,
        message: "Part 7 Single Text生成中にエラーが発生しました",
        errors: [error instanceof Error ? error.message : "Unknown error"]
      });
      setShowResultModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Part 7 Single Chart Generation Handler
  const handlePart7SingleChartGenerate = async (difficulty: string, count: number) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/passages/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          difficulty, 
          count, 
          hasChart: true, 
          isMultiDocument: false,
          partType: 'part7_single_chart'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.batchId) {
          localStorage.setItem('latestGenerationBatch', result.batchId);
        }
        
        await loadPassages();
        setShowPart7SingleChartModal(false);
        playCompletionSound();
        setGenerationResult(result);
        setShowResultModal(true);
      } else {
        setGenerationResult(result);
        setShowResultModal(true);
      }
    } catch (error) {
      console.error("Part 7 Single Chart Generation error:", error);
      setGenerationResult({
        success: false,
        message: "Part 7 Single Chart生成中にエラーが発生しました",
        errors: [error instanceof Error ? error.message : "Unknown error"]
      });
      setShowResultModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Part 7 Double Generation Handler
  const handlePart7DoubleGenerate = async (difficulty: string, count: number) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/passages/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          difficulty, 
          count, 
          hasChart: false, 
          isMultiDocument: true,
          partType: 'part7_double'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.batchId) {
          localStorage.setItem('latestGenerationBatch', result.batchId);
        }
        
        await loadPassages();
        setShowPart7DoubleModal(false);
        playCompletionSound();
        setGenerationResult(result);
        setShowResultModal(true);
      } else {
        setGenerationResult(result);
        setShowResultModal(true);
      }
    } catch (error) {
      console.error("Part 7 Double Generation error:", error);
      setGenerationResult({
        success: false,
        message: "Part 7 Double生成中にエラーが発生しました",
        errors: [error instanceof Error ? error.message : "Unknown error"]
      });
      setShowResultModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        soundEnabled={soundEnabled}
        onSoundToggle={(enabled) => setSoundEnabled(enabled)}
      />
      
      {/* タブナビゲーション */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("passages")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "passages" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              問題管理
            </button>
            <button
              onClick={() => setActiveTab("workflow")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "workflow" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              ワークフロー図
            </button>
          </nav>
        </div>
        
        {/* TOEIC Part選択（問題管理タブでのみ表示） */}
        {activeTab === "passages" && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">TOEIC Part選択</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPartFilter("all")}
                  className={`px-4 py-2 rounded-md font-medium text-sm ${
                    partFilter === "all"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setPartFilter("part1")}
                  className={`px-4 py-2 rounded-md font-medium text-sm ${
                    partFilter === "part1"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Part 1
                </button>
                <button
                  onClick={() => setPartFilter("part2")}
                  className={`px-4 py-2 rounded-md font-medium text-sm ${
                    partFilter === "part2"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Part 2
                </button>
                <button
                  onClick={() => setPartFilter("part3")}
                  className={`px-4 py-2 rounded-md font-medium text-sm ${
                    partFilter === "part3"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Part 3
                </button>
                <button
                  onClick={() => setPartFilter("part4")}
                  className={`px-4 py-2 rounded-md font-medium text-sm ${
                    partFilter === "part4"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Part 4
                </button>
                <button
                  onClick={() => setPartFilter("part5")}
                  className={`px-4 py-2 rounded-md font-medium text-sm ${
                    partFilter === "part5"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Part 5
                </button>
                <button
                  onClick={() => setPartFilter("part6")}
                  className={`px-4 py-2 rounded-md font-medium text-sm ${
                    partFilter === "part6"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Part 6
                </button>
                <button
                  onClick={() => setPartFilter("part7_single_text")}
                  className={`px-4 py-2 rounded-md font-medium text-sm ${
                    partFilter === "part7_single_text"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Part 7 Single Text Only
                </button>
                <button
                  onClick={() => setPartFilter("part7_single_chart")}
                  className={`px-4 py-2 rounded-md font-medium text-sm ${
                    partFilter === "part7_single_chart"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Part 7 Single With Chart
                </button>
                <button
                  onClick={() => setPartFilter("part7_double")}
                  className={`px-4 py-2 rounded-md font-medium text-sm ${
                    partFilter === "part7_double"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Part 7 Double Passage
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab === "workflow" ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <WorkflowManager />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* サイドバー - 統計とフィルター */}
              <div className="lg:col-span-1">
                <AdminStats passages={passages} />

                {/* フィルター */}
                <div className="bg-white rounded-lg shadow p-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">フィルター</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">検索</label>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="タイトル、内容、トピックで検索..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
                      <input
                        type="text"
                        value={idFilter}
                        onChange={(e) => setIdFilter(e.target.value)}
                        placeholder="IDで検索..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ソート</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="createdAt">作成日時順</option>
                        <option value="id">ID順</option>
                        <option value="title">タイトル順</option>
                        <option value="difficulty">難易度順</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">難易度</label>
                      <select
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">すべて</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">タイプ</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">すべて</option>
                        <option value="article">記事</option>
                        <option value="email">メール</option>
                        <option value="advertisement">広告</option>
                        <option value="chart">図表</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">資料形式</label>
                      <select
                        value={documentFormatFilter}
                        onChange={(e) => setDocumentFormatFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">すべて</option>
                        <option value="single">単一資料</option>
                        <option value="multi">2資料</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">図表</label>
                      <select
                        value={hasChartFilter}
                        onChange={(e) => setHasChartFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">すべて</option>
                        <option value="with_chart">図表付き</option>
                        <option value="without_chart">図表なし</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>

              {/* メインコンテンツ */}
              <div className="lg:col-span-3">
                {isEditing && selectedPassage ? (
                  <AdminPassageEditor
                    passage={selectedPassage}
                    onSave={handleSavePassage}
                    onCancel={() => {
                      setIsEditing(false);
                      setSelectedPassage(null);
                    }}
                  />
                ) : (
                  <AdminPassageList 
                    passages={filteredPassages} 
                    onEdit={handleEditPassage} 
                    onDelete={handleDeletePassage} 
                    onBulkGenerate={() => setShowGenerationModal(true)}
                    onPart1Generate={() => setShowPart1GenerationModal(true)}
                    onPart2Generate={() => setShowPart2GenerationModal(true)}
                    onPart3Generate={() => setShowPart3GenerationModal(true)}
                    onPart4Generate={() => setShowPart4GenerationModal(true)}
                    onPart5Generate={() => setShowPart5GenerationModal(true)}
                    onPart6Generate={() => setShowPart6GenerationModal(true)}
                    onPart7SingleTextGenerate={() => setShowPart7SingleTextModal(true)}
                    onPart7SingleChartGenerate={() => setShowPart7SingleChartModal(true)}
                    onPart7DoubleGenerate={() => setShowPart7DoubleModal(true)}
                    isGenerating={isGenerating}
                  />
                )}
              </div>
            </div>
        </div>
      )}

      {/* Modals - outside the conditional logic */}
      <BulkGenerationModal
          isOpen={showGenerationModal}
          onClose={() => setShowGenerationModal(false)}
          onGenerate={handleBulkGenerate}
          isGenerating={isGenerating}
          soundEnabled={soundEnabled}
          onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        />

        <Part1GenerationModal
          isOpen={showPart1GenerationModal}
          onClose={() => setShowPart1GenerationModal(false)}
          onGenerate={handlePart1Generate}
          isGenerating={isGenerating}
        />

        <Part2GenerationModal
          isOpen={showPart2GenerationModal}
          onClose={() => setShowPart2GenerationModal(false)}
          onGenerate={handlePart2Generate}
          isGenerating={isGenerating}
        />

        <Part3GenerationModal
          isOpen={showPart3GenerationModal}
          onClose={() => setShowPart3GenerationModal(false)}
          onGenerate={handlePart3Generate}
          isGenerating={isGenerating}
        />

        <Part4GenerationModal
          isOpen={showPart4GenerationModal}
          onClose={() => setShowPart4GenerationModal(false)}
          onGenerate={handlePart4Generate}
          isGenerating={isGenerating}
        />

        <Part5GenerationModal
          isOpen={showPart5GenerationModal}
          onClose={() => setShowPart5GenerationModal(false)}
          onGenerate={handlePart5Generate}
          isGenerating={isGenerating}
        />

        <Part6GenerationModal
          isOpen={showPart6GenerationModal}
          onClose={() => setShowPart6GenerationModal(false)}
          onGenerate={handlePart6Generate}
          isGenerating={isGenerating}
        />

        <BulkGenerationModal
          isOpen={showPart7SingleTextModal}
          onClose={() => setShowPart7SingleTextModal(false)}
          onGenerate={(difficulty, count) => handlePart7SingleTextGenerate(difficulty, count)}
          isGenerating={isGenerating}
          soundEnabled={soundEnabled}
          onSoundToggle={() => setSoundEnabled(!soundEnabled)}
          modalType="part7_single_text"
          title="Part 7 Single Text 問題生成"
          description="<strong>Part 7 Single Text とは</strong><br/>• 単一のテキスト文書（図表なし）<br/>• メール、記事、広告などの形式<br/>• 3つの読解問題が自動生成されます<br/>• partType: part7_single_text が設定されます"
        />

        <BulkGenerationModal
          isOpen={showPart7SingleChartModal}
          onClose={() => setShowPart7SingleChartModal(false)}
          onGenerate={(difficulty, count) => handlePart7SingleChartGenerate(difficulty, count)}
          isGenerating={isGenerating}
          soundEnabled={soundEnabled}
          onSoundToggle={() => setSoundEnabled(!soundEnabled)}
          modalType="part7_single_chart"
          title="Part 7 Single Chart 問題生成"
          description="<strong>Part 7 Single Chart とは</strong><br/>• 単一のテキスト文書＋図表データ<br/>• 文書と表・グラフの組み合わせ問題<br/>• 図表を参照する読解問題が自動生成されます<br/>• partType: part7_single_chart が設定されます"
        />

        <BulkGenerationModal
          isOpen={showPart7DoubleModal}
          onClose={() => setShowPart7DoubleModal(false)}
          onGenerate={(difficulty, count) => handlePart7DoubleGenerate(difficulty, count)}
          isGenerating={isGenerating}
          soundEnabled={soundEnabled}
          onSoundToggle={() => setSoundEnabled(!soundEnabled)}
          modalType="part7_double"
          title="Part 7 Double 問題生成"
          description="<strong>Part 7 Double とは</strong><br/>• 2つの関連する文書の組み合わせ<br/>• メール交換、記事と表、複数文書問題<br/>• 文書間の関係を問う読解問題が自動生成されます<br/>• partType: part7_double が設定されます"
        />

        <GenerationResultModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          result={generationResult}
          onComplete={() => setShowResultModal(false)}
        />

    </div>
  );
}
