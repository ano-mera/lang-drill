import { chromium } from 'playwright';

async function testPart0NextSimple() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // コンソールログを監視（デバッグログのみ表示）
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Next button clicked') || text.includes('Part 0')) {
      console.log(`[LOG]`, text);
    }
  });
  
  try {
    console.log('==== Part0 Nextボタンテスト（シンプル版） ====\n');
    
    console.log('1. アプリケーションにアクセス...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('2. 現在の問題IDを取得...');
    let problemId1 = null;
    try {
      // Part0が既に表示されているか確認
      problemId1 = await page.$eval('span:has-text("p0-")', el => el.textContent);
      console.log('✓ Part0が既に表示されています');
      console.log('問題ID #1:', problemId1);
    } catch (e) {
      console.log('Part0が表示されていません。設定から選択する必要があります。');
      
      // 設定ボタンを探してクリック
      const buttons = await page.$$('button');
      for (let i = buttons.length - 1; i >= 0; i--) {
        const button = buttons[i];
        await button.click();
        await page.waitForTimeout(500);
        
        const select = await page.$('select');
        if (select) {
          console.log('✓ 設定モーダルが開きました');
          
          // Part0を選択
          await select.selectOption('part0');
          console.log('✓ Part0を選択');
          
          // 適用ボタンをクリック
          const applyButton = await page.$('button:has-text("適用")');
          if (applyButton) {
            await applyButton.click();
            console.log('✓ 適用ボタンをクリック');
            await page.waitForTimeout(2000);
            
            // 問題IDを再取得
            problemId1 = await page.$eval('span:has-text("p0-")', el => el.textContent);
            console.log('問題ID #1:', problemId1);
          }
          break;
        }
      }
    }
    
    if (!problemId1) {
      console.log('❌ Part0の問題が表示されていません');
      return;
    }
    
    console.log('\n3. 音声再生と評価...');
    // 再生ボタンをクリック
    const playButton = await page.$('button:has-text("再生")');
    if (playButton) {
      await playButton.click();
      console.log('✓ 再生ボタンをクリック');
      await page.waitForTimeout(1000);
    }
    
    // 評価ボタンをクリック（「できた」または「できなかった」）
    const evaluationButton = await page.$('button:has-text("できた")') || 
                            await page.$('button:has-text("できなかった")');
    if (evaluationButton) {
      await evaluationButton.click();
      console.log('✓ 評価ボタンをクリック');
      await page.waitForTimeout(500);
    }
    
    console.log('\n4. Nextボタンをテスト（Part0内の次へボタン）...');
    
    // Part0Component内の「次の問題へ」ボタンをクリック
    const nextProblemButton = await page.$('button:has-text("次の問題へ")') || 
                             await page.$('button:has-text("新しいセットへ")');
    if (nextProblemButton) {
      const buttonText = await nextProblemButton.textContent();
      console.log(`「${buttonText}」ボタンをクリック...`);
      await nextProblemButton.click();
      await page.waitForTimeout(2000);
      
      // 新しい問題IDを取得
      let problemId2 = null;
      try {
        problemId2 = await page.$eval('span:has-text("p0-")', el => el.textContent);
        console.log('問題ID #2:', problemId2);
        
        if (problemId1 !== problemId2) {
          console.log('✅ Part0内のNextボタンが正常に動作！');
          console.log(`   ${problemId1} → ${problemId2}`);
        } else {
          console.log('❌ 問題が変わりません');
        }
      } catch (e) {
        console.log('完了画面に遷移した可能性があります');
      }
    }
    
    console.log('\n5. 右上のNextボタンをテスト...');
    
    // 右上のNextボタンを探す
    const topRightNext = await page.$('button:has-text("Next")');
    if (topRightNext) {
      console.log('右上のNextボタンをクリック...');
      
      // クリック前の問題IDを取得
      const beforeId = await page.$eval('span:has-text("p0-")', el => el.textContent).catch(() => null);
      
      await topRightNext.click();
      await page.waitForTimeout(2000);
      
      // クリック後の問題IDを取得
      const afterId = await page.$eval('span:has-text("p0-")', el => el.textContent).catch(() => null);
      
      console.log('クリック前:', beforeId);
      console.log('クリック後:', afterId);
      
      if (beforeId && afterId && beforeId !== afterId) {
        console.log('✅ 右上のNextボタンも正常に動作！');
      } else if (!afterId) {
        console.log('完了画面または別のパートに遷移した可能性があります');
      } else {
        console.log('❌ 右上のNextボタンで問題が変わりません');
      }
    } else {
      console.log('右上のNextボタンが見つかりません');
    }
    
    console.log('\n==== テスト完了 ====');
    
  } catch (error) {
    console.error('\n❌ テストエラー:', error.message);
  }
  
  console.log('\nブラウザは開いたままです。手動で確認してください。');
  console.log('Ctrl+Cで終了します。');
  
  // ブラウザを開いたままにする
  await new Promise(() => {});
}

testPart0NextSimple().catch(console.error);