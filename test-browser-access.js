import { chromium } from 'playwright';

async function testBrowserAccess() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // すべてのログを表示
  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}]`, msg.text());
  });
  
  // ネットワークエラーを監視
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`❌ HTTP ${response.status()}: ${response.url()}`);
    }
  });
  
  // ページエラーを監視
  page.on('pageerror', error => {
    console.error('❌ ページエラー:', error.message);
  });
  
  try {
    console.log('アプリケーションにアクセス中...');
    const response = await page.goto('http://localhost:3001', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('レスポンスステータス:', response.status());
    
    // タイトルを取得
    const title = await page.title();
    console.log('ページタイトル:', title);
    
    // bodyの内容を確認
    const bodyText = await page.textContent('body');
    console.log('ページ内容（最初の200文字）:', bodyText.substring(0, 200));
    
    // エラー要素を探す
    const errorElement = await page.$('.error-page, .error, #__next-build-error');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('エラー要素を検出:', errorText);
    }
    
    // 開発者ツールのエラーを確認
    const errors = await page.$$('.nextjs-error-container');
    if (errors.length > 0) {
      console.log('Next.jsエラーコンテナーを検出');
      for (const error of errors) {
        const text = await error.textContent();
        console.log('Next.jsエラー:', text);
      }
    }
    
    console.log('\n✅ ページアクセス完了');
    console.log('ブラウザで手動で確認してください');
    
  } catch (error) {
    console.error('アクセスエラー:', error.message);
  }
  
  // ブラウザを開いたままにする
  await new Promise(() => {});
}

testBrowserAccess().catch(console.error);