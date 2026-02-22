import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true  // 開発者ツールを開く
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // コンソールログをキャプチャ
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('selectRandomPassage') || 
        text.includes('Part 0') || 
        text.includes('onNext') ||
        text.includes('shuffled')) {
      consoleLogs.push(text);
      console.log(`[CONSOLE] ${text}`);
    }
  });

  try {
    console.log('=== Part 0 Console Log Test ===\n');
    
    // ページを開く
    console.log('Opening http://localhost:3001...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);
    
    // Part 0が表示されているか確認
    const part0Title = await page.locator('h1:has-text("Part 0: Foundation")').first();
    if (await part0Title.isVisible()) {
      console.log('Part 0 is displayed\n');
      
      // 評価ボタンをクリック
      const evalButton = await page.locator('button:has-text("できた")').first();
      if (await evalButton.isVisible()) {
        console.log('Clicking evaluation button...');
        await evalButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Nextボタンを探してクリック
      console.log('Looking for Next button...');
      const nextButtons = await page.locator('button:has-text("Next")').all();
      
      for (const button of nextButtons) {
        const box = await button.boundingBox();
        if (box && box.x > 600) {  // 右側のボタン
          console.log('Clicking right-side Next button...\n');
          await button.click();
          await page.waitForTimeout(3000);
          break;
        }
      }
      
      // コンソールログを表示
      console.log('\n=== Captured Console Logs ===');
      consoleLogs.forEach(log => console.log(log));
      
      // 現在の状態を確認
      console.log('\n=== Current State ===');
      const stillPart0 = await page.locator('h1:has-text("Part 0")').first();
      if (await stillPart0.isVisible()) {
        console.log('Still in Part 0');
        
        const progress = await page.locator('span.text-gray-400').first();
        if (await progress.isVisible()) {
          const progressText = await progress.textContent();
          console.log(`Progress: ${progressText}`);
        }
      }
    }
    
    console.log('\nKeeping browser open for 20 seconds for inspection...');
    await page.waitForTimeout(20000);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();