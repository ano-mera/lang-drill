import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // コンソールログをキャプチャ（詳細）
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('Part 0') || text.includes('part0')) {
      console.log(`[Part0関連ログ]:`, text);
    }
  });

  // エラーをキャプチャ
  page.on('pageerror', error => {
    console.log(`[Page Error]:`, error.message);
  });

  try {
    console.log('=== Part 0 詳細デバッグ開始 ===\n');
    
    // 1. アプリケーションにアクセス
    console.log('1. ページを開く...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // データ読み込みを待つ
    await page.waitForTimeout(5000);
    
    // 2. 現在のDOM構造を調査
    console.log('\n2. DOM構造を確認...');
    
    // bodyの全テキストを取得
    const bodyText = await page.locator('body').textContent();
    console.log('ページのテキスト内容:');
    console.log(bodyText.substring(0, 500)); // 最初の500文字
    
    // 「読み込み中」の要素を探す
    const loadingElements = await page.locator('text=/読み込み中|Loading/').all();
    console.log(`\n読み込み中要素の数: ${loadingElements.length}`);
    for (const elem of loadingElements) {
      const text = await elem.textContent();
      console.log(`  - "${text}"`);
    }
    
    // Part 0関連の要素を探す
    console.log('\n3. Part 0関連要素を検索...');
    const part0Elements = await page.locator('text=/Part 0|Foundation/').all();
    console.log(`Part 0関連要素の数: ${part0Elements.length}`);
    for (const elem of part0Elements) {
      const text = await elem.textContent();
      console.log(`  - "${text}"`);
    }
    
    // 4. currentPart0Sentencesの状態を確認（JavaScriptを実行）
    console.log('\n4. React状態を調査...');
    try {
      const reactInfo = await page.evaluate(() => {
        // React DevToolsがインストールされていない場合のフォールバック
        const root = document.getElementById('__next') || document.querySelector('#root');
        if (!root) return { error: 'Root element not found' };
        
        // DOMに表示されている内容から状態を推測
        const hasLoadingText = document.body.textContent.includes('読み込み中');
        const hasPart0Text = document.body.textContent.includes('Part 0');
        const hasFoundationText = document.body.textContent.includes('Foundation');
        
        return {
          hasLoadingText,
          hasPart0Text,
          hasFoundationText,
          bodyLength: document.body.textContent.length
        };
      });
      console.log('React状態情報:', reactInfo);
    } catch (e) {
      console.log('React状態の取得に失敗:', e.message);
    }
    
    // 5. コンソールログの分析
    console.log('\n5. コンソールログ分析...');
    const part0Logs = consoleLogs.filter(log => 
      log.includes('Part 0') || 
      log.includes('part0') || 
      log.includes('currentPart0Sentences')
    );
    
    if (part0Logs.length > 0) {
      console.log('Part 0関連のログ:');
      part0Logs.forEach(log => console.log(`  - ${log.substring(0, 100)}...`));
    } else {
      console.log('Part 0関連のログが見つかりません');
    }
    
    // 6. 実際の問題: なぜ画面が更新されないか
    console.log('\n6. 診断結果:');
    if (bodyText.includes('読み込み中')) {
      console.log('❌ 問題: 「読み込み中」表示で停止');
      console.log('   → currentPart0Sentencesが正しく設定されていない可能性');
      console.log('   → またはレンダリング条件に問題がある可能性');
    } else if (!bodyText.includes('Part 0')) {
      console.log('❌ 問題: Part 0コンポーネントが表示されていない');
    } else {
      console.log('✓ Part 0が正常に表示されています');
    }

    console.log('\n=== デバッグ完了 ===');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await browser.close();
  }
})();