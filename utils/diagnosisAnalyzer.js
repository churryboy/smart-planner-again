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
 * Determine urgency level based on days until exam
 */
function getUrgencyLevel(daysUntilExam) {
  if (daysUntilExam <= 7) return 'CRITICAL';
  if (daysUntilExam <= 14) return 'HIGH';
  if (daysUntilExam <= 30) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generate urgency message based on days remaining
 */
function generateUrgencyMessage(daysUntilExam, targetExam) {
  const urgency = getUrgencyLevel(daysUntilExam);
  
  const messages = {
    CRITICAL: `⚠️ **긴급 상황**: ${targetExam}까지 ${daysUntilExam}일 남음\n- 시험이 임박했습니다. 즉시 집중적인 학습이 필요합니다.\n- 핵심 개념 위주로 효율적인 학습 전략이 필수입니다.`,
    HIGH: `🔥 **시급**: ${targetExam}까지 ${daysUntilExam}일 남음\n- 2주 이내 시험입니다. 계획적이고 집중적인 학습이 필요합니다.\n- 약점 보완과 실전 연습에 집중해야 합니다.`,
    MEDIUM: `📅 **보통**: ${targetExam}까지 ${daysUntilExam}일 남음\n- 한 달 이내 시험입니다. 체계적인 학습 계획이 중요합니다.\n- 기본 개념 정리와 문제 풀이를 병행하세요.`,
    LOW: `✅ **여유**: ${targetExam}까지 ${daysUntilExam}일 남음\n- 충분한 준비 기간이 있습니다. 기초부터 탄탄히 다지세요.\n- 개념 이해와 심화 학습을 병행할 수 있습니다.`
  };
  
  return messages[urgency];
}

/**
 * Generate comprehensive diagnosis based on task analysis
 */
function generateDiagnosis(taskAnalysis, targetExam, daysUntilExam) {
  const { totalTasks, topTasks, categoryBreakdown, totalTime, studyTimeMs } = taskAnalysis;
  
  // Use studyTimeMs from taskAnalysis, or calculate from categoryBreakdown as fallback
  const studyTime = studyTimeMs || categoryBreakdown.find(cat => cat.category === '공부')?.time || 0;
  const studyTimeRatio = totalTime > 0 ? (studyTime / totalTime) * 100 : 0;
  
  console.log('🔍 Diagnosis calculation:', {
    studyTime,
    studyTimeHours: studyTime / (1000 * 60 * 60),
    totalTime,
    totalTimeHours: totalTime / (1000 * 60 * 60),
    studyTimeRatio,
    daysUntilExam,
    urgencyLevel: getUrgencyLevel(daysUntilExam),
    totalTasks,
    topTasksCount: topTasks.length
  });
  
  // Generate urgency message
  const urgencyMessage = generateUrgencyMessage(daysUntilExam, targetExam);
  
  // Generate assessments
  const balanceAssessment = generateBalanceAssessment(studyTimeRatio);
  const habitAnalysis = generateHabitAnalysis(topTasks, totalTasks, totalTime);
  
  return {
    urgency: urgencyMessage,
    urgencyLevel: getUrgencyLevel(daysUntilExam),
    studyTimeBalance: balanceAssessment,
    habitOptimization: habitAnalysis,
    metrics: {
      studyTimeRatio,
      dailyStudyHours: studyTime / Math.max(1, daysUntilExam) / (1000 * 60 * 60),
      totalStudyTime: studyTime,
      totalTasks,
      daysUntilExam
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
