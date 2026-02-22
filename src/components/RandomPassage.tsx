"use client";

// Main component for TOEIC practice
// 
// ⚠️ PART 1画像表示について ⚠️
// このコンポーネントには4箇所のPart 1画像表示があります：
//
// #1 (4300行周辺): Part 1独立クイズ - 結果画面 (currentPart1Question)
// #2 (4960行周辺): 通常Passage - 出題中 (currentPassage.part1Questions[0])  
// #3 (5330行周辺): 通常Passage - 結果画面 (currentPassage.part1Questions[0])
// #4 (5955行周辺): Part 1独立クイズ - 出題中 (currentPart1Question)
//
// 各箇所は異なるモード・画面状態・データソースで使い分けられており、
// 画像スタイルを変更する際は4箇所すべてを確認・修正してください。
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Volume2, VolumeX } from "lucide-react";
// import passagesData from "../data/passages.json"; // APIから読み込むように変更
import { GameSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from "@/utils/gameSettings";
import { Passage, Part3Question, Part4Question, Part6Data, TOEICPart } from "@/lib/types";
import { cleanText, cleanTranslationText } from "@/utils/textUtils";
import { generateQuestionsText, generateContentText, generateMultipleDocumentsInstruction } from "@/utils/textGenerators";
import { getSecureRandomIndex } from "@/utils/questionSelection";
import { PART3_VOICE_VOLUME_MAP, DEFAULT_PART3_VOLUME, DEFAULT_PART2_VOLUME, getVoiceIdFromSpeaker } from "@/lib/audio-constants";
import { useGameTimer } from "@/hooks/useGameTimer";
import AppHeader from "@/components/AppHeader";
import SettingsModal from "@/components/SettingsModal";
import ChartRenderer from "@/components/ChartRenderer";
import { Part5Results, Part5QuestionView } from "@/components/parts/Part5Renderer";
import { Part6Results, Part6QuestionView } from "@/components/parts/Part6Renderer";
import { Part1Results, Part1QuestionView } from "@/components/parts/Part1Renderer";
import { Part2Results, Part2QuestionView } from "@/components/parts/Part2Renderer";
import { Part3Results } from "@/components/parts/Part3Renderer";
import { Part4Results, Part4QuestionView } from "@/components/parts/Part4Renderer";
import { GameStats, GameStatsMap, initializeStats, getStatsForSettings, updateStatsForSettings, loadStats, saveStats } from "@/utils/gameStats";
import StatsPopup from "@/components/StatsPopup";
import { convertToBlobUrl } from "@/lib/audio-blob";
import Part0Component from "@/components/Part0Component";
import type { Part0Sentence } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Part2Question {
  id: string;
  question: string;
  questionTranslation: string;
  options: string[];
  optionTranslations: string[];
  correct: string;
  explanation: string;
  questionType: string;
  difficulty: string;
  topic: string;
  createdAt: string;
  generationBatch: string;
  voiceProfile?: {
    voiceId: string;
    gender: string;
    accent: string;
    country: string;
    age: string;
    tone: string;
  };
  audioFiles: {
    question: {
      text: string;
      audioPath: string | null;
    };
    options: Array<{
      option: string;
      text: string;
      audioPath: string | null;
      labelAudioPath: string;
    }>;
  };
}

interface Part5Question {
  id: string;
  sentence: string;
  question: string;
  questionTranslation: string;
  options: string[];
  optionTranslations: string[];
  correct: string;
  explanation: string;
  category: string;
  intent: string;
  length: string;
  vocabLevel: string;
  optionsType: string;
  difficulty: string;
  topic: string;
  createdAt: string;
  generationBatch: string;
  partType: string;
}


// Window型拡張
declare global {
  interface Window {
    audioContext?: AudioContext;
    audioBufferCache?: Map<string, AudioBuffer>;
  }
}


export default function RandomPassage({ onShowSplash }: { onShowSplash?: () => void }) {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const [allPassages, setAllPassages] = useState<Passage[]>([]);
  const [allPart0Sentences, setAllPart0Sentences] = useState<Part0Sentence[]>([]);
  const [allPart2Questions, setAllPart2Questions] = useState<Part2Question[]>([]);
  const [allPart3Questions, setAllPart3Questions] = useState<Part3Question[]>([]);
  const [allPart4Questions, setAllPart4Questions] = useState<Part4Question[]>([]);
  const [allPart5Questions, setAllPart5Questions] = useState<Part5Question[]>([]);
  const [allPart6Questions, setAllPart6Questions] = useState<Part6Data[]>([]);
  const [currentPassage, setCurrentPassage] = useState<Passage | null>(null);
  const [currentPart0Sentence, setCurrentPart0Sentence] = useState<Part0Sentence | null>(null);
  const [allPart1Questions, setAllPart1Questions] = useState<any[]>([]);
  const [currentPart1Question, setCurrentPart1Question] = useState<any | null>(null);
  const [currentPart2Question, setCurrentPart2Question] = useState<Part2Question | null>(null);
  const [currentPart3Question, setCurrentPart3Question] = useState<Part3Question | null>(null);
  const [currentPart4Question, setCurrentPart4Question] = useState<Part4Question | null>(null);
  const [currentPart5Question, setCurrentPart5Question] = useState<Part5Question | null>(null);
  const [currentPart6Question, setCurrentPart6Question] = useState<Part6Data | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string>("");
  const [copyPosition, setCopyPosition] = useState<{ x: number; y: number } | null>(null);
  const [recentPassageIds, setRecentPassageIds] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [passageIdInput, setPassageIdInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [tempAnswerTime, setTempAnswerTime] = useState(0);
  const [tempTargetConsecutive, setTempTargetConsecutive] = useState(20);
  const [tempToeicPart, setTempToeicPart] = useState<TOEICPart>('part7_single_text');
  const [tempHasChart, setTempHasChart] = useState<'all' | 'with_chart' | 'without_chart'>('all');
  const [tempDifficulty, setTempDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [tempNextButtonBehavior, setTempNextButtonBehavior] = useState<'random' | 'sequential'>('random');
  const [tempAudioVolume, setTempAudioVolume] = useState(70);
  // Sequential selection state
  const [sequentialIndices, setSequentialIndices] = useState({
    part0: 0,
    part1: 0,
    part2: 0,
    part3: 0,
    part4: 0,
    part5: 0,
    part6: 0,
    part7_single_text: 0,
    part7_single_chart: 0,
    part7_double: 0
  });
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [bestConsecutive, setBestConsecutive] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [gameStatsMap, setGameStatsMap] = useState<GameStatsMap>({});
  const [currentStats, setCurrentStats] = useState<GameStats>(initializeStats());
  const [targetAchieved, setTargetAchieved] = useState(false);
  // Timer hook
  const handleTimeUp = useCallback(() => {
    setConsecutiveCorrect(0);
    setTargetAchieved(false);
    localStorage.setItem('engConsecutiveCorrect', '0');
    console.log('🔍 時間切れ: 連続正答数をリセット');
  }, []);
  const { timeLeft, startTimer, stopTimer } = useGameTimer({
    answerTimeMs: gameSettings.answerTime,
    onTimeUp: handleTimeUp,
  });
  // ハイライト機能の状態
  const [highlightedWords, setHighlightedWords] = useState<Set<string>>(new Set());
  // 音声読み上げの状態
  const [isSpeaking, setIsSpeaking] = useState(false);
  // 音声再生中断フラグ
  const audioAbortRef = useRef(false);
  // Part4音声制御の状態
  const [isPlayingPart4, setIsPlayingPart4] = useState(false);
  const [isPausedPart4, setIsPausedPart4] = useState(false);
  const part4AudioRef = useRef<HTMLAudioElement | null>(null);
  const [part4CurrentTime, setPart4CurrentTime] = useState(0);
  const [part4Duration, setPart4Duration] = useState(0);
  const part4ProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // ボタン処理のデバウンス用
  const lastButtonClickRef = useRef<number>(0);
  const buttonDebounceDelay = 200; // 200ms以内の重複クリックを防ぐ
  // URL parameter tracking to prevent unnecessary loadSpecificPassage calls
  const lastProcessedPassageIdRef = useRef<string | null>(null);
  // 設定変更中フラグ
  const isApplyingSettingsRef = useRef(false);
  // Part1画像読み込みエラー状態
  const [part1ImageError, setPart1ImageError] = useState(false);
  const [part1ImageLoading, setPart1ImageLoading] = useState(true);
  
  // iOS検出（クライアントサイドでのみ実行）
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  
  // 音声ファイル詳細情報の取得
  const getAudioFileInfo = useCallback(async (audioPath: string) => {
    try {
      const blobUrl = convertToBlobUrl(audioPath);
      const response = await fetch(blobUrl, { method: 'HEAD' });
      return {
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        lastModified: response.headers.get('last-modified'),
        url: blobUrl
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', url: convertToBlobUrl(audioPath) };
    }
  }, []);

  // currentPassageの変更を監視してデバッグログを出力
  useEffect(() => {
    if (currentPassage) {
      console.log("🔍 Current Passage Info:", {
        id: currentPassage!.id,
        title: currentPassage!.title,
        isMultiDocument: currentPassage!.isMultiDocument,
        documentsCount: currentPassage!.documents?.length,
        hasDocuments: !!currentPassage!.documents,
        toeicPart: gameSettings.toeicPart
      });
    }
  }, [currentPassage, gameSettings.toeicPart]);

  // APIから問題データを読み込む
  const loadPassages = useCallback(async () => {
    try {
      // 通常の問題データとPart 2、Part 3問題を並列で読み込み
      console.log('📡 Fetching passages data...');
      
      const [passagesResponse, part0Response, part1Response, part2Response, part3Response, part4Response, part5Response, part6Response] = await Promise.all([
        fetch('/api/passages'),
        fetch('/api/part0-sentences'),
        fetch('/api/part1-questions?limit=1000'),
        fetch('/api/part2-questions'),
        fetch('/api/part3-questions'),
        fetch('/api/part4-questions'),
        fetch('/api/part5-questions'),
        fetch('/api/part6-questions')
      ]);
      
      console.log('📡 API responses received:', {
        passages: { ok: passagesResponse.ok, status: passagesResponse.status },
        part0: { ok: part0Response.ok, status: part0Response.status },
        part1: { ok: part1Response.ok, status: part1Response.status },
        part2: { ok: part2Response.ok, status: part2Response.status },
        part3: { ok: part3Response.ok, status: part3Response.status },
        part4: { ok: part4Response.ok, status: part4Response.status },
        part5: { ok: part5Response.ok, status: part5Response.status },
        part6: { ok: part6Response.ok, status: part6Response.status }
      });
      
      if (!passagesResponse.ok) {
        const errorText = await passagesResponse.text();
        console.error('❌ Passages API error response:', {
          status: passagesResponse.status,
          statusText: passagesResponse.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error(`Passages API error: ${passagesResponse.status} - ${errorText.substring(0, 100)}`);
      }
      
      if (!part0Response.ok) {
        const errorText = await part0Response.text();
        console.error('❌ Part0 API error response:', {
          status: part0Response.status,
          statusText: part0Response.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error(`Part0 API error: ${part0Response.status} - ${errorText.substring(0, 100)}`);
      }

      if (!part1Response.ok) {
        const errorText = await part1Response.text();
        console.error('❌ Part1 API error response:', {
          status: part1Response.status,
          statusText: part1Response.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error(`Part1 API error: ${part1Response.status} - ${errorText.substring(0, 100)}`);
      }

      if (!part2Response.ok) {
        const errorText = await part2Response.text();
        console.error('❌ Part2 API error response:', {
          status: part2Response.status,
          statusText: part2Response.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error(`Part2 API error: ${part2Response.status} - ${errorText.substring(0, 100)}`);
      }
      
      if (!part3Response.ok) {
        const errorText = await part3Response.text();
        console.error('❌ Part3 API error response:', {
          status: part3Response.status,
          statusText: part3Response.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error(`Part3 API error: ${part3Response.status} - ${errorText.substring(0, 100)}`);
      }
      
      if (!part4Response.ok) {
        const errorText = await part4Response.text();
        console.error('❌ Part4 API error response:', {
          status: part4Response.status,
          statusText: part4Response.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error(`Part4 API error: ${part4Response.status} - ${errorText.substring(0, 100)}`);
      }
      
      if (!part5Response.ok) {
        const errorText = await part5Response.text();
        console.error('❌ Part5 API error response:', {
          status: part5Response.status,
          statusText: part5Response.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error(`Part5 API error: ${part5Response.status} - ${errorText.substring(0, 100)}`);
      }
      
      if (!part6Response.ok) {
        const errorText = await part6Response.text();
        console.error('❌ Part6 API error response:', {
          status: part6Response.status,
          statusText: part6Response.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error(`Part6 API error: ${part6Response.status} - ${errorText.substring(0, 100)}`);
      }
      
      let passagesData, part0Data, part1Data, part2Data, part3Data, part4Data, part5Data, part6Data;
      try {
        [passagesData, part0Data, part1Data, part2Data, part3Data, part4Data, part5Data, part6Data] = await Promise.all([
          passagesResponse.json(),
          part0Response.json(),
          part1Response.json(),
          part2Response.json(),
          part3Response.json(),
          part4Response.json(),
          part5Response.json(),
          part6Response.json()
        ]);
      } catch (jsonError) {
        console.error('❌ JSON parse error:', jsonError);
        throw new Error('APIレスポンスの解析に失敗しました。');
      }
      
      console.log('📡 Data parsed successfully:', {
        passagesCount: passagesData?.passages?.length || 0,
        part0Count: (part0Data?.sentences || part0Data)?.length || 0,
        part1Count: (part1Data?.questions || [])?.length || 0,
        part2Count: (part2Data?.questions || part2Data)?.length || 0,
        part3Count: (part3Data?.questions || part3Data)?.length || 0,
        part4Count: (part4Data?.questions || part4Data)?.length || 0,
        part5Count: (part5Data?.questions || part5Data)?.length || 0,
        part6Count: (part6Data?.questions || part6Data)?.length || 0
      });
      
      setAllPassages(passagesData.passages || []);
      setAllPart0Sentences(part0Data.sentences || part0Data || []);
      setAllPart1Questions(part1Data?.questions || []);
      setAllPart2Questions(part2Data.questions || part2Data || []);
      setAllPart3Questions(part3Data.questions || part3Data || []);
      setAllPart4Questions(part4Data.questions || part4Data || []);
      setAllPart5Questions(part5Data.questions || part5Data || []);
      setAllPart6Questions(part6Data?.questions || part6Data || []);
      
      // Part 0問題の存在確認とデバッグ情報
      console.log('🔍 Part 0 Sentences Debug:', {
        total: (part0Data.sentences || part0Data || []).length,
        data: part0Data.sentences || part0Data || [],
        firstSentence: (part0Data.sentences || part0Data || [])[0]
      });
      
      // Part 5問題の存在確認とデバッグ情報
      console.log('🔍 Part 5 Questions Debug:', {
        total: (part5Data.questions || part5Data || []).length,
        data: part5Data.questions || part5Data || [],
        firstQuestion: (part5Data.questions || part5Data || [])[0]
      });
      
      // Part 6問題の存在確認とデバッグ情報
      console.log('🔍 Part 6 Questions Debug:', {
        total: (part6Data?.questions || part6Data || []).length,
        data: part6Data?.questions || part6Data || [],
        firstQuestion: (part6Data?.questions || part6Data || [])[0]
      });
      
      // Part 1問題の存在確認とデバッグ情報
      const part1Questions = (passagesData.passages || []).filter((p: any) => p.partType === 'part1' || p.toeicPart === 'part1');
      const part1HardQuestions = part1Questions.filter((p: any) => p.metadata?.difficulty === 'hard');
      
      console.log('🔍 Part 1 Questions Debug:', {
        total: part1Questions.length,
        hard: part1HardQuestions.length,
        sample: part1HardQuestions[0] ? {
          id: part1HardQuestions[0].id,
          difficulty: part1HardQuestions[0].metadata?.difficulty,
          partType: part1HardQuestions[0].partType,
          toeicPart: part1HardQuestions[0].toeicPart
        } : 'none'
      });
      
      addDebugLog('問題データを読み込みました', { 
        passagesCount: passagesData.passages?.length,
        part0Count: (part0Data.sentences || part0Data)?.length,
        part2Count: (part2Data.questions || part2Data)?.length,
        part3Count: (part3Data.questions || part3Data)?.length,
        part4Count: (part4Data.questions || part4Data)?.length,
        part1Count: part1Questions.length,
        part1HardCount: part1HardQuestions.length
      });
    } catch (error) {
      console.error('Failed to load passages:', error);
      
      // より詳細なエラーメッセージを生成
      let errorMsg = t('error.loadFailed');
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMsg += 'ネットワーク接続を確認してください。';
        } else if (error.message.includes('API error')) {
          errorMsg += `サーバーエラー: ${error.message}`;
        } else {
          errorMsg += error.message;
        }
      }
      errorMsg += ' ページを再読み込みしてください。';
      
      addDebugLog('問題データの読み込みに失敗しました', { 
        error: error instanceof Error ? error.message : error,
        type: error instanceof Error ? error.name : typeof error
      });
      setErrorMessage(errorMsg);
    }
  }, []);

  // 設定と統計を初期化
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 問題データを読み込み
        await loadPassages();
        
        const savedSettings = await loadSettings();
        setGameSettings(savedSettings);
        
        // 設定値を秒に変換して一時的な状態に設定
        setTempAnswerTime(savedSettings.answerTime / 1000);
        setTempTargetConsecutive(savedSettings.targetConsecutive);
        setTempToeicPart(savedSettings.toeicPart);
        setTempHasChart(savedSettings.hasChart);
        setTempDifficulty(savedSettings.difficulty);
        setTempNextButtonBehavior(savedSettings.nextButtonBehavior);
        
        addDebugLog('設定を読み込みました', {
          savedSettings,
          tempAnswerTime: savedSettings.answerTime / 1000,
          tempTargetConsecutive: savedSettings.targetConsecutive,
          tempToeicPart: savedSettings.toeicPart
        });
        
        // 統計情報を読み込み
        const savedStatsMap = await loadStats();
        setGameStatsMap(savedStatsMap);
        
        const stats = getStatsForSettings(savedStatsMap, savedSettings);
        setCurrentStats(stats);
        setConsecutiveCorrect(stats.currentConsecutiveCorrect);
        setBestConsecutive(stats.maxConsecutiveCorrect);
        
        addDebugLog('統計情報を読み込みました', {
          stats,
          consecutiveCorrect: stats.currentConsecutiveCorrect,
          bestConsecutive: stats.maxConsecutiveCorrect
        });
      } catch (error) {
        console.error('Failed to load data:', error);
        addDebugLog('データの読み込みに失敗しました', error);
      }
    };
    
    initializeData();
  }, [loadPassages]);

  // 設定が保存された後のみ、tempPassageModeを同期
  // （設定画面が閉じられた後の同期用）

  // デバッグログを追加する関数（無効化）
  const addDebugLog = (message: string, data?: any) => {
    // 一時的にPart 5デバッグのためログ有効化
    console.log(`🔍 ${message}`, data);
  };

  // Part4音声制御関数
  const playPart4Audio = (audioPath: string) => {
    if (isPausedPart4 && part4AudioRef.current) {
      // 一時停止中の場合は再開
      part4AudioRef.current.play();
      setIsPlayingPart4(true);
      setIsPausedPart4(false);
      startPart4ProgressTracking();
    } else {
      // 新規再生
      if (part4AudioRef.current) {
        part4AudioRef.current.pause();
        part4AudioRef.current.currentTime = 0;
      }
      
      const blobUrl = convertToBlobUrl(audioPath);
      const audio = new Audio(blobUrl);
      // Part 4のvoiceIdに基づく音量設定（Part 3と同じロジック）
      const voiceId = currentPart4Question?.speaker?.voiceProfile?.voiceId;
      
      if (!voiceId) {
        console.error('Part 4音声エラー: voiceIdが見つかりません', {
          questionId: currentPart4Question?.id,
          speaker: currentPart4Question?.speaker
        });
        alert('音声設定エラー: voiceIdが見つかりません。管理者に連絡してください。');
      }
      
      const volumeLevel = voiceId ? (PART3_VOICE_VOLUME_MAP[voiceId] || DEFAULT_PART3_VOLUME) : DEFAULT_PART3_VOLUME;
      
      if (voiceId && !PART3_VOICE_VOLUME_MAP[voiceId]) {
        console.warn(`Part 4音声警告: voiceId "${voiceId}" の音量設定が見つかりません。デフォルト音量 ${DEFAULT_PART3_VOLUME} を使用します。`);
      }
      
      // ユーザー設定のボリュームを適用
      audio.volume = volumeLevel * (gameSettings.audioVolume / 100);
      part4AudioRef.current = audio;
      
      // 音声のメタデータが読み込まれたら長さを設定
      audio.onloadedmetadata = () => {
        setPart4Duration(audio.duration);
        setPart4CurrentTime(0);
      };
      
      audio.onended = () => {
        setIsPlayingPart4(false);
        setIsPausedPart4(false);
        setPart4CurrentTime(audio.duration || 0);
        stopPart4ProgressTracking();
        // 音声参照を維持して、終了後もシーク操作を可能にする
        // part4AudioRef.current = null; をコメントアウト
      };
      
      audio.onerror = () => {
        setIsPlayingPart4(false);
        setIsPausedPart4(false);
        setPart4CurrentTime(0);
        stopPart4ProgressTracking();
        part4AudioRef.current = null;
      };
      
      audio.play().then(() => {
        setIsPlayingPart4(true);
        setIsPausedPart4(false);
        startPart4ProgressTracking();
      }).catch(console.error);
    }
  };

  const pausePart4Audio = () => {
    if (part4AudioRef.current && isPlayingPart4) {
      part4AudioRef.current.pause();
      setIsPlayingPart4(false);
      setIsPausedPart4(true);
      stopPart4ProgressTracking();
    }
  };

  const stopPart4Audio = () => {
    if (part4AudioRef.current) {
      part4AudioRef.current.pause();
      part4AudioRef.current.currentTime = 0;
    }
    setIsPlayingPart4(false);
    setIsPausedPart4(false);
    setPart4CurrentTime(0);
    setPart4Duration(0);
    stopPart4ProgressTracking();
    part4AudioRef.current = null;
  };

  // Part4音声の進行状況を追跡
  const startPart4ProgressTracking = () => {
    if (part4ProgressIntervalRef.current) {
      clearInterval(part4ProgressIntervalRef.current);
    }
    part4ProgressIntervalRef.current = setInterval(() => {
      if (part4AudioRef.current && !part4AudioRef.current.paused) {
        setPart4CurrentTime(part4AudioRef.current.currentTime);
      }
    }, 100);
  };

  const stopPart4ProgressTracking = () => {
    if (part4ProgressIntervalRef.current) {
      clearInterval(part4ProgressIntervalRef.current);
      part4ProgressIntervalRef.current = null;
    }
  };

  // デバウンス付きボタンハンドラー
  const handleButtonAction = (action: () => void, actionName: string) => {
    const now = Date.now();
    if (now - lastButtonClickRef.current < buttonDebounceDelay) {
      console.log(`🔒 Part4: ${actionName} - デバウンス中（重複クリック防止）`);
      return;
    }
    lastButtonClickRef.current = now;
    console.log(`✅ Part4: ${actionName} - 実行`);
    action();
  };

  // Part4音声のシーク機能
  const seekPart4Audio = (time: number) => {
    if (part4AudioRef.current) {
      part4AudioRef.current.currentTime = time;
      setPart4CurrentTime(time);
      
      // 再生終了状態の場合は一時停止状態に変更
      if (!isPlayingPart4 && !isPausedPart4) {
        setIsPausedPart4(true);
      }
    }
  };

  // Part4音声を5秒戻す
  const skipBackwardPart4 = () => {
    if (part4AudioRef.current) {
      const newTime = Math.max(0, part4AudioRef.current.currentTime - 5);
      part4AudioRef.current.currentTime = newTime;
      setPart4CurrentTime(newTime);
      
      // 再生終了状態の場合は一時停止状態に変更
      if (!isPlayingPart4 && !isPausedPart4) {
        setIsPausedPart4(true);
      }
    }
  };

  // Part4音声を5秒進める
  const skipForwardPart4 = () => {
    if (part4AudioRef.current) {
      const newTime = Math.min(part4AudioRef.current.duration || 0, part4AudioRef.current.currentTime + 5);
      part4AudioRef.current.currentTime = newTime;
      setPart4CurrentTime(newTime);
      
      // 再生終了状態の場合は一時停止状態に変更
      if (!isPlayingPart4 && !isPausedPart4) {
        setIsPausedPart4(true);
      }
    }
  };

  // 時間をMM:SS形式にフォーマット

  // Part 1用に事前生成された音声ファイルを再生
  const playPart1Audio = (question: any) => {
    console.log('🎵 playPart1Audio called');
    console.log('Question ID:', question?.id);
    console.log('Question has audioFiles:', !!question?.audioFiles);
    console.log('AudioFiles length:', question?.audioFiles?.length);
    console.log('🎯 VoiceProfile check:', question?.voiceProfile);
    console.log('🎯 VoiceId check:', question?.voiceProfile?.voiceId);
    
    if (question?.audioFiles) {
      console.log('AudioFiles details:', question.audioFiles);
    }
    
    // 基本的な検証
    if (!question || !question.options || !Array.isArray(question.options)) {
      console.warn('Question or options are invalid');
      alert('問題データが不正です。');
      return;
    }
    
    let audioFiles = question.audioFiles;
    
    // audioFiles がない場合は動的に生成
    if (!audioFiles || !Array.isArray(audioFiles)) {
      console.log('🔧 Generating audio file paths dynamically');
      audioFiles = question.options.map((optionText: string, index: number) => ({
        option: String.fromCharCode(65 + index), // A, B, C, D
        text: optionText,
        audioPath: convertToBlobUrl(`/audio/part1/${question.id}_option_${String.fromCharCode(97 + index)}.mp3`) // a, b, c, d
      }));
      console.log('Generated audioFiles:', audioFiles);
    }
    
    // audioFiles がある場合は音声ファイルを再生
    console.log('✅ Audio files ready:', audioFiles.length, 'files');
    console.log('🔊 Attempting to play audio files...');
    playAudioFiles(audioFiles, question?.voiceProfile?.voiceId);
  };

  // Part 1独立データ用の音声再生関数
  const playPart1IndependentAudio = (part1Question: any) => {
    console.log('🎵 playPart1IndependentAudio called');
    console.log('Part1 Question ID:', part1Question?.id);
    console.log('Part1 Question has audioFiles:', !!part1Question?.audioFiles);
    console.log('🎯 VoiceProfile check:', part1Question?.voiceProfile);
    console.log('🎯 VoiceId check:', part1Question?.voiceProfile?.voiceId);
    
    if (part1Question?.audioFiles) {
      console.log('Part1 AudioFiles details:', part1Question.audioFiles);
    }
    
    // 基本的な検証
    if (!part1Question || !part1Question.audioFiles || !Array.isArray(part1Question.audioFiles)) {
      console.warn('Part1 Question or audioFiles are invalid');
      alert('Part 1問題の音声データが不正です。');
      return;
    }
    
    // Part 1独立データの音声ファイルを再生
    console.log('✅ Part1 audio files ready:', part1Question.audioFiles.length, 'files');
    console.log('🔊 Attempting to play Part1 audio files...');
    playAudioFiles(part1Question.audioFiles, part1Question?.voiceProfile?.voiceId);
  };
  
  // iOS向けのWeb Audio API初期化
  const initializeIOSAudioContext = useCallback(() => {
    if (!isIOS || typeof window === 'undefined') return;
    
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      
      if (!window.audioContext) {
        window.audioContext = new AudioContext();
        window.audioBufferCache = new Map<string, AudioBuffer>();
      }
      
      // コンテキストが中断されている場合は再開
      if (window.audioContext && window.audioContext.state === 'suspended') {
        window.audioContext.resume();
      }
    } catch {
      // AudioContext initialization error
    }
  }, [isIOS]);

  // iOS向け音声バッファの読み込みとキャッシュ
  const loadAudioBuffer = useCallback(async (url: string): Promise<AudioBuffer | null> => {
    if (!window.audioContext) return null;
    
    // キャッシュチェック
    if (window.audioBufferCache?.has(url)) {
      return window.audioBufferCache.get(url)!;
    }
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await window.audioContext.decodeAudioData(arrayBuffer);
      
      // キャッシュに保存
      window.audioBufferCache?.set(url, audioBuffer);

      return audioBuffer;
    } catch {
      return null;
    }
  }, []);

  // iOS向けWeb Audio APIでの音声再生（音量制御付き）
  const playIOSAudioBuffer = useCallback(async (url: string, voiceId?: string): Promise<void> => {
    if (!window.audioContext) {
      throw new Error('AudioContext not initialized');
    }
    
    // 再生前にAudioContextの状態をチェックして必要なら再開
    if (window.audioContext.state === 'suspended') {
      try {
        await window.audioContext.resume();
      } catch {
        throw new Error('Failed to resume AudioContext');
      }
    }
    
    const audioBuffer = await loadAudioBuffer(url);
    if (!audioBuffer) {
      throw new Error('Failed to load audio buffer');
    }
    
    // voice_idベースの音量を取得
    const volumeLevel = voiceId ? (PART3_VOICE_VOLUME_MAP[voiceId] || DEFAULT_PART3_VOLUME) : DEFAULT_PART3_VOLUME;
    
    return new Promise((resolve, reject) => {
      try {
        const source = window.audioContext!.createBufferSource();
        const gainNode = window.audioContext!.createGain();
        
        source.buffer = audioBuffer;
        gainNode.gain.value = volumeLevel;
        
        // オーディオグラフの接続: source → gainNode → destination
        source.connect(gainNode);
        gainNode.connect(window.audioContext!.destination);
        
        source.onended = () => {
          resolve();
        };
        
        try {
          source.start(0);
        } catch (startError) {
          reject(startError);
        }
      } catch (error) {
        reject(error);
      }
    });
  }, [loadAudioBuffer]);

  // Part2問題表示時に音声ファイルをプリロード（iOS向け）
  useEffect(() => {
    if (isIOS && currentPart2Question?.audioFiles && window.audioContext) {
      const preloadAudioFiles = async () => {
        const audioUrls: string[] = [];
        
        // 質問音声
        if (currentPart2Question!.audioFiles.question?.audioPath) {
          audioUrls.push(convertToBlobUrl(currentPart2Question!.audioFiles.question.audioPath));
        }
        
        // 選択肢音声
        currentPart2Question!.audioFiles.options.forEach(option => {
          if (option.labelAudioPath) audioUrls.push(convertToBlobUrl(option.labelAudioPath));
          if (option.audioPath) audioUrls.push(convertToBlobUrl(option.audioPath));
        });
        
        // 並列でプリロード
        await Promise.all(audioUrls.map(url =>
          loadAudioBuffer(url).catch(() => {})
        ));
      };

      preloadAudioFiles();
    }
  }, [isIOS, currentPart2Question, loadAudioBuffer]);

  // PC用Part3音声プリロード
  useEffect(() => {
    if (!isIOS && currentPart3Question?.audioFiles) {
      console.log('Part3音声プリロード開始 (PC)');
      
      const audioUrls: string[] = [];
      const audioFiles = currentPart3Question.audioFiles;
      
      // 会話音声（セグメント）
      if (audioFiles.conversation?.segments) {
        audioFiles.conversation.segments.forEach(segment => {
          if (segment.audioPath) audioUrls.push(convertToBlobUrl(segment.audioPath));
        });
      }
      
      // 会話音声（単一ファイル）
      if (audioFiles.conversation?.audioPath) {
        audioUrls.push(convertToBlobUrl(audioFiles.conversation.audioPath));
      }
      
      // 各問題の音声
      audioFiles.questions?.forEach(q => {
        if (q.audioPath) audioUrls.push(convertToBlobUrl(q.audioPath));
      });
      
      // PC用シンプルプリロード
      audioUrls.forEach(url => {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = url;
        audio.load();
      });
      
      console.log(`Part3音声プリロード完了 (PC): ${audioUrls.length}ファイル`);
    }
  }, [currentPart3Question, isIOS]);

  // iOS用Part3音声プリロード
  useEffect(() => {
    if (isIOS && currentPart3Question?.audioFiles && window.audioContext) {
      const preloadAudioFiles = async () => {
        const audioUrls: string[] = [];
        const audioFiles = currentPart3Question!.audioFiles;
        
        if (!audioFiles) return;
        
        // 会話音声
        if (audioFiles.conversation?.audioPath) {
          audioUrls.push(convertToBlobUrl(audioFiles.conversation.audioPath));
        }
        
        // 各問題の音声（もしあれば）
        audioFiles.questions?.forEach(q => {
          if (q.audioPath) audioUrls.push(convertToBlobUrl(q.audioPath));
        });
        
        // 並列でプリロード
        await Promise.all(audioUrls.map(url =>
          loadAudioBuffer(url).catch(() => {})
        ));
      };

      preloadAudioFiles();
    }
  }, [isIOS, currentPart3Question, loadAudioBuffer]);

  // visibilitychangeイベントでAudioContextを管理（iOS向け）
  useEffect(() => {
    if (!isIOS || typeof window === 'undefined') return;

    const handleVisibilityChange = async () => {
      if (!document.hidden && window.audioContext) {
        // アプリがフォアグラウンドに戻った時
        // AudioContextを完全に再作成（イヤホン抜き差しと同じ効果）
        try {
          // 既存のAudioContextを閉じる
          if (window.audioContext) {
            try {
              await window.audioContext.close();
            } catch {
              // AudioContext close error (ignored)
            }
          }
          
          // 新しいAudioContextを作成
          window.audioContext = new AudioContext();
          window.audioBufferCache = new Map<string, AudioBuffer>(); // キャッシュもクリア

          // 新しいContextがsuspended状態の場合は再開
          if (window.audioContext.state === 'suspended') {
            await window.audioContext.resume();
          }
          
          // 現在表示中の問題の音声を再プリロード
          
          // Part1問題の音声再プリロード
          if (currentPassage?.toeicPart === 'part1' && currentPassage?.part1Questions?.[0]) {
            const audioUrls: string[] = [];
            const part1Question = currentPassage.part1Questions[0];
            
            // Part1の選択肢音声を収集
            if (part1Question.audioFiles) {
              part1Question.audioFiles.forEach(audioFile => {
                if (audioFile.audioPath) audioUrls.push(convertToBlobUrl(audioFile.audioPath));
                // ラベル音声も追加
                const labelPath = `/audio/labels/option_${audioFile.option.toLowerCase()}.mp3`;
                audioUrls.push(labelPath);
              });
            } else {
              // audioFilesがない場合は動的に生成
              const options = ['A', 'B', 'C', 'D'];
              options.forEach(option => {
                audioUrls.push(convertToBlobUrl(`/audio/part1/${part1Question.id}_option_${option.toLowerCase()}.mp3`));
                audioUrls.push(convertToBlobUrl(`/audio/labels/option_${option.toLowerCase()}.mp3`));
              });
            }
            
            await Promise.all(audioUrls.map(url =>
              loadAudioBuffer(url).catch(() => {})
            ));
          }
          
          if (currentPart2Question?.audioFiles) {
            const audioUrls: string[] = [];
            
            if (currentPart2Question.audioFiles.question?.audioPath) {
              audioUrls.push(convertToBlobUrl(currentPart2Question.audioFiles.question.audioPath));
            }
            
            currentPart2Question.audioFiles.options.forEach(option => {
              if (option.labelAudioPath) audioUrls.push(option.labelAudioPath);
              if (option.audioPath) audioUrls.push(convertToBlobUrl(option.audioPath));
            });
            
            await Promise.all(audioUrls.map(url =>
              loadAudioBuffer(url).catch(() => {})
            ));
          }

          if (currentPart3Question?.audioFiles) {
            const audioUrls: string[] = [];
            const audioFiles = currentPart3Question.audioFiles;
            
            if (audioFiles.conversation?.audioPath) {
              audioUrls.push(convertToBlobUrl(audioFiles.conversation.audioPath));
            }
            
            audioFiles.questions?.forEach(q => {
              if (q.audioPath) audioUrls.push(convertToBlobUrl(q.audioPath));
            });
            
            await Promise.all(audioUrls.map(url =>
              loadAudioBuffer(url).catch(() => {})
            ));
          }
        } catch {
          // エラーが発生しても、古い再開ロジックを試みる
          if (window.audioContext && window.audioContext.state === 'suspended') {
            try {
              await window.audioContext.resume();
            } catch {
              // AudioContext resume error (fallback)
            }
          }
        }
      } else if (document.hidden) {
        // アプリがバックグラウンドに入った時
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // クリーンアップ
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isIOS, currentPassage, currentPart2Question, currentPart3Question, loadAudioBuffer]);

  // iOS向けの音声再生準備（ユーザーインタラクション時に実行）
  const prepareIOSAudioContext = useCallback(async () => {
    initializeIOSAudioContext();
    
    // AudioContextが存在し、suspended状態の場合は必ず再開を試みる
    if (window.audioContext && window.audioContext.state === 'suspended') {
      try {
        await window.audioContext.resume();
      } catch {
        // AudioContext resume error (prepare)
      }
    }
  }, [initializeIOSAudioContext]);

  // 事前ロード済みAudio要素での再生関数
  const playPreloadedAudio = async (audio: HTMLAudioElement, audioPath: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const playStart = performance.now();
      console.log(`▶️ プリロード済み音声再生開始: ${audioPath}`);
      
      audio.onended = () => {
        const endTime = performance.now();
        console.log(`⏹️ プリロード済み音声終了: ${(endTime - playStart).toFixed(2)}ms再生時間 - ${audioPath}`);
        resolve();
      };
      
      audio.onerror = () => reject(new Error(`Preloaded audio error: ${audioPath}`));
      
      audio.currentTime = 0; // 再生位置をリセット
      audio.play().catch(reject);
    });
  };

  // Part3音声セグメントの事前プリロード関数
  const preloadPart3Segments = async (segments: any[], speakers: any[]): Promise<HTMLAudioElement[]> => {
    console.log(`📥 Part3セグメントの事前プリロード開始: ${segments.length}個`);
    const preloadStart = performance.now();
    
    const audioElements: HTMLAudioElement[] = [];
    const loadPromises: Promise<void>[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const voiceId = speakers ? getVoiceIdFromSpeaker(segment.speaker, speakers) : undefined;
      
      const audio = new Audio(convertToBlobUrl(segment.audioPath));
      audio.preload = 'auto';
      
      // 音量設定（ユーザー設定を適用）
      const baseVolume = voiceId && PART3_VOICE_VOLUME_MAP[voiceId] ? PART3_VOICE_VOLUME_MAP[voiceId] : 0.8;
      audio.volume = baseVolume * (gameSettings.audioVolume / 100);
      
      const loadPromise = new Promise<void>((resolve, reject) => {
        const segmentLoadStart = performance.now();
        
        audio.oncanplaythrough = () => {
          const segmentLoadEnd = performance.now();
          console.log(`✅ セグメント${i + 1}プリロード完了: ${(segmentLoadEnd - segmentLoadStart).toFixed(2)}ms - ${segment.audioPath}`);
          resolve();
        };
        
        audio.onerror = () => {
          console.error(`❌ セグメント${i + 1}プリロード失敗: ${segment.audioPath}`);
          reject(new Error(`Preload failed: ${segment.audioPath}`));
        };
        
        // ロード開始
        audio.load();
      });
      
      audioElements.push(audio);
      loadPromises.push(loadPromise);
    }
    
    // 全セグメントのプリロード完了を待機
    await Promise.all(loadPromises);
    
    const preloadEnd = performance.now();
    console.log(`🎉 全Part3セグメントプリロード完了: ${(preloadEnd - preloadStart).toFixed(2)}ms`);
    
    return audioElements;
  };

  // PC用シンプル音声再生関数（詳細タイミング測定付き）
  const playSimpleAudio = async (audioPath: string, voiceId?: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const blobUrl = convertToBlobUrl(audioPath);
      const createStart = performance.now();
      const audio = new Audio(blobUrl);
      const createEnd = performance.now();
      console.log(`🔧 Audio要素作成時間: ${(createEnd - createStart).toFixed(2)}ms - ${blobUrl}`);
      
      // 音量設定
      if (voiceId && PART3_VOICE_VOLUME_MAP[voiceId]) {
        audio.volume = PART3_VOICE_VOLUME_MAP[voiceId];
        console.log(`🔊 PC音声ID指定再生: voiceId="${voiceId}", 音量=${PART3_VOICE_VOLUME_MAP[voiceId]}`, { audioPath });
      } else {
        audio.volume = 0.8; // デフォルト音量
        console.log(`🔊 PC音声デフォルト再生: 音量=0.8 (voiceId="${voiceId || 'なし'}")`, { audioPath });
      }
      
      let playStart: number;
      
      audio.onloadeddata = () => {
        const loadedEnd = performance.now();
        console.log(`📥 Audio読み込み完了: ${(loadedEnd - createStart).toFixed(2)}ms - ${audioPath}`);
      };
      
      audio.onplay = () => {
        playStart = performance.now();
        console.log(`▶️ Audio再生開始: ${(playStart - createStart).toFixed(2)}ms総時間 - ${audioPath}`);
      };
      
      audio.onended = () => {
        const endTime = performance.now();
        console.log(`⏹️ Audio再生終了: ${(endTime - playStart).toFixed(2)}ms再生時間 - ${audioPath}`);
        resolve();
      };
      
      audio.onerror = () => reject(new Error(`Audio error: ${audioPath}`));
      
      const playCallStart = performance.now();
      audio.play().then(() => {
        const playCallEnd = performance.now();
        console.log(`🎬 Audio.play()実行時間: ${(playCallEnd - playCallStart).toFixed(2)}ms - ${audioPath}`);
      }).catch(reject);
    });
  };

  // リトライ機能付き音声再生関数（音量制御付き）
  const playAudioWithRetry = async (
    audioPath: string, 
    maxRetries: number = 3,
    retryDelay: number = 1000,
    timeout: number = 15000,
    voiceId?: string
  ): Promise<void> => {
    const blobUrl = convertToBlobUrl(audioPath);
    
    // PC用シンプル再生 / iOS用Web Audio API再生
    if (!isIOS) {
      // PC用：シンプルなHTML Audio再生
      return playSimpleAudio(blobUrl, voiceId);
    }
    
    // iOS用の複雑な処理
    if (isIOS && window.audioContext) {
      try {
        // AudioContextの状態を確認・復帰
        if (window.audioContext.state === 'suspended') {
          await window.audioContext.resume();
        }
        
        await playIOSAudioBuffer(blobUrl, voiceId);
        return; // 成功したら終了
      } catch {
        // フォールバック処理へ
      }
    }
    
    // 従来の音声再生処理（非iOS or フォールバック）
    if (isIOS) {
      await getAudioFileInfo(blobUrl);
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const audio = new Audio();
        audio.setAttribute('data-part2-player', 'true');
        
        // voice_idベースの音量設定
        let volumeLevel;
        
        if (voiceId) {
          // voiceIdがある場合は音声ID別の音量を使用（優先）
          volumeLevel = PART3_VOICE_VOLUME_MAP[voiceId] || DEFAULT_PART3_VOLUME;
          
          if (!PART3_VOICE_VOLUME_MAP[voiceId]) {
            console.warn(`音声警告: voiceId "${voiceId}" の音量設定が見つかりません。デフォルト音量 ${DEFAULT_PART3_VOLUME} を使用します。`);
          }
          
          console.log(`音声ID指定再生: voiceId="${voiceId}", 音量=${volumeLevel}`, { audioPath: blobUrl });
        } else {
          // 音声IDがない場合の音声タイプ判定
          const isPart1Audio = blobUrl.includes('/part1/');
          const isPart2Audio = blobUrl.includes('/part2/');
          const isLabelAudio = blobUrl.includes('/labels/');
          
          if (isPart1Audio) {
            volumeLevel = DEFAULT_PART2_VOLUME;
            console.log(`Part 1音声: デフォルト音量 ${DEFAULT_PART2_VOLUME} を使用`, { audioPath: blobUrl });
          } else if (isPart2Audio) {
            volumeLevel = DEFAULT_PART2_VOLUME;
            console.log(`Part 2音声: デフォルト音量 ${DEFAULT_PART2_VOLUME} を使用`, { audioPath: blobUrl });
          } else if (isLabelAudio) {
            volumeLevel = DEFAULT_PART2_VOLUME;
            console.log(`記号音声: デフォルト音量 ${DEFAULT_PART2_VOLUME} を使用`, { audioPath: blobUrl });
          } else {
            volumeLevel = DEFAULT_PART3_VOLUME;
            console.warn('Part 3音声警告: voiceIdが見つかりません。デフォルト音量を使用します。', {
              audioPath: blobUrl,
              defaultVolume: DEFAULT_PART3_VOLUME
            });
          }
        }
        
        // ユーザー設定のボリュームを適用
        audio.volume = volumeLevel * (gameSettings.audioVolume / 100);
        console.log(`🔊 最終音量: ${audio.volume} (ユーザー設定: ${gameSettings.audioVolume}%)`);
        
        // iOS向け設定
        if (isIOS) {
          // iOS向けの音声設定
          audio.preload = 'auto';
          audio.crossOrigin = 'anonymous';
          audio.src = blobUrl;
          audio.load(); // 明示的な読み込み開始
        } else {
          audio.src = blobUrl;
        }
        
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            audio.pause();
            const timeoutError = new Error(`Audio playback timeout (${timeout}ms): ${audioPath}`);
            reject(timeoutError);
          }, timeout);
          
          audio.onended = () => {
            clearTimeout(timeoutId);
            resolve();
          };
          
          audio.onerror = () => {
            clearTimeout(timeoutId);
            const playbackError = new Error(`Audio playback error: ${audioPath}`);
            reject(playbackError);
          };
          
          // iOS向けの音声再生処理
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            playPromise.then(() => {
              // 再生成功時の処理
            }).catch(err => {
              clearTimeout(timeoutId);
              if (isIOS) {
                // ユーザーインタラクション要求エラーの場合
                if (err.name === 'NotAllowedError') {
                  // iOS向けの代替処理：既存のすべての音声を停止
                  document.querySelectorAll('audio').forEach(a => {
                    a.pause();
                    a.currentTime = 0;
                  });

                  // 少し待ってから再試行
                  setTimeout(() => {
                    const retryAudio = new Audio(audioPath);
                    retryAudio.play().then(() => {
                      resolve();
                    }).catch(() => {
                      reject(err);
                    });
                  }, 100);
                  return;
                }
              }
              reject(err);
            });
          } else {
            // 古いブラウザ対応
          }
        });
        
        return; // 成功したら終了
        
      } catch (error) {
        console.warn(`Audio playback attempt ${attempt}/${maxRetries} failed for ${audioPath}:`, error);

        if (attempt < maxRetries) {
          console.log(`Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          throw error;
        }
      }
    }
  };

  // 音声ファイルの再生（別関数に分離）
  const playAudioFiles = async (audioFiles: any[], voiceId?: string) => {
    console.log('🎼 Part1 audio playback started with', audioFiles.length, 'audio files');
    
    try {
      // 現在音声が再生中の場合は停止
      if (isSpeaking) {
        console.log('🛑 Already speaking, stopping current audio');
        audioAbortRef.current = true; // 中断フラグを設定
        const existingAudio = document.querySelector('audio[data-part1-player]') as HTMLAudioElement;
        if (existingAudio) {
          existingAudio.pause();
          existingAudio.currentTime = 0;
        }
        window.speechSynthesis.cancel(); // Web Speech APIも停止
        setIsSpeaking(false);
        return;
      }

      console.log('🎯 Starting Part1 audio sequence');
      audioAbortRef.current = false; // 中断フラグをリセット
      setIsSpeaking(true);

      // 各選択肢の音声を順番に再生（記号音声 + 選択肢音声）
      for (let i = 0; i < audioFiles.length; i++) {
        // 中断フラグをチェック
        if (audioAbortRef.current) {
          console.log('🛑 Audio playback aborted');
          break;
        }
        const audioFile = audioFiles[i];
        
        if (!audioFile) {
          console.warn(`選択肢 ${i + 1} のデータがありません`);
          continue;
        }

        console.log(`🎵 Playing sequence ${i + 1}/${audioFiles.length}: ${audioFile.option}`);

        // 記号音声を再生（リトライ機能付き）
        const labelAudioPath = audioFile.labelAudioPath || `/audio/labels/option_${audioFile.option.toLowerCase()}.mp3`;
        console.log(`🔤 Playing label audio: ${audioFile.option}`);
        
        try {
          // Part1,2の記号音声には常に「EXAVITQu4vr4xnSDxMaL」を使用
          const labelVoiceId = "EXAVITQu4vr4xnSDxMaL";
          await playAudioWithRetry(labelAudioPath, 2, 500, 10000, labelVoiceId);
        } catch (error) {
          console.warn(`記号音声再生失敗（リトライ後）: ${labelAudioPath}`, error);
          // 記号音声のエラーは無視して続行
        }

        // 中断フラグをチェック
        if (audioAbortRef.current) {
          console.log('🛑 Audio playback aborted after label audio');
          break;
        }

        // 記号音声と選択肢音声の間に短い間隔
        await new Promise(resolve => setTimeout(resolve, 250));

        // 選択肢音声を再生（リトライ機能付き）
        if (audioFile.audioPath) {
          console.log(`🎵 Playing option audio: ${audioFile.text}`);
          
          try {
            await playAudioWithRetry(audioFile.audioPath, 3, 1000, 15000, voiceId);
          } catch (error) {
            console.error(`選択肢音声再生失敗（リトライ後）: ${audioFile.audioPath}`, error);
            // 選択肢音声のエラーも処理を継続（全体を中断しない）
          }
        } else {
          console.warn(`選択肢 ${audioFile.option} の音声ファイルがありません`);
        }

        // 中断フラグをチェック
        if (audioAbortRef.current) {
          console.log('🛑 Audio playback aborted after option audio');
          break;
        }

        // 選択肢間に間隔を追加
        if (i < audioFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }
      
      console.log('✅ Part1 audio sequence completed successfully');
    } catch (error) {
      console.error('❌ Part1 audio playback error:', error);
      // より具体的なエラーメッセージを表示
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('NotAllowedError')) {
        alert('音声再生には画面をタップする必要があります。再度お試しください。');
      } else if (errorMessage.includes('NetworkError')) {
        alert('音声ファイルの読み込みに失敗しました。ネットワーク接続を確認してください。');
      } else {
        alert('音声ファイルの再生に失敗しました。しばらく待ってから再度お試しください。');
      }
    } finally {
      setIsSpeaking(false);
      console.log('🎵 Part1 audio playback cleanup completed');
    }
  };

  // 音声読み上げ機能（Part 7等で使用）
  const speakText = (text: string) => {
    if (!text) return;
    
    // 現在音声が再生中の場合は停止
    if (isSpeaking) {
      audioAbortRef.current = true; // 中断フラグを設定
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    
    // Web Speech APIが利用可能かチェック
    if (!window.speechSynthesis) {
      alert('お使いのブラウザは音声読み上げ機能をサポートしていません。');
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // iPhoneのSafariで英語音声を確実に設定
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // より具体的な英語音声を検索（iOSでの優先順位）
      const englishVoice = voices.find(voice => 
        voice.lang === 'en-US' && voice.localService === false
      ) || voices.find(voice => 
        voice.lang === 'en-US'
      ) || voices.find(voice => 
        voice.lang.startsWith('en-')
      );
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      window.speechSynthesis.speak(utterance);
    };
    
    // 音声リストが読み込まれるまで待機（iOSで必要）
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
    } else {
      setVoiceAndSpeak();
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      alert('音声読み上げでエラーが発生しました。');
    };
  };

  // Part 2用音声再生（質問音声 → 選択肢音声）
  const playPart2Audio = (question: Part2Question) => {
    console.log('🎵 playPart2Audio called for:', question?.id);
    console.log('🎵 Question object:', question);
    console.log('🎵 Audio files:', question?.audioFiles);
    
    if (!question) {
      console.error('❌ No Part2Question provided');
      alert('問題データがありません。');
      return;
    }
    
    if (!question.audioFiles) {
      console.error('❌ Part2Question audioFiles missing for question:', question.id);
      console.log('Available question properties:', Object.keys(question));
      alert('この問題には音声ファイルがありません。');
      return;
    }
    
    if (!question.audioFiles.question?.audioPath) {
      console.error('❌ Question audio path missing');
      alert('質問音声ファイルがありません。');
      return;
    }
    
    console.log('✅ Starting Part 2 audio playback');
    playPart2AudioFiles(question.audioFiles);
  };

  // Part 2音声ファイルの再生（質問 → A → B → C）- Part1と同様の構造に変更
  const playPart2AudioFiles = async (audioFiles: Part2Question['audioFiles']) => {
    console.log('🎼 Part2 audio playback started with question + 3 options');
    
    try {
      // 現在音声が再生中の場合は停止
      if (isSpeaking) {
        console.log('🛑 Already speaking, stopping current audio');
        audioAbortRef.current = true; // 中断フラグを設定
        const existingAudio = document.querySelector('audio[data-part2-player]') as HTMLAudioElement;
        if (existingAudio) {
          existingAudio.pause();
          existingAudio.currentTime = 0;
        }
        window.speechSynthesis.cancel(); // Web Speech APIも停止
        setIsSpeaking(false);
        return;
      }

      console.log('🎯 Starting Part2 audio sequence');
      audioAbortRef.current = false; // 中断フラグをリセット
      setIsSpeaking(true);

      // 1. 質問音声を再生（リトライ機能付き）
      if (audioFiles.question?.audioPath) {
        console.log('🎵 Playing question audio');
        try {
          await playAudioWithRetry(audioFiles.question.audioPath, 3, 1000, 15000);
        } catch (error) {
          console.error('質問音声再生失敗（リトライ後）:', error);
          throw new Error('質問音声の再生に失敗しました。ネットワーク接続を確認してください。');
        }

        // 中断フラグをチェック
        if (audioAbortRef.current) {
          console.log('🛑 Audio playback aborted after question');
          return;
        }

        // 質問と選択肢の間に間隔
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 2. 各選択肢の音声を順番に再生（記号音声 + 選択肢音声）
      for (let i = 0; i < audioFiles.options.length; i++) {
        // 中断フラグをチェック
        if (audioAbortRef.current) {
          console.log('🛑 Part2 audio playback aborted');
          break;
        }

        const optionAudio = audioFiles.options[i];
        
        if (!optionAudio) {
          console.warn(`選択肢 ${i + 1} のデータがありません`);
          continue;
        }

        console.log(`🎵 Playing sequence ${i + 1}/${audioFiles.options.length}: ${optionAudio.option}`);

        // 記号音声を再生（A, B, C）
        console.log(`🔤 Playing label audio: ${optionAudio.option}`);
        
        try {
          // Part1,2の記号音声には常に「EXAVITQu4vr4xnSDxMaL」を使用
          const labelVoiceId = "EXAVITQu4vr4xnSDxMaL";
          await playAudioWithRetry(optionAudio.labelAudioPath, 2, 500, 10000, labelVoiceId);
        } catch (error) {
          console.warn(`記号音声再生失敗（リトライ後）: ${optionAudio.labelAudioPath}`, error);
          // 記号音声のエラーは無視して続行
        }

        // 中断フラグをチェック
        if (audioAbortRef.current) {
          console.log('🛑 Audio playback aborted after label audio');
          break;
        }

        // 記号音声と選択肢音声の間に短い間隔
        await new Promise(resolve => setTimeout(resolve, 250));

        // 選択肢音声を再生（リトライ機能付き）
        if (optionAudio.audioPath) {
          console.log(`🎵 Playing option audio: ${optionAudio.text}`);
          
          try {
            await playAudioWithRetry(optionAudio.audioPath, 3, 1000, 15000);
          } catch (error) {
            console.error(`選択肢音声再生失敗（リトライ後）: ${optionAudio.audioPath}`, error);
            // 選択肢音声のエラーも処理を継続（全体を中断しない）
          }
        } else {
          console.warn(`選択肢 ${optionAudio.option} の音声ファイルがありません`);
        }

        // 中断フラグをチェック
        if (audioAbortRef.current) {
          console.log('🛑 Audio playback aborted after option audio');
          break;
        }

        // 選択肢間に間隔を追加
        if (i < audioFiles.options.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }
      
      console.log('✅ Part2 audio sequence completed successfully');
    } catch (error) {
      console.error('❌ Part2 audio playback error:', error);
      // より具体的なエラーメッセージを表示
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('NotAllowedError')) {
        alert('音声再生には画面をタップする必要があります。再度お試しください。');
      } else if (errorMessage.includes('NetworkError')) {
        alert('音声ファイルの読み込みに失敗しました。ネットワーク接続を確認してください。');
      } else {
        alert('音声ファイルの再生に失敗しました。しばらく待ってから再度お試しください。');
      }
    } finally {
      setIsSpeaking(false);
      console.log('🎵 Part2 audio playback cleanup completed');
    }
  };

  // Part 3音声再生関数
  const playPart3Audio = (question: Part3Question) => {
    console.log('🎵 playPart3Audio called for:', question?.id);
    console.log('🔍 isSpeaking状態:', isSpeaking);
    console.log('📍 呼び出し元スタック:', new Error().stack?.split('\n')[2]?.trim());
    
    if (!question) {
      console.error('❌ No Part3Question provided');
      alert('問題データがありません。');
      return;
    }
    
    if (!question.audioFiles) {
      console.error('❌ Part3Question audioFiles missing for question:', question.id);
      alert('この問題には音声ファイルがありません。');
      return;
    }
    
    // 新旧両方のデータ構造に対応
    const hasLegacyAudio = question.audioFiles.conversation?.audioPath;
    const hasSegmentAudio = question.audioFiles.conversation?.segments && question.audioFiles.conversation.segments.length > 0;
    
    if (!hasLegacyAudio && !hasSegmentAudio) {
      console.error('❌ Conversation audio missing');
      alert('会話音声ファイルがありません。');
      return;
    }
    
    console.log('✅ Starting Part 3 audio playback');
    playPart3AudioFiles(question.audioFiles);
  };

  // Part 3音声ファイルの再生（会話全体）
  const playPart3AudioFiles = async (audioFiles: Part3Question['audioFiles']) => {
    console.log('🎼 playPart3AudioFiles called');
    
    if (!audioFiles) {
      console.warn('⚠️ No audio files provided for Part 3 playback');
      return;
    }
    
    // 現在のPart3問題から話者情報を取得
    const speakers = currentPart3Question?.speakers;
    
    try {
      // 現在音声が再生中の場合は停止
      if (isSpeaking) {
        console.log('🛑 Already speaking, stopping current audio');
        audioAbortRef.current = true;
        const existingAudio = document.querySelector('audio[data-part3-player]') as HTMLAudioElement;
        if (existingAudio) {
          existingAudio.pause();
          existingAudio.currentTime = 0;
        }
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      console.log('🎯 Starting Part 3 audio playback');
      audioAbortRef.current = false;
      setIsSpeaking(true);

      // iOS用のAudioContext初期化
      if (isIOS && window.audioContext) {
        prepareIOSAudioContext();
      }

      // 会話音声を再生（新旧両方のデータ構造に対応）
      if (audioFiles.conversation?.segments && audioFiles.conversation.segments.length > 0) {
        // 新形式：事前プリロードしてから順次再生
        console.log('🎵 Part3セグメントを事前プリロードしてから順次再生');
        
        let preloadedAudioElements: HTMLAudioElement[];
        try {
          // 全セグメントを事前プリロード
          preloadedAudioElements = await preloadPart3Segments(audioFiles.conversation.segments, speakers || []);
        } catch (error) {
          console.error('🚨 Part3セグメントのプリロードに失敗:', error);
          throw new Error('音声ファイルのプリロードに失敗しました。ネットワーク接続を確認してください。');
        }
        
        // 事前プリロード済み音声で順次再生
        for (let i = 0; i < audioFiles.conversation.segments.length; i++) {
          if (audioAbortRef.current) {
            console.log('🛑 Audio playback aborted during segment playback');
            break;
          }
          
          const segment = audioFiles.conversation.segments[i];
          const voiceId = speakers ? getVoiceIdFromSpeaker(segment.speaker, speakers) : undefined;
          console.log(`🎤 Part3セグメント: ${i + 1}/${audioFiles.conversation.segments.length} 話者${segment.speaker} 音声ID:${voiceId} "${segment.text.substring(0, 30)}..."`);
          
          try {
            const segmentStartTime = performance.now();
            console.log(`🎵 Part3セグメント${i + 1}再生開始(プリロード済): ${segment.audioPath}`);
            console.log(`📊 セグメント${i + 1}開始時刻: ${segmentStartTime.toFixed(2)}ms`);
            
            // プリロード済み音声で再生（読み込み待機なし）
            await playPreloadedAudio(preloadedAudioElements[i], segment.audioPath);
            
            const segmentEndTime = performance.now();
            console.log(`✅ Part3セグメント${i + 1}再生完了(プリロード済): ${segment.audioPath} (${(segmentEndTime - segmentStartTime).toFixed(2)}ms)`);
            console.log(`📊 セグメント${i + 1}終了時刻: ${segmentEndTime.toFixed(2)}ms`);
            
            // セグメント間に間隔を挿入（0ms設定でプリロードによりギャップなし）
            if (i < audioFiles.conversation.segments.length - 1) {
              const intervalStart = performance.now();
              console.log(`⏰ Part3間隔: セグメント${i + 1}→${i + 2}開始 (設定:0ms, プリロード済) 時刻:${intervalStart.toFixed(2)}ms`);
              await new Promise(resolve => setTimeout(resolve, 500)); // 500ms設定
              const intervalEnd = performance.now();
              const nextSegmentPrep = performance.now();
              console.log(`⏰ Part3間隔: セグメント${i + 1}→${i + 2}完了 (実際:${(intervalEnd - intervalStart).toFixed(2)}ms)`);
              console.log(`🔄 次セグメント準備開始: 時刻:${nextSegmentPrep.toFixed(2)}ms (前セグメント終了から${(nextSegmentPrep - segmentEndTime).toFixed(2)}ms後)`);
            }
          } catch (error) {
            console.error(`セグメント ${i + 1} の再生に失敗:`, error);
            throw new Error(`会話の再生中にエラーが発生しました（セグメント ${i + 1}）。`);
          }
        }
      } else if (audioFiles.conversation?.audioPath) {
        // 旧形式：単一音声ファイル（話者情報なしのためデフォルト音量）
        console.log('🎵 旧形式会話音声再生（プリロードなし）');
        try {
          await playAudioWithRetry(audioFiles.conversation.audioPath, 3, 1000, 30000, undefined); // 最大3回リトライ、1秒間隔、30秒タイムアウト（長い会話のため）
        } catch (error) {
          console.error('会話音声再生失敗（リトライ後）:', error);
          throw new Error('会話音声の再生に失敗しました。ネットワーク接続を確認してください。');
        }
      }

    } catch (error) {
      console.error('Part 3 audio playback error:', error);
      alert(`音声ファイルの再生に失敗しました。\n${error instanceof Error ? error.message : 'ネットワーク接続を確認してください。'}`);
    } finally {
      setIsSpeaking(false);
    }
  };



  // 連続正答数を更新
  const updateConsecutiveCorrect = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      const newConsecutive = consecutiveCorrect + 1;
      setConsecutiveCorrect(newConsecutive);
      localStorage.setItem('engConsecutiveCorrect', newConsecutive.toString());
      
      // 目標達成チェック
      if (newConsecutive >= gameSettings.targetConsecutive && !targetAchieved) {
        setTargetAchieved(true);
        setConsecutiveCorrect(0); // 達成後はリセット
        localStorage.setItem('engConsecutiveCorrect', '0');
        addDebugLog(`🎉 目標達成! ${gameSettings.targetConsecutive}連続正解 🎉`);
      } else {
        setTargetAchieved(false);
      }
      
      if (newConsecutive > bestConsecutive) {
        setBestConsecutive(newConsecutive);
        localStorage.setItem('engBestConsecutive', newConsecutive.toString());
      }
      
      addDebugLog(`連続正答数: ${newConsecutive}/${gameSettings.targetConsecutive}`);
    } else {
      setConsecutiveCorrect(0);
      setTargetAchieved(false);
      localStorage.setItem('engConsecutiveCorrect', '0');
      addDebugLog('不正解: 連続正答数をリセット');
    }
  }, [consecutiveCorrect, bestConsecutive, gameSettings.targetConsecutive, targetAchieved]);

  // 次の問題のインデックスを取得する関数（ランダムまたは順次）
  const getNextQuestionIndex = useCallback((
    questions: any[], 
    partType: keyof typeof sequentialIndices, 
    behavior: 'random' | 'sequential'
  ): number => {
    if (behavior === 'sequential') {
      const currentIndex = sequentialIndices[partType];
      const nextIndex = (currentIndex + 1) % questions.length;
      
      // インデックスを更新
      setSequentialIndices(prev => ({
        ...prev,
        [partType]: nextIndex
      }));
      
      return currentIndex;
    } else {
      // ランダム選択（既存のロジック）
      return getSecureRandomIndex(questions.length);
    }
  }, [sequentialIndices]);

  // Part 1問題をランダム選択する関数
  const selectRandomPart1Question = useCallback((settings: GameSettings) => {
    addDebugLog("=== selectRandomPart1Question 開始 ===", { settings });

    try {
      // メモリ内のPart 1問題を使用
      if (!allPart1Questions || allPart1Questions.length === 0) {
        setErrorMessage('Part 1問題が見つかりません。問題を生成してください。');
        addDebugLog("エラー: Part 1問題が存在しません");
        return;
      }

      // 最近選択された問題を避ける
      let availableQuestions = allPart1Questions.filter((q: any) => !recentPassageIds.includes(q.id));
      addDebugLog("最近選択されていないPart1問題数", { count: availableQuestions.length });

      // 難易度による絞り込み
      if (settings.difficulty !== 'all') {
        availableQuestions = availableQuestions.filter((q: any) => q.difficulty === settings.difficulty);
        addDebugLog(`${settings.difficulty}難易度のPart1問題に絞り込み`, { count: availableQuestions.length });
      }

      // 利用可能な問題がない場合のフォールバック
      if (availableQuestions.length === 0) {
        availableQuestions = allPart1Questions.filter((q: any) => !recentPassageIds.includes(q.id));
        if (availableQuestions.length === 0) {
          availableQuestions = allPart1Questions;
        }
        addDebugLog("フォールバック適用後のPart1問題数", { count: availableQuestions.length });
      }

      if (availableQuestions.length === 0) {
        setErrorMessage('Part 1問題が見つかりません。問題を生成してください。');
        return;
      }

      // 選択方法に応じてインデックスを決定
      const selectedIndex = getNextQuestionIndex(
        availableQuestions,
        'part1',
        settings.nextButtonBehavior
      );
      const selectedQuestion = availableQuestions[selectedIndex];

      addDebugLog("Part1問題を選択しました", {
        id: selectedQuestion.id,
        difficulty: selectedQuestion.difficulty,
        hasImage: !!selectedQuestion.imagePath
      });

      // 状態を設定
      setCurrentPart1Question(selectedQuestion);
      setCurrentPassage(null);
      setCurrentPart2Question(null);
      setCurrentPart3Question(null);
      setCurrentPart4Question(null);
      setCurrentPart5Question(null);
      setCurrentPart6Question(null);
      setSelectedAnswers({});
      setShowResults(false);
      setScore(0);
      setShowTranslation(false);
      setCopySuccess("");
      setHighlightedWords(new Set());
      setErrorMessage("");
      setTargetAchieved(false);
      setPart1ImageError(false);
      setPart1ImageLoading(true);

      // 選択履歴を更新
      setRecentPassageIds((prev) => {
        const newHistory = [...prev, selectedQuestion.id];
        return newHistory.slice(-5);
      });

      // スクロールをトップに
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);

      addDebugLog("=== selectRandomPart1Question 完了 ===");

    } catch (error) {
      console.error("Part1問題選択エラー:", error);
      setErrorMessage('Part 1問題の読み込みに失敗しました。');
      addDebugLog("Part1問題選択エラー", { error });
    }
  }, [recentPassageIds, allPart1Questions, getNextQuestionIndex]);

  // Part 2問題をランダム選択する関数
  const selectRandomPart2Question = useCallback((settings: GameSettings) => {
    addDebugLog("=== selectRandomPart2Question 開始 ===", { settings });
    
    try {
      // メモリ内のPart 2問題を使用（API呼び出しを削除）
      const part2Questions = allPart2Questions;
      
      if (!part2Questions || part2Questions.length === 0) {
        setErrorMessage('Part 2問題が見つかりません。問題を生成してください。');
        addDebugLog("エラー: Part 2問題が存在しません");
        return;
      }
      
      // 最近選択された問題を避ける
      let availableQuestions = part2Questions.filter((q: Part2Question) => !recentPassageIds.includes(q.id));
      addDebugLog("最近選択されていないPart2問題数", { count: availableQuestions.length });
      
      // 難易度でフィルタリング
      if (settings.difficulty !== 'all') {
        availableQuestions = availableQuestions.filter((q: Part2Question) => q.difficulty === settings.difficulty);
        addDebugLog(`${settings.difficulty}難易度に絞り込み`, { count: availableQuestions.length });
      }
      
      // 利用可能な問題がない場合は履歴をリセット
      if (availableQuestions.length === 0) {
        availableQuestions = part2Questions;
        if (settings.difficulty !== 'all') {
          availableQuestions = availableQuestions.filter((q: Part2Question) => q.difficulty === settings.difficulty);
        }
        addDebugLog("履歴リセット後のPart2問題数", { count: availableQuestions.length });
      }
      
      // それでも問題がない場合
      if (availableQuestions.length === 0) {
        availableQuestions = part2Questions;
        addDebugLog("全条件リセット後のPart2問題数", { count: availableQuestions.length });
      }
      
      const selectedIndex = getNextQuestionIndex(
        availableQuestions, 
        'part2', 
        settings.nextButtonBehavior
      );
      const selectedQuestion = availableQuestions[selectedIndex];
      
      addDebugLog("選択されたPart2問題", {
        id: selectedQuestion.id,
        question: selectedQuestion.question,
        difficulty: selectedQuestion.difficulty,
        questionType: selectedQuestion.questionType
      });
      
      // 状態更新
      setCurrentPassage(null); // 通常のpassageをクリア
      setCurrentPart1Question(null);
      setCurrentPart2Question(selectedQuestion);
      setCurrentPart3Question(null);
      setCurrentPart4Question(null);
      setCurrentPart5Question(null);
      setCurrentPart6Question(null);
      setTargetAchieved(false);
      setSelectedAnswers({});
      setShowResults(false);
      setScore(0);
      setShowTranslation(false);
      setCopySuccess("");
      setHighlightedWords(new Set());
      setErrorMessage("");
      lastProcessedPassageIdRef.current = selectedQuestion.id;
      
      // 選択履歴を更新
      setRecentPassageIds((prev) => {
        const newHistory = [...prev, selectedQuestion.id];
        return newHistory.slice(-5);
      });
      
      // スクロールをトップに
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);
      
      addDebugLog("=== selectRandomPart2Question 完了 ===");
      
    } catch (error) {
      console.error('Part 2 question selection error:', error);
      setErrorMessage('Part 2問題の読み込みに失敗しました。');
      addDebugLog("Part 2問題選択エラー", { error });
    }
  }, [recentPassageIds, allPart2Questions, getNextQuestionIndex]);

  // Part 3問題を選択する関数
  const selectRandomPart3Question = useCallback((settings: GameSettings) => {
    addDebugLog("=== selectRandomPart3Question 開始 ===", { settings });
    
    try {
      // メモリ内のPart 3問題を使用
      const part3Questions = allPart3Questions;
      
      if (!part3Questions || part3Questions.length === 0) {
        setErrorMessage('Part 3問題が見つかりません。問題を生成してください。');
        addDebugLog("エラー: Part 3問題が存在しません");
        return;
      }
      
      // 最近選択された問題を避ける
      let availableQuestions = part3Questions.filter((q: Part3Question) => !recentPassageIds.includes(q.id));
      addDebugLog("最近選択されていないPart3問題数", { count: availableQuestions.length });
      
      // 難易度でフィルタリング
      if (settings.difficulty !== 'all') {
        availableQuestions = availableQuestions.filter((q: Part3Question) => q.difficulty === settings.difficulty);
        addDebugLog(`${settings.difficulty}難易度に絞り込み`, { count: availableQuestions.length });
      }
      
      // 利用可能な問題がない場合は履歴をリセット
      if (availableQuestions.length === 0) {
        availableQuestions = part3Questions;
        if (settings.difficulty !== 'all') {
          availableQuestions = availableQuestions.filter((q: Part3Question) => q.difficulty === settings.difficulty);
        }
        addDebugLog("履歴リセット後のPart3問題数", { count: availableQuestions.length });
      }
      
      if (availableQuestions.length === 0) {
        setErrorMessage(`難易度 ${settings.difficulty} のPart 3問題が見つかりません。`);
        addDebugLog("エラー: 条件に合うPart 3問題が存在しません", { difficulty: settings.difficulty });
        return;
      }
      
      // 選択方法に応じてインデックスを決定
      const selectedIndex = getNextQuestionIndex(
        availableQuestions, 
        'part3', 
        settings.nextButtonBehavior
      );
      const selectedQuestion = availableQuestions[selectedIndex];
      
      // Part 3問題を設定
      console.log("🎯 Part3問題選択時の状態クリア:", {
        before: {
          currentPassage: currentPassage ? { id: currentPassage!.id } : null,
          currentPart2Question: currentPart2Question ? { id: currentPart2Question!.id } : null,
          currentPart3Question: currentPart3Question ? { id: currentPart3Question!.id } : null
        },
        newQuestion: { id: selectedQuestion.id, type: "part3" }
      });
      
      setShowResults(false);
      setSelectedAnswers({});
      console.log("🎯 状態クリア実行中...");
      setCurrentPassage(null); // 他パートの状態をクリア
      setCurrentPart1Question(null);
      setCurrentPart2Question(null);
      setCurrentPart3Question(selectedQuestion);
      setCurrentPart4Question(null);
      setCurrentPart5Question(null);
      setCurrentPart6Question(null);
      console.log("🎯 setCurrentPart3Question実行完了");
      setScore(0);
      setShowTranslation(false);
      setCopySuccess("");
      setHighlightedWords(new Set());
      setErrorMessage(""); // エラーメッセージをクリア
      stopTimer();
      
      console.log("🎯 Part3問題選択完了:", {
        after: {
          currentPassage: null,
          currentPart2Question: null,
          currentPart3Question: { id: selectedQuestion.id }
        }
      });
      
      // 履歴を更新
      setRecentPassageIds((prev) => {
        const newHistory = [selectedQuestion.id, ...prev.filter((id) => id !== selectedQuestion.id)].slice(0, 5);
        addDebugLog("Part3履歴更新", { newHistory });
        return newHistory;
      });
      
      // タイマー開始（Part 3は3問あるので時間を3倍に）
      if (settings.answerTime > 0) {
        startTimer();
      }
      
      // スクロールをトップに
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);
      
      addDebugLog("=== selectRandomPart3Question 完了 ===");
      
    } catch (error) {
      console.error('Part 3 question selection error:', error);
      setErrorMessage('Part 3問題の読み込みに失敗しました。');
      addDebugLog("Part 3問題選択エラー", { error });
    }
  }, [recentPassageIds, allPart3Questions, startTimer, getNextQuestionIndex]);

  // Part 4問題をランダムに選択する関数
  const selectRandomPart4Question = useCallback((settings: GameSettings) => {
    addDebugLog("=== selectRandomPart4Question 開始 ===", { settings });
    
    try {
      // メモリ内のPart 4問題を使用
      const part4Questions = allPart4Questions;
      
      if (!part4Questions || part4Questions.length === 0) {
        setErrorMessage('Part 4問題が見つかりません。問題を生成してください。');
        addDebugLog("エラー: Part 4問題が存在しません");
        return;
      }
      
      // 最近選択された問題を避ける
      let availableQuestions = part4Questions.filter((q: Part4Question) => !recentPassageIds.includes(q.id));
      addDebugLog("最近選択されていないPart4問題数", { count: availableQuestions.length });
      
      // 難易度でフィルタリング
      if (settings.difficulty !== 'all') {
        availableQuestions = availableQuestions.filter((q: Part4Question) => q.difficulty === settings.difficulty);
        addDebugLog(`${settings.difficulty}難易度に絞り込み`, { count: availableQuestions.length });
      }
      
      // 利用可能な問題がない場合は全問題から選択
      if (availableQuestions.length === 0) {
        availableQuestions = part4Questions;
        addDebugLog("全Part4問題を対象に変更", { count: availableQuestions.length });
      }
      
      // 再度難易度フィルタリング（全問題対象の場合）
      if (settings.difficulty !== 'all') {
        availableQuestions = availableQuestions.filter((q: Part4Question) => q.difficulty === settings.difficulty);
        if (availableQuestions.length === 0) {
          // 指定難易度がない場合は全難易度から選択
          availableQuestions = part4Questions;
        }
      }
      
      // 選択方法に応じてインデックスを決定
      const selectedIndex = getNextQuestionIndex(
        availableQuestions, 
        'part4', 
        settings.nextButtonBehavior
      );
      const selectedQuestion = availableQuestions[selectedIndex];
      
      addDebugLog("Part 4問題選択完了", { 
        selectedId: selectedQuestion.id,
        speechType: selectedQuestion.speechType,
        difficulty: selectedQuestion.difficulty
      });
      
      // 状態を更新
      setCurrentPart4Question(selectedQuestion);
      setCurrentPassage(null);
      setCurrentPart1Question(null);
      setCurrentPart2Question(null);
      setCurrentPart3Question(null);
      setCurrentPart5Question(null);
      setCurrentPart6Question(null);
      setSelectedAnswers({});
      setShowResults(false);
      setShowTranslation(false);
      setErrorMessage("");
      
      // タイマーを開始
      startTimer();
      
      // 問題IDを履歴に追加
      setRecentPassageIds(prev => {
        const newHistory = [...prev, selectedQuestion.id];
        return newHistory.slice(-5);
      });
      
      // スクロールをトップに
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);
      
      addDebugLog("=== selectRandomPart4Question 完了 ===");
      
    } catch (error) {
      console.error('Part 4 question selection error:', error);
      setErrorMessage('Part 4問題の読み込みに失敗しました。');
      addDebugLog("Part 4問題選択エラー", { error });
    }
  }, [recentPassageIds, allPart4Questions, startTimer, getNextQuestionIndex]);

  // Part 5問題をランダムに選択する関数
  const selectRandomPart5Question = useCallback((settings: GameSettings) => {
    addDebugLog("=== selectRandomPart5Question 開始 ===", { settings });
    
    try {
      // メモリ内のPart 5問題を使用
      const part5Questions = allPart5Questions;
      
      if (!part5Questions || part5Questions.length === 0) {
        setErrorMessage('Part 5問題が見つかりません。問題を生成してください。');
        addDebugLog("エラー: Part 5問題が存在しません");
        return;
      }
      
      // 最近選択された問題を避ける
      let availableQuestions = part5Questions.filter((q: Part5Question) => !recentPassageIds.includes(q.id));
      addDebugLog("最近選択されていないPart5問題数", { count: availableQuestions.length });
      
      // 難易度でフィルタリング
      if (settings.difficulty !== 'all') {
        availableQuestions = availableQuestions.filter((q: Part5Question) => q.difficulty === settings.difficulty);
        addDebugLog(`${settings.difficulty}難易度に絞り込み`, { count: availableQuestions.length });
      }
      
      // 利用可能な問題がない場合は全問題から選択
      if (availableQuestions.length === 0) {
        availableQuestions = part5Questions;
        addDebugLog("全Part5問題を対象に変更", { count: availableQuestions.length });
      }
      
      // 再度難易度フィルタリング（全問題対象の場合）
      if (settings.difficulty !== 'all') {
        availableQuestions = availableQuestions.filter((q: Part5Question) => q.difficulty === settings.difficulty);
        if (availableQuestions.length === 0) {
          // 指定難易度がない場合は全難易度から選択
          availableQuestions = part5Questions;
        }
      }
      
      // 選択方法に応じてインデックスを決定
      const selectedIndex = getNextQuestionIndex(
        availableQuestions, 
        'part5', 
        settings.nextButtonBehavior
      );
      const selectedQuestion = availableQuestions[selectedIndex];
      
      addDebugLog("Part 5問題選択完了", { 
        selectedId: selectedQuestion.id,
        category: selectedQuestion.category,
        difficulty: selectedQuestion.difficulty
      });
      
      // 状態を更新
      setCurrentPart5Question(selectedQuestion);
      setCurrentPassage(null);
      setCurrentPart1Question(null);
      setCurrentPart2Question(null);
      setCurrentPart3Question(null);
      setCurrentPart4Question(null);
      setCurrentPart6Question(null);
      setSelectedAnswers({});
      setShowResults(false);
      setShowTranslation(false);
      setErrorMessage("");
      
      // タイマーを開始
      startTimer();
      
      // 問題IDを履歴に追加
      setRecentPassageIds(prev => {
        const newHistory = [...prev, selectedQuestion.id];
        return newHistory.slice(-5);
      });
      
      // スクロールをトップに
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);
      
      addDebugLog("=== selectRandomPart5Question 完了 ===", {
        currentPart5QuestionId: selectedQuestion.id,
        currentPart5QuestionSet: !!selectedQuestion
      });
      
    } catch (error) {
      console.error('Part 5 question selection error:', error);
      setErrorMessage('Part 5問題の読み込みに失敗しました。');
      addDebugLog("Part 5問題選択エラー", { error });
    }
  }, [recentPassageIds, allPart5Questions, startTimer, getNextQuestionIndex]);

  // Part 6問題選択関数
  const selectRandomPart6Question = useCallback((settings: GameSettings) => {
    addDebugLog("=== selectRandomPart6Question 開始 ===", { settings });
    
    try {
      // メモリ内のPart 6問題を使用
      const part6Questions = allPart6Questions;
      
      if (!part6Questions || part6Questions.length === 0) {
        setErrorMessage('Part 6問題が見つかりません。問題を生成してください。');
        addDebugLog("エラー: Part 6問題が存在しません");
        return;
      }
      
      // 最近選択された問題を避ける
      let availableQuestions = part6Questions.filter((q: Part6Data) => !recentPassageIds.includes(q.id));
      addDebugLog("最近選択されていないPart6問題数", { count: availableQuestions.length });
      
      // 利用可能な問題がない場合は全問題から選択
      if (availableQuestions.length === 0) {
        availableQuestions = part6Questions;
        addDebugLog("最近使用問題なし - 全問題から選択", { count: availableQuestions.length });
      }
      
      // 難易度フィルタリング
      if (settings.difficulty !== 'all') {
        const filteredByDifficulty = availableQuestions.filter((q: Part6Data) => q.difficulty === settings.difficulty);
        if (filteredByDifficulty.length > 0) {
          availableQuestions = filteredByDifficulty;
          addDebugLog(`難易度${settings.difficulty}でフィルタリング`, { count: availableQuestions.length });
        }
      }
      
      // 選択方法に応じてインデックスを決定
      const selectedIndex = getNextQuestionIndex(
        availableQuestions, 
        'part6', 
        settings.nextButtonBehavior
      );
      const selectedQuestion = availableQuestions[selectedIndex];
      
      addDebugLog("選択されたPart6問題", {
        id: selectedQuestion.id,
        title: selectedQuestion.title,
        difficulty: selectedQuestion.difficulty,
        topic: selectedQuestion.topic,
        questionCount: selectedQuestion.questions.length
      });
      
      // Part 6問題を設定
      setCurrentPart6Question(selectedQuestion);
      setCurrentPassage(null);
      setCurrentPart1Question(null);
      setCurrentPart2Question(null);
      setCurrentPart3Question(null);
      setCurrentPart4Question(null);
      setCurrentPart5Question(null);
      setSelectedAnswers({});
      setShowResults(false);
      setShowTranslation(false);
      setScore(0);
      setErrorMessage("");
      startTimer();
      
      // 履歴に追加
      setRecentPassageIds(prev => {
        const newHistory = [...prev, selectedQuestion.id];
        return newHistory.slice(-5);
      });
      
      // スクロールをトップに
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);
      
      addDebugLog("=== selectRandomPart6Question 完了 ===", {
        currentPart6QuestionId: selectedQuestion.id,
        currentPart6QuestionSet: !!selectedQuestion
      });
      
    } catch (error) {
      console.error('Part 6 question selection error:', error);
      setErrorMessage('Part 6問題の読み込みに失敗しました。');
      addDebugLog("Part 6問題選択エラー", { error });
    }
  }, [recentPassageIds, allPart6Questions, startTimer, getNextQuestionIndex]);

  // 指定された設定を使って問題を選択する関数
  const selectRandomPassageWithSettings = useCallback(async (settings: GameSettings) => {
    addDebugLog("=== selectRandomPassageWithSettings 開始 ===", {
      settings,
      toeicPart: settings.toeicPart
    });

    // Part 0の場合は別処理
    if (settings.toeicPart === 'part0') {
      addDebugLog("Part 0が選択されました", {
        allPart0SentencesLength: allPart0Sentences.length,
        difficulty: settings.difficulty,
        nextButtonBehavior: settings.nextButtonBehavior
      });
      
      // Part 0に切り替える前に現在のpassageをクリア
      setCurrentPassage(null);
      setCurrentPart1Question(null);
      setCurrentPart2Question(null);
      setCurrentPart3Question(null);
      setCurrentPart4Question(null);
      setCurrentPart5Question(null);
      setCurrentPart6Question(null);
      
      // Part 0の問題をフィルタリング
      const filteredSentences = allPart0Sentences.filter(s => {
        if (settings.difficulty === 'all') return true;
        if (settings.difficulty === 'easy') return s.difficulty === 'beginner';
        if (settings.difficulty === 'medium') return s.difficulty === 'intermediate';
        if (settings.difficulty === 'hard') return s.difficulty === 'advanced';
        return true;
      });
      
      if (filteredSentences.length === 0) {
        addDebugLog("Part 0データが見つかりません");
        setErrorMessage("Part 0 Foundationの問題データがありません。問題を生成するか、設定を変更してください。");
        return;
      }
      
      // 選択方法に応じてインデックスを決定（他のパートと同じ方式）
      const selectedIndex = getNextQuestionIndex(
        filteredSentences,
        'part0',
        settings.nextButtonBehavior
      );
      const selectedSentence = filteredSentences[selectedIndex];
      
      addDebugLog("Part 0問題を選択", {
        id: selectedSentence.id,
        text: selectedSentence.text,
        difficulty: selectedSentence.difficulty
      });
      
      setCurrentPart0Sentence(selectedSentence);
      return;
    }

    // Part 1の場合は別処理
    if (settings.toeicPart === 'part1') {
      // Part 1に切り替える前に現在のpassageをクリア
      setCurrentPassage(null);
      setCurrentPart0Sentence(null);
      setCurrentPart2Question(null);
      setCurrentPart3Question(null);
      setCurrentPart4Question(null);
      setCurrentPart5Question(null);
      setCurrentPart6Question(null);
      selectRandomPart1Question(settings);
      return;
    }

    // Part 2の場合は別処理
    if (settings.toeicPart === 'part2') {
      // Part 2に切り替える前に現在のpassageをクリア
      setCurrentPassage(null);
      setCurrentPart0Sentence(null);
      setCurrentPart1Question(null);
      setCurrentPart3Question(null);
      setCurrentPart4Question(null);
      setCurrentPart5Question(null);
      setCurrentPart6Question(null);
      selectRandomPart2Question(settings);
      return;
    }
    
    // Part 3の場合は別処理
    if (settings.toeicPart === 'part3') {
      // Part 3に切り替える前に現在のpassageをクリア
      setCurrentPassage(null);
      setCurrentPart0Sentence(null);
      setCurrentPart1Question(null);
      setCurrentPart2Question(null);
      setCurrentPart4Question(null);
      setCurrentPart5Question(null);
      setCurrentPart6Question(null);
      selectRandomPart3Question(settings);
      return;
    }

    // Part 4の場合は別処理
    if (settings.toeicPart === 'part4') {
      // Part 4に切り替える前に現在のpassageをクリア
      setCurrentPassage(null);
      setCurrentPart0Sentence(null);
      setCurrentPart1Question(null);
      setCurrentPart2Question(null);
      setCurrentPart3Question(null);
      setCurrentPart5Question(null);
      setCurrentPart6Question(null);
      selectRandomPart4Question(settings);
      return;
    }

    // Part 5の場合は別処理
    if (settings.toeicPart === 'part5') {
      // Part 5に切り替える前に現在のpassageをクリア
      setCurrentPassage(null);
      setCurrentPart0Sentence(null);
      setCurrentPart1Question(null);
      setCurrentPart2Question(null);
      setCurrentPart3Question(null);
      setCurrentPart4Question(null);
      setCurrentPart6Question(null);
      selectRandomPart5Question(settings);
      return;
    }

    // Part 6の場合は別処理
    if (settings.toeicPart === 'part6') {
      // Part 6に切り替える前に現在のpassageをクリア
      setCurrentPassage(null);
      setCurrentPart0Sentence(null);
      setCurrentPart1Question(null);
      setCurrentPart2Question(null);
      setCurrentPart3Question(null);
      setCurrentPart4Question(null);
      setCurrentPart5Question(null);
      selectRandomPart6Question(settings);
      return;
    }

    // この時点でPart 7のみの処理（Part 1-6は既に分岐済み）
    const passages = allPassages;
    addDebugLog("利用可能なPart 7問題数", { count: passages?.length || "undefined" });

    if (!passages || passages.length === 0) {
      addDebugLog("エラー: Part 7問題データが読み込めません");
      return;
    }

    // 最近選択された問題を避ける（直近5問）
    let availablePassages = passages.filter((passage) => !recentPassageIds.includes(passage.id));
    addDebugLog("最近選択されていないPart 7問題数", { count: availablePassages.length });

    // Part 7による絞り込み
    availablePassages = availablePassages.filter((passage) => {
      const passageType = passage.partType || passage.toeicPart;
      return passageType === settings.toeicPart;
    });
    console.log(`🔍 After ${settings.toeicPart} filtering:`, { 
      count: availablePassages.length,
      sampleIds: availablePassages.slice(0, 3).map(p => p.id)
    });
    addDebugLog(`${settings.toeicPart} 問題に絞り込み`, { count: availablePassages.length });

    // TOEICPartによる絞り込みで既に適切にフィルタリングされているので、追加の絞り込みは不要

    // 図表付きによる絞り込み
    if (settings.hasChart === 'with_chart') {
      availablePassages = availablePassages.filter((passage) => passage.hasChart || passage.chart);
      addDebugLog("図表付き問題に絞り込み", { count: availablePassages.length });
    } else if (settings.hasChart === 'without_chart') {
      availablePassages = availablePassages.filter((passage) => !passage.hasChart && !passage.chart);
      addDebugLog("図表なし問題に絞り込み", { count: availablePassages.length });
    }

    // 難易度による絞り込み
    if (settings.difficulty === 'easy') {
      availablePassages = availablePassages.filter((passage) => passage.metadata?.difficulty === 'easy');
      addDebugLog("Easy難易度問題に絞り込み", { count: availablePassages.length });
    } else if (settings.difficulty === 'medium') {
      availablePassages = availablePassages.filter((passage) => passage.metadata?.difficulty === 'medium');
      addDebugLog("Medium難易度問題に絞り込み", { count: availablePassages.length });
    } else if (settings.difficulty === 'hard') {
      const beforeCount = availablePassages.length;
      availablePassages = availablePassages.filter((passage) => {
        return passage.metadata?.difficulty === 'hard';
      });
      console.log(`🔍 After hard difficulty filtering:`, { 
        beforeCount, 
        afterCount: availablePassages.length,
        sampleIds: availablePassages.slice(0, 3).map(p => p.id)
      });
      addDebugLog("Hard難易度問題に絞り込み", { count: availablePassages.length });
    }

    // 利用可能な問題がない場合は履歴をリセット
    let passagesToUse = availablePassages.length > 0 ? availablePassages : passages;
    
    if (availablePassages.length === 0) {
      console.log('⚠️  No passages available after filtering, resetting to full list');
      console.log('Settings causing issue:', settings);
      console.log('Total passages:', passages.length);
      console.log('Sample passages structure:', passages.slice(0, 2).map(p => ({
        id: p.id,
        partType: p.partType,
        toeicPart: p.toeicPart,
        difficulty: p.metadata?.difficulty
      })));
    }
    
    // 履歴リセット後も設定による絞り込みを適用
    if (passagesToUse === passages) {
      passagesToUse = passages.filter((passage) => 
        (passage.partType || passage.toeicPart) === settings.toeicPart
      );
      addDebugLog("履歴リセット後、TOEIC Part絞り込み", { count: passagesToUse.length, toeicPart: settings.toeicPart });
      
      // 図表付きフィルタリングも適用
      if (settings.hasChart === 'with_chart') {
        passagesToUse = passagesToUse.filter((passage) => passage.hasChart || passage.chart);
        addDebugLog("履歴リセット後、図表付き問題に絞り込み", { count: passagesToUse.length });
      } else if (settings.hasChart === 'without_chart') {
        passagesToUse = passagesToUse.filter((passage) => !passage.hasChart && !passage.chart);
        addDebugLog("履歴リセット後、図表なし問題に絞り込み", { count: passagesToUse.length });
      }
      
      // 難易度フィルタリングも適用
      if (settings.difficulty === 'easy') {
        passagesToUse = passagesToUse.filter((passage) => passage.metadata?.difficulty === 'easy');
        addDebugLog("履歴リセット後、Easy難易度問題に絞り込み", { count: passagesToUse.length });
      } else if (settings.difficulty === 'medium') {
        passagesToUse = passagesToUse.filter((passage) => passage.metadata?.difficulty === 'medium');
        addDebugLog("履歴リセット後、Medium難易度問題に絞り込み", { count: passagesToUse.length });
      } else if (settings.difficulty === 'hard') {
        passagesToUse = passagesToUse.filter((passage) => passage.metadata?.difficulty === 'hard');
        addDebugLog("履歴リセット後、Hard難易度問題に絞り込み", { count: passagesToUse.length });
      }
    }
    addDebugLog("実際に使用する問題数", { count: passagesToUse.length });

    // 利用可能な問題がない場合のフォールバック処理
    if (passagesToUse.length === 0) {
      addDebugLog("フォールバック処理開始: 条件を段階的に緩和");
      
      // フォールバック1: 難易度条件を除外
      let fallbackPassages = passages.filter((passage) => 
        (passage.partType || passage.toeicPart) === settings.toeicPart
      );
      if (settings.hasChart === 'with_chart') {
        fallbackPassages = fallbackPassages.filter((passage) => passage.hasChart || passage.chart);
      } else if (settings.hasChart === 'without_chart') {
        fallbackPassages = fallbackPassages.filter((passage) => !passage.hasChart && !passage.chart);
      }
      addDebugLog("フォールバック1 (難易度除外):", { count: fallbackPassages.length });
      
      // フォールバック2: 図表条件も除外
      if (fallbackPassages.length === 0) {
        fallbackPassages = passages.filter((passage) => 
          (passage.partType || passage.toeicPart) === settings.toeicPart
        );
        addDebugLog("フォールバック2 (図表条件も除外):", { count: fallbackPassages.length });
      }
      
      // フォールバック3: すべての条件を除外してランダム選択
      if (fallbackPassages.length === 0) {
        fallbackPassages = passages;
        addDebugLog("フォールバック3 (全条件除外):", { count: fallbackPassages.length });
      }
      
      // 最終的にも問題がない場合のみエラー
      if (fallbackPassages.length === 0) {
        const errorMsg = `${settings.toeicPart}の${settings.difficulty}問題が見つかりません。他の設定を試すか、問題を生成してください。`;
        setErrorMessage(errorMsg);
        setCurrentPassage(null);
        setCurrentPart2Question(null);
        console.error('❌ Critical error - no passages found:', { settings, totalPassages: passages.length });
        addDebugLog(`致命的エラー: 問題データが存在しません`);
        return;
      }
      
      // フォールバック問題から選択
      passagesToUse = fallbackPassages;
      addDebugLog("フォールバック問題を使用:", { count: passagesToUse.length });
    }

    // Part 7の選択方法に応じてインデックスを決定
    const part7Type = settings.toeicPart as keyof typeof sequentialIndices;
    const selectedIndex = getNextQuestionIndex(
      passagesToUse, 
      part7Type, 
      settings.nextButtonBehavior
    );
    const selectedPassage = passagesToUse[selectedIndex];
    addDebugLog("選択された問題", {
      id: selectedPassage?.id,
      title: selectedPassage?.title,
      questionCount: selectedPassage?.questions?.length,
      isMultiDocument: selectedPassage?.isMultiDocument,
      documentsCount: selectedPassage?.documents?.length,
    });

    if (!selectedPassage) {
      addDebugLog("エラー: 問題の選択に失敗しました");
      return;
    }

    addDebugLog("状態リセット開始");

    // 状態更新を一括で行い、巻き戻りを防ぐ
    const updateStates = () => {
      setCurrentPassage(selectedPassage as Passage);
      setCurrentPart0Sentence(null); // Part 0をクリア
      setCurrentPart1Question(null); // Part 1問題をクリア
      setCurrentPart2Question(null); // Part 2問題をクリア
      setCurrentPart3Question(null); // Part 3問題をクリア
      setCurrentPart4Question(null); // Part 4問題をクリア
      setTargetAchieved(false);
      setSelectedAnswers({});
      setShowResults(false);
      setScore(0);
      setShowTranslation(false);
      setCopySuccess("");
      setHighlightedWords(new Set());
      setErrorMessage(""); // エラーメッセージをクリア
      // Reset URL parameter tracking when a new passage is intentionally loaded
      lastProcessedPassageIdRef.current = selectedPassage.id;

      // 選択履歴を更新（最大5問まで保持）
      setRecentPassageIds((prev) => {
        const newHistory = [...prev, selectedPassage.id];
        return newHistory.slice(-5); // 最新5問のみ保持
      });
    };

    // 状態更新を同期的に実行
    updateStates();
    addDebugLog("状態リセット完了");

    // 状態更新後にスクロール
    setTimeout(() => {
      window.scrollTo({ top: 0 });
    }, 0);

    addDebugLog("=== selectRandomPassageWithSettings 完了 ===");
  }, [recentPassageIds, allPassages, allPart0Sentences, selectRandomPart1Question, selectRandomPart2Question, selectRandomPart3Question, selectRandomPart4Question, selectRandomPart5Question, selectRandomPart6Question, getNextQuestionIndex]);

  const selectRandomPassage = useCallback(() => {
    addDebugLog("=== selectRandomPassage 開始 ===");
    addDebugLog("現在のgameSettings", gameSettings);
    
    // 音声読み上げを停止
    if (isSpeaking) {
      audioAbortRef.current = true; // 中断フラグを設定
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    // URLパラメータをクリアしてランダム選択を優先
    const url = new URL(window.location.href);
    if (url.searchParams.has('id')) {
      url.searchParams.delete('id');
      window.history.replaceState({}, '', url.toString());
      // URL パラメータをクリアしたので、処理済みIDもリセット
      lastProcessedPassageIdRef.current = null;
    }
    
    // 現在の設定を使用して問題を選択
    selectRandomPassageWithSettings(gameSettings);
    
    addDebugLog("=== selectRandomPassage 完了 ===");
  }, [gameSettings, selectRandomPassageWithSettings, isSpeaking]);

  // URLパラメータから特定の問題を取得する関数
  const loadSpecificPassage = useCallback((passageId: string) => {
    console.log("🎯 loadSpecificPassage called", { passageId });
    
    // Part 5問題から検索
    const targetPart5Question = allPart5Questions.find((q: Part5Question) => q.id === passageId);
    
    if (targetPart5Question) {
      console.log("🎯 loadSpecificPassage: Part5問題をロード", { questionId: targetPart5Question.id });
      // Part 5問題を表示
      setCurrentPassage(null); // 通常のpassageをクリア
      setCurrentPart1Question(null); // Part 1問題をクリア
      setCurrentPart2Question(null); // Part 2問題をクリア
      setCurrentPart3Question(null); // Part 3問題をクリア
      setCurrentPart4Question(null); // Part 4問題をクリア
      setCurrentPart5Question(targetPart5Question);
      setShowResults(false);
      setSelectedAnswers({});
      setScore(0);
      setShowTranslation(false);
      setCopySuccess("");
      setHighlightedWords(new Set());
      setErrorMessage("");
      lastProcessedPassageIdRef.current = passageId;
      
      console.log("🔍 Part 5問題設定完了", {
        questionId: targetPart5Question.id,
        sentence: targetPart5Question.sentence,
        difficulty: targetPart5Question.difficulty,
        showResults: false,
        errorMessage: "",
        allStatesCleared: true
      });
      
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);
      
      return true;
    }
    
    // Part 4問題から検索
    const targetPart4Question = allPart4Questions.find((q: Part4Question) => q.id === passageId);
    
    if (targetPart4Question) {
      console.log("🎯 loadSpecificPassage: Part4問題をロード", { questionId: targetPart4Question.id });
      // Part 4問題を表示
      setCurrentPassage(null); // 通常のpassageをクリア
      setCurrentPart2Question(null); // Part 2問題をクリア
      setCurrentPart3Question(null); // Part 3問題をクリア
      setCurrentPart4Question(targetPart4Question);
      setShowResults(false);
      setSelectedAnswers({});
      setScore(0);
      setShowTranslation(false);
      setCopySuccess("");
      setHighlightedWords(new Set());
      setErrorMessage("");
      lastProcessedPassageIdRef.current = passageId;
      
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);
      
      return true;
    }
    
    // Part 3問題から検索
    const targetPart3Question = allPart3Questions.find((q: Part3Question) => q.id === passageId);
    
    if (targetPart3Question) {
      console.log("🎯 loadSpecificPassage: Part3問題をロード", { questionId: targetPart3Question.id });
      // Part 3問題を表示
      setCurrentPassage(null); // 通常のpassageをクリア
      setCurrentPart2Question(null); // Part 2問題をクリア
      setCurrentPart3Question(targetPart3Question);
      setCurrentPart4Question(null); // Part 4問題をクリア
      setShowResults(false);
      setSelectedAnswers({});
      setScore(0);
      setShowTranslation(false);
      setCopySuccess("");
      setHighlightedWords(new Set());
      setErrorMessage("");
      lastProcessedPassageIdRef.current = passageId;
      
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);
      
      return true;
    }
    
    // Part 2問題から検索
    const targetPart2Question = allPart2Questions.find((q: Part2Question) => q.id === passageId);
    
    if (targetPart2Question) {
      // Part 2問題を表示
      setCurrentPassage(null); // 通常のpassageをクリア
      setCurrentPart3Question(null); // Part 3問題をクリア
      setCurrentPart4Question(null); // Part 4問題をクリア
      setShowResults(false);
      setSelectedAnswers({});
      setCurrentPart2Question(targetPart2Question);
      setScore(0);
      setShowTranslation(false);
      setCopySuccess("");
      setHighlightedWords(new Set());
      setErrorMessage(""); // エラーメッセージをクリア
      // Update ref to track this passage ID as processed
      lastProcessedPassageIdRef.current = targetPart2Question.id;
      
      // スクロールをトップに
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);
      
      addDebugLog("=== loadSpecificPassage Part 2 完了 ===");
      return true;
    }
    
    
    // Part 1問題から検索（専用API）
    if (passageId.startsWith('part1_')) {
      console.log("🎯 loadSpecificPassage: Part1問題を検索中", { passageId });
      
      // Part 1専用APIから問題を取得
      fetch(`/api/part1-questions?limit=1000`) // 十分な数を取得
        .then(response => response.json())
        .then(data => {
          if (data.success && data.questions) {
            const targetPart1Question = data.questions.find((q: any) => q.id === passageId);
            
            if (targetPart1Question) {
              console.log("🎯 Part1問題が見つかりました:", targetPart1Question);
              
              // Part 1問題を直接設定（Passageを作らない）
              setCurrentPart1Question(targetPart1Question);
              setCurrentPassage(null); // Part 7をクリア
              setCurrentPart2Question(null);
              setCurrentPart3Question(null);
              setCurrentPart4Question(null);
              setSelectedAnswers({});
              setShowResults(false);
              setScore(0);
              setShowTranslation(false);
              setCopySuccess("");
              setHighlightedWords(new Set());
              setErrorMessage("");
              setPart1ImageError(false); // 画像エラー状態をリセット
              lastProcessedPassageIdRef.current = targetPart1Question.id;
              
              setTimeout(() => {
                window.scrollTo({ top: 0 });
              }, 0);
              
              console.log("✅ Part1問題のロード完了");
            } else {
              console.warn("❌ Part1問題が見つかりませんでした:", passageId);
              setErrorMessage(`Part 1問題 "${passageId}" が見つかりませんでした`);
            }
          } else {
            console.error("❌ Part1 API エラー:", data);
            setErrorMessage("Part 1問題の読み込みに失敗しました");
          }
        })
        .catch(error => {
          console.error("❌ Part1問題取得エラー:", error);
          setErrorMessage("Part 1問題の読み込み中にエラーが発生しました");
        });
      
      return true; // 非同期処理のため、とりあえずtrueを返す
    }
    
    // Part 7問題から検索
    const targetPassage = allPassages?.find((p) => p.id === passageId);
    if (targetPassage) {
      // Part 7問題を表示
      setCurrentPassage(targetPassage as Passage);
      setCurrentPart2Question(null); // Part 2問題をクリア
      setCurrentPart3Question(null); // Part 3問題をクリア
      setCurrentPart4Question(null); // Part 4問題をクリア
      setSelectedAnswers({});
      setShowResults(false);
      setScore(0);
      setShowTranslation(false);
      setCopySuccess("");
      setHighlightedWords(new Set());
      setErrorMessage(""); // エラーメッセージをクリア
      lastProcessedPassageIdRef.current = targetPassage.id;
      
      // スクロールをトップに
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);
      
      addDebugLog("=== loadSpecificPassage 通常問題完了 ===");
      return true;
    }
    
    // Part 6問題から検索
    const targetPart6Question = allPart6Questions.find((q: Part6Data) => q.id === passageId);
    
    if (targetPart6Question) {
      console.log("🎯 loadSpecificPassage: Part6問題をロード", { questionId: targetPart6Question.id });
      // Part 6問題を表示
      setCurrentPassage(null); // 通常のpassageをクリア
      setCurrentPart1Question(null); // Part 1問題をクリア
      setCurrentPart2Question(null); // Part 2問題をクリア
      setCurrentPart3Question(null); // Part 3問題をクリア
      setCurrentPart4Question(null); // Part 4問題をクリア
      setCurrentPart5Question(null); // Part 5問題をクリア
      setCurrentPart6Question(targetPart6Question);
      setShowResults(false);
      setSelectedAnswers({});
      setScore(0);
      setShowTranslation(false);
      setCopySuccess("");
      setHighlightedWords(new Set());
      setErrorMessage("");
      lastProcessedPassageIdRef.current = passageId;
      
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);
      
      console.log("🔍 Part 6問題設定完了", {
        questionId: targetPart6Question.id,
        title: targetPart6Question.title,
        difficulty: targetPart6Question.difficulty,
        showResults: false,
        errorMessage: "",
        allStatesCleared: true
      });
      
      return true;
    }

    // どれも見つからない場合
    addDebugLog("指定された問題が見つかりませんでした", { passageId });
    setErrorMessage(`問題ID "${passageId}" が見つかりませんでした`);
    return false;
  }, [allPassages, allPart2Questions, allPart3Questions, allPart4Questions, allPart5Questions, allPart6Questions]);

  useEffect(() => {
    // データが読み込まれていない場合は待機
    // 各Partは独立してロードされるため、いずれかが成功していれば進む
    if (allPassages.length === 0 && allPart2Questions.length === 0 && allPart3Questions.length === 0 && allPart4Questions.length === 0 && allPart5Questions.length === 0) {
      console.log('⏳ Waiting for data to load...', { 
        passagesCount: allPassages.length, 
        part2Count: allPart2Questions.length, 
        part3Count: allPart3Questions.length,
        part4Count: allPart4Questions.length,
        part5Count: allPart5Questions.length 
      });
      return;
    }
    
    // URLパラメータから問題IDを取得
    const passageId = searchParams?.get('id');

    // 設定変更中はURL parameterを無視
    if (isApplyingSettingsRef.current) {
      return;
    }

    // データが利用可能かチェック（該当するPartのデータがあるかチェック）
    const hasDataForCurrentPart = gameSettings.toeicPart === 'part0'
      ? allPart0Sentences.length > 0
      : gameSettings.toeicPart === 'part2' 
      ? allPart2Questions.length > 0 
      : gameSettings.toeicPart === 'part3'
      ? allPart3Questions.length > 0
      : gameSettings.toeicPart === 'part4'
      ? allPart4Questions.length > 0
      : gameSettings.toeicPart === 'part5'
      ? allPart5Questions.length > 0
      : gameSettings.toeicPart === 'part6'
      ? allPart6Questions.length > 0
      : allPassages.length > 0;
    
    if (hasDataForCurrentPart) {
      if (passageId) {
        // 特定の問題IDが指定されている場合
        // ただし、既に同じ問題IDを処理済みの場合はスキップ
        if (lastProcessedPassageIdRef.current === passageId) {
          // 処理済み
        } else {
          lastProcessedPassageIdRef.current = passageId;
          loadSpecificPassage(passageId);
        }
      } else {
        // URLパラメータがない場合、currentPassageまたはcurrentPart2Questionがなければランダム選択
        if (!currentPassage && !currentPart0Sentence && !currentPart1Question && !currentPart2Question && !currentPart3Question && !currentPart4Question && !currentPart5Question && !currentPart6Question && !errorMessage) {
          console.log('🎲 Auto-selecting random passage for:', gameSettings);
          lastProcessedPassageIdRef.current = null;
          selectRandomPassage();
        }
      }
    } else {
      // 現在の設定に対応するデータがない場合はエラーメッセージを設定
      const partName = gameSettings.toeicPart === 'part2' ? 'Part 2' : gameSettings.toeicPart;
      const errorMsg = `${partName}問題データがありません。問題を生成するか、設定を変更してください。`;
      if (!errorMessage) {  // 既にエラーメッセージが設定されている場合は重複を避ける
        setErrorMessage(errorMsg);
        console.warn('❌ No data available for current settings:', { gameSettings, hasDataForCurrentPart });
      }
    }
  }, [searchParams, allPassages, allPart0Sentences.length, allPart2Questions, allPart3Questions, allPart4Questions, allPart5Questions, allPart6Questions, loadSpecificPassage, selectRandomPassage, currentPassage, currentPart0Sentence, currentPart1Question, currentPart2Question, currentPart3Question, currentPart4Question, currentPart5Question, currentPart6Question, showResults, gameSettings, errorMessage]);

  // コンポーネントのアンマウント時に音声読み上げを停止
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 結果画面表示時のログを記録
  useEffect(() => {
    if (showResults && currentPassage) {
      addDebugLog("結果画面レンダリング開始", {
        currentPassageId: currentPassage?.id,
        selectedAnswers,
        selectedAnswersKeys: Object.keys(selectedAnswers),
        showResults,
        questions: currentPassage?.questions?.map((question, index) => ({
          questionId: question.id,
          questionIndex: index,
          correct: question.correct,
          selectedAnswer: selectedAnswers[question.id],
          options: question.options.map((option, optionIndex) => ({
            optionIndex,
            optionLetter: String.fromCharCode(65 + optionIndex),
            isSelected: selectedAnswers[question.id] === String.fromCharCode(65 + optionIndex),
            isCorrect: question.correct === String.fromCharCode(65 + optionIndex),
            className:
              selectedAnswers[question.id] === String.fromCharCode(65 + optionIndex)
                ? selectedAnswers[question.id] === question.correct
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
                : question.correct === String.fromCharCode(65 + optionIndex)
                ? "border-green-500 bg-green-50"
                : "border-gray-200",
          })),
        })),
      });
    }
  }, [showResults, currentPassage, selectedAnswers]);

  // Part1問題が変更されたときに画像エラー状態をリセット
  useEffect(() => {
    if (currentPart1Question) {
      setPart1ImageError(false);
    }
  }, [currentPart1Question]);

  const retryCurrentPassage = () => {
    addDebugLog("=== retryCurrentPassage 開始 ===");
    addDebugLog("リトライ前の状態", {
      currentPassageId: currentPassage?.id,
      selectedAnswers,
      selectedAnswersKeys: Object.keys(selectedAnswers),
      showResults,
      score,
    });

    // 音声読み上げを停止
    if (isSpeaking) {
      audioAbortRef.current = true; // 中断フラグを設定
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    // 現在の問題をリセット（同じ問題を再度解く）
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setShowTranslation(false);
    setCopySuccess("");
    setHighlightedWords(new Set());

    addDebugLog("リトライ状態リセット完了");

    // 状態更新後にスクロール
    setTimeout(() => {
      window.scrollTo({ top: 0 });
    }, 0);

    addDebugLog("=== retryCurrentPassage 完了 ===");
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    addDebugLog("=== handleAnswerSelect 開始 ===", {
      questionId,
      answer,
      currentPassageId: currentPassage?.id,
      currentPassageToeicPart: currentPassage?.toeicPart,
      previousSelectedAnswers: selectedAnswers,
    });

    // Part1の場合は詳細ログを追加
    if (currentPassage?.toeicPart === 'part1') {
      const question = currentPassage.questions.find(q => q.id === questionId);
      addDebugLog("=== Part1 Answer Selection ===", {
        questionId,
        selectedAnswer: answer,
        questionCorrect: question?.correct,
        questionOptions: question?.options,
        answerType: typeof answer,
        answerLength: answer.length
      });
    }

    // 初回回答時にタイマーを開始
    if (Object.keys(selectedAnswers).length === 0) {
      startTimer();
    }

    setSelectedAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionId]: answer,
      };
      addDebugLog("選択状態更新", {
        questionId,
        answer,
        newAnswers,
        newAnswersKeys: Object.keys(newAnswers),
      });
      return newAnswers;
    });

    addDebugLog("=== handleAnswerSelect 完了 ===");
  };

  const calculateScore = () => {
    addDebugLog("=== calculateScore 開始 ===", {
      currentPassageId: currentPassage?.id,
      currentPart2QuestionId: currentPart2Question?.id,
      currentPart3QuestionId: currentPart3Question?.id,
      currentPart4QuestionId: currentPart4Question?.id,
      currentPart5QuestionId: currentPart5Question?.id,
      currentPart6QuestionId: currentPart6Question?.id,
      selectedAnswers,
      selectedAnswersKeys: Object.keys(selectedAnswers),
    });

    // Part 3 question handling
    if (currentPart3Question) {
      const correctCount = currentPart3Question!.questions.filter(q => {
        const selectedLetter = selectedAnswers[q.id];
        const selectedOptionIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
        const selectedOptionText = selectedOptionIndex >= 0 && selectedOptionIndex < q.options.length 
          ? q.options[selectedOptionIndex] 
          : null;
        return selectedOptionText === q.correct;
      }).length;
      const score = Math.round((correctCount / currentPart3Question!.questions.length) * 100);
      
      addDebugLog("Part 3 score calculation", {
        questionId: currentPart3Question!.id,
        totalQuestions: currentPart3Question!.questions.length,
        correctCount,
        score,
        selections: currentPart3Question!.questions.map(q => ({
          questionId: q.id,
          selectedLetter: selectedAnswers[q.id],
          selectedText: selectedAnswers[q.id] ? q.options[selectedAnswers[q.id].charCodeAt(0) - 65] : null,
          correctText: q.correct
        }))
      });
      
      return score;
    }

    // Part 4 question handling
    if (currentPart4Question) {
      const correctCount = currentPart4Question!.questions.filter(q => {
        const selectedLetter = selectedAnswers[q.id];
        const selectedOptionIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
        const selectedOptionText = selectedOptionIndex >= 0 && selectedOptionIndex < q.options.length 
          ? q.options[selectedOptionIndex] 
          : null;
        return selectedOptionText === q.correct;
      }).length;
      const score = Math.round((correctCount / currentPart4Question!.questions.length) * 100);
      
      addDebugLog("Part 4 score calculation", {
        questionCount: currentPart4Question!.questions.length,
        correctCount,
        score,
        selections: currentPart4Question!.questions.map(q => ({
          questionId: q.id,
          selectedLetter: selectedAnswers[q.id],
          selectedText: selectedAnswers[q.id] ? q.options[selectedAnswers[q.id].charCodeAt(0) - 65] : null,
          correctText: q.correct
        }))
      });
      
      return score;
    }

    // Part 1 question handling
    // @ai-hint: このスコア計算結果が共通ボタンセクション（L6126-6158）の表示条件に使用される
    if (currentPart1Question) {
      const selectedAnswer = selectedAnswers[currentPart1Question!.id];
      const isCorrect = selectedAnswer === currentPart1Question!.correct;
      const score = isCorrect ? 100 : 0;
      
      addDebugLog("Part 1 score calculation", {
        questionId: currentPart1Question!.id,
        selectedAnswer,
        correctAnswer: currentPart1Question!.correct,
        isCorrect,
        score
      });
      
      return score;
    }

    // Part 2 question handling
    if (currentPart2Question) {
      const selectedAnswer = selectedAnswers[currentPart2Question!.id];
      const isCorrect = selectedAnswer === currentPart2Question!.correct;
      const score = isCorrect ? 100 : 0;
      
      addDebugLog("Part 2 score calculation", {
        questionId: currentPart2Question!.id,
        selectedAnswer,
        correctAnswer: currentPart2Question!.correct,
        isCorrect,
        score
      });
      
      return score;
    }

    // Part 5 question handling
    if (currentPart5Question) {
      const selectedAnswer = selectedAnswers[currentPart5Question!.id];
      const isCorrect = selectedAnswer === currentPart5Question!.correct;
      const score = isCorrect ? 100 : 0;
      
      addDebugLog("Part 5 score calculation", {
        questionId: currentPart5Question!.id,
        selectedAnswer,
        correctAnswer: currentPart5Question!.correct,
        isCorrect,
        score
      });
      
      return score;
    }

    // Part 6 question handling
    if (currentPart6Question) {
      const correctCount = currentPart6Question!.questions.filter(q => {
        const selectedAnswer = selectedAnswers[q.id];
        return selectedAnswer === q.correct;
      }).length;
      const score = Math.round((correctCount / currentPart6Question!.questions.length) * 100);
      
      addDebugLog("Part 6 score calculation", {
        questionId: currentPart6Question!.id,
        totalQuestions: currentPart6Question!.questions.length,
        correctCount,
        score,
        selections: currentPart6Question!.questions.map(q => ({
          questionId: q.id,
          selectedAnswer: selectedAnswers[q.id],
          correctAnswer: q.correct,
          isCorrect: selectedAnswers[q.id] === q.correct
        }))
      });
      
      return score;
    }

    if (!currentPassage) {
      addDebugLog("エラー: currentPassageがnull");
      return 0;
    }

    // calculateScore時点でのcurrentPassageのcorrect値を確認
    addDebugLog("calculateScore時点でのcurrentPassage確認", {
      passageId: currentPassage!.id,
      questions: currentPassage!.questions?.map((q) => ({
        id: q.id,
        correct: q.correct,
        correctType: typeof q.correct,
        correctLength: q.correct?.length,
      })),
    });

    let correctCount = 0;
    const questionResults = currentPassage!.questions.map((question) => {
      const selectedAnswer = selectedAnswers[question.id];
      let isCorrect = false;
      
      // Part 1の場合、正解がテキストフォーマットの可能性があるので特別処理
      if (currentPassage!.toeicPart === 'part1') {
        addDebugLog("=== Part1 正解判定開始 ===", {
          questionId: question.id,
          selectedAnswer,
          questionCorrect: question.correct,
          questionCorrectLength: question.correct.length,
          questionCorrectType: typeof question.correct,
          isLetterFormat: /^[A-D]$/.test(question.correct),
          options: question.options
        });

        // 正解が記号（A, B, C, D）の場合
        if (question.correct.length === 1 && /^[A-D]$/.test(question.correct)) {
          isCorrect = selectedAnswer === question.correct;
          addDebugLog("Part1 文字フォーマット判定", {
            selectedAnswer,
            questionCorrect: question.correct,
            isCorrect,
            comparison: `${selectedAnswer} === ${question.correct}`
          });
        } else {
          // 正解がテキストの場合、選択肢から該当するインデックスを見つける
          const correctIndex = question.options.findIndex(option => option === question.correct);
          if (correctIndex !== -1) {
            const correctLetter = String.fromCharCode(65 + correctIndex); // A, B, C, D
            isCorrect = selectedAnswer === correctLetter;
            addDebugLog("Part1 テキストフォーマット判定", {
              selectedAnswer,
              questionCorrect: question.correct,
              correctIndex,
              correctLetter,
              isCorrect,
              comparison: `${selectedAnswer} === ${correctLetter}`,
              optionAtIndex: question.options[correctIndex]
            });
          } else {
            addDebugLog("Part1 テキストフォーマット判定 - 正解が見つからない", {
              selectedAnswer,
              questionCorrect: question.correct,
              correctIndex,
              options: question.options
            });
          }
        }

        addDebugLog("=== Part1 正解判定完了 ===", {
          questionId: question.id,
          finalIsCorrect: isCorrect
        });
      } else {
        // Part 1以外は通常の比較
        isCorrect = selectedAnswer === question.correct;
      }
      
      if (isCorrect) correctCount++;

      return {
        questionId: question.id,
        selectedAnswer,
        correctAnswer: question.correct,
        isCorrect,
      };
    });

    const finalScore = Math.round((correctCount / currentPassage!.questions.length) * 100);

    addDebugLog("スコア計算結果", {
      correctCount,
      totalQuestions: currentPassage!.questions.length,
      finalScore,
      questionResults: questionResults.map((result) => {
        const question = currentPassage!.questions.find((q) => q.id === result.questionId);
        const correctOptionText = question ? question.options[question.correct.charCodeAt(0) - 65] : "不明";
        return {
          ...result,
          correctAnswer: result.correctAnswer, // 記号形式（A, B, C, D）
          correctAnswerText: correctOptionText, // 正解の選択肢の全文
          selectedAnswer: result.selectedAnswer,
          isCorrect: result.isCorrect,
        };
      }),
    });

    // ハイライト表示のデバッグ情報を追加
    addDebugLog("ハイライト表示デバッグ", {
      currentPassageId: currentPassage!.id,
      questions: currentPassage!.questions.map((question, index) => ({
        questionId: question.id,
        questionIndex: index,
        correct: question.correct,
        correctType: typeof question.correct,
        correctLength: question.correct?.length,
        options: question.options.map((option, optionIndex) => {
          const optionLetter = String.fromCharCode(65 + optionIndex);
          const isCorrect = question.correct === optionLetter;
          return {
            optionIndex,
            optionLetter,
            optionText: cleanText(option),
            isSelected: selectedAnswers[question.id] === optionLetter,
            isCorrect,
            correctComparison: `${question.correct} === ${optionLetter} = ${isCorrect}`,
            shouldHighlight: selectedAnswers[question.id] === optionLetter || isCorrect,
          };
        }),
      })),
    });

    addDebugLog("=== calculateScore 完了 ===");
    return finalScore;
  };

  const handleSubmit = () => {
    console.log("🎯 === handleSubmit 開始 ===");
    console.log("🎯 現在の状態:", {
      currentPassage: currentPassage ? { id: currentPassage!.id, type: "passage" } : null,
      currentPart2Question: currentPart2Question ? { id: currentPart2Question!.id, type: "part2" } : null,
      currentPart3Question: currentPart3Question ? { id: currentPart3Question!.id, type: "part3" } : null,
      currentPart4Question: currentPart4Question ? { id: currentPart4Question!.id, type: "part4" } : null,
      currentPart5Question: currentPart5Question ? { id: currentPart5Question!.id, type: "part5" } : null,
      currentPart6Question: currentPart6Question ? { id: currentPart6Question!.id, type: "part6" } : null,
      selectedAnswers,
      selectedAnswersKeys: Object.keys(selectedAnswers),
      showResults,
      gameSettings: gameSettings.toeicPart
    });
    
    addDebugLog("=== handleSubmit 開始 ===", {
      currentPassageId: currentPassage?.id,
      currentPart2QuestionId: currentPart2Question?.id,
      currentPart3QuestionId: currentPart3Question?.id,
      currentPart4QuestionId: currentPart4Question?.id,
      currentPart5QuestionId: currentPart5Question?.id,
      currentPart6QuestionId: currentPart6Question?.id,
      selectedAnswers,
      selectedAnswersKeys: Object.keys(selectedAnswers),
      showResults,
    });

    // タイマーを停止
    stopTimer();
    
    // 音声読み上げを停止
    if (isSpeaking) {
      audioAbortRef.current = true; // 中断フラグを設定
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);
    setShowTranslation(true);
    
    // 統計情報を更新
    const isAllCorrect = finalScore === 100;
    updateConsecutiveCorrect(isAllCorrect);
    
    // ゲーム統計を更新
    const updatedStatsMap = updateStatsForSettings(gameStatsMap, gameSettings, isAllCorrect);
    setGameStatsMap(updatedStatsMap);
    
    // 統計を保存
    saveStats(updatedStatsMap).catch(error => {
      console.error('Failed to save stats:', error);
    });
    
    // 現在の統計を更新
    const newStats = getStatsForSettings(updatedStatsMap, gameSettings);
    setCurrentStats(newStats);

    addDebugLog("結果画面表示設定完了", {
      finalScore,
      showResults: true,
      showTranslation: true,
    });

    // 結果画面表示時の詳細状態を記録
    addDebugLog("結果画面表示時の詳細状態", {
      currentPassageId: currentPassage?.id,
      selectedAnswers,
      selectedAnswersKeys: Object.keys(selectedAnswers),
      showResults: true,
      showTranslation: true,
      score: finalScore,
      totalQuestions: currentPassage?.questions?.length,
      questions: currentPassage?.questions?.map((question, index) => ({
        questionId: question.id,
        questionIndex: index,
        correct: question.correct,
        selectedAnswer: selectedAnswers[question.id],
        isCorrect: selectedAnswers[question.id] === question.correct,
        options: question.options.map((option, optionIndex) => ({
          optionIndex,
          optionLetter: String.fromCharCode(65 + optionIndex),
          isSelected: selectedAnswers[question.id] === String.fromCharCode(65 + optionIndex),
          isCorrect: question.correct === String.fromCharCode(65 + optionIndex),
        })),
      })),
    });

    // 結果画面で一番上にスクロール
    window.scrollTo({ top: 0 });

    addDebugLog("=== handleSubmit 完了 ===");
  };

  // ハイライト機能
  const toggleWordHighlight = (word: string) => {
    setHighlightedWords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(word)) {
        newSet.delete(word);
      } else {
        newSet.add(word);
      }
      return newSet;
    });
  };

  const renderHighlightedContent = (content: string, isReadOnly: boolean = false) => {
    // 改行文字を特別に処理
    const parts = content.split(/(\n+)/);
    return parts.map((part, index) => {
      // 改行文字の場合は改行の数だけ<br>タグを生成
      if (/^\n+$/.test(part)) {
        return part.split("").map((char, charIndex) => <br key={`${index}-${charIndex}`} />);
      }

      // 改行以外の部分を単語に分割してハイライト処理
      const words = part.split(/(\s+)/);
      return words.map((word, wordIndex) => {
        // 空白文字の場合はそのまま返す（spanタグで囲まない）
        if (/^\s+$/.test(word)) {
          return word;
        }

        // 単語の場合
        const isHighlighted = highlightedWords.has(word);

        const handleClick = () => {
          if (isReadOnly) {
            // 結果画面ではハイライトされた単語をクリップボードにコピー
            if (isHighlighted) {
              copyToClipboard(word, "単語");
            }
          } else {
            // 出題画面ではハイライトの切り替え
            toggleWordHighlight(word);
          }
        };

        return (
          <span
            key={`${index}-${wordIndex}`}
            onClick={handleClick}
            className={`transition-colors ${isHighlighted ? "bg-yellow-300 text-black" : isReadOnly ? "" : "hover:bg-yellow-100 cursor-pointer"} ${
              isReadOnly && isHighlighted ? "cursor-pointer" : ""
            }`}
            title={
              isReadOnly ? (isHighlighted ? t('misc.clickToCopyWord') : undefined) : isHighlighted ? t('misc.clickToUnhighlight') : t('misc.clickToHighlight')
            }
          >
            {word}
          </span>
        );
      });
    });
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      // navigator.clipboardが利用可能かチェック
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopySuccess(t('misc.copiedToClipboard', { type }));
      } else {
        // フォールバック: 古いブラウザやHTTPSでない環境用
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        textArea.style.pointerEvents = "none";
        textArea.style.userSelect = "none";
        textArea.setAttribute("readonly", "true");
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
          setCopySuccess(t('misc.copiedToClipboard', { type }));
        } catch (fallbackErr) {
          console.error("フォールバックコピーにも失敗しました:", fallbackErr);
          setCopySuccess(t('misc.copyFailedBrowser'));
        } finally {
          document.body.removeChild(textArea);
        }
      }

      // 固定位置でポップアップを表示（動的計算を避ける）
      setCopyPosition({
        x: 0,
        y: 0,
      });

      setTimeout(() => {
        setCopySuccess("");
        setCopyPosition(null);
      }, 2000);
    } catch (err) {
      console.error("クリップボードへのコピーに失敗しました:", err);
      setCopySuccess(t('misc.copyFailed'));

      // 固定位置でポップアップを表示（動的計算を避ける）
      setCopyPosition({
        x: 0,
        y: 0,
      });

      setTimeout(() => {
        setCopySuccess("");
        setCopyPosition(null);
      }, 2000);
    }
  };

  // 複数資料表示用のレンダリング関数
  const renderMultipleDocuments = (isReadOnly: boolean = false) => {
    if (!currentPassage?.documents || currentPassage!.documents.length === 0) return null;
    
    return (
      <div className="space-y-6">
        {currentPassage!.documents.map((document) => (
          <div key={document.id} className="border border-gray-300 rounded-lg p-4 bg-white">
            {/* 資料内容 */}
            <div className="text-black text-lg leading-relaxed whitespace-pre-wrap">
              {renderHighlightedContent(document.content, isReadOnly)}
            </div>
            
            {/* 翻訳表示 */}
            {showTranslation && document.contentTranslation && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-black whitespace-pre-wrap p-4 bg-blue-50 rounded">
                  {document.contentTranslation}
                </div>
              </div>
            )}
            
            {/* 図表表示 */}
            {document.chart && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="p-4">
                  <h4 className="text-lg font-bold mb-2">{document.chart.title}</h4>
                  <ChartRenderer chart={document.chart} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // 指定されたIDの問題を表示する関数
  const selectPassageById = (passageId: string) => {
    console.log("🎯 selectPassageById called", { passageId, gameSettings: gameSettings.toeicPart });
    
    // Part3が選択されている場合
    if (gameSettings.toeicPart === 'part3') {
      const part3Question = allPart3Questions.find((q) => q.id === passageId);
      
      if (part3Question) {
        console.log("🎯 selectPassageById: Part3問題発見", { questionId: part3Question.id });
        // Part3問題を表示
        setCurrentPassage(null); // 通常のpassageをクリア
        setCurrentPart2Question(null); // Part2をクリア
        setCurrentPart3Question(part3Question);
        setSelectedAnswers({});
        setShowResults(false);
        setScore(0);
        setShowTranslation(false);
        setCopySuccess("");
        setHighlightedWords(new Set());
        setErrorMessage("");
        lastProcessedPassageIdRef.current = part3Question.id;

        // 選択履歴を更新
        setRecentPassageIds((prev) => {
          const newHistory = [...prev, part3Question.id];
          return newHistory.slice(-5);
        });

        setTimeout(() => {
          window.scrollTo({ top: 0 });
        }, 0);

        return true;
      } else {
        setErrorMessage(`Part 3問題ID "${passageId}" が見つかりません。`);
        return false;
      }
    }
    
    // Part4が選択されている場合
    if (gameSettings.toeicPart === 'part4') {
      const part4Question = allPart4Questions.find((q) => q.id === passageId);
      
      if (part4Question) {
        console.log("🎯 selectPassageById: Part4問題発見", { questionId: part4Question.id });
        // Part4問題を表示
        setCurrentPassage(null); // 通常のpassageをクリア
        setCurrentPart2Question(null); // Part2をクリア
        setCurrentPart3Question(null); // Part3をクリア
        setCurrentPart4Question(part4Question);
        setSelectedAnswers({});
        setShowResults(false);
        setScore(0);
        setShowTranslation(false);
        setCopySuccess("");
        setHighlightedWords(new Set());
        setErrorMessage("");
        lastProcessedPassageIdRef.current = part4Question.id;

        // 選択履歴を更新
        setRecentPassageIds((prev) => {
          const newHistory = [...prev, part4Question.id];
          return newHistory.slice(-5);
        });

        setTimeout(() => {
          window.scrollTo({ top: 0 });
        }, 0);

        return true;
      } else {
        setErrorMessage(`Part 4問題ID "${passageId}" が見つかりません。`);
        return false;
      }
    }
    
    // Part2が選択されている場合
    if (gameSettings.toeicPart === 'part2') {
      const part2Question = allPart2Questions.find((q) => q.id === passageId);
      
      if (part2Question) {
        // Part2問題を表示
        setCurrentPassage(null); // 通常のpassageをクリア
        setCurrentPart2Question(part2Question);
        setSelectedAnswers({});
        setShowResults(false);
        setScore(0);
        setShowTranslation(false);
        setCopySuccess("");
        setHighlightedWords(new Set());
        setErrorMessage("");
        // Update ref to track this passage ID as processed
        lastProcessedPassageIdRef.current = part2Question.id;

        // 選択履歴を更新（最大5問まで保持）
        setRecentPassageIds((prev) => {
          const newHistory = [...prev, part2Question.id];
          return newHistory.slice(-5); // 最新5問のみ保持
        });

        // 状態更新後にスクロール
        setTimeout(() => {
          window.scrollTo({ top: 0 });
        }, 0);

        return true;
      } else {
        setErrorMessage(`Part 2問題ID "${passageId}" が見つかりません。`);
        return false;
      }
    }
    
    // Part 6が選択されている場合
    if (gameSettings.toeicPart === 'part6') {
      const part6Question = allPart6Questions.find((q) => q.id === passageId);
      
      if (part6Question) {
        console.log("🎯 selectPassageById: Part6問題発見", { questionId: part6Question.id });
        // Part 6問題を表示
        setCurrentPassage(null); // 通常のpassageをクリア
        setCurrentPart1Question(null);
        setCurrentPart2Question(null);
        setCurrentPart3Question(null);
        setCurrentPart4Question(null);
        setCurrentPart5Question(null);
        setCurrentPart6Question(part6Question);
        setSelectedAnswers({});
        setShowResults(false);
        setScore(0);
        setShowTranslation(false);
        setCopySuccess("");
        setHighlightedWords(new Set());
        setErrorMessage("");
        lastProcessedPassageIdRef.current = part6Question.id;

        // 選択履歴を更新
        setRecentPassageIds((prev) => {
          const newHistory = [...prev, part6Question.id];
          return newHistory.slice(-5);
        });

        setTimeout(() => {
          window.scrollTo({ top: 0 });
        }, 0);

        return true;
      } else {
        setErrorMessage(`Part 6問題ID "${passageId}" が見つかりません。`);
        return false;
      }
    }
    
    // Part 5が選択されている場合
    if (gameSettings.toeicPart === 'part5') {
      const part5Question = allPart5Questions.find((q) => q.id === passageId);
      
      if (part5Question) {
        console.log("🎯 selectPassageById: Part5問題発見", { questionId: part5Question.id });
        // Part 5問題を表示
        setCurrentPassage(null); // 通常のpassageをクリア
        setCurrentPart1Question(null);
        setCurrentPart2Question(null);
        setCurrentPart3Question(null);
        setCurrentPart4Question(null);
        setCurrentPart5Question(part5Question);
        setCurrentPart6Question(null);
        setSelectedAnswers({});
        setShowResults(false);
        setScore(0);
        setShowTranslation(false);
        setCopySuccess("");
        setHighlightedWords(new Set());
        setErrorMessage("");
        lastProcessedPassageIdRef.current = part5Question.id;

        // 選択履歴を更新
        setRecentPassageIds((prev) => {
          const newHistory = [...prev, part5Question.id];
          return newHistory.slice(-5);
        });

        setTimeout(() => {
          window.scrollTo({ top: 0 });
        }, 0);

        return true;
      } else {
        setErrorMessage(`Part 5問題ID "${passageId}" が見つかりません。`);
        return false;
      }
    } else {
      // Part1の場合（従来の処理）
      const passages = allPassages;
      const passage = passages.find((p) => p.id === passageId);

      if (passage) {
        console.log("🎯 loadSpecificPassage: Part1設定中", { passageId, currentPart3Question: currentPart3Question?.id });
        setCurrentPassage(passage as Passage);
        setCurrentPart2Question(null); // Part2問題をクリア
        setCurrentPart3Question(null); // Part3問題をクリア
        setSelectedAnswers({});
        setShowResults(false);
        setScore(0);
        setShowTranslation(false);
        setCopySuccess("");
        setHighlightedWords(new Set());
        setErrorMessage("");
        // Update ref to track this passage ID as processed
        lastProcessedPassageIdRef.current = passage.id;

        // 選択履歴を更新（最大5問まで保持）
        setRecentPassageIds((prev) => {
          const newHistory = [...prev, passage.id];
          return newHistory.slice(-5); // 最新5問のみ保持
        });

        // 状態更新後にスクロール
        setTimeout(() => {
          window.scrollTo({ top: 0 });
        }, 0);

        return true;
      } else {
        setErrorMessage(`問題ID "${passageId}" が見つかりません。`);
        return false;
      }
    }
  };

  // 設定ポップアップを開く
  const openSettings = () => {
    setShowSettings(true);
    
    // URLパラメータにIDがある場合は入力欄に設定
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    setPassageIdInput(idParam || "");
    
    setErrorMessage("");
    
    // 設定値を秒に変換して一時的な状態に設定
    setTempAnswerTime(gameSettings.answerTime / 1000);
    setTempTargetConsecutive(gameSettings.targetConsecutive);
    setTempToeicPart(gameSettings.toeicPart);
    setTempHasChart(gameSettings.hasChart);
    setTempDifficulty(gameSettings.difficulty);
    setTempNextButtonBehavior(gameSettings.nextButtonBehavior);
    setTempAudioVolume(gameSettings.audioVolume);
    
    addDebugLog('設定ポップアップを開きました', {
      currentSettings: gameSettings,
      tempAnswerTime: gameSettings.answerTime / 1000,
      tempTargetConsecutive: gameSettings.targetConsecutive,
      tempToeicPart: gameSettings.toeicPart
    });
  };

  // 設定ポップアップを閉じる
  const closeSettings = () => {
    setShowSettings(false);
    setPassageIdInput("");
    setErrorMessage("");
    
    // 設定画面を閉じる際に、保存されていない変更をリセット
    setTempAnswerTime(gameSettings.answerTime / 1000);
    setTempTargetConsecutive(gameSettings.targetConsecutive);
    setTempToeicPart(gameSettings.toeicPart);
    setTempHasChart(gameSettings.hasChart);
    setTempDifficulty(gameSettings.difficulty);
    setTempNextButtonBehavior(gameSettings.nextButtonBehavior);
    setTempAudioVolume(gameSettings.audioVolume);
    
    addDebugLog('設定画面を閉じ、一時設定をリセットしました', {
      resetToAnswerTime: gameSettings.answerTime / 1000,
      resetToTargetConsecutive: gameSettings.targetConsecutive,
      resetToToeicPart: gameSettings.toeicPart
    });
  };

  // Applyボタンを押した時の処理
  const handleApplyPassageId = async () => {
    // 設定変更中フラグを設定
    isApplyingSettingsRef.current = true;
    
    // 設定を保存
    const newSettings: GameSettings = {
      answerTime: tempAnswerTime * 1000, // ミリ秒に変換
      targetConsecutive: tempTargetConsecutive,
      toeicPart: tempToeicPart,
      hasChart: tempHasChart,
      difficulty: tempDifficulty,
      nextButtonBehavior: tempNextButtonBehavior,
      audioVolume: tempAudioVolume,
      language,
    };
    
    try {
      await saveSettings(newSettings);
      setGameSettings(newSettings);
      addDebugLog('設定を保存しました', newSettings);
      
      // 統計情報を新しい設定で更新
      const newStats = getStatsForSettings(gameStatsMap, newSettings);
      setCurrentStats(newStats);
      setConsecutiveCorrect(newStats.currentConsecutiveCorrect);
      setBestConsecutive(newStats.maxConsecutiveCorrect);
      
      addDebugLog('統計情報を更新しました', {
        newStats,
        consecutiveCorrect: newStats.currentConsecutiveCorrect,
        bestConsecutive: newStats.maxConsecutiveCorrect
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setErrorMessage(t('audio.settingsSaveFailed'));
      return;
    }
    
    // 問題IDが入力された場合のみ処理
    if (passageIdInput.trim()) {
      const success = selectPassageById(passageIdInput.trim());
      if (!success) {
        return; // エラーがある場合は閉じない
      }
      // URLパラメータを更新
      const url = new URL(window.location.href);
      url.searchParams.set('id', passageIdInput.trim());
      window.history.replaceState({}, '', url.toString());
      lastProcessedPassageIdRef.current = passageIdInput.trim();
    } else {
      // 問題種類や図表設定が変更された場合、新しい設定に適合する問題を自動選択
      if (gameSettings.toeicPart !== newSettings.toeicPart || gameSettings.hasChart !== newSettings.hasChart || gameSettings.difficulty !== newSettings.difficulty) {
        addDebugLog('設定が変更されたため、新しい問題を選択します', {
          oldPart: gameSettings.toeicPart,
          newPart: newSettings.toeicPart,
          oldChart: gameSettings.hasChart,
          newChart: newSettings.hasChart
        });
        
        // URLパラメータをクリアして設定変更を優先
        const url = new URL(window.location.href);
        if (url.searchParams.has('id')) {
          url.searchParams.delete('id');
          window.history.replaceState({}, '', url.toString());
          // URL パラメータをクリアしたので、処理済みIDもリセット
          lastProcessedPassageIdRef.current = null;
        }
        
        selectRandomPassageWithSettings(newSettings);
      } else {
        // 設定が同じでも、Apply時に新しい問題を選択
        // URLパラメータをクリアして設定変更を優先
        const url = new URL(window.location.href);
        if (url.searchParams.has('id')) {
          url.searchParams.delete('id');
          window.history.replaceState({}, '', url.toString());
          // URL パラメータをクリアしたので、処理済みIDもリセット
          lastProcessedPassageIdRef.current = null;
        }
        
        selectRandomPassageWithSettings(newSettings);
      }
    }
    
    // 設定変更時に目標達成状態をリセット
    setTargetAchieved(false);
    
    // 設定変更完了
    isApplyingSettingsRef.current = false;
    
    closeSettings();
  };

  // 複数資料のコピー機能
  const copyMultipleDocuments = () => {
    if (!currentPassage?.documents) return;
    
    let text = generateMultipleDocumentsInstruction(currentPassage) + "\n\n";
    currentPassage!.documents.forEach((document, index) => {
      if (index > 0) text += "\n\n";
      text += `${document.title || `Document ${index + 1}`} (${document.type})\n`;
      text += document.content;
    });
    
    copyToClipboard(text, "複数資料");
  };

  // エラーメッセージがある場合はエラー画面を表示
  if (errorMessage && !currentPassage && !currentPart2Question) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <AppHeader
              onShowSplash={onShowSplash}
              timeLeft={timeLeft}
              consecutiveCorrect={consecutiveCorrect}
              targetAchieved={targetAchieved}
              gameSettings={gameSettings}
              onOpenSettings={openSettings}
              onShowStats={() => setShowStats(true)}
              onNext={selectRandomPassage}
            />
        
        
        <div className="text-center p-8">
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
            <svg className="w-12 h-12 text-red-600 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="text-red-800 font-medium mb-3">{errorMessage}</div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setErrorMessage("");
                  selectRandomPassage();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full"
              >
                再試行
              </button>
              <button
                onClick={() => {
                  // 設定をリセットして再試行
                  localStorage.removeItem('engGameSettings');
                  window.location.reload();
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 w-full"
              >
                設定をリセット
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-4">
            現在の設定: {gameSettings.toeicPart} / {gameSettings.difficulty}
          </div>
        </div>
      </div>
    );
  }

  // データ読み込み中の場合
  if (!currentPassage && !currentPart0Sentence && !currentPart1Question && !currentPart2Question && !currentPart3Question && !currentPart4Question && !currentPart5Question && !currentPart6Question && !errorMessage) {
    return (
      <div className="text-center p-8">
        <div className="text-lg">{t('loading.text')}</div>
        <div className="text-sm text-gray-500 mt-2">
          {t('loading.dataStatus', { status: allPassages.length > 0 ? t('loading.loaded', { count: allPassages.length }) : t('loading.fetching') })}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {t('loading.settings', { part: gameSettings.toeicPart, difficulty: gameSettings.difficulty })}
        </div>
      </div>
    );
  }


  // レンダリング時の状態をログ出力
  console.log("🔍 レンダリング状態チェック", {
    currentPassage: currentPassage?.id || null,
    currentPart1Question: currentPart1Question?.id || null,
    currentPart2Question: currentPart2Question?.id || null,
    currentPart3Question: currentPart3Question?.id || null,
    currentPart4Question: currentPart4Question?.id || null,
    currentPart5Question: currentPart5Question?.id || null,
    showResults,
    errorMessage,
    gameSettings: gameSettings.toeicPart,
    totalPassages: allPassages.length,
    totalPart2Questions: allPart2Questions.length,
    totalPart3Questions: allPart3Questions.length,
    totalPart4Questions: allPart4Questions.length,
    totalPart5Questions: allPart5Questions.length
  });

  return (
    <div>
      {/* CURRENT_VERSION_MARKER: 2025-01-21 */}
      <div className="max-w-4xl mx-auto p-6">
        <AppHeader
              onShowSplash={onShowSplash}
              timeLeft={timeLeft}
              consecutiveCorrect={consecutiveCorrect}
              targetAchieved={targetAchieved}
              gameSettings={gameSettings}
              onOpenSettings={openSettings}
              onShowStats={() => setShowStats(true)}
              onNext={selectRandomPassage}
            />


      {/* エラーメッセージ（問題データがある場合のみ） */}
      {errorMessage && currentPassage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => {
              setErrorMessage("");
              selectRandomPassage();
            }}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            {t('error.showRandom')}
          </button>
        </div>
      )}

      {/* コピー成功ポップアップ */}
      {copySuccess && copyPosition && (
        <div
          className="fixed z-50 p-3 bg-green-100 text-green-800 rounded-lg shadow-lg border border-green-200"
          style={{
            right: "20px",
            bottom: "20px",
            maxWidth: "300px",
          }}
        >
          {copySuccess}
        </div>
      )}

      {/* 設定ポップアップ */}
      <SettingsModal
        showSettings={showSettings}
        tempToeicPart={tempToeicPart}
        tempDifficulty={tempDifficulty}
        tempAudioVolume={tempAudioVolume}
        passageIdInput={passageIdInput}
        tempAnswerTime={tempAnswerTime}
        tempTargetConsecutive={tempTargetConsecutive}
        tempNextButtonBehavior={tempNextButtonBehavior}
        errorMessage={errorMessage}
        onSetTempToeicPart={setTempToeicPart}
        onSetTempDifficulty={setTempDifficulty}
        onSetTempAudioVolume={setTempAudioVolume}
        onSetPassageIdInput={setPassageIdInput}
        onSetTempAnswerTime={setTempAnswerTime}
        onSetTempTargetConsecutive={setTempTargetConsecutive}
        onSetTempNextButtonBehavior={setTempNextButtonBehavior}
        onClose={closeSettings}
        onApply={handleApplyPassageId}
      />

      {/* 統計ポップアップ */}
      <StatsPopup
        stats={currentStats}
        currentSettings={gameSettings}
        isOpen={showStats}
        onClose={() => setShowStats(false)}
      />

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">

        {/* Part 1/7 基本情報 */}
        {showResults && currentPassage && (
          <div className="mb-4">
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2">{currentPassage!.metadata.difficulty}</span>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">{currentPassage!.metadata.estimatedTime}{t('result.seconds')}</span>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">{currentPassage!.metadata.wordCount} {t('result.words')}</span>
            <span 
              className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mb-2 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => copyToClipboard(currentPassage!.id, "Passage ID")}
              title={t('misc.clickToCopyId', { type: 'Passage' })}
            >ID: {currentPassage!.id}</span>
          </div>
        )}

        {/* 
        ⚠️ 重要: 属性タグ共通エリア ⚠️
        
        このセクション(4453-4549行)では、全てのTOEIC Partの属性タグを統一的に表示します。
        - Part 1/7: 4453-4465行
        - Part 1: 4467-4482行  
        - Part 2: 4484-4496行
        - Part 3: 4498-4515行
        - Part 4: 4517-4534行
        - Part 5: 4536-4549行
        
        各Partの結果セクション内で属性タグを重複表示してはいけません。
        属性タグは必ずこの共通エリアでのみ定義してください。
        */}

        {/* Part 1 基本情報 */}
        {showResults && currentPart1Question && (
          <div className="mb-4">
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2">{currentPart1Question!.difficulty}</span>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">Part 1</span>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">{currentPart1Question!.questionType}</span>
            <span 
              className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => copyToClipboard(currentPart1Question!.id, "Part 1 ID")}
              title={t('misc.clickToCopyId', { type: 'Part 1' })}
            >ID: {currentPart1Question!.id}</span>
            {currentPart1Question!.scene && (
              <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">{currentPart1Question!.scene}</span>
            )}
          </div>
        )}

        {/* Part 2 基本情報 */}
        {showResults && currentPart2Question && (
          <div className="mb-4">
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2">{currentPart2Question!.difficulty}</span>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">Part 2</span>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">{currentPart2Question!.questionType}</span>
            <span 
              className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mb-2 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => copyToClipboard(currentPart2Question!.id, "Part 2 ID")}
              title={t('misc.clickToCopyId', { type: 'Part 2' })}
            >ID: {currentPart2Question!.id}</span>
          </div>
        )}

        {/* Part 3 基本情報 */}
        {showResults && currentPart3Question && (
          <div className="mb-4">
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2">{currentPart3Question!.difficulty}</span>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">Part 3</span>
            <span 
              className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => copyToClipboard(currentPart3Question!.id, "Part 3 ID")}
              title={t('misc.clickToCopyId', { type: 'Part 3' })}
            >ID: {currentPart3Question!.id}</span>
            {currentPart3Question!.scenario && (
              <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">{currentPart3Question!.scenario}</span>
            )}
            {currentPart3Question!.industry && (
              <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">{currentPart3Question!.industry}</span>
            )}
          </div>
        )}

        {/* Part 4 基本情報 */}
        {showResults && currentPart4Question && (
          <div className="mb-4">
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2">{currentPart4Question!.difficulty}</span>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">Part 4</span>
            <span 
              className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => copyToClipboard(currentPart4Question!.id, "Part 4 ID")}
              title={t('misc.clickToCopyId', { type: 'Part 4' })}
            >ID: {currentPart4Question!.id}</span>
            {currentPart4Question!.speechType && (
              <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">{currentPart4Question!.speechType || currentPart4Question!.speechTypeTranslation}</span>
            )}
            {currentPart4Question!.industry && (
              <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">{currentPart4Question!.industry}</span>
            )}
          </div>
        )}

        {/* Part 5 基本情報 */}
        {showResults && currentPart5Question && (
          <div className="mb-4">
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2">{currentPart5Question!.difficulty}</span>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">Part 5</span>
            <span 
              className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => copyToClipboard(currentPart5Question!.id, "Part 5 ID")}
              title={t('misc.clickToCopyId', { type: 'Part 5' })}
            >ID: {currentPart5Question!.id}</span>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">{t('misc.category')}: {currentPart5Question!.category}</span>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">{t('misc.intent')}: {currentPart5Question!.intent}</span>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">{t('misc.vocab')}: {currentPart5Question!.vocabLevel}</span>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">{t('misc.length')}: {currentPart5Question!.length}</span>
          </div>
        )}


        {/* Part 1/7 結果 */}
        {showResults && currentPassage && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-center mb-4">
              <div className="text-gray-600">
                {t('result.score', { total: currentPassage!.questions.length, correct: Math.round((score / 100) * currentPassage!.questions.length) })}
              </div>
            </div>
            <div className="flex justify-center space-x-2">
              {currentPassage!.questions.map((question, index) => {
                // Part 1の正解判定（calculateScoreと同じロジック）
                let isCorrect = false;
                const selectedLetter = selectedAnswers[question.id];
                
                if (currentPassage!.toeicPart === 'part1') {
                  // 正解が記号（A, B, C, D）の場合
                  if (question.correct.length === 1 && /^[A-D]$/.test(question.correct)) {
                    isCorrect = selectedLetter === question.correct;
                  } else {
                    // 正解がテキストの場合、選択肢から該当するインデックスを見つける
                    const correctIndex = question.options.findIndex(option => option === question.correct);
                    if (correctIndex !== -1) {
                      const correctLetter = String.fromCharCode(65 + correctIndex); // A, B, C, D
                      isCorrect = selectedLetter === correctLetter;
                    }
                  }
                } else {
                  // Part 1以外は通常の比較
                  isCorrect = selectedLetter === question.correct;
                }
                
                return (
                  <div
                    key={question.id}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                    title={`Q${index + 1}: ${isCorrect ? t('result.correct') : t('result.incorrect')}`}
                  >
                    {isCorrect ? "✓" : "✗"}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Part 2 結果 */}
        {showResults && currentPart2Question && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-center mb-4">
              <div className="text-gray-600">
                {t('result.score', { total: 1, correct: score === 100 ? 1 : 0 })}
              </div>
            </div>
            <div className="flex justify-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  selectedAnswers[currentPart2Question!.id] === currentPart2Question!.correct ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}
                title={`Q1: ${selectedAnswers[currentPart2Question!.id] === currentPart2Question!.correct ? t('result.correct') : t('result.incorrect')}`}
              >
                {selectedAnswers[currentPart2Question!.id] === currentPart2Question!.correct ? "✓" : "✗"}
              </div>
            </div>
          </div>
        )}

        {/* Part 3 結果 */}
        {showResults && currentPart3Question && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-center mb-4">
              <div className="text-gray-600">
                {t('result.score', { total: 3, correct: currentPart3Question!.questions.filter(q => {
                  const selectedLetter = selectedAnswers[q.id];
                  const selectedOptionIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
                  const selectedOptionText = selectedOptionIndex >= 0 && selectedOptionIndex < q.options.length
                    ? q.options[selectedOptionIndex]
                    : null;
                  return selectedOptionText === q.correct;
                }).length })}
              </div>
            </div>
            <div className="flex justify-center space-x-2">
              {currentPart3Question!.questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    (() => {
                      const selectedLetter = selectedAnswers[question.id];
                      const selectedOptionIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
                      const selectedOptionText = selectedOptionIndex >= 0 && selectedOptionIndex < question.options.length 
                        ? question.options[selectedOptionIndex] 
                        : null;
                      return selectedOptionText === question.correct ? "bg-green-500 text-white" : "bg-red-500 text-white";
                    })()
                  }`}
                  title={`Q${index + 1}: ${(() => {
                    const selectedLetter = selectedAnswers[question.id];
                    const selectedOptionIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
                    const selectedOptionText = selectedOptionIndex >= 0 && selectedOptionIndex < question.options.length
                      ? question.options[selectedOptionIndex]
                      : null;
                    return selectedOptionText === question.correct ? t('result.correct') : t('result.incorrect');
                  })()}`}
                >
                  {(() => {
                    const selectedLetter = selectedAnswers[question.id];
                    const selectedOptionIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
                    const selectedOptionText = selectedOptionIndex >= 0 && selectedOptionIndex < question.options.length 
                      ? question.options[selectedOptionIndex] 
                      : null;
                    return selectedOptionText === question.correct ? "✓" : "✗";
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Part 4 結果 */}
        {showResults && currentPart4Question && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-center mb-4">
              <div className="text-gray-600">
                {t('result.score', { total: 3, correct: currentPart4Question!.questions.filter(q => {
                  const selectedLetter = selectedAnswers[q.id];
                  const selectedOptionIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
                  const selectedOptionText = selectedOptionIndex >= 0 && selectedOptionIndex < q.options.length
                    ? q.options[selectedOptionIndex]
                    : null;
                  return selectedOptionText === q.correct;
                }).length })}
              </div>
            </div>
            <div className="flex justify-center space-x-2">
              {currentPart4Question!.questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${(() => {
                    const selectedLetter = selectedAnswers[question.id];
                    const selectedOptionIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
                    const selectedOptionText = selectedOptionIndex >= 0 && selectedOptionIndex < question.options.length 
                      ? question.options[selectedOptionIndex] 
                      : null;
                    return selectedOptionText === question.correct ? "bg-green-500 text-white" : "bg-red-500 text-white";
                  })()
                  }`}
                  title={`Q${index + 1}: ${(() => {
                    const selectedLetter = selectedAnswers[question.id];
                    const selectedOptionIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
                    const selectedOptionText = selectedOptionIndex >= 0 && selectedOptionIndex < question.options.length
                      ? question.options[selectedOptionIndex]
                      : null;
                    return selectedOptionText === question.correct ? t('result.correct') : t('result.incorrect');
                  })()}`}
                >
                  {(() => {
                    const selectedLetter = selectedAnswers[question.id];
                    const selectedOptionIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
                    const selectedOptionText = selectedOptionIndex >= 0 && selectedOptionIndex < question.options.length 
                      ? question.options[selectedOptionIndex] 
                      : null;
                    return selectedOptionText === question.correct ? "✓" : "✗";
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}

        {!currentPassage && !currentPart1Question && !currentPart2Question && !currentPart3Question && !currentPart4Question && !currentPart5Question && !currentPart6Question && errorMessage ? (
          // エラー状態：問題が見つからない場合
          <div className="text-center p-12">
            <div className="text-gray-600 text-lg mb-6">{t('error.noQuestions')}</div>
            <div className="text-gray-500 text-sm mb-8">{errorMessage}</div>
            <button
              onClick={() => {
                setErrorMessage("");
                selectRandomPassage();
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {t('error.tryAnother')}
            </button>
          </div>
        ) : showResults && currentPart1Question ? (
          <Part1Results
            question={currentPart1Question}
            selectedAnswers={selectedAnswers}
            isSpeaking={isSpeaking}
            onPlayAudio={() => {
              try {
                if (isIOS) {
                  prepareIOSAudioContext();
                }
                if (currentPart1Question) {
                  playPart1IndependentAudio(currentPart1Question);
                }
              } catch (error) {
                console.error('Error in RESULTS audio button click handler:', error);
              }
            }}
            onCopy={copyToClipboard}
          />
        ) : (showResults && currentPart2Question && !currentPart3Question) ? (
          <Part2Results
            question={currentPart2Question}
            selectedAnswers={selectedAnswers}
            isSpeaking={isSpeaking}
            onPlayAudio={async () => {
              try {
                if (isIOS) {
                  await prepareIOSAudioContext();
                }
                if (currentPart2Question) {
                  playPart2Audio(currentPart2Question);
                }
              } catch (error) {
                console.error('Error in RESULTS audio button click handler:', error);
              }
            }}
            onCopy={copyToClipboard}
          />
        ) : (showResults && currentPart3Question && !currentPart2Question) ? (
          <Part3Results
            question={currentPart3Question}
            selectedAnswers={selectedAnswers}
            showResults={showResults}
            showTranslation={showTranslation}
            isSpeaking={isSpeaking}
            onPlayAudio={async () => {
              try {
                if (isIOS) {
                  await prepareIOSAudioContext();
                }
                console.log('🎯 結果画面の音声ボタンクリック');
                playPart3Audio(currentPart3Question!);
              } catch (error) {
                console.error('Error in RESULTS audio button click handler:', error);
              }
            }}
            onAnswer={(questionId, answer) => {
              setSelectedAnswers({
                ...selectedAnswers,
                [questionId]: answer
              });
            }}
            onSubmit={() => {
              // Part 3のスコア計算
              let correctCount = 0;
              currentPart3Question!.questions.forEach(question => {
                const selectedLetter = selectedAnswers[question.id];
                const selectedIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
                const selectedOption = selectedIndex >= 0 && selectedIndex < question.options.length
                  ? question.options[selectedIndex]
                  : null;
                if (selectedOption === question.correct) {
                  correctCount++;
                }
              });

              setScore(correctCount);
              setShowResults(true);
              setShowTranslation(true);
            }}
            onCopy={copyToClipboard}
          />
        ) : currentPart0Sentence ? (
          // Part 0: Foundation 練習画面
          <Part0Component 
            sentences={[currentPart0Sentence]} 
            onComplete={(results) => {
              // 結果を統計に反映
              console.log('Part 0 結果:', results);
              // 新しい問題を選択
              selectRandomPassage();
            }}
            onNext={() => {
              // Part0で新しい問題を選択
              selectRandomPassage();
            }}
          />
        ) : currentPassage && !showResults && !currentPart1Question && !currentPart2Question && !currentPart3Question && !currentPart4Question ? (
          // Part 1/7 出題中画面
          <>
            {console.log("🔍 Part 1/7 出題中画面を表示")}
            
            {/* Part 1のシーン情報セクション */}
            {currentPassage!.toeicPart === 'part1' && currentPassage!.part1Questions?.[0]?.scene && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">シーン環境</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-gray-200 text-xs">
                    <span className="font-semibold text-gray-600">scene:</span>
                    <span className="ml-1 text-gray-700">{currentPassage!.part1Questions?.[0].scene}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 問題文セクション */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">{t('misc.questionText')}</h2>
                <button
                  onClick={() => copyToClipboard(generateQuestionsText(currentPassage), "問題文")}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={t('misc.copyQuestion')}
                >
                  <Copy size={18} />
                </button>
              </div>
              
              {/* 指示文：Part 1、複数資料かどうかで分岐 */}
              <div className="text-black mb-4 font-medium text-lg">
                {currentPassage!.toeicPart === 'part1' ? (
                  <span className="font-bold">1.</span>
                ) : currentPassage!.isMultiDocument ? (
                  <span className="font-bold">{generateMultipleDocumentsInstruction(currentPassage)}</span>
                ) : (
                  <span><span className="font-bold">Questions 1-{currentPassage!.questions.length}</span> refer to the following {currentPassage!.type}.</span>
                )}
              </div>
              
              {/* 本文表示：複数資料かどうかで分岐 */}
              {currentPassage!.isMultiDocument ? (
                renderMultipleDocuments(false)
              ) : (
                <>
                  <div className="text-black border border-gray-300 rounded-lg p-4 bg-white text-lg leading-relaxed whitespace-pre-wrap">
                    {(() => {
                      console.log('🔍 Content Display Debug (出題中):');
                      console.log('  - currentPassage exists:', !!currentPassage);
                      console.log('  - currentPassage.toeicPart:', currentPassage?.toeicPart);
                      console.log('  - currentPassage.partType:', currentPassage?.partType);
                      console.log('  - Full currentPassage object:', currentPassage);
                      
                      const isPart1 = currentPassage!.toeicPart === 'part1' || currentPassage!.partType === 'part1';
                      console.log('  - isPart1 check result:', isPart1);
                      
                      if (isPart1) {
                        console.log('🔍 Part 1 Debug Info (出題中):');
                        console.log('  - currentPassage.toeicPart:', currentPassage!.toeicPart);
                        console.log('  - currentPassage.partType:', currentPassage!.partType);
                        console.log('  - part1Questions length:', currentPassage!.part1Questions?.length || 0);
                        console.log('  - First question data:', currentPassage!.part1Questions?.[0]);
                        console.log('  - imagePath:', currentPassage!.part1Questions?.[0]?.imagePath);
                        console.log('  - content:', currentPassage!.content);
                        
                        const hasImage = currentPassage!.part1Questions?.[0]?.imagePath;
                        console.log('  - Will show image?', !!hasImage);
                        
                        if (hasImage) {
                          console.log('  - 📸 Displaying image (出題中):', currentPassage!.part1Questions?.[0]?.imagePath);
                          return (
                            <>
                              {/* 【Part 1画像表示 #2】通常Passage - 出題中 */}
                              {/* データソース: currentPassage.part1Questions[0].imagePath */}
                              {/* 表示条件: !showResults && currentPassage && isPart1 && hasImage */}
                              {/* 特徴: Passageモード出題中、フォールバック機能あり */}
                              <img 
                                  src={currentPassage!.part1Questions?.[0]?.imagePath} 
                                  alt="TOEIC Part 1 scene"
                                  className="w-full h-auto mx-auto border-4 border-green-500"
                                  onLoad={() => {
                                    console.log('✅ Part 1 image loaded successfully (出題中):', currentPassage!.part1Questions?.[0].imagePath);
                                  }}
                                  onError={(e) => {
                                    console.error('❌ Part 1 image failed to load (出題中):', currentPassage!.part1Questions?.[0].imagePath);
                                    // 画像読み込み失敗時はシーン説明文にフォールバック
                                    e.currentTarget.style.display = 'none';
                                    const fallbackDiv = e.currentTarget.nextElementSibling as HTMLDivElement;
                                    if (fallbackDiv) {
                                      fallbackDiv.style.display = 'block';
                                    }
                                  }}
                              />
                              <div 
                                className="hidden text-center text-gray-700 italic"
                                style={{ display: 'none' }}
                              >
                                {currentPassage!.content || ""}
                              </div>
                            </>
                          );
                        } else {
                          console.log('  - 📝 Displaying text content instead (出題中)');
                          return currentPassage!.content || "";
                        }
                      } else {
                        return renderHighlightedContent(currentPassage!.content || "", false);
                      }
                    })()}
                  </div>
                  {currentPassage?.chart && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="p-4">
                        <h3 className="text-lg font-bold mb-2">{currentPassage.chart.title}</h3>
                        <ChartRenderer chart={currentPassage.chart} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 選択肢表示 */}
            <div className="space-y-6">
              {currentPassage!.questions.map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 pb-4">
                  {question.question && (
                    <h3 className="text-lg font-medium mb-3 text-black">
                      {index + 1}. {question.question}
                    </h3>
                  )}
                  
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const optionLetter = String.fromCharCode(65 + optionIndex);
                      const isSelected = selectedAnswers[question.id] === optionLetter;
                      
                      return (
                        <div
                          key={optionIndex}
                          onClick={() => handleAnswerSelect(question.id, optionLetter)}
                          className={`border rounded-lg p-3 cursor-pointer hover:border-gray-300 ${
                            isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                          }`}
                        >
                          <span className="flex-1 text-black flex text-lg">
                            <span className="flex-shrink-0 mr-2 font-medium">({optionLetter})</span>
                            <span className="whitespace-pre-wrap">{option}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (showResults && currentPassage && !currentPart2Question && !currentPart3Question) ? (
          // 結果画面：問題文を上に、本文を下に表示
          <>
            {/* Part 1の話者情報セクション */}
            {currentPassage!.toeicPart === 'part1' && currentPassage!.part1Questions?.[0]?.voiceProfile && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('misc.speakerInfo')}</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex flex-col gap-1 text-sm bg-white p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Speaker:</span>
                      {currentPassage!.part1Questions?.[0].voiceProfile && (
                        <>
                          <span className="text-gray-600">{currentPassage!.part1Questions?.[0].voiceProfile.country}</span>
                          <span className="text-gray-600">{currentPassage!.part1Questions?.[0].voiceProfile.accent} English</span>
                          <span className="text-gray-500">({currentPassage!.part1Questions?.[0].voiceProfile.gender})</span>
                        </>
                      )}
                    </div>
                    {currentPassage!.part1Questions?.[0].voiceProfile && (
                      <div className="text-xs text-gray-500 font-mono">
                        <span>Voice ID: {currentPassage!.part1Questions?.[0].voiceProfile.voiceId}</span>
                        <span className="ml-3">Volume: {((PART3_VOICE_VOLUME_MAP[currentPassage!.part1Questions?.[0].voiceProfile.voiceId] || DEFAULT_PART3_VOLUME) * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Part 1のシーン情報セクション */}
            {currentPassage!.toeicPart === 'part1' && currentPassage!.part1Questions?.[0]?.scene && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">シーン環境</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-gray-200 text-xs">
                    <span className="font-semibold text-gray-600">scene:</span>
                    <span className="ml-1 text-gray-700">{currentPassage!.part1Questions?.[0].scene}</span>
                  </div>
                </div>
              </div>
            )}


            {/* 問題文セクション */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">{t('misc.questionText')}</h2>
                <button
                  onClick={() => copyToClipboard(generateQuestionsText(currentPassage), "問題文")}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={t('misc.copyQuestion')}
                >
                  <Copy size={18} />
                </button>
              </div>

              <div className="space-y-6">
                {currentPassage!.questions.map((question, index) => (
                  <div key={question.id} className="border-b border-gray-200 pb-4">
                    {/* Part 1以外は問題文を表示、Part 1は音声ボタンのみ */}
                    {currentPassage!.toeicPart !== 'part1' ? (
                      <h3 className="text-lg font-medium mb-3 text-black flex">
                        <span className="flex-shrink-0 mr-2">{index + 1}.</span>
                        <span className="whitespace-pre-wrap">{question.question}</span>
                      </h3>
                    ) : (
                      <div className="flex justify-center items-center mb-6">
                        {/* Part 1の場合のみ選択肢の音声読み上げボタンを表示（大きく目立つUI） */}
                        <button
                          onClick={(e) => {
                            console.log("🎵 RESULTS screen audio button clicked - showResults:", showResults);
                            e.preventDefault();
                            e.stopPropagation();
                            
                            try {
                              console.log('🎵 RESULTS audio button - Part 1 mode');
                              
                              if (!question || !question.options) {
                                console.error('Question or options are missing');
                                return;
                              }
                              
                              // Part 1の場合は音声ファイルのみを使用
                              if (currentPassage!.toeicPart === 'part1') {
                                console.log('Using playPart1Audio function');
                                playPart1Audio(question);
                              } else {
                                // その他のPartはWeb Speech APIを使用
                                console.log('Using Web Speech API for non-Part1');
                                const optionsText = question.options.map((option, idx) => 
                                  `(${String.fromCharCode(65 + idx)}) ${option.replace(/^[A-D]\.\s*/, '')}`
                                ).join('. ');
                                speakText(optionsText);
                              }
                              console.log("🎵 Audio function called, showResults after:", showResults);
                            } catch (error) {
                              console.error('Error in RESULTS audio button click handler:', error);
                            }
                          }}
                          className={`flex items-center justify-center px-8 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-105 shadow-lg ${
                            isSpeaking 
                              ? "bg-red-500 text-white hover:bg-red-600 shadow-red-200" 
                              : "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200"
                          }`}
                          title={isSpeaking ? "音声読み上げを停止" : "選択肢を音声で読み上げ"}
                        >
                          {isSpeaking ? <VolumeX size={24} className="mr-2" /> : <Volume2 size={24} className="mr-2" />}
                          {isSpeaking ? t('misc.stopAudio') : t('misc.listenOptions')}
                        </button>
                      </div>
                    )}

                    {/* Part 1以外の場合のみ問題文翻訳を表示 */}
                    {currentPassage!.toeicPart !== 'part1' && question.questionTranslation && (
                      <div className="mb-3 p-3 bg-blue-50 rounded text-black whitespace-pre-wrap">{question.questionTranslation}</div>
                    )}

                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const optionLetter = String.fromCharCode(65 + optionIndex);
                        const isSelected = selectedAnswers[question.id] === optionLetter;
                        
                        // 正解判定（Part 1の場合は特別処理）
                        let isCorrectOption = false;
                        if (currentPassage!.toeicPart === 'part1') {
                          // 正解が記号（A, B, C, D）の場合
                          if (question.correct.length === 1 && /^[A-D]$/.test(question.correct)) {
                            isCorrectOption = optionLetter === question.correct;
                          } else {
                            // 正解がテキストの場合
                            isCorrectOption = option === question.correct;
                          }
                        } else {
                          // Part 1以外は通常の比較
                          isCorrectOption = optionLetter === question.correct;
                        }
                        
                        return (
                          <div
                            key={optionIndex}
                            className={`flex items-start space-x-3 p-3 rounded-lg border ${
                              isSelected
                                ? isCorrectOption
                                  ? "border-green-500 bg-green-50"
                                  : "border-red-500 bg-red-50"
                                : isCorrectOption
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200"
                            }`}
                          >
                            <span className="flex-1 text-black flex text-lg">
                              <span className="flex-shrink-0 mr-2 font-medium">({optionLetter})</span>
                              <span className="whitespace-pre-wrap">{cleanText(option)}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {question.optionTranslations && question.optionTranslations.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <div className="space-y-1">
                          {question.optionTranslations.map((translation, optionIndex) => (
                            <div key={optionIndex} className="text-black flex">
                              <span className="flex-shrink-0 mr-2">({String.fromCharCode(65 + optionIndex)})</span>
                              <span className="whitespace-pre-wrap">{cleanTranslationText(translation)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 p-3 rounded">
                      {(() => {
                        const selectedLetter = selectedAnswers[question.id];
                        const selectedOptionIndex = selectedLetter ? selectedLetter.charCodeAt(0) - 65 : -1;
                        const selectedOptionText = selectedOptionIndex >= 0 && selectedOptionIndex < question.options.length 
                          ? question.options[selectedOptionIndex] 
                          : null;
                        
                        // Part 1の正解判定（calculateScoreと同じロジック）
                        let isCorrect = false;
                        if (currentPassage!.toeicPart === 'part1') {
                          // 正解が記号（A, B, C, D）の場合
                          if (question.correct.length === 1 && /^[A-D]$/.test(question.correct)) {
                            isCorrect = selectedLetter === question.correct;
                          } else {
                            // 正解がテキストの場合、選択肢から該当するインデックスを見つける
                            const correctIndex = question.options.findIndex(option => option === question.correct);
                            if (correctIndex !== -1) {
                              const correctLetter = String.fromCharCode(65 + correctIndex); // A, B, C, D
                              isCorrect = selectedLetter === correctLetter;
                            }
                          }
                        } else {
                          // Part 1以外は通常の比較
                          isCorrect = selectedOptionText === question.correct;
                        }
                        
                        // 正解の記号を取得
                        let correctLetter = '?';
                        
                        // question.correctが既に記号（A, B, C, D）の場合
                        if (question.correct.length === 1 && /^[A-D]$/.test(question.correct)) {
                          correctLetter = question.correct;
                        } else {
                          // question.correctがテキストの場合、対応する記号を検索
                          const correctIndex = question.options.findIndex(option => option === question.correct);
                          if (correctIndex >= 0) {
                            correctLetter = String.fromCharCode(65 + correctIndex);
                          }
                        }
                        
                        return isCorrect ? (
                          <div className="bg-green-100 text-green-800 p-2 rounded">{t('result.answerCorrect')}</div>
                        ) : (
                          <div className="bg-red-100 text-red-800 p-2 rounded">{t('result.answerIncorrect', { answer: correctLetter })}</div>
                        );
                      })()}
                      <div className="mt-2 text-black whitespace-pre-wrap">{question.explanation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 本文セクション */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">本文</h2>
                <button
                  onClick={() => currentPassage!.isMultiDocument ? copyMultipleDocuments() : copyToClipboard(generateContentText(currentPassage), "本文")}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={currentPassage!.isMultiDocument ? "複数資料をコピー" : "本文をコピー"}
                >
                  <Copy size={18} />
                </button>
              </div>
              {/* 指示文：Part 1、複数資料かどうかで分岐 */}
              <div className="text-black mb-4 font-medium text-lg">
                {currentPassage!.toeicPart === 'part1' ? (
                  <span className="font-bold">1.</span>
                ) : currentPassage!.isMultiDocument ? (
                  <span className="font-bold">{generateMultipleDocumentsInstruction(currentPassage)}</span>
                ) : (
                  <span><span className="font-bold">Questions 1-{currentPassage!.questions.length}</span> refer to the following {currentPassage!.type}.</span>
                )}
              </div>
              
              {/* 本文表示：複数資料かどうかで分岐 */}
              {currentPassage!.isMultiDocument ? (
                renderMultipleDocuments(true)
              ) : (
                <>
                  <div className="text-black border border-gray-300 rounded-lg p-4 bg-white text-lg leading-relaxed whitespace-pre-wrap">
                    {(() => {
                      console.log('🔍 Content Display Debug (結果画面):');
                      console.log('  - currentPassage exists:', !!currentPassage);
                      console.log('  - currentPassage.toeicPart:', currentPassage?.toeicPart);
                      console.log('  - currentPassage.partType:', currentPassage?.partType);
                      console.log('  - Full currentPassage object:', currentPassage);
                      
                      const isPart1 = currentPassage!.toeicPart === 'part1' || currentPassage!.partType === 'part1';
                      console.log('  - isPart1 check result:', isPart1);
                      
                      if (isPart1) {
                        console.log('🔍 Part 1 Debug Info (結果画面):');
                        console.log('  - currentPassage.toeicPart:', currentPassage!.toeicPart);
                        console.log('  - currentPassage.partType:', currentPassage!.partType);
                        console.log('  - part1Questions length:', currentPassage!.part1Questions?.length || 0);
                        console.log('  - First question data:', currentPassage!.part1Questions?.[0]);
                        console.log('  - imagePath:', currentPassage!.part1Questions?.[0]?.imagePath);
                        console.log('  - content:', currentPassage!.content);
                        
                        const hasImage = currentPassage!.part1Questions?.[0]?.imagePath;
                        console.log('  - Will show image?', !!hasImage);
                        
                        if (hasImage) {
                          console.log('  - 📸 Displaying image (結果画面):', currentPassage!.part1Questions?.[0].imagePath);
                          return (
                            <div className="space-y-4">
                              <div className="px-4">
                                {/* 【Part 1画像表示 #3】通常Passage - 結果画面 */}
                                {/* データソース: currentPassage.part1Questions[0].imagePath */}
                                {/* 表示条件: showResults && currentPassage && isPart1 && hasImage */}
                                {/* 特徴: Passageモード結果表示、画像+シーン説明文分離レイアウト */}
                                <img 
                                  src={currentPassage!.part1Questions?.[0]?.imagePath} 
                                  alt="TOEIC Part 1 scene"
                                  className="w-full h-auto max-w-md mx-auto rounded-lg shadow-md border-4 border-blue-500"
                                  onLoad={() => {
                                    console.log('✅ Part 1 image loaded successfully (結果画面):', currentPassage!.part1Questions?.[0].imagePath);
                                  }}
                                  onError={() => {
                                    console.error('❌ Part 1 image failed to load (結果画面):', currentPassage!.part1Questions?.[0].imagePath);
                                  }}
                                />
                              </div>
                              {/* シーン説明文も表示 */}
                              <div className="text-center text-gray-700 italic bg-gray-50 p-3 rounded border">
                                <div className="text-sm font-medium text-gray-600 mb-1">シーン説明文：</div>
                                {currentPassage!.content || ""}
                              </div>
                            </div>
                          );
                        } else {
                          console.log('  - 📝 Displaying text content instead (結果画面)');
                          return currentPassage!.content || "";
                        }
                      } else {
                        return renderHighlightedContent(currentPassage!.content || "", true);
                      }
                    })()}
                  </div>
                  {currentPassage!.contentTranslation && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-black whitespace-pre-wrap p-4 bg-blue-50 rounded">{currentPassage!.contentTranslation}</div>
                    </div>
                  )}
                  {currentPassage?.chart && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="p-4">
                        <h3 className="text-lg font-bold mb-2">{currentPassage.chart.title}</h3>
                        <ChartRenderer chart={currentPassage.chart} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : currentPart3Question ? (
          // Part 3 専用UI: 会話と3問の問題
          <>
            <div className="mb-4">
              <div className="text-black mb-4 font-medium text-lg">
                <span className="font-bold">Part 3 | 会話問題</span>
                <span 
                  className="text-gray-400 text-sm ml-2 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => copyToClipboard(currentPart3Question!.id, "Part 3 ID")}
                  title={t('misc.clickToCopyId', { type: '' })}
                >ID: {currentPart3Question!.id}</span>
              </div>
            </div>

            <div className="border-t border-gray-300 my-6"></div>

            {/* 音声再生ボタン */}
            <div className="flex justify-center items-center mb-6">
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isIOS) {
                    await prepareIOSAudioContext();
                  }
                  console.log('🎯 出題中画面の音声ボタンクリック');
                  playPart3Audio(currentPart3Question);
                }}
                className={`flex items-center justify-center px-8 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-105 shadow-lg ${
                  isSpeaking 
                    ? "bg-red-500 text-white hover:bg-red-600 shadow-red-200"
                    : "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200"
                }`}
                title={isSpeaking ? "音声読み上げを停止" : "会話を聞く"}
              >
                {isSpeaking ? <VolumeX size={24} className="mr-2" /> : <Volume2 size={24} className="mr-2" />}
                {isSpeaking ? "停止" : "会話を聞く"}
              </button>
            </div>

            {/* 3問の問題 */}
            <div className="space-y-8">
              {currentPart3Question!.questions.map((question, qIndex) => (
                <div key={question.id} className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium mb-4 text-black flex">
                    <span className="flex-shrink-0 mr-2">{qIndex + 1}.</span>
                    <span className="whitespace-pre-wrap">{question.question}</span>
                  </h3>
                  
                  {/* 選択肢（A,B,C,D） */}
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D
                      const isSelected = selectedAnswers[question.id] === optionLetter;
                      
                      return (
                        <div
                          key={optionIndex}
                          onClick={() => {
                            if (showResults) return; // 結果表示中はクリックできない
                            
                            // 現在時点のタイマーを停止（最初の回答時のみ）
                            if (Object.keys(selectedAnswers).filter(id => 
                              currentPart3Question!.questions.some(q => q.id === id)
                            ).length === 0) {
                              stopTimer();
                            }
                            
                            // 同じ選択肢を再度クリックした場合は選択解除
                            if (isSelected) {
                              const newAnswers = { ...selectedAnswers };
                              delete newAnswers[question.id];
                              setSelectedAnswers(newAnswers);
                            } else {
                              setSelectedAnswers({
                                ...selectedAnswers,
                                [question.id]: optionLetter
                              });
                            }
                          }}
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                            isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                          } cursor-pointer hover:border-gray-300 ${
                            showResults ? "cursor-default" : ""
                          }`}
                        >
                          <span className="flex-1 text-black flex text-lg">
                            <span className="flex-shrink-0 mr-2 font-medium">({optionLetter})</span>
                            <span className="whitespace-pre-wrap">{option}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : currentPart2Question ? (
          <Part2QuestionView
            question={currentPart2Question}
            selectedAnswers={selectedAnswers}
            isSpeaking={isSpeaking}
            onPlayAudio={async () => {
              if (isIOS) {
                await prepareIOSAudioContext();
              }
              playPart2Audio(currentPart2Question);
            }}
            onAnswer={(questionId, answer) => {
              if (answer === null) {
                setSelectedAnswers({});
              } else {
                setSelectedAnswers({[questionId]: answer});
              }
            }}
            onCopy={copyToClipboard}
          />
        ) : currentPassage ? (
          <>
            <div className="mb-4">
              {/* 指示文：Part 1、複数資料かどうかで分岐 */}
              <div className="text-black mb-4 font-medium text-lg">
                {currentPassage!.toeicPart === 'part1' ? (
                  <span className="font-bold">1.</span>
                ) : currentPassage!.isMultiDocument ? (
                  <span className="font-bold">{generateMultipleDocumentsInstruction(currentPassage)}</span>
                ) : (
                  <span><span className="font-bold">Questions 1-{currentPassage!.questions.length}</span> refer to the following {currentPassage!.type}.</span>
                )}
                <span 
                  className="text-gray-400 text-sm ml-2 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => copyToClipboard(currentPassage!.id, "Passage ID")}
                  title={t('misc.clickToCopyId', { type: '' })}
                >ID: {currentPassage!.id}</span>
              </div>
              
              {/* 本文表示：複数資料かどうかで分岐 */}
              {currentPassage!.isMultiDocument ? (
                renderMultipleDocuments()
              ) : (
                <>
                  <div className="text-black border border-gray-300 rounded-lg p-4 bg-white text-lg leading-relaxed whitespace-pre-wrap">
                    {(currentPassage!.toeicPart === 'part1' || currentPassage!.partType === 'part1') ? 
                      currentPassage!.content || "" : 
                      renderHighlightedContent(currentPassage!.content || "")
                    }
                  </div>
                  {showTranslation && currentPassage!.contentTranslation && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-black whitespace-pre-wrap p-4 bg-blue-50 rounded">{currentPassage!.contentTranslation}</div>
                    </div>
                  )}
                  {currentPassage?.chart && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="p-4">
                        <h3 className="text-lg font-bold mb-2">{currentPassage.chart.title}</h3>
                        <ChartRenderer chart={currentPassage.chart} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-gray-300 my-6"></div>

            <div className="space-y-6">
              {currentPassage!.questions.map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 pb-4">
                  {/* Part 1以外は問題文を表示、Part 1は音声ボタンのみ */}
                  {currentPassage!.toeicPart !== 'part1' ? (
                    <h3 className="text-lg font-medium mb-3 text-black flex">
                      <span className="flex-shrink-0 mr-2">{index + 1}.</span>
                      <span className="whitespace-pre-wrap">{question.question}</span>
                    </h3>
                  ) : (
                    <div className="flex justify-center items-center mb-6">
                      {/* Part 1の場合のみ選択肢の音声読み上げボタンを表示（大きく目立つUI） */}
                      <button
                        onClick={(e) => {
                          console.log('🎵 Audio button clicked in QUIZ screen');
                          e.preventDefault();
                          e.stopPropagation();
                          
                          try {
                            console.log('🎵 Audio button - Part 1 mode');
                            
                            if (!question || !question.options) {
                              console.error('Question or options are missing');
                              return;
                            }
                            
                            // Part 1の場合は音声ファイルのみを使用
                            if (currentPassage!.toeicPart === 'part1') {
                              console.log('Using playPart1Audio function');
                              playPart1Audio(question);
                            } else {
                              // その他のPartはWeb Speech APIを使用
                              console.log('Using Web Speech API for non-Part1');
                              const optionsText = question.options.map((option, idx) => 
                                `(${String.fromCharCode(65 + idx)}) ${option.replace(/^[A-D]\.\s*/, '')}`
                              ).join('. ');
                              speakText(optionsText);
                            }
                          } catch (error) {
                            console.error('Error in audio button click handler:', error);
                            if (error instanceof Error) {
                              console.error('Error stack:', error.stack);
                            }
                          }
                        }}
                        className={`flex items-center justify-center px-8 py-4 rounded-xl font-medium text-lg transition-all transform hover:scale-105 shadow-lg ${
                          isSpeaking 
                            ? "bg-red-500 text-white hover:bg-red-600 shadow-red-200" 
                            : "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200"
                        }`}
                        title={isSpeaking ? "音声読み上げを停止" : "選択肢を音声で読み上げ"}
                      >
                        {isSpeaking ? <VolumeX size={24} className="mr-2" /> : <Volume2 size={24} className="mr-2" />}
                        {isSpeaking ? t('misc.stopAudio') : t('misc.listenOptions')}
                      </button>
                    </div>
                  )}

                  {/* Part 1以外の場合のみ問題文翻訳を表示 */}
                  {currentPassage!.toeicPart !== 'part1' && showTranslation && question.questionTranslation && (
                    <div className="mb-3 p-3 bg-blue-50 rounded text-black whitespace-pre-wrap">{question.questionTranslation}</div>
                  )}
                  {currentPassage!.toeicPart !== 'part1' && showTranslation && !question.questionTranslation && <div className="mb-3 p-2 bg-gray-50 rounded text-gray-500">{t('misc.translationMissing')}</div>}

                  {/* Part 1以外の場合のみ選択肢のテキストリストを表示 */}
                  {currentPassage!.toeicPart !== 'part1' ? (
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          onClick={() => {
                            const currentAnswer = selectedAnswers[question.id];
                            const newAnswer = String.fromCharCode(65 + optionIndex);
                            // 同じ選択肢を再度クリックした場合は選択解除
                            if (currentAnswer === newAnswer) {
                              handleAnswerSelect(question.id, "");
                            } else {
                              handleAnswerSelect(question.id, newAnswer);
                            }
                          }}
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                            selectedAnswers[question.id] === String.fromCharCode(65 + optionIndex) ? "border-blue-500 bg-blue-50" : "border-gray-200"
                          } cursor-pointer hover:border-gray-300`}
                        >
                          <span className="flex-1 text-black flex text-lg">
                            <span className="flex-shrink-0 mr-2 font-medium">({String.fromCharCode(65 + optionIndex)})</span>
                            <span className="whitespace-pre-wrap">{cleanText(option)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">音声で選択肢を聞いて、下のボタンから答えを選択してください</p>
                      <div className="flex justify-center items-center gap-4">
                        {question.options.map((option, optionIndex) => (
                          <button
                            key={optionIndex}
                            onClick={() => {
                              const currentAnswer = selectedAnswers[question.id];
                              const newAnswer = String.fromCharCode(65 + optionIndex);
                              if (currentAnswer === newAnswer) {
                                handleAnswerSelect(question.id, "");
                              } else {
                                handleAnswerSelect(question.id, newAnswer);
                              }
                            }}
                            className={`h-16 w-16 rounded-full font-bold text-xl transition-all transform hover:scale-110 ${
                              selectedAnswers[question.id] === String.fromCharCode(65 + optionIndex) 
                                ? "bg-blue-500 text-white shadow-lg" 
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentPassage!.toeicPart !== 'part1' && showTranslation && question.optionTranslations && question.optionTranslations.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded">
                      <div className="space-y-1">
                        {question.optionTranslations.map((translation, optionIndex) => (
                          <div key={optionIndex} className="text-black flex">
                            <span className="flex-shrink-0 mr-2">({String.fromCharCode(65 + optionIndex)})</span>
                            <span className="whitespace-pre-wrap">{cleanTranslationText(translation)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {showTranslation && (!question.optionTranslations || question.optionTranslations.length === 0) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <div className="text-gray-500">{t('misc.translationMissing')}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (showResults && currentPart5Question) ? (
          <Part5Results
            question={currentPart5Question}
            selectedAnswers={selectedAnswers}
            showTranslation={showTranslation}
            showResults={showResults}
            onCopy={copyToClipboard}
          />
        ) : (showResults && currentPart4Question && !currentPart2Question && !currentPart3Question) ? (
          <Part4Results
            question={currentPart4Question}
            selectedAnswers={selectedAnswers}
            showResults={showResults}
            showTranslation={showTranslation}
            isSpeaking={isSpeaking}
            isPlayingPart4={isPlayingPart4}
            isPausedPart4={isPausedPart4}
            part4CurrentTime={part4CurrentTime}
            part4Duration={part4Duration}
            onPlayPart4Audio={(audioPath) => playPart4Audio(audioPath)}
            onPausePart4Audio={pausePart4Audio}
            onStopPart4Audio={stopPart4Audio}
            onSkipBackward={skipBackwardPart4}
            onSkipForward={skipForwardPart4}
            onSeek={seekPart4Audio}
            onButtonAction={handleButtonAction}
            onCopy={copyToClipboard}
          />
        ) : !showResults && currentPart1Question ? (
          <Part1QuestionView
            question={currentPart1Question}
            selectedAnswers={selectedAnswers}
            isSpeaking={isSpeaking}
            part1ImageLoading={part1ImageLoading}
            part1ImageError={part1ImageError}
            onPlayAudio={() => {
              try {
                if (!currentPart1Question!.audioFiles) {
                  console.error('AudioFiles are missing');
                  return;
                }
                playPart1IndependentAudio(currentPart1Question!);
              } catch (error) {
                console.error('Error in audio button click handler:', error);
                if (error instanceof Error) {
                  console.error('Error stack:', error.stack);
                }
              }
            }}
            onAnswer={(questionId, answer) => {
              if (answer === null) {
                setSelectedAnswers({});
              } else {
                setSelectedAnswers({[questionId]: answer});
              }
            }}
            onImageLoad={() => setPart1ImageLoading(false)}
            onImageError={() => {
              setPart1ImageLoading(false);
              setPart1ImageError(true);
            }}
            onCopy={copyToClipboard}
          />
        ) : !showResults && currentPart4Question && !currentPart2Question && !currentPart3Question ? (
          <Part4QuestionView
            question={currentPart4Question}
            selectedAnswers={selectedAnswers}
            showTranslation={showTranslation}
            isPlayingPart4={isPlayingPart4}
            isPausedPart4={isPausedPart4}
            part4CurrentTime={part4CurrentTime}
            part4Duration={part4Duration}
            onPlayPart4Audio={(audioPath) => playPart4Audio(audioPath)}
            onPausePart4Audio={pausePart4Audio}
            onStopPart4Audio={stopPart4Audio}
            onSkipBackward={skipBackwardPart4}
            onSkipForward={skipForwardPart4}
            onSeek={seekPart4Audio}
            onButtonAction={handleButtonAction}
            onAnswer={(questionId, answer) => {
              if (answer === null) {
                const newAnswers = { ...selectedAnswers };
                delete newAnswers[questionId];
                setSelectedAnswers(newAnswers);
              } else {
                setSelectedAnswers({
                  ...selectedAnswers,
                  [questionId]: answer
                });
              }
            }}
            onCopy={copyToClipboard}
          />
        ) : (showResults && currentPart6Question) ? (
          <Part6Results
            question={currentPart6Question}
            selectedAnswers={selectedAnswers}
            showResults={showResults}
            onCopy={copyToClipboard}
          />
        ) : !showResults && currentPart5Question ? (
          <Part5QuestionView
            question={currentPart5Question}
            selectedAnswers={selectedAnswers}
            onAnswer={(questionId, answer) => {
              if (answer === null) {
                const newAnswers = { ...selectedAnswers };
                delete newAnswers[questionId];
                setSelectedAnswers(newAnswers);
              } else {
                setSelectedAnswers({
                  ...selectedAnswers,
                  [questionId]: answer
                });
              }
            }}
            onCopy={copyToClipboard}
          />
        ) : null}

        {/* 他のPartのCheckボタン */}
        {!showResults && (currentPassage || currentPart1Question || currentPart2Question || currentPart3Question || currentPart4Question || currentPart5Question) && (
          <button onClick={handleSubmit} className="mt-6 w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600">
            Check
          </button>
        )}

        {/* 共通ボタンセクション - 全パート（Part1, Part2, Part3, Part4, Part7）で使用 */}
        {/* @ai-hint: このセクションがNext/Retryボタンを提供するため、各パートの結果画面に個別ボタンは不要 */}
        {/* @ai-hint: scoreは各パートのcalculateScore()で計算される（正解時100、不正解時0） */}
        {showResults && (
          <div className="mt-6">
            {score === 100 ? (
              <div className="space-y-3">
                <button onClick={selectRandomPassage} className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600">
                  Next
                </button>
                <button
                  onClick={retryCurrentPassage}
                  className="w-full text-white py-3 rounded-lg"
                  style={{ backgroundColor: "#ff6900" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e55a00")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ff6900")}
                >
                  Retry
                </button>
              </div>
            ) : (
              <button
                onClick={retryCurrentPassage}
                className="w-full text-white py-3 rounded-lg"
                style={{ backgroundColor: "#ff6900" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e55a00")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ff6900")}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {!showResults && currentPart6Question && currentPart6Question.id && (
          <Part6QuestionView
            question={currentPart6Question}
            selectedAnswers={selectedAnswers}
            onAnswer={handleAnswerSelect}
            onSubmit={handleSubmit}
            onCopy={copyToClipboard}
          />
        )}
      </div>

      {!showResults && (currentPassage || currentPart0Sentence || currentPart1Question || currentPart2Question || currentPart3Question || currentPart4Question || currentPart5Question || currentPart6Question) && (
        <div className="flex justify-end mt-4">
          <button 
            onClick={() => {
              console.log('Next button clicked - Part0 sentence:', currentPart0Sentence?.id);
              selectRandomPassage();
            }} 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Next
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
