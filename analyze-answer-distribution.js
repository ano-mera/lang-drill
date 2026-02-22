#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Comprehensive Answer Distribution Analysis for TOEIC Parts 1 and 7
 * 
 * This script analyzes the distribution of correct answers (A, B, C, D) 
 * across both Part 1 and Part 7 questions to identify any patterns or biases.
 */

function loadJsonData(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error.message);
        return null;
    }
}

function analyzePart1Distribution() {
    console.log('='.repeat(60));
    console.log('PART 1 ANSWER DISTRIBUTION ANALYSIS');
    console.log('='.repeat(60));
    
    const part1Path = path.join(__dirname, 'src/data/part1-questions.json');
    const part1Data = loadJsonData(part1Path);
    
    if (!part1Data) {
        console.log('❌ Could not load Part 1 data');
        return null;
    }
    
    const distribution = { A: 0, B: 0, C: 0, D: 0 };
    let totalQuestions = 0;
    let invalidAnswers = [];
    
    // Part 1 data is structured as a direct array, not with a "questions" wrapper
    const questions = Array.isArray(part1Data) ? part1Data : (part1Data.questions || []);
    
    questions.forEach((question, index) => {
        totalQuestions++;
        
        // Part 1 may store correct answer as letter (A, B, C, D) or as full text
        let correctLetter = null;
        
        if (question.correct && ['A', 'B', 'C', 'D'].includes(question.correct)) {
            // Already in letter format
            correctLetter = question.correct;
        } else if (question.options) {
            // Need to find which option matches the correct text
            const correctIndex = question.options.findIndex(option => option === question.correct);
            if (correctIndex >= 0) {
                correctLetter = String.fromCharCode(65 + correctIndex); // Convert 0,1,2,3 to A,B,C,D
            }
        }
        
        if (correctLetter && distribution.hasOwnProperty(correctLetter)) {
            distribution[correctLetter]++;
        } else {
            invalidAnswers.push({ 
                index: index + 1, 
                correct: question.correct, 
                correctLetter: correctLetter,
                id: question.id,
                hasOptions: !!question.options,
                optionsCount: question.options ? question.options.length : 0
            });
        }
    });
    
    console.log(`📊 Total Questions: ${totalQuestions}`);
    console.log('\n📈 Answer Distribution:');
    
    Object.entries(distribution).forEach(([answer, count]) => {
        const percentage = ((count / totalQuestions) * 100).toFixed(1);
        const bar = '█'.repeat(Math.round(percentage / 2));
        console.log(`   ${answer}: ${count.toString().padStart(3)} (${percentage.padStart(5)}%) ${bar}`);
    });
    
    if (invalidAnswers.length > 0) {
        console.log(`\n⚠️  Invalid Answers Found: ${invalidAnswers.length}`);
        invalidAnswers.forEach(invalid => {
            console.log(`   Question ${invalid.index} (ID: ${invalid.id}): "${invalid.correct}"`);
        });
    }
    
    // Statistical analysis
    const counts = Object.values(distribution);
    const expectedCount = totalQuestions / 4;
    const chiSquare = counts.reduce((sum, count) => {
        return sum + Math.pow(count - expectedCount, 2) / expectedCount;
    }, 0);
    
    console.log('\n📊 Statistical Analysis:');
    console.log(`   Expected per answer: ${expectedCount.toFixed(1)}`);
    console.log(`   Chi-square value: ${chiSquare.toFixed(2)}`);
    console.log(`   Critical value (α=0.05): 7.815`);
    console.log(`   Distribution is ${chiSquare > 7.815 ? 'significantly uneven' : 'reasonably balanced'}`);
    
    return { distribution, totalQuestions, chiSquare, invalidAnswers };
}

