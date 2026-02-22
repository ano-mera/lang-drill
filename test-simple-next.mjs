import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Opening localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Part 0が既に表示されているか確認
    const isPart0 = await page.locator('h1:has-text("Part 0")').isVisible();
    console.log(`Part 0 visible: ${isPart0}`);
    
    if (isPart0) {
      // 進捗を取得
      const progress1 = await page.locator('span.text-gray-400').textContent();
      console.log(`Before Next: ${progress1}`);
      
      // 評価ボタンを押す
      await page.locator('button:has-text("できた")').click();
      await page.waitForTimeout(500);
      
      // Part0Component内の「次の問題へ」ボタンを探す
      const nextInPart0 = await page.locator('button:has-text("次の問題へ")').isVisible();
      if (nextInPart0) {
        console.log('Found "次の問題へ" button in Part0Component');
        await page.locator('button:has-text("次の問題へ")').click();
        await page.waitForTimeout(1000);
        
        const progress2 = await page.locator('span.text-gray-400').textContent();
        console.log(`After "次の問題へ": ${progress2}`);
      }
      
      // 右上のNextボタンも試す
      const rightNextButtons = await page.locator('button:has-text("Next")').all();
      console.log(`Found ${rightNextButtons.length} Next buttons`);
      
      if (rightNextButtons.length > 0) {
        // 最初のNextボタンをクリック
        await rightNextButtons[0].click();
        await page.waitForTimeout(1000);
        
        const progress3 = await page.locator('span.text-gray-400').textContent();
        console.log(`After right Next button: ${progress3}`);
        
        const stillPart0 = await page.locator('h1:has-text("Part 0")').isVisible();
        console.log(`Still in Part 0: ${stillPart0}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();