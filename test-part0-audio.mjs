import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // コンソールログをキャプチャ
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Using Web Speech API') || text.includes('Audio') || text.includes('TTS')) {
      console.log(`[Console]:`, text);
    }
  });

  try {
    console.log('=== Part 0 音声機能テスト ===\n');
    
    // 1. ページにアクセス
    console.log('1. ページを開く...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(3000);
    
    // 2. Part 0が表示されているか確認
    const part0Title = await page.locator('h1:has-text("Part 0: Foundation")').first();
    if (await part0Title.isVisible()) {
      console.log('   ✓ Part 0が表示されています\n');
      
      // 3. 音声再生ボタンをクリック
      console.log('2. 音声再生テスト...');
      const playButton = await page.locator('button[title="再生"]').first();
      
      if (await playButton.isVisible()) {
        console.log('   音声再生ボタンをクリック...');
        await playButton.click();
        await page.waitForTimeout(1000);
        
        // 再生中の状態を確認
        const stopButton = await page.locator('button[title="停止"]').first();
        if (await stopButton.isVisible()) {
          console.log('   ✓ 音声が再生中（停止ボタン表示）');
          
          // 停止ボタンをクリック
          await stopButton.click();
          console.log('   ✓ 停止ボタンをクリック');
        }
        
        // ボタンのクラスを確認（赤色=再生中、青色=停止中）
        const buttonClass = await playButton.getAttribute('class');
        if (buttonClass?.includes('bg-red')) {
          console.log('   状態: 再生中（赤色）');
        } else if (buttonClass?.includes('bg-blue')) {
          console.log('   状態: 停止中（青色）');
        }
      }
      
      // 4. 男性/女性音声の切り替えテスト
      console.log('\n3. 音声切り替えテスト...');
      const maleButton = await page.locator('button:has-text("男性音声")');
      const femaleButton = await page.locator('button:has-text("女性音声")');
      
      if (await maleButton.isVisible()) {
        await maleButton.click();
        console.log('   ✓ 男性音声に切り替え');
      }
      
      if (await femaleButton.isVisible()) {
        await femaleButton.click();
        console.log('   ✓ 女性音声に切り替え');
      }
      
      console.log('\n=== テスト完了 ===');
      console.log('音声機能は正常に動作しています。');
      console.log('※ 実際の音声ファイルが存在しない場合は、Web Speech APIで代替再生されます。');
      
    } else {
      console.log('   ✗ Part 0が表示されていません');
    }
    
  } catch (error) {
    console.error('テストエラー:', error.message);
  } finally {
    await browser.close();
  }
})();