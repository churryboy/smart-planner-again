/**
 * Diagnosis Analysis Utilities
 * Contains all diagnosis logic separated from prompts
 */

const { 
  BALANCE_ASSESSMENTS, 
  HABIT_ANALYSIS, 
  ACHIEVABILITY_ASSESSMENTS, 
  EXAM_REQUIREMENTS 
} = require('../prompts/diagnosisPrompts');

/**
 * Generate comprehensive diagnosis based on task analysis
 */
function generateDiagnosis(taskAnalysis, targetExam, daysUntilExam) {
  const { totalTasks, totalStudyTime, topTasks, categoryBreakdown, totalTime } = taskAnalysis;
  
  // Calculate study time ratio
  const studyTime = categoryBreakdown.find(cat => cat.category === '공부')?.time || 0;
  const studyTimeRatio = totalTime > 0 ? (studyTime / totalTime) * 100 : 0;
  
  // Generate assessments
  const balanceAssessment = generateBalanceAssessment(studyTimeRatio);
  const habitAnalysis = generateHabitAnalysis(topTasks, totalTasks, totalTime);
  const achievabilityAnalysis = generateAchievabilityAnalysis(
    studyTime, daysUntilExam, targetExam
  );
  
  return {
    studyTimeBalance: balanceAssessment,
    habitOptimization: habitAnalysis,
    goalAchievability: achievabilityAnalysis,
    metrics: {
      studyTimeRatio,
      dailyStudyHours: studyTime / Math.max(1, daysUntilExam) / (1000 * 60 * 60),
      totalStudyTime: studyTime,
      totalTasks
    }
  };
}

/**
 * Generate study-life balance assessment
 */
function generateBalanceAssessment(studyTimeRatio) {
  if (studyTimeRatio >= 70) {
    return BALANCE_ASSESSMENTS.VERY_HIGH(studyTimeRatio);
  } else if (studyTimeRatio >= 40) {
    return BALANCE_ASSESSMENTS.OPTIMAL(studyTimeRatio);
  } else if (studyTimeRatio >= 20) {
    return BALANCE_ASSESSMENTS.LOW(studyTimeRatio);
  } else {
    return BALANCE_ASSESSMENTS.VERY_LOW(studyTimeRatio);
  }
}

/**
 * Generate study habit optimization analysis
 */
function generateHabitAnalysis(topTasks, totalTasks, totalTime) {
  let analysis = "📊 학습 습관 최적화 분석:\n";
  
  if (topTasks.length === 0) {
    return analysis + HABIT_ANALYSIS.NO_DATA;
  }
  
  // Analyze task diversity
  const taskCount = topTasks.length;
  if (taskCount >= 5) {
    analysis += HABIT_ANALYSIS.DIVERSITY.EXCELLENT(taskCount) + "\n";
  } else if (taskCount >= 3) {
    analysis += HABIT_ANALYSIS.DIVERSITY.GOOD(taskCount) + "\n";
  } else {
    analysis += HABIT_ANALYSIS.DIVERSITY.POOR(taskCount) + "\n";
  }
  
  // Analyze session consistency
  const avgSessionTime = totalTasks > 0 ? totalTime / totalTasks : 0;
  const avgSessionMinutes = Math.floor(avgSessionTime / (1000 * 60));
  
  if (avgSessionMinutes >= 45) {
    analysis += HABIT_ANALYSIS.FOCUS.EXCELLENT(avgSessionMinutes) + "\n";
  } else if (avgSessionMinutes >= 25) {
    analysis += HABIT_ANALYSIS.FOCUS.GOOD(avgSessionMinutes) + "\n";
  } else {
    analysis += HABIT_ANALYSIS.FOCUS.POOR(avgSessionMinutes) + "\n";
  }
  
  // Add top task info
  const topTask = topTasks[0];
  if (topTask) {
    const taskEfficiency = topTask.totalTime / topTask.sessions;
    const taskMinutes = Math.floor(taskEfficiency / (1000 * 60));
    analysis += `📈 주력 활동: ${topTask.name} (세션당 평균 ${taskMinutes}분)\n`;
  }
  
  return analysis;
}

/**
 * Generate goal achievability analysis
 */
function generateAchievabilityAnalysis(studyTime, daysUntilExam, targetExam) {
  const dailyStudyTime = studyTime / Math.max(1, daysUntilExam);
  const dailyStudyHours = dailyStudyTime / (1000 * 60 * 60);
  
  // Get required daily hours based on exam type
  const requiredDailyHours = getRequiredDailyHours(targetExam, daysUntilExam);
  const successProbability = Math.min(100, (dailyStudyHours / requiredDailyHours) * 100);
  const gap = requiredDailyHours - dailyStudyHours;
  
  if (successProbability >= 80) {
    return ACHIEVABILITY_ASSESSMENTS.HIGH(
      successProbability, dailyStudyHours, requiredDailyHours, targetExam
    );
  } else if (successProbability >= 60) {
    return ACHIEVABILITY_ASSESSMENTS.MEDIUM(
      successProbability, dailyStudyHours, requiredDailyHours, gap
    );
  } else if (successProbability >= 30) {
    return ACHIEVABILITY_ASSESSMENTS.LOW(
      successProbability, dailyStudyHours, requiredDailyHours, gap
    );
  } else {
    return ACHIEVABILITY_ASSESSMENTS.VERY_LOW(
      successProbability, dailyStudyHours, requiredDailyHours
    );
  }
}

/**
 * Get required daily study hours based on exam type and timeline
 */
function getRequiredDailyHours(targetExam, daysUntilExam) {
  const examType = targetExam.toLowerCase();
  
  // Check for specific exam types
  for (const [key, requirements] of Object.entries(EXAM_REQUIREMENTS)) {
    if (examType.includes(key) && key !== 'default') {
      return daysUntilExam > requirements.threshold 
        ? requirements.long 
        : requirements.short;
    }
  }
  
  // Default requirements
  const defaultReq = EXAM_REQUIREMENTS.default;
  return daysUntilExam > defaultReq.threshold ? defaultReq.long : defaultReq.short;
}

module.exports = {
  generateDiagnosis,
  generateBalanceAssessment,
  generateHabitAnalysis,
  generateAchievabilityAnalysis,
  getRequiredDailyHours
};
