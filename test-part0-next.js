import { chromium } from 'playwright';

async function testPart0Next() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. アプリケーションにアクセス...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);
    
    console.log('2. Part 0を選択...');
    // 設定ボタンをクリック (日本語)
    const settingsButton = await page.$('button:has-text("設定")') || await page.$('button:has-text("Settings")');
    if (settingsButton) {
      await settingsButton.click();
      await page.waitForTimeout(1000);
      
      // Part 0を選択
      const partSelect = await page.$('select');
      if (partSelect) {
        await partSelect.selectOption('part0');
        await page.waitForTimeout(500);
      } else {
        console.log('Part選択のselectが見つかりません');
      }
      
      // Apply設定
      const applyButton = await page.$('button:has-text("適用")') || await page.$('button:has-text("Apply")');
      if (applyButton) {
        await applyButton.click();
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('設定ボタンが見つかりません');
      // 直接Part0の状態を確認
    }
    
    console.log('3. Part 0の問題が表示されているか確認...');
    const part0Title = await page.textContent('h1');
    console.log('タイトル:', part0Title);
    
    // 現在の問題IDを取得
    const problemId1 = await page.textContent('span.text-gray-400');
    console.log('最初の問題ID:', problemId1);
    
    console.log('4. 音声再生ボタンをクリック...');
    await page.click('button:has-text("再生")');
    await page.waitForTimeout(2000);
    
    console.log('5. 評価ボタンをクリック...');
    await page.click('button:has-text("できた")');
    await page.waitForTimeout(1000);
    
    console.log('6. 右上のNextボタンが表示されているか確認...');
    const nextButton = await page.$('button:has-text("Next")');
    if (nextButton) {
      console.log('✅ Nextボタンが見つかりました');
      
      // Nextボタンの位置を取得
      const box = await nextButton.boundingBox();
      console.log('Nextボタンの位置:', box);
      
      console.log('7. Nextボタンをクリック...');
      await nextButton.click();
      await page.waitForTimeout(2000);
      
      // 新しい問題IDを取得
      const problemId2 = await page.textContent('span.text-gray-400');
      console.log('次の問題ID:', problemId2);
      
      if (problemId1 !== problemId2) {
        console.log('✅ Nextボタンが正常に動作しています！');
      } else {
        console.log('❌ Nextボタンをクリックしても問題が変わりません');
        
        // デバッグ用：コンソールログを確認
        page.on('console', msg => console.log('ブラウザコンソール:', msg.text()));
        
        // もう一度クリックしてみる
        console.log('8. もう一度Nextボタンをクリック...');
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(2000);
        
        const problemId3 = await page.textContent('span.text-gray-400');
        console.log('3回目の問題ID:', problemId3);
      }
    } else {
      console.log('❌ Nextボタンが見つかりません');
      
      // ページの全ボタンを確認
      const buttons = await page.$$eval('button', buttons => 
        buttons.map(b => b.textContent)
      );
      console.log('ページ上のすべてのボタン:', buttons);
    }
    
    // エラーがないか確認
    const errorMessage = await page.$('.text-red-500');
    if (errorMessage) {
      const error = await errorMessage.textContent();
      console.log('❌ エラーメッセージ:', error);
    }
    
  } catch (error) {
    console.error('テスト中にエラーが発生:', error);
  }
  
  console.log('\nテスト終了（ブラウザは開いたままにします）');
  console.log('手動で確認してからCtrl+Cで終了してください');
  
  // ブラウザを開いたままにする
  await page.waitForTimeout(60000);
}

testPart0Next().catch(console.error);