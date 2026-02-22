const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // コンソールログをキャプチャ
  page.on('console', msg => {
    console.log(`[Browser Console ${msg.type()}]:`, msg.text());
  });

  // エラーをキャプチャ
  page.on('pageerror', error => {
    console.log(`[Page Error]:`, error.message);
  });

  try {
    console.log('=== Part 0 動作テスト開始 ===\n');
    
    // 1. アプリケーションにアクセス
    console.log('1. http://localhost:3001 にアクセス...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('   ✓ ページ読み込み完了\n');

    // スプラッシュ画面が表示される場合は待機
    await page.waitForTimeout(3000);

    // 2. 設定ボタンを探してクリック
    console.log('2. 設定画面を開く...');
    const settingsButton = await page.locator('button:has-text("設定")').first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      console.log('   ✓ 設定ボタンをクリック\n');
      await page.waitForTimeout(1000);
    } else {
      console.log('   ! 設定ボタンが見つかりません\n');
    }

    // 3. Part選択のドロップダウンを確認
    console.log('3. Part選択ドロップダウンを確認...');
    const partSelect = await page.locator('select').first();
    if (await partSelect.isVisible()) {
      const currentValue = await partSelect.inputValue();
      console.log(`   現在の選択: ${currentValue}`);
      
      // オプションを取得
      const options = await partSelect.locator('option').allTextContents();
      console.log('   利用可能なオプション:');
      options.forEach(opt => console.log(`     - ${opt}`));
      
      // Part 0を選択
      console.log('\n4. Part 0を選択...');
      await partSelect.selectOption('part0');
      console.log('   ✓ Part 0を選択しました\n');
      await page.waitForTimeout(1000);
      
      // 設定を適用
      console.log('5. 設定を適用...');
      const applyButton = await page.locator('button:has-text("設定を適用")').first();
      if (await applyButton.isVisible()) {
        await applyButton.click();
        console.log('   ✓ 設定を適用しました\n');
      }
    } else {
      console.log('   ! Part選択ドロップダウンが見つかりません\n');
    }

    // 6. Part 0の画面が表示されるか確認
    console.log('6. Part 0の画面表示を確認...');
    await page.waitForTimeout(3000);
    
    // Part 0のコンポーネントが表示されているか確認
    const part0Title = await page.locator('h1:has-text("Part 0")').first();
    if (await part0Title.isVisible()) {
      console.log('   ✓ Part 0画面が表示されています');
      
      // Part 0の要素を確認
      const playButton = await page.locator('button:has(svg)').first();
      const maleButton = await page.locator('button:has-text("男性音声")').first();
      const femaleButton = await page.locator('button:has-text("女性音声")').first();
      
      console.log('   Part 0の要素:');
      console.log(`     - 再生ボタン: ${await playButton.isVisible() ? '表示' : '非表示'}`);
      console.log(`     - 男性音声ボタン: ${await maleButton.isVisible() ? '表示' : '非表示'}`);
      console.log(`     - 女性音声ボタン: ${await femaleButton.isVisible() ? '表示' : '非表示'}`);
    } else {
      console.log('   ! Part 0画面が表示されていません');
      
      // エラーメッセージを確認
      const errorMessage = await page.locator('text=/問題データ|エラー|失敗/').first();
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        console.log(`   エラーメッセージ: ${errorText}`);
      }
      
      // 読み込み中の表示を確認
      const loading = await page.locator('text=/読み込み中|Loading/').first();
      if (await loading.isVisible()) {
        console.log('   ! 読み込み中の表示で停止しています');
      }
    }

    // 7. ページの現在の状態をキャプチャ
    console.log('\n7. 現在のページ状態を確認...');
    const pageTitle = await page.title();
    console.log(`   ページタイトル: ${pageTitle}`);
    
    // 主要な見出しテキストを取得
    const headings = await page.locator('h1, h2').allTextContents();
    if (headings.length > 0) {
      console.log('   見出し:');
      headings.slice(0, 5).forEach(h => console.log(`     - ${h}`));
    }

    console.log('\n=== テスト完了 ===');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await browser.close();
  }
})();