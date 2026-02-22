import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,  // 画面を表示して確認
    slowMo: 500      // 動作を遅くして見やすく
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Part 0 Nextボタンテスト ===\n');
    
    // 1. localhost:3001を開く
    console.log('1. localhost:3001を開く...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 2. Part 0ボタンを探してクリック
    console.log('2. Part 0ボタンを探す...');
    await page.waitForTimeout(2000);
    
    // Part 0ボタンを探す - さまざまなセレクタを試す
    let part0Button = null;
    const selectors = [
      'button:has-text("Part 0")',
      'button:has-text("Part 0:")',
      'button:has-text("Foundation")',
      '[data-testid="part0-button"]',
      'button.bg-gray-800:has-text("Part 0")'
    ];
    
    for (const selector of selectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          part0Button = element;
          console.log(`   ✅ Part 0ボタンを見つけました: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`   セレクタ ${selector} では見つかりません`);
      }
    }
    
    if (!part0Button) {
      // パート選択ボタンをすべて表示
      const allButtons = await page.locator('button').all();
      console.log(`\n見つかったボタン: ${allButtons.length}個`);
      for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
        const text = await allButtons[i].textContent();
        if (text) {
          console.log(`   ボタン${i+1}: "${text.trim()}"`);
        }
      }
      throw new Error('Part 0ボタンが見つかりません');
    }
    
    // Part 0をクリック
    await part0Button.click();
    console.log('   Part 0をクリックしました\n');
    await page.waitForTimeout(2000);
    
    // 3. Part 0画面が表示されているか確認
    console.log('3. Part 0画面を確認...');
    const part0Title = await page.locator('h1:has-text("Part 0")').first();
    if (await part0Title.isVisible()) {
      const titleText = await part0Title.textContent();
      console.log(`   ✅ Part 0画面が表示されています: "${titleText}"\n`);
    } else {
      console.log('   ❌ Part 0画面が表示されていません\n');
    }
    
    // 4. 画面右上のNextボタンを探す
    console.log('4. 画面右上のNextボタンを探す...');
    const nextButtons = await page.locator('button:has-text("Next")').all();
    console.log(`   Nextボタンが${nextButtons.length}個見つかりました`);
    
    if (nextButtons.length === 0) {
      console.log('\n   ❌ Nextボタンが見つかりません');
      
      // デバッグ: 現在の画面の状態を出力
      const pageContent = await page.content();
      if (pageContent.includes('showResults')) {
        console.log('   注: showResults状態になっている可能性があります');
      }
      
      // Part0Component内のボタンも探す
      const part0Buttons = await page.locator('button').all();
      console.log(`\n   Part 0画面のボタン一覧:`);
      for (const button of part0Buttons) {
        const text = await button.textContent();
        if (text && text.trim()) {
          console.log(`     - "${text.trim()}"`);
        }
      }
    } else {
      // Nextボタンをクリック
      console.log('\n5. Nextボタンをクリック...');
      const nextButton = nextButtons[0];
      
      // クリック前の状態を記録
      const beforeProgress = await page.locator('span.text-gray-400').first();
      let beforeProgressText = '';
      if (await beforeProgress.isVisible()) {
        beforeProgressText = await beforeProgress.textContent();
        console.log(`   クリック前の進捗: ${beforeProgressText}`);
      }
      
      await nextButton.click();
      console.log('   Nextボタンをクリックしました');
      await page.waitForTimeout(2000);
      
      // クリック後の状態を確認
      console.log('\n6. クリック後の状態確認...');
      
      // Part 0のままか確認
      const stillPart0 = await page.locator('h1:has-text("Part 0")').first();
      if (await stillPart0.isVisible()) {
        console.log('   ✅ Part 0に留まっています');
        
        // 進捗が変わったか確認
        const afterProgress = await page.locator('span.text-gray-400').first();
        if (await afterProgress.isVisible()) {
          const afterProgressText = await afterProgress.textContent();
          console.log(`   クリック後の進捗: ${afterProgressText}`);
          
          if (beforeProgressText !== afterProgressText) {
            console.log('   ✅ 進捗が変更されました（新セッション）');
          } else {
            console.log('   ⚠️ 進捗が変わっていません');
          }
        }
      } else {
        // 他のパートに移動したか確認
        const otherParts = ['Part 1', 'Part 2', 'Part 3', 'Part 4', 'Part 5', 'Part 6', 'Part 7'];
        for (const part of otherParts) {
          const partTitle = await page.locator(`h1:has-text("${part}")`).first();
          if (await partTitle.isVisible()) {
            console.log(`   ❌ ${part}に移動してしまいました`);
            break;
          }
        }
      }
    }
    
    console.log('\n=== テスト完了 ===');
    console.log('ブラウザは10秒後に閉じます...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    console.log('ブラウザは10秒後に閉じます...');
    await page.waitForTimeout(10000);
  } finally {
    await browser.close();
  }
})();