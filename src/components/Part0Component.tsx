"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, Eye, Check, X, ChevronRight, Copy } from "lucide-react";
import { Part0Sentence } from "@/lib/types";
import { convertToBlobUrl } from "@/lib/audio-blob";
import { useLanguage } from "@/contexts/LanguageContext";

interface Part0ComponentProps {
  sentences: Part0Sentence[];
  onComplete?: (results: Part0Result[]) => void;
  onNext?: () => void;
}

interface Part0Result {
  sentenceId: string;
  selfEvaluation: "success" | "failure";
  playCount: number;
  timestamp: Date;
}

export default function Part0Component({ sentences, onComplete, onNext }: Part0ComponentProps) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showText, setShowText] = useState(false);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [results, setResults] = useState<Part0Result[]>([]);
  const [playCount, setPlayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<"male" | "female">("female");
  const [copied, setCopied] = useState(false);
  const [forceWebSpeech, setForceWebSpeech] = useState(false); // 音質切り替え用
  const audioRef = useRef<HTMLAudioElement>(null);

  // sentencesが変更されたら状態をリセット（新しいセッション開始）
  useEffect(() => {
    setCurrentIndex(0);
    setShowText(false);
    setHasEvaluated(false);
    setResults([]);
    setPlayCount(0);
    setCopied(false);
    setForceWebSpeech(false); // 音質設定もリセット
  }, [sentences]);

  const currentSentence = sentences[currentIndex] || sentences[0]; // フォールバックを追加
  const isComplete = currentIndex >= sentences.length;

  useEffect(() => {
    // 完了時の処理
    if (isComplete && onComplete) {
      onComplete(results);
    }
  }, [isComplete, results, onComplete]);

  useEffect(() => {
    const audio = audioRef.current;

    // コンポーネントアンマウント時のクリーンアップ
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  // Nextボタンの処理を削除（RandomPassageの右上Nextボタンで処理されるため）
  // キーボードショートカットのみ残す
  useEffect(() => {
    // キーボードショートカット (Nキー)
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'n' || event.key === 'N') {
        if (onNext) {
          onNext();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [onNext]);

  const handlePlay = async () => {
    if (!currentSentence || isPlaying) return;

    const audioPath = currentSentence.audioFiles[selectedVoice];

    setIsPlaying(true);
    setPlayCount(prev => prev + 1);

    // 強制的にWebSpeechを使用するか、または音声ファイルが存在しない場合はTTS
    if (forceWebSpeech || !audioPath) {
      playTTSFallback();
      return;
    }

    // 音声ファイルが存在し、forceWebSpeechがfalseの場合はモバイル対応の再生処理
    if (audioPath) {
      try {
        // モバイル向けの音声再生処理（RandomPassageと同様）
        const audio = new Audio();

        // イベントリスナーを設定
        audio.onended = () => {
          setIsPlaying(false);
        };

        audio.onerror = (error) => {
          console.warn("Audio file error, falling back to TTS:", error);
          playTTSFallback();
        };

        audio.onloadeddata = () => {
          console.log(`Audio loaded: ${audioPath}`);
        };

        // 音声ファイルを読み込み（R2 URLに変換）
        const r2AudioUrl = convertToBlobUrl(audioPath);
        audio.src = r2AudioUrl;
        audio.load(); // 明示的に読み込み

        // iOS/モバイル向けの音声再生処理
        const playPromise = audio.play();

        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log(`Audio playback started: ${audioPath}`);
          }).catch((error) => {
            console.warn("Audio play failed, falling back to TTS:", error);
            playTTSFallback();
          });
        } else {
          // 古いブラウザ対応
          console.log("Browser doesn't support play promise");
        }

        return;
      } catch (error) {
        console.warn("Audio setup failed, falling back to TTS:", error);
      }
    }

    // TTS フォールバック処理
    playTTSFallback();
  };

  const playTTSFallback = async () => {
    try {
      if ('speechSynthesis' in window) {
        // 既存の音声を停止
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(currentSentence.text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        // 利用可能な音声を取得して男性・女性の音声を選択
        let voices = speechSynthesis.getVoices();

        // 音声リストが空の場合は複数回試行（ブラウザによっては非同期読み込み）
        if (voices.length === 0) {
          console.log('音声リストが空です。音声読み込みを待機中...');
          // まずvoiceschangedイベントを待機
          await new Promise<void>(resolve => {
            let resolved = false;
            const onVoicesChanged = () => {
              if (!resolved) {
                resolved = true;
                speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
                resolve();
              }
            };
            speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

            // タイムアウト付き
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
                resolve();
              }
            }, 1000);
          });

          voices = speechSynthesis.getVoices();
          console.log('音声読み込み後の音声数:', voices.length);
        }

        if (voices.length > 0) {
          // デバッグ用：利用可能な音声をログ出力
          console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));

          // 英語音声をフィルタリング
          const englishVoices = voices.filter(voice =>
            voice.lang.startsWith('en') || voice.lang.includes('US') || voice.lang.includes('GB')
          );

          console.log('English voices:', englishVoices.map(v => `${v.name} (${v.lang})`));

          if (selectedVoice === 'male') {
            // 男性音声を探す
            const maleVoice = englishVoices.find(voice =>
              voice.name.toLowerCase().includes('male') ||
              voice.name.toLowerCase().includes('man') ||
              voice.name.toLowerCase().includes('david') ||
              voice.name.toLowerCase().includes('alex') ||
              voice.name.toLowerCase().includes('daniel') ||
              voice.name.toLowerCase().includes('james')
            );
            if (maleVoice) {
              utterance.voice = maleVoice;
              console.log(`Using male voice: ${maleVoice.name}`);
            } else {
              // 男性音声のエミュレーション
              utterance.pitch = 0.6;  // より低いピッチ
              utterance.rate = 0.85;   // 少し遅く
            }
          } else {
            // 女性音声を探す
            const femaleVoice = englishVoices.find(voice =>
              voice.name.toLowerCase().includes('female') ||
              voice.name.toLowerCase().includes('woman') ||
              voice.name.toLowerCase().includes('samantha') ||
              voice.name.toLowerCase().includes('victoria') ||
              voice.name.toLowerCase().includes('susan') ||
              voice.name.toLowerCase().includes('karen') ||
              voice.name.toLowerCase().includes('zira')
            );
            if (femaleVoice) {
              utterance.voice = femaleVoice;
              console.log(`Using female voice: ${femaleVoice.name}`);
            } else {
              // 女性音声のエミュレーション
              utterance.pitch = 1.3;  // より高いピッチ
              utterance.rate = 0.95;   // 標準的な速度
            }
          }
        } else {
          // 音声が読み込まれていない場合はpitch/rateで調整
          console.log('音声が利用できません。ピッチ/速度で調整します。');
          if (selectedVoice === 'male') {
            utterance.pitch = 0.6;
            utterance.rate = 0.85;
          } else {
            utterance.pitch = 1.3;
            utterance.rate = 0.95;
          }
        }

        utterance.onstart = () => {
          console.log(`TTS playback started: ${currentSentence.text}`);
        };

        utterance.onend = () => {
          setIsPlaying(false);
        };

        utterance.onerror = (error) => {
          setIsPlaying(false);
          if (error.error === 'canceled') {
            console.log("TTS playback canceled by user");
            return;
          }
          console.error("TTS playback failed:", error);
          alert(t('part0.ttsError'));
        };

        window.speechSynthesis.speak(utterance);
        console.log(`Using TTS for: ${currentSentence.text}`);
      } else {
        throw new Error('Web Speech API not supported');
      }
    } catch (error) {
      console.error("TTS setup failed:", error);
      setIsPlaying(false);
      alert(t('part0.ttsNotSupported'));
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleStop = () => {
    // Web Speech APIの停止
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // 通常の音声再生の停止
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleEvaluation = (evaluation: "success" | "failure") => {
    if (hasEvaluated) return;

    const result: Part0Result = {
      sentenceId: currentSentence.id,
      selfEvaluation: evaluation,
      playCount,
      timestamp: new Date()
    };

    setResults([...results, result]);
    setHasEvaluated(true);
    setShowText(true); // 評価後は文章を表示

    // 自動遷移を削除 - ユーザーが次へボタンを押すまで待つ
  };

  const moveToNext = () => {
    // まだ問題が残っている場合は次へ進む
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowText(false);
      setHasEvaluated(false);
      setPlayCount(0);
      setCopied(false); // コピー状態もリセット
      setForceWebSpeech(false); // 音質設定もリセット
    } else {
      // 最後の問題の場合、完了状態にする
      setCurrentIndex(prev => prev + 1); // これでisCompleteがtrueになる
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2秒後にリセット
    } catch (error) {
      console.error('コピーに失敗しました:', error);
      // フォールバック: テキストエリアを使用
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isComplete) {
    // 完了画面
    const successCount = results.filter(r => r.selfEvaluation === "success").length;
    const successRate = Math.round((successCount / results.length) * 100);

    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <h2 className="text-3xl font-bold">{t('part0.complete')}</h2>
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <div className="text-5xl font-bold text-green-400">{successRate}%</div>
            <p className="text-gray-300">
              {t('part0.resultSummary', { total: results.length, correct: successCount })}
            </p>
          </div>
          <button
            onClick={() => {
              if (onNext) {
                onNext(); // 新しいセットを取得
              } else {
                window.location.reload(); // フォールバック
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {t('part0.newSetButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('part0.title')}</h1>
          <span className="text-gray-400">
            {currentSentence.id}
          </span>
        </div>

        {/* 難易度と トピック */}
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">
            {currentSentence.difficulty}
          </span>
          <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">
            {currentSentence.topic}
          </span>
        </div>

        {/* 音声選択と状態表示 */}
        <div className="space-y-3">
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setSelectedVoice("male")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedVoice === "male"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {t('part0.maleVoice')}
            </button>
            <button
              onClick={() => setSelectedVoice("female")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedVoice === "female"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {t('part0.femaleVoice')}
            </button>
          </div>

          {/* 音声品質切り替え（クリック可能） */}
          <div className="text-center h-8 flex items-center justify-center">
            {currentSentence.audioFiles?.[selectedVoice] ? (
              <button
                onClick={() => setForceWebSpeech(!forceWebSpeech)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 active:scale-95 cursor-pointer ${
                  forceWebSpeech
                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    : "bg-green-100 text-green-800 hover:bg-green-200"
                }`}
                title={t('part0.audioQualitySwitch')}
              >
                {forceWebSpeech ? t('part0.browserVoice') : t('part0.highQuality')}
              </button>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {t('part0.browserVoice')}
              </span>
            )}
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="bg-gray-800 rounded-lg p-8 space-y-6">
          {/* 音声再生ボタン */}
          <div className="flex justify-center">
            <button
              onClick={isPlaying ? handleStop : handlePlay}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all touch-manipulation select-none ${
                isPlaying
                  ? "bg-red-500 animate-pulse hover:bg-red-600 active:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700 hover:scale-105 active:bg-blue-800 active:scale-95"
              }`}
              title={isPlaying ? t('part0.stop') : t('part0.play')}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              <Volume2 size={48} />
            </button>
          </div>

          {/* 英文表示エリア */}
          <div className="min-h-[100px] flex items-center justify-center">
            {showText ? (
              <div className="space-y-4 text-center w-full">
                {/* 英文 */}
                <div className="bg-gray-700 border border-gray-600 p-4 rounded-lg relative">
                  <p className="text-xl font-semibold text-white pr-12">{currentSentence.text}</p>
                  <button
                    onClick={() => handleCopy(currentSentence.text)}
                    className={`absolute top-4 right-4 p-2 rounded-lg transition-all duration-200 ${
                      copied
                        ? "bg-green-600 text-white"
                        : "bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white"
                    }`}
                    title={copied ? t('part0.copied') : t('part0.copyText')}
                  >
                    <Copy size={16} />
                  </button>
                </div>

                {/* 翻訳（評価後のみ表示） */}
                {hasEvaluated && (
                  <div className="bg-blue-800 border border-blue-600 p-3 rounded-lg">
                    <p className="text-blue-100 text-lg">{currentSentence.textTranslation}</p>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowText(!showText)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <Eye size={20} />
                <span>{t('part0.showText')}</span>
              </button>
            )}
          </div>
        </div>

        {/* 自己評価ボタン */}
        {!hasEvaluated && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleEvaluation("success")}
              className="bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Check size={24} />
              {t('part0.success')}
            </button>
            <button
              onClick={() => handleEvaluation("failure")}
              className="bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <X size={24} />
              {t('part0.failure')}
            </button>
          </div>
        )}

        {/* 評価結果と次へボタン（評価後のみ表示） */}
        {hasEvaluated && (
          <div className="space-y-4">

            {/* 学習ポイント */}
            {currentSentence.pronunciation && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">{t('part0.learningPoint')}</h4>
                <p className="text-blue-800 text-sm">{currentSentence.pronunciation}</p>
              </div>
            )}

            {/* 次へボタン */}
            <button
              onClick={moveToNext}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {currentIndex >= sentences.length - 1 ? t('part0.newSet') : t('part0.nextQuestion')}
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* 音声要素 */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        className="hidden"
      />
    </div>
  );
}
