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

위의 진단 결과를 바탕으로, ${targetExam} 시험 합격을 위한 구체적이고 실행 가능한 할일 5-7개를 추천해주세요:

**📋 맞춤형 학습 할일 추천**

중요: 평가나 분석이 아닌, 바로 실행할 수 있는 구체적인 행동 계획을 제시하세요. 진단에서 발견된 문제점을 해결하는 실용적인 할일을 추천하세요.

1. 제목: 바로 실행 가능한 구체적인 할일 (예: "수학 문제풀이 세션을 45분으로 늘리기", "영어 단어 암기 시간을 오전으로 이동")
   설명: 이 할일을 어떻게 실행할지 구체적인 방법과 단계 설명 (평가 말고 실행 방법)
   우선순위: 높음/중간/낮음 (목표 달성에 미치는 영향도 기준)
   예상시간: 현실적이고 달성 가능한 시간
   카테고리: 암기/이해/문제풀이/복습/전략수정 중 하나
   개선효과: 이 할일을 완료했을 때 얻을 수 있는 구체적인 개선 효과

각 할일은 반드시:
- 즉시 실행 가능한 구체적 행동 (분석이나 평가 X)
- 사용자의 현재 패턴을 개선하는 실용적 방법
- ${targetExam} 시험에 직접적으로 도움이 되는 활동
- 남은 ${daysUntilExam}일 동안 실현 가능한 계획

"~을 분석하세요", "~을 평가하세요"가 아닌 "~을 하세요", "~을 실행하세요" 형태의 실행 가능한 할일만 추천하세요.`;
}

/**
 * System message for the AI assistant
 */
const STUDY_PLAN_SYSTEM_MESSAGE = "당신은 실행 중심의 학습 코치입니다. 사용자의 학습 데이터를 바탕으로 바로 실행할 수 있는 구체적인 할일을 추천합니다. 분석이나 평가가 아닌, 실제로 행동할 수 있는 명확한 지시사항을 제공하세요. '~을 검토하세요', '~을 고려하세요'가 아닌 '~을 하세요', '~을 실행하세요' 형태의 실용적이고 즉시 실행 가능한 행동 계획만 제시하세요.";

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
