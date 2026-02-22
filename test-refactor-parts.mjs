import { chromium } from 'playwright';

// 各Partの出題・回答・結果表示が正常に動作するかテスト
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  let passed = 0;
  let failed = 0;

  // コンソールエラーを監視
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon')) {
      consoleErrors.push(msg.text());
    }
  });

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}`);
      errors.push(name);
      failed++;
    }
  }

  async function selectPart(page, partValue) {
    // 設定モーダルを開く
    const settingsBtn = page.locator('button[title="Settings"]').first();
    await settingsBtn.click();
    await page.waitForTimeout(800);

    // Part選択のselectを変更
    const select = page.locator('select').first();
    await select.selectOption(partValue);
    await page.waitForTimeout(300);

    // Applyボタンを押す
    const applyBtn = page.locator('button:has-text("Apply")').first();
    await applyBtn.click();
    await page.waitForTimeout(1000);

    // Nextで新しい問題を読み込み
    const nextBtn = page.locator('button:has-text("Next")').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  try {
    console.log('🚀 リファクタリング検証テスト開始\n');

    // ページを開く
    console.log('📄 ページ読み込み...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // スプラッシュ画面をスキップ（Enterボタン）
    const enterBtn = page.locator('button:has-text("Enter")').first();
    if (await enterBtn.isVisible()) {
      await enterBtn.click();
      await page.waitForTimeout(3000);
    }

    // === Part 5 テスト ===
    console.log('\n--- Part 5: 短文穴埋め ---');
    await selectPart(page, 'part5');
    await page.waitForTimeout(2000);

    const part5Visible = await page.locator('text=Part 5').first().isVisible();
    assert(part5Visible, 'Part 5 画面が表示される');

    // 選択肢をクリック
    const part5Options = page.locator('.rounded-lg.border.cursor-pointer');
    const part5OptionCount = await part5Options.count();
    if (part5OptionCount > 0) {
      await part5Options.first().click();
      await page.waitForTimeout(500);
      assert(true, 'Part 5 選択肢クリック成功');

      // Check/回答ボタンを押して結果を見る
      // Part 5はCheckボタンがないので、ヘッダーのCheckボタンを探す
      const checkBtn = page.locator('button:has-text("Check")').first();
      if (await checkBtn.isVisible()) {
        await checkBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // === Part 6 テスト ===
    console.log('\n--- Part 6: テキスト完成 ---');
    await selectPart(page, 'part6');
    await page.waitForTimeout(2000);

    const part6Visible = await page.locator('text=Part 6').first().isVisible();
    assert(part6Visible, 'Part 6 画面が表示される');

    const part6Options = page.locator('.rounded-lg.border.cursor-pointer');
    if (await part6Options.count() > 0) {
      await part6Options.first().click();
      await page.waitForTimeout(300);
      assert(true, 'Part 6 選択肢クリック成功');

      const checkBtn6 = page.locator('button:has-text("Check")').first();
      if (await checkBtn6.isVisible()) {
        await checkBtn6.click();
        await page.waitForTimeout(1000);
        const resultIndicator = page.locator('.bg-green-500, .bg-red-500').first();
        assert(await resultIndicator.isVisible(), 'Part 6 結果表示（正誤マーク）');
      }
    }

    // === Part 2 テスト ===
    console.log('\n--- Part 2: 応答問題 ---');
    await selectPart(page, 'part2');
    await page.waitForTimeout(2000);

    const part2Visible = await page.locator('text=Part 2').first().isVisible();
    assert(part2Visible, 'Part 2 画面が表示される');

    // A/B/Cボタンを探す
    const abcButtons = page.locator('button.rounded-full.font-bold');
    const abcCount = await abcButtons.count();
    assert(abcCount >= 3, `Part 2 A/B/Cボタン表示（${abcCount}個）`);

    if (abcCount >= 3) {
      await abcButtons.first().click();
      await page.waitForTimeout(500);

      // Checkボタンを押す
      const checkBtn2 = page.locator('button:has-text("Check")').first();
      if (await checkBtn2.isVisible()) {
        await checkBtn2.click();
        await page.waitForTimeout(1500);

        // 結果画面の話者情報が表示されるか
        const speakerInfo = page.locator('text=Speaker').first();
        assert(await speakerInfo.isVisible(), 'Part 2 結果画面の話者情報');
      }
    }

    // === Part 1 テスト ===
    console.log('\n--- Part 1: 写真描写 ---');
    await selectPart(page, 'part1');
    await page.waitForTimeout(3000);

    const part1Visible = await page.locator('text=Part 1').first().isVisible();
    assert(part1Visible, 'Part 1 画面が表示される');

    // A/B/C/Dボタンを探す
    const abcdButtons = page.locator('button.rounded-full.font-bold');
    const abcdCount = await abcdButtons.count();
    assert(abcdCount >= 4, `Part 1 A/B/C/Dボタン表示（${abcdCount}個）`);

    if (abcdCount >= 4) {
      await abcdButtons.first().click();
      await page.waitForTimeout(500);

      const checkBtn1 = page.locator('button:has-text("Check")').first();
      if (await checkBtn1.isVisible()) {
        await checkBtn1.click();
        await page.waitForTimeout(1500);

        // 結果画面に画像 or シーン説明が表示されるか
        const resultContent = page.locator('img[alt="TOEIC Part 1 scene"], .whitespace-pre-wrap').first();
        assert(await resultContent.isVisible(), 'Part 1 結果画面のコンテンツ表示');
      }
    }

    // === Part 3 テスト ===
    console.log('\n--- Part 3: 会話問題 ---');
    await selectPart(page, 'part3');
    await page.waitForTimeout(2000);

    // Part 3は会話表示 or 問題表示があるか
    const part3Content = page.locator('text=Part 3, text=会話').first();
    const part3Exists = await part3Content.isVisible().catch(() => false);
    // 選択肢があるか確認
    const part3Options = page.locator('.rounded-lg.border.cursor-pointer');
    const part3OptionCount = await part3Options.count();
    assert(part3Exists || part3OptionCount > 0, 'Part 3 画面が表示される');

    if (part3OptionCount > 0) {
      // 各問題の選択肢を1つずつ選ぶ
      await part3Options.first().click();
      await page.waitForTimeout(300);

      const submitBtn = page.locator('button:has-text("回答を見る")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
        assert(true, 'Part 3 回答を見るボタン動作');
      }
    }

    // === Part 4 テスト ===
    console.log('\n--- Part 4: スピーチ問題 ---');
    await selectPart(page, 'part4');
    await page.waitForTimeout(2000);

    const part4Visible = await page.locator('text=Part 4').first().isVisible();
    assert(part4Visible, 'Part 4 画面が表示される');

    // スピーチを聞くボタン or 選択肢
    const speechBtn = page.locator('button:has-text("スピーチを聞く")').first();
    const speechBtnVisible = await speechBtn.isVisible().catch(() => false);
    assert(speechBtnVisible, 'Part 4 スピーチ再生ボタン表示');

    // 選択肢を選んでCheck
    const part4Options = page.locator('.rounded-lg.border.cursor-pointer');
    if (await part4Options.count() > 0) {
      await part4Options.first().click();
      await page.waitForTimeout(300);

      const checkBtn4 = page.locator('button:has-text("Check")').first();
      if (await checkBtn4.isVisible()) {
        await checkBtn4.click();
        await page.waitForTimeout(1500);

        // 結果画面の話者情報
        const speakerInfo4 = page.locator('text=Speaker').first();
        const hasSpeaker = await speakerInfo4.isVisible().catch(() => false);
        assert(hasSpeaker, 'Part 4 結果画面の話者情報');
      }
    }

    // === 共通機能テスト ===
    console.log('\n--- 共通機能 ---');

    // 設定モーダルの開閉
    const settingsBtn = page.locator('button[title="Settings"]').first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
      const modal = page.locator('text=適用, text=Apply').first();
      assert(await modal.isVisible(), '設定モーダルが開く');

      // 閉じる
      const closeBtn = page.locator('button:has-text("✕"), button:has-text("×"), button[aria-label="Close"]').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      } else {
        // ESCで閉じる
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }

    // コンソールエラーチェック
    console.log('\n--- コンソールエラー ---');
    if (consoleErrors.length === 0) {
      assert(true, 'コンソールエラーなし');
    } else {
      console.log(`  ⚠️ コンソールエラー ${consoleErrors.length}件:`);
      consoleErrors.slice(0, 5).forEach(e => console.log(`    - ${e.substring(0, 100)}`));
    }

  } catch (error) {
    console.error('\n💥 テスト実行エラー:', error.message);
    failed++;
  } finally {
    await browser.close();

    console.log('\n=============================');
    console.log(`✅ 成功: ${passed}  ❌ 失敗: ${failed}`);
    if (errors.length > 0) {
      console.log('\n失敗したテスト:');
      errors.forEach(e => console.log(`  - ${e}`));
    }
    console.log('=============================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
})();
