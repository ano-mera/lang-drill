import { chromium } from 'playwright';

async function testPart0Simple() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // コンソールログを監視
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('ブラウザログ:', msg.text());
    }
  });
  
  try {
    console.log('1. アプリケーションにアクセス...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);
    
    // ページのタイトルを確認
    const title = await page.title();
    console.log('ページタイトル:', title);
    
    // 全てのボタンのテキストを取得
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(b => b.textContent?.trim())
    );
    console.log('ページ上のボタン:', buttons);
    
    // selectタグがあるか確認
    const selects = await page.$$('select');
    console.log('selectタグの数:', selects.length);
    
    if (selects.length > 0) {
      const options = await page.$$eval('select option', options => 
        options.map(o => ({ value: o.value, text: o.textContent }))
      );
      console.log('Select options:', options);
    }
    
    // 設定を開く（いろいろな方法を試す）
    console.log('\n2. 設定を開く試み...');
    
    // 方法1: 設定アイコンを探す
    const settingsIcon = await page.$('button svg');
    if (settingsIcon) {
      const button = await settingsIcon.$('xpath=../..');
      if (button) {
        console.log('設定アイコンのボタンをクリック');
        await button.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // 方法2: 右上のボタンを探す
    const topRightButton = await page.$('.absolute button, .fixed button');
    if (topRightButton) {
      console.log('右上のボタンをクリック');
      await topRightButton.click();
      await page.waitForTimeout(1000);
    }
    
    // 設定が開いた後のselectを確認
    const partSelect = await page.$('select');
    if (partSelect) {
      console.log('\n3. Part選択ドロップダウンが見つかりました');
      
      // 現在の値を確認
      const currentValue = await partSelect.evaluate(el => el.value);
      console.log('現在選択されているPart:', currentValue);
      
      // Part 0を選択
      console.log('Part 0を選択...');
      await partSelect.selectOption('part0');
      await page.waitForTimeout(500);
      
      // 適用ボタンを探す
      const applyButton = await page.$('button:has-text("適用"), button:has-text("Apply")');
      if (applyButton) {
        console.log('適用ボタンをクリック');
        await applyButton.click();
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('Part選択のselectが見つかりません');
    }
    
    // Part 0が表示されているか確認
    console.log('\n4. Part 0の確認...');
    const h1 = await page.$('h1');
    if (h1) {
      const h1Text = await h1.textContent();
      console.log('H1タイトル:', h1Text);
    }
    
    // 問題IDを確認
    const problemId = await page.$eval('span.text-gray-400', el => el.textContent).catch(() => null);
    console.log('現在の問題ID:', problemId);
    
    // デバッグ情報を表示したまま維持
    console.log('\n✅ デバッグ情報を確認してください');
    console.log('ブラウザは開いたままです。手動でNextボタンを確認してください。');
    
  } catch (error) {
    console.error('エラー:', error.message);
  }
  
  // ブラウザを開いたままにする
  await new Promise(() => {}); // 無限に待機
}

testPart0Simple().catch(console.error);