// TOEIC Part7 問題生成スクリプト
// このスクリプトは、AI生成された問題をJSON形式に変換するためのテンプレートです

const generatePassageData = (id, title, type, content, questions, difficulty, topic) => {
  return {
    id: id,
    title: title,
    type: type,
    content: content,
    questions: questions,
    metadata: {
      difficulty: difficulty,
      estimatedTime: 300,
      wordCount: content.split(" ").length,
      questionCount: questions.length,
      passageType: type,
      topic: topic,
    },
  };
};

// 使用例
const examplePassage = generatePassageData(
  "passage4",
  "Annual Performance Review Schedule",
  "email",
  `Subject: Annual Performance Review Schedule

Dear Team Members,

I would like to inform you that our annual performance review process will begin next month. All employees are required to complete their self-assessment forms by March 15th.

The review meetings will be scheduled between March 20th and April 10th. Each meeting will last approximately 45 minutes and will be conducted by your direct supervisor.

Please note that this year's review will include a new section on professional development goals. You will need to submit your goals for the upcoming year along with your self-assessment.

If you have any questions about the review process, please contact the HR department or your supervisor.

Best regards,
Sarah Johnson
HR Manager`,
  [
    {
      id: "q1",
      question: "What is the main purpose of this email?",
      options: ["To announce a new HR policy", "To schedule performance reviews", "To request employee feedback", "To introduce a new supervisor"],
      correct: "B",
      explanation: "The email announces the annual performance review process and provides scheduling information.",
    },
    {
      id: "q2",
      question: "When must employees complete their self-assessment forms?",
      options: ["By March 10th", "By March 15th", "By March 20th", "By April 10th"],
      correct: "B",
      explanation: "The email clearly states that 'All employees are required to complete their self-assessment forms by March 15th.'",
    },
    {
      id: "q3",
      question: "What is new about this year's review process?",
      options: ["Longer meeting duration", "Professional development goals section", "Different supervisors", "Online submission only"],
      correct: "B",
      explanation: "The email mentions that 'this year's review will include a new section on professional development goals.'",
    },
  ],
  "medium",
  "performance_management"
);

// 新しい問題を追加する際のテンプレート
const addNewPassage = (passagesArray, newPassage) => {
  return [...passagesArray, newPassage];
};

// 難易度別フィルタリング
const filterByDifficulty = (passages, difficulty) => {
  return passages.filter((passage) => passage.metadata.difficulty === difficulty);
};

// トピック別フィルタリング
const filterByTopic = (passages, topic) => {
  return passages.filter((passage) => passage.metadata.topic === topic);
};

// 統計情報の取得
const getStatistics = (passages) => {
  const stats = {
    total: passages.length,
    byDifficulty: {},
    byType: {},
    byTopic: {},
  };

  passages.forEach((passage) => {
    // 難易度別統計
    stats.byDifficulty[passage.metadata.difficulty] = (stats.byDifficulty[passage.metadata.difficulty] || 0) + 1;

    // 文書タイプ別統計
    stats.byType[passage.type] = (stats.byType[passage.type] || 0) + 1;

    // トピック別統計
    stats.byTopic[passage.metadata.topic] = (stats.byTopic[passage.metadata.topic] || 0) + 1;
  });

  return stats;
};

module.exports = {
  generatePassageData,
  addNewPassage,
  filterByDifficulty,
  filterByTopic,
  getStatistics,
};
