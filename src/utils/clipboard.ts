// クリップボード関連のユーティリティ関数

export interface CopyPosition {
  x: number;
  y: number;
}

export async function copyToClipboard(text: string, type: string): Promise<string> {
  try {
    // navigator.clipboardが利用可能かチェック
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return `${type}をクリップボードにコピーしました`;
    } else {
      // フォールバック: 古いブラウザやHTTPSでない環境用
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      textArea.style.pointerEvents = "none";
      textArea.style.userSelect = "none";
      textArea.setAttribute("readonly", "true");
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        return `${type}をクリップボードにコピーしました`;
      } catch (fallbackErr) {
        console.error("フォールバックコピーにも失敗しました:", fallbackErr);
        throw new Error("コピーに失敗しました（ブラウザの設定を確認してください）");
      } finally {
        document.body.removeChild(textArea);
      }
    }
  } catch (err) {
    console.error("クリップボードへのコピーに失敗しました:", err);
    throw new Error("コピーに失敗しました");
  }
}