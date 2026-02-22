import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang = "ja" } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "テキストが必要です" }, { status: 400 });
    }

    // Google Translate APIを使用（無料版）
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);

    if (!response.ok) {
      throw new Error("翻訳APIの呼び出しに失敗しました");
    }

    const data = await response.json();
    const translation = data[0][0][0];

    return NextResponse.json({ translation });
  } catch (error) {
    console.error("翻訳エラー:", error);
    return NextResponse.json({ error: "翻訳に失敗しました" }, { status: 500 });
  }
}
