import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('=== Part 0 Next Button Content Change Test ===\n');
    
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Part 0が表示されているか確認
    if (await page.locator('h1:has-text("Part 0")').isVisible()) {
      console.log('Part 0 is displayed\n');
      
      // 英文を表示
      await page.locator('button:has-text("英文を表示")').click();
      await page.waitForTimeout(500);
      
      // 最初の文章を取得
      const firstText = await page.locator('.text-xl.font-semibold.text-white.pr-12').textContent();
      console.log(`First sentence: "${firstText}"`);
      
      // 進捗を確認
      const progress1 = await page.locator('span.text-gray-400').textContent();
      console.log(`Progress before: ${progress1}`);
      
      // 評価ボタンを押す
      await page.locator('button:has-text("できた")').click();
      await page.waitForTimeout(500);
      
      // 右上のNextボタンをクリック（新セッション開始の想定）
      console.log('\nClicking top-right Next button...');
      const nextButtons = await page.locator('button:has-text("Next")').all();
      for (const button of nextButtons) {
        const box = await button.boundingBox();
        if (box && box.x > 600) {  // 右側のボタン
          await button.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
      
      // 新しい進捗を確認
      const progress2 = await page.locator('span.text-gray-400').textContent();
      console.log(`Progress after: ${progress2}`);
      
      // 新しい文章を確認（英文を表示）
      const showButton = await page.locator('button:has-text("英文を表示")');
      if (await showButton.isVisible()) {
        await showButton.click();
        await page.waitForTimeout(500);
        
        const newText = await page.locator('.text-xl.font-semibold.text-white.pr-12').textContent();
        console.log(`New sentence: "${newText}"`);
        
        if (firstText !== newText) {
          console.log('\n✅ SUCCESS: Different sentence displayed (shuffled/new session)');
        } else {
          console.log('\n⚠️ WARNING: Same sentence displayed');
        }
        
        if (progress2 === '1 / 30') {
          console.log('✅ Progress reset to 1/30 (new session started)');
        }
      } else {
        console.log('英文を表示ボタンが見つかりません');
      }
      
      // Part 0に留まっているか確認
      const stillPart0 = await page.locator('h1:has-text("Part 0")').isVisible();
      console.log(`\nStill in Part 0: ${stillPart0 ? '✅ Yes' : '❌ No'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();