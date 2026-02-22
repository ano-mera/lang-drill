#!/usr/bin/env node

// ブラウザのコンソールで実行するデバッグコード

const debugPart3Timing = () => {
  console.log('=== Part3 音声再生デバッグ開始 ===');
  
  // 元のsetTimeout関数を保存
  const originalSetTimeout = window.setTimeout;
  
  // setTimeoutをフック
  window.setTimeout = function(callback, delay, ...args) {
    if (delay >= 100) { // 100ms以上の遅延をログ
      console.log(`⏰ setTimeout called: ${delay}ms`, {
        stack: new Error().stack?.split('\n')[2]?.trim(),
        delay: delay
      });
    }
    return originalSetTimeout.call(this, callback, delay, ...args);
  };
  
  // 元のPromise.constructorを保存  
  const originalPromise = window.Promise;
  
  console.log('setTimeout フックを設定しました。Part3音声を再生してください。');
  console.log('元に戻すには: resetPart3Debug() を実行');
  
  // リセット関数をグローバルに設定
  window.resetPart3Debug = () => {
    window.setTimeout = originalSetTimeout;
    console.log('setTimeout フックを解除しました');
  };
};

console.log('ブラウザのコンソールで以下を実行してください:');
console.log('debugPart3Timing()');

export { debugPart3Timing };