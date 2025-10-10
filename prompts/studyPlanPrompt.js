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

Analyzer-view에 있는 학생의 Monthly calendar, Study hours, Task-item 등을 종합적으로 고려해서, ${targetExam} 시험, 시험날짜 ${examDate}, 남은 기간 ${daysUntilExam}일 내에 목표달성이 가능한지 진단하고, 보완이 필요한 부분을 제시해주세요.

**📋 종합 진단 및 보완 사항**

다음 형식으로 분석 결과를 제공하세요:

1. 제목: 보완이 필요한 핵심 영역 (예: "학습 시간 부족", "학습 분배 불균형", "시간대 활용 미흡")
   설명: 현재 상태를 구체적으로 분석하고, 목표 달성을 위해 어떤 부분을 어떻게 개선해야 하는지 제시
   우선순위: 높음/중간/낮음 (목표 달성에 미치는 영향도 기준)
   예상시간: 이 영역을 보완하는데 필요한 시간
   카테고리: 시간관리/학습량/학습분배/학습시간대/학습습관 중 하나
   개선효과: 이 부분을 보완했을 때 기대되는 효과

중요: 제목에는 "제목:", "**제목:", "**제목**" 등의 접두어를 붙이지 마세요. 바로 내용만 작성하세요.

각 진단 항목은 반드시:
- Monthly calendar의 학습 패턴 분석
- Study hours(전체 시간, 순공 시간)의 적정성 평가
- Task-item별 시간 분배의 효율성 검토
- ${targetExam} 시험 특성을 고려한 현실적 달성 가능성 판단
- 남은 ${daysUntilExam}일 동안 보완 가능한 구체적 방안

목표 달성 가능 여부를 명확히 제시하고, 실현 가능한 보완 방안을 우선순위별로 정리하세요.`;
}

/**
 * System message for the AI assistant
 */
const STUDY_PLAN_SYSTEM_MESSAGE = "당신은 학습 데이터 분석 전문가입니다. 학생의 Monthly calendar, Study hours(전체 시간, 순공 시간), Task-item별 기록을 종합적으로 분석하여 목표 시험 합격 가능성을 진단합니다. 현재 학습 패턴의 강점과 약점을 명확히 파악하고, 목표 달성에 필요한 보완 사항을 우선순위별로 제시하세요. 추상적인 조언이 아닌, 데이터에 기반한 구체적이고 현실적인 진단과 개선 방향을 제공하세요. 제목에는 '제목:', '**제목:**' 등의 접두어를 절대 사용하지 말고 바로 내용만 작성하세요.";

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
