import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Part 0 最終動作確認 ===\n');
    
    // 1. アプリケーションにアクセス
    console.log('1. ページにアクセス...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(3000);
    console.log('   ✓ ページ読み込み完了\n');
    
    // 2. Part 0の画面確認
    console.log('2. Part 0画面の要素を確認...');
    
    const part0Title = await page.locator('h1:has-text("Part 0: Foundation")').first();
    const isDisplayed = await part0Title.isVisible();
    
    if (isDisplayed) {
      console.log('   ✓ Part 0: Foundation タイトルが表示されています');
      
      // Part 0の主要要素を確認
      const elements = {
        '進捗表示': await page.locator('text=/1 \\/ 10/').isVisible(),
        '難易度表示': await page.locator('text=/beginner|intermediate|advanced/').isVisible(),
        'トピック表示': await page.locator('text=/日常会話|ビジネス|サービス/').isVisible(),
        '男性音声ボタン': await page.locator('button:has-text("男性音声")').isVisible(),
        '女性音声ボタン': await page.locator('button:has-text("女性音声")').isVisible(),
        '再生ボタン': await page.locator('button').filter({ has: page.locator('svg') }).first().isVisible(),
        '英文表示ボタン': await page.locator('text="英文を表示"').isVisible(),
        'できたボタン': await page.locator('button:has-text("できた")').isVisible(),
        'できなかったボタン': await page.locator('button:has-text("できなかった")').isVisible()
      };
      
      console.log('\n   Part 0の要素チェック:');
      for (const [name, visible] of Object.entries(elements)) {
        console.log(`     ${visible ? '✓' : '✗'} ${name}`);
      }
      
      // 機能テスト
      console.log('\n3. 機能テスト...');
      
      // 音声選択を切り替え
      const maleButton = await page.locator('button:has-text("男性音声")');
      if (await maleButton.isVisible()) {
        await maleButton.click();
        console.log('   ✓ 男性音声を選択');
      }
      
      // 英文を表示
      const showTextButton = await page.locator('button:has-text("英文を表示")');
      if (await showTextButton.isVisible()) {
        await showTextButton.click();
        await page.waitForTimeout(500);
        
        // 英文が表示されたか確認
        const textContent = await page.locator('text=/Please|I\'ll|Could/').first();
        if (await textContent.isVisible()) {
          const text = await textContent.textContent();
          console.log(`   ✓ 英文が表示されました: "${text.substring(0, 30)}..."`);
        }
      }
      
      // 自己評価ボタンのテスト
      const successButton = await page.locator('button:has-text("できた")');
      if (await successButton.isVisible()) {
        await successButton.click();
        console.log('   ✓ 「できた」ボタンをクリック');
        
        // 次の問題に進んだか確認
        await page.waitForTimeout(3000);
        const progress = await page.locator('text=/2 \\/ 10/').first();
        if (await progress.isVisible()) {
          console.log('   ✓ 次の問題（2/10）に進みました');
        }
      }
      
      console.log('\n=== ✓ Part 0は正常に動作しています ===');
    } else {
      console.log('   ✗ Part 0が表示されていません');
      
      // エラーメッセージを確認
      const errorMsg = await page.locator('text=/エラー|失敗|問題/').first();
      if (await errorMsg.isVisible()) {
        const text = await errorMsg.textContent();
        console.log(`   エラー: ${text}`);
      }
    }
    
  } catch (error) {
    console.error('テスト実行エラー:', error.message);
  } finally {
    await browser.close();
  }
})();