function analyzePart7Distribution() {
    console.log('\n' + '='.repeat(60));
    console.log('PART 7 ANSWER DISTRIBUTION ANALYSIS');
    console.log('='.repeat(60));
    
    const part7Path = path.join(__dirname, 'src/data/passages.json');
    const part7Data = loadJsonData(part7Path);
    
    if (!part7Data) {
        console.log('❌ Could not load Part 7 data');
        return null;
    }
    
    const distribution = { A: 0, B: 0, C: 0, D: 0 };
    let totalQuestions = 0;
    let totalPassages = 0;
    let invalidAnswers = [];
    let passageStats = [];
    
    part7Data.passages.forEach((passage, passageIndex) => {
        totalPassages++;
        const passageDistribution = { A: 0, B: 0, C: 0, D: 0 };
        
        passage.questions.forEach((question, questionIndex) => {
            totalQuestions++;
            const correct = question.correct;
            
            if (distribution.hasOwnProperty(correct)) {
                distribution[correct]++;
                passageDistribution[correct]++;
            } else {
                invalidAnswers.push({ 
                    passage: passageIndex + 1, 
                    question: questionIndex + 1, 
                    correct, 
                    id: question.id,
                    passageId: passage.id
                });
            }
        });
        
        passageStats.push({
            id: passage.id,
            type: passage.type,
            questionCount: passage.questions.length,
            distribution: { ...passageDistribution }
        });
    });
    
    console.log(`📊 Total Passages: ${totalPassages}`);
    console.log(`📊 Total Questions: ${totalQuestions}`);
    console.log(`📊 Average Questions per Passage: ${(totalQuestions / totalPassages).toFixed(1)}`);
    
    console.log('\n📈 Overall Answer Distribution:');
    Object.entries(distribution).forEach(([answer, count]) => {
        const percentage = ((count / totalQuestions) * 100).toFixed(1);
        const bar = '█'.repeat(Math.round(percentage / 2));
        console.log(`   ${answer}: ${count.toString().padStart(3)} (${percentage.padStart(5)}%) ${bar}`);
    });
    
    if (invalidAnswers.length > 0) {
        console.log(`\n⚠️  Invalid Answers Found: ${invalidAnswers.length}`);
        invalidAnswers.forEach(invalid => {
            console.log(`   Passage ${invalid.passage} (${invalid.passageId}), Question ${invalid.question} (${invalid.id}): "${invalid.correct}"`);
        });
    }
    
    // Statistical analysis
    const counts = Object.values(distribution);
    const expectedCount = totalQuestions / 4;
    const chiSquare = counts.reduce((sum, count) => {
        return sum + Math.pow(count - expectedCount, 2) / expectedCount;
    }, 0);
    
    console.log('\n📊 Statistical Analysis:');
    console.log(`   Expected per answer: ${expectedCount.toFixed(1)}`);
    console.log(`   Chi-square value: ${chiSquare.toFixed(2)}`);
    console.log(`   Critical value (α=0.05): 7.815`);
    console.log(`   Distribution is ${chiSquare > 7.815 ? 'significantly uneven' : 'reasonably balanced'}`);
    
    // Passage type analysis
    console.log('\n📄 Analysis by Document Type:');
    const typeStats = {};
    passageStats.forEach(passage => {
        if (!typeStats[passage.type]) {
            typeStats[passage.type] = { 
                count: 0, 
                totalQuestions: 0, 
                distribution: { A: 0, B: 0, C: 0, D: 0 } 
            };
        }
        typeStats[passage.type].count++;
        typeStats[passage.type].totalQuestions += passage.questionCount;
        
        Object.entries(passage.distribution).forEach(([answer, count]) => {
            typeStats[passage.type].distribution[answer] += count;
        });
    });
    
    Object.entries(typeStats).forEach(([type, stats]) => {
        console.log(`\n   ${type.toUpperCase()} (${stats.count} passages, ${stats.totalQuestions} questions):`);
        Object.entries(stats.distribution).forEach(([answer, count]) => {
            const percentage = ((count / stats.totalQuestions) * 100).toFixed(1);
            console.log(`     ${answer}: ${count.toString().padStart(3)} (${percentage.padStart(5)}%)`);
        });
    });
    
    return { 
        distribution, 
        totalQuestions, 
        totalPassages, 
        chiSquare, 
        invalidAnswers,
        typeStats,
        passageStats 
    };
}

