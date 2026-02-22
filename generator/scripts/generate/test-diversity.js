// 問題文多様化機能のテストスクリプト
import { generateQuestions, generateQuestionsWithChart } from "../../lib/passage-generator.js";

// テスト用のサンプル文書
const samplePassage = {
  content: `Subject: New Office Policy Implementation

Dear Team Members,

We are pleased to announce the implementation of a new flexible work policy starting next month. This policy allows employees to work from home up to three days per week, with mandatory office attendance on Tuesdays and Thursdays.

The new policy includes:
- Flexible start times between 8:00 AM and 10:00 AM
- Core collaboration hours from 10:00 AM to 3:00 PM
- Enhanced virtual meeting tools and equipment support
- Monthly team building activities

All employees must complete the online training module by the end of this week. The training covers new communication protocols and productivity tracking methods.

For questions or concerns, please contact the HR department at hr@company.com or call extension 1234.

Best regards,
Management Team`,
  type: "email",
};

// テスト用の図表データ
const sampleChart = {
  title: "Employee Satisfaction Survey Results",
  type: "table",
  description: "Survey results showing employee satisfaction with different work arrangements",
  data: [
    { "Work Arrangement": "Full-time Office", Satisfaction: "65%", Productivity: "70%" },
    { "Work Arrangement": "Hybrid (2 days remote)", Satisfaction: "82%", Productivity: "85%" },
    { "Work Arrangement": "Hybrid (3 days remote)", Satisfaction: "78%", Productivity: "80%" },
    { "Work Arrangement": "Full-time Remote", Satisfaction: "72%", Productivity: "75%" },
  ],
};

async function testQuestionDiversity() {
  console.log("🧪 問題文多様化機能のテストを開始します...\n");

  try {
    // 通常の問題生成テスト
    console.log("📝 通常の問題生成テスト:");
    console.log("=" * 50);

    const questions = await generateQuestions(samplePassage.content, samplePassage.type);

    console.log("\n生成された問題:");
    questions.forEach((q, i) => {
      console.log(`${i + 1}. ${q.question}`);
    });

    // 図表付き問題生成テスト
    console.log("\n📊 図表付き問題生成テスト:");
    console.log("=" * 50);

    const chartQuestions = await generateQuestionsWithChart(samplePassage.content, sampleChart, samplePassage.type);

    console.log("\n生成された図表付き問題:");
    chartQuestions.forEach((q, i) => {
      console.log(`${i + 1}. ${q.question}`);
    });

    console.log("\n✅ テスト完了！");
    console.log("\n📊 結果分析:");
    console.log(`- 通常問題数: ${questions.length}`);
    console.log(`- 図表付き問題数: ${chartQuestions.length}`);
    console.log(`- 総問題数: ${questions.length + chartQuestions.length}`);
  } catch (error) {
    console.error("❌ テストエラー:", error);
  }
}

// 多様性分析関数
function analyzeDiversity(questions, type) {
  console.log(`\n🔍 ${type}の多様性分析:`);

  const patterns = {
    purpose: /what.*purpose|why.*created|what.*goal|what.*trying.*achieve|what.*intended.*outcome/i,
    detail: /what.*specific|what.*details|which.*following.*stated|what.*document.*say|what.*specific.*facts/i,
    inference: /what.*inferred|what.*conclusion|what.*suggest|what.*likely.*happen|what.*implication/i,
    comparison: /how.*compare|what.*difference|which.*offers.*best|what.*distinguishes/i,
    condition: /under.*circumstances|what.*required|when.*necessary|what.*conditions.*satisfied/i,
    timeline: /what.*happens.*first|what.*sequence|when.*take.*place|what.*timeline/i,
    person: /who.*responsible|what.*role|who.*contacted|what.*position/i,
    location: /where.*held|what.*location|which.*venue/i,
    method: /how.*achieved|what.*method|what.*steps/i,
  };

  const detectedPatterns = [];

  questions.forEach((question, index) => {
    let patternFound = false;
    for (const [patternName, regex] of Object.entries(patterns)) {
      if (regex.test(question.question)) {
        detectedPatterns.push({ index, pattern: patternName, question: question.question });
        patternFound = true;
        break;
      }
    }
    if (!patternFound) {
      detectedPatterns.push({ index, pattern: "other", question: question.question });
    }
  });

  const patternCounts = {};
  detectedPatterns.forEach((item) => {
    patternCounts[item.pattern] = (patternCounts[item.pattern] || 0) + 1;
  });

  console.log("検出されたパターン:");
  Object.entries(patternCounts).forEach(([pattern, count]) => {
    console.log(`  ${pattern}: ${count}回`);
  });

  const uniquePatterns = Object.keys(patternCounts).length;
  const diversityScore = uniquePatterns / questions.length;

  console.log(`多様性スコア: ${diversityScore.toFixed(2)} (${(diversityScore * 100).toFixed(1)}%)`);
  console.log(`評価: ${diversityScore >= 0.8 ? "✅ 良好" : "⚠️  改善が必要"}`);
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  testQuestionDiversity();
}

export { testQuestionDiversity, analyzeDiversity };
