import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Part 0 同一パート内Nextテスト ===\n');
    
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(3000);
    
    const part0Title = await page.locator('h1:has-text("Part 0: Foundation")').first();
    if (await part0Title.isVisible()) {
      console.log('1. Part 0が表示されています\n');
      
      // 最初の問題の英文を取得
      await page.locator('button:has-text("英文を表示")').click();
      await page.waitForTimeout(1000);
      const firstSentence = await page.locator('.text-xl.font-semibold.text-white.pr-12').first();
      const firstText = await firstSentence.textContent();
      console.log(`最初の問題: "${firstText}"`);
      
      // Nextボタンをクリック
      console.log('2. Nextボタンをクリック...');
      const nextButton = await page.locator('button:has-text("Next")').first();
      await nextButton.click();
      await page.waitForTimeout(3000);
      
      // まだPart 0かどうか確認
      const stillPart0 = await page.locator('h1:has-text("Part 0: Foundation")').first();
      if (await stillPart0.isVisible()) {
        console.log('   ✅ Part 0内で新しいセッション開始');
        
        // 進捗が1/30にリセットされているか確認
        const progress = await page.locator('span.text-gray-400').first();
        const progressText = await progress.textContent();
        console.log(`   進捗表示: "${progressText}"`);
        
        if (progressText.includes('1 / 30')) {
          console.log('   ✅ 進捗が1/30にリセットされました');
        }
        
        // 新しい問題の英文を取得
        await page.locator('button:has-text("英文を表示")').click();
        await page.waitForTimeout(1000);
        const newSentence = await page.locator('.text-xl.font-semibold.text-white.pr-12').first();
        const newText = await newSentence.textContent();
        console.log(`   新しい問題: "${newText}"`);
        
        if (firstText !== newText) {
          console.log('   ✅ 異なる問題に変更されました（新セッション開始）');
        } else {
          console.log('   ⚠ 同じ問題が表示されています（ランダム選択で同じ問題の可能性）');
        }
        
      } else {
        console.log('   ❌ Part 0から他のパートに移動してしまいました');
      }
      
    } else {
      console.log('   ❌ Part 0が表示されていません');
    }
    
    console.log('\n=== テスト完了 ===');
    
  } catch (error) {
    console.error('テストエラー:', error.message);
  } finally {
    await browser.close();
  }
})();