function compareDistributions(part1Result, part7Result) {
    if (!part1Result || !part7Result) {
        console.log('\n❌ Cannot compare - missing data');
        return;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('PART 1 vs PART 7 COMPARISON');
    console.log('='.repeat(60));
    
    console.log('\n📊 Side-by-Side Comparison:');
    console.log('Answer | Part 1      | Part 7      | Difference');
    console.log('-------|-------------|-------------|------------');
    
    ['A', 'B', 'C', 'D'].forEach(answer => {
        const p1Count = part1Result.distribution[answer];
        const p7Count = part7Result.distribution[answer];
        const p1Pct = ((p1Count / part1Result.totalQuestions) * 100).toFixed(1);
        const p7Pct = ((p7Count / part7Result.totalQuestions) * 100).toFixed(1);
        const diff = (parseFloat(p7Pct) - parseFloat(p1Pct)).toFixed(1);
        const diffSign = diff > 0 ? '+' : '';
        
        console.log(`   ${answer}   | ${p1Count.toString().padStart(3)} (${p1Pct.padStart(4)}%) | ${p7Count.toString().padStart(3)} (${p7Pct.padStart(4)}%) | ${diffSign}${diff.padStart(5)}%`);
    });
    
    console.log('\n📈 Statistical Comparison:');
    console.log(`   Part 1 Chi-square: ${part1Result.chiSquare.toFixed(2)} (${part1Result.chiSquare > 7.815 ? 'uneven' : 'balanced'})`);
    console.log(`   Part 7 Chi-square: ${part7Result.chiSquare.toFixed(2)} (${part7Result.chiSquare > 7.815 ? 'uneven' : 'balanced'})`);
    
    // Calculate total bias toward certain answers
    const biasScore = ['A', 'B', 'C', 'D'].reduce((sum, answer) => {
        const p1Pct = (part1Result.distribution[answer] / part1Result.totalQuestions) * 100;
        const p7Pct = (part7Result.distribution[answer] / part7Result.totalQuestions) * 100;
        return sum + Math.abs(p1Pct - p7Pct);
    }, 0);
    
    console.log(`   Distribution similarity: ${(100 - biasScore/4).toFixed(1)}% (lower = more different)`);
    
    // Identify most and least used answers
    const p1Sorted = Object.entries(part1Result.distribution).sort(([,a], [,b]) => b - a);
    const p7Sorted = Object.entries(part7Result.distribution).sort(([,a], [,b]) => b - a);
    
    console.log('\n🎯 Pattern Analysis:');
    console.log(`   Part 1 most used: ${p1Sorted[0][0]} (${((p1Sorted[0][1] / part1Result.totalQuestions) * 100).toFixed(1)}%)`);
    console.log(`   Part 1 least used: ${p1Sorted[3][0]} (${((p1Sorted[3][1] / part1Result.totalQuestions) * 100).toFixed(1)}%)`);
    console.log(`   Part 7 most used: ${p7Sorted[0][0]} (${((p7Sorted[0][1] / part7Result.totalQuestions) * 100).toFixed(1)}%)`);
    console.log(`   Part 7 least used: ${p7Sorted[3][0]} (${((p7Sorted[3][1] / part7Result.totalQuestions) * 100).toFixed(1)}%)`);
}

function generateRecommendations(part1Result, part7Result) {
    console.log('\n' + '='.repeat(60));
    console.log('RECOMMENDATIONS');
    console.log('='.repeat(60));
    
    const recommendations = [];
    
    if (part1Result) {
        if (part1Result.chiSquare > 7.815) {
            recommendations.push('🔄 Part 1: Consider randomizing correct answer positions during question generation');
        }
        
        if (part1Result.invalidAnswers.length > 0) {
            recommendations.push(`❗ Part 1: Fix ${part1Result.invalidAnswers.length} questions with invalid correct answers`);
        }
    }
    
    if (part7Result) {
        if (part7Result.chiSquare > 7.815) {
            recommendations.push('🔄 Part 7: Consider randomizing correct answer positions during question generation');
        }
        
        if (part7Result.invalidAnswers.length > 0) {
            recommendations.push(`❗ Part 7: Fix ${part7Result.invalidAnswers.length} questions with invalid correct answers`);
        }
        
        // Check for imbalanced document types
        if (part7Result.typeStats) {
            Object.entries(part7Result.typeStats).forEach(([type, stats]) => {
                const typeCounts = Object.values(stats.distribution);
                const typeExpected = stats.totalQuestions / 4;
                const typeChiSquare = typeCounts.reduce((sum, count) => {
                    return sum + Math.pow(count - typeExpected, 2) / typeExpected;
                }, 0);
                
                if (typeChiSquare > 7.815) {
                    recommendations.push(`📄 Part 7 ${type}: Answer distribution is uneven (χ²=${typeChiSquare.toFixed(2)})`);
                }
            });
        }
    }
    
    // General recommendations
    if (part1Result && part7Result) {
        const maxDiff = Math.max(...['A', 'B', 'C', 'D'].map(answer => {
            const p1Pct = (part1Result.distribution[answer] / part1Result.totalQuestions) * 100;
            const p7Pct = (part7Result.distribution[answer] / part7Result.totalQuestions) * 100;
            return Math.abs(p1Pct - p7Pct);
        }));
        
        if (maxDiff > 10) {
            recommendations.push('🔀 Consider implementing consistent answer randomization across both parts');
        }
    }
    
    if (recommendations.length === 0) {
        console.log('✅ No major issues found. Answer distributions appear reasonably balanced.');
    } else {
        recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
    }
    
    console.log('\n💡 General Suggestions:');
    console.log('   • Add answer position randomization to question generation prompts');
    console.log('   • Implement periodic distribution checks during content creation');
    console.log('   • Consider target distribution ranges (e.g., 20-30% per answer)');
    console.log('   • Review generator prompts for implicit answer position bias');
}

// Main execution
console.log('🔍 TOEIC Answer Distribution Analysis');
console.log('📅 Analysis Date:', new Date().toLocaleDateString());
console.log();

const part1Result = analyzePart1Distribution();
const part7Result = analyzePart7Distribution();

compareDistributions(part1Result, part7Result);
generateRecommendations(part1Result, part7Result);

console.log('\n' + '='.repeat(60));
console.log('ANALYSIS COMPLETE');
console.log('='.repeat(60));