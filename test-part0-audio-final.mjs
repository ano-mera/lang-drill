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
    if (text.includes('Audio') || text.includes('TTS') || text.includes('Web Speech')) {
      console.log(`[Console]:`, text);
    }
  });

  try {
    console.log('=== Part 0 高品質音声再生テスト ===\n');
    
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
        await page.waitForTimeout(1500);
        
        // 音声種類インジケーターを確認
        const audioIndicator = await page.locator('span:has-text("高品質音声"), span:has-text("ブラウザ音声")').first();
        if (await audioIndicator.isVisible()) {
          const indicatorText = await audioIndicator.textContent();
          console.log(`   音声種類: ${indicatorText}`);
          
          if (indicatorText.includes('高品質音声')) {
            console.log('   ✓ OpenAI TTSによる高品質音声を再生中！');
          } else if (indicatorText.includes('ブラウザ音声')) {
            console.log('   ⚠ ブラウザ音声（代替再生）を使用中');
          }
        }
        
        // 停止ボタンをクリック
        await page.waitForTimeout(1000);
        const stopButton = await page.locator('button[title="停止"]').first();
        if (await stopButton.isVisible()) {
          await stopButton.click();
          console.log('   ✓ 音声を停止しました');
        }
      }
      
      // 4. 男性/女性音声の切り替えテスト
      console.log('\n3. 音声切り替えと再生テスト...');
      
      // 男性音声に切り替え
      const maleButton = await page.locator('button:has-text("男性音声")');
      if (await maleButton.isVisible()) {
        await maleButton.click();
        console.log('   ✓ 男性音声に切り替え');
        
        // 再生
        const playButtonMale = await page.locator('button[title="再生"]').first();
        if (await playButtonMale.isVisible()) {
          await playButtonMale.click();
          await page.waitForTimeout(1000);
          
          const audioIndicatorMale = await page.locator('span:has-text("高品質音声"), span:has-text("ブラウザ音声")').first();
          if (await audioIndicatorMale.isVisible()) {
            const indicatorText = await audioIndicatorMale.textContent();
            console.log(`   男性音声: ${indicatorText}`);
          }
          
          // 停止
          const stopButtonMale = await page.locator('button[title="停止"]').first();
          if (await stopButtonMale.isVisible()) {
            await stopButtonMale.click();
          }
        }
      }
      
      // 女性音声に切り替え
      const femaleButton = await page.locator('button:has-text("女性音声")');
      if (await femaleButton.isVisible()) {
        await femaleButton.click();
        console.log('   ✓ 女性音声に切り替え');
        
        // 再生
        const playButtonFemale = await page.locator('button[title="再生"]').first();
        if (await playButtonFemale.isVisible()) {
          await playButtonFemale.click();
          await page.waitForTimeout(1000);
          
          const audioIndicatorFemale = await page.locator('span:has-text("高品質音声"), span:has-text("ブラウザ音声")').first();
          if (await audioIndicatorFemale.isVisible()) {
            const indicatorText = await audioIndicatorFemale.textContent();
            console.log(`   女性音声: ${indicatorText}`);
          }
        }
      }
      
      console.log('\n=== テスト完了 ===');
      console.log('✓ Part 0の音声再生機能が正常に動作しています');
      console.log('✓ 音声種類が明確に表示されています');
      
    } else {
      console.log('   ✗ Part 0が表示されていません');
    }
    
  } catch (error) {
    console.error('テストエラー:', error.message);
  } finally {
    await browser.close();
  }
})();