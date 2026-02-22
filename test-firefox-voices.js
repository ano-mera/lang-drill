import { chromium, firefox } from 'playwright';

async function testFirefoxVoices() {
  // Firefoxが利用できない場合はChromiumを使用
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // コンソールとエラーを監視
  page.on('console', msg => {
    const text = msg.text();
    console.log(`[${msg.type().toUpperCase()}]`, text);
  });
  
  page.on('pageerror', error => {
    console.error('❌ ページエラー:', error.message);
  });
  
  try {
    console.log('==== Firefox音声テスト開始 ====\n');
    
    console.log('1. アプリケーションにアクセス...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // ブラウザ音声に切り替え
    console.log('\n2. ブラウザ音声に切り替え...');
    const qualityButton = await page.$('button:has-text("高品質音声")');
    if (qualityButton) {
      await qualityButton.click();
      await page.waitForTimeout(1000);
      console.log('✓ ブラウザ音声に切り替えました');
    }
    
    console.log('\n3. Firefoxで利用可能な音声をチェック...');
    const voiceInfo = await page.evaluate(() => {
      return new Promise((resolve) => {
        if ('speechSynthesis' in window) {
          const voices = speechSynthesis.getVoices();
          if (voices.length === 0) {
            // 音声読み込み待ち
            setTimeout(() => {
              const delayedVoices = speechSynthesis.getVoices();
              resolve({
                totalVoices: delayedVoices.length,
                englishVoices: delayedVoices.filter(v => 
                  v.lang.startsWith('en') || v.lang.includes('US') || v.lang.includes('GB')
                ).map(v => ({
                  name: v.name,
                  lang: v.lang,
                  gender: v.name.toLowerCase()
                })),
                allVoices: delayedVoices.map(v => ({
                  name: v.name,
                  lang: v.lang
                }))
              });
            }, 100);
          } else {
            resolve({
              totalVoices: voices.length,
              englishVoices: voices.filter(v => 
                v.lang.startsWith('en') || v.lang.includes('US') || v.lang.includes('GB')
              ).map(v => ({
                name: v.name,
                lang: v.lang,
                gender: v.name.toLowerCase()
              })),
              allVoices: voices.map(v => ({
                name: v.name,
                lang: v.lang
              }))
            });
          }
        } else {
          resolve({ error: 'speechSynthesis not supported' });
        }
      });
    });
    
    console.log('利用可能な音声数:', voiceInfo.totalVoices);
    console.log('\n英語音声:');
    voiceInfo.englishVoices.forEach(voice => {
      console.log(`  - ${voice.name} (${voice.lang})`);
    });
    
    console.log('\n全音声:');
    voiceInfo.allVoices.forEach(voice => {
      console.log(`  - ${voice.name} (${voice.lang})`);
    });
    
    console.log('\n4. 男性音声テスト...');
    const maleButton = await page.$('button:has-text("男性音声")');
    if (maleButton) {
      await maleButton.click();
      console.log('✓ 男性音声ボタンをクリック');
      await page.waitForTimeout(500);
      
      // 再生テスト
      const playButton = await page.$('button[title="再生"]');
      if (playButton) {
        console.log('男性音声で再生テスト...');
        await playButton.click();
        await page.waitForTimeout(3000);
        
        const stopButton = await page.$('button[title="停止"]');
        if (stopButton) {
          await stopButton.click();
          console.log('✅ 男性音声再生完了');
        }
      }
    }
    
    console.log('\n5. 女性音声テスト...');
    const femaleButton = await page.$('button:has-text("女性音声")');
    if (femaleButton) {
      await femaleButton.click();
      console.log('✓ 女性音声ボタンをクリック');
      await page.waitForTimeout(500);
      
      // 再生テスト
      const playButton = await page.$('button[title="再生"]');
      if (playButton) {
        console.log('女性音声で再生テスト...');
        await playButton.click();
        await page.waitForTimeout(3000);
        
        const stopButton = await page.$('button[title="停止"]');
        if (stopButton) {
          await stopButton.click();
          console.log('✅ 女性音声再生完了');
        }
      }
    }
    
    console.log('\n==== テスト完了 ====');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
  
  console.log('\nブラウザは開いたままです。手動で詳細確認してください。');
  console.log('Ctrl+Cで終了します。');
  
  await new Promise(() => {});
}

testFirefoxVoices().catch(console.error);