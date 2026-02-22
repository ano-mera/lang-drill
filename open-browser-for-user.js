import { chromium } from 'playwright';

async function openBrowserForUser() {
  console.log('ブラウザを開いています（手動確認用）...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // 少しゆっくり動作させる
  });
  
  const page = await browser.newPage();
  
  // コンソールログを表示
  page.on('console', msg => {
    console.log(`[ブラウザ ${msg.type()}]`, msg.text());
  });
  
  // エラーを表示
  page.on('pageerror', error => {
    console.error('[ページエラー]', error.message);
  });
  
  try {
    console.log('1. アプリケーションにアクセス中...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    
    console.log('2. ページが読み込まれました');
    
    // ページ情報を表示
    const title = await page.title();
    console.log('ページタイトル:', title);
    
    // Part0が既に表示されているか確認
    try {
      const problemId = await page.$eval('span:has-text("p0-")', el => el.textContent);
      console.log('Part0問題ID:', problemId);
      
      const h1Text = await page.$eval('h1', el => el.textContent);
      console.log('ページヘッダー:', h1Text);
    } catch (e) {
      console.log('Part0がまだ表示されていません');
    }
    
    console.log('\n✅ ブラウザが開いています');
    console.log('📌 手動でアプリケーションを確認してください');
    console.log('📌 Part0のNextボタンが正常に動作するかテストしてください');
    console.log('📌 確認が完了したらCtrl+Cで終了してください');
    
    // 無限に待機してブラウザを開いたままにする
    await new Promise(() => {});
    
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    console.log('ブラウザは開いたままにします。手動で確認してください。');
    await new Promise(() => {});
  }
}

openBrowserForUser().catch(console.error);