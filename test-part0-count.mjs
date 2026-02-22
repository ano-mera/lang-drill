import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Part 0 問題数表示テスト ===\n');
    
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(3000);
    
    // Part 0が表示されているか確認
    const part0Title = await page.locator('h1:has-text("Part 0: Foundation")').first();
    if (await part0Title.isVisible()) {
      console.log('✓ Part 0が表示されています');
      
      // 進捗表示を確認
      const progressText = await page.locator('span.text-gray-400').first();
      if (await progressText.isVisible()) {
        const progressContent = await progressText.textContent();
        console.log(`現在の表示: "${progressContent}"`);
        
        // 期待値と比較
        if (progressContent.includes('/ 23')) {
          console.log('✓ 正しく23問と表示されています');
        } else if (progressContent.includes('/ 10')) {
          console.log('⚠ まだ10問と表示されています（キャッシュの可能性）');
        } else {
          console.log(`⚠ 予期しない表示: ${progressContent}`);
        }
      } else {
        console.log('✗ 進捗表示が見つかりません');
      }
      
      // APIレスポンスをチェック
      const apiResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/part0-sentences');
          const data = await response.json();
          return {
            count: data.sentences?.length || 0,
            success: true
          };
        } catch (error) {
          return {
            error: error.message,
            success: false
          };
        }
      });
      
      if (apiResponse.success) {
        console.log(`API レスポンス: ${apiResponse.count}個の文章`);
      } else {
        console.log(`API エラー: ${apiResponse.error}`);
      }
      
    } else {
      console.log('✗ Part 0が表示されていません');
    }
    
  } catch (error) {
    console.error('テストエラー:', error.message);
  } finally {
    await browser.close();
  }
})();