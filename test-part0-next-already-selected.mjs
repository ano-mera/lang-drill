import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Part 0 Next Button Test (Part 0 already selected) ===\n');
    
    // 1. ページを開く
    console.log('1. Opening http://localhost:3001...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);
    
    // 2. 現在の状態を確認
    console.log('2. Checking current state...');
    
    // Part 0が既に表示されているか確認
    const part0Title = await page.locator('h1:has-text("Part 0: Foundation")').first();
    const isPart0Visible = await part0Title.isVisible();
    
    if (isPart0Visible) {
      console.log('   ✅ Part 0 is already displayed\n');
    } else {
      console.log('   Part 0 is not displayed. Looking for Part 0 button...');
      // Part 0ボタンを探してクリック
      const part0Button = await page.locator('button:has-text("Part 0")').first();
      if (await part0Button.isVisible()) {
        await part0Button.click();
        console.log('   Clicked Part 0 button\n');
        await page.waitForTimeout(2000);
      }
    }
    
    // 3. Nextボタンを探す
    console.log('3. Looking for Next buttons...');
    const nextButtons = await page.locator('button:has-text("Next")').all();
    console.log(`   Found ${nextButtons.length} Next button(s)`);
    
    if (nextButtons.length === 0) {
      console.log('\n   ❌ No Next button found');
      
      // 現在表示されているボタンを列挙
      const allButtons = await page.locator('button').all();
      console.log('\n   Available buttons:');
      for (const button of allButtons) {
        const text = await button.textContent();
        const isVisible = await button.isVisible();
        if (text && text.trim() && isVisible) {
          const box = await button.boundingBox();
          if (box) {
            console.log(`     - "${text.trim()}" at (x:${Math.round(box.x)}, y:${Math.round(box.y)})`);
          }
        }
      }
    } else {
      // 各Nextボタンの位置を確認
      console.log('\n   Next button details:');
      for (let i = 0; i < nextButtons.length; i++) {
        const button = nextButtons[i];
        const box = await button.boundingBox();
        const isVisible = await button.isVisible();
        if (box && isVisible) {
          console.log(`     Button ${i+1}: x=${Math.round(box.x)}, y=${Math.round(box.y)}, visible=${isVisible}`);
          
          // 右上のボタン（通常 x > 700）を探す
          if (box.x > 600) {
            console.log(`     → This appears to be the top-right Next button`);
            
            // 4. Nextボタンをクリック
            console.log('\n4. Clicking Next button...');
            
            // クリック前の状態を記録
            const beforeUrl = page.url();
            const beforeProgress = await page.locator('span.text-gray-400').first();
            let beforeProgressText = '';
            if (await beforeProgress.isVisible()) {
              beforeProgressText = await beforeProgress.textContent();
            }
            
            console.log(`   Before click:`);
            console.log(`     URL: ${beforeUrl}`);
            console.log(`     Progress: ${beforeProgressText || 'N/A'}`);
            
            // Part0Component内でまだ評価していない場合、評価してからNextを押す
            const evalButton = await page.locator('button:has-text("できた")').first();
            if (await evalButton.isVisible()) {
              console.log('   Clicking evaluation button first...');
              await evalButton.click();
              await page.waitForTimeout(1000);
            }
            
            // Nextボタンをクリック
            await button.click();
            console.log('   Clicked Next button');
            await page.waitForTimeout(2000);
            
            // 5. クリック後の状態を確認
            console.log('\n5. After click:');
            const afterUrl = page.url();
            const afterProgress = await page.locator('span.text-gray-400').first();
            let afterProgressText = '';
            if (await afterProgress.isVisible()) {
              afterProgressText = await afterProgress.textContent();
            }
            
            console.log(`     URL: ${afterUrl}`);
            console.log(`     Progress: ${afterProgressText || 'N/A'}`);
            
            // Part 0に留まっているか確認
            const stillPart0 = await page.locator('h1:has-text("Part 0")').first();
            if (await stillPart0.isVisible()) {
              console.log('   ✅ Still in Part 0');
              
              if (beforeProgressText !== afterProgressText) {
                console.log('   ✅ Progress changed (new session started)');
              } else {
                console.log('   ⚠️ Progress unchanged - button may not be working');
              }
            } else {
              // 他のパートに移動したか確認
              for (let i = 1; i <= 7; i++) {
                const partTitle = await page.locator(`h1:has-text("Part ${i}")`).first();
                if (await partTitle.isVisible()) {
                  console.log(`   ❌ Moved to Part ${i} instead of staying in Part 0`);
                  break;
                }
              }
            }
            
            break; // 最初の右上Nextボタンのみテスト
          }
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    console.log('\n=== Test completed ===');
    await browser.close();
  }
})();