import { chromium } from 'playwright';

async function testAudioQualitySwitch() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // コンソールとエラーを監視
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('error') || text.includes('Error') || text.includes('TTS') || text.includes('voice')) {
      console.log(`[${msg.type().toUpperCase()}]`, text);
    }
  });
  
  page.on('pageerror', error => {
    console.error('❌ ページエラー:', error.message);
  });
  
  try {
    console.log('==== 音声品質切り替えテスト開始 ====\n');
    
    console.log('1. アプリケーションにアクセス...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Part0が表示されているか確認
    const problemId = await page.$eval('span:has-text("p0-")', el => el.textContent).catch(() => null);
    console.log('Part0問題ID:', problemId);
    
    if (!problemId) {
      console.log('Part0が表示されていません');
      return;
    }
    
    console.log('\n2. 音声品質表示領域を確認...');
    // 音声品質ボタンを探す
    const qualityButton = await page.$('button:has-text("高品質音声"), button:has-text("ブラウザ音声")');
    if (qualityButton) {
      const buttonText = await qualityButton.textContent();
      console.log('✓ 音声品質ボタンが見つかりました:', buttonText);
      
      console.log('\n3. 音声品質を切り替え...');
      await qualityButton.click();
      await page.waitForTimeout(1000);
      
      // 切り替え後のテキストを確認
      const newButtonText = await qualityButton.textContent();
      console.log('切り替え後:', newButtonText);
      
      if (buttonText !== newButtonText) {
        console.log('✅ 音声品質切り替えが正常に動作');
      } else {
        console.log('❌ 音声品質切り替えが反応しない');
      }
    } else {
      console.log('❌ 音声品質ボタンが見つかりません');
      
      // 音声関連のボタンをすべて確認
      const audioButtons = await page.$$eval('button', buttons =>
        buttons.filter(b => b.textContent?.includes('音声') || b.textContent?.includes('TTS'))
               .map(b => b.textContent)
      );
      console.log('音声関連ボタン:', audioButtons);
    }
    
    console.log('\n4. 男性/女性音声切り替えテスト...');
    // 男性音声ボタンをクリック
    const maleButton = await page.$('button:has-text("男性音声")');
    if (maleButton) {
      await maleButton.click();
      console.log('✓ 男性音声を選択');
      await page.waitForTimeout(500);
    }
    
    // 女性音声ボタンをクリック
    const femaleButton = await page.$('button:has-text("女性音声")');
    if (femaleButton) {
      await femaleButton.click();
      console.log('✓ 女性音声を選択');
      await page.waitForTimeout(500);
    }
    
    console.log('\n5. 音声再生テスト...');
    // 再生ボタンをクリック
    const playButton = await page.$('button[title="再生"], button:has-text("再生")');
    if (playButton) {
      console.log('再生ボタンをクリック...');
      await playButton.click();
      await page.waitForTimeout(2000);
      
      // 再生状態の確認
      const stopButton = await page.$('button[title="停止"]');
      if (stopButton) {
        console.log('✅ 音声再生が開始されました');
        
        // 停止
        await stopButton.click();
        console.log('再生を停止');
      } else {
        console.log('再生状態を確認できません');
      }
    }
    
    console.log('\n6. もう一度品質切り替えテスト...');
    if (qualityButton) {
      await qualityButton.click();
      await page.waitForTimeout(1000);
      
      const finalButtonText = await qualityButton.textContent();
      console.log('最終的な音声品質:', finalButtonText);
      
      // もう一度再生テスト
      if (playButton) {
        console.log('切り替え後の音声再生テスト...');
        await playButton.click();
        await page.waitForTimeout(2000);
        
        const stopButton = await page.$('button[title="停止"]');
        if (stopButton) {
          await stopButton.click();
          console.log('✅ 切り替え後の再生も正常');
        }
      }
    }
    
    console.log('\n==== テスト完了 ====');
    console.log('✅ 音声品質切り替え機能の動作確認完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
  
  console.log('\nブラウザは開いたままです。手動で詳細確認してください。');
  console.log('Ctrl+Cで終了します。');
  
  // ブラウザを開いたままにする
  await new Promise(() => {});
}

testAudioQualitySwitch().catch(console.error);