export interface QualityIssue {
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  suggestion?: string;
}

export interface QualityCheckResult {
  passed: boolean;
  score: number;
  issues: QualityIssue[];
  recommendation: "approve" | "reject" | "revision_needed";
}

// This file contains type definitions only - no OpenAI dependency needed