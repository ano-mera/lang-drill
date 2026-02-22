# TOEIC Answer Distribution Analysis Report

**Analysis Date:** July 22, 2025  
**Analyst:** Claude Code Analysis Script

## Executive Summary

This comprehensive analysis reveals **significant bias** in the distribution of correct answers across both TOEIC Part 1 and Part 7 questions, indicating systematic issues in the question generation process.

### Key Findings

1. **Part 1 Questions (20 total):**
   - 100% of correct answers are "A" (20/20 questions)
   - Complete absence of B, C, and D as correct answers
   - Chi-square value: 60.00 (critically unbalanced)

2. **Part 7 Questions (489 total):**
   - Severe bias toward "B" answers (50.7% of all questions)
   - Strong bias toward "C" answers (28.4%)
   - Under-representation of "A" answers (18.4%)
   - Critical under-representation of "D" answers (2.5%)
   - Chi-square value: 239.58 (extremely unbalanced)

## Detailed Analysis

### Part 1 Distribution

```
Answer Distribution:
A: 20 questions (100.0%) ████████████████████████████████████████████████████
B:  0 questions (  0.0%) 
C:  0 questions (  0.0%) 
D:  0 questions (  0.0%) 
```

**Statistical Analysis:**
- Expected per answer: 5.0 questions
- Chi-square value: 60.00
- Critical value (α=0.05): 7.815
- **Status: Significantly uneven distribution**

**Root Cause Analysis:**
- All Part 1 questions appear to be generated with answer "A" as default
- No randomization logic implemented in the generation process
- Suggests systematic bias in content generation templates

### Part 7 Distribution

```
Overall Answer Distribution:
A:  90 questions ( 18.4%) █████████
B: 248 questions ( 50.7%) █████████████████████████
C: 139 questions ( 28.4%) ██████████████
D:  12 questions (  2.5%) █
```

**Statistical Analysis:**
- Expected per answer: 122.3 questions
- Chi-square value: 239.58
- Critical value (α=0.05): 7.815
- **Status: Extremely uneven distribution**

### Document Type Analysis

All Part 7 document types show unbalanced distributions:

| Document Type | Questions | Chi-square | Status |
|---------------|-----------|------------|--------|
| Email | 216 | 125.15 | Uneven |
| Advertisement | 114 | 51.96 | Uneven |
| Article | 72 | 37.44 | Uneven |
| Customer Support | 33 | 17.06 | Uneven |
| Internal Chat | 24 | 17.00 | Uneven |
| Notice | 21 | 8.14 | Uneven |
| Form | 9 | N/A | Too few samples |

## Cross-Part Comparison

| Answer | Part 1 | Part 7 | Difference |
|--------|--------|--------|------------|
| A | 100.0% | 18.4% | -81.6% |
| B | 0.0% | 50.7% | +50.7% |
| C | 0.0% | 28.4% | +28.4% |
| D | 0.0% | 2.5% | +2.5% |

**Distribution Similarity: 59.2%** (indicating significant differences between parts)

## Impact Assessment

### Academic/Testing Impact
1. **Test-Taking Strategy Bias:** Students could exploit these patterns to improve scores without improving English proficiency
2. **Assessment Validity:** The tests may not accurately measure English comprehension due to answer pattern predictability
3. **Statistical Reliability:** Uneven distributions affect item response theory calculations and score standardization

### Content Quality Impact
1. **Question Authenticity:** Heavy bias toward B and C options suggests artificial generation patterns
2. **Cognitive Load:** Students may focus on pattern recognition rather than content comprehension
3. **Professional Standards:** Does not meet established psychometric standards for standardized testing

## Root Cause Investigation

### Generator Prompt Analysis
Based on examination of generator templates and logs:

1. **Part 1 Generation:**
   - All generated questions default to answer "A"
   - No randomization logic detected in generation prompts
   - Question format appears to consistently place correct answer first

2. **Part 7 Generation:**
   - Strong preference for options B and C
   - Possible implicit bias in AI generation toward middle options
   - No explicit randomization instructions found in prompt templates

### Technical Findings
- No answer position randomization detected in generator code
- Question generation appears to follow deterministic patterns
- Both parts lack balanced answer distribution controls

## Recommendations

### Immediate Actions (High Priority)

1. **🚨 Implement Answer Randomization Logic**
   - Add randomization to question generation prompts
   - Implement post-generation answer shuffling
   - Target 25% ± 5% distribution per answer option

2. **🔧 Fix Part 1 Generation System**
   - Investigate why all Part 1 questions default to answer "A"
   - Implement proper answer selection logic
   - Add validation checks for answer distribution

3. **📊 Add Distribution Monitoring**
   - Implement real-time distribution tracking
   - Add warnings when chi-square exceeds 7.815
   - Create automated balance reports

### Medium-Term Improvements

1. **🎲 Advanced Randomization**
   - Implement stratified randomization by difficulty level
   - Balance distributions within document types
   - Add pseudo-random selection with distribution constraints

2. **🔍 Quality Assurance**
   - Add distribution checks to content validation pipeline
   - Implement batch-level balance requirements
   - Create rejection criteria for unbalanced question sets

3. **📈 Analytics Dashboard**
   - Create real-time distribution monitoring
   - Add trend analysis for generation patterns
   - Implement alerting for bias detection

### Long-Term Strategic Changes

1. **🧠 Generator Model Improvements**
   - Train models with explicit balance requirements
   - Add distribution awareness to AI generation
   - Implement multi-stage generation with balance correction

2. **📋 Systematic Review Process**
   - Establish periodic distribution audits
   - Create psychometric validation workflows
   - Implement expert review for question balance

3. **🔄 Continuous Improvement**
   - A/B test different randomization strategies
   - Monitor impact on test validity metrics
   - Implement feedback loops for balance optimization

## Implementation Priority Matrix

| Priority | Action | Impact | Effort | Timeline |
|----------|--------|---------|---------|----------|
| 🔴 Critical | Fix Part 1 "A" bias | High | Medium | 1-2 days |
| 🔴 Critical | Add basic randomization | High | Low | 1 day |
| 🟡 High | Implement monitoring | Medium | Medium | 3-5 days |
| 🟡 High | Part 7 balance correction | High | High | 1-2 weeks |
| 🟢 Medium | Advanced randomization | Medium | High | 2-3 weeks |

## Technical Specifications

### Recommended Balance Targets
- **Ideal Distribution:** 25% per answer (A, B, C, D)
- **Acceptable Range:** 20-30% per answer
- **Warning Threshold:** Chi-square > 7.815
- **Critical Threshold:** Chi-square > 15.0

### Monitoring Metrics
- Per-batch distribution balance
- Cumulative distribution trends
- Document type-specific balances
- Difficulty level balances

## Conclusion

The current answer distribution shows **critical systematic bias** that compromises test validity and academic integrity. The extreme bias toward answer "A" in Part 1 (100%) and answer "B" in Part 7 (50.7%) represents a fundamental flaw in the generation system that requires immediate correction.

**Recommendation:** Implement emergency fixes for Part 1 generation and basic randomization for both parts within 48 hours, followed by comprehensive balance monitoring and systematic improvements over the following weeks.

---

*This analysis was generated using automated distribution analysis tools. For questions or clarifications, refer to the analysis script at `/home/ki/projects/eng/analyze-answer-distribution.js`.*