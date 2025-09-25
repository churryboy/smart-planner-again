/**
 * Study Plan Generation Prompt
 * Generates comprehensive diagnosis and optimized study recommendations
 */

function generateStudyPlanPrompt(targetExam, examDate, daysUntilExam, taskAnalysis, diagnosis) {
  return `당신은 전문적인 학습 계획 컨설턴트입니다. 다음 정보를 바탕으로 진단과 맞춤형 학습 계획을 생성해주세요:

목표 시험: ${targetExam}
시험 날짜: ${examDate}
남은 기간: ${daysUntilExam}일

=== �� 학습 현황 진단 ===
${diagnosis.studyTimeBalance}

${diagnosis.habitOptimization}

${diagnosis.goalAchievability}

=== 📈 상세 데이터 분석 ===
${taskAnalysis.summary}

=== 주요 학습 활동 (시간순) ===
${taskAnalysis.topTasks.map(task => 
  `• ${task.name}: ${task.formattedTime} (${task.sessions}회 세션, 주요 태그: ${task.tags.join(', ') || '없음'})`
).join('\n')}

=== 학습 카테고리별 시간 분배 ===
${taskAnalysis.categoryBreakdown.map(cat => 
  `• ${cat.category}: ${cat.formattedTime} (${cat.percentage}%)`
).join('\n')}

=== 시간대별 학습 패턴 ===
${taskAnalysis.timePatterns}

위의 진단과 분석을 바탕으로, ${targetExam} 시험 합격을 위해 최적화된 다음 형식으로 5-7개의 구체적인 학습 할일을 추천해주세요:

**📋 목표 달성을 위한 최적화된 학습 계획**

1. 제목: 진단 결과를 반영한 구체적이고 실행 가능한 할일
   설명: 현재 문제점을 해결하고 목표 달성 확률을 높이는 방법 상세 설명
   우선순위: 높음/중간/낮음 (목표 달성에 미치는 영향도 기준)
   예상시간: 현실적이고 달성 가능한 시간
   카테고리: 암기/이해/문제풀이/복습/전략수정 중 하나
   개선효과: 이 할일이 어떤 문제를 해결하고 성공 확률을 얼마나 높일지

특히 진단에서 발견된 주요 문제점들을 해결하고 ${targetExam} 시험의 특성에 맞게 최적화된 계획을 제시해주세요.`;
}

/**
 * System message for the AI assistant
 */
const STUDY_PLAN_SYSTEM_MESSAGE = "당신은 학습 계획 전문가입니다. 사용자의 목표 시험과 남은 기간을 고려하여 실용적이고 구체적인 학습 계획을 제공합니다. 진단 결과를 바탕으로 문제점을 해결하고 목표 달성 확률을 높이는 최적화된 추천을 제공하세요.";

/**
 * OpenAI API configuration for study plan generation
 */
const STUDY_PLAN_CONFIG = {
  model: "gpt-4o-mini",
  max_tokens: 2500,
  temperature: 0.7,
  presence_penalty: 0.1,
  frequency_penalty: 0.1
};

module.exports = {
  generateStudyPlanPrompt,
  STUDY_PLAN_SYSTEM_MESSAGE,
  STUDY_PLAN_CONFIG
};
