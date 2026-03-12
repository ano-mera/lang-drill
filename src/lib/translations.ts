export type Language = 'ja' | 'en';

type TranslationEntry = {
  ja: string;
  en: string;
};

const translations: Record<string, TranslationEntry> = {
  // ===== Header / Navigation =====
  'header.stats': { ja: '統計', en: 'Stats' },
  'header.settings': { ja: '設定', en: 'Settings' },
  'header.consecutiveAchieved': { ja: '{count}連続正解達成!', en: '{count} Correct in a Row!' },
  'header.timer': { ja: '{seconds}秒', en: '{seconds}s' },

  // ===== Settings Modal =====
  'settings.title': { ja: '設定', en: 'Settings' },
  'settings.close': { ja: '閉じる', en: 'Close' },
  'settings.toeicPart': { ja: 'TOEIC Part', en: 'TOEIC Part' },
  'settings.difficulty': { ja: '難易度', en: 'Difficulty' },
  'settings.difficultyAll': { ja: 'すべて', en: 'All' },
  'settings.difficultyEasy': { ja: 'Easy（初級）', en: 'Easy' },
  'settings.difficultyMedium': { ja: 'Medium（中級）', en: 'Medium' },
  'settings.difficultyHard': { ja: 'Hard（上級）', en: 'Hard' },
  'settings.audioVolume': { ja: '音声ボリューム: {volume}%', en: 'Audio Volume: {volume}%' },
  'settings.questionId': { ja: '問題IDを入力', en: 'Enter Question ID' },
  'settings.questionIdPlaceholder': { ja: '例: passage1, part2-001...', en: 'e.g. passage1, part2-001...' },
  'settings.answerTime': { ja: '解答時間（秒）', en: 'Answer Time (sec)' },
  'settings.answerTimePlaceholder': { ja: '空欄で無制限', en: 'Leave empty for unlimited' },
  'settings.answerTimeHint': { ja: '空欄または0で無制限', en: 'Empty or 0 for unlimited' },
  'settings.targetConsecutive': { ja: '目標連続正答数', en: 'Target Consecutive Correct' },
  'settings.targetConsecutiveHint': { ja: '1〜100', en: '1-100' },
  'settings.nextButtonBehavior': { ja: '次問題ボタンの動作', en: 'Next Button Behavior' },
  'settings.nextButtonRandom': { ja: 'ランダム選択', en: 'Random' },
  'settings.nextButtonSequential': { ja: '順次選択', en: 'Sequential' },
  'settings.nextButtonRandomDesc': { ja: '次問題ボタンでランダムに問題を選択します', en: 'Questions are selected randomly' },
  'settings.nextButtonSequentialDesc': { ja: '次問題ボタンで問題を順番に選択します', en: 'Questions are selected in order' },
  'settings.cancel': { ja: 'キャンセル', en: 'Cancel' },
  'settings.language': { ja: '言語 / Language', en: 'Language' },

  // Part names in settings
  'part.0': { ja: 'Part 0 | Foundation (リスニング基礎)', en: 'Part 0 | Foundation (Listening Basics)' },
  'part.1': { ja: 'Part 1 | 写真描写問題', en: 'Part 1 | Photo Description' },
  'part.2': { ja: 'Part 2 | 応答問題', en: 'Part 2 | Question-Response' },
  'part.3': { ja: 'Part 3 | 会話問題', en: 'Part 3 | Conversations' },
  'part.4': { ja: 'Part 4 | 説明文問題', en: 'Part 4 | Talks' },
  'part.5': { ja: 'Part 5 | 短文穴埋め問題', en: 'Part 5 | Incomplete Sentences' },
  'part.6': { ja: 'Part 6 | 長文穴埋め問題', en: 'Part 6 | Text Completion' },
  'part.7st': { ja: 'Part 7 | Single Passage Text Only', en: 'Part 7 | Single Passage Text Only' },
  'part.7sc': { ja: 'Part 7 | Single Passage With Chart', en: 'Part 7 | Single Passage With Chart' },
  'part.7d': { ja: 'Part 7 | Double Passage', en: 'Part 7 | Double Passage' },

  // ===== Stats Popup =====
  'stats.title': { ja: '📊 統計情報', en: '📊 Statistics' },
  'stats.close': { ja: '閉じる', en: 'Close' },
  'stats.currentSettings': { ja: '⚙️ 現在の設定', en: '⚙️ Current Settings' },
  'stats.answerTime': { ja: '解答時間: {value}', en: 'Answer Time: {value}' },
  'stats.answerTimeUnlimited': { ja: '無制限', en: 'Unlimited' },
  'stats.answerTimeSeconds': { ja: '{seconds}秒', en: '{seconds}s' },
  'stats.targetConsecutive': { ja: '目標連続正答数: {count}問', en: 'Target Streak: {count}' },
  'stats.recentAccuracy': { ja: '📈 直近100問の正答率', en: '📈 Last 100 Accuracy' },
  'stats.bestAccuracy': { ja: '🏆 100問正答率の最高記録', en: '🏆 Best 100-Question Accuracy' },
  'stats.bestAccuracyPending': { ja: '（100問以上回答後に表示）', en: '(Available after 100+ answers)' },
  'stats.bestConsecutive': { ja: '🏆 最高連続正答数', en: '🏆 Best Streak' },
  'stats.currentConsecutive': { ja: '🎯 現在の連続正答数', en: '🎯 Current Streak' },
  'stats.averageAccuracy': { ja: '💯 平均正答率', en: '💯 Average Accuracy' },
  'stats.totalQuestions': { ja: '🎮 総問題数', en: '🎮 Total Questions' },
  'stats.totalCorrect': { ja: '✅ 正答数', en: '✅ Total Correct' },
  'stats.questionUnit': { ja: '問', en: '' },

  // ===== Part 0 =====
  'part0.title': { ja: 'Part 0: Foundation', en: 'Part 0: Foundation' },
  'part0.maleVoice': { ja: '男性音声', en: 'Male' },
  'part0.femaleVoice': { ja: '女性音声', en: 'Female' },
  'part0.highQuality': { ja: '🎵 高品質音声（OpenAI TTS）', en: '🎵 High Quality (OpenAI TTS)' },
  'part0.browserVoice': { ja: '🔊 ブラウザ音声（代替再生）', en: '🔊 Browser Voice (Fallback)' },
  'part0.showText': { ja: '英文を表示', en: 'Show Text' },
  'part0.success': { ja: 'できた', en: 'Got it' },
  'part0.failure': { ja: 'できなかった', en: 'Missed' },
  'part0.learningPoint': { ja: '📚 学習ポイント', en: '📚 Learning Point' },
  'part0.nextQuestion': { ja: '次の問題へ', en: 'Next Question' },
  'part0.newSet': { ja: '新しいセットへ', en: 'New Set' },
  'part0.complete': { ja: '練習完了！', en: 'Practice Complete!' },
  'part0.resultSummary': { ja: '{total}問中 {correct}問 成功', en: '{correct} / {total} Correct' },
  'part0.newSetButton': { ja: '新しいセットで練習する', en: 'Practice New Set' },
  'part0.stop': { ja: '停止', en: 'Stop' },
  'part0.play': { ja: '再生', en: 'Play' },
  'part0.copied': { ja: 'コピー済み!', en: 'Copied!' },
  'part0.copyText': { ja: '英文をコピー', en: 'Copy text' },
  'part0.audioQualitySwitch': { ja: 'クリックして音質を切り替え', en: 'Click to switch audio quality' },
  'part0.ttsError': {
    ja: '音声再生エラー:\n\nブラウザのTTSが失敗しました。\n音声ファイルを生成するには:\ncd generator/scripts/generate\nnode generate-part0-sentences.js',
    en: 'Audio playback error:\n\nBrowser TTS failed.\nTo generate audio files:\ncd generator/scripts/generate\nnode generate-part0-sentences.js'
  },
  'part0.ttsNotSupported': {
    ja: '音声再生エラー:\n\nお使いのブラウザは音声再生に対応していません。\n別のブラウザをお試しください。',
    en: 'Audio playback error:\n\nYour browser does not support audio playback.\nPlease try a different browser.'
  },

  // ===== Result Display =====
  'result.correct': { ja: '正解', en: 'Correct' },
  'result.incorrect': { ja: '不正解', en: 'Incorrect' },
  'result.score': { ja: '{total}問中 {correct}問正解', en: '{correct} / {total} Correct' },
  'result.answerCorrect': { ja: '✓ 正解です！', en: '✓ Correct!' },
  'result.answerIncorrect': { ja: '✗ 不正解です。正解は {answer} です。', en: '✗ Incorrect. The answer is {answer}.' },
  'result.seconds': { ja: '秒', en: 's' },
  'result.words': { ja: '語', en: 'words' },

  // ===== Loading =====
  'loading.text': { ja: '読み込み中...', en: 'Loading...' },
  'loading.dataStatus': { ja: 'データ状況: {status}', en: 'Data: {status}' },
  'loading.loaded': { ja: '{count}問題読み込み済み', en: '{count} questions loaded' },
  'loading.fetching': { ja: 'データ取得中', en: 'Fetching data' },
  'loading.settings': { ja: '設定: {part} / {difficulty}', en: 'Settings: {part} / {difficulty}' },

  // ===== Error =====
  'error.noQuestions': { ja: '条件に合う問題が見つかりません', en: 'No matching questions found' },
  'error.tryAnother': { ja: '設定を変更するか、別の問題を試す', en: 'Change settings or try another question' },
  'error.loadFailed': { ja: '問題データの読み込みに失敗しました。', en: 'Failed to load question data.' },
  'error.showRandom': { ja: 'ランダムな問題を表示', en: 'Show Random Question' },

  // ===== Part labels (result screens) =====
  'partLabel.1': { ja: 'Part 1 | 写真描写問題', en: 'Part 1 | Photo Description' },
  'partLabel.2': { ja: 'Part 2', en: 'Part 2' },
  'partLabel.5': { ja: 'Part 5', en: 'Part 5' },
  'partLabel.6': { ja: 'Part 6 | 長文穴埋め問題', en: 'Part 6 | Text Completion' },

  // ===== Misc =====
  'misc.speakerInfo': { ja: '話者情報', en: 'Speaker Info' },
  'misc.speakerUnknown': { ja: '話者情報不明', en: 'Unknown Speaker' },
  'misc.voiceIdUnknown': { ja: '不明', en: 'Unknown' },
  'misc.questionText': { ja: '問題文', en: 'Question' },
  'misc.copyQuestion': { ja: '問題文をコピー', en: 'Copy question' },
  'misc.listenOptions': { ja: '選択肢を聞く', en: 'Listen to Options' },
  'misc.stopAudio': { ja: '停止', en: 'Stop' },
  'misc.category': { ja: 'カテゴリ', en: 'Category' },
  'misc.intent': { ja: '意図', en: 'Intent' },
  'misc.vocab': { ja: '語彙', en: 'Vocab' },
  'misc.length': { ja: '長さ', en: 'Length' },
  'misc.imagePrompt': { ja: '画像生成プロンプト：', en: 'Image Generation Prompt:' },
  'misc.clickToCopyId': { ja: 'クリックして{type} IDをコピー', en: 'Click to copy {type} ID' },
  'misc.clickToCopyWord': { ja: 'クリックして単語をコピー', en: 'Click to copy word' },
  'misc.clickToHighlight': { ja: 'クリックしてハイライト', en: 'Click to highlight' },
  'misc.clickToUnhighlight': { ja: 'クリックしてハイライト解除', en: 'Click to remove highlight' },
  'misc.copiedToClipboard': { ja: '{type}をクリップボードにコピーしました', en: '{type} copied to clipboard' },
  'misc.copyFailed': { ja: 'コピーに失敗しました', en: 'Copy failed' },
  'misc.copyFailedBrowser': { ja: 'コピーに失敗しました（ブラウザの設定を確認してください）', en: 'Copy failed (check browser settings)' },
  'misc.translationMissing': { ja: '翻訳がありません', en: 'No translation available' },
  'misc.admin': { ja: '管理者', en: 'Admin' },

  // ===== Audio Controls =====
  'audio.pause': { ja: '一時停止', en: 'Pause' },
  'audio.stop': { ja: '停止', en: 'Stop' },
  'audio.back5': { ja: '5秒戻る', en: 'Back 5s' },
  'audio.forward5': { ja: '5秒進む', en: 'Forward 5s' },
  'audio.copyConversation': { ja: '会話をコピー', en: 'Copy conversation' },
  'audio.copySpeech': { ja: 'スピーチをコピー', en: 'Copy speech' },
  'audio.copyDocument': { ja: '文書をコピー', en: 'Copy document' },
  'audio.copyQuestionDetails': { ja: '問題詳細をコピー', en: 'Copy question details' },
  'audio.settingsSaveFailed': { ja: '設定の保存に失敗しました', en: 'Failed to save settings' },

  // ===== Auth =====
  'auth.login': { ja: 'ログイン', en: 'Log In' },
  'auth.signup': { ja: '新規登録', en: 'Sign Up' },
  'auth.logout': { ja: 'ログアウト', en: 'Log Out' },
  'auth.email': { ja: 'メールアドレス', en: 'Email' },
  'auth.password': { ja: 'パスワード', en: 'Password' },
  'auth.signupSuccess': { ja: '登録メールを送信しました！', en: 'Confirmation email sent!' },
  'auth.checkEmail': { ja: 'メールを確認して登録を完了してください。', en: 'Check your email to complete registration.' },
  'auth.switchToSignup': { ja: 'アカウントを作成', en: 'Create an account' },
  'auth.switchToLogin': { ja: 'ログインに戻る', en: 'Back to login' },

  // ===== Subscription =====
  'subscription.title': { ja: 'サブスクリプション', en: 'Subscription' },
  'subscription.free': { ja: '無料プラン', en: 'Free Plan' },
  'subscription.pro': { ja: 'Pro プラン', en: 'Pro Plan' },
  'subscription.upgrade': { ja: 'Pro にアップグレード', en: 'Upgrade to Pro' },
  'subscription.manage': { ja: 'サブスクリプション管理', en: 'Manage Subscription' },
  'subscription.cancelingAt': { ja: '{date} に終了予定', en: 'Ends on {date}' },
  'subscription.freeDescription': { ja: '1日50問まで', en: '50 questions per day' },
  'subscription.proDescription': { ja: '問題数無制限', en: 'Unlimited questions' },

  // ===== Paywall =====
  'paywall.title': { ja: '本日の無料問題を使い切りました', en: "Today's free questions used up" },
  'paywall.description': { ja: 'Pro にアップグレードすると無制限で問題を解けます。', en: 'Upgrade to Pro for unlimited questions.' },
  'paywall.loginToUpgrade': { ja: 'ログインしてアップグレード', en: 'Log in to upgrade' },
  'paywall.loginHint': { ja: 'アカウント登録で無料枠もサーバー管理されます。', en: 'Sign up to track your free quota server-side.' },
  'paywall.close': { ja: '閉じる', en: 'Close' },

  // ===== Usage =====
  'usage.remaining': { ja: '残り{count}問', en: '{count} left' },
  'usage.unlimited': { ja: '無制限', en: 'Unlimited' },

};

export function translate(key: string, lang: Language, params?: Record<string, string | number>): string {
  const entry = translations[key];
  if (!entry) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }

  let text = entry[lang];

  if (params) {
    for (const [param, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
    }
  }

  return text;
}

export default translations;
