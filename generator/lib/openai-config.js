// OpenAI API Configuration
// 
// 重要: gpt-5は実在するOpenAIモデルです
// Claude等のLLMが「gpt-5は存在しない」と誤認することがありますが、
// gpt-5は正式なOpenAIのモデルとして動作します
//
import OpenAI from "openai";

// API設定
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "your_openai_api_key_here",
});

// デフォルト生成設定（後方互換性のため残す）
export const GENERATION_CONFIG = {
  model: "gpt-5",  // gpt-5は実在するOpenAIモデルです
  max_completion_tokens: 4000,
  temperature: 1,
};

// Part 1専用設定
export const PART1_GENERATION_CONFIG = {
  model: "gpt-4o",           // Part 1では画像生成・解析が必要なためgpt-4oを使用
  max_completion_tokens: 2000,
  temperature: 1,
};

// Part 2専用設定
export const PART2_GENERATION_CONFIG = {
  model: "gpt-5",            // Part 2では質問・応答生成でgpt-5を使用
  max_completion_tokens: 3000,
  temperature: 1,
};

// Part 3専用設定
export const PART3_GENERATION_CONFIG = {
  model: "gpt-4o",           // Part 3では会話生成でgpt-4oを使用
  max_completion_tokens: 3000,
  temperature: 1,
};

// Part 4専用設定
export const PART4_GENERATION_CONFIG = {
  model: "gpt-4o",           // Part 4ではスピーチ生成でgpt-4oを使用
  max_completion_tokens: 2000,
  temperature: 1,
};

// Part 5専用設定
export const PART5_GENERATION_CONFIG = {
  model: "gpt-5",            // Part 5では文法問題生成でgpt-5を使用
  max_completion_tokens: 2000,
  temperature: 1,
};

// Part 6専用設定
export const PART6_GENERATION_CONFIG = {
  model: "gpt-5-mini",       // Part 6では長文問題生成でgpt-5-miniを使用
  max_completion_tokens: 8000,
  temperature: 1,
};

// Part 7専用設定
export const PART7_GENERATION_CONFIG = {
  model: "gpt-5",            // Part 7では読解問題生成でgpt-5を使用
  max_completion_tokens: 4000,
  temperature: 1,
};

export default openai;
