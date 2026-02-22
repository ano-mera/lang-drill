import { chromium } from 'playwright';

async function testPart0Current() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // コンソールログを監視
  page.on('console', msg => {
    console.log(`[${msg.type()}]`, msg.text());
  });
  
  // エラーを監視
  page.on('pageerror', error => {
    console.error('ページエラー:', error.message);
  });
  
  try {
    console.log('==== Part0 Nextボタンテスト開始 ====\n');
    
    console.log('1. アプリケーションにアクセス...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // エラーメッセージがないか確認
    const errorDiv = await page.$('.text-red-500, .error, [role="alert"]');
    if (errorDiv) {
      const errorText = await errorDiv.textContent();
      console.log('⚠️ エラーメッセージ検出:', errorText);
    }
    
    console.log('2. 設定モーダルを開く...');
    // 設定ボタンを探す（アイコンボタンの可能性）
    let settingsOpened = false;
    
    // 方法1: 設定テキストを探す
    const settingsTextButton = await page.$('button:has-text("設定"), button:has-text("Settings")');
    if (settingsTextButton) {
      await settingsTextButton.click();
      settingsOpened = true;
      console.log('✓ 設定ボタン（テキスト）をクリック');
    }
    
    // 方法2: SVGアイコンを含むボタンを探す
    if (!settingsOpened) {
      const iconButtons = await page.$$('button svg');
      for (const icon of iconButtons) {
        const button = await icon.evaluateHandle(el => el.closest('button'));
        if (button) {
          await button.click();
          await page.waitForTimeout(500);
          
          // selectが表示されたか確認
          const select = await page.$('select');
          if (select) {
            settingsOpened = true;
            console.log('✓ 設定ボタン（アイコン）をクリック');
            break;
          }
        }
      }
    }
    
    if (!settingsOpened) {
      console.log('❌ 設定ボタンが見つかりません');
      return;
    }
    
    await page.waitForTimeout(1000);
    
    console.log('3. Part 0を選択...');
    const partSelect = await page.$('select');
    if (partSelect) {
      const currentValue = await partSelect.evaluate(el => el.value);
      console.log('現在の選択:', currentValue);
      
      await partSelect.selectOption('part0');
      console.log('✓ Part 0を選択');
      await page.waitForTimeout(500);
      
      // Sequential/Randomの設定も確認
      const nextBehaviorRadios = await page.$$('input[type="radio"]');
      console.log('ラジオボタン数:', nextBehaviorRadios.length);
      
      // 適用ボタンをクリック
      const applyButton = await page.$('button:has-text("適用"), button:has-text("Apply")');
      if (applyButton) {
        await applyButton.click();
        console.log('✓ 適用ボタンをクリック');
        await page.waitForTimeout(2000);
      }
    }
    
    console.log('\n4. Part 0が表示されているか確認...');
    const h1 = await page.$('h1');
    if (h1) {
      const title = await h1.textContent();
      console.log('タイトル:', title);
      
      if (!title.includes('Part 0')) {
        console.log('⚠️ Part 0が表示されていません');
      }
    }
    
    // 問題IDを取得
    const problemId1 = await page.$eval('.text-gray-400, span:has-text("p0-")', el => el.textContent).catch(() => null);
    console.log('問題ID #1:', problemId1);
    
    console.log('\n5. 音声再生と評価...');
    // 再生ボタンをクリック
    const playButton = await page.$('button:has-text("再生"), button:has-text("Play")');
    if (playButton) {
      await playButton.click();
      console.log('✓ 再生ボタンをクリック');
      await page.waitForTimeout(1000);
    }
    
    // 評価ボタンをクリック
    const successButton = await page.$('button:has-text("できた"), button:has-text("Success")');
    if (successButton) {
      await successButton.click();
      console.log('✓ 評価ボタンをクリック');
      await page.waitForTimeout(500);
    }
    
    console.log('\n6. Nextボタンをテスト...');
    // Nextボタンを探す
    const nextButtons = await page.$$('button:has-text("Next"), button:has-text("次")');
    console.log('Nextボタン候補数:', nextButtons.length);
    
    if (nextButtons.length > 0) {
      // 右上のNextボタン（通常最後の要素）
      const nextButton = nextButtons[nextButtons.length - 1];
      
      console.log('Nextボタンをクリック...');
      await nextButton.click();
      await page.waitForTimeout(2000);
      
      // 新しい問題IDを取得
      const problemId2 = await page.$eval('.text-gray-400, span:has-text("p0-")', el => el.textContent).catch(() => null);
      console.log('問題ID #2:', problemId2);
      
      if (problemId1 && problemId2) {
        if (problemId1 !== problemId2) {
          console.log('\n✅ Nextボタンが正常に動作しています！');
          console.log(`   ${problemId1} → ${problemId2}`);
        } else {
          console.log('\n❌ Nextボタンを押しても問題が変わりません');
        }
      }
      
      // もう一度試す
      console.log('\n7. もう一度Nextボタンをクリック...');
      await nextButton.click();
      await page.waitForTimeout(2000);
      
      const problemId3 = await page.$eval('.text-gray-400, span:has-text("p0-")', el => el.textContent).catch(() => null);
      console.log('問題ID #3:', problemId3);
      
      if (problemId2 && problemId3 && problemId2 !== problemId3) {
        console.log('✅ 2回目のNextも正常動作');
      }
    } else {
      console.log('❌ Nextボタンが見つかりません');
      
      // すべてのボタンを確認
      const allButtons = await page.$$eval('button', buttons => 
        buttons.map(b => b.textContent?.trim()).filter(Boolean)
      );
      console.log('ページ上のボタン:', allButtons);
    }
    
    console.log('\n==== テスト完了 ====');
    console.log('ブラウザは開いたままです。手動で確認してください。');
    console.log('Ctrl+Cで終了します。');
    
  } catch (error) {
    console.error('\n❌ テストエラー:', error.message);
  }
  
  // ブラウザを開いたままにする
  await new Promise(() => {});
}

testPart0Current().catch(console.error);