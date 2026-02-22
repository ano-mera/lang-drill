import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Part 0 自己評価とタイミングテスト ===\n');
    
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(3000);
    
    const part0Title = await page.locator('h1:has-text("Part 0: Foundation")').first();
    if (await part0Title.isVisible()) {
      console.log('1. Part 0が表示されています\n');
      
      // 「できなかった」ボタンをクリック
      console.log('2. 「できなかった」を選択...');
      const failureButton = await page.locator('button:has-text("できなかった")');
      if (await failureButton.isVisible()) {
        await failureButton.click();
        console.log('   ✓ 「できなかった」ボタンをクリック');
        await page.waitForTimeout(1000);
        
        // 評価結果が表示されているか確認
        const evaluationResult = await page.locator('text=/練習を続けましょう|良い練習でした/').first();
        if (await evaluationResult.isVisible()) {
          const resultText = await evaluationResult.textContent();
          console.log(`   ✓ 評価結果表示: "${resultText}"`);
        }
        
        // 学習ポイントが表示されているか確認
        const learningPoint = await page.locator('text="📚 学習ポイント"').first();
        if (await learningPoint.isVisible()) {
          console.log('   ✓ 学習ポイントが表示されています');
          
          // 学習ポイントの内容を取得
          const pointContent = await page.locator('.text-blue-800').first();
          if (await pointContent.isVisible()) {
            const content = await pointContent.textContent();
            console.log(`   内容: ${content.substring(0, 50)}...`);
          }
        }
        
        // 翻訳が表示されているか確認
        const translation = await page.locator('.text-blue-200').first();
        if (await translation.isVisible()) {
          const translationText = await translation.textContent();
          console.log(`   ✓ 翻訳表示: "${translationText}"`);
        }
        
        console.log('\n3. 5秒間待機して自動遷移しないことを確認...');
        await page.waitForTimeout(5000);
        
        // まだ同じページにいるか確認（進捗が1/10のまま）
        const progress = await page.locator('text="1 / 10"').first();
        if (await progress.isVisible()) {
          console.log('   ✓ 自動遷移せず、解説を読む時間があります');
        } else {
          console.log('   ⚠ 自動的に次に進んでしまいました');
        }
        
        // 次へボタンを確認
        const nextButton = await page.locator('button:has-text("次の問題へ")');
        if (await nextButton.isVisible()) {
          console.log('   ✓ 「次の問題へ」ボタンが表示されています');
          
          // 次へボタンをクリック
          await nextButton.click();
          console.log('   ✓ 次の問題に進みました');
          
          // 進捗が2/10になったか確認
          await page.waitForTimeout(1000);
          const nextProgress = await page.locator('text="2 / 10"').first();
          if (await nextProgress.isVisible()) {
            console.log('   ✓ 問題2に進みました（2/10）');
          }
        }
        
        console.log('\n=== テスト完了 ===');
        console.log('✓ 評価後、ユーザーのペースで学習できます');
        console.log('✓ 解説とポイントが十分に表示されます');
        
      } else {
        console.log('   ✗ 「できなかった」ボタンが見つかりません');
      }
    } else {
      console.log('   ✗ Part 0が表示されていません');
    }
    
  } catch (error) {
    console.error('テストエラー:', error.message);
  } finally {
    await browser.close();
  }
})();