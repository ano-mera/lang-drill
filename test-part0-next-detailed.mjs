import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Part 0 Next Button詳細テスト ===\n');
    
    // 1. ページを開く
    console.log('1. http://localhost:3001 を開いています...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);
    
    // 2. Part 0を選択
    console.log('2. Part 0を選択...');
    const part0Button = await page.locator('button:has-text("Part 0")').first();
    if (await part0Button.isVisible()) {
      await part0Button.click();
      console.log('   ✅ Part 0ボタンをクリックしました');
      await page.waitForTimeout(2000);
    } else {
      console.log('   ❌ Part 0ボタンが見つかりません');
      process.exit(1);
    }
    
    // 3. Part 0が表示されているか確認
    const part0Title = await page.locator('h1:has-text("Part 0: Foundation")').first();
    if (await part0Title.isVisible()) {
      console.log('   ✅ Part 0画面が表示されています\n');
    } else {
      console.log('   ❌ Part 0画面が表示されていません');
      process.exit(1);
    }
    
    // 4. 右上のNextボタンを探す
    console.log('3. 右上のNextボタンを探しています...');
    const nextButtons = await page.locator('button:has-text("Next")').all();
    console.log(`   Nextボタンが${nextButtons.length}個見つかりました`);
    
    // 各Nextボタンの位置を確認
    for (let i = 0; i < nextButtons.length; i++) {
      const button = nextButtons[i];
      const box = await button.boundingBox();
      if (box) {
        console.log(`   ボタン${i+1}: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`);
        
        // 画面右上のボタンを判定（x座標が大きく、y座標が小さい）
        if (box.x > 700 && box.y < 100) {
          console.log(`   → このボタンが右上のNextボタンと思われます`);
          
          // 現在のURLとパート表示を記録
          const urlBefore = page.url();
          const part0TitleBefore = await page.locator('h1:has-text("Part 0: Foundation")').first();
          const isPart0Before = await part0TitleBefore.isVisible();
          
          console.log(`\n4. Nextボタンをクリック前の状態:`);
          console.log(`   URL: ${urlBefore}`);
          console.log(`   Part 0表示: ${isPart0Before}`);
          
          // Nextボタンをクリック
          console.log('\n5. Nextボタンをクリック...');
          await button.click();
          await page.waitForTimeout(3000);
          
          // クリック後の状態を確認
          const urlAfter = page.url();
          const part0TitleAfter = await page.locator('h1:has-text("Part 0: Foundation")').first();
          const isPart0After = await part0TitleAfter.isVisible();
          
          console.log(`\n6. Nextボタンクリック後の状態:`);
          console.log(`   URL: ${urlAfter}`);
          console.log(`   Part 0表示: ${isPart0After}`);
          
          // 他のパートのタイトルも確認
          const otherPartTitles = [
            'Part 1:', 'Part 2:', 'Part 3:', 'Part 4:', 
            'Part 5:', 'Part 6:', 'Part 7:'
          ];
          
          for (const partTitle of otherPartTitles) {
            const element = await page.locator(`h1:has-text("${partTitle}")`).first();
            if (await element.isVisible()) {
              console.log(`   ⚠️ ${partTitle}が表示されています！`);
            }
          }
          
          // 結果の判定
          if (isPart0After) {
            console.log('\n   ✅ Part 0に留まっています');
            
            // 進捗を確認
            const progressElement = await page.locator('span.text-gray-400').first();
            if (await progressElement.isVisible()) {
              const progressText = await progressElement.textContent();
              console.log(`   進捗: ${progressText}`);
            }
          } else {
            console.log('\n   ❌ Part 0から別のパートに移動してしまいました');
          }
          
          break;
        }
      }
    }
    
    // 現在の画面内容をダンプ
    console.log('\n7. 現在の画面内容:');
    const pageTitle = await page.title();
    console.log(`   ページタイトル: ${pageTitle}`);
    
    const h1Elements = await page.locator('h1').all();
    console.log(`   見つかったh1要素: ${h1Elements.length}個`);
    for (const h1 of h1Elements) {
      const text = await h1.textContent();
      console.log(`   - ${text}`);
    }
    
  } catch (error) {
    console.error('\nテストエラー:', error.message);
  } finally {
    console.log('\n=== テスト完了 ===');
    await browser.close();
  }
})();